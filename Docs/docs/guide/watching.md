---
title: "State Watching"
description: "Automatically track and log state changes"
---

One of Satori's most powerful features is the ability to automatically detect and log state changes.

## Basic Watching

Use `watch()` to monitor a value and automatically log when it changes:

```typescript
const store = { count: 0 };

// Watch the count value
const handle = logger.watch(() => store.count, 'counter');

// Changes are automatically logged
store.count = 1;  // Logs: "counter: 0 -> 1"
store.count = 5;  // Logs: "counter: 1 -> 5"

// Stop watching when done
handle.dispose();
```

## How It Works

Satori polls the watched value at a configurable interval (default: 250ms). When it detects a change using deep equality comparison, it automatically creates a log entry.

```typescript
const satori = createSatori({
  pollingInterval: 100  // Check every 100ms
});
```

## Watching Objects

Watch complex objects. Satori uses deep equality:

```typescript
const user = { name: 'Alice', settings: { theme: 'dark' } };

logger.watch(() => user, 'user');

// Deep changes are detected
user.settings.theme = 'light';  // Logs the change
```

## Watching Computed Values

Watch derived or computed values:

```typescript
const items = [1, 2, 3, 4, 5];

// Watch the sum
logger.watch(() => items.reduce((a, b) => a + b, 0), 'total');

// Watch the length
logger.watch(() => items.length, 'itemCount');

items.push(6);  // Both watchers will log
```

## Conditional Watching with `when()`

Use `when()` to watch for a condition and trigger a callback:

```typescript
let temperature = 20;

// Trigger when temperature exceeds threshold
logger.when(
  () => temperature,
  (prev, current) => current > 30,
  () => {
    sendAlert('Temperature too high!');
  }
);

temperature = 35;  // Triggers the callback
```

## Multiple Watchers

Create multiple watchers for different values:

```typescript
const state = {
  user: null,
  cart: [],
  notifications: 0
};

// Watch each independently
logger.watch(() => state.user, 'user');
logger.watch(() => state.cart.length, 'cartSize');
logger.watch(() => state.notifications, 'notifications');
```

## Watcher Handles

Each watcher returns a handle for control:

```typescript
const handle = logger.watch(() => value, 'myValue');

// Stop this specific watcher
handle.dispose();
```

## Disposing All Watchers

Dispose the logger to stop all its watchers:

```typescript
const logger = satori.createLogger('app');

logger.watch(() => a, 'a');
logger.watch(() => b, 'b');
logger.watch(() => c, 'c');

// Stop all watchers for this logger
logger.dispose();
```

Or dispose the entire Satori instance:

```typescript
// Stop everything
satori.dispose();
```

## Deep Equality

Satori's watcher uses sophisticated deep equality that handles:

- Primitive values
- Objects and nested objects
- Arrays (including sparse arrays)
- `Map` and `Set`
- `Date` and `RegExp`
- `NaN` values (NaN equals NaN)
- Circular references (safe handling)

```typescript
// All of these are properly compared
logger.watch(() => new Map([['a', 1]]), 'map');
logger.watch(() => new Set([1, 2, 3]), 'set');
logger.watch(() => ({ nested: { deep: { value: 1 } } }), 'nested');
```

## Performance Considerations

::: callout info
**Polling Interval**: Lower intervals mean faster detection but higher CPU usage. The default 250ms is a good balance.
:::

```typescript
// For real-time UI updates
const satori = createSatori({ pollingInterval: 50 });

// For background monitoring  
const satori = createSatori({ pollingInterval: 1000 });
```

## Error Handling

If a watcher throws an error, Satori handles it gracefully:

```typescript
logger.watch(() => {
  if (Math.random() > 0.9) throw new Error('Random failure');
  return value;
}, 'flaky');

// Errors are logged but don't crash the watcher
// After 50 consecutive errors, the watcher auto-disposes
```

## Next Steps

- [Causal Linking](/Satori/docs/guide/causal): Connect related events
- [Filtering Events](/Satori/docs/guide/filtering): Query and filter events
- [Examples](/Satori/docs/guide/examples): Real-world patterns
