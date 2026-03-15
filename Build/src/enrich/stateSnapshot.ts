import type { SatoriConfig, StateSelector } from "../core/types.js";
import { deepClone } from "../core/utils/deepEqual.js";

export interface StateSnapshotResult {
  [key: string]: unknown;
}

type SelectorInput = StateSelector | (() => Record<string, unknown>);

/**
 * Capture a snapshot of application state using configured selectors
 * Now supports named selectors for better organization
 */
export function captureStateSnapshot(
  config: SatoriConfig,
): StateSnapshotResult | undefined {
  if (!config.stateSelectors || config.stateSelectors.length === 0) {
    return undefined;
  }

  const snapshot: StateSnapshotResult = {};

  for (let index = 0; index < config.stateSelectors.length; index++) {
    const selectorConfig: SelectorInput = config.stateSelectors[
      index
    ] as SelectorInput;

    // Handle both old function format and new StateSelector format
    const selector =
      typeof selectorConfig === "function"
        ? selectorConfig
        : selectorConfig.selector;
    const name =
      typeof selectorConfig === "function"
        ? `selector_${index}`
        : selectorConfig.name || `selector_${index}`;

    try {
      const state = selector();
      if (state !== undefined && state !== null) {
        // Deep clone to prevent mutations
        snapshot[name] = deepClone(state);
      }
    } catch (err) {
      snapshot[`${name}_error`] =
        err instanceof Error ? err.message : String(err);
    }
  }

  return Object.keys(snapshot).length > 0 ? snapshot : undefined;
}

/**
 * Create a typed state selector
 * Provides better type safety for state snapshots
 */
export function createStateSelector<T extends Record<string, unknown>>(
  name: string,
  selector: () => T,
): StateSelector<T> {
  return { name, selector };
}

/**
 * Merge multiple state snapshots
 */
export function mergeSnapshots(
  ...snapshots: (StateSnapshotResult | undefined)[]
): StateSnapshotResult {
  const merged: StateSnapshotResult = {};

  for (const snapshot of snapshots) {
    if (snapshot) {
      Object.assign(merged, snapshot);
    }
  }

  return merged;
}

/**
 * Compare two state snapshots and return differences
 */
export function diffSnapshots(
  prev: StateSnapshotResult | undefined,
  next: StateSnapshotResult | undefined,
): { added: string[]; removed: string[]; changed: string[] } {
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];

  const prevKeys = new Set(prev ? Object.keys(prev) : []);
  const nextKeys = new Set(next ? Object.keys(next) : []);

  // Find added keys
  for (const key of nextKeys) {
    if (!prevKeys.has(key)) {
      added.push(key);
    }
  }

  // Find removed keys
  for (const key of prevKeys) {
    if (!nextKeys.has(key)) {
      removed.push(key);
    }
  }

  // Find changed keys
  for (const key of prevKeys) {
    if (nextKeys.has(key) && prev && next) {
      if (JSON.stringify(prev[key]) !== JSON.stringify(next[key])) {
        changed.push(key);
      }
    }
  }

  return { added, removed, changed };
}
