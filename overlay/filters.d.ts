import type { LogEntry, LogLevel } from '../core/types.js';
export declare function filterByLevel(events: LogEntry[], minLevel?: LogLevel): LogEntry[];
export declare function filterByScopes(events: LogEntry[], scopes: string[]): LogEntry[];
export declare function filterByTags(events: LogEntry[], tags: string[]): LogEntry[];
export declare function filterByText(events: LogEntry[], searchText?: string): LogEntry[];
export declare function applyAllFilters(events: LogEntry[], filters: {
    level?: LogLevel;
    scopes: string[];
    tags: string[];
    text?: string;
}): LogEntry[];
