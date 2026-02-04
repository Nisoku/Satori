---
title: "Filter API"
description: "Event filtering API reference"
---

Satori provides comprehensive filtering functions for querying events.

## filterByLevel

Filter events by log level.

```typescript
function filterByLevel(
  events: LogEntry[], 
  level: LogLevel
): LogEntry[];
```

```typescript
const errors = filterByLevel(events, 'error');
const warnings = filterByLevel(events, 'warn');
```

---

## filterByScope

Filter events by scope.

```typescript
function filterByScope(
  events: LogEntry[], 
  scope: string,
  options?: { prefix?: boolean }
): LogEntry[];
```

```typescript
// Exact match
const authEvents = filterByScope(events, 'auth');

// Prefix match (includes 'api', 'api.users', 'api.orders')
const apiEvents = filterByScope(events, 'api', { prefix: true });
```

---

## filterByTag

Filter events that have a specific tag.

```typescript
function filterByTag(
  events: LogEntry[], 
  tag: string
): LogEntry[];
```

```typescript
const securityEvents = filterByTag(events, 'security');
```

---

## filterByTags

Filter events by multiple tags.

```typescript
function filterByTags(
  events: LogEntry[], 
  tags: string[],
  options?: { match?: 'all' | 'any' }
): LogEntry[];
```

```typescript
// All tags must be present (default)
const critical = filterByTags(events, ['security', 'critical']);

// Any tag must be present
const userOrAdmin = filterByTags(events, ['user', 'admin'], { match: 'any' });
```

---

## filterByTimeRange

Filter events within a time range.

```typescript
function filterByTimeRange(
  events: LogEntry[], 
  range: { start?: number; end?: number }
): LogEntry[];
```

```typescript
const now = Date.now();

// Last hour
const recentEvents = filterByTimeRange(events, {
  start: now - 3600000
});

// Specific range
const rangeEvents = filterByTimeRange(events, {
  start: yesterday,
  end: today
});
```

---

## filterByMessage

Filter events by message content.

```typescript
function filterByMessage(
  events: LogEntry[], 
  pattern: string | RegExp
): LogEntry[];
```

```typescript
// Substring match
const loginEvents = filterByMessage(events, 'login');

// Regex match
const errorEvents = filterByMessage(events, /error|fail|exception/i);
```

---

## filterByState

Filter events by state values.

```typescript
function filterByState(
  events: LogEntry[], 
  state: Record<string, any>
): LogEntry[];
```

```typescript
// Match specific state values
const userEvents = filterByState(events, { userId: '123' });

// Nested state matching
const adminEvents = filterByState(events, { 
  user: { role: 'admin' } 
});
```

---

## filterByCause

Filter events by their cause event ID.

```typescript
function filterByCause(
  events: LogEntry[], 
  causeId: string
): LogEntry[];
```

```typescript
// Find all events caused by a specific event
const effects = filterByCause(events, 'evt_12345');
```

---

## Chaining Filters

Filters can be chained for complex queries:

```typescript
import { 
  filterByLevel, 
  filterByScope, 
  filterByTimeRange,
  filterByTags 
} from '@nisoku/satori-log';

let results = satori.getEvents();

// Get critical auth errors in the last hour
results = filterByTimeRange(results, { start: Date.now() - 3600000 });
results = filterByLevel(results, 'error');
results = filterByScope(results, 'auth');
results = filterByTags(results, ['critical']);

console.log(`Found ${results.length} critical auth errors`);
```

---

## Custom Filters

Create custom filter functions:

```typescript
// Filter by custom criteria
const customFilter = (events: LogEntry[]) => 
  events.filter(event => 
    event.level === 'error' && 
    event.state?.retryCount > 3
  );

const failedRetries = customFilter(events);
```
