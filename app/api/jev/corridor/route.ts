import { NextResponse } from "next/server";
import { getScenario } from "@/lib/scenarios";
import { scoreCorridors } from "@/lib/server/jev-ops";
import type { EvacuationRoute, WildfireIncident } from "@/lib/types/incident";

export const runtime = "nodejs";

/**
 * POST /api/jev/corridor
 * Body: { incidentId?: string, incident?: WildfireIncident, routeIds?: string[] }
 * Jev primitive: Score (one 5-level rubric question per corridor, single request)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const incident: WildfireIncident = body.incident ?? getScenario(body.incidentId);
    const routeIds: string[] | undefined = Array.isArray(body.routeIds) ? body.routeIds : undefined;
    const routes: EvacuationRoute[] = routeIds
      ? incident.routes.filter((r) => routeIds.includes(r.id))
      : incident.routes;
    if (routes.length === 0) {
      return NextResponse.json({ error: "No corridors to evaluate" }, { status: 400 });
    }
    const verified = (incident.reports ?? []).filter((r) => r.verifiedByJev);
    const results = await scoreCorridors(incident, routes, verified);
    return NextResponse.json({ results }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[api/jev/corridor]", error);
    return NextResponse.json({ error: "Corridor scoring failed" }, { status: 500 });
  }
}
