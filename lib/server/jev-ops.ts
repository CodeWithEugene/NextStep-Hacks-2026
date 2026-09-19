/**
 * Server-only TypeSafe Jev operations for PyroShield.
 * Every function builds structured state from the incident model, asks Jev
 * narrow System One questions (Noul / Score / Choice), and returns typed
 * results that code can act on. Fallbacks are deterministic heuristics so the
 * console keeps working if the network drops; results are labeled by source.
 */
import { getJevClient, isJevConfigured, JEV_MODEL, choice, noul, score, timed } from "@/lib/jev-client";
import {
  bearingDeg,
  centroid,
  classifyWindAlignment,
  compassLabel,
  haversineMiles,
  minDistanceMiles,
  type LatLng,
} from "@/lib/geo";
import type { CitizenGroundReport, EvacuationRoute, WildfireIncident } from "@/lib/types/incident";
import type { JevCorridorResponse, JevDispatchResponse, JevVerifyResponse } from "@/lib/types/jev";

const CORRIDOR_RUBRIC = [
  "Level 1: Route clear and safe; no fire or smoke impediment; normal traffic flow.",
  "Level 2: Light smoke advisory; route passable at normal speeds with headlights on.",
  "Level 3: Moderate hazard; reduced visibility, embers near roadway, law-enforcement escorts recommended.",
  "Level 4: Severe hazard; active spot fires approaching the roadway, closure imminent, last-chance transit only.",
  "Level 5: Impassable; fire engulfment, burning canopy over pavement, or dense smoke choke-point cutting off transit.",
] as const;

export const TACTICAL_ACTIONS = {
  air_tanker_retardant_drop: {
    title: "Heavy Air Tanker Retardant Drop",
    description:
      "Dispatch a Type 1 heavy air tanker to lay a retardant line on the ridge between the leading fire edge and the highest-value fixed infrastructure.",
    rationale: "Aerial retardant is the only asset that can check a wind-driven head fire on steep terrain before it reaches fixed infrastructure.",
  },
  dozer_defensive_firebreak: {
    title: "Dozer Defensive Firebreak Cut",
    description:
      "Order the dozer strike team to cut a fuel break along the threatened roadway shoulder or ridge to stop lateral flanking.",
    rationale: "A mechanical fuel break holds a flank when rates of spread are moderate and terrain is dozer-accessible.",
  },
  structure_protection_strike_team: {
    title: "Structure Protection Strike Team Staging",
    description:
      "Stage structural engine strike teams at the threatened occupied facility to defend the building envelope and clear ignition sources.",
    rationale: "Occupied facilities with limited egress need engines on site before ember cast arrives.",
  },
  escorted_evacuation_convoy: {
    title: "Escorted Evacuation Convoy",
    description:
      "Commit law-enforcement escorts and paratransit to move occupants of the threatened facility out via the verified safe corridor now.",
    rationale: "When a corridor is still open but degrading, moving people beats defending buildings.",
  },
  shelter_in_place_seal: {
    title: "Shelter-in-Place Seal Protocol",
    description:
      "Direct the facility to seal HVAC, run filtration, and shelter occupants because the egress corridor is compromised.",
    rationale: "If the only egress is impassable, a hardened structure is safer than the road.",
  },
} as const;

export type TacticalActionKey = keyof typeof TACTICAL_ACTIONS;

const EVAC_POSTURES = {
  immediate_mandatory_evacuation: "Issue an immediate mandatory evacuation order for the downwind community via the verified safe corridor.",
  phased_evacuation_warning: "Issue an evacuation warning; begin phased movement of vulnerable populations while corridors remain open.",
  shelter_in_place: "Order shelter-in-place because egress is more dangerous than remaining in hardened structures.",
} as const;

export type EvacPostureKey = keyof typeof EVAC_POSTURES;

function nearestHotspot(incident: WildfireIncident, point: LatLng) {
  let best = incident.hotspots[0];
  let bestD = Number.POSITIVE_INFINITY;
  for (const hs of incident.hotspots) {
    const d = haversineMiles(point, [hs.latitude, hs.longitude]);
    if (d < bestD) {
      bestD = d;
      best = hs;
    }
  }
  return { hotspot: best, distanceMiles: Number.isFinite(bestD) ? bestD : 99 };
}

