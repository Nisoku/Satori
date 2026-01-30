import type { LogEntry, LogLevel } from '../core/types.js';
export declare class OverlayState {
    private events;
    private selectedEventId?;
    private filters;
    addEvent(event: LogEntry): void;
    getAllEvents(): LogEntry[];
    getFilteredEvents(): LogEntry[];
    selectEvent(id?: string): void;
    getSelectedEventId(): string | undefined;
    getSelectedEvent(): LogEntry | undefined;
    getEventById(id: string): LogEntry | undefined;
    setLevelFilter(level?: LogLevel): void;
    getLevelFilter(): LogLevel | undefined;
    setScopeFilter(scopes: string[]): void;
    getScopeFilter(): string[];
    setTagFilter(tags: string[]): void;
    getTagFilter(): string[];
    setTextFilter(text?: string): void;
    getTextFilter(): string | undefined;
    clear(): void;
}
