<!-- markdownlint-disable MD033 MD036 MD041 -->

<div align="left">

<img src="assets/images/satori-logo-light.svg" alt="Satori" width="200">

**Observable Event Logging Library for JavaScript/TypeScript**

[![CI](https://github.com/Nisoku/Satori/actions/workflows/ci.yml/badge.svg)](https://github.com/Nisoku/Satori/actions/workflows/ci.yml)
[![Deploy](https://github.com/Nisoku/Satori/actions/workflows/static.yml/badge.svg)](https://github.com/Nisoku/Satori/actions/workflows/static.yml)
[![npm version](https://img.shields.io/npm/v/@nisoku/satori-log.svg)](https://www.npmjs.com/package/@nisoku/satori-log)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[Documentation](https://nisoku.github.io/Satori/docs/) | [Demo](https://nisoku.github.io/Satori/demo/) | [API Reference](https://nisoku.github.io/Satori/docs/api/)

</div>

---

Satori is a powerful observability library that provides structured logging with advanced features like state watching, causal linking, filtering, rate limiting, and persistence.

## Features

| Feature | Description |
| --------- | ------------- |
| **Structured Logging** | Log events with levels, scopes, tags, and state |
| **State Watching** | Automatically log when values change |
| **Causal Linking** | Track cause-and-effect relationships between events |
| **Tags and Filtering** | Categorize and query events with powerful filters |
| **Rate Limiting** | Protection against log floods with drop/sample/buffer strategies |
| **Deduplication** | Prevent duplicate events within time windows |
| **Circuit Breaker** | Error recovery and protection for watchers |
| **Persistence** | Store events in memory, localStorage, or IndexedDB |
| **Self-Monitoring** | Track metrics about the logging system itself |
| **Multi-Runtime** | Works in browser, Node.js, Deno, Bun, and edge runtimes |

## Quick Start

```typescript
import { createSatori } from '@nisoku/satori-log';

// Create a Satori instance
const satori = createSatori({
  logLevel: 'info',
  rateLimiting: { enabled: true, maxEventsPerSecond: 100 }
});

// Create a scoped logger
const logger = satori.createLogger('myApp');

// Log events
logger.info('Application started');
logger.warn('Config not found, using defaults');
logger.error('Failed to connect', { state: { error: 'timeout' } });

// Watch for changes
const store = { count: 0 };
logger.watch(() => store.count, 'counter');
store.count++;  // Automatically logs the change!

// Subscribe to events
satori.bus.subscribe((event) => {
  console.log(`[${event.level}] ${event.scope}: ${event.message}`);
});
```

## Installation

```bash
npm install @nisoku/satori-log
```

Satori is available on [NPM](https://www.npmjs.com/package/@nisoku/satori-log)!

## Documentation

| Section | Description |
| --------- | ------------- |
| [Quick Start](https://nisoku.github.io/Satori/docs/getting-started/quickstart) | Get up and running in 5 minutes |
| [Configuration](https://nisoku.github.io/Satori/docs/getting-started/configuration) | Complete configuration options |
| [State Watching](https://nisoku.github.io/Satori/docs/guide/watching) | Automatic change detection |
| [Causal Linking](https://nisoku.github.io/Satori/docs/guide/causal) | Event relationship tracking |
| [Filtering](https://nisoku.github.io/Satori/docs/guide/filtering) | Query and filter events |
| [Advanced Features](https://nisoku.github.io/Satori/docs/guide/advanced) | Rate limiting, deduplication, circuit breaker |
| [API Reference](https://nisoku.github.io/Satori/docs/api/) | Complete API documentation |
| [Filter Functions](https://nisoku.github.io/Satori/docs/api/filters) | Filter API reference |
| [Examples](https://nisoku.github.io/Satori/docs/guide/examples) | Real-world usage patterns |

## Demo

Open the live [demo](https://nisoku.github.io/Satori/demo/) in a browser to see Satori in action with an interactive playground.

The demo showcases all major features:

- Logging at different levels
- State watching with counters
- Rate limiting under burst load
- Deduplication of repeated messages
- Causal event chains
- Real-time metrics

## Development

### Install dependencies

```bash
cd Build && npm install
```

### Run tests

```bash
cd Build && npm test
```

### Run tests in watch mode

```bash
cd Build && npm run test:watch
```

### Type check

```bash
cd Build && npm run typecheck
```

### Build

```bash
cd Build && npm run build
```

### Build docs

```bash
cd ../Docs && npm run build
```

## Project Structure

```text
Satori/
  assets/           # Shared icons and images
  Build/            # Source code and build config
    src/            # TypeScript source
  Demo/             # Interactive demo
  Docs/             # Documentation (docmd)
```

## Contributing

We love contributors! Feel free to open up PRs or issues for any ideas or bugs you find!

## License

[MIT](LICENSE)
