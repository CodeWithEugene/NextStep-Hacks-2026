"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, RotateCw } from "lucide-react";

interface TriggerEvaluationBtnProps {
  onTrigger: () => void;
  isLoading: boolean;
  hasRun?: boolean;
  phase?: string;
  className?: string;
}

const PHASE_LABEL: Record<string, string> = {
  verify: "Noul · verifying ground reports…",
  corridor: "Score · rating evacuation corridors…",
  dispatch: "Choice · arbitrating tactical dispatch…",
};

export function TriggerEvaluationBtn({ onTrigger, isLoading, hasRun, phase, className }: TriggerEvaluationBtnProps) {
  return (
    <Button
      onClick={onTrigger}
      disabled={isLoading}
      variant="emergency"
      size="lg"
      aria-busy={isLoading}
      className={`w-full min-h-11 text-xs sm:text-sm font-bold gap-2 shadow-lg shadow-orange-950/50 ${className ?? ""}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="truncate">{PHASE_LABEL[phase ?? ""] ?? "Executing Jev System One…"}</span>
        </>
      ) : hasRun ? (
        <>
          <RotateCw className="w-4 h-4" /> RE-RUN LIVE JEV EVALUATION
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 text-yellow-200 animate-pulse" /> RUN LIVE JEV TACTICAL EVALUATION
        </>
      )}
    </Button>
  );
}
