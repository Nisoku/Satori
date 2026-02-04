import { Deduplicator } from '../src/bus/deduplicator';
import type { LogEntry, DeduplicationConfig } from '../src/core/types';

function createMockEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
    level: 'info',
    scope: 'test',
    message: 'Test message',
    tags: [],
    ...overrides
  };
}

describe('Deduplicator', () => {
  describe('when disabled', () => {
    it('should not deduplicate any events', () => {
      const dedup = new Deduplicator({
        enabled: false,
        windowMs: 5000,
        fields: ['message'],
        maxCacheSize: 100
      });

      const result1 = dedup.isDuplicate(createMockEntry({ message: 'Same' }));
      const result2 = dedup.isDuplicate(createMockEntry({ message: 'Same' }));

      expect(result1.isDuplicate).toBe(false);
      expect(result2.isDuplicate).toBe(false);
    });
  });

  describe('when enabled', () => {
    it('should detect duplicates based on configured fields', () => {
      const dedup = new Deduplicator({
        enabled: true,
        windowMs: 5000,
        fields: ['message', 'scope', 'level'],
        maxCacheSize: 100
      });

      const result1 = dedup.isDuplicate(createMockEntry({ message: 'Duplicate' }));
      const result2 = dedup.isDuplicate(createMockEntry({ message: 'Duplicate' }));

      expect(result1.isDuplicate).toBe(false);
      expect(result2.isDuplicate).toBe(true);
    });

    it('should not flag different messages as duplicates', () => {
      const dedup = new Deduplicator({
        enabled: true,
        windowMs: 5000,
        fields: ['message'],
        maxCacheSize: 100
      });

      const result1 = dedup.isDuplicate(createMockEntry({ message: 'First' }));
      const result2 = dedup.isDuplicate(createMockEntry({ message: 'Second' }));

      expect(result1.isDuplicate).toBe(false);
      expect(result2.isDuplicate).toBe(false);
    });

    it('should consider level in deduplication', () => {
      const dedup = new Deduplicator({
        enabled: true,
        windowMs: 5000,
        fields: ['message', 'level'],
        maxCacheSize: 100
      });

      const result1 = dedup.isDuplicate(createMockEntry({ message: 'Same', level: 'info' }));
      const result2 = dedup.isDuplicate(createMockEntry({ message: 'Same', level: 'error' }));

      expect(result1.isDuplicate).toBe(false);
      expect(result2.isDuplicate).toBe(false); // Different level
    });

    it('should consider scope in deduplication', () => {
      const dedup = new Deduplicator({
        enabled: true,
        windowMs: 5000,
        fields: ['message', 'scope'],
        maxCacheSize: 100
      });

      const result1 = dedup.isDuplicate(createMockEntry({ message: 'Same', scope: 'scope1' }));
      const result2 = dedup.isDuplicate(createMockEntry({ message: 'Same', scope: 'scope2' }));

      expect(result1.isDuplicate).toBe(false);
      expect(result2.isDuplicate).toBe(false); // Different scope
    });

    it('should consider tags in deduplication', () => {
      const dedup = new Deduplicator({
        enabled: true,
        windowMs: 5000,
        fields: ['message', 'tags'],
        maxCacheSize: 100
      });

      const result1 = dedup.isDuplicate(createMockEntry({ message: 'Same', tags: ['a', 'b'] }));
      const result2 = dedup.isDuplicate(createMockEntry({ message: 'Same', tags: ['a', 'c'] }));

      expect(result1.isDuplicate).toBe(false);
      expect(result2.isDuplicate).toBe(false); // Different tags
    });

    it('should track duplicate count', () => {
      const dedup = new Deduplicator({
        enabled: true,
        windowMs: 5000,
        fields: ['message'],
        maxCacheSize: 100
      });

      const result1 = dedup.isDuplicate(createMockEntry({ message: 'Dup' }));
      const result2 = dedup.isDuplicate(createMockEntry({ message: 'Dup' }));
      const result3 = dedup.isDuplicate(createMockEntry({ message: 'Dup' }));

      expect(result1.duplicateCount).toBe(1);
      expect(result2.duplicateCount).toBe(2);
      expect(result3.duplicateCount).toBe(3);
    });
  });

  describe('cache management', () => {
    it('should respect max cache size', () => {
      const dedup = new Deduplicator({
        enabled: true,
        windowMs: 5000,
        fields: ['message'],
        maxCacheSize: 3
      });

      dedup.isDuplicate(createMockEntry({ message: 'M1' }));
      dedup.isDuplicate(createMockEntry({ message: 'M2' }));
      dedup.isDuplicate(createMockEntry({ message: 'M3' }));
      dedup.isDuplicate(createMockEntry({ message: 'M4' })); // Should evict M1

      const stats = dedup.getStats();
      expect(stats.cacheSize).toBeLessThanOrEqual(3);
    });
  });

  describe('statistics', () => {
    it('should track deduplicated count', () => {
      const dedup = new Deduplicator({
        enabled: true,
        windowMs: 5000,
        fields: ['message'],
        maxCacheSize: 100
      });

      dedup.isDuplicate(createMockEntry({ message: 'Dup' }));
      dedup.isDuplicate(createMockEntry({ message: 'Dup' }));
      dedup.isDuplicate(createMockEntry({ message: 'Dup' }));

      const stats = dedup.getStats();
      expect(stats.deduplicatedCount).toBe(2);
    });

    it('should reset statistics', () => {
      const dedup = new Deduplicator({
        enabled: true,
        windowMs: 5000,
        fields: ['message'],
        maxCacheSize: 100
      });

      dedup.isDuplicate(createMockEntry({ message: 'Dup' }));
      dedup.isDuplicate(createMockEntry({ message: 'Dup' }));
      
      dedup.reset();

      const stats = dedup.getStats();
      expect(stats.deduplicatedCount).toBe(0);
      expect(stats.cacheSize).toBe(0);
    });
  });
});
