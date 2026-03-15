import type { LogEntry } from "../core/types.js";

export class ReplayBuffer {
  private buffer: LogEntry[] = [];
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  add(entry: LogEntry): void {
    this.buffer.push(entry);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  getAll(): LogEntry[] {
    return [...this.buffer];
  }

  clear(): void {
    this.buffer.length = 0;
  }

  size(): number {
    return this.buffer.length;
  }

  getLast(n = 10): LogEntry[] {
    const start = Math.max(0, this.buffer.length - n);
    return this.buffer.slice(start);
  }
}
