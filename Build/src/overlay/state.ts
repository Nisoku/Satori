import type { LogEntry, LogLevel } from "../core/types.js";
import { applyAllFilters } from "./filters.js";

export class OverlayState {
  private events: LogEntry[] = [];
  private selectedEventId?: string;
  private filters = {
    level: undefined as LogLevel | undefined,
    scopes: [] as string[],
    tags: [] as string[],
    text: undefined as string | undefined,
  };

  addEvent(event: LogEntry): void {
    this.events.push(event);
  }

  getAllEvents(): LogEntry[] {
    return [...this.events];
  }

  getFilteredEvents(): LogEntry[] {
    return applyAllFilters(this.events, this.filters);
  }

  selectEvent(id?: string): void {
    this.selectedEventId = id;
  }

  getSelectedEventId(): string | undefined {
    return this.selectedEventId;
  }

  getSelectedEvent(): LogEntry | undefined {
    if (!this.selectedEventId) return undefined;
    return this.events.find((event) => event.id === this.selectedEventId);
  }

  getEventById(id: string): LogEntry | undefined {
    return this.events.find((event) => event.id === id);
  }

  setLevelFilter(level?: LogLevel): void {
    this.filters.level = level;
  }

  getLevelFilter(): LogLevel | undefined {
    return this.filters.level;
  }

  setScopeFilter(scopes: string[]): void {
    this.filters.scopes = [...scopes];
  }

  getScopeFilter(): string[] {
    return [...this.filters.scopes];
  }

  setTagFilter(tags: string[]): void {
    this.filters.tags = [...tags];
  }

  getTagFilter(): string[] {
    return [...this.filters.tags];
  }

  setTextFilter(text?: string): void {
    this.filters.text = text;
  }

  getTextFilter(): string | undefined {
    return this.filters.text;
  }

  clear(): void {
    this.events.length = 0;
    this.selectedEventId = undefined;
    this.filters = {
      level: undefined,
      scopes: [],
      tags: [],
      text: undefined,
    };
  }
}
