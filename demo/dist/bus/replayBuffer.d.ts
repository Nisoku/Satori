import type { LogEntry } from "../core/types.js";
export declare class ReplayBuffer {
    private buffer;
    private maxSize;
    constructor(maxSize?: number);
    add(entry: LogEntry): void;
    getAll(): LogEntry[];
    clear(): void;
    size(): number;
    getLast(n?: number): LogEntry[];
}
