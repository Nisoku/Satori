import type { SatoriConfig } from '../core/types.js';

export function captureStateSnapshot(config: SatoriConfig): Record<string, any> | undefined {
  if (!config.stateSelectors || config.stateSelectors.length === 0) {
    return undefined;
  }

  const snapshot: Record<string, any> = {};
  
  try {
    config.stateSelectors.forEach((selector: () => Record<string, any>, index: number) => {
      try {
        const state = selector();
        if (state !== undefined && state !== null) {
          snapshot[`selector_${index}`] = state;
        }
      } catch (err) {
        snapshot[`selector_${index}_error`] = err instanceof Error ? err.message : String(err);
      }
    });
  } catch (err) {
    snapshot.error = err instanceof Error ? err.message : String(err);
  }

  return Object.keys(snapshot).length > 0 ? snapshot : undefined;
}