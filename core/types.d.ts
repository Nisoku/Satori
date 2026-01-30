export interface SatoriLogger {
    scope: string;
    event(message: string, options?: LogOptions): void;
    info(message: string, options?: LogOptions): void;
    warn(message: string, options?: LogOptions): void;
    error(message: string, options?: LogOptions): void;
    debug(message: string, options?: LogOptions): void;
    tag(...tags: string[]): SatoriLogger;
    causedBy(messageOrEvent: string | LogEntry): SatoriLogger;
    watch<T>(source: WatchSource<T>, label?: string): WatchHandle;
    when<T>(source: WatchSource<T>, predicate: WhenPredicate<T>, onTrigger: WhenCallback<T>): WatchHandle;
}
export type WatchSource<T> = (() => T) | (T & {
    readonly __brand: unique symbol;
});
export type WhenPredicate<T> = (prev: T | undefined, next: T) => boolean;
export type WhenCallback<T> = (value: T, prev: T | undefined) => void;
export interface WatchHandle {
    dispose(): void;
}
export type LogLevel = "info" | "warn" | "error" | "debug";
export interface LogOptions {
    tags?: string[];
    state?: Record<string, any>;
    cause?: string;
    causeEventId?: string;
    suggest?: string;
}
export interface LogEntryBase {
    id: string;
    timestamp: number;
    level: LogLevel;
    scope: string;
    message: string;
    tags: string[];
    cause?: string;
    causeEventId?: string;
    suggest?: string;
    state?: Record<string, any>;
    callsite?: string;
    previousEventId?: string;
    env?: {
        platform?: string;
        userAgent?: string;
        appVersion?: string;
        [key: string]: any;
    };
}
export interface LogEntryMeta {
    __internal?: {
        isReplay?: boolean;
    };
}
export type LogEntry = LogEntryBase & LogEntryMeta;
export interface EventBus {
    publish(entry: LogEntry): void;
    subscribe(fn: EventSubscriber): () => void;
    use(middleware: Middleware): void;
    getReplayBuffer?(): LogEntry[];
}
export type EventSubscriber = (entry: LogEntry) => void;
export type Middleware = (entry: LogEntry, next: () => void) => void;
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
export interface SatoriInstance {
    config: SatoriConfig;
    bus: EventBus;
    rootLogger: SatoriLogger;
    createLogger(scope: string): SatoriLogger;
    dispose(): void;
}
