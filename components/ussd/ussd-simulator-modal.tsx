"use client";

import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Copy, Loader2, Phone, PhoneOff, Signal } from "lucide-react";

interface UssdSimulatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SHORTCODE = "*384*2026#";

/**
 * A faithful Africa's Talking USSD client simulator. It POSTs the exact
 * form-encoded payload the gateway sends (sessionId, serviceCode, phoneNumber,
 * text with "*"-joined history) to /api/ussd and renders CON/END screens.
 */
export function UssdSimulatorModal({ open, onOpenChange }: UssdSimulatorModalProps) {
  const [screen, setScreen] = useState<string>("");
  const [history, setHistory] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ended, setEnded] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const sessionId = useRef(`sim-${Math.random().toString(36).slice(2, 10)}`);
  const callbackUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/ussd`;

  const send = async (nextHistory: string[]) => {
    setLoading(true);
    const t0 = performance.now();
    try {
      const body = new URLSearchParams({
        sessionId: sessionId.current,
        serviceCode: SHORTCODE,
        phoneNumber: "+254700000000",
        networkCode: "63902",
        text: nextHistory.join("*"),
      });
      const res = await fetch("/api/ussd", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
      const text = await res.text();
      setLatency(Math.round(performance.now() - t0));
      setEnded(text.startsWith("END"));
      setScreen(text.replace(/^(CON|END)\s?/, ""));
      setHistory(nextHistory);
    } catch {
      setScreen("Network error. USSD gateway unreachable.");
      setEnded(true);
    } finally {
      setLoading(false);
    }
  };

  const dial = () => {
    sessionId.current = `sim-${Math.random().toString(36).slice(2, 10)}`;
    setEnded(false);
    setInput("");
    void send([]);
  };

  useEffect(() => {
    if (open) dial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const reply = () => {
    if (!input.trim() || ended) return;
    const next = [...history, input.trim()];
    setInput("");
    void send(next);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(callbackUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[calc(100vw-1.5rem)] p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b border-zinc-800">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Phone className="w-5 h-5 text-emerald-400" /> USSD emergency access · {SHORTCODE}
            <Badge variant="success" className="text-[10px] py-0">
              Africa&apos;s Talking
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Feature-phone access with zero internet. Every reply below is a live round trip to <code className="font-mono">/api/ussd</code>; road status and report verification run through Jev on the server.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-0">
          {/* Phone */}
          <div className="p-5 flex justify-center bg-zinc-950">
            <div className="w-[240px] rounded-[28px] border-2 border-zinc-700 bg-zinc-900 p-3 shadow-2xl">
              <div className="flex items-center justify-between px-2 text-[9px] font-mono text-zinc-400">
                <span className="flex items-center gap-1">
                  <Signal className="w-3 h-3" /> Safaricom 2G
                </span>
                <span>{latency !== null ? `${latency} ms` : "--"}</span>
              </div>
              <div className="mt-2 h-[250px] rounded-xl bg-[#c7d7b3] text-[#1b2a12] font-mono text-[11.5px] leading-snug p-3 whitespace-pre-wrap overflow-y-auto shadow-inner" aria-live="polite" role="log">
                {loading ? (
                  <span className="flex items-center gap-1.5 text-[#3a5a26]">
                    <Loader2 className="w-3 h-3 animate-spin" /> USSD code running…
                  </span>
                ) : (
                  screen || `Dial ${SHORTCODE}`
                )}
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && reply()}
                  disabled={ended || loading}
                  placeholder={ended ? "Session ended" : "Reply…"}
                  aria-label="USSD reply"
                  className="flex-1 h-9 rounded-md border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-100 placeholder:text-zinc-500 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                {ended ? (
                  <Button size="sm" className="h-9 bg-emerald-600 hover:bg-emerald-500 text-white" onClick={dial}>
                    <Phone className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Button size="sm" className="h-9" onClick={reply} disabled={loading || !input.trim()}>
                    Send
                  </Button>
                )}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((k) => (
                  <button
                    key={k}
                    type="button"
                    disabled={ended || loading}
                    onClick={() => setInput((v) => v + k)}
                    className="h-8 rounded-md bg-zinc-800 text-zinc-200 text-xs font-semibold hover:bg-zinc-700 disabled:opacity-40"
                    aria-label={`Key ${k}`}
                  >
                    {k}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex justify-center">
                <Button size="sm" variant="ghost" className="h-7 text-[10px] text-red-400 hover:text-red-300 gap-1" onClick={() => { setEnded(true); setScreen("Call ended."); }}>
                  <PhoneOff className="w-3 h-3" /> End
                </Button>
              </div>
            </div>
          </div>

          {/* Integration details */}
          <div className="p-5 space-y-3 border-t md:border-t-0 md:border-l border-zinc-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Africa&apos;s Talking configuration</h4>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 space-y-2">
              <div className="text-[10px] font-mono text-muted-foreground">Callback URL (POST)</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[11px] font-mono text-emerald-300 break-all">{callbackUrl}</code>
                <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={copy} aria-label="Copy callback URL">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
            <ul className="text-[11px] text-zinc-300 space-y-1.5 list-disc pl-4">
              <li>Service code <span className="font-mono text-zinc-100">{SHORTCODE}</span> (sandbox: create a channel and point it at the URL above).</li>
              <li>Gateway sends <span className="font-mono">sessionId, serviceCode, phoneNumber, networkCode, text</span> as form-encoded fields; menu history is <span className="font-mono">*</span>-joined in <span className="font-mono">text</span>.</li>
              <li>Responses begin with <span className="font-mono">CON</span> (continue) or <span className="font-mono">END</span> (terminate) and are capped near 182 characters.</li>
              <li>Menu 2 scores every corridor with Jev live; menu 3 runs Jev Noul verification on the caller&apos;s report, all under the gateway timeout.</li>
            </ul>
            <Separator />
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {[
                ["1", "Fire threat now"],
                ["2", "Safe evacuation roads"],
                ["3", "Report fire or smoke"],
                ["4", "Shelter & emergency lines"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-md border border-zinc-800 bg-zinc-900/40 px-2.5 py-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-zinc-800 text-zinc-100 text-[10px] font-bold flex items-center justify-center">{k}</span>
                  <span className="text-zinc-300">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
