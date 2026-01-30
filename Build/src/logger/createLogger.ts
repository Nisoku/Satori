import type { SatoriLogger, SatoriConfig, EventBus, LogEntry, LogLevel, LogOptions, WatchSource, WhenPredicate, WhenCallback, WatchHandle } from '../core/types.js';
import { enrichEvent } from '../enrich/enrichEvent.js';
import { updateCausalLink } from '../enrich/causal.js';
import { WatcherEngine } from '../watch/watcherEngine.js';

export class ScopedLogger implements SatoriLogger {
  private inheritedTags: string[] = [];
  private inheritedCause?: string;
  private inheritedCauseEventId?: string;
  private watcherEngine: WatcherEngine;

  constructor(
    public readonly scope: string,
    private config: SatoriConfig,
    private bus: EventBus,
    private lastEventId?: string
  ) {
    this.watcherEngine = new WatcherEngine(this, config);
  }

  event(message: string, options?: LogOptions): void {
    this.log('info', message, options);
  }

  info(message: string, options?: LogOptions): void {
    this.log('info', message, options);
  }

  warn(message: string, options?: LogOptions): void {
    this.log('warn', message, options);
  }

  error(message: string, options?: LogOptions): void {
    this.log('error', message, options);
  }

  debug(message: string, options?: LogOptions): void {
    this.log('debug', message, options);
  }

  tag(...tags: string[]): SatoriLogger {
    const newLogger = new ScopedLogger(this.scope, this.config, this.bus, this.lastEventId);
    newLogger.inheritedTags = [...this.inheritedTags, ...tags];
    return newLogger;
  }

  causedBy(messageOrEvent: string | LogEntry): SatoriLogger {
    const newLogger = new ScopedLogger(this.scope, this.config, this.bus, this.lastEventId);
    
    if (typeof messageOrEvent === 'string') {
      newLogger.inheritedCause = messageOrEvent;
    } else {
      newLogger.inheritedCause = messageOrEvent.message;
      newLogger.inheritedCauseEventId = messageOrEvent.id;
    }
    
    return newLogger;
  }

  watch<T>(source: WatchSource<T>, label?: string): WatchHandle {
    return this.watcherEngine.watch(source, label);
  }

  when<T>(source: WatchSource<T>, predicate: WhenPredicate<T>, onTrigger: WhenCallback<T>): WatchHandle {
    return this.watcherEngine.when(source, predicate, onTrigger);
  }

  private log(level: LogLevel, message: string, options?: LogOptions): void {
    const entry = enrichEvent(
      {
        level,
        scope: this.scope,
        message,
        options,
        inheritedTags: this.inheritedTags,
        inheritedCause: this.inheritedCause,
        inheritedCauseEventId: this.inheritedCauseEventId,
      },
      this.config,
      this.lastEventId
    );

    updateCausalLink(this.scope, entry.id);
    this.lastEventId = entry.id;

    this.bus.publish(entry);
  }
}