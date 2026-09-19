"use client";

import * as L from "leaflet";
import { useEffect, useRef } from "react";
import type { CitizenGroundReport, CriticalAsset, EvacuationRoute, WildfireIncident } from "@/lib/types/incident";
import { projectPerimeter } from "@/lib/geo";
import { assetIconHtml, reportIconHtml, routeGlyphHtml, ROUTE_COLORS, shelterIconHtml } from "./map-icons";

export type MapLayer = "all" | "routes" | "hotspots";

export interface MapApi {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  focusRoute: (route: EvacuationRoute) => void;
}

interface LeafletMapProps {
  incident: WildfireIncident;
  routes: EvacuationRoute[];
  reports: CitizenGroundReport[];
  selectedRouteId?: string | null;
  activeLayer: MapLayer;
  basemap: Basemap;
  timeOffsetHours: number;
  onSelectRoute?: (route: EvacuationRoute) => void;
  onSelectAsset?: (asset: CriticalAsset) => void;
  onReady?: (api: MapApi) => void;
}

export type Basemap = "dark" | "terrain";

/** Keyless basemaps. Esri Dark Gray Canvas for ops; OpenTopoMap for slope/canyon reading. */
const BASEMAPS: Record<Basemap, { layers: () => L.TileLayer[] }> = {
  dark: {
    layers: () => [
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
        maxNativeZoom: 16,
        maxZoom: 18,
        attribution: 'Tiles &copy; <a href="https://www.esri.com" target="_blank" rel="noreferrer">Esri</a> — Esri, DeLorme, NAVTEQ · Hotspots: NASA FIRMS',
      }),
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}", {
        maxNativeZoom: 16,
        maxZoom: 18,
        pane: "shadowPane",
        opacity: 0.85,
      }),
    ],
  },
  terrain: {
    layers: () => [
      L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
        subdomains: "abc",
        maxNativeZoom: 17,
        maxZoom: 18,
        opacity: 0.92,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>, SRTM · &copy; <a href="https://opentopomap.org" target="_blank" rel="noreferrer">OpenTopoMap</a> (CC-BY-SA) · Hotspots: NASA FIRMS',
      }),
    ],
  },
};

/** Bounds from the scenario's own geometry (live route state can lag one render behind a scenario switch). */
function incidentBounds(incident: WildfireIncident) {
  const pts: L.LatLngExpression[] = [
    ...incident.perimeter_polygon,
    ...incident.routes.flatMap((r) => r.points),
    ...incident.assets.map((a) => [a.latitude, a.longitude] as [number, number]),
    [incident.shelter.latitude, incident.shelter.longitude],
  ];
  return L.latLngBounds(pts);
}

