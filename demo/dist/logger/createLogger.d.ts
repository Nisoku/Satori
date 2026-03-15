import type { SatoriLogger, SatoriConfig, EventBus, LogEntry, LogOptions, WatchSource, WhenPredicate, WhenCallback, WatchHandle } from "../core/types.js";
export declare class ScopedLogger implements SatoriLogger {
    readonly scope: string;
    private config;
    private bus;
    private lastEventId?;
    private inheritedTags;
    private inheritedCause?;
    private inheritedCauseEventId?;
    private watcherEngine;
    private disposed;
    private levelSeverities;
    constructor(scope: string, config: SatoriConfig, bus: EventBus, lastEventId?: string | undefined);
    event(message: string, options?: LogOptions): void;
    info(message: string, options?: LogOptions): void;
    warn(message: string, options?: LogOptions): void;
    error(message: string, options?: LogOptions): void;
    debug(message: string, options?: LogOptions): void;
    /**
     * Log with any level (built-in or custom)
     */
    log(level: string, message: string, options?: LogOptions): void;
    tag(...tags: string[]): SatoriLogger;
    causedBy(messageOrEvent: string | LogEntry): SatoriLogger;
    watch<T>(source: WatchSource<T>, label?: string): WatchHandle;
    when<T>(source: WatchSource<T>, predicate: WhenPredicate<T>, onTrigger: WhenCallback<T>): WatchHandle;
    /**
     * Get the number of active watchers on this logger
     */
    getWatcherCount(): number;
    /**
     * Dispose this logger and all its watchers
     */
    dispose(): void;
    /**
     * Check if this logger has been disposed
     */
    isDisposed(): boolean;
}
