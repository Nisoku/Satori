import type { EventBus, LogEntry, LogLevel } from "../core/types.js";
export declare class OverlayBridge {
    private eventBus;
    private state;
    private unsubscribe?;
    constructor(eventBus: EventBus);
    private subscribe;
    getFilteredEvents(): LogEntry[];
    setLevelFilter(level?: LogLevel): void;
    setScopeFilter(scopes: string[]): void;
    setTagFilter(tags: string[]): void;
    setTextFilter(text?: string): void;
    selectEvent(id?: string): void;
    getSelectedEvent(): LogEntry | undefined;
    getEventById(id: string): LogEntry | undefined;
    clearEvents(): void;
    dispose(): void;
    getState(): {
        events: LogEntry[];
        filteredEvents: LogEntry[];
        selectedEventId?: string;
        selectedEvent?: LogEntry;
        filters: {
            level?: LogLevel;
            scopes: string[];
            tags: string[];
            text?: string;
        };
    };
}
