---
title: "Satori"
description: "Observable event logging library for JavaScript and TypeScript"
---

**Satori** is an observable event logging library for JavaScript/TypeScript. It provides structured logging with advanced features like state watching, causal linking, filtering, rate limiting, and persistence.

::: callout tip
Satori means "awakening" or "understanding" in Japanese: the moment of sudden enlightenment. This library helps you achieve that clarity in your application's behavior.
:::

## Features

::: card Zero Configuration
Get started instantly with sensible defaults. No complex setup required.
:::

::: card State Watching
Automatically detect and log state changes with minimal code.
:::

::: card Causal Linking
Trace cause-and-effect relationships between events.
:::

::: card Advanced Filtering
Query events by level, scope, tags, time range, and more.
:::

## Quick Example

```typescript
import { createSatori } from '@nisoku/satori-log';

const satori = createSatori();
const logger = satori.createLogger('myApp');

// Basic logging
logger.info('User logged in', { 
  tags: ['auth'],
  state: { userId: '123' }
});

// Watch for state changes
const store = { count: 0 };
logger.watch(() => store.count, 'counter');
store.count++;  // Automatically logs the change

// Subscribe to events
satori.bus.subscribe((event) => {
  console.log(`[${event.level}] ${event.message}`);
});
```

## Installation

```bash
npm install satori-log
```

## Next Steps

- [Quick Start](./getting-started/quickstart.md): Get up and running in minutes
- [Configuration](./getting-started/configuration.md): Customize Satori for your needs
- [API Reference](./api/core.md): Complete API documentation
- [Examples](./guide/examples.md): Real-world usage patterns