// --------------------------------------------------------------------------
// 1. Noul — ground-truth verification of a citizen / field report
// --------------------------------------------------------------------------
export async function verifyGroundReport(
  incident: WildfireIncident,
  report: Pick<CitizenGroundReport, "text" | "latitude" | "longitude" | "reporterName" | "timestamp" | "channel">,
  options: { timeoutMs?: number } = {}
): Promise<JevVerifyResponse & { roadHazard: number }> {
  const point: LatLng = [report.latitude, report.longitude];
  const fireC = centroid(incident.perimeter_polygon);
  const { hotspot, distanceMiles } = nearestHotspot(incident, point);
  const bearingFromFire = bearingDeg(fireC, point);
  const alignment = classifyWindAlignment(incident.perimeter_polygon, [point], incident.spread_azimuth_deg);

  const state = {
    report: {
      text: report.text,
      reporter: report.reporterName,
      channel: report.channel ?? "web",
      age: report.timestamp,
      distance_to_nearest_satellite_hotspot_miles: Number(distanceMiles.toFixed(2)),
      distance_to_fire_perimeter_miles: Number(minDistanceMiles([point], incident.perimeter_polygon).toFixed(2)),
      bearing_from_fire_centroid: `${Math.round(bearingFromFire)} deg (${compassLabel(bearingFromFire)})`,
      position_relative_to_fire_spread: alignment,
    },
    satellite: {
      nearest_hotspot_frp_mw: hotspot?.frp_mw ?? 0,
      nearest_hotspot_detection_confidence_pct: hotspot?.confidence ?? 0,
      active_hotspot_count: incident.hotspots.length,
      sensor: hotspot?.satellite ?? "none",
    },
    fire_behavior: {
      spread_azimuth_deg: incident.spread_azimuth_deg,
      spread_direction: compassLabel(incident.spread_azimuth_deg),
      rate_of_spread_mph: incident.spread_rate_mph,
      wind_speed_mph: incident.weather.wind_speed_mph,
      wind_gusts_mph: incident.weather.gusts_mph,
      wind_from: compassLabel(incident.weather.wind_direction_degrees),
      relative_humidity_pct: incident.weather.relative_humidity_pct,
    },
  };

  const heuristic = () => {
    const near = distanceMiles < 1.2;
    const downwind = alignment === "direct_downwind" || alignment === "downwind_quartering";
    const p = Math.min(0.95, 0.35 + (near ? 0.3 : 0) + (downwind ? 0.25 : 0));
    return {
      verified: p >= 0.6,
      confidence: p,
      noul: p,
      roadHazard: /road|highway|route|barrier|lane|traffic|cars|mile/i.test(report.text) ? 0.8 : 0.3,
      interpretation: "Offline heuristic: proximity to satellite hotspot and downwind alignment.",
      source: "fallback" as const,
      model: "heuristic",
      latencyMs: 0,
    };
  };

  if (!isJevConfigured()) return heuristic();

  try {
    const { result, latencyMs } = await timed(() =>
      getJevClient().systemOne(
        {
          model: JEV_MODEL,
          state,
          questions: {
            verified: noul(
              "Is this ground report of active fire, spot fires, or fire-driven smoke credible and physically consistent with the satellite thermal footprint, fire spread direction, and wind? Consider `report.distance_to_nearest_satellite_hotspot_miles`, `report.position_relative_to_fire_spread`, and whether the described phenomenon matches `fire_behavior`.",
              {
                true: "The report describes fire or smoke that plausibly originates from the active fire given its location relative to hotspots and the downwind spread direction.",
                false: "The report is inconsistent with the satellite footprint or wind (e.g. far upwind with no hotspot nearby), describes something other than wildfire, or is likely a hoax or misidentification.",
              }
            ),
            road_hazard: noul(
              "Does `report.text` describe a hazard that blocks or endangers vehicle travel on a roadway (fire crossing the road, burning canopy over pavement, zero-visibility smoke on the road, vehicles turning back)?",
              { true: "A roadway is impeded or unsafe for traffic.", false: "No roadway impact is described." }
            ),
          },
        },
        { timeout: options.timeoutMs }
      )
    );
    const p = result.answers.verified.noul;
    return {
      verified: p >= 0.6,
      confidence: p,
      noul: p,
      roadHazard: result.answers.road_hazard.noul,
      interpretation:
        p >= 0.8
          ? "High-probability verified fire activity consistent with downwind satellite thermal cluster."
          : p >= 0.6
            ? "Probable fire activity; consistent with satellite azimuth. Monitor and task nearest unit to confirm."
            : "Low correlation with satellite footprint and wind vector. Treat as unverified; do not re-task assets.",
      source: "jev",
      model: result.model,
      latencyMs,
    };
  } catch (err) {
    console.error("[jev.verify] falling back:", err);
    return heuristic();
  }
}

