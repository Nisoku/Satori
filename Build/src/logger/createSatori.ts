import type { SatoriInstance, SatoriConfig, SatoriLogger } from '../core/types.js';
import { SimpleEventBus } from '../bus/eventBus.js';
import { ScopedLogger } from './createLogger.js';
import { DEFAULT_CONFIG } from '../core/config.js';

export function createSatori(config: Partial<SatoriConfig> = {}): SatoriInstance {
  const resolvedConfig = { ...DEFAULT_CONFIG, ...config };
  const bus = new SimpleEventBus(resolvedConfig.maxBufferSize);
  const rootLogger = new ScopedLogger('root', resolvedConfig, bus);

  return {
    config: resolvedConfig,
    bus,
    rootLogger,
    createLogger(scope: string): SatoriLogger {
      return new ScopedLogger(scope, resolvedConfig, bus);
    },
    dispose(): void {
      const buffer = bus.getReplayBuffer?.();
      if (buffer) {
        buffer.length = 0;
      }
    }
  };
}