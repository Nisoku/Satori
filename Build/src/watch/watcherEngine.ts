import type { SatoriLogger, WatchSource, WhenPredicate, WhenCallback, WatchHandle, SatoriConfig } from '../core/types.js';
import { deepEqual, deepClone } from '../core/utils/deepEqual.js';
import { CircuitBreaker } from '../bus/circuitBreaker.js';
import { DEFAULT_CIRCUIT_BREAKER_CONFIG } from '../core/config.js';

interface WatcherHandle {
  id: string;
  getValue(): unknown;
  label?: string;
  intervalId?: ReturnType<typeof setInterval>;
  lastValue?: unknown;
  errorCount: number;
  disposed: boolean;
}

interface WhenHandler {
  id: string;
  getValue(): unknown;
  predicate: WhenPredicate<unknown>;
  onTrigger: WhenCallback<unknown>;
  lastValue?: unknown;
  intervalId: ReturnType<typeof setInterval>;
  errorCount: number;
  disposed: boolean;
}

export class WatcherEngine {
  private watchers = new Map<string, WatcherHandle>();
  private whenHandlers = new Map<string, WhenHandler>();
  private circuitBreaker: CircuitBreaker;
  private disposed = false;

  constructor(
    private logger: SatoriLogger,
    private config: SatoriConfig
  ) {
    this.circuitBreaker = new CircuitBreaker({
      ...DEFAULT_CIRCUIT_BREAKER_CONFIG,
      enabled: config.circuitBreaker?.enabled ?? false,
      ...config.circuitBreaker
    }, {
      onOpen: () => {
        this.logger.warn('WatcherEngine circuit breaker opened: too many errors', {
          tags: ['watcher', 'circuit-breaker']
        });
      },
      onClose: () => {
        this.logger.info('WatcherEngine circuit breaker closed: recovered', {
          tags: ['watcher', 'circuit-breaker']
        });
      }
    });
  }

  watch<T>(source: WatchSource<T>, label?: string): WatchHandle {
    if (this.disposed) {
      throw new Error('WatcherEngine has been disposed');
    }

    const id = this.generateId();
    const getValue = typeof source === 'function' ? source : () => source;
    
    const handle: WatcherHandle = {
      id,
      getValue,
      label,
      lastValue: undefined,
      errorCount: 0,
      disposed: false
    };
    
    const check = () => {
      if (handle.disposed || this.disposed) return;
      
      try {
        this.circuitBreaker.executeSync(() => {
          const currentValue = getValue();
          
          // Use deep equality for proper object comparison
          if (!deepEqual(currentValue, handle.lastValue)) {
            const changeLabel = label || `watch_${id}`;
            
            // Create descriptive message
            let message: string;
            if (typeof currentValue === 'object' && currentValue !== null) {
              message = `${changeLabel}: state changed`;
            } else {
              const prevStr = this.formatValue(handle.lastValue);
              const currStr = this.formatValue(currentValue);
              message = `${changeLabel}: ${prevStr} -> ${currStr}`;
            }
            
            this.logger.info(message, {
              tags: ['watch'],
              state: { 
                [`${changeLabel}_prev`]: deepClone(handle.lastValue),
                [`${changeLabel}_current`]: deepClone(currentValue)
              }
            });
            
            // Deep clone to prevent reference issues
            handle.lastValue = deepClone(currentValue);
          }
          
          // Reset error count on success
          handle.errorCount = 0;
        });
      } catch (err) {
        handle.errorCount++;
        
        // Only log errors occasionally to prevent spam
        if (handle.errorCount <= 3 || handle.errorCount % 10 === 0) {
          this.logger.error(`Watch error for ${label || id} (count: ${handle.errorCount})`, {
            tags: ['watch', 'error'],
            state: { error: err instanceof Error ? err.message : String(err) }
          });
        }
        
        // Auto-dispose after too many consecutive errors
        if (handle.errorCount >= 50) {
          this.logger.error(`Watch ${label || id} disposed due to repeated errors`, {
            tags: ['watch', 'error', 'auto-disposed']
          });
          this.disposeWatcher(id);
        }
      }
    };

    // Initial check
    check();
    
    const intervalId = setInterval(check, this.config.pollingInterval || 250);
    handle.intervalId = intervalId;
    
    this.watchers.set(id, handle);

    return {
      dispose: () => this.disposeWatcher(id)
    };
  }

