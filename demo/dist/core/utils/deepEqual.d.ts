/**
 * Deep equality comparison utility
 * Compares two values for structural equality, handling:
 * - Primitives (including NaN)
 * - Objects and nested objects
 * - Arrays (including sparse arrays and arrays with extra properties)
 * - Date and RegExp objects
 * - Map and Set collections
 * - Circular references (detected and handled safely)
 */
export declare function deepEqual(a: unknown, b: unknown, seen?: WeakMap<object, object>): boolean;
/**
 * Deep clone utility
 * Creates a deep copy of a value, handling:
 * - Primitives
 * - Objects and nested objects
 * - Arrays (including sparse arrays)
 * - Date and RegExp objects
 * - Map and Set collections
 * - Circular references (detected and preserved)
 */
export declare function deepClone<T>(value: T, seen?: WeakMap<object, unknown>): T;
/**
 * Compute a hash for a value (for deduplication)
 * Handles circular references safely
 */
export declare function computeHash(value: unknown, seen?: WeakSet<object>): string;
