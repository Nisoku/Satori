import { describe, test, expect, it } from '@jest/globals';
import { SimpleEventBus } from '../src/bus/eventBus';
import type { LogEntry } from '../src/core/types';

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

describe('SimpleEventBus', () => {
  describe('basic pub/sub', () => {
    it('should publish to subscribers', () => {
      const bus = new SimpleEventBus();
      const received: LogEntry[] = [];
      
      bus.subscribe(entry => received.push(entry));
      
      const entry = createMockEntry();
      bus.publish(entry);
      
      expect(received.length).toBe(1);
      expect(received[0]).toBe(entry);
    });

    it('should support multiple subscribers', () => {
      const bus = new SimpleEventBus();
      const received1: LogEntry[] = [];
      const received2: LogEntry[] = [];
      
      bus.subscribe(entry => received1.push(entry));
      bus.subscribe(entry => received2.push(entry));
      
      bus.publish(createMockEntry());
      
      expect(received1.length).toBe(1);
      expect(received2.length).toBe(1);
    });

    it('should support unsubscribe', () => {
      const bus = new SimpleEventBus();
      const received: LogEntry[] = [];
      
      const unsubscribe = bus.subscribe(entry => received.push(entry));
      
      bus.publish(createMockEntry());
      expect(received.length).toBe(1);
      
      unsubscribe();
      
      bus.publish(createMockEntry());
      expect(received.length).toBe(1); // Should not receive second
    });
  });

  describe('middleware', () => {
    it('should run middleware before publishing', () => {
      const bus = new SimpleEventBus();
      const order: string[] = [];
      
      bus.use((entry, next) => {
        order.push('middleware1');
        next();
      });
      
      bus.use((entry, next) => {
        order.push('middleware2');
        next();
      });
      
      bus.subscribe(() => order.push('subscriber'));
      
      bus.publish(createMockEntry());
      
      expect(order).toEqual(['middleware1', 'middleware2', 'subscriber']);
    });

    it('should allow middleware to block events', () => {
      const bus = new SimpleEventBus();
      const received: LogEntry[] = [];
      
      bus.use((entry, next) => {
        if (entry.level !== 'error') {
          next(); // Only pass through non-errors
        }
      });
      
      bus.subscribe(entry => received.push(entry));
      
      bus.publish(createMockEntry({ level: 'info' }));
      bus.publish(createMockEntry({ level: 'error' }));
      
      expect(received.length).toBe(1);
      expect(received[0].level).toBe('info');
    });
  });

  describe('replay buffer', () => {
    it('should store events in replay buffer', () => {
      const bus = new SimpleEventBus({ maxBufferSize: 100 });
      
      bus.publish(createMockEntry({ message: 'Event 1' }));
      bus.publish(createMockEntry({ message: 'Event 2' }));
      
      const buffer = bus.getReplayBuffer();
      
      expect(buffer.length).toBe(2);
      expect(buffer[0].message).toBe('Event 1');
      expect(buffer[1].message).toBe('Event 2');
    });

    it('should respect max buffer size', () => {
      const bus = new SimpleEventBus({ maxBufferSize: 3 });
      
      bus.publish(createMockEntry({ message: 'Event 1' }));
      bus.publish(createMockEntry({ message: 'Event 2' }));
      bus.publish(createMockEntry({ message: 'Event 3' }));
      bus.publish(createMockEntry({ message: 'Event 4' }));
      
      const buffer = bus.getReplayBuffer();
      
      expect(buffer.length).toBe(3);
      expect(buffer[0].message).toBe('Event 2');
      expect(buffer[2].message).toBe('Event 4');
    });
  });

  describe('rate limiting', () => {
    it('should allow events under rate limit', () => {
      const bus = new SimpleEventBus({
        rateLimiting: {
          enabled: true,
          maxEventsPerSecond: 100,
          samplingRate: 0.1,
          strategy: 'drop'
        }
      });
      const received: LogEntry[] = [];
      
      bus.subscribe(entry => received.push(entry));
      
      // Publish a few events
      for (let i = 0; i < 5; i++) {
        bus.publish(createMockEntry());
      }
      
      expect(received.length).toBe(5);
    });
  });

  describe('deduplication', () => {
    it('should deduplicate identical events', () => {
      const bus = new SimpleEventBus({
        deduplication: {
          enabled: true,
          windowMs: 5000,
          fields: ['message', 'scope', 'level'],
          maxCacheSize: 100
        }
      });
      const received: LogEntry[] = [];
      
      bus.subscribe(entry => received.push(entry));
      
      // Publish same message twice
      bus.publish(createMockEntry({ message: 'Duplicate' }));
      bus.publish(createMockEntry({ message: 'Duplicate' }));
      
      expect(received.length).toBe(1);
    });

    it('should not deduplicate different events', () => {
      const bus = new SimpleEventBus({
        deduplication: {
          enabled: true,
          windowMs: 5000,
          fields: ['message'],
          maxCacheSize: 100
        }
      });
      const received: LogEntry[] = [];
      
      bus.subscribe(entry => received.push(entry));
      
      bus.publish(createMockEntry({ message: 'First' }));
      bus.publish(createMockEntry({ message: 'Second' }));
      
      expect(received.length).toBe(2);
    });
  });

  describe('metrics', () => {
    it('should track metrics', () => {
      const bus = new SimpleEventBus({ enableMetrics: true });
      
      bus.publish(createMockEntry());
      bus.publish(createMockEntry());
      
      const metrics = bus.getMetrics();
      
      expect(metrics.totalPublished).toBeGreaterThanOrEqual(2);
      expect(metrics.bufferSize).toBe(2);
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      const bus = new SimpleEventBus();
      
      bus.publish(createMockEntry());
      bus.publish(createMockEntry());
      
      bus.reset();
      
      expect(bus.getReplayBuffer().length).toBe(0);
    });
  });
});
