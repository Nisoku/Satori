---
title: "Quick Start"
description: "Get started with Satori in minutes"
---

This guide will get you up and running with Satori in just a few minutes.

## Installation

```bash
npm install @nisoku/satori-log
```

Or with yarn:

```bash
yarn add @nisoku/satori-log
```

Satori is available on [NPM](https://www.npmjs.com/package/@nisoku/satori-log)!

## Basic Usage

### 1. Create a Satori Instance

```typescript
import { createSatori } from '@nisoku/satori-log';

const satori = createSatori();
```

### 2. Create a Logger

Loggers are namespaced with scopes to organize your events:

```typescript
const logger = satori.createLogger('myApp');
```

### 3. Log Events

```typescript
logger.debug('Debug information');
logger.info('User action completed');
logger.warn('Potential issue detected');
logger.error('An error occurred');
```

### 4. Add Context

Include tags and state for richer events:

```typescript
logger.info('User logged in', {
  tags: ['auth', 'security'],
  state: { userId: '123', role: 'admin' }
});
```

### 5. Subscribe to Events

```typescript
const unsubscribe = satori.bus.subscribe((event) => {
  console.log(`[${event.level}] ${event.scope}: ${event.message}`);
  
  // Send to your analytics, monitoring, or logging service
  sendToServer(event);
});

// Later: stop subscribing
unsubscribe();
```

### 6. Clean Up

```typescript
satori.dispose();
```

## Complete Example

```typescript
import { createSatori } from '@nisoku/satori-log';

// Initialize
const satori = createSatori({
  logLevel: 'debug',
  maxBufferSize: 500
});

// Create scoped loggers
const authLogger = satori.createLogger('auth');
const apiLogger = satori.createLogger('api');

// Subscribe to events
const unsubscribe = satori.bus.subscribe((event) => {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${event.level}] ${event.scope}: ${event.message}`);
  }
  
  // Send errors to monitoring
  if (event.level === 'error') {
    sendToErrorTracking(event);
  }
});

// Use in your application
function login(username: string) {
  authLogger.info('Login attempt', { state: { username } });
  
  try {
    const user = authenticate(username);
    authLogger.info('Login successful', { 
      tags: ['success'],
      state: { userId: user.id }
    });
    return user;
  } catch (error) {
    authLogger.error('Login failed', { 
      tags: ['failure'],
      state: { username, error: error.message }
    });
    throw error;
  }
}

// Clean up on exit
process.on('exit', () => satori.dispose());
```

## Next Steps

- [Configuration](./configuration): Customize logging behavior
- [State Watching](../guide/watching): Automatically track state changes
- [API Reference](../api/core): Complete API documentation
