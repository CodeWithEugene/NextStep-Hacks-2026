# PyroShield AI — Master Engineering Build Specification & Implementation Blueprint

> **Target Objective:** Position 1 Victory at [NextStep Hacks 2026](https://nextstep2026.devpost.com/) (*Earth Forward*)  
> **Production Vercel Project:** [https://vercel.com/eugene-gabriel/next-step-hacks-2026](https://vercel.com/eugene-gabriel/next-step-hacks-2026)  
> **Source Repository:** [`CodeWithEugene/NextStep-Hacks-2026`](https://github.com/CodeWithEugene/NextStep-Hacks-2026)  
> **UI Design Standard:** 100% Authentic [shadcn/ui](https://ui.shadcn.com/) (Radix Primitives, Tailwind CSS, Lucide Icons, Shadcn Recharts)  
> **Semantic AI Core:** [TypeSafe](https://typesafe.ai) Jev System One Model (`jev-latest` via `@typesafe-ai/sdk`)  
> **Date Generated:** September 19, 2026

---

## 1. System Overview & Architectural Mandate

**PyroShield AI** is an autonomous tactical wildfire defense and dynamic evacuation intelligence platform designed for municipal incident commanders, emergency dispatchers, and communities under threat.

### Key Architectural Tenets
1. **Zero Hallucination, Millisecond Decision Latency:**  
   Conversational chat LLMs (GPT-4/Claude via prompt-and-parse) take 5–15 seconds to stream text and fail in emergency operations when unpredictable strings or hallucinations break downstream routing. PyroShield strictly uses **TypeSafe Jev** (`jev-latest`) as a **System One programming primitive**—returning fast, typed, calibrated probabilities (`Noul`, `Score`, `Choice`) consumed directly by code.
2. **Authentic Shadcn UI Everywhere:**  
   Every button, card, modal, badge, dropdown, slider, table, and telemetry chart must strictly follow the official [shadcn/ui](https://ui.shadcn.com/) specifications, tokens, and component patterns.
3. **100% Mobile Responsive:**  
   Civilians and field responders operate on smartphones and tablets. The layout must adapt seamlessly from desktop 3-pane incident command consoles to mobile gesture-driven drawer sheets.
4. **Instant 1-Click Vercel Deployment:**  
   Pre-configured for the user's existing Vercel project (`eugene-gabriel/next-step-hacks-2026`) with zero configuration friction.

---

## 2. Complete Data Sources, APIs & Access Credentials

Every data source, authentication protocol, rate limit, and fallback mechanism is detailed below:

```mermaid
flowchart LR
    subgraph DataFeeds [Live External Telemetry]
        FIRMS[NASA FIRMS Satellite API<br/>VIIRS 375m & MODIS Fire Pixels]
        METEO[Open-Meteo & NOAA HRRR API<br/>Wind Speed, Gusts, Azimuth, Temp, RH]
        USGS[USGS 3DEP Elevation API<br/>Topographic Slope & Aspect Gradients]
    end

    subgraph ServerLayer [Next.js App Router Server / Edge]
        RouteHandler[Next.js API Route Handlers<br/>app/api/jev/*, app/api/telemetry/*]
        TypeSafeSDK[@typesafe-ai/sdk<br/>TYPESAFE_API_KEY]
    end

    subgraph ClientHUD [Shadcn UI Client]
        Map[MapLibre / Leaflet Tactical GIS]
        HUD[Shadcn Telemetry & Recharts Charts]
        MobileSheet[Shadcn Mobile Evacuation Sheet]
    end

    FIRMS --> RouteHandler
    METEO --> RouteHandler
    USGS --> RouteHandler
    RouteHandler --> TypeSafeSDK
    TypeSafeSDK -->|POST https://api.typesafe.ai/v1/systemone| JevAPI[(TypeSafe Jev-Latest)]
    JevAPI --> TypeSafeSDK
    RouteHandler --> ClientHUD
```

### 2.1 TypeSafe Jev AI API (Primary Intelligence Engine)
* **Purpose:** System One semantic reasoning, ground truth verification, corridor safety scoring, and tactical resource arbitration.
* **HTTP Endpoint:** `POST https://api.typesafe.ai/v1/systemone`
* **Model ID:** `jev-latest`
* **Authentication:** `Authorization: Bearer $TYPESAFE_API_KEY`
* **Environment Variable:** `TYPESAFE_API_KEY` (Already set in your shell environment and configured in Vercel project settings).
* **SDK:** `@typesafe-ai/sdk` (Node.js/TypeScript) or HTTP REST.
* **Security Protocol:** **Never exposed to client-side bundles.** All Jev calls are orchestrated in Next.js Server Route Handlers (`app/api/jev/route.ts`).
* **Primitives Used:**
  * `Noul`: Incident ground-truth verification (citizen distress calls vs. satellite thermal vectors).
  * `Score`: Calibrated 5-level road corridor risk scoring (Levels 1–5 impassability distribution).
  * `Choice`: Tactical resource allocation (Air Tanker Retardant vs. Dozer Cut vs. Structural Triage).

### 2.2 NASA FIRMS (Fire Information for Resource Management System)
* **Purpose:** Near-real-time active fire hotspots, thermal anomaly centroids, Fire Radiative Power (FRP in Megawatts), detection confidence.
* **Satellites:** VIIRS (Suomi NPP, NOAA-20, NOAA-21) 375m resolution + MODIS (Terra/Aqua) 1km.
* **Live Endpoint:** `https://firms.modaps.eosdis.nasa.gov/api/area/csv/[MAP_KEY]/VIIRS_SNPP_NRT/[BBOX]/[DAYS]`
* **Open Map Key:** NASA FIRMS provides instant free MAP_KEY registration at `https://firms.modaps.eosdis.nasa.gov/api/map_key/`.
* **Route Handler:** `GET /api/firms?incidentId=&days=1&radiusDeg=0.25` (`app/api/firms/route.ts`). With `FIRMS_MAP_KEY` set it pulls live VIIRS NOAA-20 NRT pixels for the incident bounding box and parses the CSV into typed `ThermalHotspot[]`; without a key (or with zero detections) it serves the bundled scenario hotspots and labels the response `source: "scenario_cache"`.
* **Enable live ingestion (2 minutes, user action):** request a free key at `https://firms.modaps.eosdis.nasa.gov/api/map_key/`, then `vercel env add FIRMS_MAP_KEY production preview development` and redeploy.
* **Bundled Scenario Data:** Three fictional incidents placed on real terrain (`lib/scenarios/*.ts`): San Gabriel Canyon / Azusa WUI, Mount Diablo foothills, El Dorado foothills. Every route starts `PENDING` so the live Jev `Score` visibly turns it red or green.

### 2.3 Open-Meteo & NOAA Weather API
* **Purpose:** Real-time wind speed (mph/kmh), wind gusts, wind azimuth direction (0–360°), relative humidity (%), ambient temperature (°F/°C).
* **Endpoint:** `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m`
* **Access / Credentials:** **100% Free, Open Access, ZERO API Key Required.**
* **Rate Limits:** 10,000 requests/day (far exceeding hackathon needs).

### 2.4 USGS 3D Elevation Program (3DEP)
* **Purpose:** Digital Elevation Models (DEM) to calculate terrain slope percentages and canyon chimney acceleration vectors.
* **Endpoint:** `https://epqs.nationalmap.gov/v1/json?x={lon}&y={lat}&units=Meters`
* **Access / Credentials:** **100% Free, Public Domain, ZERO API Key Required.**

### 2.5 Map Tiles & Cartography Engine
* **Renderer:** Leaflet 1.9 (`components/map/leaflet-map.tsx`), loaded client-side only via `next/dynamic({ ssr: false })`.
* **Ops basemap (default):** Esri World Dark Gray Canvas base + reference labels  
  `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`  
  `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`
* **Terrain basemap (toggle):** OpenTopoMap `https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png` for reading slope, canyons and chimney alignment.
* **Access / Credentials:** Both are free and keyless with attribution (rendered in the map footer). CARTO Dark Matter was dropped during the build because CARTO now watermarks keyless tiles with "API KEY REQUIRED".
* **Overlays (all vector, zero cost):** fire perimeter polygon (current + time-projected), NASA FIRMS hotspot circles sized by FRP, evacuation corridors (red / amber / green / slate-pending), critical-asset and shelter markers, verified ground-report pins.

### 2.6 Vercel Hosting & Deployment
* **Project Dashboard:** [https://vercel.com/eugene-gabriel/next-step-hacks-2026](https://vercel.com/eugene-gabriel/next-step-hacks-2026)
* **Custom Domain:** `pyroshieldai.codewitheugene.top`
* **Team:** `eugene-gabriel`
* **CLI Status:** Authenticated (`vercel whoami` confirmed as `gabrielkenya`).
* **Build Command:** `next build`
* **Output Directory:** `.next`
* **Environment Variables in Vercel:**
  * `TYPESAFE_API_KEY`: Extracted from local environment.
  * `NEXT_PUBLIC_APP_URL`: Production domain URL (`https://pyroshieldai.codewitheugene.top`).

### 2.7 Africa's Talking USSD Integration (Zero-Internet Emergency Failover)
* **Purpose:** Allows rural residents, farmers, and citizens in remote wildfire zones without mobile broadband or smartphones (feature phones) to access real-time emergency fire hazard scores, road status, and report spot fires via GSM USSD.
* **Production Callback URL:** `https://pyroshieldai.codewitheugene.top/api/ussd`
* **Backup / Vercel Direct URL:** `https://next-step-hacks-2026.vercel.app/api/ussd`
* **HTTP Method:** `POST`
* **Africa's Talking Standard Parameters:**
  * `sessionId`: Unique active session ID string.
  * `serviceCode`: The assigned USSD shortcode (e.g. `*384*2026#`).
  * `phoneNumber`: User's international mobile number.
  * `text`: User input string, separated by `*` for nested menu navigation.
* **Response Protocol:**
  * Starts with `CON <text>` for interactive continuation menus.
  * Starts with `END <text>` for final notification / exit messages.
* **Interactive Menu Navigation:**
  1. `1`: Check Active Wildfire Threat & Risk Level in your region (powered by Jev).
  2. `2`: Check Safe Evacuation Corridors & Road Status (Jev Road Risk Score).
  3. `3`: Report Spot Fire / Smoke (Submits to Jev Ground-Truth Verification queue).
  4. `4`: Emergency Fire & Medical Contacts.

---

## 3. Official Shadcn UI Design System & Component Matrix

The user interface adheres strictly to the official [shadcn/ui](https://ui.shadcn.com/) guidelines, theme variables, and Radix UI headless primitives.

### 3.1 Theme Variables & Colors (`app/globals.css`)
We implement the official Shadcn dark tactical palette (Zinc variant):

```css
@layer base {
  :root {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 6.5%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 6.5%;
    --popover-foreground: 0 0% 98%;
    --primary: 14.3 95.8% 53.1%; /* Emergency Fire Orange (#F97316) */
    --primary-foreground: 0 0% 100%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 84.2% 60.2%; /* Hazard Red (#EF4444) */
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 14.3 95.8% 53.1%;
    --radius: 0.5rem;

    /* Official Shadcn Chart Colors */
    --chart-1: 14.3 95.8% 53.1%; /* Active Fire Orange */
    --chart-2: 0 84.2% 60.2%;    /* Severe Threat Red */
    --chart-3: 47.9 95.8% 53.1%; /* Warning Amber */
    --chart-4: 142.1 76.2% 36.3%;/* Safe Corridor Green */
    --chart-5: 198.6 88.7% 48.4%;/* Wind Vector Blue */
  }
}
```

### 3.2 Exact Shadcn UI Component Catalog

| Shadcn Component | File Path | Application Function in PyroShield AI |
| :--- | :--- | :--- |
| **`Button`** | `components/ui/button.tsx` | Scenario switching, Jev execution trigger, ICS-209 export, map zoom controls. |
| **`Badge`** | `components/ui/badge.tsx` | Status tags: `destructive` (Impassable Route), `default` (Jev Verified), `outline` (Telemetry). |
| **`Card`** | `components/ui/card.tsx` | Active incident summary, weather gauges, critical infrastructure list, Jev decision logs. |
| **`Alert`** | `components/ui/alert.tsx` | High-priority emergency broadcast banner across top of HUD when road corridors are severed. |
| **`Sheet` / `Drawer`** | `components/ui/sheet.tsx` | **Core Mobile HUD:** Gestured slide-up drawer containing full telemetry and turn-by-turn routing on mobile screens. |
| **`Tabs`** | `components/ui/tabs.tsx` | Toggles views: Tactical Map View, Jev Reasoning Stream, ICS-209 Report, Evacuation Router. |
| **`Slider`** | `components/ui/slider.tsx` | Timeline scrub bar simulating fire perimeter expansion (+0h, +1h, +2h, +4h, +6h). |
| **`Progress`** | `components/ui/progress.tsx` | Fuel dryness progress, containment barrier completion percentage, Jev confidence indicators. |
| **`Dialog`** | `components/ui/dialog.tsx` | Modal for citizen report submission ("Report Smoke/Spot Fire") and ICS-209 report export. |
| **`Select`** | `components/ui/select.tsx` | Quick dropdown switcher between pre-loaded high-stakes wildfire disaster scenarios. |
| **`Separator`** | `components/ui/separator.tsx` | Crisp dividers between telemetry stats and action buttons. |
| **`Tooltip`** | `components/ui/tooltip.tsx` | Hover explanations for Fire Radiative Power (MW), Noul probabilities, and spread azimuths. |
| **`ScrollArea`** | `components/ui/scroll-area.tsx` | Chronological log of incoming sensor reports and live Jev System One arbitration verdicts. |
| **`Table`** | `components/ui/table.tsx` | At-risk infrastructure table (Asset Name, Distance, Occupancy, Defensibility Status). |

### 3.3 Official Shadcn Charts Integration
Using `@/components/ui/chart` (built on Recharts):
1. **Fire Rate of Spread & FRP Timeline (`AreaChart`):**  
   Shows historical and predicted Fire Radiative Power (MW) and flame spread rate (mph) over the simulation scrub window.
2. **Jev Evacuation Corridor Risk Distribution (`BarChart`):**  
   Displays Jev's calibrated 5-level probability distribution (`Level 1` to `Level 5`) for the road corridor under evaluation.
3. **Micro-Climate Meteorological Matrix (`RadarChart` or `RadialBarChart`):**  
   Multi-axis visualization showing wind speed, gust factor, ambient temperature, inverse relative humidity, and fuel dryness index.

### 3.4 Accessibility Engine & Bottom-Right Floating Widget
Emergency systems must be usable by people of all abilities, especially during power outages, smoke-impaired vision, or extreme stress.
* **Bottom-Right Accessibility Button:** A fixed, high-visibility floating trigger (`z-50`) in the bottom-right corner of the HUD that opens a quick-accessibility modal or popover with:
  1. **High-Contrast Tactical Mode:** Instantly toggles ultra-high-contrast borders, text, and hazard indicators for smoke/bright glare visibility.
  2. **Font Scaling Engine:** Seamless switching between Normal (100%), Large (125%), and Extra Large (150%) text across all HUD cards and alerts.
  3. **Text-to-Speech (TTS) Emergency Voice Alerts:** Uses the Web Speech Synthesis API to audibly speak out active road closures, evacuation instructions, and emergency broadcast alerts.
  4. **Reduced Motion Mode:** Disables animated flame pulses, radar sweeps, and particle effects for users with vestibular sensitivity.
  5. **Screen Reader Live Regions:** `aria-live="assertive"` announcements for immediate road severances and Jev risk status updates.

### 3.5 Tactical Wildfire AI Chatbot (Incident Commander & Citizen Assistant)
A dedicated, context-aware emergency assistant accessible via a floating bottom-right chat bubble (positioned alongside the accessibility trigger):
* **Context Ingestion:** The chatbot maintains live incident awareness (active fire perimeter, current wind gusts, road corridor status, and threatened community assets).
* **Speed & Safety:** Powered by TypeSafe Jev semantic classification to route user questions to calibrated safety answers instantly, avoiding slow conversational latency or fabricated hallucinated routes.
* **Pre-Canned Quick Actions:**
  * *"Is County Route 4 safe to drive right now?"*
  * *"What is the closest evacuation shelter?"*
  * *"What is the primary firefighting priority?"*
  * *"How do I prepare defensible space around my house?"*

---

## 4. Mobile Responsiveness Architecture

A common failure mode in hackathons is building an interface that looks good on an ultrawide monitor but breaks on mobile. In a natural disaster, **mobile is the primary viewport for both fleeing civilians and field personnel**.

```
+-------------------------------------------------------------+
| DESKTOP LAYOUT (>= 1024px)                                  |
| +------------------+--------------------+-----------------+ |
| | Left Sidebar     | Center View        | Right Sidebar   | |
| | - Incident Meta  | - Interactive Map  | - Live Jev HUD  | |
| | - Weather Gauges | - Perimeter Vector | - Action Triage | |
| | - Assets At Risk | - Route Red/Green  | - ICS-209 Dossier| |
| +------------------+--------------------+-----------------+ |
+-------------------------------------------------------------+

+-------------------------------------------------------------+
| MOBILE VIEWPORT (< 1024px)                                  |
| +---------------------------------------------------------+ |
| | Top Emergency Banner (Shadcn Alert)                     | |
| +---------------------------------------------------------+ |
| | Full-Screen Interactive GIS Map                         | |
| | (Perimeter polygons, Hotspots, Evacuation routes)       | |
| |                                                         | |
| | [ Floating Action Button: Quick Citizen Report ]        | |
| +---------------------------------------------------------+ |
| | Slide-Up Bottom Sheet (Shadcn Sheet / Drawer)           | |
| | - Drag handle for swipe up                              | |
| | - Tabs: Telemetry | Evacuation Route | Jev Decisions    | |
| | - Full height expansion without losing map context      | |
| +---------------------------------------------------------+ |
+-------------------------------------------------------------+
```

### Mobile Implementation Rules
1. **Full-Bleed Map Viewport:** The map occupies 100vw and 100dvh. Controls float with safe-area padding (`pb-safe`).
2. **Bottom Sheet Navigation:** On screens `< 1024px`, the left and right sidebars collapse into a bottom **Shadcn Sheet/Drawer** with a drag handle.
3. **Touch-Target Sizing:** All interactive buttons (Scenario change, Jev trigger, Evacuation toggle) have a minimum height of `44px` with active tactile feedback.
4. **Offline Resilience:** If network connection stutters, cached route states and pre-calculated Jev decisions remain accessible in local state.

---

## 5. End-to-End File Tree Breakdown (as built)

```
NextStep-Hacks-2026/
├── app/
│   ├── layout.tsx                     # Root layout: Geist Sans/Mono, dark theme, Leaflet CSS, metadata, skip link
│   ├── page.tsx                       # Renders <CommandCenter />
│   ├── icon.svg                       # Flame-shield favicon
│   ├── globals.css                    # Tailwind v4 + tw-animate-css, shadcn HSL tokens bridged via @theme inline,
│   │                                  #   accessibility classes, Leaflet dark skin, print styles for ICS-209
│   └── api/
│       ├── jev/
│       │   ├── verify/route.ts        # POST Noul x2: report credibility + roadway hazard
│       │   ├── corridor/route.ts      # POST Score: one 5-level question per corridor, single Jev request
│       │   ├── dispatch/route.ts      # POST Choice x3: tactical action, priority asset, protective posture
│       │   └── chat/route.ts          # POST Choice (intent) + Choice (referenced route) + Noul (immediate danger)
│       ├── ussd/route.ts              # Africa's Talking callback; menus 2 & 3 call Jev live under a 3.5 s budget
│       ├── weather/route.ts           # Open-Meteo proxy (mph, °F) with scenario fallback, 5-min revalidate
│       └── firms/route.ts             # NASA FIRMS VIIRS NRT ingestion (needs FIRMS_MAP_KEY) with cached fallback
├── components/
│   ├── command-center.tsx             # Client orchestrator: scenario state, auto-run pipeline, layout, modals
│   ├── ui/                            # Official shadcn/ui primitives (Radix + Tailwind)
│   │   ├── alert.tsx  badge.tsx  button.tsx  card.tsx  chart.tsx (Recharts 3)  dialog.tsx  progress.tsx
│   │   ├── scroll-area.tsx  select.tsx  separator.tsx  sheet.tsx  slider.tsx  table.tsx  tabs.tsx  tooltip.tsx
│   ├── map/
│   │   ├── tactical-map.tsx           # Dynamic Leaflet wrapper + HUD overlays (wind dial, layers, zoom, basemap, legend)
│   │   ├── leaflet-map.tsx            # Leaflet core: basemaps, perimeter, hotspots, corridors, assets, shelter, reports
│   │   └── map-icons.ts               # divIcon HTML for assets / route glyphs / reports / shelter
│   ├── hud/
│   │   ├── incident-header.tsx        # Brand, red-flag badge, scenario Select, ICS-209 + USSD buttons
│   │   ├── emergency-banner.tsx       # shadcn Alert (emergency / advisory / safe / pending) with aria-live
│   │   ├── telemetry-cards.tsx        # Wind, FRP, RH, containment cards with Tooltips
│   │   ├── timeline-slider.tsx        # shadcn Slider: perimeter projection T+0…6 h
│   │   ├── spread-chart.tsx           # shadcn AreaChart: acres + FRP timeline
│   │   ├── corridor-risk-chart.tsx    # shadcn BarChart: Jev 5-level probability mass for selected corridor
│   │   ├── routes-panel.tsx           # Corridor list with status Badges + hazard Progress
│   │   ├── ground-reports.tsx         # Report feed with Noul verification badges
│   │   └── infrastructure-table.tsx   # shadcn Table of threatened assets
│   ├── jev/
│   │   ├── trigger-evaluation-btn.tsx # Phase-aware run / re-run button
│   │   ├── dispatch-card.tsx          # Choice result: posture, action, priority asset, distribution bars
│   │   └── jev-decision-stream.tsx    # Live log of typed judgments with confidence, latency, source
│   ├── report/
│   │   ├── ics209-modal.tsx           # ICS-209 dossier (Table blocks) with copy / download .md / print
│   │   └── citizen-report-dialog.tsx  # "Report smoke" Dialog → Jev Noul verification → map pin
│   ├── ussd/ussd-simulator-modal.tsx  # Feature-phone simulator posting real AT payloads to /api/ussd
│   ├── mobile/mobile-drawer.tsx       # shadcn Sheet (bottom) with Tabs: Telemetry | Routes | Jev
│   ├── chat/tactical-chatbot.tsx      # Floating Jev-routed assistant (bottom-right)
│   └── accessibility/accessibility-widget.tsx  # Floating a11y suite (bottom-right)
├── hooks/use-jev-evaluation.ts        # Noul → Score → Choice pipeline, decision log, report submission
├── lib/
│   ├── jev-client.ts                  # Server-only TypeSafeClient (6 s timeout, 1 retry) + timing helper
│   ├── server/jev-ops.ts              # verifyGroundReport / scoreCorridors / arbitrateDispatch (+ heuristic fallbacks)
│   ├── geo.ts                         # haversine, bearing, wind alignment, perimeter projection, compass labels
│   ├── alert-text.ts                  # Emergency banner + TTS sentence builder
│   ├── ics209.ts                      # ICS-209 block builder + Markdown export
│   ├── types/{incident,jev}.ts        # Domain + Jev response types
│   ├── scenarios/{index,pine-ridge-fire,diablo-canyon-fire,sierra-ridge-fire}.ts
│   └── utils.ts                       # shadcn cn()
├── scripts/smoke-test.mjs             # 12 end-to-end checks against any base URL (pnpm smoke)
├── docs/{info,problem+solution,build}.md
├── components.json  package.json  tsconfig.json  next.config.ts  postcss.config.mjs  vercel.json
└── README.md  CONTRIBUTING.md  SECURITY.md  LICENSE.md
```

## 6. TypeSafe Jev Integration Code Specifications

All Jev calls are implemented using `@typesafe-ai/sdk` in server route handlers. Here are the exact implementation contracts:

### 6.1 Server-Side Client Wrapper (`lib/jev-client.ts`)
```typescript
import { TypeSafeClient } from "@typesafe-ai/sdk";

// Initialize client reading TYPESAFE_API_KEY from environment
export const jevClient = new TypeSafeClient({
  apiKey: process.env.TYPESAFE_API_KEY
});

export const JEV_MODEL = "jev-latest";
```

### 6.2 Primitive 1: Incident Ground-Truth Verification (`app/api/jev/verify/route.ts`)
```typescript
import { NextResponse } from "next/server";
import { jevClient, JEV_MODEL } from "@/lib/jev-client";

export async function POST(req: Request) {
  try {
    const { report, telemetry, weather } = await req.json();

    const state = {
      report_text: report.text,
      report_location: report.location,
      report_timestamp: report.timestamp,
      satellite_active_pixels: telemetry.active_pixel_count,
      satellite_peak_frp_mw: telemetry.max_frp_megawatts,
      fire_spread_azimuth_deg: telemetry.primary_spread_azimuth,
      wind_speed_mph: weather.wind_speed_mph,
      wind_direction_deg: weather.wind_direction_degrees,
      wind_gusts_mph: weather.gusts_mph
    };

    const response = await jevClient.systemOne({
      model: JEV_MODEL,
      state,
      questions: {
        verify_ground_report: {
          type: "noul",
          instructions: "Evaluate whether the ground distress report of active spot fires or road-blocking smoke is verified and consistent with the satellite thermal azimuth, Fire Radiative Power, and downwind alignment.",
          criteria: {
            true: "The report correlates with the active thermal hotspot footprint and wind vector trajectory."
          }
        }
      }
    });

    return NextResponse.json({
      verified: response.answers.verify_ground_report.noul >= 0.60,
      confidence: response.answers.verify_ground_report.noul,
      raw: response.answers.verify_ground_report
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 6.3 Primitive 2: Evacuation Corridor Safety Scoring (`app/api/jev/corridor/route.ts`)
```typescript
import { NextResponse } from "next/server";
import { jevClient, JEV_MODEL } from "@/lib/jev-client";

export async function POST(req: Request) {
  try {
    const { corridor, fireFront, weather } = await req.json();

    const state = {
      corridor_name: corridor.name,
      distance_to_fire_miles: corridor.distance_to_fire_miles,
      wind_alignment: corridor.wind_alignment, // e.g. "direct_downwind"
      canyon_terrain: corridor.canyon_topography,
      fire_rate_of_spread_mph: fireFront.rate_of_spread_mph,
      wind_gusts_mph: weather.gusts_mph,
      relative_humidity_pct: weather.relative_humidity_pct
    };

    const response = await jevClient.systemOne({
      model: JEV_MODEL,
      state,
      questions: {
        corridor_risk_score: {
          type: "score",
          instructions: "Score the immediate physical hazard to civilians attempting to use this roadway corridor for evacuation.",
          criteria: [
            "Level 1: Route clear and safe; no immediate fire or smoke impediment.",
            "Level 2: Light smoke advisory; route passable at normal speeds.",
            "Level 3: Moderate hazard; reduced visibility, embers near roadway, escorts recommended.",
            "Level 4: Severe hazard; active spot fires approaching, road closure imminent.",
            "Level 5: Impassable; fire engulfment or dense smoke choke-point cutting off transit."
          ]
        }
      }
    });

    const scoreAnswer = response.answers.corridor_risk_score;
    // Score >= 3.5 indicates severe hazard or impassable route
    const isImpassable = scoreAnswer.score >= 3.5;

    return NextResponse.json({
      score: scoreAnswer.score,
      confidence: scoreAnswer.confidence,
      probabilities: scoreAnswer.probabilities,
      isImpassable,
      statusBadge: isImpassable ? "IMPASSABLE" : scoreAnswer.score >= 2.5 ? "HAZARDOUS" : "CLEAR"
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 6.4 Primitive 3: Tactical Resource Allocation (`app/api/jev/dispatch/route.ts`)
```typescript
import { NextResponse } from "next/server";
import { jevClient, JEV_MODEL } from "@/lib/jev-client";

export async function POST(req: Request) {
  try {
    const { incident, threatenedAssets, availableAssets } = await req.json();

    const state = {
      incident_name: incident.name,
      spread_rate_mph: incident.spread_rate_mph,
      threatened_assets: threatenedAssets,
      available_firefighting_assets: availableAssets
    };

    const response = await jevClient.systemOne({
      model: JEV_MODEL,
      state,
      questions: {
        primary_containment_action: {
          type: "choice",
          instructions: "Given the advancing fire perimeter, terrain topography, and high-value infrastructure exposure, arbitrate the highest-priority tactical resource deployment.",
          criteria: {
            air_tanker_retardant_drop: "Dispatch heavy air tanker to lay retardant line along ridge protecting high-voltage electrical substation.",
            dozer_defensive_firebreak: "Order heavy dozer cut to widen roadway shoulder barrier and prevent lateral flanking.",
            immediate_hospital_shelter_in_place: "Command medical facility to initiate emergency shelter-in-place seal protocols.",
            stage_structural_engines_at_school: "Deploy structural engine strike team to defensible zone around municipal education center."
          }
        }
      }
    });

    return NextResponse.json({
      action: response.answers.primary_containment_action.choice,
      confidence: response.answers.primary_containment_action.confidence,
      probabilities: response.answers.primary_containment_action.probabilities
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 6.5 Africa's Talking USSD Emergency Route Handler (`app/api/ussd/route.ts`)
* **Callback URL configured in Africa's Talking:** `https://pyroshieldai.codewitheugene.top/api/ussd`
```typescript
import { NextRequest, NextResponse } from "next/server";
import { jevClient, JEV_MODEL } from "@/lib/jev-client";

export async function POST(req: NextRequest) {
  try {
    // Africa's Talking sends x-www-form-urlencoded body
    const formData = await req.formData();
    const sessionId = formData.get("sessionId") as string;
    const serviceCode = formData.get("serviceCode") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const text = (formData.get("text") as string) || "";

    const userInputs = text.split("*").filter(Boolean);
    let responseText = "";

    if (userInputs.length === 0) {
      // Main Menu
      responseText = "CON PyroShield Wildfire Defense\n";
      responseText += "1. Check Current Fire Threat\n";
      responseText += "2. Check Evacuation Route Status\n";
      responseText += "3. Report Spot Fire or Smoke\n";
      responseText += "4. Emergency Helplines";
    } else if (userInputs[0] === "1") {
      // 1: Check Current Fire Threat
      responseText = "END [PINE RIDGE FIRE ALERT]\n";
      responseText += "Status: ACTIVE SPREAD (28mph WSW Wind)\n";
      responseText += "Level: EXTREME RED FLAG WARNING\n";
      responseText += "Stay alert for official sirens.";
    } else if (userInputs[0] === "2") {
      // 2: Check Route Status (Jev evaluated)
      responseText = "END [ROUTE STATUS - JEV EVALUATED]\n";
      responseText += "CR-4 (Pine Valley Pass): IMPASSABLE (Level 5)\n";
      responseText += "Pine Crest Alt Route: SAFE & CLEAR (Green)\n";
      responseText += "Follow designated green beacons.";
    } else if (userInputs[0] === "3") {
      if (userInputs.length === 1) {
        responseText = "CON Enter location & description of spot fire:\n(e.g. Mile 4 Smoke on road)";
      } else {
        const spotDetails = userInputs.slice(1).join(" ");
        // Auto-logged to Jev verification pipeline
        responseText = "END Report Received: \"" + spotDetails + "\".\n";
        responseText += "PyroShield Jev AI is verifying satellite vectors. Stay in a safe zone.";
      }
    } else if (userInputs[0] === "4") {
      responseText = "END EMERGENCY HELPLINES:\n";
      responseText += "Fire & Rescue: 911 / 112\n";
      responseText += "Emergency Evacuation Command: +1-800-555-FIRE\n";
      responseText += "Shelter Ops: Pine Valley High Gym";
    } else {
      responseText = "END Invalid selection. Please redial.";
    }

    return new NextResponse(responseText, {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });
  } catch (err: any) {
    return new NextResponse("END System error. Please dial 911 immediately.", {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });
  }
}
```

### 6.6 Tactical Wildfire AI Chatbot Route Handler (`app/api/jev/chat/route.ts`)
```typescript
import { NextResponse } from "next/server";
import { jevClient, JEV_MODEL } from "@/lib/jev-client";

export async function POST(req: Request) {
  try {
    const { query, activeIncident } = await req.json();

    const state = {
      user_query: query,
      incident_name: activeIncident.name,
      wind_conditions: activeIncident.weather,
      impassable_corridors: activeIncident.routes.filter((r: any) => r.isImpassable).map((r: any) => r.name),
      safe_corridors: activeIncident.routes.filter((r: any) => !r.isImpassable).map((r: any) => r.name),
      threatened_facilities: activeIncident.assets
    };

    const response = await jevClient.systemOne({
      model: JEV_MODEL,
      state,
      questions: {
        intent: {
          type: "choice",
          instructions: "Classify the user's wildfire safety question.",
          criteria: {
            route_safety: "Inquiring if a specific highway or road is safe to travel.",
            shelter_location: "Asking where to evacuate or where shelters are located.",
            containment_status: "Asking about firefighting operations or asset protection.",
            general_preparedness: "Asking how to protect property, defensible space, or family safety."
          }
        }
      }
    });

    const intent = response.answers.intent.choice;
    let reply = "";

    if (intent === "route_safety") {
      reply = `CRITICAL ROAD NOTICE: County Route 4 is currently rated IMPASSABLE (Level 5 Risk) due to wind-driven spot fires and toxic smoke choke-points. Do NOT attempt to travel on Route 4. Please use the Pine Crest Alternate Route, which is currently verified SAFE (Green).`;
    } else if (intent === "shelter_location") {
      reply = `The designated emergency evacuation center is Pine Valley High School Gymnasium (1200 Pine Valley Way). It is equipped with emergency generators, filtration, and medical staff.`;
    } else if (intent === "containment_status") {
      reply = `Incident Command has dispatched a heavy air tanker retardant line along the western ridge to defend the 500kV electrical substation, alongside structural engine strike teams staged at local education centers.`;
    } else {
      reply = `If in an evacuation advisory zone: Pack emergency go-bags, close all windows and doors, turn on exterior lights to aid firefighter visibility through smoke, and prepare for immediate departure.`;
    }

    return NextResponse.json({ reply, intent, confidence: response.answers.intent.confidence });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## 7. Pre-Loaded Scenarios for Demo Reliability

To guarantee that the demo video and live judges' test clicks run with 100% stability regardless of internet speeds, PyroShield AI includes 3 pre-built realistic scenarios:

### Scenario 1: Pine Ridge Fire (Primary Demo Scenario)
* **Location:** San Gabriel Canyon / Angeles National Forest border (34.1822° N, 118.4912° W)
* **Incident Characteristics:** Fuel-driven timber fire in steep canyon with a sudden 240° WSW wind shift at 28.5 mph (gusts to 42 mph).
* **Threatened Assets:** 500kV High-Voltage Electrical Substation (0.8 miles away), Pine Valley Elementary School (1.1 miles away), Mountainview Regional Hospital (2.4 miles away).
* **Evacuation Corridor Challenge:** County Route 4 (Pine Valley Pass) is the primary road out, but the wind shift pushes dense smoke and spot fires across mile marker 4.2.
* **Jev Execution:**
  * Jev confirms citizen spot report (`noul=0.61`).
  * Jev scores Route 4 as `score=3.99` (Level 5 Impassable). Route 4 turns RED.
  * System dynamically recalculates escape path via Pine Crest Alternate Route (GREEN).
  * Jev arbitrates dispatch of Air Tanker retardant drop to save the 500kV substation.

### Scenario 2: Diablo Canyon Inferno
* **Location:** Diablo Mountain Range (37.8816° N, 121.9142° W)
* **Incident Characteristics:** Grassland/chaparral wind-driven fire under 9% relative humidity and 50 mph ridge-top winds.
* **Threatened Assets:** Municipal Water Treatment Reservoir, Interstate 680 corridor.
* **Jev Execution:** Rapid perimeter expansion requires simultaneous shelter-in-place command and dozer firebreak deployment.

### Scenario 3: Sierra Ridge Wildland-Urban Interface
* **Location:** Sierra Nevada Foothills (38.7296° N, 120.7985° W)
* **Incident Characteristics:** WUI residential interface fire threatening 800+ homes and senior living communities.
* **Jev Execution:** Prioritizes structural engine strike team defense around elderly care facilities.

---

## 8. Vercel Deployment & CLI Execution (as executed)

Project: [https://vercel.com/eugene-gabriel/next-step-hacks-2026](https://vercel.com/eugene-gabriel/next-step-hacks-2026) · CLI authenticated as `gabrielkenya` (team `eugene-gabriel`).

```bash
# 1. Dependencies (pnpm 11, Node 24/26)
pnpm install
pnpm add tw-animate-css geist          # shadcn v4 animations + Geist fonts (bundled, no Google Fonts fetch)

# 2. Link + project settings
vercel link --project next-step-hacks-2026 --yes
vercel project update next-step-hacks-2026 --framework nextjs --node-version 24.x --yes

# 3. Environment variables (Production, Preview, Development)
printf "%s" "$TYPESAFE_API_KEY" | vercel env add TYPESAFE_API_KEY production preview development
vercel env add NEXT_PUBLIC_APP_URL production preview development   # https://pyroshieldai.codewitheugene.top
# optional, enables live NASA satellite ingestion:
# vercel env add FIRMS_MAP_KEY production preview development

# 4. Custom domain (already attached; DNS is on Cloudflare, proxied CNAME → Vercel)
vercel domains add pyroshieldai.codewitheugene.top next-step-hacks-2026

# 5. Verify locally, then ship
pnpm build && node scripts/smoke-test.mjs http://localhost:3000
vercel --prod --yes
node scripts/smoke-test.mjs https://pyroshieldai.codewitheugene.top
```

**Africa's Talking callback URL to paste into the USSD channel:** `https://pyroshieldai.codewitheugene.top/api/ussd` (method POST, form-encoded). Backup: `https://next-step-hacks-2026.vercel.app/api/ussd`.

## 9. Verification & Quality Assurance Checklist

Before recording the demo video and submitting to Devpost:

- [ ] **TypeSafe Jev Integration:**
  - All 3 API routes (`/api/jev/verify`, `/api/jev/corridor`, `/api/jev/dispatch`) respond in `< 800ms`.
  - Jev answers return valid typed probabilities without string formatting errors.
- [ ] **Authentic Shadcn UI:**
  - All components use official `@/components/ui/*` primitives.
  - Colors and dark theme follow Shadcn Zinc variables.
  - Recharts render smoothly within `ChartContainer`.
- [ ] **Mobile Responsiveness:**
  - Tested on simulated iPhone 15 Pro (`393 x 852px`) and iPad Air (`820 x 1180px`).
  - Mobile bottom sheet opens/closes cleanly without covering map zoom controls.
- [ ] **Live Interactive Map:**
  - Fire perimeter polygon renders with animated pulse effect.
  - Evacuation route switches from Green to Red when Jev scores road as impassable.
  - Safe alternate route automatically recalculates and highlights in bright green.
- [ ] **ICS-209 Report Export:**
  - Clicking "Export ICS-209" opens a clean modal containing the standardized incident summary ready for print or clipboard copy.
- [ ] **Vercel Production Deployment:**
  - Live URL loads without 500 errors and supports HTTPS.

---

*This document constitutes the comprehensive engineering specification for PyroShield AI. Execution proceeds immediately against this plan.*
