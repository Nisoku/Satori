---
title: "Advanced Features"
description: "Circuit breakers, persistence, metrics, and more"
---

This guide covers Satori's advanced features for production use.

## Circuit Breaker

The circuit breaker pattern protects your system from cascading failures, particularly useful for watchers that may throw errors.

### How It Works

1. **Closed** (normal): All operations pass through
2. **Open** (tripped): Operations fail fast without executing
3. **Half-Open** (testing): Limited operations to test recovery

```typescript
const satori = createSatori({
  circuitBreaker: {
    enabled: true,
    failureThreshold: 5,    // Open after 5 failures
    resetTimeout: 30000,    // Try again after 30 seconds
    successThreshold: 3     // Close after 3 successes
  }
});
```

### Monitoring Circuit State

```typescript
const metrics = satori.getMetrics();
console.log(`Circuit state: ${metrics.circuitBreakerState}`);
// "closed" | "open" | "half-open"
```

### Direct Usage

```typescript
import { CircuitBreaker } from '@nisoku/satori';

const cb = new CircuitBreaker({
  enabled: true,
  failureThreshold: 5,
  resetTimeout: 30000,
  successThreshold: 3
}, {
  onOpen: () => console.log('Circuit opened'),
  onClose: () => console.log('Circuit closed'),
  onHalfOpen: () => console.log('Circuit half-open')
});

// Execute with circuit breaker protection
try {
  await cb.execute(async () => {
    return await riskyOperation();
  });
} catch (error) {
  // Handle error or circuit open
}
```

## Self-Monitoring Metrics

Track Satori's internal performance:

```typescript
const satori = createSatori({ enableMetrics: true });

// Get current metrics
const metrics = satori.getMetrics();

console.log({
  uptime: metrics.uptime,
  eventsPublished: metrics.bus.totalPublished,
  eventsDropped: metrics.bus.totalDropped,
  eventsDeduplicated: metrics.bus.totalDeduplicated,
  bufferSize: metrics.bus.bufferSize,
  subscriberCount: metrics.bus.subscriberCount
});
```

### Periodic Metrics Logging

```typescript
setInterval(() => {
  const m = satori.getMetrics();
  logger.info('Satori metrics', { 
    tags: ['metrics', 'self-monitor'],
    state: m 
  });
}, 60000);  // Every minute
```

## Persistence Adapters

Satori provides several persistence adapters for storing log events. Pass an adapter instance to the configuration.

### Memory Adapter

In-memory storage (non-persistent, useful for testing):

```typescript
import { createSatori, MemoryAdapter } from '@nisoku/satori';

const satori = createSatori({
  persistence: {
    enabled: true,
    adapter: new MemoryAdapter(10000)  // maxSize
  }
});
```

### LocalStorage Adapter

Browser localStorage persistence:

```typescript
import { createSatori, LocalStorageAdapter } from '@nisoku/satori';

const satori = createSatori({
  persistence: {
    enabled: true,
    adapter: new LocalStorageAdapter('satori-events', 5000)  // key, maxSize
  }
});
```

### IndexedDB Adapter

Browser IndexedDB for larger datasets:

```typescript
import { createSatori, IndexedDBAdapter } from '@nisoku/satori';

const satori = createSatori({
  persistence: {
    enabled: true,
    adapter: new IndexedDBAdapter('satori-db', 100000)  // dbName, maxSize
  }
});
```

### Console Adapter

Outputs events to console (useful for debugging):

```typescript
import { createSatori, ConsoleAdapter } from '@nisoku/satori';

const satori = createSatori({
  persistence: {
    enabled: true,
    adapter: new ConsoleAdapter()
  }
});
```

## State Selectors

Create typed, reusable state selectors for watching:

```typescript
import { createStateSelector } from '@nisoku/satori';

interface AppState {
  users: {
    current: { name: string; role: string } | null;
    list: User[];
  };
  settings: {
    theme: 'light' | 'dark';
  };
}

// Define typed selectors
const currentUser = createStateSelector<AppState>(
  (state) => state.users.current
);

const theme = createStateSelector<AppState>(
  (state) => state.settings.theme
);

// Use with watch
const appState: AppState = { /* ... */ };

logger.watch(() => currentUser(appState), 'currentUser');
logger.watch(() => theme(appState), 'theme');
```

## Middleware

Add custom middleware to the event pipeline using `bus.use()`:

```typescript
// Add middleware via the event bus
satori.bus.use((event, next) => {
  // Modify or filter events before they reach subscribers
  if (event.tags?.includes('internal')) {
    return; // Don't pass to next middleware (drops event)
  }
  next(); // Continue to next middleware/subscribers
});
```

## Replay Buffer

The event bus maintains a replay buffer for debugging. Access it via the bus:

```typescript
// Get the replay buffer from the bus
const buffer = satori.bus.getReplayBuffer();

// Replay events
for (const event of buffer) {
  console.log('Replaying:', event);
}
```

## Deep Equality Utilities

Satori exports its deep equality utilities:

```typescript
import { deepEqual, deepClone, computeHash } from '@nisoku/satori';

// Deep comparison (handles NaN, circular refs, Map, Set)
deepEqual({ a: 1 }, { a: 1 });           // true
deepEqual(NaN, NaN);                      // true
deepEqual(new Map([['a', 1]]), new Map([['a', 1]]));  // true

// Deep clone (safe with circular refs)
const clone = deepClone(complexObject);

// Compute hash for deduplication
const hash = computeHash({ msg: 'test' });
```

## Next Steps

- [API Reference](/Satori/docs/api/): Complete API documentation
- [Examples](/Satori/docs/guide/examples): Real-world patterns
