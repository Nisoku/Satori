import type { LogEntry, LogLevel, CustomLogLevel } from "../core/types.js";

const BUILTIN_LEVELS: Record<string, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export function filterByLevel(
  events: LogEntry[],
  minLevel?: LogLevel | string,
  customLevels?: CustomLogLevel[],
): LogEntry[] {
  if (!minLevel) return events;

  // Build combined level map
  const levels: Record<string, number> = { ...BUILTIN_LEVELS };
  if (customLevels) {
    for (const level of customLevels) {
      levels[level.name] = level.severity;
    }
  }

  const minSeverity = levels[minLevel] ?? 1;
  return events.filter((event) => (levels[event.level] ?? 1) >= minSeverity);
}

export function filterByScopes(
  events: LogEntry[],
  scopes: string[],
): LogEntry[] {
  if (scopes.length === 0) return events;
  return events.filter((event) => scopes.includes(event.scope));
}

export function filterByScopePattern(
  events: LogEntry[],
  pattern: string | RegExp,
): LogEntry[] {
  const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;
  return events.filter((event) => regex.test(event.scope));
}

export function filterByTags(events: LogEntry[], tags: string[]): LogEntry[] {
  if (tags.length === 0) return events;
  return events.filter((event) => tags.some((tag) => event.tags.includes(tag)));
}

export function filterByAllTags(
  events: LogEntry[],
  tags: string[],
): LogEntry[] {
  if (tags.length === 0) return events;
  return events.filter((event) =>
    tags.every((tag) => event.tags.includes(tag)),
  );
}

export function filterByText(
  events: LogEntry[],
  searchText?: string,
): LogEntry[] {
  if (!searchText || searchText.trim() === "") return events;

  const term = searchText.toLowerCase();
  return events.filter(
    (event) =>
      event.message.toLowerCase().includes(term) ||
      event.scope.toLowerCase().includes(term) ||
      event.tags.some((tag) => tag.toLowerCase().includes(term)),
  );
}

export function filterByRegex(
  events: LogEntry[],
  pattern: string | RegExp,
): LogEntry[] {
  const regex =
    typeof pattern === "string" ? new RegExp(pattern, "i") : pattern;
  return events.filter(
    (event) =>
      regex.test(event.message) ||
      regex.test(event.scope) ||
      event.tags.some((tag) => regex.test(tag)),
  );
}

export function filterByTimeRange(
  events: LogEntry[],
  startTime?: number,
  endTime?: number,
): LogEntry[] {
  return events.filter((event) => {
    if (startTime && event.timestamp < startTime) return false;
    if (endTime && event.timestamp > endTime) return false;
    return true;
  });
}

export function filterByRelativeTime(
  events: LogEntry[],
  msAgo: number,
): LogEntry[] {
  const cutoff = Date.now() - msAgo;
  return events.filter((event) => event.timestamp >= cutoff);
}

export function filterByCause(
  events: LogEntry[],
  causeEventId: string,
): LogEntry[] {
  return events.filter((event) => event.causeEventId === causeEventId);
}

export function filterByHasCause(events: LogEntry[]): LogEntry[] {
  return events.filter((event) => event.causeEventId !== undefined);
}

export function filterByState(
  events: LogEntry[],
  predicate: (state: Record<string, unknown> | undefined) => boolean,
): LogEntry[] {
  return events.filter((event) => predicate(event.state));
}

export function filterByStateKey(events: LogEntry[], key: string): LogEntry[] {
  return events.filter((event) => event.state && key in event.state);
}

export function filterByStateValue(
  events: LogEntry[],
  key: string,
  value: unknown,
): LogEntry[] {
  return events.filter((event) => event.state && event.state[key] === value);
}

export interface FilterOptions {
  level?: LogLevel | string;
  scopes?: string[];
  scopePattern?: string | RegExp;
  tags?: string[];
  allTags?: string[];
  text?: string;
  regex?: string | RegExp;
  startTime?: number;
  endTime?: number;
  relativeTime?: number;
  causeEventId?: string;
  hasCause?: boolean;
  stateKey?: string;
  statePredicate?: (state: Record<string, unknown> | undefined) => boolean;
  customLevels?: CustomLogLevel[];
}

