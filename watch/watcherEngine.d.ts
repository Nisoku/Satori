import type { SatoriLogger, WatchSource, WhenPredicate, WhenCallback, WatchHandle, SatoriConfig } from '../core/types.js';
export declare class WatcherEngine {
    private logger;
    private config;
    private watchers;
    private whenHandlers;
    constructor(logger: SatoriLogger, config: SatoriConfig);
    watch<T>(source: WatchSource<T>, label?: string): WatchHandle;
    when<T>(source: WatchSource<T>, predicate: WhenPredicate<T>, onTrigger: WhenCallback<T>): WatchHandle;
    dispose(): void;
}
