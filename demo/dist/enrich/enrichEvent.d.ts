import type { LogEntry, LogOptions, SatoriConfig } from "../core/types.js";
interface EventInput {
    level: string;
    scope: string;
    message: string;
    options?: LogOptions;
    inheritedTags?: string[];
    inheritedCause?: string;
    inheritedCauseEventId?: string;
}
export declare function enrichEvent(input: EventInput, config: SatoriConfig, previousEventId?: string): LogEntry;
export {};
