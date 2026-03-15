/**
 * Configuration validation module
 * Validates SatoriConfig to prevent runtime errors
 */

import type { SatoriConfig, LogLevel } from "./types.js";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const VALID_LOG_LEVELS: LogLevel[] = ["debug", "info", "warn", "error"];

export function validateConfig(
  config: Partial<SatoriConfig>,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate enableCallsite
  if (
    config.enableCallsite !== undefined &&
    typeof config.enableCallsite !== "boolean"
  ) {
    errors.push("enableCallsite must be a boolean");
  }

  // Validate enableEnvInfo
  if (
    config.enableEnvInfo !== undefined &&
    typeof config.enableEnvInfo !== "boolean"
  ) {
    errors.push("enableEnvInfo must be a boolean");
  }

  // Validate enableStateSnapshot
  if (
    config.enableStateSnapshot !== undefined &&
    typeof config.enableStateSnapshot !== "boolean"
  ) {
    errors.push("enableStateSnapshot must be a boolean");
  }

  // Validate enableCausalLinks
  if (
    config.enableCausalLinks !== undefined &&
    typeof config.enableCausalLinks !== "boolean"
  ) {
    errors.push("enableCausalLinks must be a boolean");
  }

  // Validate stateSelectors
  if (config.stateSelectors !== undefined) {
    if (!Array.isArray(config.stateSelectors)) {
      errors.push("stateSelectors must be an array");
    } else {
      config.stateSelectors.forEach((selector, index) => {
        if (typeof selector !== "function") {
          errors.push(`stateSelectors[${index}] must be a function`);
        }
      });
    }
  }

  // Validate maxBufferSize
  if (config.maxBufferSize !== undefined) {
    if (typeof config.maxBufferSize !== "number") {
      errors.push("maxBufferSize must be a number");
    } else if (config.maxBufferSize < 1) {
      errors.push("maxBufferSize must be at least 1");
    } else if (config.maxBufferSize > 100000) {
      warnings.push(
        "maxBufferSize is very large (>100000), this may cause memory issues",
      );
    }
  }

  // Validate logLevel
  if (config.logLevel !== undefined) {
    if (!VALID_LOG_LEVELS.includes(config.logLevel)) {
      errors.push(`logLevel must be one of: ${VALID_LOG_LEVELS.join(", ")}`);
    }
  }

  // Validate appVersion
  if (
    config.appVersion !== undefined &&
    typeof config.appVersion !== "string"
  ) {
    errors.push("appVersion must be a string");
  }

  // Validate pollingInterval
  if (config.pollingInterval !== undefined) {
    if (typeof config.pollingInterval !== "number") {
      errors.push("pollingInterval must be a number");
    } else if (config.pollingInterval < 10) {
      errors.push("pollingInterval must be at least 10ms");
    } else if (config.pollingInterval < 50) {
      warnings.push(
        "pollingInterval is very low (<50ms), this may impact performance",
      );
    }
  }

  // Validate rateLimiting
  if (config.rateLimiting !== undefined) {
    if (
      typeof config.rateLimiting !== "object" ||
      config.rateLimiting === null
    ) {
      errors.push("rateLimiting must be an object");
    } else {
      const rl = config.rateLimiting;
      if (rl.enabled !== undefined && typeof rl.enabled !== "boolean") {
        errors.push("rateLimiting.enabled must be a boolean");
      }
      if (rl.maxEventsPerSecond !== undefined) {
        if (typeof rl.maxEventsPerSecond !== "number") {
          errors.push("rateLimiting.maxEventsPerSecond must be a number");
        } else if (rl.maxEventsPerSecond < 1) {
          errors.push("rateLimiting.maxEventsPerSecond must be at least 1");
        }
      }
      if (rl.samplingRate !== undefined) {
        if (typeof rl.samplingRate !== "number") {
          errors.push("rateLimiting.samplingRate must be a number");
        } else if (rl.samplingRate < 0 || rl.samplingRate > 1) {
          errors.push("rateLimiting.samplingRate must be between 0 and 1");
        }
      }
    }
  }

  // Validate deduplication
  if (config.deduplication !== undefined) {
    if (
      typeof config.deduplication !== "object" ||
      config.deduplication === null
    ) {
      errors.push("deduplication must be an object");
    } else {
      const dd = config.deduplication;
      if (dd.enabled !== undefined && typeof dd.enabled !== "boolean") {
        errors.push("deduplication.enabled must be a boolean");
      }
      if (dd.windowMs !== undefined) {
        if (typeof dd.windowMs !== "number") {
          errors.push("deduplication.windowMs must be a number");
        } else if (dd.windowMs < 100) {
          errors.push("deduplication.windowMs must be at least 100ms");
        }
      }
      if (dd.fields !== undefined) {
        if (!Array.isArray(dd.fields)) {
          errors.push("deduplication.fields must be an array");
        } else {
          const validFields = ["message", "scope", "level", "tags", "state"];
          dd.fields.forEach((field, index) => {
            if (typeof field !== "string") {
              errors.push(`deduplication.fields[${index}] must be a string`);
            } else if (!validFields.includes(field)) {
              errors.push(
                `deduplication.fields[${index}] "${field}" is not a valid field. Valid fields: ${validFields.join(", ")}`,
              );
            }
          });
        }
      }
    }
  }

  // Validate customLevels
  if (config.customLevels !== undefined) {
    if (!Array.isArray(config.customLevels)) {
      errors.push("customLevels must be an array");
    } else {
      const seenNames = new Set<string>();
      // These names are completely reserved and cannot be used
      const reservedNames = ["log", "event"];

      config.customLevels.forEach((level, index) => {
        if (typeof level.name !== "string" || level.name.trim() === "") {
          errors.push(`customLevels[${index}].name must be a non-empty string`);
        } else {
          // Check for duplicates
          if (seenNames.has(level.name)) {
            errors.push(
              `customLevels[${index}].name "${level.name}" is a duplicate`,
            );
          }
          seenNames.add(level.name);

          // Check for completely reserved names (method names)
          if (reservedNames.includes(level.name.toLowerCase())) {
            errors.push(
              `customLevels[${index}].name "${level.name}" is a reserved method name`,
            );
          }

          // Warn if shadowing a built-in level
          if (VALID_LOG_LEVELS.includes(level.name as LogLevel)) {
            warnings.push(
              `customLevels[${index}].name "${level.name}" shadows a built-in level`,
            );
          }
        }
        if (typeof level.severity !== "number") {
          errors.push(`customLevels[${index}].severity must be a number`);
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Throws an error if config is invalid
 */
export function assertValidConfig(config: Partial<SatoriConfig>): void {
  const result = validateConfig(config);
  if (!result.valid) {
    throw new Error(
      `Invalid Satori configuration:\n${result.errors.join("\n")}`,
    );
  }
}
