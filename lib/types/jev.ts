export type JevSource = "jev" | "fallback";

export interface JevMeta {
  source: JevSource;
  model: string;
  latencyMs: number;
}

export interface JevVerifyResponse extends JevMeta {
  verified: boolean;
  confidence: number;
  noul: number;
  interpretation: string;
}

export interface JevCorridorResponse extends JevMeta {
  score: number; // expected score 0-4 (Level 1-5)
  level: number; // 1-5 rounded display level
  confidence: number;
  probabilities: Record<string, number>;
  isImpassable: boolean;
  statusBadge: "IMPASSABLE" | "HAZARDOUS" | "CLEAR";
  interpretation: string;
}

export interface JevDispatchResponse extends JevMeta {
  action: string;
  actionTitle: string;
  confidence: number;
  probabilities: Record<string, number>;
  targetAsset: string;
  targetAssetConfidence: number;
  assetProbabilities: Record<string, number>;
  rationale: string;
}

export interface JevChatResponse extends JevMeta {
  reply: string;
  intent: string;
  confidence: number;
  referencedRoute?: string;
  immediateDanger?: number;
}

export interface JevDecisionLog {
  id: string;
  timestamp: string;
  primitive: "Noul" | "Score" | "Choice";
  title: string;
  result: string;
  confidence: number;
  details: string;
  latencyMs?: number;
  source?: JevSource;
}
