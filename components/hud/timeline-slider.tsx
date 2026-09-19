"use client";

import React from "react";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TimelinePoint } from "@/lib/types/incident";
import { Clock3 } from "lucide-react";

interface TimelineSliderProps {
  value: number;
  onChange: (hours: number) => void;
  acresNow: number;
  timeline: TimelinePoint[];
}

function projectedAcres(hours: number, acresNow: number, timeline: TimelinePoint[]): number {
  if (hours <= 0) return acresNow;
  const plus1 = timeline.find((t) => t.hour === "+1h")?.acres ?? acresNow * 1.18;
  const plus2 = timeline.find((t) => t.hour === "+2h")?.acres ?? acresNow * 1.4;
  if (hours <= 1) return Math.round(acresNow + (plus1 - acresNow) * hours);
  if (hours <= 2) return Math.round(plus1 + (plus2 - plus1) * (hours - 1));
  return Math.round(plus2 + (plus2 - plus1) * (hours - 2));
}

export function TimelineSlider({ value, onChange, acresNow, timeline }: TimelineSliderProps) {
  const acres = projectedAcres(value, acresNow, timeline);
  const marks = [0, 1, 2, 3, 4, 5, 6];
  return (
    <Card className="border-zinc-800 bg-zinc-950/70">
      <CardContent className="p-3.5">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
            <Clock3 className="w-3.5 h-3.5 text-orange-400" />
            Perimeter projection
            <span className="hidden sm:inline text-[10px] font-normal text-muted-foreground">· scrub forward along the spread azimuth</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={value > 0 ? "warning" : "secondary"} className="font-mono text-[10px] py-0">
              {value === 0 ? "NOW" : `T+${value}h`}
            </Badge>
            <span className="font-mono text-xs text-zinc-300 tabular-nums">
              ~{acres.toLocaleString()} <span className="text-muted-foreground">ac</span>
            </span>
          </div>
        </div>
        <Slider
          value={[value]}
          min={0}
          max={6}
          step={0.5}
          onValueChange={(v) => onChange(v[0] ?? 0)}
          aria-label="Fire perimeter projection in hours"
          className="py-1"
        />
        <div className="mt-1.5 flex justify-between text-[10px] font-mono text-muted-foreground">
          {marks.map((m) => (
            <span key={m} className={m === Math.round(value) ? "text-orange-400 font-bold" : ""}>
              {m === 0 ? "Now" : `+${m}h`}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