export function applyAllFilters(
  events: LogEntry[],
  filters:
    | FilterOptions
    | {
        level?: LogLevel;
        scopes: string[];
        tags: string[];
        text?: string;
      },
): LogEntry[] {
  let filtered = events;

  // Level filter
  if ("level" in filters && filters.level) {
    filtered = filterByLevel(
      filtered,
      filters.level,
      (filters as FilterOptions).customLevels,
    );
  }

  // Scope filters
  if ("scopes" in filters && filters.scopes && filters.scopes.length > 0) {
    filtered = filterByScopes(filtered, filters.scopes);
  }
  if ("scopePattern" in filters && (filters as FilterOptions).scopePattern) {
    filtered = filterByScopePattern(
      filtered,
      (filters as FilterOptions).scopePattern!,
    );
  }

  // Tag filters
  if ("tags" in filters && filters.tags && filters.tags.length > 0) {
    filtered = filterByTags(filtered, filters.tags);
  }
  if (
    "allTags" in filters &&
    (filters as FilterOptions).allTags &&
    (filters as FilterOptions).allTags!.length > 0
  ) {
    filtered = filterByAllTags(filtered, (filters as FilterOptions).allTags!);
  }

  // Text/Regex filters
  if ("text" in filters && filters.text) {
    filtered = filterByText(filtered, filters.text);
  }
  if ("regex" in filters && (filters as FilterOptions).regex) {
    filtered = filterByRegex(filtered, (filters as FilterOptions).regex!);
  }

  // Time filters
  const opts = filters as FilterOptions;
  if (opts.startTime || opts.endTime) {
    filtered = filterByTimeRange(filtered, opts.startTime, opts.endTime);
  }
  if (opts.relativeTime) {
    filtered = filterByRelativeTime(filtered, opts.relativeTime);
  }

  // Causal filters
  if (opts.causeEventId) {
    filtered = filterByCause(filtered, opts.causeEventId);
  }
  if (opts.hasCause) {
    filtered = filterByHasCause(filtered);
  }

  // State filters
  if (opts.stateKey) {
    filtered = filterByStateKey(filtered, opts.stateKey);
  }
  if (opts.statePredicate) {
    filtered = filterByState(filtered, opts.statePredicate);
  }

  return filtered;
}

/**
 * Group events by a specified field
 */
export function groupBy<K extends keyof LogEntry>(
  events: LogEntry[],
  field: K,
): Map<LogEntry[K], LogEntry[]> {
  const groups = new Map<LogEntry[K], LogEntry[]>();

  for (const event of events) {
    const key = event[field];
    const existing = groups.get(key) || [];
    existing.push(event);
    groups.set(key, existing);
  }

  return groups;
}

/**
 * Aggregate events by time buckets
 */
export function aggregateByTime(
  events: LogEntry[],
  bucketSizeMs: number,
): Map<number, LogEntry[]> {
  const buckets = new Map<number, LogEntry[]>();
  if (events.length === 0) {
    return buckets;
  }

  const base = Math.min(...events.map((e) => e.timestamp));

  for (const event of events) {
    const bucket =
      Math.floor((event.timestamp - base) / bucketSizeMs) * bucketSizeMs + base;
    const existing = buckets.get(bucket) || [];
    existing.push(event);
    buckets.set(bucket, existing);
  }

  return buckets;
}

/**
 * Get event counts by level
 */
export function countByLevel(events: LogEntry[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const event of events) {
    counts[event.level] = (counts[event.level] || 0) + 1;
  }

  return counts;
}

/**
 * Get event counts by scope
 */
export function countByScope(events: LogEntry[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const event of events) {
    counts[event.scope] = (counts[event.scope] || 0) + 1;
  }

  return counts;
}
