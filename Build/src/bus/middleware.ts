import type { LogLevel, Middleware } from "../core/types.js";

export function createLevelFilter(minLevel: LogLevel): Middleware {
  const levels: Record<string, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  const minSeverity = levels[minLevel];

  return (entry, next) => {
    if ((levels[entry.level] ?? 0) >= minSeverity) {
      next();
    }
  };
}

export function createTagFilter(allowedTags: string[]): Middleware {
  return (entry, next) => {
    if (
      allowedTags.length === 0 ||
      entry.tags.some((tag) => allowedTags.includes(tag))
    ) {
      next();
    }
  };
}

export function createScopeFilter(allowedScopes: string[]): Middleware {
  return (entry, next) => {
    if (allowedScopes.length === 0 || allowedScopes.includes(entry.scope)) {
      next();
    }
  };
}

export function createTextFilter(searchTerm: string): Middleware {
  const term = searchTerm.toLowerCase();
  return (entry, next) => {
    if (
      term === "" ||
      entry.message.toLowerCase().includes(term) ||
      entry.scope.toLowerCase().includes(term) ||
      entry.tags.some((tag) => tag.toLowerCase().includes(term))
    ) {
      next();
    }
  };
}
