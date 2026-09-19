export interface ThermalHotspot {
  id: string;
  latitude: number;
  longitude: number;
  frp_mw: number; // Fire Radiative Power in Megawatts
  confidence: number; // 0-100%
  satellite: "VIIRS_NOAA20" | "VIIRS_SNPP" | "VIIRS_NOAA21" | "MODIS_AQUA" | "MODIS_TERRA";
  acquisition_time: string;
}

export interface WeatherTelemetry {
  wind_speed_mph: number;
  wind_direction_degrees: number; // 0-360, meteorological (direction wind blows FROM)
  gusts_mph: number;
  relative_humidity_pct: number;
  ambient_temp_f: number;
  fuel_moisture_pct: number;
  red_flag_active: boolean;
}

export type AssetType =
  | "substation"
  | "school"
  | "hospital"
  | "water_treatment"
  | "residential_cluster"
  | "senior_care";

export interface CriticalAsset {
  id: string;
  name: string;
  type: AssetType;
  latitude: number;
  longitude: number;
  distance_miles: number;
  occupancy?: number;
  defensibility_status: "threatened" | "defensible" | "evacuated" | "secured";
}

export type RouteStatus = "IMPASSABLE" | "HAZARDOUS" | "CLEAR" | "PENDING";

export interface EvacuationRoute {
  id: string;
  name: string;
  points: [number, number][]; // [lat, lng] array
  isImpassable: boolean;
  hazardScore: number; // 1-5 expected score
  confidence: number;
  chokepointDesc?: string;
  statusBadge: RouteStatus;
  /** Jev Score probability distribution keyed "0".."4" (Level 1..5). */
  probabilities?: Record<string, number>;
  /** True once the live Jev Score primitive has evaluated this corridor. */
  evaluated?: boolean;
  evaluatedAt?: string;
  latencyMs?: number;
  source?: "jev" | "fallback" | "baseline";
  canyon_topography?: "steep_canyon_chimney" | "steep_flanks" | "rolling_foothills" | "open_valley";
}

export interface CitizenGroundReport {
  id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  text: string;
  reporterName: string;
  channel?: "web" | "ussd" | "dispatch" | "field_unit";
  verifiedByJev?: boolean;
  jevNoulScore?: number;
  pending?: boolean;
}

export interface EvacuationShelter {
  name: string;
  address: string;
  capacity: number;
  latitude: number;
  longitude: number;
  amenities: string[];
}

export interface TimelinePoint {
  hour: string;
  acres: number;
  frp_mw: number;
  spread_rate: number;
}

export interface WildfireIncident {
  id: string;
  name: string;
  incident_number: string;
  location_name: string;
  center_lat: number;
  center_lng: number;
  zoom: number;
  acres_burned: number;
  containment_pct: number;
  spread_rate_mph: number;
  spread_azimuth_deg: number;
  fuel_model: string;
  terrain_summary: string;
  perimeter_polygon: [number, number][]; // [lat, lng] perimeter vertices
  hotspots: ThermalHotspot[];
  weather: WeatherTelemetry;
  assets: CriticalAsset[];
  routes: EvacuationRoute[];
  reports: CitizenGroundReport[];
  shelter: EvacuationShelter;
  available_resources: string[];
  timelineData: TimelinePoint[];
}
