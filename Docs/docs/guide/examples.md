---
title: "Examples"
description: "Real-world examples and patterns for using Satori"
---

Real-world examples and patterns for using Satori.

## Table of Contents

- [Basic Logging](#basic-logging)
- [React Integration](#react-integration)
- [Express.js Middleware](#expressjs-middleware)
- [State Management](#state-management)
- [Error Tracking](#error-tracking)
- [User Session Tracking](#user-session-tracking)
- [Performance Monitoring](#performance-monitoring)
- [Debug Mode](#debug-mode)

---

## Basic Logging

### Simple Application Logging

```typescript
import { createSatori } from '@nisoku/satori-log';

const satori = createSatori({ logLevel: 'info' });
const logger = satori.createLogger('app');

function initializeApp() {
  logger.info('Application starting');
  
  try {
    loadConfig();
    logger.info('Configuration loaded');
    
    connectDatabase();
    logger.info('Database connected');
    
    startServer();
    logger.info('Server started', { 
      state: { port: 3000 } 
    });
  } catch (error) {
    logger.error('Failed to initialize', { 
      state: { error: error.message } 
    });
    process.exit(1);
  }
}
```

### Structured Logging with Tags

```typescript
const authLogger = satori.createLogger('auth');

function login(username: string) {
  authLogger.info('Login attempt', { 
    tags: ['login', 'security'],
    state: { username }
  });
  
  if (validateCredentials(username)) {
    authLogger.info('Login successful', { 
      tags: ['login', 'security', 'success'],
      state: { username }
    });
    return true;
  }
  
  authLogger.warn('Login failed', { 
    tags: ['login', 'security', 'failure'],
    state: { username }
  });
  return false;
}
```

---

## React Integration

### Custom Hook for Logging

```typescript
// useSatoriLogger.ts
import { useEffect, useRef, useMemo } from 'react';
import { createSatori, SatoriLogger } from '@nisoku/satori-log';

// Create a single Satori instance
const satori = createSatori({
  logLevel: 'debug',
  persistence: { enabled: true, adapter: 'localStorage' }
});

export function useSatoriLogger(scope: string): SatoriLogger {
  const loggerRef = useRef<SatoriLogger>();
  
  if (!loggerRef.current) {
    loggerRef.current = satori.createLogger(scope);
  }
  
  return loggerRef.current;
}

// Track component lifecycle
export function useComponentLogger(componentName: string) {
  const logger = useSatoriLogger(`ui.${componentName}`);
  
  useEffect(() => {
    logger.debug('Component mounted');
    return () => logger.debug('Component unmounted');
  }, []);
  
  return logger;
}
```

### Usage in Components

```typescript
// UserProfile.tsx
import { useComponentLogger } from './useSatoriLogger';

function UserProfile({ userId }) {
  const logger = useComponentLogger('UserProfile');
  
  const handleEdit = () => {
    logger.info('Edit profile clicked', { 
      tags: ['user-action'],
      state: { userId }
    });
    // ...
  };
  
  return (
    <div>
      <button onClick={handleEdit}>Edit Profile</button>
    </div>
  );
}
```

### Watching React State

```typescript
import { useEffect, useState } from 'react';
import { useSatoriLogger } from './useSatoriLogger';

function ShoppingCart() {
  const [items, setItems] = useState([]);
  const logger = useSatoriLogger('cart');
  
  // Watch cart changes
  useEffect(() => {
    const handle = logger.watch(
      () => items.length,
      'cartItemCount'
    );
    return () => handle.stop();
  }, [items]);
  
  // Watch for empty cart condition
  useEffect(() => {
    const handle = logger.when(
      () => items.length === 0,
      'cartEmpty',
      () => {
        logger.info('Cart is now empty', { tags: ['cart', 'state'] });
      }
    );
    return () => handle.stop();
  }, [items]);
  
  return (/* ... */);
}
```

---

## Express.js Middleware

### Request Logging Middleware

```typescript
import express from 'express';
import { createSatori } from '@nisoku/satori-log';

const satori = createSatori({
  rateLimit: { enabled: true, maxEventsPerSecond: 1000 }
});

const logger = satori.createLogger('http');

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  
  logger.info(`${req.method} ${req.path}`, {
    tags: ['request', 'incoming'],
    state: {
      requestId,
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip
    }
  });
  
  // Capture the request ID for causal linking
  req.satoriRequestId = logger.lastEventId;
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 400 ? 'error' : 'info';
    
    logger.log(level, `${req.method} ${req.path} ${res.statusCode}`, {
      tags: ['request', 'response'],
      cause: req.satoriRequestId,
      state: {
        requestId,
        statusCode: res.statusCode,
        duration
      }
    });
  });
  
  next();
};

const app = express();
app.use(requestLogger);
```

### Error Handling Middleware

```typescript
const errorLogger = satori.createLogger('error');

const errorHandler = (err, req, res, next) => {
  errorLogger.error(err.message, {
    tags: ['error', 'unhandled'],
    cause: req.satoriRequestId,
    state: {
      stack: err.stack,
      path: req.path,
      method: req.method
    }
  });
  
  res.status(500).json({ error: 'Internal Server Error' });
};

app.use(errorHandler);
```

---

## State Management

### Redux Integration

```typescript
// satoriMiddleware.ts
import { createSatori } from '@nisoku/satori-log';

const satori = createSatori();
const logger = satori.createLogger('redux');

export const satoriMiddleware = store => next => action => {
  const prevState = store.getState();
  
  logger.debug('Action dispatched', {
    tags: ['redux', 'action'],
    state: { type: action.type, payload: action.payload }
  });
  
  const result = next(action);
  const nextState = store.getState();
  
  // Log significant state changes
  if (JSON.stringify(prevState) !== JSON.stringify(nextState)) {
    logger.info('State changed', {
      tags: ['redux', 'state-change'],
      cause: logger.lastEventId,
      state: {
        action: action.type,
        // Include only changed parts of state
        changes: computeStateDiff(prevState, nextState)
      }
    });
  }
  
  return result;
};
```

### Zustand Integration

```typescript
import create from 'zustand';
import { createSatori } from '@nisoku/satori-log';

const satori = createSatori();
const logger = satori.createLogger('store');

// Logging middleware for Zustand
const logMiddleware = (config) => (set, get, api) => {
  return config(
    (args) => {
      const prevState = get();
      set(args);
      const nextState = get();
      
      logger.debug('Store updated', {
        tags: ['zustand', 'state-change'],
        state: { prevState, nextState }
      });
    },
    get,
    api
  );
};

const useStore = create(
  logMiddleware((set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
    decrement: () => set((state) => ({ count: state.count - 1 }))
  }))
);
```

---

## Error Tracking

### Global Error Handler

```typescript
const errorLogger = satori.createLogger('errors');

// Browser
window.onerror = (message, source, line, column, error) => {
  errorLogger.error(String(message), {
    tags: ['error', 'uncaught', 'window'],
    state: {
      source,
      line,
      column,
      stack: error?.stack
    }
  });
};

window.onunhandledrejection = (event) => {
  errorLogger.error('Unhandled Promise rejection', {
    tags: ['error', 'promise', 'unhandled'],
    state: {
      reason: event.reason?.message || String(event.reason),
      stack: event.reason?.stack
    }
  });
};

// Node.js
process.on('uncaughtException', (error) => {
  errorLogger.error(error.message, {
    tags: ['error', 'uncaught', 'fatal'],
    state: { stack: error.stack }
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  errorLogger.error('Unhandled Promise rejection', {
    tags: ['error', 'promise', 'unhandled'],
    state: { reason: String(reason) }
  });
});
```

### Error Boundary (React)

```typescript
import { Component, ErrorInfo } from 'react';
import { createSatori } from '@nisoku/satori-log';

const satori = createSatori();
const errorLogger = satori.createLogger('react.error');

class SatoriErrorBoundary extends Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    errorLogger.error(error.message, {
      tags: ['error', 'react', 'boundary'],
      state: {
        stack: error.stack,
        componentStack: errorInfo.componentStack
      }
    });
  }
  
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

---

## User Session Tracking

### Session Logger

```typescript
const sessionLogger = satori.createLogger('session');

class SessionTracker {
  private sessionId: string;
  private userId?: string;
  
  startSession(userId?: string) {
    this.sessionId = generateSessionId();
    this.userId = userId;
    
    sessionLogger.info('Session started', {
      tags: ['session', 'start'],
      state: {
        sessionId: this.sessionId,
        userId,
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`
      }
    });
    
    // Track visibility changes
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    window.addEventListener('beforeunload', this.onUnload);
  }
  
  private onVisibilityChange = () => {
    sessionLogger.info(`Page ${document.hidden ? 'hidden' : 'visible'}`, {
      tags: ['session', 'visibility'],
      state: { sessionId: this.sessionId }
    });
  };
  
  private onUnload = () => {
    sessionLogger.info('Session ending', {
      tags: ['session', 'end'],
      state: { sessionId: this.sessionId }
    });
  };
  
  trackPageView(path: string) {
    sessionLogger.info('Page view', {
      tags: ['session', 'navigation'],
      state: {
        sessionId: this.sessionId,
        path,
        referrer: document.referrer
      }
    });
  }
  
  trackUserAction(action: string, details?: object) {
    sessionLogger.info(action, {
      tags: ['session', 'user-action'],
      state: {
        sessionId: this.sessionId,
        ...details
      }
    });
  }
}

const tracker = new SessionTracker();
tracker.startSession();
```

---

## Performance Monitoring

### Performance Logger

```typescript
const perfLogger = satori.createLogger('performance');

class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  
  mark(name: string) {
    this.marks.set(name, performance.now());
  }
  
  measure(name: string, startMark: string) {
    const startTime = this.marks.get(startMark);
    if (!startTime) return;
    
    const duration = performance.now() - startTime;
    
    perfLogger.info(`${name}: ${duration.toFixed(2)}ms`, {
      tags: ['performance', 'timing'],
      state: {
        name,
        startMark,
        duration
      }
    });
    
    return duration;
  }
  
  measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const mark = `${name}_${Date.now()}`;
    this.mark(mark);
    
    return fn().then(result => {
      this.measure(name, mark);
      return result;
    }).catch(error => {
      this.measure(`${name}_error`, mark);
      throw error;
    });
  }
}

const perf = new PerformanceMonitor();

// Usage
perf.mark('fetch_start');
const data = await fetchData();
perf.measure('api_fetch', 'fetch_start');

// Or with async wrapper
const result = await perf.measureAsync('api_call', () => fetchData());
```

### Resource Timing

```typescript
// Track slow resources
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 1000) {  // Slow resource (>1s)
      perfLogger.warn('Slow resource', {
        tags: ['performance', 'slow', 'resource'],
        state: {
          name: entry.name,
          type: entry.entryType,
          duration: entry.duration,
          size: entry.transferSize
        }
      });
    }
  }
});

observer.observe({ entryTypes: ['resource'] });
```

---

## Debug Mode

### Conditional Debugging

```typescript
const DEBUG = localStorage.getItem('satori_debug') === 'true';

const satori = createSatori({
  logLevel: DEBUG ? 'debug' : 'info',
  persistence: {
    enabled: DEBUG,
    adapter: 'console'
  }
});

// Enable debug mode from console:
// localStorage.setItem('satori_debug', 'true')
// location.reload()
```

### Debug Utilities

```typescript
// Add to window for console access
if (typeof window !== 'undefined') {
  (window as any).satoriDebug = {
    satori,
    getEvents: () => satori.getEvents(),
    getMetrics: () => satori.getMetrics(),
    filterByLevel: (level: string) => 
      satori.getEvents().filter(e => e.level === level),
    filterByScope: (scope: string) => 
      satori.getEvents().filter(e => e.scope.startsWith(scope)),
    exportEvents: () => {
      const blob = new Blob(
        [JSON.stringify(satori.getEvents(), null, 2)],
        { type: 'application/json' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `satori-events-${Date.now()}.json`;
      a.click();
    }
  };
  
  console.log('Satori debug utilities available at window.satoriDebug');
}
```

### Query Events from Console

```typescript
// In browser console:
satoriDebug.getEvents()
satoriDebug.filterByLevel('error')
satoriDebug.filterByScope('auth')
satoriDebug.getMetrics()
satoriDebug.exportEvents()
```
