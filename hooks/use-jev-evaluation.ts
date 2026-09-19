"use client";

import { useCallback, useRef, useState } from "react";
import type { CitizenGroundReport, EvacuationRoute, WildfireIncident } from "@/lib/types/incident";
import type { JevCorridorResponse, JevDecisionLog, JevDispatchResponse, JevVerifyResponse } from "@/lib/types/jev";

export interface DispatchResult extends JevDispatchResponse {
  posture: string;
  postureLabel: string;
  postureConfidence: number;
}

export type EvaluationPhase = "idle" | "verify" | "corridor" | "dispatch" | "done";

interface UseJevEvaluationArgs {
  incident: WildfireIncident;
  routes: EvacuationRoute[];
  setRoutes: React.Dispatch<React.SetStateAction<EvacuationRoute[]>>;
  reports: CitizenGroundReport[];
  setReports: React.Dispatch<React.SetStateAction<CitizenGroundReport[]>>;
}

const stamp = () => new Date().toLocaleTimeString([], { hour12: false });
const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json() as Promise<T>;
}

/**
 * Orchestrates the three-stage Jev System One pipeline:
 *   1. Noul   — verify every ground report against satellite + wind state
 *   2. Score  — rate every evacuation corridor (one request, one question per corridor)
 *   3. Choice — arbitrate tactical action, priority asset and protective posture
 * Each stage streams typed results into the decision log as it lands.
 */
