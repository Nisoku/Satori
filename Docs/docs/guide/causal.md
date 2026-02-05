---
title: "Causal Linking"
description: "Trace cause-and-effect relationships between events"
---

Satori allows you to link related events to trace cause-and-effect relationships, making it easy to understand event chains and debug complex flows.

## Basic Causal Linking

Use the `cause` option to link an event to a previous event:

```typescript
logger.info('User clicked submit');

// Link to the previous event
logger.info('Form validation started', { 
  cause: logger.lastEventId 
});

logger.info('API request sent', { 
  cause: logger.lastEventId 
});
```

## Event Chains

Build chains of related events:

```typescript
// Start of chain
logger.info('Order placed', { tags: ['order'] });
const orderId = logger.lastEventId;

// Payment processing (caused by order)
logger.info('Payment initiated', { cause: orderId });
const paymentId = logger.lastEventId;

// Parallel effects from payment
logger.info('Inventory updated', { cause: paymentId });
logger.info('Email sent', { cause: paymentId });
logger.info('Analytics tracked', { cause: paymentId });
```

## The Causal Graph

Satori maintains a causal graph for querying relationships:

```typescript
import { CausalGraph } from '@nisoku/satori-log';

const graph = new CausalGraph();

// Add events with causes
graph.addEvent('evt_1', 'auth');
graph.addEvent('evt_2', 'auth', ['evt_1']);  // evt_1 caused evt_2
graph.addEvent('evt_3', 'auth', ['evt_2']);
graph.addEvent('evt_4', 'auth', ['evt_2']);  // evt_2 caused both evt_3 and evt_4

// Query relationships
graph.getCauses('evt_3');      // ['evt_2']
graph.getEffects('evt_2');     // ['evt_3', 'evt_4']
graph.getCausalChain('evt_1'); // ['evt_1', 'evt_2', 'evt_3', 'evt_4']

// Check if events are related
graph.areCausallyRelated('evt_1', 'evt_4');  // true
```

## Real-World Example: Request Tracing

```typescript
const apiLogger = satori.createLogger('api');

async function handleRequest(req, res) {
  // Log request start
  apiLogger.info('Request received', {
    tags: ['request'],
    state: { method: req.method, path: req.path }
  });
  const requestId = apiLogger.lastEventId;
  
  // Authentication (caused by request)
  apiLogger.info('Authenticating user', { cause: requestId });
  const user = await authenticate(req);
  apiLogger.info('User authenticated', { 
    cause: apiLogger.lastEventId,
    state: { userId: user.id }
  });
  
  // Business logic (caused by authentication)
  const authId = apiLogger.lastEventId;
  apiLogger.info('Processing business logic', { cause: authId });
  const result = await processRequest(req, user);
  
  // Response (caused by processing)
  apiLogger.info('Sending response', { 
    cause: apiLogger.lastEventId,
    state: { status: 200 }
  });
  
  res.json(result);
}
```

## Querying Causal Chains

Find all events in a causal chain:

```typescript
const chain = graph.getCausalChain('evt_1');
// Returns: ['evt_1', 'evt_2', 'evt_3', 'evt_4']

// Filter to find root causes of errors
const errorEvent = events.find(e => e.level === 'error');
const rootCause = graph.getCauses(errorEvent.id)[0];
```

## Automatic Causal Linking

Satori can automatically link events within the same scope:

```typescript
const logger = satori.createLogger('auth');

// These are automatically linked within the scope
logger.info('Login started');
logger.info('Credentials validated');  // Auto-linked to previous
logger.info('Session created');        // Auto-linked to previous
```

## Pruning Old Events

Keep the causal graph manageable:

```typescript
// Remove events older than 5 minutes
graph.prune(5 * 60 * 1000);
```

## Visualizing Causal Relationships

Export the graph for visualization:

```typescript
const events = satori.getEvents();
const graph = buildCausalGraph(events);

// Export as DOT format for Graphviz
const dot = exportToDot(graph);
console.log(dot);
```

## Next Steps

- [Filtering Events](./filtering): Query events by various criteria
- [Advanced Features](./advanced): Circuit breakers, persistence
- [Examples](./examples): More real-world patterns
