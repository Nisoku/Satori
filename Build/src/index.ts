export { createSatori } from './logger/createSatori.js';
export { ScopedLogger } from './logger/scopedLogger.js';
export { SimpleEventBus } from './bus/eventBus.js';
export { OverlayBridge } from './overlay/bridge.js';
export { OverlayState } from './overlay/state.js';
export { WatcherEngine } from './watch/watcherEngine.js';

export type {
  SatoriInstance,
  SatoriConfig,
  SatoriLogger,
  LogEntry,
  LogLevel,
  LogOptions,
  EventBus,
  WatchSource,
  WhenPredicate,
  WhenCallback,
  WatchHandle,
  Middleware,
  EventSubscriber
} from './core/types.js';

export { DEFAULT_CONFIG } from './core/config.js';
export { generateId } from './core/utils/ids.js';
export { extractCallsite } from './core/utils/stacktrace.js';
export { now, formatTimestamp } from './core/utils/time.js';

export { 
  createLevelFilter,
  createTagFilter,
  createScopeFilter,
  createTextFilter
} from './bus/middleware.js';

export {
  filterByLevel,
  filterByScopes,
  filterByTags,
  filterByText,
  applyAllFilters
} from './overlay/filters.js';