// --------------------------------------------------------------------------
// 2. Score — evacuation corridor hazard for all corridors in ONE request
// --------------------------------------------------------------------------
export interface CorridorScoreResult extends JevCorridorResponse {
  routeId: string;
}

function corridorState(incident: WildfireIncident, route: EvacuationRoute, verifiedReports: CitizenGroundReport[]) {
  const distance = minDistanceMiles(route.points, incident.perimeter_polygon);
  const alignment = classifyWindAlignment(incident.perimeter_polygon, route.points, incident.spread_azimuth_deg);
  const downwind = alignment === "direct_downwind" || alignment === "downwind_quartering";
  const etaMin = downwind && incident.spread_rate_mph > 0 ? Math.round((distance / incident.spread_rate_mph) * 60) : null;
  const nearbyReports = verifiedReports
    .filter((r) => minDistanceMiles([[r.latitude, r.longitude]], route.points) < 0.6)
    .map((r) => `${r.reporterName}: ${r.text}`);
  return {
    name: route.name,
    distance_to_active_perimeter_miles: Number(distance.toFixed(2)),
    position_relative_to_fire_spread: alignment,
    projected_minutes_until_fire_reaches_corridor: etaMin,
    terrain: route.canyon_topography ?? "unknown",
    known_chokepoint: route.chokepointDesc ?? null,
    verified_field_reports_within_0_6_miles: nearbyReports,
    derived: { distance, alignment, downwind, nearbyReportCount: nearbyReports.length },
  };
}

function classify(scoreVal: number) {
  const level = Math.min(5, Math.max(1, Math.round(scoreVal) + 1));
  const isImpassable = scoreVal >= 3.0; // Level 4+: closure imminent or impassable
  const statusBadge: JevCorridorResponse["statusBadge"] = isImpassable ? "IMPASSABLE" : scoreVal >= 1.5 ? "HAZARDOUS" : "CLEAR";
  const interpretation = isImpassable
    ? "CLOSE CORRIDOR: fire or smoke is cutting transit. Reroute traffic and pull escorts."
    : statusBadge === "HAZARDOUS"
      ? "Passable with escorts and reduced speed; re-evaluate every 10 minutes."
      : "Corridor verified clear of fire impact. Designate as primary evacuation route.";
  return { level, isImpassable, statusBadge, interpretation };
}

