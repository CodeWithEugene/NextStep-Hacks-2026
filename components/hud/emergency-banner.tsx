"use client";

import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { EmergencyAlert } from "@/lib/alert-text";
import { AlertTriangle, Info, Loader2, ShieldCheck, Siren } from "lucide-react";

const VARIANT: Record<EmergencyAlert["level"], { variant: "emergency" | "advisory" | "safe" | "default"; icon: React.ReactNode; badge?: string }> = {
  emergency: { variant: "emergency", icon: <Siren className="animate-pulse" />, badge: "LIVE JEV" },
  advisory: { variant: "advisory", icon: <AlertTriangle />, badge: "LIVE JEV" },
  safe: { variant: "safe", icon: <ShieldCheck />, badge: "LIVE JEV" },
  running: { variant: "default", icon: <Loader2 className="animate-spin text-orange-400" /> },
  pending: { variant: "default", icon: <Info className="text-zinc-400" /> },
};

export function EmergencyBanner({ alert }: { alert: EmergencyAlert }) {
  const v = VARIANT[alert.level];
  return (
    <Alert variant={v.variant} className="border-zinc-800" aria-live={alert.level === "emergency" ? "assertive" : "polite"}>
      {v.icon}
      <AlertTitle className="flex flex-wrap items-center gap-2 text-sm">
        <span className="min-w-0">{alert.title}</span>
        {v.badge && (
          <Badge variant="outline" className="text-[9px] py-0 font-mono border-current/40">
            {v.badge}
          </Badge>
        )}
      </AlertTitle>
      <AlertDescription className={alert.level === "emergency" ? "text-red-100/90" : alert.level === "advisory" ? "text-amber-100/90" : alert.level === "safe" ? "text-emerald-100/90" : ""}>
        {alert.description}
      </AlertDescription>
    </Alert>
  );
}
