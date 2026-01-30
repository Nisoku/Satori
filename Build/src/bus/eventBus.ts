import type { EventBus, EventSubscriber, Middleware, LogEntry } from '../core/types.js';

export class SimpleEventBus implements EventBus {
  private subscribers: EventSubscriber[] = [];
  private middleware: Middleware[] = [];
  private buffer: LogEntry[] = [];
  private maxBufferSize: number;

  constructor(maxBufferSize = 1000) {
    this.maxBufferSize = maxBufferSize;
  }

  publish(entry: LogEntry): void {
    let shouldContinue = true;
    let index = 0;

    const runNext = () => {
      if (index >= this.middleware.length) {
        this.subscribers.forEach(sub => sub(entry));
        this.addToBuffer(entry);
        return;
      }

      const mw = this.middleware[index];
      index++;
      mw(entry, runNext);
    };

    runNext();
  }

  subscribe(fn: EventSubscriber): () => void {
    this.subscribers.push(fn);
    return () => {
      const idx = this.subscribers.indexOf(fn);
      if (idx >= 0) {
        this.subscribers.splice(idx, 1);
      }
    };
  }

  use(middleware: Middleware): void {
    this.middleware.push(middleware);
  }

  getReplayBuffer(): LogEntry[] {
    return [...this.buffer];
  }

  private addToBuffer(entry: LogEntry): void {
    this.buffer.push(entry);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }
  }
}