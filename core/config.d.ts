import type { LogLevel } from './types.js';
export interface SatoriConfig {
    enableCallsite?: boolean;
    enableEnvInfo?: boolean;
    enableStateSnapshot?: boolean;
    enableCausalLinks?: boolean;
    stateSelectors?: Array<() => Record<string, any>>;
    maxBufferSize?: number;
    logLevel?: LogLevel;
    appVersion?: string;
    pollingInterval?: number;
}
export type { LogLevel } from './types.js';
export declare const DEFAULT_CONFIG: Required<SatoriConfig>;
