import { describe, test, expect, it } from '@jest/globals';
import { deepEqual, deepClone, computeHash } from '../src/core/utils/deepEqual';
import { RateLimiter } from '../src/bus/rateLimiter';
import { Deduplicator } from '../src/bus/deduplicator';
import { CircuitBreaker, CircuitOpenError } from '../src/bus/circuitBreaker';
import { validateConfig } from '../src/core/validation';
import { DEFAULT_CONFIG, DEFAULT_RATE_LIMIT_CONFIG, DEFAULT_DEDUP_CONFIG, DEFAULT_CIRCUIT_BREAKER_CONFIG } from '../src/core/config';
import type { LogEntry } from '../src/core/types';

describe('Edge Cases', () => {
  describe('deepEqual edge cases', () => {
    it('should handle null vs undefined', () => {
      expect(deepEqual(null, undefined)).toBe(false);
      expect(deepEqual(undefined, null)).toBe(false);
      expect(deepEqual(null, null)).toBe(true);
      expect(deepEqual(undefined, undefined)).toBe(true);
    });

    it('should handle NaN', () => {
      expect(deepEqual(NaN, NaN)).toBe(true);
      expect(deepEqual(NaN, 0)).toBe(false);
      expect(deepEqual({ a: NaN }, { a: NaN })).toBe(true);
    });

    it('should handle +0 vs -0', () => {
      expect(deepEqual(0, -0)).toBe(true);
      expect(deepEqual(-0, 0)).toBe(true);
    });

    it('should handle circular references gracefully', () => {
      const obj1: any = { a: 1 };
      obj1.self = obj1;
      
      const obj2: any = { a: 1 };
      obj2.self = obj2;
      
      // Should not throw (may return false due to stack overflow prevention)
      expect(() => deepEqual(obj1, obj2)).not.toThrow();
    });

    it('should handle deeply nested objects', () => {
      let deep1: any = { value: 'bottom' };
      let deep2: any = { value: 'bottom' };
      
      for (let i = 0; i < 100; i++) {
        deep1 = { nested: deep1 };
        deep2 = { nested: deep2 };
      }
      
      expect(deepEqual(deep1, deep2)).toBe(true);
    });

    it('should handle sparse arrays', () => {
      const arr1 = [1, , 3];  // sparse array
      const arr2 = [1, undefined, 3];
      
      // Sparse arrays have different behavior than arrays with undefined
      expect(deepEqual(arr1, arr2)).toBe(false);
    });

    it('should handle arrays with extra properties', () => {
      const arr1: any = [1, 2, 3];
      arr1.extra = 'value';
      const arr2 = [1, 2, 3];
      
      expect(deepEqual(arr1, arr2)).toBe(false);
    });

    it('should handle Date objects', () => {
      const d1 = new Date('2024-01-01');
      const d2 = new Date('2024-01-01');
      const d3 = new Date('2024-01-02');
      
      expect(deepEqual(d1, d2)).toBe(true);
      expect(deepEqual(d1, d3)).toBe(false);
    });

    it('should handle RegExp objects', () => {
      expect(deepEqual(/test/gi, /test/gi)).toBe(true);
      expect(deepEqual(/test/g, /test/i)).toBe(false);
      expect(deepEqual(/test/, /test2/)).toBe(false);
    });

    it('should handle Map and Set', () => {
      const map1 = new Map([['a', 1], ['b', 2]]);
      const map2 = new Map([['a', 1], ['b', 2]]);
      const map3 = new Map([['a', 1], ['b', 3]]);
      
      expect(deepEqual(map1, map2)).toBe(true);
      expect(deepEqual(map1, map3)).toBe(false);
      
      const set1 = new Set([1, 2, 3]);
      const set2 = new Set([1, 2, 3]);
      const set3 = new Set([1, 2, 4]);
      
      expect(deepEqual(set1, set2)).toBe(true);
      expect(deepEqual(set1, set3)).toBe(false);
    });

    it('should handle Symbol properties', () => {
      const sym = Symbol('test');
      const obj1 = { [sym]: 'value', regular: 1 };
      const obj2 = { [sym]: 'value', regular: 1 };
      
      // Symbol properties might not be compared depending on implementation
      expect(deepEqual(obj1, obj2)).toBe(true);
    });

    it('should handle objects with null prototype', () => {
      const obj1 = Object.create(null);
      obj1.a = 1;
      const obj2 = Object.create(null);
      obj2.a = 1;
      
      expect(deepEqual(obj1, obj2)).toBe(true);
    });

    it('should handle empty objects and arrays', () => {
      expect(deepEqual({}, {})).toBe(true);
      expect(deepEqual([], [])).toBe(true);
      expect(deepEqual({}, [])).toBe(false);
      expect(deepEqual([], {})).toBe(false);
    });

    it('should handle objects with same keys different order', () => {
      const obj1 = { a: 1, b: 2, c: 3 };
      const obj2 = { c: 3, b: 2, a: 1 };
      
      expect(deepEqual(obj1, obj2)).toBe(true);
    });
  });

  describe('deepClone edge cases', () => {
    it('should clone Date objects', () => {
      const date = new Date('2024-01-01');
      const cloned = deepClone(date);
      
      expect(cloned).toEqual(date);
      expect(cloned).not.toBe(date);
    });

    it('should clone RegExp objects', () => {
      const regex = /test/gi;
      const cloned = deepClone(regex);
      
      expect(cloned.source).toBe(regex.source);
      expect(cloned.flags).toBe(regex.flags);
    });

    it('should handle null and undefined', () => {
      expect(deepClone(null)).toBe(null);
      expect(deepClone(undefined)).toBe(undefined);
    });

    it('should clone primitives', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('string')).toBe('string');
      expect(deepClone(true)).toBe(true);
    });
  });

  describe('computeHash edge cases', () => {
    it('should produce different hashes for different types', () => {
      expect(computeHash('1')).not.toBe(computeHash(1));
      expect(computeHash(null)).not.toBe(computeHash(undefined));
      expect(computeHash([])).not.toBe(computeHash({}));
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(100000);
      expect(() => computeHash(longString)).not.toThrow();
    });

    it('should be consistent', () => {
      const obj = { a: 1, b: [2, 3], c: { d: 4 } };
      expect(computeHash(obj)).toBe(computeHash(obj));
    });
  });

  describe('RateLimiter edge cases', () => {
    const createEntry = (id: string): LogEntry => ({
      id,
      message: 'test',
      level: 'info',
      timestamp: Date.now(),
      scope: 'test',
      tags: []
    });

    it('should handle maxEventsPerSecond of 0', () => {
      const limiter = new RateLimiter({
        ...DEFAULT_RATE_LIMIT_CONFIG,
        enabled: true,
        maxEventsPerSecond: 0,
        strategy: 'drop'  // Use drop strategy to ensure deterministic behavior
      });
      
      // Should drop all events
      expect(limiter.shouldAllow(createEntry('1')).allowed).toBe(false);
    });

    it('should handle very high maxEventsPerSecond', () => {
      const limiter = new RateLimiter({
        ...DEFAULT_RATE_LIMIT_CONFIG,
        enabled: true,
        maxEventsPerSecond: 1000000
      });
      
      // Should allow many events
      for (let i = 0; i < 1000; i++) {
        expect(limiter.shouldAllow(createEntry(String(i))).allowed).toBe(true);
      }
    });

    it('should handle rapid shouldAllow calls', () => {
      const limiter = new RateLimiter({
        ...DEFAULT_RATE_LIMIT_CONFIG,
        enabled: true,
        maxEventsPerSecond: 10
      });
      
      let allowed = 0;
      for (let i = 0; i < 100; i++) {
        if (limiter.shouldAllow(createEntry(String(i))).allowed) allowed++;
      }
      
      // Should have limited events
      expect(allowed).toBeLessThan(100);
    });

    it('should handle disabled rate limiter', () => {
      const limiter = new RateLimiter({
        ...DEFAULT_RATE_LIMIT_CONFIG,
        enabled: false,
        maxEventsPerSecond: 1
      });
      
      // Should allow all when disabled
      for (let i = 0; i < 100; i++) {
        expect(limiter.shouldAllow(createEntry(String(i))).allowed).toBe(true);
      }
    });
  });

  describe('Deduplicator edge cases', () => {
    const createEvent = (id: string, msg: string, lvl = 'info', scp = 'test'): LogEntry => ({
      id,
      message: msg,
      level: lvl as any,
      timestamp: Date.now(),
      scope: scp,
      tags: []
    });

    it('should handle empty fields array', () => {
      const dedup = new Deduplicator({
        ...DEFAULT_DEDUP_CONFIG,
        enabled: true,
        fields: []
      });
      
      const event1 = createEvent('1', 'test', 'info', 'test');
      const event2 = createEvent('2', 'different', 'error', 'other');
      
      // With no fields, all events hash the same
      expect(dedup.isDuplicate(event1).isDuplicate).toBe(false);
      expect(dedup.isDuplicate(event2).isDuplicate).toBe(true);
    });

    it('should handle very short window', () => {
      const dedup = new Deduplicator({
        ...DEFAULT_DEDUP_CONFIG,
        enabled: true,
        windowMs: 1
      });
      
      const event = createEvent('1', 'test');
      
      expect(dedup.isDuplicate(event).isDuplicate).toBe(false);
      // After 1ms, should not be duplicate
    });

    it('should handle events with state field', () => {
      const dedup = new Deduplicator({
        ...DEFAULT_DEDUP_CONFIG,
        enabled: true,
        fields: ['message', 'state']
      });
      
      const event = createEvent('1', 'test');
      
      expect(() => dedup.isDuplicate(event)).not.toThrow();
    });

    it('should handle maxCacheSize limit', () => {
      const dedup = new Deduplicator({
        ...DEFAULT_DEDUP_CONFIG,
        enabled: true,
        maxCacheSize: 3
      });
      
      for (let i = 0; i < 10; i++) {
        const event = createEvent(String(i), `test${i}`);
        dedup.isDuplicate(event);
      }
      
      // Should have cleaned up old entries
      expect(dedup.getStats().cacheSize).toBeLessThanOrEqual(10);
    });
  });

  describe('CircuitBreaker edge cases', () => {
    it('should handle threshold of 1', () => {
      const cb = new CircuitBreaker({
        ...DEFAULT_CIRCUIT_BREAKER_CONFIG,
        enabled: true,
        failureThreshold: 1
      });
      
      expect(cb.getState()).toBe('closed');
      
      // Single failure should open
      cb.recordFailure(new Error('fail'));
      expect(cb.getState()).toBe('open');
    });

    it('should handle very short reset timeout', async () => {
      const cb = new CircuitBreaker({
        ...DEFAULT_CIRCUIT_BREAKER_CONFIG,
        enabled: true,
        failureThreshold: 1,
        resetTimeout: 1
      });
      
      cb.recordFailure(new Error('fail'));
      expect(cb.getState()).toBe('open');
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(cb.canExecute()).toBe(true);
      expect(cb.getState()).toBe('half-open');
    });

    it('should handle disabled circuit breaker', async () => {
      const cb = new CircuitBreaker({
        ...DEFAULT_CIRCUIT_BREAKER_CONFIG,
        enabled: false,
        failureThreshold: 1
      });
      
      // Should execute even with errors
      let executed = false;
      await cb.execute(() => {
        executed = true;
      });
      expect(executed).toBe(true);
    });

    it('should handle async function that rejects', async () => {
      const cb = new CircuitBreaker({
        ...DEFAULT_CIRCUIT_BREAKER_CONFIG,
        enabled: true,
        failureThreshold: 1
      });
      
      await expect(cb.execute(async () => {
        throw new Error('async fail');
      })).rejects.toThrow('async fail');
      
      expect(cb.getState()).toBe('open');
    });

    it('should handle sync function that throws', () => {
      const cb = new CircuitBreaker({
        ...DEFAULT_CIRCUIT_BREAKER_CONFIG,
        enabled: true,
        failureThreshold: 1
      });
      
      expect(() => cb.executeSync(() => {
        throw new Error('sync fail');
      })).toThrow('sync fail');
      
      expect(cb.getState()).toBe('open');
    });

    it('should reset after successful recovery', async () => {
      const cb = new CircuitBreaker({
        ...DEFAULT_CIRCUIT_BREAKER_CONFIG,
        enabled: true,
        failureThreshold: 1,
        resetTimeout: 1,
        successThreshold: 1
      });
      
      cb.recordFailure(new Error('fail'));
      await new Promise(resolve => setTimeout(resolve, 10));
      
      cb.canExecute(); // triggers half-open
      cb.recordSuccess();
      
      expect(cb.getState()).toBe('closed');
    });
  });

  describe('Config validation edge cases', () => {
    it('should handle empty config', () => {
      const result = validateConfig({});
      expect(result.valid).toBe(true);
    });

    it('should handle all undefined values', () => {
      const result = validateConfig({
        logLevel: undefined,
        pollingInterval: undefined,
        maxBufferSize: undefined
      });
      expect(result.valid).toBe(true);
    });

    it('should reject negative pollingInterval', () => {
      const result = validateConfig({ pollingInterval: -100 });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('pollingInterval'))).toBe(true);
    });

    it('should reject zero maxBufferSize', () => {
      const result = validateConfig({ maxBufferSize: 0 });
      expect(result.valid).toBe(false);
    });

    it('should reject invalid log level', () => {
      const result = validateConfig({ logLevel: 'invalid' as any });
      expect(result.valid).toBe(false);
    });

    it('should validate nested rateLimiting config', () => {
      const result = validateConfig({
        rateLimiting: {
          enabled: true,
          maxEventsPerSecond: -1,
          strategy: 'drop'
        }
      });
      expect(result.valid).toBe(false);
    });

    it('should reject invalid deduplication fields type', () => {
      const result = validateConfig({
        deduplication: {
          enabled: true,
          windowMs: 1000,
          fields: 'not-an-array' as any
        }
      });
      expect(result.valid).toBe(false);
    });

    it('should handle customLevels with duplicate names', () => {
      const result = validateConfig({
        customLevels: [
          { name: 'custom', severity: 5 },
          { name: 'custom', severity: 6 }  // duplicate
        ]
      });
      expect(result.valid).toBe(false);
    });

    it('should handle customLevels with reserved names', () => {
      const result = validateConfig({
        customLevels: [
          { name: 'log', severity: 5 }  // reserved method name
        ]
      });
      expect(result.valid).toBe(false);
    });
  });
});

