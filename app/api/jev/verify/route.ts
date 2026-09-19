import { NextResponse } from "next/server";
import { getScenario } from "@/lib/scenarios";
import { verifyGroundReport } from "@/lib/server/jev-ops";
import type { WildfireIncident } from "@/lib/types/incident";

export const runtime = "nodejs";

/**
 * POST /api/jev/verify
 * Body: { incidentId?: string, incident?: WildfireIncident, report: { text, latitude, longitude, reporterName, timestamp, channel? } }
 * Jev primitive: Noul (verified) + Noul (road_hazard)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const report = body?.report;
    if (!report || typeof report.text !== "string" || report.text.trim().length < 3) {
      return NextResponse.json({ error: "report.text is required" }, { status: 400 });
    }
    const incident: WildfireIncident = body.incident ?? getScenario(body.incidentId);
    const lat = Number(report.latitude ?? incident.center_lat);
    const lng = Number(report.longitude ?? incident.center_lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: "report.latitude/longitude must be numeric" }, { status: 400 });
    }

    const result = await verifyGroundReport(incident, {
      text: report.text.slice(0, 600),
      latitude: lat,
      longitude: lng,
      reporterName: String(report.reporterName ?? "Anonymous").slice(0, 80),
      timestamp: String(report.timestamp ?? "just now"),
      channel: report.channel ?? "web",
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[api/jev/verify]", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
