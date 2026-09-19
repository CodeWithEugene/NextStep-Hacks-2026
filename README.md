# PyroShield AI 🛡️🔥
### Autonomous Wildfire Tactical Defense & Semantic Evacuation Intelligence
**NextStep Hacks 2026 — *Earth Forward* Grand Prize Contender**

[![NextStep Hacks 2026](https://img.shields.io/badge/NextStep_Hacks-2026_Earth_Forward-16a34a?style=for-the-badge)](https://nextstep2026.devpost.com/)
[![TypeSafe Jev AI](https://img.shields.io/badge/Powered_by-TypeSafe_Jev_AI-f97316?style=for-the-badge)](https://typesafe.ai)
[![Shadcn UI](https://img.shields.io/badge/UI-shadcn%2Fui-000000?style=for-the-badge)](https://ui.shadcn.com/)
[![Vercel Deployed](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel)](https://pyroshieldai.codewitheugene.top)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE.md)

> **Live Production Application:** [https://pyroshieldai.codewitheugene.top](https://pyroshieldai.codewitheugene.top)  
> **Backup Vercel URL:** [https://next-step-hacks-2026.vercel.app](https://next-step-hacks-2026.vercel.app)  
> **USSD Emergency Shortcode Callback:** `https://pyroshieldai.codewitheugene.top/api/ussd`  
> **Devpost Challenge:** [NextStep Hacks 2026 (Devpost #30878)](https://nextstep2026.devpost.com/)  
> **Host Organization:** [HackAlphaX](https://devpost.com/hackathons?organization=HackAlphaX)

---

## 📖 Table of Contents
1. [The Crisis: Wildfire Climate Feedback Loop](#-the-crisis-wildfire-climate-feedback-loop)
2. [What is PyroShield AI?](#-what-is-pyroshield-ai)
3. [The Secret Weapon: TypeSafe Jev System One](#-the-secret-weapon-typesafe-jev-system-one)
4. [System Architecture & Data Pipelines](#-system-architecture--data-pipelines)
5. [Key Capabilities & Features](#-key-capabilities--features)
6. [Africa's Talking USSD Emergency Integration](#-africas-talking-ussd-emergency-integration)
7. [Accessibility & Field Usability](#-accessibility--field-usability)
8. [Local Development & Setup](#-local-development--setup)
9. [Environment Variables](#-environment-variables)
10. [Hackathon Rubric Alignment](#-hackathon-rubric-alignment)
11. [License & Acknowledgements](#-license--acknowledgements)

---

## 🌍 The Crisis: Wildfire Climate Feedback Loop

Wildfires are no longer seasonal events; they have become compounding accelerators of planetary climate breakdown:
* **Carbon Sink Destruction:** Catastrophic megafires incinerate millions of acres of forest biomes, converting vital planetary carbon sinks into gigaton-scale carbon sources in hours.
* **Ecosystem Collapse:** High-intensity fires wipe out endangered wildlife corridors, sterilize topsoil, and trigger post-fire toxic watershed siltation.
* **The Fatal Evacuation Bottleneck:** When sudden wind shifts propel flames into urban-wildland interface (WUI) corridors, civilians and dispatchers face an **information catastrophe**. Traditional evacuation orders are blunt, static polygons; fleeing families drive directly into advancing smoke choke-points and impassable walls of flame.

**Why Chat LLMs Fail in Wildfire Operations:**  
Standard conversational LLMs take 5–15 seconds to stream text and suffer from hallucinations. In an active wildfire incident, **a model that hallucinates a road is open or lags by 12 seconds costs lives**. Responders need **System One semantic judgments**: instant, typed, deterministic probabilities and calibrated choices executed in milliseconds.

---

## 🛡️ What is PyroShield AI?

**PyroShield AI** is an autonomous tactical wildfire defense and dynamic evacuation intelligence platform. It fuses live satellite thermal anomaly telemetry, micro-meteorological wind/topography vectors, and IoT sensor streams with **TypeSafe's Jev System One semantic decision engine**.

It provides:
1. **Live Multi-Spectral Satellite Telemetry:** Active thermal hotspots and Fire Radiative Power (MW) from NASA FIRMS (VIIRS 375m & MODIS).
2. **Sub-Second Semantic Arbitrations:** Calibrated judgments powered by `jev-latest` for incident verification, road risk scoring, and asset triage.
3. **Dynamic Evacuation Pathfinding:** Real-time road status updating dynamically between **SAFE (Green)** and **IMPASSABLE (Red)** based on flame spread vectors.
4. **Zero-Internet Emergency Access via USSD:** Africa's Talking USSD service (`*384*2026#`) enabling rural citizens with basic 2G feature phones to access fire warnings and safe escape routes.
5. **Interactive Tactical GIS HUD:** 100% authentic **shadcn/ui** interface with Recharts telemetry, accessibility features, and automated ICS-209 situational reporting.

---

## ⚡ The Secret Weapon: TypeSafe Jev System One

PyroShield AI leverages **TypeSafe's Jev model (`jev-latest`)** as its foundational programmatic reasoning primitive:

```
                               +----------------------------+
                               |    Raw Disaster State      |
                               | (Satellite FRP, Wind Gusts,|
                               |  Canyon Slope, Spot Calls) |
                               +--------------+-------------+
                                              |
                                              v
                             +--------------------------------+
                             |   TypeSafe Jev (jev-latest)    |
                             |   System One Semantic Core     |
                             +----+-----------+----------+----+
                                  |           |          |
            +---------------------+           |          +---------------------+
            v                                 v                                v
+-----------------------+         +-----------------------+        +-----------------------+
|  Noul: Verification   |         | Score: Corridor Risk  |        | Choice: Asset Triage  |
| "Is spot fire report  |         | "5-Level calibrated   |        | "Air tanker retardant |
|  verified by satellite|         |  road transit hazard  |        |  vs. Dozer line vs.   |
|  thermal azimuth?"    |         |  distribution"        |        |  Structure defense"   |
+-----------+-----------+         +-----------+-----------+        +-----------+-----------+
            |                                 |                                |
            v                                 v                                v
    Verified Marker                   Road Turns RED /                  Automated Dispatch
    on Tactical Map                 Green Route Recalc                   Logged to ICS-209
```

1. **Incident Ground-Truth Verification (`Noul`):**  
   Cross-references chaotic citizen 911 reports against real-time satellite thermal coordinates and downwind vectors (`noul=0.61`), eliminating false alarms and hoax reports.
2. **Evacuation Corridor Risk Scoring (`Score`):**  
   Scores roadway segments on a 5-level risk rubric. A score $\ge 3.5$ (e.g. `3.99 / 4.0`, Level 5 Impassable) triggers automated road closure and routes traffic away from hazard zones.
3. **Tactical Resource Allocation (`Choice`):**  
   Arbitrates between high-value competing assets (e.g. 500kV electrical substation vs. local school), selecting optimal containment strategies (`air_tanker_retardant_drop`, 88% confidence).

---

## 🏗️ System Architecture & Data Pipelines

| Subsystem | Data Source / Engine | Implementation Role |
| :--- | :--- | :--- |
| **Satellite Feeds** | **NASA FIRMS API** | Ingests active VIIRS 375m & MODIS hotspots, Fire Radiative Power (MW), and acquisition timestamps. |
| **Micro-Weather** | **Open-Meteo & NOAA HRRR** | Real-time hourly wind speed, wind gusts, wind azimuth (0–360°), relative humidity, and air temperature. |
| **Topography** | **USGS 3DEP Elevation API** | Calculates terrain slope percentage and canyon chimney acceleration vectors. |
| **Semantic AI** | **TypeSafe Jev SDK (`@typesafe-ai/sdk`)** | Sub-second System One decision engine for `Noul`, `Score`, and `Choice` primitives. |
| **UI Framework** | **Next.js 15 (App Router) + shadcn/ui** | Authentic Shadcn Zinc dark theme, Radix UI headless components, Recharts telemetry charts. |
| **Mapping Engine** | **MapLibre GL & Leaflet** | CartoDB Dark Matter tiles, vector perimeter polygons, hotspot clusters, animated wind vectors. |
| **Telecom / USSD** | **Africa's Talking API** | GSM USSD interactive menu callback (`/api/ussd`) for non-smartphone emergency access. |
| **Cloud Hosting** | **Vercel Edge Platform** | Production deployment on `pyroshieldai.codewitheugene.top`. |

---

## 🚀 Key Capabilities & Features

### 1. Tactical Command HUD (Desktop & Tablet)
* **Real-Time Fire Perimeter:** Interactive vector polygon showing current fire boundary with animated radiant heat pulse.
* **Wind Vector Overlay:** Live visual vector showing wind direction and gust speeds across the incident zone.
* **Thermal Hotspot Cluster:** Color-coded VIIRS/MODIS pixels sized by Fire Radiative Power (MW).
* **Telemetry Gauges:** Instant status for Wind Gusts, Fuel Moisture, Containment Percentage, and Air Quality (AQI).

### 2. Autonomous Dynamic Evacuation Pathfinder
* Roads actively monitored by Jev System One engine.
* When fire or spot embers threaten a road segment, it instantly turns **RED (Impassable)** on the map.
* Safe alternative corridors turn **GREEN (Verified Safe)** with turn-by-turn waypoint navigation.

### 3. Tactical Wildfire AI Chatbot
* Located at the bottom-right of the HUD.
* Instant, context-aware answers to critical safety questions (*"Is County Route 4 open?"*, *"Where is the nearest shelter?"*).
* Powered by TypeSafe Jev intent routing for sub-second responses with zero hallucinations.

### 4. Automated ICS-209 Situational Report Generator
* Generates standardized Federal Incident Command System (ICS-209) incident dossiers with one click.
* Includes incident acreage, weather conditions, critical infrastructure threatened, Jev tactical arbitrations, and resource orders.

---

## 📱 Africa's Talking USSD Emergency Integration

In rural and wildland-urban interface (WUI) zones, cell towers often burn or mobile broadband fails, leaving citizens with only basic 2G GSM feature phones.

PyroShield AI integrates **Africa's Talking USSD protocol**:
* **Callback Endpoint:** `https://pyroshieldai.codewitheugene.top/api/ussd`
* **Demo USSD Dial:** `*384*2026#`

### Interactive USSD Menu Flow
```
Dial *384*2026#
│
├── 1. Check Current Fire Threat
│    └── Shows active fire status, wind speed, and red flag warnings.
│
├── 2. Check Evacuation Route Status (Jev Evaluated)
│    └── Returns live road status: CR-4 IMPASSABLE; Pine Crest Alt SAFE.
│
├── 3. Report Spot Fire or Smoke
│    └── Citizen enters text (e.g. "Mile 4 smoke on road"); ingested by Jev.
│
└── 4. Emergency Helplines
     └── Displays direct contacts for Fire & Rescue, Evacuation Center.
```

---

## ♿ Accessibility & Field Usability

Disasters occur under conditions of extreme stress, thick blinding smoke, power outages, and physical panic. PyroShield AI features a dedicated **Accessibility Engine** anchored in the bottom-right floating HUD:

* **High-Contrast Tactical Mode:** Instantly toggles ultra-high-contrast borders, bold text, and high-visibility hazard badges.
* **Font Scaling Engine:** Toggle between Normal (100%), Large (125%), and Extra Large (150%) text sizes.
* **Text-to-Speech (TTS) Voice Alerts:** Audibly announces active road closures and emergency broadcast warnings via the Web Speech API.
* **Reduced Motion:** Disables animated pulse waves and radar sweeps for users with vestibular sensitivities.
* **Screen Reader Live Regions:** `aria-live="assertive"` announcements for immediate life-critical notifications.

---

## 💻 Local Development & Setup

### Prerequisites
* **Node.js:** v18.0.0 or higher (v20+ recommended)
* **pnpm:** v9+ or v11+ (or npm / yarn)
* **TypeSafe API Key:** Set in environment as `TYPESAFE_API_KEY`

### 1. Clone the Repository
```bash
git clone https://github.com/CodeWithEugene/NextStep-Hacks-2026.git
cd NextStep-Hacks-2026
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Configure Environment Variables
Create `.env.local` in the project root:
```bash
TYPESAFE_API_KEY=your_typesafe_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
pnpm build
pnpm start
```

---

## 🔐 Environment Variables

| Variable | Description | Required | Scope |
| :--- | :--- | :---: | :--- |
| `TYPESAFE_API_KEY` | TypeSafe AI production API key for Jev model inference | **Yes** | Server-Side Only (`app/api/*`) |
| `NEXT_PUBLIC_APP_URL` | Public base URL of the deployment | **Yes** | Public (`client + server`) |

---

## 🏆 Hackathon Rubric Alignment

| Rubric Criterion | Hackathon Requirement | How PyroShield AI Wins |
| :--- | :--- | :--- |
| **Originality** | *Has this been done before? Creative approach?* | Replaces static disaster heatmaps with **Semantic System One Incident Operations**—using TypeSafe Jev for real-time verification and dynamic road risk distributions. |
| **Adherence to Track** | *Adherence to "Earth Forward"?* | Directly targets catastrophic megafires—protecting carbon sinks, saving wildlife habitats, and building climate resilience for human communities. |
| **Completion** | *Does the hack work end-to-end?* | Complete end-to-end pipeline: Live satellite/weather ingestion, Jev reasoning, interactive GIS map, dynamic routing, Africa's Talking USSD, and ICS-209 reporting. |
| **Learning** | *Did the team stretch themselves?* | Mastered TypeSafe System One architecture (`Noul`, `Score`, `Choice`), NASA FIRMS telemetry, GIS vector calculations, and GSM USSD protocol design. |
| **Design (UI/UX)** | *User experience & interface polish?* | 100% authentic **shadcn/ui** dark tactical HUD, responsive mobile drawer, Recharts telemetry, and dedicated accessibility controls. |
| **Technology** | *Technically impressive, "wow" factor?* | Multi-modal sensor fusion + sub-second calibrated semantic arbitration + dynamic pathfinding + multi-channel mobile and USSD failover. |

---

## 📄 License & Acknowledgements

* **License:** This project is licensed under the [MIT License](LICENSE.md).
* **Organizers:** Created for [NextStep Hacks 2026](https://nextstep2026.devpost.com/) hosted by [HackAlphaX](https://devpost.com/hackathons?organization=HackAlphaX).
* **AI Partner:** Built with [TypeSafe AI](https://typesafe.ai) using model `jev-latest`.
* **Telemetry:** Powered by NASA FIRMS, Open-Meteo, NOAA, and USGS open APIs.
* **UI Foundation:** Designed with [shadcn/ui](https://ui.shadcn.com/) and [Tailwind CSS](https://tailwindcss.com/).
