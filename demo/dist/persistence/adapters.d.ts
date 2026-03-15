/**
 * Persistence Layer
 * Provides async persistence adapters for log entries
 */
import type { LogEntry, PersistenceAdapter, PersistenceReadOptions, PersistenceConfig } from "../core/types.js";
/**
 * In-memory persistence adapter (useful for testing)
 */
export declare class MemoryAdapter implements PersistenceAdapter {
    name: string;
    private store;
    private maxSize;
    constructor(maxSize?: number);
    write(entries: LogEntry[]): Promise<void>;
    read(options?: PersistenceReadOptions): Promise<LogEntry[]>;
    clear(): Promise<void>;
    close(): Promise<void>;
    getSize(): number;
}
/**
 * LocalStorage persistence adapter (browser only)
 */
export declare class LocalStorageAdapter implements PersistenceAdapter {
    name: string;
    private storageKey;
    private maxSize;
    constructor(storageKey?: string, maxSize?: number);
    write(entries: LogEntry[]): Promise<void>;
    read(options?: PersistenceReadOptions): Promise<LogEntry[]>;
    clear(): Promise<void>;
    close(): Promise<void>;
}
/**
 * IndexedDB persistence adapter (browser only, larger capacity)
 */
export declare class IndexedDBAdapter implements PersistenceAdapter {
    name: string;
    private dbName;
    private storeName;
    private db;
    private maxSize;
    constructor(dbName?: string, maxSize?: number);
    private getDB;
    write(entries: LogEntry[]): Promise<void>;
    read(options?: PersistenceReadOptions): Promise<LogEntry[]>;
    clear(): Promise<void>;
    close(): Promise<void>;
}
/**
 * Console adapter (logs to console, useful for debugging)
 */
export declare class ConsoleAdapter implements PersistenceAdapter {
    name: string;
    private inMemory;
    write(entries: LogEntry[]): Promise<void>;
    read(): Promise<LogEntry[]>;
    clear(): Promise<void>;
    close(): Promise<void>;
}
/**
 * Persistence manager for batched writes
 */
export declare class PersistenceManager {
    private buffer;
    private flushTimer;
    private config;
    constructor(config: PersistenceConfig);
    /**
     * Add an entry to the persistence buffer
     */
    add(entry: LogEntry): void;
    /**
     * Flush the buffer to the adapter
     */
    flush(): Promise<void>;
    /**
     * Start auto-flush timer
     */
    private startAutoFlush;
    /**
     * Stop auto-flush and close adapter
     */
    close(): Promise<void>;
    /**
     * Get buffer size
     */
    getBufferSize(): number;
}
