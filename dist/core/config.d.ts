import type { LogLevel, RateLimitConfig, DeduplicationConfig, CircuitBreakerConfig } from "./types.js";
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
    customLevels?: Array<{
        name: string;
        severity: number;
        color?: string;
    }>;
    rateLimiting?: Partial<RateLimitConfig>;
    deduplication?: Partial<DeduplicationConfig>;
    circuitBreaker?: Partial<CircuitBreakerConfig>;
}
export type { LogLevel } from "./types.js";
export declare const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig;
export declare const DEFAULT_DEDUP_CONFIG: DeduplicationConfig;
export declare const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig;
export declare const DEFAULT_CONFIG: Required<Omit<SatoriConfig, "rateLimiting" | "deduplication" | "circuitBreaker">> & {
    rateLimiting: RateLimitConfig;
    deduplication: DeduplicationConfig;
    circuitBreaker: CircuitBreakerConfig;
};
