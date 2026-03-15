import type { LogLevel, Middleware } from "../core/types.js";
export declare function createLevelFilter(minLevel: LogLevel): Middleware;
export declare function createTagFilter(allowedTags: string[]): Middleware;
export declare function createScopeFilter(allowedScopes: string[]): Middleware;
export declare function createTextFilter(searchTerm: string): Middleware;
