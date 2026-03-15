/**
 * Event Deduplication implementation
 * Prevents duplicate events within a time window
 */
import type { LogEntry, DeduplicationConfig } from "../core/types.js";
export declare class Deduplicator {
    private config;
    private cache;
    private deduplicatedCount;
    constructor(config: DeduplicationConfig);
    /**
     * Compute a deduplication key for an entry based on configured fields
     */
    computeDedupKey(entry: LogEntry): string;
    /**
     * Check if an event is a duplicate
     * Returns: { isDuplicate: boolean, originalId?: string, duplicateCount: number }
     */
    isDuplicate(entry: LogEntry): {
        isDuplicate: boolean;
        duplicateCount: number;
    };
    /**
     * Clean expired entries from cache
     */
    private cleanExpired;
    /**
     * Evict oldest entries when cache is full
     */
    private evictOldest;
    /**
     * Get statistics
     */
    getStats(): {
        cacheSize: number;
        deduplicatedCount: number;
    };
    /**
     * Reset the deduplicator
     */
    reset(): void;
    /**
     * Update configuration
     */
    updateConfig(config: Partial<DeduplicationConfig>): void;
}
