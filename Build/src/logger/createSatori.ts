import type { SatoriInstance, SatoriConfig, SatoriLogger, SatoriMetrics } from '../core/types.js';
import { SimpleEventBus } from '../bus/eventBus.js';
import { ScopedLogger } from './createLogger.js';
import { DEFAULT_CONFIG } from '../core/config.js';
import { validateConfig, assertValidConfig } from '../core/validation.js';
import { PersistenceManager } from '../persistence/adapters.js';
import { MetricsCollector } from '../core/metrics.js';

export function createSatori(config: Partial<SatoriConfig> = {}): SatoriInstance {
  // Validate configuration
  const validation = validateConfig(config);
  if (!validation.valid) {
    throw new Error(`Invalid Satori configuration:\n${validation.errors.join('\n')}`);
  }
  
  // Log warnings
  if (validation.warnings.length > 0) {
    console.warn('Satori configuration warnings:', validation.warnings);
  }
  
  const resolvedConfig: SatoriConfig = { 
    ...DEFAULT_CONFIG, 
    ...config,
    // Merge nested configs properly
    rateLimiting: { ...DEFAULT_CONFIG.rateLimiting, ...config.rateLimiting },
    deduplication: { ...DEFAULT_CONFIG.deduplication, ...config.deduplication },
    circuitBreaker: { ...DEFAULT_CONFIG.circuitBreaker, ...config.circuitBreaker }
  };
  
  const bus = new SimpleEventBus({
    maxBufferSize: resolvedConfig.maxBufferSize,
    rateLimiting: resolvedConfig.rateLimiting,
    deduplication: resolvedConfig.deduplication,
    circuitBreaker: resolvedConfig.circuitBreaker,
    enableMetrics: resolvedConfig.enableMetrics
  });

  // Auto-log to console when available (disabled by default in tests)
  const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
  if (!isTestEnv && resolvedConfig.enableConsole !== false && typeof console !== 'undefined') {
    bus.subscribe((entry) => {
      const level = entry.level as string;
      const method = level === 'debug' ? 'log' : level;
      const consoleMethod = (console as unknown as Record<string, (...args: unknown[]) => void>)[method] ?? console.log;
      consoleMethod(`[${entry.scope}] ${entry.message}`, entry);
    });
  }
  
  const rootLogger = new ScopedLogger('root', resolvedConfig, bus);
  const loggers = new Map<string, ScopedLogger>();
  loggers.set('root', rootLogger);
  
  // Set up persistence if configured
  let persistenceManager: PersistenceManager | null = null;
  if (resolvedConfig.persistence?.enabled) {
    persistenceManager = new PersistenceManager(resolvedConfig.persistence);
    
    // Subscribe to bus to persist events
    bus.subscribe((entry) => {
      persistenceManager?.add(entry);
    });
  }
  
  // Metrics for tracking
  const metrics = new MetricsCollector();
  const startTime = Date.now();

  return {
    config: resolvedConfig,
    bus,
    rootLogger,
    
    createLogger(scope: string): SatoriLogger {
      const logger = new ScopedLogger(scope, resolvedConfig, bus);
      loggers.set(scope, logger);
      metrics.setLoggerCount(loggers.size);
      return logger;
    },
    
    getMetrics(): SatoriMetrics {
      // Calculate total watcher count
      let watcherCount = 0;
      for (const logger of loggers.values()) {
        if (!logger.isDisposed()) {
          watcherCount += logger.getWatcherCount();
        }
      }
      metrics.setWatcherCount(watcherCount);
      
      return {
        bus: bus.getMetrics(),
        loggerCount: loggers.size,
        watcherCount,
        circuitState: bus.getCircuitBreaker().getState(),
        uptime: Date.now() - startTime
      };
    },
    
    async flush(): Promise<void> {
      if (persistenceManager) {
        await persistenceManager.flush();
      }
    },
    
    dispose(): void {
      // Dispose all loggers
      for (const logger of loggers.values()) {
        logger.dispose();
      }
      loggers.clear();
      
      // Clear bus
      const buffer = bus.getReplayBuffer?.();
      if (buffer) {
        buffer.length = 0;
      }
      bus.reset();
      
      // Close persistence
      if (persistenceManager) {
        persistenceManager.close().catch(console.error);
      }
    }
  };
}