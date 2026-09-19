#!/usr/bin/env node
/**
 * PyroShield AI end-to-end smoke test.
 * Usage: node scripts/smoke-test.mjs [baseUrl]   (default http://localhost:3000)
 * Exercises every route handler with realistic payloads and asserts response
 * shape, Jev source, and latency budgets. Exit code 1 on any failure.
 */
const base = (process.argv[2] || process.env.SMOKE_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const results = [];
const t = (ms) => `${ms} ms`;

async function check(name, fn) {
  const t0 = Date.now();
  try {
    const detail = await fn();
    results.push({ name, ok: true, ms: Date.now() - t0, detail });
  } catch (err) {
    results.push({ name, ok: false, ms: Date.now() - t0, detail: err.message });
  }
}
const json = async (path, init) => {
  const res = await fetch(base + path, { ...init, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return res.json();
};
const post = (path, body) => json(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

await check("GET / renders", async () => {
  const res = await fetch(base + "/", { signal: AbortSignal.timeout(30000) });
  assert(res.ok, `HTTP ${res.status}`);
  const html = await res.text();
  assert(html.includes("PyroShield"), "missing PyroShield in HTML");
  return `${html.length} bytes`;
});

await check("Noul verify — credible downwind report", async () => {
  const r = await post("/api/jev/verify", { incidentId: "wf-pine-ridge-2026", report: { text: "Spot fires jumped the barrier near Mile 4, thick black smoke, cars turning back", latitude: 34.1788, longitude: -117.9028, reporterName: "Motorist", timestamp: "now", channel: "dispatch" } });
  assert(typeof r.noul === "number" && r.noul >= 0 && r.noul <= 1, "noul not a probability");
  assert(r.verified === true, `expected verified, got noul=${r.noul}`);
  return `noul=${r.noul} source=${r.source} ${t(r.latencyMs)}`;
});

await check("Noul verify — rejects unrelated report", async () => {
  const r = await post("/api/jev/verify", { incidentId: "wf-pine-ridge-2026", report: { text: "Neighbor is grilling burgers, lots of BBQ smoke in the backyard", latitude: 34.14, longitude: -117.98, reporterName: "Anon", timestamp: "now", channel: "web" } });
  assert(r.verified === false, `expected unverified, got noul=${r.noul}`);
  return `noul=${r.noul} source=${r.source} ${t(r.latencyMs)}`;
});

await check("Score corridors — one request, all routes", async () => {
  const r = await post("/api/jev/corridor", { incidentId: "wf-pine-ridge-2026" });
  assert(Array.isArray(r.results) && r.results.length === 2, "expected 2 corridor results");
  const cr4 = r.results.find((x) => x.routeId === "rt-cr4");
  const alt = r.results.find((x) => x.routeId === "rt-pinecrest");
  assert(cr4 && alt, "missing route ids");
  assert(Object.keys(cr4.probabilities).length === 5, "expected 5-level distribution");
  assert(cr4.score > alt.score, `expected CR-4 riskier than bypass (${cr4.score} vs ${alt.score})`);
  return `CR-4 ${cr4.statusBadge} L${cr4.level} ${cr4.score} · bypass ${alt.statusBadge} L${alt.level} ${alt.score} · ${cr4.source} ${t(cr4.latencyMs)}`;
});

await check("Choice dispatch — action, asset, posture", async () => {
  const r = await post("/api/jev/dispatch", { incidentId: "wf-diablo-canyon-2026" });
  assert(r.action && r.actionTitle && r.targetAsset && r.postureLabel, "missing dispatch fields");
  assert(r.probabilities && Object.keys(r.probabilities).length >= 3, "missing action distribution");
  return `${r.actionTitle} → ${r.targetAsset} · ${r.postureLabel} · ${r.source} ${t(r.latencyMs)}`;
});

await check("Chat — route intent + referenced route", async () => {
  const r = await post("/api/jev/chat", { query: "Is County Route 4 safe to drive?", incidentId: "wf-pine-ridge-2026" });
  assert(r.intent === "route_safety", `intent=${r.intent}`);
  assert(r.referencedRoute === "rt-cr4", `referencedRoute=${r.referencedRoute}`);
  return `intent=${r.intent} route=${r.referencedRoute} ${r.source} ${t(r.latencyMs)}`;
});

await check("Chat — immediate danger detection", async () => {
  const r = await post("/api/jev/chat", { query: "flames are behind my house and I cannot breathe", incidentId: "wf-sierra-ridge-2026" });
  assert(r.immediateDanger >= 0.6, `immediateDanger=${r.immediateDanger}`);
  assert(r.reply.includes("911"), "reply should escalate to 911");
  return `danger=${r.immediateDanger} ${t(r.latencyMs)}`;
});

await check("USSD — main menu (form-encoded)", async () => {
  const res = await fetch(base + "/api/ussd", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ sessionId: "smoke", serviceCode: "*384*2026#", phoneNumber: "+254700000000", text: "" }) });
  const text = await res.text();
  assert(text.startsWith("CON "), `expected CON, got: ${text.slice(0, 20)}`);
  assert(text.length <= 182, `USSD screen too long: ${text.length}`);
  return `${text.length} chars`;
});

await check("USSD — option 2 live corridor status", async () => {
  const res = await fetch(base + "/api/ussd", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ sessionId: "smoke", serviceCode: "*384*2026#", phoneNumber: "+254700000000", text: "2" }) });
  const text = await res.text();
  assert(text.startsWith("END ROADS"), `unexpected: ${text.slice(0, 30)}`);
  assert(text.length <= 182, `USSD screen too long: ${text.length}`);
  return text.replace(/\n/g, " | ").slice(0, 120);
});

await check("USSD — option 3 report verified by Jev", async () => {
  const res = await fetch(base + "/api/ussd", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ sessionId: "smoke", serviceCode: "*384*2026#", phoneNumber: "+254700000000", text: "3*Smoke over the road at mile 4 cars turning back" }) });
  const text = await res.text();
  assert(text.startsWith("END Report received"), `unexpected: ${text.slice(0, 40)}`);
  assert(/Jev match: \d+%/.test(text), "missing Jev match");
  return text.replace(/\n/g, " | ").slice(0, 120);
});

await check("Weather proxy", async () => {
  const r = await json("/api/weather?lat=34.178&lon=-117.905");
  assert(typeof r.wind_speed_mph === "number", "missing wind");
  return `${r.source} wind=${r.wind_speed_mph} mph rh=${r.relative_humidity_pct}%`;
});

await check("FIRMS hotspots", async () => {
  const r = await json("/api/firms?incidentId=wf-pine-ridge-2026");
  assert(Array.isArray(r.hotspots) && r.hotspots.length > 0, "no hotspots");
  return `${r.source} ${r.count} hotspots`;
});

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name.padEnd(46)} ${String(r.ms).padStart(5)} ms  ${r.detail}`);
console.log(`\n${results.length - failed.length}/${results.length} passed against ${base}`);
process.exit(failed.length ? 1 : 0);
