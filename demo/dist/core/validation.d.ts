/**
 * Configuration validation module
 * Validates SatoriConfig to prevent runtime errors
 */
import type { SatoriConfig } from "./types.js";
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
export declare function validateConfig(config: Partial<SatoriConfig>): ValidationResult;
/**
 * Throws an error if config is invalid
 */
export declare function assertValidConfig(config: Partial<SatoriConfig>): void;