export function useJevEvaluation({ incident, routes, setRoutes, reports, setReports }: UseJevEvaluationArgs) {
  const [logs, setLogs] = useState<JevDecisionLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<EvaluationPhase>("idle");
  const [dispatch, setDispatch] = useState<DispatchResult | null>(null);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);
  const runId = useRef(0);

  const pushLog = useCallback((log: Omit<JevDecisionLog, "id" | "timestamp">) => {
    setLogs((prev) => [{ id: uid("log"), timestamp: stamp(), ...log }, ...prev].slice(0, 40));
  }, []);

  const reset = useCallback(() => {
    runId.current += 1;
    setLogs([]);
    setDispatch(null);
    setPhase("idle");
    setIsRunning(false);
  }, []);

  /** Verify a single (new) report and merge the result into state. */
  const verifyReport = useCallback(
    async (report: CitizenGroundReport, liveRoutes: EvacuationRoute[]) => {
      const payload = { incident: { ...incident, routes: liveRoutes }, report };
      const res = await postJson<JevVerifyResponse & { roadHazard: number }>("/api/jev/verify", payload);
      setReports((prev) => prev.map((r) => (r.id === report.id ? { ...r, pending: false, verifiedByJev: res.verified, jevNoulScore: res.noul } : r)));
      pushLog({
        primitive: "Noul",
        title: `Verify report · ${report.reporterName}`,
        result: `${res.verified ? "VERIFIED" : "UNVERIFIED"} · p=${res.noul.toFixed(2)}`,
        confidence: res.noul,
        details: `${res.interpretation} Road hazard likelihood ${Math.round(res.roadHazard * 100)}%. “${report.text.slice(0, 90)}${report.text.length > 90 ? "…" : ""}”`,
        latencyMs: res.latencyMs,
        source: res.source,
      });
      return res;
    },
    [incident, pushLog, setReports]
  );

  const run = useCallback(async () => {
    const id = ++runId.current;
    const alive = () => id === runId.current;
    setIsRunning(true);
    setDispatch(null);
    setLogs([]);
    try {
      // ---- 1. Noul: verify all reports in parallel -------------------------
      setPhase("verify");
      setReports((prev) => prev.map((r) => ({ ...r, pending: true })));
      const verifyResults = await Promise.allSettled(reports.map((r) => verifyReport({ ...r, pending: true }, routes)));
      if (!alive()) return;
      const verifiedReports: CitizenGroundReport[] = reports.map((r, i) => {
        const v = verifyResults[i];
        return v.status === "fulfilled" ? { ...r, pending: false, verifiedByJev: v.value.verified, jevNoulScore: v.value.noul } : { ...r, pending: false };
      });

      // ---- 2. Score: all corridors in one request ---------------------------
      setPhase("corridor");
      const { results } = await postJson<{ results: (JevCorridorResponse & { routeId: string })[] }>("/api/jev/corridor", {
        incident: { ...incident, routes, reports: verifiedReports },
      });
      if (!alive()) return;
      const evaluatedAt = new Date().toISOString();
      const nextRoutes = routes.map((r) => {
        const res = results.find((x) => x.routeId === r.id);
        if (!res) return r;
        return {
          ...r,
          isImpassable: res.isImpassable,
          hazardScore: res.score,
          confidence: res.confidence,
          probabilities: res.probabilities,
          statusBadge: res.statusBadge,
          evaluated: true,
          evaluatedAt,
          latencyMs: res.latencyMs,
          source: res.source,
        } satisfies EvacuationRoute;
      });
      setRoutes(nextRoutes);
      for (const res of [...results].sort((a, b) => b.score - a.score)) {
        const route = routes.find((r) => r.id === res.routeId);
        pushLog({
          primitive: "Score",
          title: `Corridor hazard · ${route?.name ?? res.routeId}`,
          result: `${res.statusBadge} · Level ${res.level} (${res.score.toFixed(2)}/4)`,
          confidence: res.confidence,
          details: `${res.interpretation} Distribution: ${Object.entries(res.probabilities)
            .map(([k, p]) => `L${Number(k) + 1} ${Math.round(p * 100)}%`)
            .join(" · ")}.`,
          latencyMs: res.latencyMs,
          source: res.source,
        });
      }

      // ---- 3. Choice: tactical arbitration ----------------------------------
      setPhase("dispatch");
      const d = await postJson<DispatchResult>("/api/jev/dispatch", {
        incident: { ...incident, routes: nextRoutes, reports: verifiedReports },
        corridorResults: results,
      });
      if (!alive()) return;
      setDispatch(d);
      pushLog({
        primitive: "Choice",
        title: "Protective action posture",
        result: d.postureLabel,
        confidence: d.postureConfidence,
        details: `Broadcast posture for the downwind community given corridor status and asset exposure.`,
        latencyMs: d.latencyMs,
        source: d.source,
      });
      pushLog({
        primitive: "Choice",
        title: `Tactical dispatch · ${d.targetAsset}`,
        result: d.actionTitle,
        confidence: d.confidence,
        details: `${d.rationale} Priority-asset confidence ${Math.round(d.targetAssetConfidence * 100)}%.`,
        latencyMs: d.latencyMs,
        source: d.source,
      });
      setPhase("done");
      setLastRunAt(stamp());
    } catch (err) {
      console.error("[useJevEvaluation]", err);
      pushLog({
        primitive: "Noul",
        title: "Evaluation interrupted",
        result: "ERROR",
        confidence: 0,
        details: err instanceof Error ? err.message : "Unknown error contacting the Jev route handlers.",
        source: "fallback",
      });
      setPhase("idle");
    } finally {
      if (alive()) setIsRunning(false);
    }
  }, [incident, routes, reports, setRoutes, setReports, pushLog, verifyReport]);

  /** Submit a brand-new citizen report: append, verify with Jev, log. */
  const submitReport = useCallback(
    async (input: { text: string; reporterName: string; latitude: number; longitude: number }) => {
      const report: CitizenGroundReport = {
        id: uid("rep"),
        timestamp: "just now",
        latitude: input.latitude,
        longitude: input.longitude,
        text: input.text,
        reporterName: input.reporterName,
        channel: "web",
        pending: true,
      };
      setReports((prev) => [report, ...prev]);
      try {
        await verifyReport(report, routes);
      } catch (err) {
        console.error("[submitReport]", err);
        setReports((prev) => prev.map((r) => (r.id === report.id ? { ...r, pending: false } : r)));
      }
    },
    [routes, setReports, verifyReport]
  );

  return { logs, isRunning, phase, dispatch, lastRunAt, run, reset, submitReport };
}
