import { pineRidgeFire } from "./pine-ridge-fire";
import { diabloCanyonFire } from "./diablo-canyon-fire";
import { sierraRidgeFire } from "./sierra-ridge-fire";
import { WildfireIncident } from "@/lib/types/incident";

export const SCENARIOS: Record<string, WildfireIncident> = {
  "wf-pine-ridge-2026": pineRidgeFire,
  "wf-diablo-canyon-2026": diabloCanyonFire,
  "wf-sierra-ridge-2026": sierraRidgeFire,
};

export const SCENARIO_LIST = Object.values(SCENARIOS);

export const DEFAULT_SCENARIO_ID = "wf-pine-ridge-2026";

export function getScenario(id?: string | null): WildfireIncident {
  return (id && SCENARIOS[id]) || SCENARIOS[DEFAULT_SCENARIO_ID];
}
