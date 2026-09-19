"use client";

import React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface SpreadChartProps {
  timelineData: {
    hour: string;
    acres: number;
    frp_mw: number;
    spread_rate: number;
  }[];
}

const chartConfig = {
  acres: {
    label: "Acres Burned",
    color: "#f97316",
  },
  frp_mw: {
    label: "Fire Radiative Power (MW)",
    color: "#ef4444",
  },
} satisfies ChartConfig;

export function SpreadChart({ timelineData }: SpreadChartProps) {
  return (
    <Card className="border-zinc-800 bg-zinc-950/70">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-zinc-100">
              Fire Radiative Power & Spread Timeline
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              NASA VIIRS thermal intensity & projected perimeter expansion
            </CardDescription>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-orange-400 border border-zinc-800">
            NASA FIRMS + Open-Meteo
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
          <AreaChart data={timelineData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="fillAcres" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillFrp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              stroke="#71717a"
              fontSize={10}
            />
            <YAxis hide domain={["auto", "auto"]} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Area
              dataKey="acres"
              type="monotone"
              fill="url(#fillAcres)"
              stroke="#f97316"
              strokeWidth={2}
              name="acres"
            />
            <Area
              dataKey="frp_mw"
              type="monotone"
              fill="url(#fillFrp)"
              stroke="#ef4444"
              strokeWidth={1.5}
              name="frp_mw"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
