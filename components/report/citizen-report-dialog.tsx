"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WildfireIncident } from "@/lib/types/incident";
import { Flame, Loader2, Send } from "lucide-react";

export interface NewReportInput {
  text: string;
  reporterName: string;
  latitude: number;
  longitude: number;
}

interface CitizenReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incident: WildfireIncident;
  onSubmit: (report: NewReportInput) => Promise<void> | void;
}

const PRESETS = [
  "Smoke crossing the road, visibility under 50 feet, cars turning around.",
  "Embers landing on rooftops, small grass fire started next to the driveway.",
  "Road is clear, light haze only, traffic moving freely.",
  "Trees crowning on the ridge above the highway, flames visible.",
];

export function CitizenReportDialog({ open, onOpenChange, incident, onSubmit }: CitizenReportDialogProps) {
  const [text, setText] = useState("");
  const [reporter, setReporter] = useState("Citizen (web)");
  const [locationKey, setLocationKey] = useState<string>("route-0");
  const [submitting, setSubmitting] = useState(false);

  const locations: { key: string; label: string; lat: number; lng: number }[] = [
    ...incident.routes.map((r, i) => {
      const mid = r.points[Math.floor(r.points.length / 2)];
      return { key: `route-${i}`, label: `On ${r.name}`, lat: mid[0], lng: mid[1] };
    }),
    ...incident.assets.map((a) => ({ key: `asset-${a.id}`, label: `Near ${a.name}`, lat: a.latitude, lng: a.longitude })),
    { key: "center", label: "Near fire origin", lat: incident.center_lat, lng: incident.center_lng },
  ];

  const submit = async () => {
    const loc = locations.find((l) => l.key === locationKey) ?? locations[0];
    if (text.trim().length < 3) return;
    setSubmitting(true);
    try {
      await onSubmit({ text: text.trim(), reporterName: reporter, latitude: loc.lat + (Math.random() - 0.5) * 0.004, longitude: loc.lng + (Math.random() - 0.5) * 0.004 });
      setText("");
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[calc(100vw-1.5rem)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" /> Report smoke or spot fire
          </DialogTitle>
          <DialogDescription>
            Your report is cross-checked by TypeSafe Jev against NASA satellite hotspots and the wind vector in under a second, then placed on the commander's map.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="report-location" className="text-xs font-medium text-zinc-300">
              Where are you?
            </label>
            <Select value={locationKey} onValueChange={setLocationKey}>
              <SelectTrigger id="report-location" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l.key} value={l.key}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="report-text" className="text-xs font-medium text-zinc-300">
              What do you see?
            </label>
            <textarea
              id="report-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              maxLength={400}
              placeholder="Describe the smoke, flames, or road conditions…"
              className="w-full rounded-md border border-input bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setText(p)}
                  className="text-[10px] rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-zinc-300 hover:bg-zinc-800 text-left"
                >
                  {p.slice(0, 44)}…
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="report-name" className="text-xs font-medium text-zinc-300">
              Reporter
            </label>
            <input
              id="report-name"
              value={reporter}
              onChange={(e) => setReporter(e.target.value)}
              maxLength={60}
              className="w-full h-10 rounded-md border border-input bg-zinc-950 px-3 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="emergency" onClick={submit} disabled={submitting || text.trim().length < 3} className="gap-1.5 min-h-11 sm:min-h-9">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit to Jev verification
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
