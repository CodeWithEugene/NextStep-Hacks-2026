import { NextRequest, NextResponse } from "next/server";
import { getScenario } from "@/lib/scenarios";
import type { ThermalHotspot } from "@/lib/types/incident";

export const runtime = "nodejs";

/**
 * GET /api/firms?incidentId=&days=1&radiusDeg=0.25
 * NASA FIRMS near-real-time active fire pixels (VIIRS NOAA-20, 375 m).
 * Requires FIRMS_MAP_KEY (free: https://firms.modaps.eosdis.nasa.gov/api/map_key/).
 * Without a key, or if FIRMS has no detections in the box, returns the bundled
 * scenario hotspots so the map is never empty. The response labels its source.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scenario = getScenario(searchParams.get("incidentId"));
  const days = Math.min(5, Math.max(1, Number(searchParams.get("days") ?? 1)));
  const radius = Math.min(1, Math.max(0.05, Number(searchParams.get("radiusDeg") ?? 0.25)));
  const key = process.env.FIRMS_MAP_KEY;

  const cached = { source: "scenario_cache" as const, hotspots: scenario.hotspots, count: scenario.hotspots.length };
  if (!key) return NextResponse.json({ ...cached, note: "Set FIRMS_MAP_KEY to enable live NASA FIRMS ingestion." });

  const west = scenario.center_lng - radius;
  const east = scenario.center_lng + radius;
  const south = scenario.center_lat - radius;
  const north = scenario.center_lat + radius;
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/VIIRS_NOAA20_NRT/${west},${south},${east},${north}/${days}`;

  try {
    const res = await fetch(url, { next: { revalidate: 600 }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`FIRMS ${res.status}`);
    const csv = await res.text();
    const [header, ...rows] = csv.trim().split("\n");
    const cols = header.split(",");
    const idx = (name: string) => cols.indexOf(name);
    const hotspots: ThermalHotspot[] = rows
      .map((line, i) => {
        const v = line.split(",");
        return {
          id: `firms-${i}`,
          latitude: Number(v[idx("latitude")]),
          longitude: Number(v[idx("longitude")]),
          frp_mw: Number(v[idx("frp")]),
          confidence: v[idx("confidence")] === "h" ? 95 : v[idx("confidence")] === "n" ? 75 : Number(v[idx("confidence")]) || 50,
          satellite: "VIIRS_NOAA20" as const,
          acquisition_time: `${v[idx("acq_date")]}T${String(v[idx("acq_time")]).padStart(4, "0").replace(/(\d\d)(\d\d)/, "$1:$2")}:00Z`,
        };
      })
      .filter((h) => Number.isFinite(h.latitude) && Number.isFinite(h.longitude));
    if (hotspots.length === 0) return NextResponse.json({ ...cached, note: "FIRMS returned no detections in the incident box." });
    return NextResponse.json({ source: "nasa_firms_live" as const, hotspots, count: hotspots.length });
  } catch (err) {
    console.warn("[api/firms] falling back to scenario cache:", err);
    return NextResponse.json({ ...cached, note: "FIRMS unreachable; serving cached scenario hotspots." });
  }
}
