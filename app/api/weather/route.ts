import { NextRequest, NextResponse } from "next/server";
import { getScenario } from "@/lib/scenarios";

export const runtime = "nodejs";

/**
 * GET /api/weather?lat=&lon=
 * Open-Meteo live proxy (no API key). Falls back to the scenario's telemetry
 * so the console never renders empty gauges during a demo.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scenario = getScenario(searchParams.get("incidentId"));
  const lat = Number(searchParams.get("lat") ?? scenario.center_lat);
  const lon = Number(searchParams.get("lon") ?? scenario.center_lng);

  const fallback = {
    source: "scenario" as const,
    temperature_f: scenario.weather.ambient_temp_f,
    relative_humidity_pct: scenario.weather.relative_humidity_pct,
    wind_speed_mph: scenario.weather.wind_speed_mph,
    wind_direction_deg: scenario.weather.wind_direction_degrees,
    gusts_mph: scenario.weather.gusts_mph,
    red_flag_active: scenario.weather.red_flag_active,
    observed_at: new Date().toISOString(),
  };

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json(fallback);
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m&wind_speed_unit=mph&temperature_unit=fahrenheit`;
    const res = await fetch(url, { next: { revalidate: 300 }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const data = await res.json();
    const c = data.current ?? {};
    const wind = Number(c.wind_speed_10m);
    const rh = Number(c.relative_humidity_2m);
    return NextResponse.json({
      source: "open-meteo" as const,
      temperature_f: Math.round(Number(c.temperature_2m)),
      relative_humidity_pct: rh,
      wind_speed_mph: Math.round(wind * 10) / 10,
      wind_direction_deg: Number(c.wind_direction_10m),
      gusts_mph: Math.round(Number(c.wind_gusts_10m) * 10) / 10,
      red_flag_active: wind > 20 && rh < 20,
      observed_at: c.time ?? new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[api/weather] falling back to scenario telemetry:", err);
    return NextResponse.json(fallback);
  }
}
