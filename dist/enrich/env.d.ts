import type { SatoriConfig, EnvironmentInfo, RuntimePlatform } from "../core/types.js";
/**
 * Detect the current runtime platform
 */
export declare function detectPlatform(): RuntimePlatform;
/**
 * Get environment information based on the current platform
 */
export declare function getEnvInfo(config: SatoriConfig): EnvironmentInfo;
