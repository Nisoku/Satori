import type { LogEntry, LogLevel } from '../core/types.js';

export function filterByLevel(events: LogEntry[], minLevel?: LogLevel): LogEntry[] {
  if (!minLevel) return events;
  
  const levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };
  
  const minSeverity = levels[minLevel];
  return events.filter(event => levels[event.level] >= minSeverity);
}

export function filterByScopes(events: LogEntry[], scopes: string[]): LogEntry[] {
  if (scopes.length === 0) return events;
  return events.filter(event => scopes.includes(event.scope));
}

export function filterByTags(events: LogEntry[], tags: string[]): LogEntry[] {
  if (tags.length === 0) return events;
  return events.filter(event => tags.some(tag => event.tags.includes(tag)));
}

export function filterByText(events: LogEntry[], searchText?: string): LogEntry[] {
  if (!searchText || searchText.trim() === '') return events;
  
  const term = searchText.toLowerCase();
  return events.filter(event => 
    event.message.toLowerCase().includes(term) ||
    event.scope.toLowerCase().includes(term) ||
    event.tags.some(tag => tag.toLowerCase().includes(term))
  );
}

export function applyAllFilters(
  events: LogEntry[],
  filters: {
    level?: LogLevel;
    scopes: string[];
    tags: string[];
    text?: string;
  }
): LogEntry[] {
  let filtered = events;
  
  filtered = filterByLevel(filtered, filters.level);
  filtered = filterByScopes(filtered, filters.scopes);
  filtered = filterByTags(filtered, filters.tags);
  filtered = filterByText(filtered, filters.text);
  
  return filtered;
}