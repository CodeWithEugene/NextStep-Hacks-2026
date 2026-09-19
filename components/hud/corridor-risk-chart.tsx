"use client";

import React from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { EvacuationRoute } from "@/lib/types/incident";

const LEVELS = ["L1 Clear", "L2 Advisory", "L3 Moderate", "L4 Severe", "L5 Impassable"];
const LEVEL_COLORS = ["var(--color-chart-4)", "#84cc16", "var(--color-chart-3)", "#f97316", "var(--color-chart-2)"];

const chartConfig = {
  prob: { label: "Probability", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

export function CorridorRiskChart({ route }: { route: EvacuationRoute | null }) {
  const probs = route?.probabilities ?? {};
  const data = LEVELS.map((level, i) => ({ level, prob: Math.round((probs[String(i)] ?? 0) * 100) }));
  const evaluated = Boolean(route?.evaluated);

  return (
    <Card className="border-zinc-800 bg-zinc-950/70">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold text-zinc-100">Jev calibrated hazard distribution</CardTitle>
            <CardDescription className="line-clamp-1">
              {route ? route.name : "Select a corridor"}
              {evaluated && route && (
                <>
                  {" "}· expected <span className="font-mono text-red-300 font-bold">{route.hazardScore.toFixed(2)}</span>/4 · conf {Math.round(route.confidence * 100)}%
                </>
              )}
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-[9px] text-emerald-400 shrink-0">
            Jev `Score`
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {evaluated ? (
          <ChartContainer config={chartConfig} className="h-[180px] w-full aspect-auto">
            <BarChart data={data} margin={{ left: 0, right: 0, top: 10, bottom: 0 }} accessibilityLayer>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
              <XAxis dataKey="level" tickLine={false} axisLine={false} fontSize={9} interval={0} />
              <YAxis hide domain={[0, 100]} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator formatter={(v) => `${v}%`} />} />
              <Bar dataKey="prob" radius={[4, 4, 0, 0]} name="prob">
                {data.map((_, i) => (
                  <Cell key={i} fill={LEVEL_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="h-[180px] flex items-center justify-center text-xs text-muted-foreground text-center px-6">
            Run the Jev evaluation to see the probability mass across the five hazard levels for this corridor.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
