"use client";

import React from "react";
import type { JevDecisionLog } from "@/lib/types/jev";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Cpu, Loader2 } from "lucide-react";

interface JevDecisionStreamProps {
  logs: JevDecisionLog[];
  isLoading?: boolean;
  phase?: string;
  className?: string;
}

const PRIMITIVE_BADGE: Record<JevDecisionLog["primitive"], string> = {
  Noul: "bg-sky-950/60 text-sky-300 border-sky-800",
  Score: "bg-red-950/60 text-red-300 border-red-800",
  Choice: "bg-emerald-950/60 text-emerald-300 border-emerald-800",
};

export function JevDecisionStream({ logs, isLoading, phase, className }: JevDecisionStreamProps) {
  const liveCount = logs.filter((l) => l.source === "jev").length;
  const avgLatency = logs.filter((l) => l.latencyMs).reduce((a, l) => a + (l.latencyMs ?? 0), 0) / Math.max(1, logs.filter((l) => l.latencyMs).length);
  return (
    <Card className={`border-zinc-800 bg-zinc-950/70 flex flex-col ${className ?? ""}`}>
      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-orange-400" /> Jev System One decision stream
            </CardTitle>
            <CardDescription>
              Typed judgments from <span className="font-mono">jev-latest</span> · {liveCount} live{avgLatency ? ` · avg ${Math.round(avgLatency)} ms` : ""}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5 shrink-0" aria-live="polite">
            {isLoading ? (
              <Badge variant="tactical" className="text-[9px] py-0 gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> {phase?.toUpperCase()}
              </Badge>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                LIVE API
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-1 flex-1 min-h-0">
        <ScrollArea className="h-[300px] lg:h-[400px] pr-2">
          {logs.length === 0 ? (
            <div className="text-center py-10 text-xs text-muted-foreground px-4">
              {isLoading ? "Contacting TypeSafe Jev…" : "No decisions yet. Run the tactical evaluation to stream Noul, Score and Choice judgments."}
            </div>
          ) : (
            <ol className="space-y-2" aria-label="Jev decision log">
              {logs.map((log) => (
                <li key={log.id} className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/50 animate-in fade-in-0 slide-in-from-top-1 duration-300">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Badge variant="secondary" className={`text-[9px] py-0 border ${PRIMITIVE_BADGE[log.primitive]}`}>
                        {log.primitive}
                      </Badge>
                      <span className="text-xs font-semibold text-zinc-200 truncate">{log.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">{log.timestamp}</span>
                  </div>
                  <div className="text-xs font-mono font-semibold text-orange-300 break-words">{log.result}</div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Progress value={log.confidence * 100} className="h-1 flex-1" indicatorClassName={log.primitive === "Noul" ? "bg-sky-500" : log.primitive === "Score" ? "bg-red-500" : "bg-emerald-500"} />
                    <span className="text-[10px] font-mono text-zinc-400 tabular-nums">{Math.round(log.confidence * 100)}%</span>
                    {log.latencyMs !== undefined && log.latencyMs > 0 && <span className="text-[10px] font-mono text-zinc-500">{log.latencyMs} ms</span>}
                    {log.source && (
                      <span className={`text-[9px] font-mono ${log.source === "jev" ? "text-emerald-500" : "text-amber-500"}`}>{log.source === "jev" ? "jev" : "fallback"}</span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">{log.details}</p>
                </li>
              ))}
            </ol>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
