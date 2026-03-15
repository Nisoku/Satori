import type {
  LogLevel,
  RateLimitConfig,
  DeduplicationConfig,
  CircuitBreakerConfig,
} from "./types.js";

export interface SatoriConfig {
  enableCallsite?: boolean;
  enableEnvInfo?: boolean;
  enableStateSnapshot?: boolean;
  enableCausalLinks?: boolean;
  enableMetrics?: boolean;
  enableConsole?: boolean;

  stateSelectors?: Array<{
    name?: string;
    selector: () => Record<string, unknown>;
  }>;

  maxBufferSize?: number;
  logLevel?: LogLevel;

  appVersion?: string;

  pollingInterval?: number;

  customLevels?: Array<{ name: string; severity: number; color?: string }>;

  rateLimiting?: Partial<RateLimitConfig>;
  deduplication?: Partial<DeduplicationConfig>;
  circuitBreaker?: Partial<CircuitBreakerConfig>;
}

export type { LogLevel } from "./types.js";

export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  enabled: false,
  maxEventsPerSecond: 1000,
  samplingRate: 0.1,
  strategy: "sample",
  bufferSize: 100,
};

export const DEFAULT_DEDUP_CONFIG: DeduplicationConfig = {
  enabled: false,
  windowMs: 5000,
  fields: ["message", "scope", "level"],
  maxCacheSize: 1000,
};

export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  enabled: false,
  failureThreshold: 5,
  resetTimeout: 30000,
  successThreshold: 3,
};

export const DEFAULT_CONFIG: Required<
  Omit<SatoriConfig, "rateLimiting" | "deduplication" | "circuitBreaker">
> & {
  rateLimiting: RateLimitConfig;
  deduplication: DeduplicationConfig;
  circuitBreaker: CircuitBreakerConfig;
} = {
  enableCallsite: true,
  enableEnvInfo: true,
  enableStateSnapshot: false,
  enableCausalLinks: true,
  enableMetrics: true,
  enableConsole: true,
  stateSelectors: [],
  maxBufferSize: 1000,
  logLevel: "info",
  appVersion: "1.0.0",
  pollingInterval: 250, // More reasonable default
  customLevels: [],
  rateLimiting: DEFAULT_RATE_LIMIT_CONFIG,
  deduplication: DEFAULT_DEDUP_CONFIG,
  circuitBreaker: DEFAULT_CIRCUIT_BREAKER_CONFIG,
};
