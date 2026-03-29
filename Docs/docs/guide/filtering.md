---
title: "Filtering Events"
description: "Query and filter events by various criteria"
---

Satori provides comprehensive filtering functions to query events by level, scope, tags, time, and more.

## Basic Filters

### Filter by Level

```typescript
import { filterByLevel } from '@nisoku/satori';

const events = satori.getEvents();

const errors = filterByLevel(events, 'error');
const warnings = filterByLevel(events, 'warn');
const debugAndAbove = filterByLevel(events, 'debug');
```

### Filter by Scope

```typescript
import { filterByScope } from '@nisoku/satori';

// Exact match
const authEvents = filterByScope(events, 'auth');

// Prefix match (includes child scopes)
const apiEvents = filterByScope(events, 'api', { prefix: true });
// Matches: 'api', 'api.users', 'api.orders', etc.
```

### Filter by Tags

```typescript
import { filterByTag, filterByTags } from '@nisoku/satori';

// Single tag
const securityEvents = filterByTag(events, 'security');

// Multiple tags (AND)
const criticalSecurity = filterByTags(events, ['security', 'critical']);

// Multiple tags (OR)
const userOrAdmin = filterByTags(events, ['user', 'admin'], { match: 'any' });
```

### Filter by Time Range

```typescript
import { filterByTimeRange } from '@nisoku/satori';

const now = Date.now();
const oneHourAgo = now - (60 * 60 * 1000);

const recentEvents = filterByTimeRange(events, {
  start: oneHourAgo,
  end: now
});

// Last 24 hours
const last24h = filterByTimeRange(events, {
  start: now - (24 * 60 * 60 * 1000)
});
```

## Combining Filters

Chain multiple filters together:

```typescript
import { 
  filterByLevel, 
  filterByScope, 
  filterByTimeRange 
} from '@nisoku/satori';

let results = satori.getEvents();

// Get errors from auth in the last hour
results = filterByLevel(results, 'error');
results = filterByScope(results, 'auth');
results = filterByTimeRange(results, { 
  start: Date.now() - 3600000 
});

console.log(`Found ${results.length} auth errors in the last hour`);
```

## Advanced Filtering

### Filter by State

```typescript
import { filterByState } from '@nisoku/satori';

// Find events where userId matches
const userEvents = filterByState(events, { userId: '123' });

// Nested state matching
const adminEvents = filterByState(events, { 
  user: { role: 'admin' } 
});
```

### Filter by Message Pattern

```typescript
import { filterByMessage } from '@nisoku/satori';

// Substring match
const loginEvents = filterByMessage(events, 'login');

// Regex match
const errorPatterns = filterByMessage(events, /error|fail|exception/i);
```

### Filter by Cause

```typescript
import { filterByCause } from '@nisoku/satori';

// Find all events caused by a specific event
const effects = filterByCause(events, 'evt_12345');
```

## Custom Filters

Create custom filter functions:

```typescript
// Filter events with large state objects
const largeStateEvents = events.filter(event => {
  const stateSize = JSON.stringify(event.state || {}).length;
  return stateSize > 1000;
});

// Filter by custom criteria
const criticalErrors = events.filter(event => 
  event.level === 'error' && 
  event.tags?.includes('critical') &&
  event.scope.startsWith('production')
);
```

## Aggregation

Aggregate events for analysis:

```typescript
// Count by level
const levelCounts = events.reduce((acc, event) => {
  acc[event.level] = (acc[event.level] || 0) + 1;
  return acc;
}, {});

// Group by scope
const byScope = events.reduce((acc, event) => {
  if (!acc[event.scope]) acc[event.scope] = [];
  acc[event.scope].push(event);
  return acc;
}, {});

// Find most common error messages
const errorMessages = events
  .filter(e => e.level === 'error')
  .reduce((acc, e) => {
    acc[e.message] = (acc[e.message] || 0) + 1;
    return acc;
  }, {});
```

## Real-Time Filtering

Filter events as they arrive:

```typescript
satori.bus.subscribe((event) => {
  // Only process errors
  if (event.level !== 'error') return;
  
  // Only from production scopes
  if (!event.scope.startsWith('prod')) return;
  
  // Send to error tracking
  sendToErrorTracking(event);
});
```

## Performance Tips

::: callout tip
For large event sets, filter early and often. Apply the most restrictive filters first.
:::

```typescript
// Good: Filter by time first (most restrictive)
let results = filterByTimeRange(events, { start: lastHour });
results = filterByLevel(results, 'error');
results = filterByScope(results, 'api');

// Less efficient: Filter by scope first on all events
let results = filterByScope(events, 'api');
results = filterByLevel(results, 'error');
results = filterByTimeRange(results, { start: lastHour });
```

## Next Steps

- [Advanced Features](/Satori/docs/guide/advanced): Persistence, circuit breakers
- [Examples](/Satori/docs/guide/examples): Real-world patterns
- [API Reference](/Satori/docs/api/filters): Complete filter API
