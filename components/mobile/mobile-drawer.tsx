"use client";

import React from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export type MobileTab = "telemetry" | "routes" | "jev";

interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  incidentName: string;
  telemetry: React.ReactNode;
  routes: React.ReactNode;
  jev: React.ReactNode;
}

/** Slide-up bottom sheet holding the sidebars on viewports below lg. */
export function MobileDrawer({ open, onOpenChange, tab, onTabChange, incidentName, telemetry, routes, jev }: MobileDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[82dvh] max-h-[82dvh] p-0 flex flex-col rounded-t-2xl pb-safe">
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-zinc-700" aria-hidden />
        <SheetHeader className="px-4 pt-2 pb-2 text-left">
          <SheetTitle className="text-sm">{incidentName}</SheetTitle>
          <SheetDescription className="text-xs">Telemetry, corridor status and live Jev decisions</SheetDescription>
        </SheetHeader>
        <Tabs value={tab} onValueChange={(v) => onTabChange(v as MobileTab)} className="flex-1 min-h-0 flex flex-col px-3">
          <TabsList className="grid grid-cols-3 w-full h-10">
            <TabsTrigger value="telemetry" className="text-xs h-8">Telemetry</TabsTrigger>
            <TabsTrigger value="routes" className="text-xs h-8">Routes</TabsTrigger>
            <TabsTrigger value="jev" className="text-xs h-8">Jev decisions</TabsTrigger>
          </TabsList>
          <ScrollArea className="flex-1 min-h-0 -mx-1 px-1">
            <TabsContent value="telemetry" className="space-y-3 pb-6 mt-3">{telemetry}</TabsContent>
            <TabsContent value="routes" className="space-y-3 pb-6 mt-3">{routes}</TabsContent>
            <TabsContent value="jev" className="space-y-3 pb-6 mt-3">{jev}</TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
