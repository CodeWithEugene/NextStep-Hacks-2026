/**
 * Lightweight geodesy helpers for the tactical map and Jev state construction.
 * All coordinates are [lat, lng] in decimal degrees, distances in statute miles.
 */
export type LatLng = [number, number];

const EARTH_RADIUS_MILES = 3958.8;
const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Great-circle distance between two points in miles. */
export function haversineMiles(a: LatLng, b: LatLng): number {
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial bearing from a to b, 0-360 degrees clockwise from true north. */
export function bearingDeg(a: LatLng, b: LatLng): number {
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const dLng = toRad(b[1] - a[1]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Centroid of a polygon or polyline (simple vertex mean; adequate at incident scale). */
export function centroid(points: LatLng[]): LatLng {
  if (points.length === 0) return [0, 0];
  const sum = points.reduce<[number, number]>((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]);
  return [sum[0] / points.length, sum[1] / points.length];
}

/** Minimum distance (miles) from any vertex of a path to any vertex of a polygon. */
export function minDistanceMiles(path: LatLng[], polygon: LatLng[]): number {
  let min = Number.POSITIVE_INFINITY;
  for (const p of path) {
    for (const q of polygon) {
      const d = haversineMiles(p, q);
      if (d < min) min = d;
    }
  }
  return Number.isFinite(min) ? min : 0;
}

/** Smallest angular difference between two bearings, 0-180. */
export function angularDiff(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360 + 540) % 360 - 180);
  return d;
}

export type WindAlignment =
  | "direct_downwind"
  | "downwind_quartering"
  | "crosswind"
  | "upwind_quartering"
  | "direct_upwind";

/**
 * Classify how a corridor sits relative to the fire's spread azimuth.
 * A corridor whose bearing from the fire centroid matches the spread azimuth
 * is directly downwind (fire is moving toward it).
 */
export function classifyWindAlignment(
  firePerimeter: LatLng[],
  corridor: LatLng[],
  spreadAzimuthDeg: number
): WindAlignment {
  const fireC = centroid(firePerimeter);
  const roadC = centroid(corridor);
  const bearingToRoad = bearingDeg(fireC, roadC);
  const diff = angularDiff(bearingToRoad, spreadAzimuthDeg);
  if (diff <= 30) return "direct_downwind";
  if (diff <= 70) return "downwind_quartering";
  if (diff <= 110) return "crosswind";
  if (diff <= 150) return "upwind_quartering";
  return "direct_upwind";
}

/** Compass label for a bearing (16-point). */
export function compassLabel(deg: number): string {
  const labels = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
  ];
  return labels[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
}

/**
 * Project a fire perimeter forward in time along the spread azimuth.
 * Forward vertices advance by spreadRate * hours; flanks grow at ~25% of that.
 */
export function projectPerimeter(
  polygon: LatLng[],
  spreadAzimuthDeg: number,
  spreadRateMph: number,
  hours: number
): LatLng[] {
  if (hours <= 0) return polygon;
  const c = centroid(polygon);
  const forwardMiles = spreadRateMph * hours;
  const az = toRad(spreadAzimuthDeg);
  return polygon.map(([lat, lng]) => {
    const vertexBearing = toRad(bearingDeg(c, [lat, lng]));
    // Alignment of this vertex with the spread direction: 1 = leading edge, -1 = heel
    const alignment = Math.cos(vertexBearing - az);
    const advance = forwardMiles * (0.25 + 0.75 * Math.max(0, alignment));
    const dLat = (advance * Math.cos(vertexBearing)) / 69;
    const dLng = (advance * Math.sin(vertexBearing)) / (69 * Math.cos(toRad(lat)));
    return [lat + dLat, lng + dLng];
  });
}

/** Format a coordinate pair as a DMS-lite HUD string, e.g. "N 34°10.9' W 118°29.5'". */
export function formatCoordinate(lat: number, lng: number): string {
  const fmt = (v: number, pos: string, neg: string) => {
    const hemi = v >= 0 ? pos : neg;
    const abs = Math.abs(v);
    const d = Math.floor(abs);
    const m = ((abs - d) * 60).toFixed(1);
    return `${hemi} ${d}°${m}'`;
  };
  return `${fmt(lat, "N", "S")} ${fmt(lng, "E", "W")}`;
}
