import type { SatoriConfig, StateSelector } from "../core/types.js";
export interface StateSnapshotResult {
    [key: string]: unknown;
}
/**
 * Capture a snapshot of application state using configured selectors
 * Now supports named selectors for better organization
 */
export declare function captureStateSnapshot(config: SatoriConfig): StateSnapshotResult | undefined;
/**
 * Create a typed state selector
 * Provides better type safety for state snapshots
 */
export declare function createStateSelector<T extends Record<string, unknown>>(name: string, selector: () => T): StateSelector<T>;
/**
 * Merge multiple state snapshots
 */
export declare function mergeSnapshots(...snapshots: (StateSnapshotResult | undefined)[]): StateSnapshotResult;
/**
 * Compare two state snapshots and return differences
 */
export declare function diffSnapshots(prev: StateSnapshotResult | undefined, next: StateSnapshotResult | undefined): {
    added: string[];
    removed: string[];
    changed: string[];
};
