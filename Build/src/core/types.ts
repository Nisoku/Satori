export interface SatoriLogger {
  scope: string;

  event(message: string, options?: LogOptions): void;
  info(message: string, options?: LogOptions): void;
  warn(message: string, options?: LogOptions): void;
  error(message: string, options?: LogOptions): void;
  debug(message: string, options?: LogOptions): void;

  /** Log with a custom level (must be defined in config.customLevels) */
  log(level: string, message: string, options?: LogOptions): void;

  tag(...tags: string[]): SatoriLogger;
  causedBy(messageOrEvent: string | LogEntry): SatoriLogger;

  watch<T>(source: WatchSource<T>, label?: string): WatchHandle;
  when<T>(
    source: WatchSource<T>,
    predicate: WhenPredicate<T>,
    onTrigger: WhenCallback<T>,
  ): WatchHandle;

  /** Dispose of all watchers associated with this logger */
  dispose(): void;
}

export type WatchSource<T> =
  (() => T) | (T & { readonly __brand: unique symbol });
export type WhenPredicate<T> = (prev: T | undefined, next: T) => boolean;
export type WhenCallback<T> = (value: T, prev: T | undefined) => void;

export interface WatchHandle {
  dispose(): void;
}

/** Built-in log levels */
export type LogLevel = "info" | "warn" | "error" | "debug";

/** Custom log level definition */
export interface CustomLogLevel {
  name: string;
  severity: number; // 0 = lowest (debug), higher = more severe
  color?: string; // Optional color for UI display
}

export interface LogOptions<TState = Record<string, unknown>> {
  tags?: string[];
  state?: TState;
  cause?: string;
  causeEventId?: string;
  suggest?: string;
  /** Skip deduplication for this event */
  skipDedup?: boolean;
  /** Skip rate limiting for this event */
  skipRateLimit?: boolean;
}

export interface LogEntryBase {
  id: string;
  timestamp: number;
  level: string; // Can be LogLevel or custom level name
  scope: string;
  message: string;
  tags: string[];
  cause?: string;
  causeEventId?: string;
  suggest?: string;
  state?: Record<string, unknown>;
  callsite?: string;
  previousEventId?: string;
  /** IDs of events that this event caused (forward links) */
  causedEventIds?: string[];
  env?: EnvironmentInfo;
}

export interface EnvironmentInfo {
  platform: RuntimePlatform;
  userAgent?: string;
  appVersion?: string;
  nodeVersion?: string;
  arch?: string;
  url?: string;
  referrer?: string;
  denoVersion?: string;
  bunVersion?: string;
  [key: string]: unknown;
}

export type RuntimePlatform =
  | "browser"
  | "node"
  | "deno"
  | "bun"
  | "cloudflare-workers"
  | "edge"
  | "unknown";

export interface LogEntryMeta {
  __internal?: {
    isReplay?: boolean;
    dedupKey?: string;
    droppedByRateLimit?: boolean;
    sampled?: boolean;
  };
}

export type LogEntry = LogEntryBase & LogEntryMeta;

export interface EventBus {
  publish(entry: LogEntry): void;
  subscribe(fn: EventSubscriber): () => void;
  use(middleware: Middleware): void;
  getReplayBuffer?(): LogEntry[];
  /** Get current metrics */
  getMetrics?(): BusMetrics;
}

export interface BusMetrics {
  totalPublished: number;
  totalDropped: number;
  totalSampled: number;
  totalDeduplicated: number;
  eventsPerSecond: number;
  bufferSize: number;
  subscriberCount: number;
}

export type EventSubscriber = (entry: LogEntry) => void;
export type Middleware = (entry: LogEntry, next: () => void) => void;

/** Rate limiting configuration */
export interface RateLimitConfig {
  enabled: boolean;
  /** Maximum events per second before dropping */
  maxEventsPerSecond: number;
  /** Sampling rate when rate limited (0-1, 1 = keep all, 0 = drop all) */
  samplingRate: number;
  /** Strategy when rate limited */
  strategy: "drop" | "sample" | "buffer";
  /** Buffer size when strategy is 'buffer' */
  bufferSize?: number;
}

/** Deduplication configuration */
export interface DeduplicationConfig {
  enabled: boolean;
  /** Time window for deduplication in ms */
  windowMs: number;
  /** Fields to use for deduplication hash */
  fields: Array<"message" | "scope" | "level" | "tags" | "state">;
  /** Maximum dedupe cache size */
  maxCacheSize: number;
}

/** Circuit breaker states */
export type CircuitState = "closed" | "open" | "half-open";

/** Circuit breaker configuration */
export interface CircuitBreakerConfig {
  enabled: boolean;
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Time to wait before trying half-open (ms) */
  resetTimeout: number;
  /** Number of successes needed to close from half-open */
  successThreshold: number;
}

export interface SatoriConfig {
  enableCallsite?: boolean;
  enableEnvInfo?: boolean;
  enableStateSnapshot?: boolean;
  enableCausalLinks?: boolean;
  /** Enable self-monitoring metrics */
  enableMetrics?: boolean;
  /** Enable automatic console logging */
  enableConsole?: boolean;

  stateSelectors?: Array<StateSelector>;

  maxBufferSize?: number;
  logLevel?: LogLevel;

  appVersion?: string;

  pollingInterval?: number;

  /** Custom log levels */
  customLevels?: CustomLogLevel[];

  /** Rate limiting config */
  rateLimiting?: Partial<RateLimitConfig>;

  /** Deduplication config */
  deduplication?: Partial<DeduplicationConfig>;

  /** Circuit breaker for error recovery */
  circuitBreaker?: Partial<CircuitBreakerConfig>;

  /** Persistence configuration */
  persistence?: PersistenceConfig;
}

/** State selector with optional name for better snapshots */
export interface StateSelector<T = Record<string, unknown>> {
  name?: string;
  selector: () => T;
}

/** Persistence configuration */
export interface PersistenceConfig {
  enabled: boolean;
  /** Adapter to use for persistence */
  adapter: PersistenceAdapter;
  /** Flush interval in ms (for batching) */
  flushInterval?: number;
  /** Batch size before auto-flush */
  batchSize?: number;
}

/** Persistence adapter interface */
export interface PersistenceAdapter {
  name: string;
  write(entries: LogEntry[]): Promise<void>;
  read(options?: PersistenceReadOptions): Promise<LogEntry[]>;
  clear?(): Promise<void>;
  close?(): Promise<void>;
}

export interface PersistenceReadOptions {
  limit?: number;
  offset?: number;
  startTime?: number;
  endTime?: number;
  levels?: string[];
  scopes?: string[];
}

export interface SatoriInstance {
  config: SatoriConfig;
  bus: EventBus;
  rootLogger: SatoriLogger;
  createLogger(scope: string): SatoriLogger;
  /** Get metrics about the instance */
  getMetrics(): SatoriMetrics;
  /** Flush persistence buffer */
  flush(): Promise<void>;
  dispose(): void;
}

export interface SatoriMetrics {
  bus: BusMetrics;
  loggerCount: number;
  watcherCount: number;
  circuitState?: CircuitState;
  uptime: number;
}
