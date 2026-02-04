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

export class MetricsCollector {
  private startTime: number;
  private totalPublished = 0;
  private totalDropped = 0;
  private totalSampled = 0;
  private totalDeduplicated = 0;
  private recentEvents: number[] = [];
  private loggerCount = 0;
  private watcherCount = 0;
  private subscriberCount = 0;
  private bufferSize = 0;
  private circuitState: CircuitState = 'closed';
  
  // For tracking events per second
  private eventTimestamps: number[] = [];
  
  // Historical snapshots for trending
  private snapshots: MetricsSnapshot[] = [];
  private maxSnapshots = 60; // Keep last 60 snapshots (e.g., 1 per second = 1 minute)

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Record a published event
   */
  recordPublished(): void {
    this.totalPublished++;
    const now = Date.now();
    this.eventTimestamps.push(now);
    
    // Clean old timestamps (older than 1 second)
    this.eventTimestamps = this.eventTimestamps.filter(ts => now - ts < 1000);
  }

  /**
   * Record a dropped event
   */
  recordDropped(): void {
    this.totalDropped++;
  }

  /**
   * Record a sampled event
   */
  recordSampled(): void {
    this.totalSampled++;
  }

  /**
   * Record a deduplicated event
   */
  recordDeduplicated(): void {
    this.totalDeduplicated++;
  }

  /**
   * Update logger count
   */
  setLoggerCount(count: number): void {
    this.loggerCount = count;
  }

  /**
   * Update watcher count
   */
  setWatcherCount(count: number): void {
    this.watcherCount = count;
  }

  /**
   * Update subscriber count
   */
  setSubscriberCount(count: number): void {
    this.subscriberCount = count;
  }

  /**
   * Update buffer size
   */
  setBufferSize(size: number): void {
    this.bufferSize = size;
  }

  /**
   * Update circuit state
   */
  setCircuitState(state: CircuitState): void {
    this.circuitState = state;
  }

  /**
   * Get current events per second
   */
  getEventsPerSecond(): number {
    const now = Date.now();
    this.eventTimestamps = this.eventTimestamps.filter(ts => now - ts < 1000);
    return this.eventTimestamps.length;
  }

  /**
   * Get current bus metrics
   */
  getBusMetrics(): BusMetrics {
    return {
      totalPublished: this.totalPublished,
      totalDropped: this.totalDropped,
      totalSampled: this.totalSampled,
      totalDeduplicated: this.totalDeduplicated,
      eventsPerSecond: this.getEventsPerSecond(),
      bufferSize: this.bufferSize,
      subscriberCount: this.subscriberCount
    };
  }

  /**
   * Get full Satori metrics
   */
  getMetrics(): SatoriMetrics {
    return {
      bus: this.getBusMetrics(),
      loggerCount: this.loggerCount,
      watcherCount: this.watcherCount,
      circuitState: this.circuitState,
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Take a snapshot for historical tracking
   */
  takeSnapshot(): MetricsSnapshot {
    const snapshot: MetricsSnapshot = {
      timestamp: Date.now(),
      bus: this.getBusMetrics(),
      loggerCount: this.loggerCount,
      watcherCount: this.watcherCount,
      circuitState: this.circuitState,
      uptime: Date.now() - this.startTime
    };
    
    this.snapshots.push(snapshot);
    
    // Trim old snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots);
    }
    
    return snapshot;
  }

  /**
   * Get historical snapshots
   */
  getSnapshots(): MetricsSnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Get average events per second over time
   */
  getAverageEventsPerSecond(): number {
    if (this.snapshots.length === 0) return 0;
    
    const sum = this.snapshots.reduce((acc, s) => acc + s.bus.eventsPerSecond, 0);
    return sum / this.snapshots.length;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.startTime = Date.now();
    this.totalPublished = 0;
    this.totalDropped = 0;
    this.totalSampled = 0;
    this.totalDeduplicated = 0;
    this.eventTimestamps = [];
    this.snapshots = [];
  }
}

// Singleton instance for global metrics
let globalMetrics: MetricsCollector | null = null;

export function getGlobalMetrics(): MetricsCollector {
  if (!globalMetrics) {
    globalMetrics = new MetricsCollector();
  }
  return globalMetrics;
}

export function resetGlobalMetrics(): void {
  globalMetrics = null;
}
