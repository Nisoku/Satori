---
title: "Core API"
description: "Core Satori API reference"
---

## createSatori

Creates a new Satori instance with the provided configuration.

```typescript
function createSatori(config?: Partial<SatoriConfig>): SatoriInstance;
```

### Parameters

| Parameter | Type | Description |
| ----------- | ------ | ------------- |
| `config` | `Partial<SatoriConfig>` | Optional configuration object |

### Returns: SatoriInstance

```typescript
interface SatoriInstance {
  /** Resolved configuration */
  config: SatoriConfig;
  
  /** The event bus for subscribing to events */
  bus: EventBus;
  
  /** The root logger (scope: "root") */
  rootLogger: SatoriLogger;
  
  /** Create a scoped logger */
  createLogger(scope: string): SatoriLogger;
  
  /** Get current metrics */
  getMetrics(): SatoriMetrics;
  
  /** Flush any pending persistence */
  flush(): Promise<void>;
  
  /** Dispose all resources */
  dispose(): void;
}
```

### Subscribing to Events

Use `satori.bus.subscribe()` to receive all events:

```typescript
const unsubscribe = satori.bus.subscribe((event) => {
  console.log(event);
});

// Later: stop subscribing
unsubscribe();
```

### Example

```typescript
import { createSatori } from '@nisoku/satori-log';

const satori = createSatori({
  logLevel: 'debug',
  maxBufferSize: 500,
  rateLimiting: { enabled: true, maxEventsPerSecond: 50 }
});

const logger = satori.createLogger('app');
logger.info('Application started');

const unsubscribe = satori.bus.subscribe((event) => {
  sendToServer(event);
});

// Clean up
satori.dispose();
```

---

## SatoriLogger

A scoped logger instance for emitting events.

### Methods

#### `log(level, message, options?)`

Log an event with any level (built-in or custom).

```typescript
logger.log(level: string, message: string, options?: LogOptions): void;
```

```typescript
logger.log('critical', 'System failure', { 
  tags: ['critical'],
  state: { errorCode: 500 }
});
```

#### `debug(message, options?)`

Log a debug-level event.

```typescript
logger.debug(message: string, options?: LogOptions): void;
```

#### `info(message, options?)`

Log an info-level event.

```typescript
logger.info(message: string, options?: LogOptions): void;
```

#### `warn(message, options?)`

Log a warning-level event.

```typescript
logger.warn(message: string, options?: LogOptions): void;
```

#### `error(message, options?)`

Log an error-level event.

```typescript
logger.error(message: string, options?: LogOptions): void;
```

#### `watch(source, label)`

Watch a value for changes and automatically log when it changes.

```typescript
logger.watch(
  source: () => T,         // Function returning the value to watch
  label: string            // Name for this watcher
): WatchHandle;
```

```typescript
const handle = logger.watch(() => store.count, 'counter');
// Later:
handle.dispose();
```

#### `when(source, predicate, callback)`

Watch for a condition to become true.

```typescript
logger.when(
  source: () => T,                    // Value source
  predicate: (prev: T, curr: T) => boolean,  // Condition
  callback: () => void                // Called when true
): WatchHandle;
```

```typescript
logger.when(
  () => temperature,
  (prev, curr) => curr > 100,
  () => triggerAlarm()
);
```

#### `dispose()`

Dispose the logger and all its watchers.

```typescript
logger.dispose(): void;
```

### Properties

| Property | Type | Description |
| ---------- | ------ | ------------- |
| `scope` | `string` | The logger's scope/namespace |
| `lastEventId` | `string \| undefined` | ID of the most recent event |

---

## LogOptions

Options for log methods.

```typescript
interface LogOptions {
  /** Tags for categorization */
  tags?: string[];
  
  /** State snapshot to include */
  state?: Record<string, any>;
  
  /** ID of causing event (for causal linking) */
  cause?: string;
}
```

---

## LogEntry

The structure of a log event.

```typescript
interface LogEntry {
  /** Unique event identifier */
  id: string;
  
  /** ISO 8601 timestamp */
  timestamp: string;
  
  /** Log level */
  level: string;
  
  /** Logger scope/namespace */
  scope: string;
  
  /** Log message */
  message: string;
  
  /** Optional tags */
  tags?: string[];
  
  /** Optional state snapshot */
  state?: Record<string, any>;
  
  /** Optional causing event ID */
  cause?: string;
  
  /** Environment info */
  env?: {
    platform?: string;
    userAgent?: string;
    url?: string;
  };
  
  /** Source location */
  callsite?: {
    file?: string;
    line?: number;
    column?: number;
    function?: string;
  };
}
```

---

## SatoriConfig

Complete configuration interface.

```typescript
interface SatoriConfig {
  /** Enable callsite capture (file/line info) */
  enableCallsite?: boolean;
  
  /** Enable environment info capture */
  enableEnvInfo?: boolean;
  
  /** Enable state snapshots */
  enableStateSnapshot?: boolean;
  
  /** Enable causal links between events */
  enableCausalLinks?: boolean;
  
  /** Enable metrics collection */
  enableMetrics?: boolean;

  /** Enable automatic console logging */
  enableConsole?: boolean;
  
  /** State selectors for automatic state snapshots */
  stateSelectors?: StateSelector[];
  
  /** Minimum log level ('debug' | 'info' | 'warn' | 'error') */
  logLevel?: LogLevel;
  
  /** Custom log levels */
  customLevels?: CustomLogLevel[];
  
  /** Watcher polling interval in ms (default: 250) */
  pollingInterval?: number;
  
  /** Max events in buffer (default: 1000) */
  maxBufferSize?: number;
  
  /** App version string */
  appVersion?: string;
  
  /** Rate limiting configuration */
  rateLimiting?: RateLimitConfig;
  
  /** Deduplication configuration */
  deduplication?: DeduplicationConfig;
  
  /** Circuit breaker configuration */
  circuitBreaker?: CircuitBreakerConfig;
  
  /** Persistence configuration */
  persistence?: PersistenceConfig;
}
```

---

## WatchHandle

Returned by `watch()` and `when()` methods.

```typescript
interface WatchHandle {
  /** Stop watching */
  dispose(): void;
}
```

---

## SatoriMetrics

Metrics returned by `getMetrics()`.

```typescript
interface SatoriMetrics {
  /** Uptime in milliseconds */
  uptime: number;
  
  /** Event bus metrics */
  bus: {
    totalPublished: number;
    totalDropped: number;
    totalDeduplicated: number;
    bufferSize: number;
    subscriberCount: number;
  };
  
  /** Circuit breaker state (if enabled) */
  circuitBreakerState?: 'closed' | 'open' | 'half-open';
}
```
