"use client";

import React from "react";
import type { WildfireIncident } from "@/lib/types/incident";
import { SCENARIO_LIST } from "@/lib/scenarios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FileText, Flame, Phone } from "lucide-react";

interface IncidentHeaderProps {
  incident: WildfireIncident;
  selectedScenarioId: string;
  onSelectScenario: (id: string) => void;
  onOpenReportModal: () => void;
  onOpenUssdModal: () => void;
  lastRunAt?: string | null;
}

export function IncidentHeader({ incident, selectedScenarioId, onSelectScenario, onOpenReportModal, onOpenUssdModal, lastRunAt }: IncidentHeaderProps) {
  return (
    <header className="w-full bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 px-3 sm:px-4 py-2.5 sticky top-0 z-30">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-orange-600/20 border border-orange-500/40 flex items-center justify-center shrink-0 shadow-inner">
            <Flame className="w-6 h-6 text-orange-500 animate-pulse" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-zinc-100 tracking-tight flex items-center gap-1.5">
                PyroShield AI
                <span className="hidden sm:inline text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">Tactical command</span>
              </h1>
              {incident.weather.red_flag_active && (
                <Badge variant="destructive" className="text-[10px] py-0 animate-pulse">
                  RED FLAG WARNING
                </Badge>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="tactical" className="text-[10px] py-0 cursor-help">
                    JEV SYSTEM ONE {lastRunAt ? `· ${lastRunAt}` : "· READY"}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>TypeSafe Jev (jev-latest) answers typed Noul / Score / Choice questions server-side.</TooltipContent>
              </Tooltip>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              <span className="text-zinc-300 font-medium">{incident.name}</span> <span className="font-mono">{incident.incident_number}</span> · {incident.location_name} ·{" "}
              <span className="text-zinc-300 font-mono">{incident.acres_burned.toLocaleString()} ac</span> · {incident.containment_pct}% contained
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-full sm:w-56">
            <Select value={selectedScenarioId} onValueChange={onSelectScenario}>
              <SelectTrigger className="h-9 text-xs" aria-label="Select incident scenario">
                <SelectValue placeholder="Select incident" />
              </SelectTrigger>
              <SelectContent>
                {SCENARIO_LIST.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} · {s.incident_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" variant="outline" className="h-9 text-xs gap-1.5" onClick={onOpenReportModal}>
            <FileText className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden sm:inline">Export</span> ICS-209
          </Button>
          <Button size="sm" variant="outline" className="h-9 text-xs gap-1.5" onClick={onOpenUssdModal}>
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">USSD</span> *384*2026#
          </Button>
        </div>
      </div>
    </header>
  );
}
