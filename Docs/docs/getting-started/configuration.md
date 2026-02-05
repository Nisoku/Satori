---
title: "Configuration"
description: "Configure Satori for your needs"
---

Satori works out of the box with sensible defaults, but you can customize every aspect of its behavior.

## Basic Configuration

```typescript
import { createSatori } from '@nisoku/satori-log';

const satori = createSatori({
  logLevel: 'info',
  maxBufferSize: 1000,
  pollingInterval: 250
});
```

## Complete Configuration Reference

```typescript
const satori = createSatori({
  // Minimum log level to emit
  logLevel: 'info',  // 'debug' | 'info' | 'warn' | 'error'

  // Auto-log to console when available
  enableConsole: true,
  
  // Custom log levels
  customLevels: [
    { name: 'critical', severity: 4 },
    { name: 'trace', severity: -1 }
  ],
  
  // State watcher polling interval (ms)
  pollingInterval: 250,
  
  // Maximum events in memory buffer
  maxBufferSize: 1000,
  
  // Rate limiting
  rateLimiting: {
    enabled: false,
    maxEventsPerSecond: 100,
    strategy: 'drop',  // 'drop' | 'sample' | 'buffer'
    samplingRate: 0.1,
    bufferSize: 100
  },
  
  // Event deduplication
  deduplication: {
    enabled: false,
    windowMs: 1000,
    fields: ['message', 'level', 'scope'],
    maxCacheSize: 1000
  },
  
  // Circuit breaker for error recovery
  circuitBreaker: {
    enabled: false,
    failureThreshold: 5,
    resetTimeout: 30000,
    successThreshold: 3
  },
  
  // Metrics collection
  enableMetrics: true
});
```

## Log Levels

### Built-in Levels

| Level | Severity | Description |
| ------- | ---------- | ------------- |
| debug | 0 | Detailed debugging information |
| info | 1 | General information |
| warn | 2 | Warning conditions |
| error | 3 | Error conditions |

### Custom Levels

Define your own log levels with custom severities:

```typescript
const satori = createSatori({
  customLevels: [
    { name: 'trace', severity: -1 },   // Lower than debug
    { name: 'critical', severity: 4 }, // Higher than error
    { name: 'audit', severity: 3 }     // Same as error
  ]
});

const logger = satori.createLogger('app');

// Use custom levels with log()
logger.log('trace', 'Detailed trace info');
logger.log('critical', 'System critical failure!');
logger.log('audit', 'User performed action');
```

::: callout warning
Some names are reserved and cannot be used: `log`, `event`. Using built-in level names like `info` will generate a warning about shadowing.
:::

## Rate Limiting

Prevent event floods from overwhelming your system:

::: tabs
== tab "Drop Strategy"

```typescript
const satori = createSatori({
  rateLimiting: {
    enabled: true,
    maxEventsPerSecond: 100,
    strategy: 'drop'
  }
});
```

Events exceeding the limit are silently dropped.

== tab "Sample Strategy"

```typescript
const satori = createSatori({
  rateLimiting: {
    enabled: true,
    maxEventsPerSecond: 100,
    strategy: 'sample',
    samplingRate: 0.1  // Keep 10%
  }
});
```

Randomly samples events when over limit.

== tab "Buffer Strategy"

```typescript
const satori = createSatori({
  rateLimiting: {
    enabled: true,
    maxEventsPerSecond: 100,
    strategy: 'buffer',
    bufferSize: 200
  }
});
```

Buffers excess events for later delivery.
:::

## Deduplication

Prevent duplicate events within a time window:

```typescript
const satori = createSatori({
  deduplication: {
    enabled: true,
    windowMs: 1000,  // 1 second window
    fields: ['message', 'level', 'scope'],
    maxCacheSize: 1000
  }
});

// These will be deduplicated to one event:
logger.info('Button clicked');
logger.info('Button clicked');  // Deduplicated
logger.info('Button clicked');  // Deduplicated
```

## Persistence

Store events for debugging and analysis. Import and use adapter classes:

```typescript
import { createSatori, MemoryAdapter, LocalStorageAdapter, IndexedDBAdapter, ConsoleAdapter } from '@nisoku/satori-log';

// Memory adapter (non-persistent)
const satori = createSatori({
  persistence: {
    enabled: true,
    adapter: new MemoryAdapter(10000)  // maxSize
  }
});

// LocalStorage adapter (browser)
const satori2 = createSatori({
  persistence: {
    enabled: true,
    adapter: new LocalStorageAdapter('satori-events', 5000)
  }
});

// IndexedDB adapter (browser, larger capacity)
const satori3 = createSatori({
  persistence: {
    enabled: true,
    adapter: new IndexedDBAdapter('satori-db', 100000)
  }
});

// Console adapter (debugging)
const satori4 = createSatori({
  persistence: {
    enabled: true,
    adapter: new ConsoleAdapter()
  }
});
```

## Circuit Breaker

Protect your system from cascading failures:

```typescript
const satori = createSatori({
  circuitBreaker: {
    enabled: true,
    failureThreshold: 5,   // Open after 5 failures
    resetTimeout: 30000,   // Try again after 30s
    successThreshold: 3    // Close after 3 successes
  }
});
```

## Environment-Specific Configuration

```typescript
const isDev = process.env.NODE_ENV === 'development';

const satori = createSatori({
  logLevel: isDev ? 'debug' : 'warn',
  
  rateLimiting: {
    enabled: !isDev,  // Only in production
    maxEventsPerSecond: 100
  }
});
```

## Next Steps

- [State Watching](../guide/watching): Automatically track changes
- [Advanced Features](../guide/advanced): Circuit breakers, causal graphs
- [API Reference](../api/): Complete API documentation
