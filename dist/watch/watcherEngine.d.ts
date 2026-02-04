import type { SatoriLogger, WatchSource, WhenPredicate, WhenCallback, WatchHandle, SatoriConfig } from '../core/types.js';
export declare class WatcherEngine {
    private logger;
    private config;
    private watchers;
    private whenHandlers;
    private circuitBreaker;
    private disposed;
    constructor(logger: SatoriLogger, config: SatoriConfig);
    watch<T>(source: WatchSource<T>, label?: string): WatchHandle;
    when<T>(source: WatchSource<T>, predicate: WhenPredicate<T>, onTrigger: WhenCallback<T>): WatchHandle;
    private disposeWatcher;
    private disposeWhenHandler;
    private generateId;
    private formatValue;
    /**
     * Get the number of active watchers
     */
    getWatcherCount(): number;
    /**
     * Get circuit breaker state
     */
    getCircuitState(): import("../core/types.js").CircuitState;
    /**
     * Dispose all watchers and clean up
     */
    dispose(): void;
    /**
     * Check if the engine has been disposed
     */
    isDisposed(): boolean;
}
