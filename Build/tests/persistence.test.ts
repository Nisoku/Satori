/**
 * Persistence adapter tests
 */

import { MemoryAdapter, ConsoleAdapter } from '../src/persistence/adapters';
import type { LogEntry } from '../src/core/types';

const createMockEvent = (overrides: Partial<LogEntry> = {}): LogEntry => ({
  id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  timestamp: Date.now(),
  level: 'info',
  scope: 'test',
  message: 'test message',
  tags: [],
  ...overrides
});

describe('MemoryAdapter', () => {
  let adapter: MemoryAdapter;

  beforeEach(() => {
    adapter = new MemoryAdapter(100);
  });

  afterEach(async () => {
    await adapter.close();
  });

  it('should write and read events', async () => {
    const event = createMockEvent();
    await adapter.write([event]);
    
    const events = await adapter.read();
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(event);
  });

  it('should write batch of events', async () => {
    const events = [
      createMockEvent({ message: 'one' }),
      createMockEvent({ message: 'two' }),
      createMockEvent({ message: 'three' })
    ];
    
    await adapter.write(events);
    
    const retrieved = await adapter.read();
    expect(retrieved).toHaveLength(3);
  });

  it('should respect maxSize limit', async () => {
    const smallAdapter = new MemoryAdapter(3);
    
    for (let i = 0; i < 10; i++) {
      await smallAdapter.write([createMockEvent({ message: `msg${i}` })]);
    }
    
    const events = await smallAdapter.read();
    expect(events).toHaveLength(3);
    
    // Should have the most recent events
    expect(events[events.length - 1].message).toBe('msg9');
    
    await smallAdapter.close();
  });

  it('should filter by level', async () => {
    await adapter.write([
      createMockEvent({ level: 'info', message: 'info1' }),
      createMockEvent({ level: 'error', message: 'error1' }),
      createMockEvent({ level: 'info', message: 'info2' }),
      createMockEvent({ level: 'error', message: 'error2' })
    ]);
    
    const errors = await adapter.read({ levels: ['error'] });
    expect(errors).toHaveLength(2);
    expect(errors.every(e => e.level === 'error')).toBe(true);
  });

  it('should clear all events', async () => {
    await adapter.write([
      createMockEvent(),
      createMockEvent(),
      createMockEvent()
    ]);
    
    await adapter.clear();
    
    const events = await adapter.read();
    expect(events).toHaveLength(0);
  });

  it('should handle empty read', async () => {
    const events = await adapter.read();
    expect(events).toEqual([]);
  });

  it('should filter by scope', async () => {
    await adapter.write([
      createMockEvent({ scope: 'auth' }),
      createMockEvent({ scope: 'api' }),
      createMockEvent({ scope: 'auth' })
    ]);
    
    const authEvents = await adapter.read({ scopes: ['auth'] });
    expect(authEvents).toHaveLength(2);
  });

  it('should filter by time range', async () => {
    const now = Date.now();
    await adapter.write([
      createMockEvent({ timestamp: now - 10000 }),
      createMockEvent({ timestamp: now - 5000 }),
      createMockEvent({ timestamp: now })
    ]);
    
    const recentEvents = await adapter.read({ startTime: now - 6000 });
    expect(recentEvents).toHaveLength(2);
  });

  it('should support limit and offset', async () => {
    await adapter.write([
      createMockEvent({ message: 'msg0' }),
      createMockEvent({ message: 'msg1' }),
      createMockEvent({ message: 'msg2' }),
      createMockEvent({ message: 'msg3' }),
      createMockEvent({ message: 'msg4' })
    ]);
    
    const limited = await adapter.read({ limit: 2 });
    expect(limited).toHaveLength(2);
    
    const paged = await adapter.read({ offset: 2, limit: 2 });
    expect(paged).toHaveLength(2);
  });

  it('should return size', () => {
    expect(adapter.getSize()).toBe(0);
  });
});

describe('ConsoleAdapter', () => {
  let adapter: ConsoleAdapter;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    adapter = new ConsoleAdapter();
  });

  afterEach(async () => {
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    await adapter.close();
  });

  it('should log events to console', async () => {
    const event = createMockEvent({ message: 'test log' });
    await adapter.write([event]);
    
    expect(consoleInfoSpy).toHaveBeenCalled();
    const loggedString = consoleInfoSpy.mock.calls[0][0];
    expect(loggedString).toContain('[test]');
    expect(loggedString).toContain('test log');
  });

  it('should format different log levels', async () => {
    await adapter.write([
      createMockEvent({ level: 'error', message: 'error msg' }),
      createMockEvent({ level: 'warn', message: 'warn msg' }),
      createMockEvent({ level: 'info', message: 'info msg' })
    ]);
    
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
  });

  it('should return events for read (console stores in memory)', async () => {
    await adapter.write([createMockEvent()]);
    const events = await adapter.read();
    expect(events).toHaveLength(1);
  });
});

describe('Persistence edge cases', () => {
  it('should handle events with undefined fields', async () => {
    const adapter = new MemoryAdapter(100);
    
    const event = createMockEvent();
    (event as any).state = undefined;
    
    await expect(adapter.write([event])).resolves.not.toThrow();
    
    const events = await adapter.read();
    expect(events).toHaveLength(1);
    
    await adapter.close();
  });

  it('should handle events with complex nested state', async () => {
    const adapter = new MemoryAdapter(100);
    
    const event = createMockEvent();
    (event as any).state = {
      level1: {
        level2: {
          level3: {
            level4: {
              value: 'deep'
            }
          }
        }
      }
    };
    
    await adapter.write([event]);
    const events = await adapter.read();
    
    expect((events[0] as any).state.level1.level2.level3.level4.value).toBe('deep');
    
    await adapter.close();
  });

  it('should handle rapid write operations', async () => {
    const adapter = new MemoryAdapter(1000);
    
    const promises: Promise<void>[] = [];
    for (let i = 0; i < 100; i++) {
      promises.push(adapter.write([createMockEvent({ message: `msg${i}` })]));
    }
    
    await Promise.all(promises);
    
    const events = await adapter.read();
    expect(events).toHaveLength(100);
    
    await adapter.close();
  });

  it('should handle concurrent read and write', async () => {
    const adapter = new MemoryAdapter(1000);
    
    // Pre-populate
    for (let i = 0; i < 50; i++) {
      await adapter.write([createMockEvent({ level: i % 2 === 0 ? 'info' : 'error' })]);
    }
    
    // Concurrent operations
    const [readResult] = await Promise.all([
      adapter.read({ levels: ['info'] }),
      adapter.write([createMockEvent({ level: 'warn' })]),
      adapter.write([createMockEvent({ level: 'debug' })])
    ]);
    
    expect(readResult.length).toBeGreaterThan(0);
    
    await adapter.close();
  });
});