  when<T>(source: WatchSource<T>, predicate: WhenPredicate<T>, onTrigger: WhenCallback<T>): WatchHandle {
    if (this.disposed) {
      throw new Error('WatcherEngine has been disposed');
    }

    const id = this.generateId();
    const getValue = typeof source === 'function' ? source : () => source;
    
    const handler: WhenHandler = {
      id,
      getValue,
      predicate: predicate as WhenPredicate<unknown>,
      onTrigger: onTrigger as WhenCallback<unknown>,
      lastValue: undefined,
      intervalId: null as unknown as ReturnType<typeof setInterval>,
      errorCount: 0,
      disposed: false
    };
    
    const check = () => {
      if (handler.disposed || this.disposed) return;
      
      try {
        this.circuitBreaker.executeSync(() => {
          const currentValue = getValue();
          
          // Use the predicate with deep-cloned values
          const prevClone = handler.lastValue !== undefined ? deepClone(handler.lastValue) : undefined;
          const currClone = deepClone(currentValue);
          
          if (predicate(prevClone as T | undefined, currClone as T)) {
            onTrigger(currClone as T, prevClone as T | undefined);
          }
          
          handler.lastValue = currClone;
          handler.errorCount = 0;
        });
      } catch (err) {
        handler.errorCount++;
        
        if (handler.errorCount <= 3 || handler.errorCount % 10 === 0) {
          this.logger.error(`When condition error for ${id} (count: ${handler.errorCount})`, {
            tags: ['when', 'error'],
            state: { error: err instanceof Error ? err.message : String(err) }
          });
        }
        
        if (handler.errorCount >= 50) {
          this.logger.error(`When handler ${id} disposed due to repeated errors`, {
            tags: ['when', 'error', 'auto-disposed']
          });
          this.disposeWhenHandler(id);
        }
      }
    };

    const intervalId = setInterval(check, this.config.pollingInterval || 250);
    handler.intervalId = intervalId;
    
    this.whenHandlers.set(id, handler);

    return {
      dispose: () => this.disposeWhenHandler(id)
    };
  }

  private disposeWatcher(id: string): void {
    const watcher = this.watchers.get(id);
    if (watcher) {
      watcher.disposed = true;
      if (watcher.intervalId) {
        clearInterval(watcher.intervalId);
      }
      this.watchers.delete(id);
    }
  }

  private disposeWhenHandler(id: string): void {
    const handler = this.whenHandlers.get(id);
    if (handler) {
      handler.disposed = true;
      if (handler.intervalId) {
        clearInterval(handler.intervalId);
      }
      this.whenHandlers.delete(id);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }

  private formatValue(value: unknown): string {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (typeof value === 'object') return `Object(${Object.keys(value).length} keys)`;
    return String(value);
  }

  /**
   * Get the number of active watchers
   */
  getWatcherCount(): number {
    return this.watchers.size + this.whenHandlers.size;
  }

  /**
   * Get circuit breaker state
   */
  getCircuitState() {
    return this.circuitBreaker.getState();
  }

  /**
   * Dispose all watchers and clean up
   */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    
    this.watchers.forEach(watcher => {
      watcher.disposed = true;
      if (watcher.intervalId) {
        clearInterval(watcher.intervalId);
      }
    });
    
    this.whenHandlers.forEach(handler => {
      handler.disposed = true;
      if (handler.intervalId) {
        clearInterval(handler.intervalId);
      }
    });
    
    this.watchers.clear();
    this.whenHandlers.clear();
  }

  /**
   * Check if the engine has been disposed
   */
  isDisposed(): boolean {
    return this.disposed;
  }
}