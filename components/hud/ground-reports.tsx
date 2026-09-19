"use client";

import React from "react";
import type { CitizenGroundReport } from "@/lib/types/incident";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loader2, MessageSquareWarning, Phone, Radio, Smartphone, Globe, Plus } from "lucide-react";

interface GroundReportsProps {
  reports: CitizenGroundReport[];
  onOpenReportDialog: () => void;
}

const CHANNEL_ICON: Record<NonNullable<CitizenGroundReport["channel"]>, React.ReactNode> = {
  web: <Globe className="w-3 h-3" />,
  ussd: <Phone className="w-3 h-3" />,
  dispatch: <Radio className="w-3 h-3" />,
  field_unit: <Smartphone className="w-3 h-3" />,
};

export function GroundReports({ reports, onOpenReportDialog }: GroundReportsProps) {
  return (
    <Card className="border-zinc-800 bg-zinc-950/70">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
              <MessageSquareWarning className="w-4 h-4 text-orange-400" /> Ground reports
            </CardTitle>
            <CardDescription>Citizen, dispatch and USSD reports verified by Jev `Noul` against satellite hotspots and wind.</CardDescription>
          </div>
          <Button size="sm" variant="emergency" className="h-8 text-[11px] gap-1 shrink-0" onClick={onOpenReportDialog}>
            <Plus className="w-3.5 h-3.5" /> Report smoke
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-1">
        <ScrollArea className="h-[220px] pr-2">
          <div className="space-y-2">
            {reports.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No reports yet.</p>}
            {reports.map((r, i) => (
              <div key={r.id}>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200 min-w-0">
                      <span className="text-zinc-500">{CHANNEL_ICON[r.channel ?? "web"]}</span>
                      <span className="truncate">{r.reporterName}</span>
                      <span className="text-[10px] font-normal text-muted-foreground shrink-0">{r.timestamp}</span>
                    </span>
                    {r.pending ? (
                      <Badge variant="secondary" className="text-[10px] py-0 gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Jev
                      </Badge>
                    ) : r.jevNoulScore !== undefined ? (
                      <Badge variant={r.verifiedByJev ? "success" : "secondary"} className="text-[10px] py-0 font-mono">
                        {r.verifiedByJev ? "VERIFIED" : "UNVERIFIED"} {Math.round(r.jevNoulScore * 100)}%
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] py-0">
                        queued
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1.5 text-[11px] text-zinc-300 leading-relaxed">“{r.text}”</p>
                </div>
                {i < reports.length - 1 && <Separator className="my-2 opacity-0" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