export default function LeafletMap({
  incident,
  routes,
  reports,
  selectedRouteId,
  activeLayer,
  basemap,
  timeOffsetHours,
  onSelectRoute,
  onSelectAsset,
  onReady,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const groups = useRef<Record<"perimeter" | "hotspots" | "routes" | "assets" | "reports", L.LayerGroup> | null>(null);
  const basemapGroup = useRef<L.LayerGroup | null>(null);
  const callbacks = useRef({ onSelectRoute, onSelectAsset });
  callbacks.current = { onSelectRoute, onSelectAsset };
  const boundsRef = useRef<L.LatLngBounds | null>(null);
  const sizedRef = useRef(false);

  // Initialise the map once.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;
    const map = L.map(el, {
      zoomControl: false,
      attributionControl: true,
      zoomSnap: 0.25,
      wheelPxPerZoomLevel: 90,
      preferCanvas: false,
    });
    basemapGroup.current = L.layerGroup().addTo(map);
    groups.current = {
      perimeter: L.layerGroup().addTo(map),
      routes: L.layerGroup().addTo(map),
      hotspots: L.layerGroup().addTo(map),
      assets: L.layerGroup().addTo(map),
      reports: L.layerGroup().addTo(map),
    };
    mapRef.current = map;

    // Refit once the container has a real size: dynamic import + hydration can
    // hand Leaflet a 0x0 box on first paint, which produces a wrong zoom.
    const ro = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
      const size = map.getSize();
      if (!sizedRef.current && size.x > 50 && size.y > 50 && boundsRef.current) {
        sizedRef.current = true;
        map.fitBounds(boundsRef.current, { padding: [28, 28], animate: false });
      }
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      groups.current = null;
      basemapGroup.current = null;
    };
  }, []);

  // Basemap switch.
  useEffect(() => {
    const g = basemapGroup.current;
    if (!g) return;
    g.clearLayers();
    for (const layer of BASEMAPS[basemap].layers()) layer.addTo(g);
  }, [basemap]);

  // Fit to the incident when the scenario changes; publish the imperative API.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = incidentBounds(incident);
    boundsRef.current = bounds;
    const size = map.getSize();
    if (size.x > 50 && size.y > 50) {
      sizedRef.current = true;
      map.fitBounds(bounds, { padding: [28, 28], animate: false });
    }
    onReady?.({
      zoomIn: () => map.zoomIn(0.5),
      zoomOut: () => map.zoomOut(0.5),
      reset: () => map.fitBounds(incidentBounds(incident), { padding: [28, 28] }),
      focusRoute: (route) => map.fitBounds(L.latLngBounds(route.points), { padding: [60, 60], maxZoom: 14 }),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incident]);

  // Fire perimeter (current + projected).
  useEffect(() => {
    const g = groups.current?.perimeter;
    if (!g) return;
    g.clearLayers();
    if (timeOffsetHours > 0) {
      L.polygon(incident.perimeter_polygon, {
        color: "#f97316",
        weight: 1,
        opacity: 0.55,
        fillColor: "#7c2d12",
        fillOpacity: 0.25,
        dashArray: "3 5",
        interactive: false,
      }).addTo(g);
    }
    const projected = projectPerimeter(incident.perimeter_polygon, incident.spread_azimuth_deg, incident.spread_rate_mph, timeOffsetHours);
    L.polygon(projected, {
      className: "fire-perimeter",
      color: "#f97316",
      weight: 2.5,
      dashArray: "10 6",
      fillColor: "#ef4444",
      fillOpacity: timeOffsetHours > 0 ? 0.22 : 0.3,
    })
      .bindTooltip(
        `<b>${incident.name}</b><br/>${timeOffsetHours > 0 ? `Projected perimeter T+${timeOffsetHours}h` : "Active perimeter"} · spreading ${incident.spread_azimuth_deg}° at ${incident.spread_rate_mph} mph`,
        { className: "pyro-tooltip", sticky: true }
      )
      .addTo(g);
  }, [incident, timeOffsetHours]);

  // Satellite hotspots.
  useEffect(() => {
    const g = groups.current?.hotspots;
    const map = mapRef.current;
    if (!g || !map) return;
    g.clearLayers();
    if (activeLayer === "routes") return;
    for (const hs of incident.hotspots) {
      const r = Math.min(Math.max(hs.frp_mw / 22, 6), 18);
      L.circleMarker([hs.latitude, hs.longitude], {
        radius: r * 1.6,
        className: "hotspot-halo",
        color: "#f97316",
        weight: 0,
        fillColor: "#f97316",
        fillOpacity: 0.45,
        interactive: false,
      }).addTo(g);
      L.circleMarker([hs.latitude, hs.longitude], {
        radius: r,
        color: "#fff7ed",
        weight: 1,
        fillColor: "#f97316",
        fillOpacity: 0.95,
      })
        .bindTooltip(
          `<b>${Math.round(hs.frp_mw)} MW</b> Fire Radiative Power<br/>${hs.satellite.replace("_", " ")} · ${hs.confidence}% confidence<br/><span style="color:#a1a1aa">${new Date(hs.acquisition_time).toUTCString().slice(17, 25)} UTC</span>`,
          { className: "pyro-tooltip", direction: "top" }
        )
        .addTo(g);
    }
  }, [incident, activeLayer]);

  // Evacuation corridors.
  useEffect(() => {
    const g = groups.current?.routes;
    if (!g) return;
    g.clearLayers();
    if (activeLayer === "hotspots") return;
    const ordered = [...routes].sort((a, b) => (a.id === selectedRouteId ? 1 : 0) - (b.id === selectedRouteId ? 1 : 0));
    for (const route of ordered) {
      const color = ROUTE_COLORS[route.statusBadge];
      const selected = route.id === selectedRouteId;
      const isImpassable = route.statusBadge === "IMPASSABLE";
      const pending = route.statusBadge === "PENDING";
      const handlers = { click: () => callbacks.current.onSelectRoute?.(route) };

      L.polyline(route.points, { color, weight: selected ? 16 : 12, opacity: selected ? 0.35 : 0.2, lineCap: "round" })
        .on(handlers)
        .addTo(g);
      L.polyline(route.points, {
        color,
        weight: selected ? 5.5 : 4,
        opacity: pending ? 0.8 : 1,
        dashArray: isImpassable ? "12 9" : pending ? "5 9" : undefined,
        className: isImpassable ? "route-impassable" : undefined,
        lineCap: "round",
        lineJoin: "round",
      })
        .bindTooltip(
          `<b>${route.name}</b><br/>Status: <b style="color:${color}">${route.statusBadge}</b>${route.evaluated ? ` · Jev score ${route.hazardScore.toFixed(2)}/4 (L${Math.round(route.hazardScore) + 1})` : " · awaiting Jev score"}${route.chokepointDesc ? `<br/><span style="color:#a1a1aa">${route.chokepointDesc}</span>` : ""}`,
          { className: "pyro-tooltip", sticky: true }
        )
        .on(handlers)
        .addTo(g);

      const mid = route.points[Math.floor(route.points.length / 2)];
      L.marker(mid, {
        icon: L.divIcon({ className: "pyro-marker", html: routeGlyphHtml(route.statusBadge, route.evaluated ? Math.round(route.hazardScore) + 1 : undefined), iconSize: [26, 26], iconAnchor: [13, 13] }),
        keyboard: false,
      })
        .on(handlers)
        .addTo(g);
    }
  }, [routes, selectedRouteId, activeLayer]);

  // Critical assets + shelter.
  useEffect(() => {
    const g = groups.current?.assets;
    if (!g) return;
    g.clearLayers();
    for (const asset of incident.assets) {
      L.marker([asset.latitude, asset.longitude], {
        icon: L.divIcon({ className: "pyro-marker", html: assetIconHtml(asset), iconSize: [28, 44], iconAnchor: [14, 14] }),
        title: asset.name,
      })
        .bindTooltip(
          `<b>${asset.name}</b><br/>${asset.distance_miles} mi from fire edge${asset.occupancy ? ` · ${asset.occupancy} occupants` : ""}<br/>Status: <b>${asset.defensibility_status.toUpperCase()}</b>`,
          { className: "pyro-tooltip", direction: "top", offset: [0, -14] }
        )
        .on("click", () => callbacks.current.onSelectAsset?.(asset))
        .addTo(g);
    }
    L.marker([incident.shelter.latitude, incident.shelter.longitude], {
      icon: L.divIcon({ className: "pyro-marker", html: shelterIconHtml(incident.shelter.name), iconSize: [28, 44], iconAnchor: [14, 14] }),
      title: incident.shelter.name,
    })
      .bindTooltip(`<b>${incident.shelter.name}</b><br/>${incident.shelter.address}<br/>Capacity ${incident.shelter.capacity.toLocaleString()}`, { className: "pyro-tooltip", direction: "top", offset: [0, -14] })
      .addTo(g);
  }, [incident]);

  // Citizen / field reports.
  useEffect(() => {
    const g = groups.current?.reports;
    if (!g) return;
    g.clearLayers();
    for (const r of reports) {
      L.marker([r.latitude, r.longitude], {
        icon: L.divIcon({ className: "pyro-marker", html: reportIconHtml(r), iconSize: [18, 18], iconAnchor: [9, 9] }),
        keyboard: false,
      })
        .bindTooltip(
          `<b>${r.reporterName}</b> · ${r.timestamp}<br/>"${r.text}"<br/><span style="color:#a1a1aa">Jev Noul: ${r.pending ? "verifying…" : r.jevNoulScore !== undefined ? `${Math.round(r.jevNoulScore * 100)}% ${r.verifiedByJev ? "VERIFIED" : "unverified"}` : "not yet evaluated"}</span>`,
          { className: "pyro-tooltip", direction: "top" }
        )
        .addTo(g);
    }
  }, [reports]);

  return <div ref={containerRef} className="absolute inset-0 z-0" role="application" aria-label="Tactical wildfire map" />;
}
