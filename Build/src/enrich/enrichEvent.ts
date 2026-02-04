import type { LogEntry, LogOptions, SatoriConfig } from '../core/types.js';
import { generateId } from '../core/utils/ids.js';
import { now } from '../core/utils/time.js';
import { extractCallsite } from '../core/utils/stacktrace.js';
import { getEnvInfo } from './env.js';
import { captureStateSnapshot } from './stateSnapshot.js';
import { getCausalLink } from './causal.js';

interface EventInput {
  level: string;
  scope: string;
  message: string;
  options?: LogOptions;
  inheritedTags?: string[];
  inheritedCause?: string;
  inheritedCauseEventId?: string;
}

export function enrichEvent(
  input: EventInput,
  config: SatoriConfig,
  previousEventId?: string
): LogEntry {
  const id = generateId();
  const timestamp = now();
  
  const tags = [
    ...(input.inheritedTags || []),
    ...(input.options?.tags || [])
  ];

  const entry: LogEntry = {
    id,
    timestamp,
    level: input.level,
    scope: input.scope,
    message: input.message,
    tags,
    cause: input.inheritedCause || input.options?.cause,
    causeEventId: input.inheritedCauseEventId || input.options?.causeEventId,
    suggest: input.options?.suggest,
  };

  // Add user-provided state
  if (input.options?.state) {
    entry.state = { ...input.options.state };
  }

  if (config.enableCallsite && !entry.__internal?.isReplay) {
    entry.callsite = extractCallsite(4); // Adjusted depth for new call stack
  }

  if (config.enableEnvInfo && !entry.__internal?.isReplay) {
    entry.env = getEnvInfo(config);
  }

  if (config.enableStateSnapshot && !entry.__internal?.isReplay) {
    const snapshot = captureStateSnapshot(config);
    if (snapshot) {
      entry.state = { ...entry.state, ...snapshot };
    }
  }

  if (config.enableCausalLinks && !entry.__internal?.isReplay) {
    const causalLink = getCausalLink(input.scope, previousEventId);
    if (causalLink) {
      entry.previousEventId = causalLink;
    }
  }

  return entry;
}