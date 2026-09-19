"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_SCENARIO_ID, getScenario } from "@/lib/scenarios";
import type { CitizenGroundReport, CriticalAsset, EvacuationRoute } from "@/lib/types/incident";
import { buildEmergencyAlert } from "@/lib/alert-text";
import { useJevEvaluation } from "@/hooks/use-jev-evaluation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { IncidentHeader } from "@/components/hud/incident-header";
import { EmergencyBanner } from "@/components/hud/emergency-banner";
import { TelemetryCards } from "@/components/hud/telemetry-cards";
import { TacticalMap } from "@/components/map/tactical-map";
import { TimelineSlider } from "@/components/hud/timeline-slider";
import { SpreadChart } from "@/components/hud/spread-chart";
import { CorridorRiskChart } from "@/components/hud/corridor-risk-chart";
import { InfrastructureTable } from "@/components/hud/infrastructure-table";
import { RoutesPanel } from "@/components/hud/routes-panel";
import { GroundReports } from "@/components/hud/ground-reports";
import { JevDecisionStream } from "@/components/jev/jev-decision-stream";
import { TriggerEvaluationBtn } from "@/components/jev/trigger-evaluation-btn";
import { DispatchCard } from "@/components/jev/dispatch-card";
import { Ics209Modal } from "@/components/report/ics209-modal";
import { CitizenReportDialog } from "@/components/report/citizen-report-dialog";
import { UssdSimulatorModal } from "@/components/ussd/ussd-simulator-modal";
import { MobileDrawer, type MobileTab } from "@/components/mobile/mobile-drawer";
import { TacticalChatbot } from "@/components/chat/tactical-chatbot";
import { AccessibilityWidget } from "@/components/accessibility/accessibility-widget";
import { Activity, Cpu, Route } from "lucide-react";

