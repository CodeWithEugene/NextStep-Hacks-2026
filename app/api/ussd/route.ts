import { NextRequest, NextResponse } from "next/server";
import { getScenario } from "@/lib/scenarios";
import { compassLabel } from "@/lib/geo";
import { scoreCorridors, verifyGroundReport } from "@/lib/server/jev-ops";

export const runtime = "nodejs";

/**
 * Africa's Talking USSD callback.
 * Configure in the AT dashboard:  https://pyroshieldai.codewitheugene.top/api/ussd  (POST)
 * AT sends application/x-www-form-urlencoded: sessionId, serviceCode, phoneNumber, text, networkCode.
 * Respond with text/plain starting with "CON " (continue) or "END " (terminate).
 * USSD screens are ~160 chars; Jev calls are capped at 3.5s to stay inside the gateway timeout.
 */
const JEV_TIMEOUT_MS = 3500;
const USSD_MAX = 182;

const plain = (text: string) =>
  new NextResponse(text.length > USSD_MAX ? text.slice(0, USSD_MAX - 1) + "…" : text, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });

async function parseBody(req: NextRequest) {
  const ct = req.headers.get("content-type") || "";
  const out = { sessionId: "", serviceCode: "", phoneNumber: "", text: "" };
  const assign = (get: (k: string) => string | null | undefined) => {
    out.sessionId = String(get("sessionId") ?? "");
    out.serviceCode = String(get("serviceCode") ?? "");
    out.phoneNumber = String(get("phoneNumber") ?? "");
    out.text = String(get("text") ?? "");
  };
  if (ct.includes("application/json")) {
    const b = await req.json().catch(() => ({}));
    assign((k) => b?.[k]);
  } else if (ct.includes("multipart/form-data") || ct.includes("application/x-www-form-urlencoded")) {
    const fd = await req.formData();
    assign((k) => (fd.get(k) as string | null) ?? null);
  } else {
    const params = new URLSearchParams(await req.text());
    assign((k) => params.get(k));
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await parseBody(req);
    const inputs = text.split("*").filter(Boolean);
    const incident = getScenario();
    const w = incident.weather;

    if (inputs.length === 0) {
      return plain(
        `CON PyroShield Wildfire Alert\n${incident.name}: ${incident.containment_pct}% contained\n1. Fire threat now\n2. Safe evacuation roads\n3. Report fire or smoke\n4. Shelter & emergency lines`
      );
    }

    switch (inputs[0]) {
      case "1":
        return plain(
          `END ${incident.name.toUpperCase()}\n${incident.acres_burned.toLocaleString()} ac, ${incident.containment_pct}% contained\nWind ${compassLabel(w.wind_direction_degrees)} ${w.wind_speed_mph}mph gust ${w.gusts_mph}\nSpreading ${compassLabel(incident.spread_azimuth_deg)} ${incident.spread_rate_mph}mph${w.red_flag_active ? "\nRED FLAG WARNING" : ""}\nIf downwind: prepare to leave.`
        );

      case "2": {
        // Live Jev Score on every corridor, single request, hard timeout for the USSD gateway.
        const results = await scoreCorridors(incident, incident.routes, [], { timeoutMs: JEV_TIMEOUT_MS });
        const shortName = (name: string) => name.replace(/\s*\(.*?\)\s*/g, "").split(" ").slice(0, 3).join(" ").slice(0, 22);
        const lines = incident.routes.map((r) => {
          const res = results.find((x) => x.routeId === r.id);
          const tag = res?.statusBadge === "IMPASSABLE" ? "CLOSED" : res?.statusBadge === "HAZARDOUS" ? "ESCORT" : "OPEN";
          return `${shortName(r.name)}: ${tag} L${res?.level ?? "?"}`;
        });
        const safe = incident.routes.find((r) => results.find((x) => x.routeId === r.id)?.statusBadge === "CLEAR");
        const src = results[0]?.source === "jev" ? "Jev live" : "cached";
        return plain(`END ROADS (${src})\n${lines.join("\n")}\nGO: ${safe ? shortName(safe.name) : "await escort"}\nShelter: ${incident.shelter.name.split(" ").slice(0, 3).join(" ")}`);
      }

      case "3": {
        if (inputs.length === 1) {
          return plain("CON Describe what you see and where\n(e.g. Smoke over Mile 4 barrier, cars turning back)");
        }
        const details = inputs.slice(1).join(" ").slice(0, 300);
        const result = await verifyGroundReport(
          incident,
          {
            text: details,
            latitude: incident.center_lat,
            longitude: incident.center_lng,
            reporterName: "USSD caller",
            timestamp: "just now",
            channel: "ussd",
          },
          { timeoutMs: JEV_TIMEOUT_MS }
        );
        const pct = Math.round(result.noul * 100);
        const verdict = result.verified ? "VERIFIED - dispatch notified" : "LOGGED - awaiting field confirmation";
        return plain(`END Report received.\nJev match: ${pct}% ${verdict}.\nMove upwind (${compassLabel((incident.spread_azimuth_deg + 180) % 360)}) away from smoke. Call 911 if you see flames.`);
      }

      case "4":
        return plain(
          `END SHELTER: ${incident.shelter.name}\n${incident.shelter.address}\nFire & Rescue: 911 / 112\nIncident Command: +1-800-555-3473\nWeb: pyroshieldai.codewitheugene.top`
        );

      default:
        return plain("END Invalid option. Redial *384*2026# and choose 1-4.");
    }
  } catch (error) {
    console.error("[api/ussd]", error);
    return plain("END PyroShield is temporarily unavailable. If you are in danger call 911 now.");
  }
}

export async function GET() {
  return NextResponse.json({
    service: "PyroShield AI — Africa's Talking USSD callback",
    status: "active",
    method: "POST",
    contentType: "application/x-www-form-urlencoded",
    parameters: ["sessionId", "serviceCode", "phoneNumber", "text", "networkCode"],
    shortcode: "*384*2026#",
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://pyroshieldai.codewitheugene.top"}/api/ussd`,
  });
}
