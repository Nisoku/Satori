import { describe, test, expect, it } from '@jest/globals';
import {
  filterByLevel,
  filterByScopes,
  filterByScopePattern,
  filterByTags,
  filterByAllTags,
  filterByText,
  filterByRegex,
  filterByTimeRange,
  filterByRelativeTime,
  filterByCause,
  filterByHasCause,
  filterByStateKey,
  applyAllFilters,
  groupBy,
  aggregateByTime,
  countByLevel,
  countByScope
} from '../src/overlay/filters';
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

describe('Filters', () => {
  describe('filterByLevel', () => {
    it('should filter by minimum level', () => {
      const events = [
        createMockEntry({ level: 'debug' }),
        createMockEntry({ level: 'info' }),
        createMockEntry({ level: 'warn' }),
        createMockEntry({ level: 'error' })
      ];

      const filtered = filterByLevel(events, 'warn');
      
      expect(filtered.length).toBe(2);
      expect(filtered.map(e => e.level)).toEqual(['warn', 'error']);
    });

    it('should return all if no level specified', () => {
      const events = [
        createMockEntry({ level: 'debug' }),
        createMockEntry({ level: 'info' })
      ];

      const filtered = filterByLevel(events);
      expect(filtered.length).toBe(2);
    });
  });

  describe('filterByScopes', () => {
    it('should filter by scope list', () => {
      const events = [
        createMockEntry({ scope: 'user' }),
        createMockEntry({ scope: 'auth' }),
        createMockEntry({ scope: 'api' })
      ];

      const filtered = filterByScopes(events, ['user', 'api']);
      
      expect(filtered.length).toBe(2);
      expect(filtered.map(e => e.scope)).toEqual(['user', 'api']);
    });

    it('should return all if empty scope list', () => {
      const events = [
        createMockEntry({ scope: 'user' }),
        createMockEntry({ scope: 'auth' })
      ];

      const filtered = filterByScopes(events, []);
      expect(filtered.length).toBe(2);
    });
  });

  describe('filterByScopePattern', () => {
    it('should filter by regex pattern', () => {
      const events = [
        createMockEntry({ scope: 'user.login' }),
        createMockEntry({ scope: 'user.logout' }),
        createMockEntry({ scope: 'api.request' })
      ];

      const filtered = filterByScopePattern(events, /^user\./);
      
      expect(filtered.length).toBe(2);
    });

    it('should filter by string pattern', () => {
      const events = [
        createMockEntry({ scope: 'user.login' }),
        createMockEntry({ scope: 'user.logout' }),
        createMockEntry({ scope: 'api.request' })
      ];

      const filtered = filterByScopePattern(events, 'user');
      
      expect(filtered.length).toBe(2);
    });
  });

  describe('filterByTags', () => {
    it('should filter by any matching tag', () => {
      const events = [
        createMockEntry({ tags: ['important', 'user'] }),
        createMockEntry({ tags: ['debug'] }),
        createMockEntry({ tags: ['important'] })
      ];

      const filtered = filterByTags(events, ['important']);
      
      expect(filtered.length).toBe(2);
    });
  });

  describe('filterByAllTags', () => {
    it('should filter by all matching tags', () => {
      const events = [
        createMockEntry({ tags: ['important', 'user'] }),
        createMockEntry({ tags: ['important'] }),
        createMockEntry({ tags: ['user'] })
      ];

      const filtered = filterByAllTags(events, ['important', 'user']);
      
      expect(filtered.length).toBe(1);
    });
  });

  describe('filterByText', () => {
    it('should search in message', () => {
      const events = [
        createMockEntry({ message: 'User logged in' }),
        createMockEntry({ message: 'API request failed' }),
        createMockEntry({ message: 'User logged out' })
      ];

      const filtered = filterByText(events, 'User');
      
      expect(filtered.length).toBe(2);
    });

    it('should be case insensitive', () => {
      const events = [
        createMockEntry({ message: 'User logged in' }),
        createMockEntry({ message: 'API request' })
      ];

      const filtered = filterByText(events, 'user');
      
      expect(filtered.length).toBe(1);
    });
  });

  describe('filterByRegex', () => {
    it('should filter by regex in message', () => {
      const events = [
        createMockEntry({ message: 'Error: Something went wrong' }),
        createMockEntry({ message: 'Warning: Be careful' }),
        createMockEntry({ message: 'Error: Another issue' })
      ];

      const filtered = filterByRegex(events, /^Error:/);
      
      expect(filtered.length).toBe(2);
    });
  });

  describe('filterByTimeRange', () => {
    it('should filter by time range', () => {
      const now = Date.now();
      const events = [
        createMockEntry({ timestamp: now - 5000 }),
        createMockEntry({ timestamp: now - 2000 }),
        createMockEntry({ timestamp: now })
      ];

      const filtered = filterByTimeRange(events, now - 3000, now - 1000);
      
      expect(filtered.length).toBe(1);
    });
  });

  describe('filterByRelativeTime', () => {
    it('should filter by relative time', () => {
      const now = Date.now();
      const events = [
        createMockEntry({ timestamp: now - 5000 }),
        createMockEntry({ timestamp: now - 2000 }),
        createMockEntry({ timestamp: now })
      ];

      const filtered = filterByRelativeTime(events, 3000);
      
      expect(filtered.length).toBe(2);
    });
  });

  describe('filterByCause', () => {
    it('should filter by cause event ID', () => {
      const events = [
        createMockEntry({ causeEventId: 'cause1' }),
        createMockEntry({ causeEventId: 'cause2' }),
        createMockEntry({ causeEventId: 'cause1' })
      ];

      const filtered = filterByCause(events, 'cause1');
      
      expect(filtered.length).toBe(2);
    });
  });

  describe('filterByHasCause', () => {
    it('should filter events with cause', () => {
      const events = [
        createMockEntry({ causeEventId: 'cause1' }),
        createMockEntry({}),
        createMockEntry({ causeEventId: 'cause2' })
      ];

      const filtered = filterByHasCause(events);
      
      expect(filtered.length).toBe(2);
    });
  });

  describe('filterByStateKey', () => {
    it('should filter by state key presence', () => {
      const events = [
        createMockEntry({ state: { userId: 1 } }),
        createMockEntry({ state: { other: 'value' } }),
        createMockEntry({ state: { userId: 2 } })
      ];

      const filtered = filterByStateKey(events, 'userId');
      
      expect(filtered.length).toBe(2);
    });
  });

  describe('applyAllFilters', () => {
    it('should apply multiple filters', () => {
      const events = [
        createMockEntry({ level: 'info', scope: 'user', message: 'Login' }),
        createMockEntry({ level: 'error', scope: 'user', message: 'Error' }),
        createMockEntry({ level: 'info', scope: 'api', message: 'Request' })
      ];

      const filtered = applyAllFilters(events, {
        level: 'info',
        scopes: ['user'],
        tags: [],
        text: 'Login'
      });
      
      expect(filtered.length).toBe(1);
      expect(filtered[0].message).toBe('Login');
    });
  });

  describe('groupBy', () => {
    it('should group by field', () => {
      const events = [
        createMockEntry({ level: 'info' }),
        createMockEntry({ level: 'error' }),
        createMockEntry({ level: 'info' })
      ];

      const grouped = groupBy(events, 'level');
      
      expect(grouped.get('info')?.length).toBe(2);
      expect(grouped.get('error')?.length).toBe(1);
    });
  });

  describe('aggregateByTime', () => {
    it('should aggregate by time buckets', () => {
      const now = Date.now();
      const events = [
        createMockEntry({ timestamp: now }),
        createMockEntry({ timestamp: now + 100 }),
        createMockEntry({ timestamp: now + 1500 })
      ];

      const buckets = aggregateByTime(events, 1000);
      
      expect(buckets.size).toBe(2);
    });
  });

  describe('countByLevel', () => {
    it('should count events by level', () => {
      const events = [
        createMockEntry({ level: 'info' }),
        createMockEntry({ level: 'error' }),
        createMockEntry({ level: 'info' }),
        createMockEntry({ level: 'warn' })
      ];

      const counts = countByLevel(events);
      
      expect(counts.info).toBe(2);
      expect(counts.error).toBe(1);
      expect(counts.warn).toBe(1);
    });
  });

  describe('countByScope', () => {
    it('should count events by scope', () => {
      const events = [
        createMockEntry({ scope: 'user' }),
        createMockEntry({ scope: 'api' }),
        createMockEntry({ scope: 'user' })
      ];

      const counts = countByScope(events);
      
      expect(counts.user).toBe(2);
      expect(counts.api).toBe(1);
    });
  });
});