export function CommandCenter() {
  const [scenarioId, setScenarioId] = useState(DEFAULT_SCENARIO_ID);
  const incident = useMemo(() => getScenario(scenarioId), [scenarioId]);

  const [routes, setRoutes] = useState<EvacuationRoute[]>(incident.routes);
  const [reports, setReports] = useState<CitizenGroundReport[]>(incident.reports);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(incident.routes[0]?.id ?? null);
  const [timeOffset, setTimeOffset] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [icsOpen, setIcsOpen] = useState(false);
  const [ussdOpen, setUssdOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<MobileTab>("jev");
  const [weatherSource, setWeatherSource] = useState<string | undefined>();

  const jev = useJevEvaluation({ incident, routes, setRoutes, reports, setReports });
  const { run, reset } = jev;

  // Scenario switch: reload baseline state, then auto-run the Jev pipeline.
  const autoRunTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runRef = useRef(run);
  runRef.current = run;
  useEffect(() => {
    reset();
    setRoutes(incident.routes);
    setReports(incident.reports);
    setSelectedRouteId(incident.routes[0]?.id ?? null);
    setTimeOffset(0);
    if (autoRunTimer.current) clearTimeout(autoRunTimer.current);
    autoRunTimer.current = setTimeout(() => runRef.current(), 700);
    return () => {
      if (autoRunTimer.current) clearTimeout(autoRunTimer.current);
    };
  }, [incident, reset]);

  // Live weather source label (Open-Meteo proxy; scenario telemetry stays authoritative for the demo).
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/weather?lat=${incident.center_lat}&lon=${incident.center_lng}&incidentId=${incident.id}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => setWeatherSource(d.source === "open-meteo" ? `Open-Meteo live (${d.wind_speed_mph} mph observed)` : "scenario telemetry"))
      .catch(() => setWeatherSource(undefined));
    return () => ctrl.abort();
  }, [incident]);

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) ?? routes[0] ?? null;
  const alert = useMemo(
    () =>
      buildEmergencyAlert(
        incident,
        routes,
        jev.dispatch ? { actionTitle: jev.dispatch.actionTitle, targetAsset: jev.dispatch.targetAsset, postureLabel: jev.dispatch.postureLabel, confidence: jev.dispatch.confidence } : null,
        jev.isRunning
      ),
    [incident, routes, jev.dispatch, jev.isRunning]
  );

  const handleSelectRoute = useCallback((r: EvacuationRoute) => setSelectedRouteId(r.id), []);
  const handleSelectAsset = useCallback((a: CriticalAsset) => {
    setDrawerTab("telemetry");
    if (window.innerWidth < 1024) setDrawerOpen(true);
    void a;
  }, []);
  const openDrawer = (tab: MobileTab) => {
    setDrawerTab(tab);
    setDrawerOpen(true);
  };

  const liveIncident = useMemo(() => ({ ...incident, routes, reports }), [incident, routes, reports]);

  const telemetryPane = (
    <>
      <TelemetryCards weather={incident.weather} hotspots={incident.hotspots} containmentPct={incident.containment_pct} spreadRateMph={incident.spread_rate_mph} weatherSource={weatherSource} />
      <SpreadChart timelineData={incident.timelineData} />
      <InfrastructureTable assets={incident.assets} onSelectAsset={handleSelectAsset} />
    </>
  );
  const routesPane = (
    <>
      <RoutesPanel routes={routes} selectedRouteId={selectedRouteId} onSelect={handleSelectRoute} />
      <CorridorRiskChart route={selectedRoute} />
      <GroundReports reports={reports} onOpenReportDialog={() => setReportOpen(true)} />
    </>
  );
  const jevPane = (
    <>
      <TriggerEvaluationBtn onTrigger={run} isLoading={jev.isRunning} hasRun={jev.phase === "done"} phase={jev.phase} />
      <DispatchCard dispatch={jev.dispatch} />
      <JevDecisionStream logs={jev.logs} isLoading={jev.isRunning} phase={jev.phase} />
    </>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-dvh flex flex-col">
        <IncidentHeader
          incident={incident}
          selectedScenarioId={scenarioId}
          onSelectScenario={setScenarioId}
          onOpenReportModal={() => setIcsOpen(true)}
          onOpenUssdModal={() => setUssdOpen(true)}
          lastRunAt={jev.lastRunAt}
        />

        <main id="main-content" className="flex-1 w-full max-w-[1600px] mx-auto px-3 sm:px-4 py-3 space-y-3 pb-24 lg:pb-6">
          <EmergencyBanner alert={alert} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <section className="lg:col-span-8 space-y-3" aria-label="Situational awareness">
              <div className="hidden lg:block">
                <TelemetryCards weather={incident.weather} hotspots={incident.hotspots} containmentPct={incident.containment_pct} spreadRateMph={incident.spread_rate_mph} weatherSource={weatherSource} />
              </div>
              <TacticalMap
                incident={incident}
                routes={routes}
                reports={reports}
                selectedRouteId={selectedRouteId}
                onSelectRoute={handleSelectRoute}
                onSelectAsset={handleSelectAsset}
                timeOffsetHours={timeOffset}
              />
              <div className="lg:hidden">
                <TriggerEvaluationBtn onTrigger={run} isLoading={jev.isRunning} hasRun={jev.phase === "done"} phase={jev.phase} />
              </div>
              <TimelineSlider value={timeOffset} onChange={setTimeOffset} acresNow={incident.acres_burned} timeline={incident.timelineData} />

              <div className="hidden lg:block">
                <Tabs defaultValue="spread">
                  <TabsList className="h-10">
                    <TabsTrigger value="spread" className="h-8">Spread timeline</TabsTrigger>
                    <TabsTrigger value="corridor" className="h-8">Corridor risk</TabsTrigger>
                    <TabsTrigger value="assets" className="h-8">Infrastructure</TabsTrigger>
                    <TabsTrigger value="reports" className="h-8">Ground reports</TabsTrigger>
                  </TabsList>
                  <TabsContent value="spread"><SpreadChart timelineData={incident.timelineData} /></TabsContent>
                  <TabsContent value="corridor"><CorridorRiskChart route={selectedRoute} /></TabsContent>
                  <TabsContent value="assets"><InfrastructureTable assets={incident.assets} onSelectAsset={handleSelectAsset} /></TabsContent>
                  <TabsContent value="reports"><GroundReports reports={reports} onOpenReportDialog={() => setReportOpen(true)} /></TabsContent>
                </Tabs>
              </div>
            </section>

            <aside className="hidden lg:flex lg:col-span-4 flex-col gap-3 lg:sticky lg:top-[68px] lg:self-start" aria-label="Jev decision support">
              <TriggerEvaluationBtn onTrigger={run} isLoading={jev.isRunning} hasRun={jev.phase === "done"} phase={jev.phase} />
              <DispatchCard dispatch={jev.dispatch} />
              <JevDecisionStream logs={jev.logs} isLoading={jev.isRunning} phase={jev.phase} />
              <RoutesPanel routes={routes} selectedRouteId={selectedRouteId} onSelect={handleSelectRoute} />
            </aside>
          </div>
        </main>

        {/* Mobile action bar (left of the chat + accessibility buttons) */}
        <nav className="lg:hidden fixed bottom-safe left-3 right-[8.25rem] z-40" aria-label="Mobile panels">
          <div className="grid grid-cols-3 gap-1 rounded-full border border-zinc-800 bg-zinc-950/90 backdrop-blur-md p-1 shadow-2xl">
            {(
              [
                ["telemetry", "Telemetry", <Activity key="a" className="w-4 h-4" />],
                ["routes", "Routes", <Route key="r" className="w-4 h-4" />],
                ["jev", "Jev", <Cpu key="c" className="w-4 h-4" />],
              ] as [MobileTab, string, React.ReactNode][]
            ).map(([tab, label, icon]) => (
              <Button key={tab} variant="ghost" size="sm" className="h-10 rounded-full text-[11px] gap-1.5" onClick={() => openDrawer(tab)}>
                {icon} {label}
              </Button>
            ))}
          </div>
        </nav>

        <MobileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} tab={drawerTab} onTabChange={setDrawerTab} incidentName={`${incident.name} · ${incident.incident_number}`} telemetry={telemetryPane} routes={routesPane} jev={jevPane} />

        <CitizenReportDialog open={reportOpen} onOpenChange={setReportOpen} incident={incident} onSubmit={jev.submitReport} />
        <Ics209Modal open={icsOpen} onOpenChange={setIcsOpen} incident={incident} routes={routes} reports={reports} dispatch={jev.dispatch} logs={jev.logs} />
        <UssdSimulatorModal open={ussdOpen} onOpenChange={setUssdOpen} />

        <TacticalChatbot incident={liveIncident} routes={routes} reports={reports} />
        <AccessibilityWidget currentAlertText={alert.speech} />
      </div>
    </TooltipProvider>
  );
}
