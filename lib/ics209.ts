import type { CitizenGroundReport, EvacuationRoute, WildfireIncident } from "@/lib/types/incident";
import type { JevDecisionLog } from "@/lib/types/jev";
import { compassLabel } from "@/lib/geo";

export interface DispatchForReport {
  actionTitle: string;
  targetAsset: string;
  postureLabel: string;
  confidence: number;
  rationale: string;
  source: string;
  latencyMs: number;
}

export interface Ics209Block {
  no: number;
  title: string;
  rows: [string, string][];
}

export function buildIcs209(
  incident: WildfireIncident,
  routes: EvacuationRoute[],
  reports: CitizenGroundReport[],
  dispatch: DispatchForReport | null,
  logs: JevDecisionLog[],
  now = new Date()
): { header: [string, string][]; blocks: Ics209Block[]; generatedAt: string } {
  const w = incident.weather;
  const generatedAt = now.toISOString().replace("T", " ").slice(0, 16) + " UTC";
  const header: [string, string][] = [
    ["1. Incident Name", incident.name],
    ["2. Incident Number", incident.incident_number],
    ["3. Report Version", "Update"],
    ["4. Incident Commander(s)", "PyroShield Unified Command"],
    ["5. Incident Management Organization", "Type 2 IMT"],
    ["6. Incident Start Date/Time", incident.timelineData[0]?.hour ? `${incident.timelineData[0].hour} relative` : "—"],
    ["7. Current Incident Size", `${incident.acres_burned.toLocaleString()} acres`],
    ["8. Percent Contained", `${incident.containment_pct}%`],
    ["9. Incident Definition", "Wildfire — Wildland-Urban Interface"],
    ["10. Incident Complexity Level", incident.spread_rate_mph >= 3 ? "Type 1" : "Type 2"],
    ["11. For Time Period", generatedAt],
  ];

  const verified = reports.filter((r) => r.verifiedByJev);
  const impassable = routes.filter((r) => r.statusBadge === "IMPASSABLE");
  const clear = routes.filter((r) => r.statusBadge === "CLEAR");

  const blocks: Ics209Block[] = [
    {
      no: 12,
      title: "Location Information",
      rows: [
        ["Location", incident.location_name],
        ["Latitude / Longitude", `${incident.center_lat.toFixed(4)}, ${incident.center_lng.toFixed(4)}`],
        ["Fuel model", incident.fuel_model],
        ["Terrain", incident.terrain_summary],
      ],
    },
    {
      no: 28,
      title: "Weather Concerns (Current)",
      rows: [
        ["Wind", `${w.wind_speed_mph} mph from ${compassLabel(w.wind_direction_degrees)} (${w.wind_direction_degrees}°), gusts ${w.gusts_mph} mph`],
        ["Relative humidity", `${w.relative_humidity_pct}%`],
        ["Temperature", `${w.ambient_temp_f} °F`],
        ["Fuel moisture", `${w.fuel_moisture_pct}%`],
        ["Red Flag Warning", w.red_flag_active ? "ACTIVE" : "Not in effect"],
      ],
    },
    {
      no: 29,
      title: "Fire Behavior / Projected Spread",
      rows: [
        ["Rate of spread", `${incident.spread_rate_mph} mph toward ${compassLabel(incident.spread_azimuth_deg)} (${incident.spread_azimuth_deg}°)`],
        ["Peak Fire Radiative Power", `${Math.max(0, ...incident.hotspots.map((h) => h.frp_mw)).toFixed(0)} MW (NASA FIRMS VIIRS)`],
        ["Active hotspot clusters", String(incident.hotspots.length)],
        ["Projected +2h", `${incident.timelineData.find((t) => t.hour === "+2h")?.acres.toLocaleString() ?? "—"} acres`],
      ],
    },
    {
      no: 30,
      title: "Threatened Values at Risk (Critical Infrastructure)",
      rows: incident.assets.map((a): [string, string] => [a.name, `${a.distance_miles} mi · ${a.occupancy ? `${a.occupancy} occupants` : "unoccupied"} · ${a.defensibility_status.toUpperCase()}`]),
    },
    {
      no: 31,
      title: "Evacuation Corridor Status (TypeSafe Jev Score)",
      rows: [
        ...routes.map(
          (r): [string, string] => [
            r.name,
            r.evaluated
              ? `${r.statusBadge} · Level ${Math.round(r.hazardScore) + 1} (score ${r.hazardScore.toFixed(2)}/4, conf ${Math.round(r.confidence * 100)}%)`
              : "Not yet evaluated",
          ]
        ),
        ["Designated egress", clear[0]?.name ?? "Pending"],
        ["Closures", impassable.map((r) => r.name).join("; ") || "None"],
        ["Shelter", `${incident.shelter.name}, ${incident.shelter.address} (cap. ${incident.shelter.capacity})`],
      ],
    },
    {
      no: 32,
      title: "Verified Ground Intelligence (TypeSafe Jev Noul)",
      rows: verified.length
        ? verified.map((r): [string, string] => [`${r.reporterName} (${r.timestamp})`, `${Math.round((r.jevNoulScore ?? 0) * 100)}% — "${r.text}"`])
        : [["—", "No reports verified in this period"]],
    },
    {
      no: 33,
      title: "Planned Actions / Resource Orders (TypeSafe Jev Choice)",
      rows: dispatch
        ? [
            ["Protective action posture", dispatch.postureLabel],
            ["Priority tactical action", `${dispatch.actionTitle} (conf ${Math.round(dispatch.confidence * 100)}%)`],
            ["Priority asset", dispatch.targetAsset],
            ["Rationale", dispatch.rationale],
            ["Resources available", incident.available_resources.join("; ")],
          ]
        : [["—", "Dispatch arbitration not yet run"]],
    },
    {
      no: 47,
      title: "Decision Audit Trail",
      rows: logs.slice(0, 8).map((l): [string, string] => [`${l.timestamp} ${l.primitive}`, `${l.title}: ${l.result} (${Math.round(l.confidence * 100)}%${l.latencyMs ? `, ${l.latencyMs} ms` : ""})`]),
    },
  ];
  return { header, blocks, generatedAt };
}

export function ics209ToMarkdown(data: ReturnType<typeof buildIcs209>): string {
  const lines: string[] = ["# ICS-209 Incident Status Summary", "", `Generated by PyroShield AI · ${data.generatedAt}`, ""];
  lines.push("## Header");
  for (const [k, v] of data.header) lines.push(`- **${k}:** ${v}`);
  for (const b of data.blocks) {
    lines.push("", `## Block ${b.no} — ${b.title}`, "", "| Field | Value |", "| --- | --- |");
    for (const [k, v] of b.rows) lines.push(`| ${k} | ${String(v).replace(/\|/g, "/")} |`);
  }
  lines.push("", "_Semantic judgments produced by TypeSafe Jev (jev-latest). Verify with field units before acting on any single indicator._");
  return lines.join("\n");
}
