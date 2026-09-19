"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Accessibility, Volume2, Eye, Type, Activity, VolumeX, Check } from "lucide-react";

interface AccessibilityWidgetProps {
  currentAlertText?: string;
}

export function AccessibilityWidget({ currentAlertText }: AccessibilityWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontScale, setFontScale] = useState<"normal" | "large" | "xlarge">("normal");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Apply high contrast to document root
  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }, [highContrast]);

  // Apply font scale
  useEffect(() => {
    document.documentElement.classList.remove("font-scale-large", "font-scale-xlarge");
    if (fontScale === "large") {
      document.documentElement.classList.add("font-scale-large");
    } else if (fontScale === "xlarge") {
      document.documentElement.classList.add("font-scale-xlarge");
    }
  }, [fontScale]);

  // Apply reduced motion
  useEffect(() => {
    if (reducedMotion) {
      document.documentElement.classList.add("reduced-motion");
    } else {
      document.documentElement.classList.remove("reduced-motion");
    }
  }, [reducedMotion]);

  // Text to speech announcer
  const speakCurrentAlert = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text to speech is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const message =
      currentAlertText ||
      "Emergency Broadcast Alert: County Route 4 Pine Valley Pass is rated Impassable by TypeSafe Jev AI due to spot fires and heavy smoke. Civilians are directed to evacuate southbound via the Pine Crest Alternate Route.";

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.95; // Slightly slower for clarity
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <>
      {/* Floating Trigger Button at Bottom-Right */}
      <div className="fixed bottom-safe right-4 z-40 flex items-center gap-2">
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          aria-label="Accessibility Options"
          className="h-11 w-11 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-900/50 border-2 border-blue-400 focus-visible:ring-4 focus-visible:ring-blue-400/50 active:scale-95"
          title="Accessibility Options (High Contrast, Large Text, Speech Alerts)"
        >
          <Accessibility className="w-5 h-5" />
        </Button>
      </div>

      {/* Screen Reader Live Region */}
      <div className="sr-only" aria-live="assertive">
        {currentAlertText}
      </div>

      {/* Accessibility Configuration Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-zinc-100">
              <Accessibility className="w-5 h-5 text-blue-400" />
              Tactical Accessibility Suite
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Emergency usability adjustments for smoke-impaired vision, power outages, and sensory accessibility.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 1. Speech Synthesis / Voice Alerts */}
            <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  Voice Alert Reader (TTS)
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Audibly reads current active road closures & instructions.
                </p>
              </div>
              <Button
                size="sm"
                variant={isSpeaking ? "destructive" : "secondary"}
                onClick={speakCurrentAlert}
                className="h-8 text-xs font-semibold"
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 mr-1" /> Stop
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 mr-1" /> Read Aloud
                  </>
                )}
              </Button>
            </div>

            {/* 2. High Contrast Mode */}
            <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-yellow-400" />
                  High Contrast Tactical View
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Maximum contrast for bright outdoor glare or smoky environments.
                </p>
              </div>
              <Button
                size="sm"
                variant={highContrast ? "default" : "outline"}
                onClick={() => setHighContrast(!highContrast)}
                className="h-8 text-xs border-zinc-700"
              >
                {highContrast ? <Check className="w-3.5 h-3.5 mr-1" /> : null}
                {highContrast ? "Enabled" : "Enable"}
              </Button>
            </div>

            {/* 3. Text Scaling */}
            <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/60">
              <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5 mb-2">
                <Type className="w-4 h-4 text-sky-400" />
                Font Scaling Engine
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant={fontScale === "normal" ? "secondary" : "outline"}
                  onClick={() => setFontScale("normal")}
                  className="h-8 text-xs border-zinc-700"
                >
                  Normal (100%)
                </Button>
                <Button
                  size="sm"
                  variant={fontScale === "large" ? "secondary" : "outline"}
                  onClick={() => setFontScale("large")}
                  className="h-8 text-xs border-zinc-700 font-semibold"
                >
                  Large (125%)
                </Button>
                <Button
                  size="sm"
                  variant={fontScale === "xlarge" ? "secondary" : "outline"}
                  onClick={() => setFontScale("xlarge")}
                  className="h-8 text-xs border-zinc-700 font-bold"
                >
                  XL (150%)
                </Button>
              </div>
            </div>

            {/* 4. Reduced Motion */}
            <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-purple-400" />
                  Reduced Motion
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Disables pulsing radar waves and map animations.
                </p>
              </div>
              <Button
                size="sm"
                variant={reducedMotion ? "default" : "outline"}
                onClick={() => setReducedMotion(!reducedMotion)}
                className="h-8 text-xs border-zinc-700"
              >
                {reducedMotion ? "Active" : "Standard"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
