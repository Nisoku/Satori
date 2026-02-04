/**
 * Event Deduplication implementation
 * Prevents duplicate events within a time window
 */

import type { LogEntry, DeduplicationConfig } from '../core/types.js';
import { computeHash } from '../core/utils/deepEqual.js';

interface DedupEntry {
  hash: string;
  timestamp: number;
  count: number;
}

export class Deduplicator {
  private cache = new Map<string, DedupEntry>();
  private deduplicatedCount = 0;

  constructor(private config: DeduplicationConfig) {}

  /**
   * Compute a deduplication key for an entry based on configured fields
   */
  computeDedupKey(entry: LogEntry): string {
    const parts: string[] = [];
    
    for (const field of this.config.fields) {
      switch (field) {
        case 'message':
          parts.push(`m:${entry.message}`);
          break;
        case 'scope':
          parts.push(`s:${entry.scope}`);
          break;
        case 'level':
          parts.push(`l:${entry.level}`);
          break;
        case 'tags':
          parts.push(`t:${entry.tags.sort().join(',')}`);
          break;
        case 'state':
          if (entry.state) {
            parts.push(`st:${computeHash(entry.state)}`);
          }
          break;
      }
    }
    
    return parts.join('|');
  }

  /**
   * Check if an event is a duplicate
   * Returns: { isDuplicate: boolean, originalId?: string, duplicateCount: number }
   */
  isDuplicate(entry: LogEntry): { isDuplicate: boolean; duplicateCount: number } {
    if (!this.config.enabled) {
      return { isDuplicate: false, duplicateCount: 0 };
    }

    const now = Date.now();
    const dedupKey = this.computeDedupKey(entry);
    
    // Clean expired entries
    this.cleanExpired(now);
    
    const existing = this.cache.get(dedupKey);
    
    if (existing && (now - existing.timestamp) < this.config.windowMs) {
      // It's a duplicate within the window
      existing.count++;
      this.deduplicatedCount++;
      return { isDuplicate: true, duplicateCount: existing.count };
    }
    
    // Not a duplicate, add to cache
    this.cache.set(dedupKey, {
      hash: dedupKey,
      timestamp: now,
      count: 1
    });
    
    // Enforce max cache size
    if (this.cache.size > this.config.maxCacheSize) {
      this.evictOldest();
    }
    
    return { isDuplicate: false, duplicateCount: 1 };
  }

  /**
   * Clean expired entries from cache
   */
  private cleanExpired(now: number): void {
    for (const [key, entry] of this.cache.entries()) {
      if ((now - entry.timestamp) >= this.config.windowMs) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(): void {
    let oldest: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldest = key;
      }
    }
    
    if (oldest) {
      this.cache.delete(oldest);
    }
  }

  /**
   * Get statistics
   */
  getStats(): { cacheSize: number; deduplicatedCount: number } {
    return {
      cacheSize: this.cache.size,
      deduplicatedCount: this.deduplicatedCount
    };
  }

  /**
   * Reset the deduplicator
   */
  reset(): void {
    this.cache.clear();
    this.deduplicatedCount = 0;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DeduplicationConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
