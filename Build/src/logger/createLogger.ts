import type {
  SatoriLogger,
  SatoriConfig,
  EventBus,
  LogEntry,
  LogLevel,
  LogOptions,
  WatchSource,
  WhenPredicate,
  WhenCallback,
  WatchHandle,
} from "../core/types.js";
import { enrichEvent } from "../enrich/enrichEvent.js";
import { updateCausalLink } from "../enrich/causal.js";
import { WatcherEngine } from "../watch/watcherEngine.js";

const BUILTIN_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class ScopedLogger implements SatoriLogger {
  private inheritedTags: string[] = [];
  private inheritedCause?: string;
  private inheritedCauseEventId?: string;
  private watcherEngine: WatcherEngine;
  private disposed = false;
  private levelSeverities: Record<string, number>;

  constructor(
    public readonly scope: string,
    private config: SatoriConfig,
    private bus: EventBus,
    private lastEventId?: string,
  ) {
    this.watcherEngine = new WatcherEngine(this, config);

    // Build level severity map including custom levels
    this.levelSeverities = { ...BUILTIN_LEVELS };
    if (config.customLevels) {
      for (const level of config.customLevels) {
        this.levelSeverities[level.name] = level.severity;
      }
    }
  }

  event(message: string, options?: LogOptions): void {
    this.log("info", message, options);
  }

  info(message: string, options?: LogOptions): void {
    this.log("info", message, options);
  }

  warn(message: string, options?: LogOptions): void {
    this.log("warn", message, options);
  }

  error(message: string, options?: LogOptions): void {
    this.log("error", message, options);
  }

  debug(message: string, options?: LogOptions): void {
    this.log("debug", message, options);
  }

  /**
   * Log with any level (built-in or custom)
   */
  log(level: string, message: string, options?: LogOptions): void {
    if (this.disposed) {
      console.warn(
        `Attempted to log on disposed logger (scope: ${this.scope})`,
      );
      return;
    }

    // Check if level is valid
    if (!(level in this.levelSeverities)) {
      console.warn(`Unknown log level: ${level}, defaulting to info`);
      level = "info";
    }

    // Check if level meets minimum threshold
    const minLevel = this.config.logLevel || "info";
    const minSeverity = this.levelSeverities[minLevel] ?? 1;
    const levelSeverity = this.levelSeverities[level] ?? 1;

    if (levelSeverity < minSeverity) {
      return; // Skip logging below minimum level
    }

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
      this.lastEventId,
    );

    // Update causal links with any cause event IDs
    const causeEventIds = this.inheritedCauseEventId
      ? [this.inheritedCauseEventId]
      : undefined;
    updateCausalLink(this.scope, entry.id, causeEventIds);
    this.lastEventId = entry.id;

    this.bus.publish(entry);
  }

  tag(...tags: string[]): SatoriLogger {
    const newLogger = new ScopedLogger(
      this.scope,
      this.config,
      this.bus,
      this.lastEventId,
    );
    newLogger.inheritedTags = [...this.inheritedTags, ...tags];
    newLogger.inheritedCause = this.inheritedCause;
    newLogger.inheritedCauseEventId = this.inheritedCauseEventId;
    return newLogger;
  }

  causedBy(messageOrEvent: string | LogEntry): SatoriLogger {
    const newLogger = new ScopedLogger(
      this.scope,
      this.config,
      this.bus,
      this.lastEventId,
    );
    newLogger.inheritedTags = [...this.inheritedTags];

    if (typeof messageOrEvent === "string") {
      newLogger.inheritedCause = messageOrEvent;
    } else {
      newLogger.inheritedCause = messageOrEvent.message;
      newLogger.inheritedCauseEventId = messageOrEvent.id;
    }

    return newLogger;
  }

  watch<T>(source: WatchSource<T>, label?: string): WatchHandle {
    if (this.disposed) {
      throw new Error(
        `Cannot create watch on disposed logger (scope: ${this.scope})`,
      );
    }
    return this.watcherEngine.watch(source, label);
  }

  when<T>(
    source: WatchSource<T>,
    predicate: WhenPredicate<T>,
    onTrigger: WhenCallback<T>,
  ): WatchHandle {
    if (this.disposed) {
      throw new Error(
        `Cannot create when handler on disposed logger (scope: ${this.scope})`,
      );
    }
    return this.watcherEngine.when(source, predicate, onTrigger);
  }

  /**
   * Get the number of active watchers on this logger
   */
  getWatcherCount(): number {
    return this.watcherEngine.getWatcherCount();
  }

  /**
   * Dispose this logger and all its watchers
   */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.watcherEngine.dispose();
  }

  /**
   * Check if this logger has been disposed
   */
  isDisposed(): boolean {
    return this.disposed;
  }
}
