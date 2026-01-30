import type { EventBus, EventSubscriber, Middleware, LogEntry } from '../core/types.js';
export declare class SimpleEventBus implements EventBus {
    private subscribers;
    private middleware;
    private buffer;
    private maxBufferSize;
    constructor(maxBufferSize?: number);
    publish(entry: LogEntry): void;
    subscribe(fn: EventSubscriber): () => void;
    use(middleware: Middleware): void;
    getReplayBuffer(): LogEntry[];
    private addToBuffer;
}
