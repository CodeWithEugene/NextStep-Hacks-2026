"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { DispatchResult } from "@/hooks/use-jev-evaluation";
import { Crosshair, Megaphone, Target } from "lucide-react";

export function DispatchCard({ dispatch }: { dispatch: DispatchResult | null }) {
  if (!dispatch) {
    return (
      <Card className="border-zinc-800 bg-zinc-950/70">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
            <Crosshair className="w-4 h-4 text-orange-400" /> Tactical order
          </CardTitle>
          <CardDescription>Jev `Choice` arbitration appears here after evaluation.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  const postureVariant = dispatch.posture === "shelter_in_place" ? "warning" : dispatch.posture === "immediate_mandatory_evacuation" ? "destructive" : "secondary";
  return (
    <Card className="border-orange-900/50 bg-orange-950/10">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
            <Crosshair className="w-4 h-4 text-orange-400" /> Tactical order
          </CardTitle>
          <Badge variant={dispatch.source === "jev" ? "tactical" : "secondary"} className="text-[9px] py-0">
            {dispatch.source === "jev" ? `${dispatch.model} · ${dispatch.latencyMs} ms` : "fallback"}
          </Badge>
        </div>
        <CardDescription>Operations section chief arbitration across resources, assets and posture.</CardDescription>
      </CardHeader>
      <CardContent className="pt-1 space-y-3">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-red-400 shrink-0" />
          <Badge variant={postureVariant} className="text-[10px] font-mono">
            {dispatch.postureLabel}
          </Badge>
          <span className="text-[10px] font-mono text-zinc-500 ml-auto">{Math.round(dispatch.postureConfidence * 100)}%</span>
        </div>
        <Separator />
        <div>
          <div className="text-xs font-bold text-orange-300">{dispatch.actionTitle}</div>
          <div className="mt-1 flex items-center gap-2">
            <Progress value={dispatch.confidence * 100} className="h-1.5 flex-1" indicatorClassName="bg-orange-500" />
            <span className="font-mono text-[10px] text-zinc-400 tabular-nums">{Math.round(dispatch.confidence * 100)}%</span>
          </div>
        </div>
        <div className="flex items-start gap-2 text-xs">
          <Target className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
          <div>
            <span className="text-zinc-400">Priority asset: </span>
            <span className="text-zinc-100 font-medium">{dispatch.targetAsset}</span>
            <span className="text-zinc-500 font-mono text-[10px]"> · {Math.round(dispatch.targetAssetConfidence * 100)}%</span>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{dispatch.rationale}</p>
        <div className="space-y-1">
          {Object.entries(dispatch.probabilities)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([k, p]) => (
              <div key={k} className="flex items-center gap-2 text-[10px]">
                <span className="w-40 truncate text-zinc-400 font-mono">{k.replace(/_/g, " ")}</span>
                <Progress value={p * 100} className="h-1 flex-1" indicatorClassName={k === dispatch.action ? "bg-orange-500" : "bg-zinc-600"} />
                <span className="w-8 text-right font-mono text-zinc-500 tabular-nums">{Math.round(p * 100)}%</span>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
