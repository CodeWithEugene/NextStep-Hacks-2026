import { NextResponse } from "next/server";
import { getScenario } from "@/lib/scenarios";
import { arbitrateDispatch, POSTURE_LABELS, type CorridorScoreResult } from "@/lib/server/jev-ops";
import type { WildfireIncident } from "@/lib/types/incident";

export const runtime = "nodejs";

/**
 * POST /api/jev/dispatch
 * Body: { incidentId?: string, incident?: WildfireIncident, corridorResults?: CorridorScoreResult[] }
 * Jev primitive: Choice x3 (primary_action, priority_asset, evacuation_posture) in one request
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const incident: WildfireIncident = body.incident ?? getScenario(body.incidentId);
    const corridorResults: CorridorScoreResult[] = Array.isArray(body.corridorResults) ? body.corridorResults : [];
    const result = await arbitrateDispatch(incident, corridorResults);
    return NextResponse.json(
      { ...result, postureLabel: POSTURE_LABELS[result.posture] },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[api/jev/dispatch]", error);
    return NextResponse.json({ error: "Dispatch arbitration failed" }, { status: 500 });
  }
}
