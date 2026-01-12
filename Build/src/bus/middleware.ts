import type { LogEntry } from "../core/types";

export type SatoriMiddleware = (entry: LogEntry) => LogEntry | null | void;