export async function scoreCorridors(
  incident: WildfireIncident,
  routes: EvacuationRoute[] = incident.routes,
  verifiedReports: CitizenGroundReport[] = incident.reports.filter((r) => r.verifiedByJev),
  options: { timeoutMs?: number } = {}
): Promise<CorridorScoreResult[]> {
  const derived = routes.map((r) => ({ route: r, ...corridorState(incident, r, verifiedReports) }));

  const heuristic = (): CorridorScoreResult[] =>
    derived.map((d) => {
      const { distance, downwind, nearbyReportCount } = d.derived;
      let s = 0.4;
      if (downwind) s += 1.4;
      if (distance < 1) s += 1.2;
      if (distance < 0.5) s += 0.6;
      s += Math.min(1, nearbyReportCount) * 0.6;
      if (incident.weather.gusts_mph > 35) s += 0.3;
      s = Math.min(4, s);
      const probs: Record<string, number> = {};
      for (let i = 0; i < 5; i++) probs[String(i)] = Math.max(0, 1 - Math.abs(i - s)) ;
      const total = Object.values(probs).reduce((a, b) => a + b, 0) || 1;
      for (const k of Object.keys(probs)) probs[k] = Number((probs[k] / total).toFixed(2));
      return {
        routeId: d.route.id,
        score: Number(s.toFixed(2)),
        confidence: 0.55,
        probabilities: probs,
        ...classify(s),
        source: "fallback",
        model: "heuristic",
        latencyMs: 0,
      };
    });

  if (!isJevConfigured()) return heuristic();

  const state = {
    fire: {
      incident: `${incident.name} (${incident.incident_number})`,
      acres: incident.acres_burned,
      containment_pct: incident.containment_pct,
      rate_of_spread_mph: incident.spread_rate_mph,
      spread_direction: `${incident.spread_azimuth_deg} deg (${compassLabel(incident.spread_azimuth_deg)})`,
      fuel_model: incident.fuel_model,
      terrain: incident.terrain_summary,
      peak_fire_radiative_power_mw: Math.max(0, ...incident.hotspots.map((h) => h.frp_mw)),
    },
    weather: {
      wind_speed_mph: incident.weather.wind_speed_mph,
      wind_gusts_mph: incident.weather.gusts_mph,
      wind_from: compassLabel(incident.weather.wind_direction_degrees),
      relative_humidity_pct: incident.weather.relative_humidity_pct,
      fuel_moisture_pct: incident.weather.fuel_moisture_pct,
      red_flag_warning: incident.weather.red_flag_active,
    },
    corridors: Object.fromEntries(
      derived.map((d) => [
        d.route.id,
        {
          name: d.name,
          distance_to_active_perimeter_miles: d.distance_to_active_perimeter_miles,
          position_relative_to_fire_spread: d.position_relative_to_fire_spread,
          projected_minutes_until_fire_reaches_corridor: d.projected_minutes_until_fire_reaches_corridor,
          terrain: d.terrain,
          known_chokepoint: d.known_chokepoint,
          verified_field_reports_within_0_6_miles: d.verified_field_reports_within_0_6_miles,
        },
      ])
    ),
  };

  const questions = Object.fromEntries(
    derived.map((d) => [
      `risk_${d.route.id}`,
      score(
        `Score the immediate physical hazard to civilians attempting to evacuate by vehicle along the corridor described at \`corridors.${d.route.id}\` given the fire behavior, weather, and field reports. Judge this corridor only.`,
        CORRIDOR_RUBRIC
      ),
    ])
  );

  try {
    const { result, latencyMs } = await timed(() =>
      getJevClient().systemOne({ model: JEV_MODEL, state, questions }, { timeout: options.timeoutMs })
    );
    return derived.map((d) => {
      const ans = result.answers[`risk_${d.route.id}`] as { score: number; confidence: number; probabilities: Record<string, number> };
      return {
        routeId: d.route.id,
        score: Number(ans.score.toFixed(2)),
        confidence: ans.confidence,
        probabilities: ans.probabilities,
        ...classify(ans.score),
        source: "jev",
        model: result.model,
        latencyMs,
      };
    });
  } catch (err) {
    console.error("[jev.corridor] falling back:", err);
    return heuristic();
  }
}

