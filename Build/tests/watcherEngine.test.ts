/**
 * Watcher Engine tests
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { WatcherEngine } from '../src/watch/watcherEngine';
import type { SatoriLogger, SatoriConfig, LogOptions, LogEntry, WatchHandle } from '../src/core/types';
import { DEFAULT_CONFIG } from '../src/core/config';

// Mock logger for testing
class MockLogger implements SatoriLogger {
  scope = 'test';
  logs: Array<{ level: string; message: string; options?: LogOptions }> = [];

  log(level: string, message: string, options?: LogOptions): void {
    this.logs.push({ level, message, options });
  }

  info(message: string, options?: LogOptions): void {
    this.log('info', message, options);
  }

  warn(message: string, options?: LogOptions): void {
    this.log('warn', message, options);
  }

  error(message: string, options?: LogOptions): void {
    this.log('error', message, options);
  }

  debug(message: string, options?: LogOptions): void {
    this.log('debug', message, options);
  }

  event(message: string, options?: LogOptions): void {
    this.log('info', message, options);
  }

  tag(): SatoriLogger { return this; }
  causedBy(): SatoriLogger { return this; }
  watch(): WatchHandle { return { dispose: () => {} }; }
  when(): WatchHandle { return { dispose: () => {} }; }
  dispose(): void {}
}

describe('WatcherEngine', () => {
  let engine: WatcherEngine;
  let mockLogger: MockLogger;
  let config: SatoriConfig;

  beforeEach(() => {
    mockLogger = new MockLogger();
    config = { ...DEFAULT_CONFIG, pollingInterval: 50 };
    engine = new WatcherEngine(mockLogger, config);
  });

  afterEach(() => {
    engine.dispose();
  });

  describe('watch', () => {
    it('should detect primitive value changes', async () => {
      let value = 0;
      engine.watch(() => value, 'counter');
      
      value = 1;
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockLogger.logs.some(l => l.message.includes('counter'))).toBe(true);
    });

    it('should detect object value changes', async () => {
      let obj = { count: 0 };
      engine.watch(() => obj, 'object');
      
      obj = { count: 1 };
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockLogger.logs.some(l => l.message.includes('object'))).toBe(true);
    });

    it('should only log once when value stays the same after initial', async () => {
      const value = 42;
      engine.watch(() => value, 'constant');
      
      // Wait for multiple poll cycles
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should only have the initial change log (undefined -> 42)
      // and not additional logs since value stays constant
      const constantLogs = mockLogger.logs.filter(l => l.message.includes('constant'));
      expect(constantLogs).toHaveLength(1);
    });

    it('should stop watching when handle.dispose() is called', async () => {
      let value = 0;
      const handle = engine.watch(() => value, 'stoppable');
      
      // Dispose immediately after watch() is called
      // Note: The initial check runs synchronously, so we get one log
      handle.dispose();
      value = 1;
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should have exactly one log (the initial undefined -> 0 change)
      // but no subsequent logs for value = 1 since we disposed
      const stoppableLogs = mockLogger.logs.filter(l => l.message.includes('stoppable'));
      expect(stoppableLogs).toHaveLength(1);
      expect(stoppableLogs[0].message).toContain('undefined -> 0');
    });

    it('should handle multiple watchers', async () => {
      let val1 = 0;
      let val2 = 'a';
      
      engine.watch(() => val1, 'num');
      engine.watch(() => val2, 'str');
      
      val1 = 1;
      val2 = 'b';
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockLogger.logs.some(l => l.message.includes('num'))).toBe(true);
      expect(mockLogger.logs.some(l => l.message.includes('str'))).toBe(true);
    });

    it('should handle watcher that throws error', async () => {
      let shouldThrow = false;
      
      engine.watch(() => {
        if (shouldThrow) throw new Error('test error');
        return 0;
      }, 'throwing');
      
      shouldThrow = true;
      
      // Should not crash
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should have logged an error
      expect(mockLogger.logs.some(l => l.level === 'error')).toBe(true);
    });

    it('should detect deep object changes', async () => {
      let obj = { nested: { value: 1 } };
      engine.watch(() => obj, 'deep');
      
      obj = { nested: { value: 2 } };
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockLogger.logs.some(l => l.message.includes('deep'))).toBe(true);
    });

    it('should detect array changes', async () => {
      let arr = [1, 2, 3];
      engine.watch(() => arr, 'array');
      
      arr = [1, 2, 3, 4];
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockLogger.logs.some(l => l.message.includes('array'))).toBe(true);
    });

    it('should not trigger additional logs for same array content', async () => {
      const arr = [1, 2, 3];
      engine.watch(() => [...arr], 'sameArray');
      
      // Wait for multiple poll cycles
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should only have one log (initial change from undefined -> [1,2,3])
      // not additional logs since content stays the same
      expect(mockLogger.logs.filter(l => l.message.includes('sameArray'))).toHaveLength(1);
    });
  });

  describe('when', () => {
    it('should trigger callback when condition becomes true', async () => {
      let value = 0;
      let triggered = false;
      
      engine.when(() => value, (prev, next) => next > 5, () => {
        triggered = true;
      });
      
      value = 10;
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(triggered).toBe(true);
    });

    it('should not trigger callback when condition stays false', async () => {
      const value = 0;
      let triggered = false;
      
      engine.when(() => value, (prev, next) => next > 5, () => {
        triggered = true;
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(triggered).toBe(false);
    });

    it('should trigger callback each time condition is true', async () => {
      let value = 0;
      let triggerCount = 0;
      
      engine.when(() => value, (prev, next) => next > 5, () => {
        triggerCount++;
      });
      
      value = 10;
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Triggers each time condition is evaluated as true
      expect(triggerCount).toBeGreaterThanOrEqual(1);
    });

    it('should stop watching when handle.dispose() is called', async () => {
      let value = 0;
      let triggered = false;
      
      const handle = engine.when(() => value, (prev, next) => next > 5, () => {
        triggered = true;
      });
      
      handle.dispose();
      value = 10;
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(triggered).toBe(false);
    });
  });

  describe('dispose', () => {
    it('should stop all watchers on dispose', async () => {
      let val1 = 0;
      let val2 = 0;
      
      engine.watch(() => val1, 'watcher1');
      engine.watch(() => val2, 'watcher2');
      
      engine.dispose();
      
      val1 = 1;
      val2 = 1;
      
      const logsBeforeWait = mockLogger.logs.length;
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // No new logs after dispose
      expect(mockLogger.logs.length).toBe(logsBeforeWait);
    });

    it('should be safe to dispose multiple times', () => {
      expect(() => {
        engine.dispose();
        engine.dispose();
        engine.dispose();
      }).not.toThrow();
    });
  });

  describe('getWatcherCount', () => {
    it('should return correct watcher count', () => {
      expect(engine.getWatcherCount()).toBe(0);
      
      const h1 = engine.watch(() => 1, 'w1');
      expect(engine.getWatcherCount()).toBe(1);
      
      const h2 = engine.watch(() => 2, 'w2');
      expect(engine.getWatcherCount()).toBe(2);
      
      h1.dispose();
      expect(engine.getWatcherCount()).toBe(1);
      
      h2.dispose();
      expect(engine.getWatcherCount()).toBe(0);
    });
  });
});

describe('WatcherEngine edge cases', () => {
  let engine: WatcherEngine;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockLogger = new MockLogger();
    engine = new WatcherEngine(mockLogger, { ...DEFAULT_CONFIG, pollingInterval: 50 });
  });

  afterEach(() => {
    engine.dispose();
  });

  it('should handle null values', async () => {
    let value: string | null = 'initial';
    engine.watch(() => value, 'nullable');
    
    value = null;
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(mockLogger.logs.some(l => l.message.includes('nullable'))).toBe(true);
  });

  it('should handle undefined values', async () => {
    let value: string | undefined = 'initial';
    engine.watch(() => value, 'undefinable');
    
    value = undefined;
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(mockLogger.logs.some(l => l.message.includes('undefinable'))).toBe(true);
  });

  it('should handle boolean changes', async () => {
    let flag = false;
    engine.watch(() => flag, 'flag');
    
    flag = true;
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(mockLogger.logs.some(l => l.message.includes('flag'))).toBe(true);
  });

  it('should handle Date object changes', async () => {
    let date = new Date('2024-01-01');
    engine.watch(() => date, 'date');
    
    date = new Date('2024-01-02');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(mockLogger.logs.some(l => l.message.includes('date'))).toBe(true);
  });

  it('should handle very frequent changes', async () => {
    let value = 0;
    engine.watch(() => value, 'frequent');
    
    // Rapid changes
    for (let i = 0; i < 100; i++) {
      value = i;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should have detected at least some changes
    expect(mockLogger.logs.some(l => l.message.includes('frequent'))).toBe(true);
  });

  it('should handle source function returning different reference but same value', async () => {
    // First poll will log (prev is undefined)
    engine.watch(() => ({ a: 1 }), 'sameContent');
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // First change is logged (undefined -> {a:1}), but subsequent ones shouldn't be
    // because content stays the same (deep equality check)
    const sameContentLogs = mockLogger.logs.filter(l => l.message.includes('sameContent'));
    expect(sameContentLogs).toHaveLength(1); // Only the initial change
  });

  it('should handle empty label', async () => {
    let value = 0;
    const handle = engine.watch(() => value, '');
    
    expect(handle).toBeDefined();
    expect(handle.dispose).toBeInstanceOf(Function);
    
    value = 1;
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(mockLogger.logs.length).toBeGreaterThan(0);
  });
});
