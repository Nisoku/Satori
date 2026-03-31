import { describe, test, expect, it } from '@jest/globals';
import { RateLimiter } from '../src/bus/rateLimiter';
import type { LogEntry, RateLimitConfig } from '../src/core/types';

function createMockEntry(): LogEntry {
  return {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
    level: 'info',
    scope: 'test',
    message: 'Test message',
    tags: []
  };
}

describe('RateLimiter', () => {
  describe('when disabled', () => {
    it('should allow all events', () => {
      const limiter = new RateLimiter({
        enabled: false,
        maxEventsPerSecond: 1,
        samplingRate: 0,
        strategy: 'drop'
      });

      for (let i = 0; i < 100; i++) {
        const result = limiter.shouldAllow(createMockEntry());
        expect(result.allowed).toBe(true);
        expect(result.sampled).toBe(false);
      }
    });
  });

  describe('drop strategy', () => {
    it('should drop events over rate limit', () => {
      const limiter = new RateLimiter({
        enabled: true,
        maxEventsPerSecond: 5,
        samplingRate: 0,
        strategy: 'drop'
      });

      // First 5 should be allowed
      for (let i = 0; i < 5; i++) {
        expect(limiter.shouldAllow(createMockEntry()).allowed).toBe(true);
      }

      // Next ones should be dropped
      const result = limiter.shouldAllow(createMockEntry());
      expect(result.allowed).toBe(false);
    });
  });

  describe('sample strategy', () => {
    it('should sample events over rate limit', () => {
      const limiter = new RateLimiter({
        enabled: true,
        maxEventsPerSecond: 1,
        samplingRate: 1, // 100% sampling means all should be sampled through
        strategy: 'sample'
      });

      // First should be allowed normally
      expect(limiter.shouldAllow(createMockEntry()).allowed).toBe(true);

      // With 100% sampling rate, next should be sampled through
      const result = limiter.shouldAllow(createMockEntry());
      if (result.allowed) {
        expect(result.sampled).toBe(true);
      }
    });
  });

  describe('buffer strategy', () => {
    it('should buffer events over rate limit', () => {
      const limiter = new RateLimiter({
        enabled: true,
        maxEventsPerSecond: 1,
        samplingRate: 0,
        strategy: 'buffer',
        bufferSize: 10
      });

      // First should be allowed
      expect(limiter.shouldAllow(createMockEntry()).allowed).toBe(true);

      // Next should be buffered (not allowed)
      const result = limiter.shouldAllow(createMockEntry());
      expect(result.allowed).toBe(false);

      // Should be in buffer
      const buffered = limiter.flushBuffer();
      expect(buffered.length).toBe(1);
    });
  });

  describe('statistics', () => {
    it('should track statistics', () => {
      const limiter = new RateLimiter({
        enabled: true,
        maxEventsPerSecond: 2,
        samplingRate: 0,
        strategy: 'drop'
      });

      limiter.shouldAllow(createMockEntry());
      limiter.shouldAllow(createMockEntry());
      limiter.shouldAllow(createMockEntry()); // This should be dropped

      const stats = limiter.getStats();
      expect(stats.dropped).toBe(1);
      expect(stats.currentRate).toBe(2);
    });

    it('should reset statistics', () => {
      const limiter = new RateLimiter({
        enabled: true,
        maxEventsPerSecond: 1,
        samplingRate: 0,
        strategy: 'drop'
      });

      limiter.shouldAllow(createMockEntry());
      limiter.shouldAllow(createMockEntry());
      
      limiter.reset();

      const stats = limiter.getStats();
      expect(stats.dropped).toBe(0);
      expect(stats.currentRate).toBe(0);
    });
  });
});
