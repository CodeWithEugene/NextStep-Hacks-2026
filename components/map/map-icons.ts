import type { AssetType, CriticalAsset, CitizenGroundReport, EvacuationRoute } from "@/lib/types/incident";

export const ROUTE_COLORS: Record<EvacuationRoute["statusBadge"], string> = {
  IMPASSABLE: "#ef4444",
  HAZARDOUS: "#f59e0b",
  CLEAR: "#10b981",
  PENDING: "#64748b",
};

const ASSET_STYLE: Record<AssetType, { color: string; svg: string; label: string }> = {
  substation: {
    color: "#eab308",
    label: "Substation",
    svg: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  },
  school: {
    color: "#38bdf8",
    label: "School",
    svg: '<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/><path d="M12 9h.01"/>',
  },
  hospital: {
    color: "#f87171",
    label: "Hospital",
    svg: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 7v10M7 12h10"/>',
  },
  water_treatment: {
    color: "#60a5fa",
    label: "Water plant",
    svg: '<path d="M12 2.7c-3 3.6-6 6.8-6 10.3a6 6 0 0 0 12 0c0-3.5-3-6.7-6-10.3z"/>',
  },
  residential_cluster: {
    color: "#c084fc",
    label: "Residential",
    svg: '<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/>',
  },
  senior_care: {
    color: "#f472b6",
    label: "Senior care",
    svg: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 12 5a5.5 5.5 0 0 0-10 3.5c0 2.3 1.5 4 3 5.5l7 7z"/><path d="M3.5 12h5l1.5-3 3 6 1.5-3h5"/>',
  },
};

export function assetStyle(type: AssetType) {
  return ASSET_STYLE[type] ?? ASSET_STYLE.residential_cluster;
}

export function assetIconHtml(asset: CriticalAsset): string {
  const s = assetStyle(asset.type);
  const ring =
    asset.defensibility_status === "threatened"
      ? "#ef4444"
      : asset.defensibility_status === "defensible"
        ? "#f59e0b"
        : asset.defensibility_status === "evacuated"
          ? "#a1a1aa"
          : "#10b981";
  return `
  <div class="flex flex-col items-center" style="width:120px;margin-left:-46px">
    <div style="width:28px;height:28px;border-radius:8px;background:#09090b;border:2px solid ${ring};display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.6)">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="${s.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${s.svg}</svg>
    </div>
    <div style="margin-top:3px;font-size:10px;font-weight:600;color:#e4e4e7;text-shadow:0 1px 3px #000;white-space:nowrap;max-width:120px;overflow:hidden;text-overflow:ellipsis">${asset.name.split(" (")[0].split(" ").slice(0, 3).join(" ")}</div>
  </div>`;
}

export function routeGlyphHtml(status: EvacuationRoute["statusBadge"], level?: number): string {
  const color = ROUTE_COLORS[status];
  const glyph = status === "IMPASSABLE" ? "✕" : status === "HAZARDOUS" ? "!" : status === "CLEAR" ? "✓" : "?";
  const pulse = status === "IMPASSABLE" ? `<span style="position:absolute;inset:-6px;border-radius:999px;background:${color};opacity:.35" class="animate-ping"></span>` : "";
  return `
  <div style="position:relative;width:26px;height:26px">
    ${pulse}
    <div style="position:relative;width:26px;height:26px;border-radius:999px;background:${color};color:#fff;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center;border:2px solid #09090b;box-shadow:0 2px 10px rgba(0,0,0,.6)">${glyph}</div>
    ${level ? `<div style="position:absolute;left:50%;transform:translateX(-50%);top:28px;font-size:9px;font-family:ui-monospace,monospace;font-weight:700;color:${color};text-shadow:0 1px 2px #000;white-space:nowrap">L${level}</div>` : ""}
  </div>`;
}

export function reportIconHtml(report: CitizenGroundReport): string {
  const color = report.pending ? "#f59e0b" : report.verifiedByJev ? "#10b981" : report.verifiedByJev === false ? "#71717a" : "#94a3b8";
  const glyph = report.pending ? "…" : report.verifiedByJev ? "✓" : report.verifiedByJev === false ? "✕" : "?";
  return `<div style="width:18px;height:18px;border-radius:999px;background:#09090b;border:2px solid ${color};color:${color};font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.6)">${glyph}</div>`;
}

export function shelterIconHtml(name: string): string {
  return `
  <div class="flex flex-col items-center" style="width:140px;margin-left:-56px">
    <div style="width:28px;height:28px;border-radius:999px;background:#052e16;border:2px solid #10b981;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 4px rgba(16,185,129,.2)">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#34d399" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M12 13v4M10 15h4"/></svg>
    </div>
    <div style="margin-top:3px;font-size:10px;font-weight:700;color:#6ee7b7;text-shadow:0 1px 3px #000;white-space:nowrap;max-width:140px;overflow:hidden;text-overflow:ellipsis">SHELTER · ${name.split(" ").slice(0, 3).join(" ")}</div>
  </div>`;
}
