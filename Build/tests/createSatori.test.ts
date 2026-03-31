import { describe, test, expect, afterEach, it } from '@jest/globals';
import { createSatori } from '../src/logger/createSatori';
import type { SatoriInstance, LogEntry } from '../src/core/types';

describe('createSatori', () => {
  let satori: SatoriInstance;

  afterEach(() => {
    if (satori) {
      satori.dispose();
    }
  });

  describe('initialization', () => {
    it('should create a Satori instance with default config', () => {
      satori = createSatori();
      
      expect(satori).toBeDefined();
      expect(satori.config).toBeDefined();
      expect(satori.bus).toBeDefined();
      expect(satori.rootLogger).toBeDefined();
    });

    it('should create with custom config', () => {
      satori = createSatori({
        enableCallsite: false,
        maxBufferSize: 500,
        appVersion: '2.0.0'
      });
      
      expect(satori.config.enableCallsite).toBe(false);
      expect(satori.config.maxBufferSize).toBe(500);
      expect(satori.config.appVersion).toBe('2.0.0');
    });

    it('should throw on invalid config', () => {
      expect(() => {
        createSatori({
          maxBufferSize: -1
        });
      }).toThrow();
    });
  });

  describe('logging', () => {
    it('should log messages with rootLogger', () => {
      satori = createSatori();
      const events: LogEntry[] = [];
      
      satori.bus.subscribe(entry => events.push(entry));
      satori.rootLogger.info('Test message');
      
      expect(events.length).toBe(1);
      expect(events[0].message).toBe('Test message');
      expect(events[0].level).toBe('info');
      expect(events[0].scope).toBe('root');
    });

    it('should log different levels', () => {
      satori = createSatori({ logLevel: 'debug' });
      const events: LogEntry[] = [];
      
      satori.bus.subscribe(entry => events.push(entry));
      
      satori.rootLogger.debug('Debug');
      satori.rootLogger.info('Info');
      satori.rootLogger.warn('Warn');
      satori.rootLogger.error('Error');
      
      expect(events.length).toBe(4);
      expect(events.map(e => e.level)).toEqual(['debug', 'info', 'warn', 'error']);
    });

    it('should filter by log level', () => {
      satori = createSatori({ logLevel: 'warn' });
      const events: LogEntry[] = [];
      
      satori.bus.subscribe(entry => events.push(entry));
      
      satori.rootLogger.debug('Debug'); // Should be filtered
      satori.rootLogger.info('Info'); // Should be filtered
      satori.rootLogger.warn('Warn');
      satori.rootLogger.error('Error');
      
      expect(events.length).toBe(2);
      expect(events.map(e => e.level)).toEqual(['warn', 'error']);
    });
  });

  describe('createLogger', () => {
    it('should create scoped loggers', () => {
      satori = createSatori();
      const events: LogEntry[] = [];
      
      satori.bus.subscribe(entry => events.push(entry));
      
      const userLogger = satori.createLogger('user');
      userLogger.info('User action');
      
      expect(events.length).toBe(1);
      expect(events[0].scope).toBe('user');
    });

    it('should track logger count in metrics', () => {
      satori = createSatori();
      
      satori.createLogger('logger1');
      satori.createLogger('logger2');
      
      const metrics = satori.getMetrics();
      expect(metrics.loggerCount).toBe(3); // root + 2 created
    });
  });

  describe('tags', () => {
    it('should support tagging', () => {
      satori = createSatori();
      const events: LogEntry[] = [];
      
      satori.bus.subscribe(entry => events.push(entry));
      
      satori.rootLogger.tag('important', 'user-action').info('Tagged message');
      
      expect(events[0].tags).toContain('important');
      expect(events[0].tags).toContain('user-action');
    });

    it('should chain tags', () => {
      satori = createSatori();
      const events: LogEntry[] = [];
      
      satori.bus.subscribe(entry => events.push(entry));
      
      satori.rootLogger.tag('first').tag('second').info('Chained tags');
      
      expect(events[0].tags).toContain('first');
      expect(events[0].tags).toContain('second');
    });
  });

  describe('causedBy', () => {
    it('should link events with causedBy string', () => {
      satori = createSatori();
      const events: LogEntry[] = [];
      
      satori.bus.subscribe(entry => events.push(entry));
      
      satori.rootLogger.causedBy('User clicked button').info('Modal opened');
      
      expect(events[0].cause).toBe('User clicked button');
    });

    it('should link events with causedBy event', () => {
      satori = createSatori();
      const events: LogEntry[] = [];
      
      satori.bus.subscribe(entry => events.push(entry));
      
      satori.rootLogger.info('First event');
      const firstEvent = events[0];
      
      satori.rootLogger.causedBy(firstEvent).info('Second event');
      
      expect(events[1].cause).toBe('First event');
      expect(events[1].causeEventId).toBe(firstEvent.id);
    });
  });

  describe('metrics', () => {
    it('should track metrics', async () => {
      satori = createSatori({ enableMetrics: true });
      
      satori.rootLogger.info('Test 1');
      satori.rootLogger.info('Test 2');
      
      // Small delay to ensure uptime > 0
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const metrics = satori.getMetrics();
      
      expect(metrics.bus.totalPublished).toBeGreaterThanOrEqual(2);
      expect(metrics.uptime).toBeGreaterThan(0);
    });
  });

  describe('dispose', () => {
    it('should dispose all resources', () => {
      satori = createSatori();
      const logger = satori.createLogger('test');
      
      // Create a watcher
      let value = 0;
      const handle = logger.watch(() => value, 'testWatch');
      
      satori.dispose();
      
      // Logger should still exist but subsequent logging should be handled gracefully
      // The dispose method should not throw
      expect(() => satori.dispose()).not.toThrow();
    });
  });
});
