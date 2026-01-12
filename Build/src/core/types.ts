export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogEntryBase {
  id: string;
  timestamp: number;
  level: LogLevel;
  scope: string;           // e.g. "network", "ui", "auth"
  message: string;
  tags: string[];
  cause?: string;          // human-readable cause
  causeEventId?: string;   // link to previous event
  suggest?: string;
  state?: Record<string, any>;
  callsite?: string;       // file:line:column (or best-effort)
  previousEventId?: string;
  env?: {
    platform?: string;
    userAgent?: string;
    appVersion?: string;
    [key: string]: any;
  };
}

export interface LogEntryMeta {
  // internal metadata that doesn't need to be serialized
  __internal?: {
    // Will be extended
    isReplay?: boolean;
  };
}

export type LogEntry = LogEntryBase & LogEntryMeta;

