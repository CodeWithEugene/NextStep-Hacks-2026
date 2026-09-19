"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CitizenGroundReport, EvacuationRoute, WildfireIncident } from "@/lib/types/incident";
import type { JevChatResponse } from "@/lib/types/jev";
import { Bot, Loader2, MessageSquare, Send, Sparkles, User } from "lucide-react";

interface TacticalChatbotProps {
  incident: WildfireIncident;
  routes: EvacuationRoute[];
  reports: CitizenGroundReport[];
}

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  meta?: { intent: string; confidence: number; latencyMs: number; source: string };
}

export function TacticalChatbot({ incident, routes, reports }: TacticalChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages([
      {
        id: "init",
        sender: "assistant",
        text: `I'm PyroShield's tactical assistant for the ${incident.name}. I answer from live incident state: corridor status, the shelter, fire behavior and what crews are protecting. Every question is routed by TypeSafe Jev in under a second and I never invent a road status.`,
      },
    ]);
  }, [incident.id, incident.name]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || isLoading) return;
    setMessages((m) => [...m, { id: `u-${Date.now()}`, sender: "user", text }]);
    if (!raw) setInput("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/jev/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text, activeIncident: { ...incident, routes, reports } }),
      });
      const data: JevChatResponse = await res.json();
      setMessages((m) => [
        ...m,
        { id: `a-${Date.now()}`, sender: "assistant", text: data.reply, meta: { intent: data.intent, confidence: data.confidence, latencyMs: data.latencyMs, source: data.source } },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: `e-${Date.now()}`, sender: "assistant", text: `I can't reach the Jev engine right now. If you are in danger call 911. Shelter: ${incident.shelter.name}, ${incident.shelter.address}.` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quick = [
    `Is ${routes[0]?.name.split(" (")[0] ?? "the main road"} open?`,
    "Where is the evacuation shelter?",
    "What are crews protecting first?",
    "I see smoke near my house, what do I do?",
  ];

  return (
    <>
      <div className="fixed bottom-safe right-[4.5rem] z-40">
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          aria-label="Open tactical AI assistant"
          className="h-11 w-11 rounded-full bg-orange-600 hover:bg-orange-500 text-white shadow-xl shadow-orange-950/50 border-2 border-orange-400 focus-visible:ring-4 focus-visible:ring-orange-400/50 active:scale-95"
        >
          <MessageSquare className="w-5 h-5" />
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md w-[calc(100vw-1.5rem)] h-[min(600px,88dvh)] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-3 border-b border-zinc-800 shrink-0 bg-zinc-900/50 text-left">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
                <Bot className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <DialogTitle className="text-sm flex items-center gap-1.5">
                  PyroShield tactical assistant
                  <Badge variant="tactical" className="text-[9px] py-0 px-1">Jev</Badge>
                </DialogTitle>
                <DialogDescription className="text-[11px]">Incident command & evacuation support · {incident.name}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0 p-4">
            <div className="space-y-3" role="log" aria-live="polite">
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                  {m.sender === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-orange-950 border border-orange-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-orange-400" />
                    </div>
                  )}
                  <div className={`max-w-[84%] rounded-xl px-3 py-2 text-xs leading-relaxed ${m.sender === "user" ? "bg-sky-700 text-white font-medium" : "bg-zinc-900 border border-zinc-800 text-zinc-200"}`}>
                    {m.text}
                    {m.meta && (
                      <div className="mt-1.5 text-[10px] text-zinc-500 font-mono flex flex-wrap items-center gap-x-2">
                        <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-orange-400" /> {m.meta.intent}</span>
                        <span>{Math.round(m.meta.confidence * 100)}%</span>
                        {m.meta.latencyMs > 0 && <span>{m.meta.latencyMs} ms</span>}
                        <span className={m.meta.source === "jev" ? "text-emerald-500" : "text-amber-500"}>{m.meta.source}</span>
                      </div>
                    )}
                  </div>
                  {m.sender === "user" && (
                    <div className="w-6 h-6 rounded-full bg-sky-900 border border-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-sky-200" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-1 font-mono">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" /> Jev is classifying your question…
                </div>
              )}
              <div ref={endRef} />
            </div>
          </ScrollArea>

          <div className="p-2.5 border-t border-zinc-800/80 bg-zinc-900/30 shrink-0">
            <div className="flex flex-wrap gap-1.5">
              {quick.map((q) => (
                <button key={q} type="button" onClick={() => send(q)} disabled={isLoading} className="text-[10px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 px-2 py-1.5 rounded-md text-left disabled:opacity-50">
                  {q}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="p-3 border-t border-zinc-800 bg-zinc-950 shrink-0 flex items-center gap-2"
          >
            <input
              type="text"
              aria-label="Ask the tactical assistant"
              placeholder="Ask about roads, shelter, fire spread…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 h-10 bg-zinc-900 border border-input rounded-md px-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <Button type="submit" size="icon" aria-label="Send" disabled={!input.trim() || isLoading} className="h-10 w-10 bg-orange-600 hover:bg-orange-500 text-white">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
