"use client";

import dynamic from "next/dynamic";
import React, { useCallback, useRef, useState } from "react";
import type { CitizenGroundReport, CriticalAsset, EvacuationRoute, WildfireIncident } from "@/lib/types/incident";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { compassLabel, formatCoordinate } from "@/lib/geo";
import { ArrowUp, Flame, Loader2, Mountain, Navigation, RotateCcw, Wind, ZoomIn, ZoomOut } from "lucide-react";
import type { Basemap, MapApi, MapLayer } from "./leaflet-map";

const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 text-xs text-muted-foreground gap-2">
      <Loader2 className="w-4 h-4 animate-spin text-orange-400" /> Loading tactical basemap…
    </div>
  ),
});

interface TacticalMapProps {
  incident: WildfireIncident;
  routes: EvacuationRoute[];
  reports: CitizenGroundReport[];
  selectedRouteId?: string | null;
  onSelectRoute?: (route: EvacuationRoute) => void;
  onSelectAsset?: (asset: CriticalAsset) => void;
  timeOffsetHours?: number;
  className?: string;
}

export function TacticalMap({
  incident,
  routes,
  reports,
  selectedRouteId,
  onSelectRoute,
  onSelectAsset,
  timeOffsetHours = 0,
  className,
}: TacticalMapProps) {
  const [activeLayer, setActiveLayer] = useState<MapLayer>("all");
  const [basemap, setBasemap] = useState<Basemap>("dark");
  const apiRef = useRef<MapApi | null>(null);
  const handleReady = useCallback((api: MapApi) => {
    apiRef.current = api;
  }, []);
  const handleSelectRoute = useCallback(
    (route: EvacuationRoute) => {
      onSelectRoute?.(route);
      apiRef.current?.focusRoute(route);
    },
    [onSelectRoute]
  );

  const w = incident.weather;
  const blowsTo = (w.wind_direction_degrees + 180) % 360;
  const impassable = routes.filter((r) => r.statusBadge === "IMPASSABLE").length;
  const clear = routes.filter((r) => r.statusBadge === "CLEAR").length;

  return (
    <div
      className={`relative isolate z-0 w-full h-[52dvh] min-h-[340px] lg:h-[560px] rounded-xl border border-zinc-800 overflow-hidden shadow-2xl bg-zinc-950 ${className ?? ""}`}
    >
      <LeafletMap
        incident={incident}
        routes={routes}
        reports={reports}
        selectedRouteId={selectedRouteId}
        activeLayer={activeLayer}
        basemap={basemap}
        timeOffsetHours={timeOffsetHours}
        onSelectRoute={handleSelectRoute}
        onSelectAsset={onSelectAsset}
        onReady={handleReady}
      />

      {/* Top HUD: fire front + wind, layer toggles */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-[1000] flex flex-wrap items-start justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex flex-wrap items-center gap-2 bg-zinc-950/85 backdrop-blur-md border border-zinc-800 px-2.5 py-1.5 rounded-lg shadow-lg">
          <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold tracking-wide text-orange-400">
            <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" /> ACTIVE FIRE FRONT
          </span>
          <span className="hidden sm:inline text-zinc-700">|</span>
          <span className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-zinc-300">
            <Wind className="w-3.5 h-3.5 text-sky-400" />
            {w.wind_speed_mph} mph · gusts {w.gusts_mph} · from {compassLabel(w.wind_direction_degrees)}
          </span>
          {timeOffsetHours > 0 && (
            <Badge variant="warning" className="text-[10px] py-0">
              PROJECTED T+{timeOffsetHours}h
            </Badge>
          )}
        </div>

        <div className="pointer-events-auto flex items-center gap-1 bg-zinc-950/85 backdrop-blur-md border border-zinc-800 p-1 rounded-lg shadow-lg" role="group" aria-label="Map layers">
          {(
            [
              ["all", "All layers"],
              ["routes", "Evacuation"],
              ["hotspots", "Sat hotspots"],
            ] as [MapLayer, string][]
          ).map(([key, label]) => (
            <Button
              key={key}
              size="sm"
              variant={activeLayer === key ? "secondary" : "ghost"}
              className="h-7 text-[11px] px-2"
              aria-pressed={activeLayer === key}
              onClick={() => setActiveLayer(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Wind vector dial */}
      <div className="absolute right-2.5 top-14 z-[1000] hidden sm:flex flex-col items-center bg-zinc-950/85 backdrop-blur-md border border-zinc-800 rounded-lg px-2 py-1.5 shadow-lg pointer-events-none">
        <div className="relative w-12 h-12 rounded-full border border-zinc-700 flex items-center justify-center">
          <span className="absolute top-0.5 text-[8px] font-mono text-zinc-500">N</span>
          <ArrowUp className="w-6 h-6 text-sky-400 transition-transform duration-500" style={{ transform: `rotate(${blowsTo}deg)` }} aria-hidden />
        </div>
        <span className="text-[9px] font-mono text-sky-300 mt-1">WIND → {compassLabel(blowsTo)}</span>
        <span className="text-[9px] font-mono text-orange-300">SPREAD {incident.spread_azimuth_deg}° {compassLabel(incident.spread_azimuth_deg)}</span>
      </div>

      {/* Zoom / reset */}
      <div className="absolute right-2.5 bottom-7 z-[1000] flex flex-col gap-1.5">
        {[
          { icon: ZoomIn, label: "Zoom in", fn: () => apiRef.current?.zoomIn() },
          { icon: ZoomOut, label: "Zoom out", fn: () => apiRef.current?.zoomOut() },
          { icon: RotateCcw, label: "Reset view", fn: () => apiRef.current?.reset() },
          { icon: Mountain, label: basemap === "dark" ? "Terrain basemap" : "Dark ops basemap", fn: () => setBasemap((b) => (b === "dark" ? "terrain" : "dark")), active: basemap === "terrain" },
        ].map(({ icon: Icon, label, fn, active }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <Button size="icon" variant="secondary" aria-label={label} aria-pressed={active} className={`h-9 w-9 lg:h-8 lg:w-8 bg-zinc-950/90 border border-zinc-800 hover:bg-zinc-800 ${active ? "text-orange-400 border-orange-500/60" : "text-zinc-200"}`} onClick={fn}>
                <Icon className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Bottom-left: coordinates + legend */}
      <div className="absolute left-2.5 bottom-7 z-[1000] flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2 bg-zinc-950/85 backdrop-blur-md border border-zinc-800 px-2 py-1 rounded-md text-[10px] font-mono text-zinc-400">
          <Navigation className="w-3 h-3 text-zinc-300 -rotate-45" />
          {formatCoordinate(incident.center_lat, incident.center_lng)}
        </div>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 bg-zinc-950/85 backdrop-blur-md border border-zinc-800 px-2 py-1 rounded-md text-[10px] text-zinc-300">
          <span className="flex items-center gap-1"><i className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500" />Hotspot (FRP)</span>
          <span className="flex items-center gap-1"><i className="inline-block w-3 h-0.5 bg-red-500" />Impassable {impassable ? `(${impassable})` : ""}</span>
          <span className="flex items-center gap-1"><i className="inline-block w-3 h-0.5 bg-emerald-500" />Clear {clear ? `(${clear})` : ""}</span>
          <span className="flex items-center gap-1"><i className="inline-block w-3 h-0.5 bg-slate-500" />Pending</span>
        </div>
      </div>
    </div>
  );
}
