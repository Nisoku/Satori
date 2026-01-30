import type { SatoriConfig } from '../core/types.js';

export function getEnvInfo(config: SatoriConfig): Record<string, any> {
  const env: Record<string, any> = {
    platform: typeof window !== 'undefined' ? 'browser' : 'node',
    appVersion: config.appVersion,
  };

  if (typeof window !== 'undefined') {
    env.userAgent = navigator.userAgent;
    env.url = window.location.href;
    env.referrer = document.referrer;
  } else if (typeof process !== 'undefined') {
    env.nodeVersion = process.version;
    env.platform = process.platform;
    env.arch = process.arch;
  }

  return env;
}