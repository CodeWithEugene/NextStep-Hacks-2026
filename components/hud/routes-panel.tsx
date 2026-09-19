"use client";

import React from "react";
import type { EvacuationRoute } from "@/lib/types/incident";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Route, ShieldAlert, ShieldCheck, TriangleAlert, CircleDashed } from "lucide-react";

interface RoutesPanelProps {
  routes: EvacuationRoute[];
  selectedRouteId?: string | null;
  onSelect: (route: EvacuationRoute) => void;
}

const STATUS: Record<EvacuationRoute["statusBadge"], { badge: "destructive" | "warning" | "success" | "secondary"; icon: React.ReactNode; bar: string }> = {
  IMPASSABLE: { badge: "destructive", icon: <ShieldAlert className="w-3.5 h-3.5 text-red-400" />, bar: "bg-red-500" },
  HAZARDOUS: { badge: "warning", icon: <TriangleAlert className="w-3.5 h-3.5 text-amber-400" />, bar: "bg-amber-500" },
  CLEAR: { badge: "success", icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />, bar: "bg-emerald-500" },
  PENDING: { badge: "secondary", icon: <CircleDashed className="w-3.5 h-3.5 text-slate-400" />, bar: "bg-slate-500" },
};

export function RoutesPanel({ routes, selectedRouteId, onSelect }: RoutesPanelProps) {
  return (
    <Card className="border-zinc-800 bg-zinc-950/70">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
          <Route className="w-4 h-4 text-orange-400" /> Evacuation corridors
        </CardTitle>
        <CardDescription>Jev `Score` hazard, Level 1 (clear) → Level 5 (impassable). Tap to focus on the map.</CardDescription>
      </CardHeader>
      <CardContent className="pt-1 space-y-2">
        {routes.map((r) => {
          const s = STATUS[r.statusBadge];
          const selected = r.id === selectedRouteId;
          const pct = r.evaluated ? (r.hazardScore / 4) * 100 : 0;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelect(r)}
              aria-pressed={selected}
              className={cn(
                "w-full text-left rounded-lg border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected ? "border-orange-500/60 bg-orange-950/20" : "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {s.icon}
                  <span className="text-xs font-semibold text-zinc-100 truncate">{r.name}</span>
                </div>
                <Badge variant={s.badge} className="text-[10px] py-0 shrink-0">
                  {r.statusBadge}
                </Badge>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Progress value={pct} className="h-1.5 flex-1" indicatorClassName={s.bar} aria-label={`Hazard ${r.hazardScore.toFixed(1)} of 4`} />
                <span className="font-mono text-[10px] text-zinc-400 tabular-nums w-16 text-right">
                  {r.evaluated ? `L${Math.round(r.hazardScore) + 1} · ${r.hazardScore.toFixed(2)}` : "pending"}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground line-clamp-2">{r.chokepointDesc}</p>
              {r.evaluated && (
                <p className="mt-1 text-[10px] font-mono text-zinc-500">
                  conf {Math.round(r.confidence * 100)}% · {r.latencyMs ? `${r.latencyMs} ms` : ""} · {r.source === "jev" ? "jev-latest" : "fallback"}
                </p>
              )}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
