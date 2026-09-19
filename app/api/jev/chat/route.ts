import { NextResponse } from "next/server";
import { getJevClient, isJevConfigured, JEV_MODEL, choice, noul, timed } from "@/lib/jev-client";
import { getScenario } from "@/lib/scenarios";
import { compassLabel } from "@/lib/geo";
import type { WildfireIncident } from "@/lib/types/incident";
import type { JevChatResponse } from "@/lib/types/jev";

export const runtime = "nodejs";

const INTENTS = {
  route_safety: "Asking whether a specific road, highway, or evacuation route is open, safe, or passable right now.",
  shelter_location: "Asking where to evacuate to, where the shelter is, or how to reach a safe zone.",
  containment_status: "Asking about firefighting operations: air tankers, dozers, engines, containment percentage, what crews are protecting.",
  general_preparedness: "Asking how to prepare a home, defensible space, go-bags, pets, or what to do while waiting for orders.",
  fire_status: "Asking how big the fire is, where it is heading, wind conditions, or whether their area is threatened.",
  off_topic: "Unrelated to the wildfire emergency, or a greeting with no question.",
} as const;

type Intent = keyof typeof INTENTS;

function composeReply(intent: Intent, incident: WildfireIncident, routeId: string | null, danger: number): string {
  const impassable = incident.routes.filter((r) => r.statusBadge === "IMPASSABLE");
  const safe = incident.routes.filter((r) => r.statusBadge === "CLEAR");
  const hazardous = incident.routes.filter((r) => r.statusBadge === "HAZARDOUS");
  const pending = incident.routes.filter((r) => r.statusBadge === "PENDING");
  const safeName = safe[0]?.name ?? hazardous[0]?.name;
  const dangerPrefix = danger >= 0.6 ? "If you can see flames or are in smoke now, leave immediately or call 911. " : "";
  const w = incident.weather;

  switch (intent) {
    case "route_safety": {
      const asked = routeId ? incident.routes.find((r) => r.id === routeId) : undefined;
      if (asked) {
        if (asked.statusBadge === "IMPASSABLE")
          return `${dangerPrefix}DO NOT USE ${asked.name}. Jev rated it IMPASSABLE (hazard ${asked.hazardScore.toFixed(1)}/4, Level ${Math.round(asked.hazardScore) + 1}). ${asked.chokepointDesc ?? ""} ${safeName ? `Use ${safeName} instead, which is currently verified ${safe[0] ? "CLEAR" : "passable with escorts"}.` : "Await escort instructions."}`;
        if (asked.statusBadge === "HAZARDOUS")
          return `${dangerPrefix}${asked.name} is HAZARDOUS (Level ${Math.round(asked.hazardScore) + 1}): passable with headlights on, reduced speed, and law-enforcement escorts. ${safe[0] ? `${safe[0].name} is the preferred CLEAR route.` : ""}`;
        if (asked.statusBadge === "CLEAR")
          return `${asked.name} is verified CLEAR by Jev (hazard ${asked.hazardScore.toFixed(1)}/4). Proceed calmly toward ${incident.shelter.name}, headlights on, windows closed.`;
        return `${asked.name} has not been scored yet in this session. Run the Jev tactical evaluation on the console for a live rating, or dial *384*2026# for the latest status.`;
      }
      const parts: string[] = [];
      if (impassable.length) parts.push(`IMPASSABLE: ${impassable.map((r) => r.name).join("; ")}.`);
      if (hazardous.length) parts.push(`HAZARDOUS (escorts): ${hazardous.map((r) => r.name).join("; ")}.`);
      if (safe.length) parts.push(`CLEAR: ${safe.map((r) => r.name).join("; ")}.`);
      if (pending.length && !impassable.length && !safe.length) parts.push(`Corridors are awaiting live Jev scoring: ${pending.map((r) => r.name).join("; ")}.`);
      return `${dangerPrefix}${parts.join(" ")}${safeName ? ` Evacuate via ${safeName} to ${incident.shelter.name}.` : ""}`;
    }
    case "shelter_location":
      return `${dangerPrefix}Designated evacuation center: ${incident.shelter.name}, ${incident.shelter.address} (capacity ${incident.shelter.capacity.toLocaleString()}; ${incident.shelter.amenities.join(", ")}). ${safeName ? `Travel via ${safeName}.` : ""} Bring medications, ID, and water.`;
    case "containment_status": {
      const threatened = incident.assets.filter((a) => a.defensibility_status === "threatened").map((a) => a.name);
      return `${incident.name} is ${incident.containment_pct}% contained at ${incident.acres_burned.toLocaleString()} acres, spreading ${compassLabel(incident.spread_azimuth_deg)} at ${incident.spread_rate_mph} mph. Resources committed: ${incident.available_resources.slice(0, 3).join("; ")}. Priority protection: ${threatened.join("; ") || "no assets currently threatened"}.`;
    }
    case "fire_status":
      return `${dangerPrefix}${incident.name}: ${incident.acres_burned.toLocaleString()} acres, ${incident.containment_pct}% contained. Wind from ${compassLabel(w.wind_direction_degrees)} at ${w.wind_speed_mph} mph gusting ${w.gusts_mph} mph, pushing the head fire ${compassLabel(incident.spread_azimuth_deg)} at ${incident.spread_rate_mph} mph. Humidity ${w.relative_humidity_pct}%${w.red_flag_active ? " under a RED FLAG WARNING" : ""}. Anyone downwind (${compassLabel(incident.spread_azimuth_deg)} of the fire) should be ready to leave now.`;
    case "general_preparedness":
      return `${dangerPrefix}Ready-Set-Go: pack go-bags (water, meds, documents, N95 masks, phone chargers), close all windows and doors, leave exterior lights on so crews can see your house through smoke, back the car into the driveway facing out, and move pets into carriers. Monitor this console or dial *384*2026# on any phone for corridor status.`;
    default:
      return `I am PyroShield's tactical assistant for the ${incident.name}. Ask me whether a road is open, where the shelter is, what crews are protecting, or how to prepare your home.`;
  }
}

