import type { EventBus, LogEntry, LogLevel } from '../core/types.js';
import { OverlayState } from './overlayState.js';

export class OverlayBridge {
  private state = new OverlayState();
  private unsubscribe?: () => void;

  constructor(private eventBus: EventBus) {
    this.subscribe();
  }

  private subscribe(): void {
    this.unsubscribe = this.eventBus.subscribe((entry) => {
      this.state.addEvent(entry);
    });
  }

  getFilteredEvents(): LogEntry[] {
    return this.state.getFilteredEvents();
  }

  setLevelFilter(level?: LogLevel): void {
    this.state.setLevelFilter(level);
  }

  setScopeFilter(scopes: string[]): void {
    this.state.setScopeFilter(scopes);
  }

  setTagFilter(tags: string[]): void {
    this.state.setTagFilter(tags);
  }

  setTextFilter(text?: string): void {
    this.state.setTextFilter(text);
  }

  selectEvent(id?: string): void {
    this.state.selectEvent(id);
  }

  getSelectedEvent(): LogEntry | undefined {
    return this.state.getSelectedEvent();
  }

  getEventById(id: string): LogEntry | undefined {
    return this.state.getEventById(id);
  }

  clearEvents(): void {
    this.state.clear();
  }

  dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
    this.state.clear();
  }

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
  } {
    return {
      events: this.state.getAllEvents(),
      filteredEvents: this.state.getFilteredEvents(),
      selectedEventId: this.state.getSelectedEventId(),
      selectedEvent: this.state.getSelectedEvent(),
      filters: {
        level: this.state.getLevelFilter(),
        scopes: this.state.getScopeFilter(),
        tags: this.state.getTagFilter(),
        text: this.state.getTextFilter(),
      }
    };
  }
}