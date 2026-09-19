import { TypeSafeClient, choice, noul, score } from "@typesafe-ai/sdk";

/**
 * Server-side TypeSafe Jev client. Never import this from a client component:
 * the API key must stay on the server (Next.js Route Handlers only).
 */
export const JEV_MODEL = process.env.TYPESAFE_DEFAULT_MODEL || "jev-latest";

let cached: TypeSafeClient | null = null;

export function isJevConfigured(): boolean {
  return Boolean(process.env.TYPESAFE_API_KEY && process.env.TYPESAFE_API_KEY.trim());
}

export function getJevClient(): TypeSafeClient {
  if (!cached) {
    cached = new TypeSafeClient({
      apiKey: process.env.TYPESAFE_API_KEY,
      defaultModel: JEV_MODEL,
      // Emergency ops: fail fast and fall back rather than hang a dispatcher.
      timeout: 6000,
      retry: { maxRetries: 1, backoffInitialMs: 250 },
      logLevel: "warn",
    });
  }
  return cached;
}

/** Wrap a promise and report wall-clock latency in milliseconds. */
export async function timed<T>(fn: () => Promise<T>): Promise<{ result: T; latencyMs: number }> {
  const t0 = Date.now();
  const result = await fn();
  return { result, latencyMs: Date.now() - t0 };
}

export { choice, noul, score };