/**
 * POST /api/jev/chat
 * Body: { query: string, activeIncident?: WildfireIncident, incidentId?: string }
 * Jev: Choice (intent) + Choice (referenced_route) + Noul (immediate_danger) in one request.
 * The reply text is composed by code from live incident state, never generated.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = String(body?.query ?? "").trim().slice(0, 500);
    if (!query) return NextResponse.json({ error: "query is required" }, { status: 400 });
    const incident: WildfireIncident = body.activeIncident ?? getScenario(body.incidentId);

    const routeCriteria: Record<string, string> = Object.fromEntries(incident.routes.map((r) => [r.id, r.name]));
    routeCriteria.none = "No specific road or route is named or implied.";

    const state = {
      user_message: query,
      incident: incident.name,
      known_routes: incident.routes.map((r) => ({ id: r.id, name: r.name, status: r.statusBadge })),
      shelter: incident.shelter.name,
    };

    let intent: Intent = "general_preparedness";
    let confidence = 0.5;
    let referencedRoute: string | null = null;
    let danger = 0;
    let source: JevChatResponse["source"] = "fallback";
    let model = "heuristic";
    let latencyMs = 0;

    if (isJevConfigured()) {
      try {
        const { result, latencyMs: ms } = await timed(() =>
          getJevClient().systemOne({
            model: JEV_MODEL,
            state,
            questions: {
              intent: choice("Classify what the person asking `user_message` most needs to know during this wildfire emergency.", INTENTS),
              referenced_route: choice("Which of `known_routes` does `user_message` refer to, by name or clear nickname (e.g. 'Route 4', 'the pass', 'the highway')?", routeCriteria),
              immediate_danger: noul("Does `user_message` indicate the person is currently in immediate physical danger (sees flames, trapped, surrounded by smoke, cannot breathe)?", {
                true: "They describe present danger to themselves right now.",
                false: "They are asking for information or planning ahead.",
              }),
            },
          })
        );
        intent = result.answers.intent.choice as Intent;
        confidence = result.answers.intent.confidence;
        referencedRoute = result.answers.referenced_route.choice === "none" ? null : result.answers.referenced_route.choice;
        danger = result.answers.immediate_danger.noul;
        source = "jev";
        model = result.model;
        latencyMs = ms;
      } catch (err) {
        console.warn("[api/jev/chat] Jev unavailable, heuristic routing:", err);
        intent = /road|route|highway|open|pass|drive|safe to/i.test(query) ? "route_safety" : /shelter|where.*go|evacuat/i.test(query) ? "shelter_location" : /tanker|contain|crew|engine|dozer/i.test(query) ? "containment_status" : /wind|acres|big|heading|spread/i.test(query) ? "fire_status" : "general_preparedness";
      }
    }

    const reply = composeReply(intent, incident, referencedRoute, danger);
    const payload: JevChatResponse = { reply, intent, confidence, referencedRoute: referencedRoute ?? undefined, immediateDanger: danger, source, model, latencyMs };
    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[api/jev/chat]", error);
    return NextResponse.json(
      { reply: "If you are in immediate danger, call 911 now. Otherwise dial *384*2026# for corridor status.", intent: "emergency", confidence: 1, source: "fallback", model: "none", latencyMs: 0 },
      { status: 200 }
    );
  }
}
