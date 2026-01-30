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

export const DEFAULT_CONFIG: Required<SatoriConfig> = {
  enableCallsite: true,
  enableEnvInfo: true,
  enableStateSnapshot: false,
  enableCausalLinks: true,
  stateSelectors: [],
  maxBufferSize: 1000,
  logLevel: "info",
  appVersion: "1.0.0",
  pollingInterval: 100,
};