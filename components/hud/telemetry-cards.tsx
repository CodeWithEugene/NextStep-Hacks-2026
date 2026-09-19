"use client";

import React from "react";
import type { ThermalHotspot, WeatherTelemetry } from "@/lib/types/incident";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { compassLabel } from "@/lib/geo";
import { Droplets, Flame, Gauge, Wind } from "lucide-react";

interface TelemetryCardsProps {
  weather: WeatherTelemetry;
  hotspots: ThermalHotspot[];
  containmentPct: number;
  spreadRateMph: number;
  weatherSource?: string;
}

export function TelemetryCards({ weather, hotspots, containmentPct, spreadRateMph, weatherSource }: TelemetryCardsProps) {
  const peakFrp = hotspots.reduce((max, h) => (h.frp_mw > max ? h.frp_mw : max), 0);
  const rhCritical = weather.relative_humidity_pct < 15;
  const cards = [
    {
      icon: <Wind className="w-3.5 h-3.5 text-sky-400" />,
      label: "Wind & gusts",
      tag: `${compassLabel(weather.wind_direction_degrees)} ${weather.wind_direction_degrees}°`,
      tagClass: "text-sky-400",
      value: weather.wind_speed_mph,
      unit: "mph",
      foot: ["Peak gusts", `${weather.gusts_mph} mph`],
      tip: `Wind from ${compassLabel(weather.wind_direction_degrees)}${weatherSource ? ` · source: ${weatherSource}` : ""}`,
    },
    {
      icon: <Flame className="w-3.5 h-3.5 text-orange-500" />,
      label: "Thermal intensity",
      tag: "VIIRS 375 m",
      tagClass: "text-orange-400",
      value: Math.round(peakFrp),
      unit: "MW",
      valueClass: "text-orange-400",
      foot: ["Active hotspots", `${hotspots.length} clusters`],
      tip: "Peak Fire Radiative Power from NASA FIRMS active-fire pixels.",
    },
    {
      icon: <Droplets className="w-3.5 h-3.5 text-amber-400" />,
      label: "Relative humidity",
      tag: rhCritical ? "CRITICAL" : "LOW",
      tagClass: rhCritical ? "text-red-400" : "text-amber-400",
      value: weather.relative_humidity_pct,
      unit: "%",
      foot: ["Fuel moisture", `${weather.fuel_moisture_pct}% · ${weather.ambient_temp_f}°F`],
      tip: "Below 15% RH with fuel moisture under 6% supports extreme fire behavior.",
    },
  ];
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {cards.map((c) => (
        <Tooltip key={c.label}>
          <TooltipTrigger asChild>
            <Card className="border-zinc-800 bg-zinc-950/70 cursor-help">
              <CardContent className="p-3.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span className="flex items-center gap-1 font-medium">{c.icon} {c.label}</span>
                  <span className={`font-mono text-[10px] font-bold ${c.tagClass}`}>{c.tag}</span>
                </div>
                <div className={`text-xl font-bold font-mono tracking-tight tabular-nums ${c.valueClass ?? "text-zinc-100"}`}>
                  {c.value} <span className="text-xs font-normal text-muted-foreground">{c.unit}</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1 flex justify-between gap-2">
                  <span>{c.foot[0]}</span>
                  <span className="font-mono text-zinc-300 font-bold truncate">{c.foot[1]}</span>
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>{c.tip}</TooltipContent>
        </Tooltip>
      ))}
      <Card className="border-zinc-800 bg-zinc-950/70">
        <CardContent className="p-3.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="flex items-center gap-1 font-medium"><Gauge className="w-3.5 h-3.5 text-emerald-400" /> Containment</span>
            <span className="font-mono text-[11px] text-emerald-400 font-bold">{containmentPct}%</span>
          </div>
          <div className="mt-2 mb-1.5">
            <Progress value={containmentPct} className="h-2" indicatorClassName="bg-emerald-500" aria-label={`Containment ${containmentPct}%`} />
          </div>
          <div className="text-[11px] text-muted-foreground flex justify-between">
            <span>Rate of spread</span>
            <span className="font-mono text-zinc-300 font-bold">{spreadRateMph} mph</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