// --------------------------------------------------------------------------
// 3. Choice — tactical dispatch arbitration (action + priority asset + posture)
// --------------------------------------------------------------------------
export async function arbitrateDispatch(
  incident: WildfireIncident,
  corridorResults: CorridorScoreResult[] = [],
  options: { timeoutMs?: number } = {}
): Promise<JevDispatchResponse & { posture: EvacPostureKey; postureConfidence: number }> {
  const threatened = incident.assets.filter((a) => a.defensibility_status !== "secured");
  const assetCriteria = Object.fromEntries(
    threatened.map((a) => [
      a.id,
      `${a.name} — ${a.type.replace(/_/g, " ")}, ${a.distance_miles} mi from fire edge${a.occupancy ? `, ${a.occupancy} occupants` : ", unoccupied critical infrastructure"}, status ${a.defensibility_status}.`,
    ])
  );
  const corridorSummary = incident.routes.map((r) => {
    const res = corridorResults.find((c) => c.routeId === r.id);
    return { name: r.name, status: res?.statusBadge ?? r.statusBadge, hazard_score: res?.score ?? r.hazardScore };
  });

  const state = {
    incident: {
      name: `${incident.name} (${incident.incident_number})`,
      acres: incident.acres_burned,
      containment_pct: incident.containment_pct,
      rate_of_spread_mph: incident.spread_rate_mph,
      spread_direction: compassLabel(incident.spread_azimuth_deg),
      fuel_model: incident.fuel_model,
      terrain: incident.terrain_summary,
    },
    weather: {
      wind_gusts_mph: incident.weather.gusts_mph,
      relative_humidity_pct: incident.weather.relative_humidity_pct,
      red_flag_warning: incident.weather.red_flag_active,
    },
    threatened_assets: threatened.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      distance_miles: a.distance_miles,
      occupancy: a.occupancy ?? 0,
      status: a.defensibility_status,
    })),
    evacuation_corridors: corridorSummary,
    available_resources: incident.available_resources,
    shelter: { name: incident.shelter.name, capacity: incident.shelter.capacity },
  };

  const fallback = () => {
    const priority = threatened.sort((a, b) => (b.occupancy ?? 0) - (a.occupancy ?? 0))[0] ?? incident.assets[0];
    const anyImpassable = corridorSummary.some((c) => c.status === "IMPASSABLE");
    const action: TacticalActionKey = priority.occupancy ? (anyImpassable ? "shelter_in_place_seal" : "escorted_evacuation_convoy") : "air_tanker_retardant_drop";
    return {
      action,
      actionTitle: TACTICAL_ACTIONS[action].title,
      confidence: 0.5,
      probabilities: { [action]: 0.5 },
      targetAsset: priority.name,
      targetAssetConfidence: 0.5,
      assetProbabilities: { [priority.id]: 0.5 },
      rationale: TACTICAL_ACTIONS[action].rationale,
      posture: (anyImpassable ? "shelter_in_place" : "immediate_mandatory_evacuation") as EvacPostureKey,
      postureConfidence: 0.5,
      source: "fallback" as const,
      model: "heuristic",
      latencyMs: 0,
    };
  };

  if (!isJevConfigured() || threatened.length === 0) return fallback();

  try {
    const { result, latencyMs } = await timed(() =>
      getJevClient().systemOne(
        {
          model: JEV_MODEL,
          state,
          questions: {
            primary_action: choice(
              "You are the operations section chief. Given fire behavior, the threatened assets, corridor status, and the resources actually available, which single tactical action should be ordered first in the next 15 minutes?",
              Object.fromEntries(Object.entries(TACTICAL_ACTIONS).map(([k, v]) => [k, v.description]))
            ),
            priority_asset: choice(
              "Which threatened asset should receive the first protective action, weighing life safety (occupancy, mobility), distance to the fire edge, and downstream consequences if lost?",
              assetCriteria
            ),
            evacuation_posture: choice(
              "What protective-action posture should be broadcast to the downwind community right now?",
              EVAC_POSTURES
            ),
          },
        },
        { timeout: options.timeoutMs }
      )
    );
    const a = result.answers.primary_action;
    const p = result.answers.priority_asset;
    const e = result.answers.evacuation_posture;
    const action = a.choice as TacticalActionKey;
    const asset = threatened.find((t) => t.id === p.choice) ?? threatened[0];
    return {
      action,
      actionTitle: TACTICAL_ACTIONS[action].title,
      confidence: a.confidence,
      probabilities: a.probabilities as Record<string, number>,
      targetAsset: asset.name,
      targetAssetConfidence: p.confidence,
      assetProbabilities: p.probabilities as Record<string, number>,
      rationale: `${TACTICAL_ACTIONS[action].rationale} Priority asset: ${asset.name}.`,
      posture: e.choice as EvacPostureKey,
      postureConfidence: e.confidence,
      source: "jev",
      model: result.model,
      latencyMs,
    };
  } catch (err) {
    console.error("[jev.dispatch] falling back:", err);
    return fallback();
  }
}

export const POSTURE_LABELS: Record<EvacPostureKey, string> = {
  immediate_mandatory_evacuation: "IMMEDIATE MANDATORY EVACUATION",
  phased_evacuation_warning: "EVACUATION WARNING (PHASED)",
  shelter_in_place: "SHELTER IN PLACE",
};
