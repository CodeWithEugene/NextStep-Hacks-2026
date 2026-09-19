"use client";

import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { buildIcs209, ics209ToMarkdown, type DispatchForReport } from "@/lib/ics209";
import type { CitizenGroundReport, EvacuationRoute, WildfireIncident } from "@/lib/types/incident";
import type { JevDecisionLog } from "@/lib/types/jev";
import { Check, Copy, Download, FileText, Printer } from "lucide-react";

interface Ics209ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incident: WildfireIncident;
  routes: EvacuationRoute[];
  reports: CitizenGroundReport[];
  dispatch: DispatchForReport | null;
  logs: JevDecisionLog[];
}

export function Ics209Modal({ open, onOpenChange, incident, routes, reports, dispatch, logs }: Ics209ModalProps) {
  const [copied, setCopied] = useState(false);
  const data = useMemo(() => buildIcs209(incident, routes, reports, dispatch, logs), [incident, routes, reports, dispatch, logs]);
  const markdown = useMemo(() => ics209ToMarkdown(data), [data]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked; user can still download */
    }
  };
  const download = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ICS-209_${incident.incident_number}_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[calc(100vw-1.5rem)] max-h-[90dvh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b border-zinc-800 shrink-0">
          <DialogTitle className="flex flex-wrap items-center gap-2 text-base">
            <FileText className="w-5 h-5 text-orange-400" /> ICS-209 Incident Status Summary
            <Badge variant="tactical" className="text-[10px] py-0">
              {incident.incident_number}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Federal ICS-209 format populated from live telemetry and TypeSafe Jev judgments · {data.generatedAt}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="print-area p-5 space-y-5">
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2">Header</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                <Table>
                  <TableBody>
                    {data.header.slice(0, 6).map(([k, v]) => (
                      <TableRow key={k}>
                        <TableCell className="text-muted-foreground w-[52%]">{k}</TableCell>
                        <TableCell className="font-medium text-zinc-100">{v}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Table>
                  <TableBody>
                    {data.header.slice(6).map(([k, v]) => (
                      <TableRow key={k}>
                        <TableCell className="text-muted-foreground w-[52%]">{k}</TableCell>
                        <TableCell className="font-medium text-zinc-100">{v}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
            {data.blocks.map((b) => (
              <section key={b.no}>
                <Separator className="mb-3" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2">
                  Block {b.no} — {b.title}
                </h3>
                <Table>
                  <TableBody>
                    {b.rows.map(([k, v], i) => (
                      <TableRow key={`${b.no}-${i}`}>
                        <TableCell className="text-muted-foreground w-[34%] align-top">{k}</TableCell>
                        <TableCell className="text-zinc-100 align-top">{v}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </section>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 border-t border-zinc-800 shrink-0 gap-2 sm:gap-2 bg-zinc-950">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5" /> Print
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={download}>
            <Download className="w-3.5 h-3.5" /> Download .md
          </Button>
          <Button size="sm" className="gap-1.5" onClick={copy}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? "Copied" : "Copy to clipboard"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
