import type { SatoriLogger, WatchSource, WhenPredicate, WhenCallback, WatchHandle, SatoriConfig } from '../core/types.js';

interface WatcherHandle {
  id: string;
  getValue(): any;
  label?: string;
  intervalId?: ReturnType<typeof setInterval>;
}

export class WatcherEngine {
  private watchers = new Map<string, WatcherHandle>();
  private whenHandlers = new Map<string, {
    getValue(): any;
    predicate: WhenPredicate<any>;
    onTrigger: WhenCallback<any>;
    lastValue?: any;
    intervalId: ReturnType<typeof setInterval>;
  }>();

  constructor(
    private logger: SatoriLogger,
    private config: SatoriConfig
  ) {}

  watch<T>(source: WatchSource<T>, label?: string): WatchHandle {
    const id = Math.random().toString(36).substr(2, 9);
    const getValue = typeof source === 'function' ? source : () => source;
    
    let lastValue: T | undefined;
    
    const check = () => {
      try {
        const currentValue = getValue();
        if (currentValue !== lastValue) {
          const changeLabel = label || `watch_${id}`;
          const message = typeof currentValue === 'object' 
            ? `${changeLabel}: state changed`
            : `${changeLabel}: ${lastValue} → ${currentValue}`;
          
          this.logger.info(message, {
            tags: ['watch'],
            state: { 
              [`${changeLabel}_prev`]: lastValue,
              [`${changeLabel}_current`]: currentValue 
            }
          });
          
          lastValue = currentValue;
        }
      } catch (err) {
        this.logger.error(`Watch error for ${label || id}`, {
          tags: ['watch', 'error'],
          state: { error: err instanceof Error ? err.message : String(err) }
        });
      }
    };

    const intervalId = setInterval(check, this.config.pollingInterval);
    
    this.watchers.set(id, {
      id,
      getValue,
      label,
      intervalId
    });

    return {
      dispose: () => {
        if (intervalId) clearInterval(intervalId);
        this.watchers.delete(id);
      }
    };
  }

  when<T>(source: WatchSource<T>, predicate: WhenPredicate<T>, onTrigger: WhenCallback<T>): WatchHandle {
    const id = Math.random().toString(36).substr(2, 9);
    const getValue = typeof source === 'function' ? source : () => source;
    
    let lastValue: T | undefined;
    
    const check = () => {
      try {
        const currentValue = getValue();
        
        if (predicate(lastValue, currentValue)) {
          onTrigger(currentValue, lastValue);
        }
        
        lastValue = currentValue;
      } catch (err) {
        this.logger.error(`When condition error for ${id}`, {
          tags: ['when', 'error'],
          state: { error: err instanceof Error ? err.message : String(err) }
        });
      }
    };

    const intervalId = setInterval(check, this.config.pollingInterval);
    
    this.whenHandlers.set(id, {
      getValue,
      predicate,
      onTrigger,
      lastValue,
      intervalId
    });

    return {
      dispose: () => {
        clearInterval(intervalId);
        this.whenHandlers.delete(id);
      }
    };
  }

  dispose(): void {
    this.watchers.forEach(watcher => {
      if (watcher.intervalId) clearInterval(watcher.intervalId);
    });
    
    this.whenHandlers.forEach(handler => {
      clearInterval(handler.intervalId);
    });
    
    this.watchers.clear();
    this.whenHandlers.clear();
  }
}