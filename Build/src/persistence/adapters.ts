/**
 * Persistence Layer
 * Provides async persistence adapters for log entries
 */

import type { LogEntry, PersistenceAdapter, PersistenceReadOptions, PersistenceConfig } from '../core/types.js';

/**
 * In-memory persistence adapter (useful for testing)
 */
export class MemoryAdapter implements PersistenceAdapter {
  name = 'memory';
  private store: LogEntry[] = [];
  private maxSize: number;

  constructor(maxSize = 10000) {
    this.maxSize = maxSize;
  }

  async write(entries: LogEntry[]): Promise<void> {
    this.store.push(...entries);
    
    // Trim if over max size
    if (this.store.length > this.maxSize) {
      this.store = this.store.slice(-this.maxSize);
    }
  }

  async read(options?: PersistenceReadOptions): Promise<LogEntry[]> {
    let results = [...this.store];
    
    if (options?.startTime) {
      results = results.filter(e => e.timestamp >= options.startTime!);
    }
    if (options?.endTime) {
      results = results.filter(e => e.timestamp <= options.endTime!);
    }
    if (options?.levels?.length) {
      results = results.filter(e => options.levels!.includes(e.level));
    }
    if (options?.scopes?.length) {
      results = results.filter(e => options.scopes!.includes(e.scope));
    }
    if (options?.offset) {
      results = results.slice(options.offset);
    }
    if (options?.limit) {
      results = results.slice(0, options.limit);
    }
    
    return results;
  }

  async clear(): Promise<void> {
    this.store = [];
  }

  async close(): Promise<void> {
    // No-op for memory adapter
  }

  getSize(): number {
    return this.store.length;
  }
}

/**
 * LocalStorage persistence adapter (browser only)
 */
export class LocalStorageAdapter implements PersistenceAdapter {
  name = 'localStorage';
  private storageKey: string;
  private maxSize: number;

  constructor(storageKey = 'satori_logs', maxSize = 1000) {
    this.storageKey = storageKey;
    this.maxSize = maxSize;
  }

  async write(entries: LogEntry[]): Promise<void> {
    if (typeof localStorage === 'undefined') {
      throw new Error('localStorage is not available in this environment');
    }

    const existing = await this.read();
    const combined = [...existing, ...entries];
    
    // Trim if over max size
    const trimmed = combined.slice(-this.maxSize);
    
    localStorage.setItem(this.storageKey, JSON.stringify(trimmed));
  }

  async read(options?: PersistenceReadOptions): Promise<LogEntry[]> {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return [];
    
    let results: LogEntry[];
    try {
      results = JSON.parse(stored);
    } catch {
      return [];
    }
    
    if (options?.startTime) {
      results = results.filter(e => e.timestamp >= options.startTime!);
    }
    if (options?.endTime) {
      results = results.filter(e => e.timestamp <= options.endTime!);
    }
    if (options?.levels?.length) {
      results = results.filter(e => options.levels!.includes(e.level));
    }
    if (options?.scopes?.length) {
      results = results.filter(e => options.scopes!.includes(e.scope));
    }
    if (options?.offset) {
      results = results.slice(options.offset);
    }
    if (options?.limit) {
      results = results.slice(0, options.limit);
    }
    
    return results;
  }

  async clear(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  async close(): Promise<void> {
    // No-op for localStorage
  }
}

/**
 * IndexedDB persistence adapter (browser only, larger capacity)
 */
export class IndexedDBAdapter implements PersistenceAdapter {
  name = 'indexedDB';
  private dbName: string;
  private storeName = 'logs';
  private db: IDBDatabase | null = null;
  private maxSize: number;

  constructor(dbName = 'satori', maxSize = 100000) {
    this.dbName = dbName;
    this.maxSize = maxSize;
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB is not available in this environment'));
        return;
      }

      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('level', 'level');
          store.createIndex('scope', 'scope');
        }
      };
    });
  }

  async write(entries: LogEntry[]): Promise<void> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      for (const entry of entries) {
        store.put(entry);
      }
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async read(options?: PersistenceReadOptions): Promise<LogEntry[]> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      
      const results: LogEntry[] = [];
      const request = index.openCursor();
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const entry = cursor.value as LogEntry;
          let include = true;
          
          if (options?.startTime && entry.timestamp < options.startTime) {
            include = false;
          }
          if (options?.endTime && entry.timestamp > options.endTime) {
            include = false;
          }
          if (options?.levels?.length && !options.levels.includes(entry.level)) {
            include = false;
          }
          if (options?.scopes?.length && !options.scopes.includes(entry.scope)) {
            include = false;
          }
          
          if (include) {
            results.push(entry);
          }
          
          cursor.continue();
        } else {
          let finalResults = results;
          if (options?.offset) {
            finalResults = finalResults.slice(options.offset);
          }
          if (options?.limit) {
            finalResults = finalResults.slice(0, options.limit);
          }
          resolve(finalResults);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

/**
 * Console adapter (logs to console, useful for debugging)
 */
export class ConsoleAdapter implements PersistenceAdapter {
  name = 'console';
  private inMemory: LogEntry[] = [];

  async write(entries: LogEntry[]): Promise<void> {
    for (const entry of entries) {
      const level = entry.level as string;
      const method = level === 'debug' ? 'log' : level;
      const consoleMethod = (console as unknown as Record<string, (...args: unknown[]) => void>)[method] ?? console.log;
      consoleMethod(`[${entry.scope}] ${entry.message}`, entry);
      this.inMemory.push(entry);
    }
  }

  async read(): Promise<LogEntry[]> {
    return [...this.inMemory];
  }

  async clear(): Promise<void> {
    this.inMemory = [];
  }

  async close(): Promise<void> {
    // No-op
  }
}

/**
 * Persistence manager for batched writes
 */
export class PersistenceManager {
  private buffer: LogEntry[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private config: PersistenceConfig;

  constructor(config: PersistenceConfig) {
    this.config = config;
    
    if (config.enabled && config.flushInterval) {
      this.startAutoFlush();
    }
  }

  /**
   * Add an entry to the persistence buffer
   */
  add(entry: LogEntry): void {
    if (!this.config.enabled) return;
    
    this.buffer.push(entry);
    
    // Auto-flush if batch size reached
    if (this.config.batchSize && this.buffer.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Flush the buffer to the adapter
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    
    const toFlush = [...this.buffer];
    this.buffer = [];
    
    try {
      await this.config.adapter.write(toFlush);
    } catch (error) {
      // Re-add entries on failure (with limit to prevent infinite growth)
      if (this.buffer.length < 10000) {
        this.buffer = [...toFlush, ...this.buffer];
      }
      throw error;
    }
  }

  /**
   * Start auto-flush timer
   */
  private startAutoFlush(): void {
    if (this.flushTimer) return;
    
    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.config.flushInterval);
  }

  /**
   * Stop auto-flush and close adapter
   */
  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    // Final flush
    await this.flush();
    await this.config.adapter.close?.();
  }

  /**
   * Get buffer size
   */
  getBufferSize(): number {
    return this.buffer.length;
  }
}
