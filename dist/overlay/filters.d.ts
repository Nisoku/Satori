import type { LogEntry, LogLevel, CustomLogLevel } from '../core/types.js';
export declare function filterByLevel(events: LogEntry[], minLevel?: LogLevel | string, customLevels?: CustomLogLevel[]): LogEntry[];
export declare function filterByScopes(events: LogEntry[], scopes: string[]): LogEntry[];
export declare function filterByScopePattern(events: LogEntry[], pattern: string | RegExp): LogEntry[];
export declare function filterByTags(events: LogEntry[], tags: string[]): LogEntry[];
export declare function filterByAllTags(events: LogEntry[], tags: string[]): LogEntry[];
export declare function filterByText(events: LogEntry[], searchText?: string): LogEntry[];
export declare function filterByRegex(events: LogEntry[], pattern: string | RegExp): LogEntry[];
export declare function filterByTimeRange(events: LogEntry[], startTime?: number, endTime?: number): LogEntry[];
export declare function filterByRelativeTime(events: LogEntry[], msAgo: number): LogEntry[];
export declare function filterByCause(events: LogEntry[], causeEventId: string): LogEntry[];
export declare function filterByHasCause(events: LogEntry[]): LogEntry[];
export declare function filterByState(events: LogEntry[], predicate: (state: Record<string, unknown> | undefined) => boolean): LogEntry[];
export declare function filterByStateKey(events: LogEntry[], key: string): LogEntry[];
export declare function filterByStateValue(events: LogEntry[], key: string, value: unknown): LogEntry[];
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
export declare function applyAllFilters(events: LogEntry[], filters: FilterOptions | {
    level?: LogLevel;
    scopes: string[];
    tags: string[];
    text?: string;
}): LogEntry[];
/**
 * Group events by a specified field
 */
export declare function groupBy<K extends keyof LogEntry>(events: LogEntry[], field: K): Map<LogEntry[K], LogEntry[]>;
/**
 * Aggregate events by time buckets
 */
export declare function aggregateByTime(events: LogEntry[], bucketSizeMs: number): Map<number, LogEntry[]>;
/**
 * Get event counts by level
 */
export declare function countByLevel(events: LogEntry[]): Record<string, number>;
/**
 * Get event counts by scope
 */
export declare function countByScope(events: LogEntry[]): Record<string, number>;