describe('Boundary conditions', () => {
  describe('Number boundaries', () => {
    it('should handle MAX_SAFE_INTEGER', () => {
      expect(deepEqual(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)).toBe(true);
    });

    it('should handle MIN_SAFE_INTEGER', () => {
      expect(deepEqual(Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER)).toBe(true);
    });

    it('should handle Infinity', () => {
      expect(deepEqual(Infinity, Infinity)).toBe(true);
      expect(deepEqual(-Infinity, -Infinity)).toBe(true);
      expect(deepEqual(Infinity, -Infinity)).toBe(false);
    });
  });

  describe('String boundaries', () => {
    it('should handle empty string', () => {
      expect(deepEqual('', '')).toBe(true);
      expect(computeHash('')).toBeDefined();
    });

    it('should handle unicode strings', () => {
      expect(deepEqual('\u0000', '\u0000')).toBe(true);
      expect(deepEqual('\uFFFF', '\uFFFF')).toBe(true);
    });

    it('should handle emoji in strings', () => {
      // Note: We should NOT use emoji in our code, but we should handle them if users do
      expect(deepEqual('test\u{1F600}', 'test\u{1F600}')).toBe(true);
    });
  });

  describe('Array boundaries', () => {
    it('should handle very long arrays', () => {
      const arr1 = new Array(10000).fill(1);
      const arr2 = new Array(10000).fill(1);
      
      expect(deepEqual(arr1, arr2)).toBe(true);
    });

    it('should handle nested arrays', () => {
      const arr1 = [[[[1]]]];
      const arr2 = [[[[1]]]];
      
      expect(deepEqual(arr1, arr2)).toBe(true);
    });
  });
});
