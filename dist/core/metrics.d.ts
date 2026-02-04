/**
 * Self-Monitoring Metrics
 * Tracks internal metrics for the observability system itself
 */
import type { BusMetrics, SatoriMetrics, CircuitState } from '../core/types.js';
export interface MetricsSnapshot {
    timestamp: number;
    bus: BusMetrics;
    loggerCount: number;
    watcherCount: number;
    circuitState?: CircuitState;
    uptime: number;
}
export declare class MetricsCollector {
    private startTime;
    private totalPublished;
    private totalDropped;
    private totalSampled;
    private totalDeduplicated;
    private recentEvents;
    private loggerCount;
    private watcherCount;
    private subscriberCount;
    private bufferSize;
    private circuitState;
    private eventTimestamps;
    private snapshots;
    private maxSnapshots;
    constructor();
    /**
     * Record a published event
     */
    recordPublished(): void;
    /**
     * Record a dropped event
     */
    recordDropped(): void;
    /**
     * Record a sampled event
     */
    recordSampled(): void;
    /**
     * Record a deduplicated event
     */
    recordDeduplicated(): void;
    /**
     * Update logger count
     */
    setLoggerCount(count: number): void;
    /**
     * Update watcher count
     */
    setWatcherCount(count: number): void;
    /**
     * Update subscriber count
     */
    setSubscriberCount(count: number): void;
    /**
     * Update buffer size
     */
    setBufferSize(size: number): void;
    /**
     * Update circuit state
     */
    setCircuitState(state: CircuitState): void;
    /**
     * Get current events per second
     */
    getEventsPerSecond(): number;
    /**
     * Get current bus metrics
     */
    getBusMetrics(): BusMetrics;
    /**
     * Get full Satori metrics
     */
    getMetrics(): SatoriMetrics;
    /**
     * Take a snapshot for historical tracking
     */
    takeSnapshot(): MetricsSnapshot;
    /**
     * Get historical snapshots
     */
    getSnapshots(): MetricsSnapshot[];
    /**
     * Get average events per second over time
     */
    getAverageEventsPerSecond(): number;
    /**
     * Reset all metrics
     */
    reset(): void;
}
export declare function getGlobalMetrics(): MetricsCollector;
export declare function resetGlobalMetrics(): void;
