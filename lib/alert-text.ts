import type { EvacuationRoute, WildfireIncident } from "@/lib/types/incident";

export interface DispatchSummary {
  actionTitle: string;
  targetAsset: string;
  postureLabel: string;
  confidence: number;
}

export type AlertLevel = "pending" | "running" | "emergency" | "advisory" | "safe";

export interface EmergencyAlert {
  level: AlertLevel;
  title: string;
  description: string;
  /** Plain-language sentence for text-to-speech and aria-live. */
  speech: string;
}

export function buildEmergencyAlert(
  incident: WildfireIncident,
  routes: EvacuationRoute[],
  dispatch: DispatchSummary | null,
  isRunning: boolean
): EmergencyAlert {
  const evaluated = routes.some((r) => r.evaluated);
  const impassable = routes.filter((r) => r.statusBadge === "IMPASSABLE");
  const hazardous = routes.filter((r) => r.statusBadge === "HAZARDOUS");
  const clear = routes.filter((r) => r.statusBadge === "CLEAR");
  const safeName = clear[0]?.name ?? hazardous[0]?.name;

  if (isRunning && !evaluated) {
    return {
      level: "running",
      title: "Jev System One evaluating corridors…",
      description: `Verifying field reports and scoring ${routes.length} evacuation corridors against live fire behavior for the ${incident.name}.`,
      speech: `PyroShield is evaluating evacuation corridors for the ${incident.name}.`,
    };
  }
  if (!evaluated) {
    return {
      level: "pending",
      title: `${incident.name} · ${incident.acres_burned.toLocaleString()} acres · ${incident.containment_pct}% contained`,
      description: "Corridors are awaiting live Jev scoring. Run the tactical evaluation to verify reports, score roads, and arbitrate dispatch.",
      speech: `${incident.name}, ${incident.acres_burned.toLocaleString()} acres, ${incident.containment_pct} percent contained. Corridor evaluation pending.`,
    };
  }
  if (impassable.length > 0) {
    const closed = impassable.map((r) => r.name).join(", ");
    const desc = `${closed} ${impassable.length > 1 ? "are" : "is"} rated IMPASSABLE by Jev. ${safeName ? `Evacuate via ${safeName} to ${incident.shelter.name}.` : "Await escort instructions."}${dispatch ? ` Posture: ${dispatch.postureLabel}. First order: ${dispatch.actionTitle} → ${dispatch.targetAsset}.` : ""}`;
    return {
      level: "emergency",
      title: `EVACUATION ALERT — ${closed} CLOSED`,
      description: desc,
      speech: `Emergency alert. ${closed} ${impassable.length > 1 ? "are" : "is"} impassable due to wildfire. Do not use ${impassable.length > 1 ? "these roads" : "this road"}. ${safeName ? `Evacuate using ${safeName} to ${incident.shelter.name}.` : "Wait for escort instructions."}${dispatch ? ` Protective action posture: ${dispatch.postureLabel.toLowerCase()}.` : ""}`,
    };
  }
  if (hazardous.length > 0) {
    const names = hazardous.map((r) => r.name).join(", ");
    return {
      level: "advisory",
      title: `EVACUATION WARNING — escorts required on ${names}`,
      description: `Jev rates ${names} HAZARDOUS: reduced visibility and embers near the roadway. ${clear[0] ? `${clear[0].name} remains CLEAR.` : ""} Shelter: ${incident.shelter.name}.`,
      speech: `Evacuation warning. ${names} ${hazardous.length > 1 ? "are" : "is"} hazardous; travel only with escorts. ${clear[0] ? `${clear[0].name} remains clear.` : ""}`,
    };
  }
  return {
    level: "safe",
    title: "All evacuation corridors verified CLEAR",
    description: `Jev scored every corridor clear of fire impact. Continue monitoring; wind gusts to ${incident.weather.gusts_mph} mph could change conditions within the hour.`,
    speech: `All evacuation corridors are verified clear. Continue to monitor conditions.`,
  };
}
