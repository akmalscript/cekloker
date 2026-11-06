import type { components } from "./api";

export type AnalysisResult = components["schemas"]["AnalysisResult"];
export type RedFlag = components["schemas"]["RedFlag"];
export type Region = components["schemas"]["Region"];
export type BBox = components["schemas"]["BBox"];
export type Extracted = components["schemas"]["Extracted"];
export type Fingerprint = components["schemas"]["Fingerprint"];
export type Meta = components["schemas"]["Meta"];

export type RiskLevel = "aman" | "waspada" | "bahaya";
export type FlagSeverity = "waspada" | "bahaya";
