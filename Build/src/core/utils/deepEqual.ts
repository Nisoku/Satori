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

export function deepEqual(
  a: unknown,
  b: unknown,
  seen = new WeakMap<object, object>(),
): boolean {
  // Identical references or primitive values
  if (a === b) return true;

  // Handle NaN (NaN !== NaN in JavaScript)
  if (typeof a === "number" && typeof b === "number") {
    if (Number.isNaN(a) && Number.isNaN(b)) return true;
    return a === b;
  }

  // Handle null/undefined
  if (a === null || b === null) return a === b;
  if (a === undefined || b === undefined) return a === b;

  // Different types
  if (typeof a !== typeof b) return false;

  // Handle non-object types (already compared above for primitives)
  if (typeof a !== "object") return false;

  // Both are objects from here - check for circular references
  const aObj = a as object;
  const bObj = b as object;

  if (seen.has(aObj)) {
    return seen.get(aObj) === bObj;
  }
  seen.set(aObj, bObj);

  // Handle Date objects
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  if (a instanceof Date || b instanceof Date) return false;

  // Handle RegExp
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.source === b.source && a.flags === b.flags;
  }
  if (a instanceof RegExp || b instanceof RegExp) return false;

  // Handle Map
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [key, value] of a) {
      if (!b.has(key) || !deepEqual(value, b.get(key), seen)) return false;
    }
    return true;
  }
  if (a instanceof Map || b instanceof Map) return false;

  // Handle Set
  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false;
    // For sets, we need to check if all elements exist
    const aArr = Array.from(a);
    const bArr = Array.from(b);
    for (const aVal of aArr) {
      let found = false;
      for (const bVal of bArr) {
        if (deepEqual(aVal, bVal, seen)) {
          found = true;
          break;
        }
      }
      if (!found) return false;
    }
    return true;
  }
  if (a instanceof Set || b instanceof Set) return false;

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;

    // Check for sparse arrays - compare which indices exist
    const aIndices = Object.keys(a)
      .filter((k) => /^\d+$/.test(k))
      .map(Number);
    const bIndices = Object.keys(b)
      .filter((k) => /^\d+$/.test(k))
      .map(Number);

    if (aIndices.length !== bIndices.length) return false;

    // Compare sparse array indices
    for (const idx of aIndices) {
      if (!bIndices.includes(idx)) return false;
    }

    // Compare values at each index
    for (let i = 0; i < a.length; i++) {
      const aHas = Object.prototype.hasOwnProperty.call(a, i);
      const bHas = Object.prototype.hasOwnProperty.call(b, i);
      if (aHas !== bHas) return false;
      if (aHas && !deepEqual(a[i], b[i], seen)) return false;
    }

    // Check for extra properties on arrays
    const aKeys = Object.keys(a).filter((k) => !/^\d+$/.test(k));
    const bKeys = Object.keys(b).filter((k) => !/^\d+$/.test(k));
    if (aKeys.length !== bKeys.length) return false;

    for (const key of aKeys) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key], seen)) return false;
    }

    return true;
  }

  // One is array, one is not
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  // Handle plain objects
  const aRecord = a as Record<string, unknown>;
  const bRecord = b as Record<string, unknown>;

  const aKeys = Object.keys(aRecord);
  const bKeys = Object.keys(bRecord);

  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(bRecord, key)) return false;
    if (!deepEqual(aRecord[key], bRecord[key], seen)) return false;
  }

  return true;
}

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
export function deepClone<T>(
  value: T,
  seen = new WeakMap<object, unknown>(),
): T {
  if (value === null || value === undefined) return value;

  if (typeof value !== "object") return value;

  // Check for circular reference
  const objValue = value as object;
  if (seen.has(objValue)) {
    return seen.get(objValue) as T;
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as unknown as T;
  }

  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as unknown as T;
  }

  if (value instanceof Map) {
    const cloned = new Map();
    seen.set(objValue, cloned);
    for (const [k, v] of value) {
      cloned.set(deepClone(k, seen), deepClone(v, seen));
    }
    return cloned as unknown as T;
  }

  if (value instanceof Set) {
    const cloned = new Set();
    seen.set(objValue, cloned);
    for (const v of value) {
      cloned.add(deepClone(v, seen));
    }
    return cloned as unknown as T;
  }

  if (Array.isArray(value)) {
    const cloned: unknown[] = [];
    seen.set(objValue, cloned);

    // Handle sparse arrays properly
    for (let i = 0; i < value.length; i++) {
      if (Object.prototype.hasOwnProperty.call(value, i)) {
        cloned[i] = deepClone(value[i], seen);
      }
    }

    // Copy non-index properties
    for (const key of Object.keys(value)) {
      if (!/^\d+$/.test(key)) {
        (cloned as Record<string, unknown>)[key] = deepClone((value as Record<string, unknown>)[key], seen);
      }
    }

    return cloned as unknown as T;
  }

  const cloned: Record<string, unknown> = {};
  seen.set(objValue, cloned);

  for (const key of Object.keys(value)) {
    cloned[key] = deepClone((value as Record<string, unknown>)[key], seen);
  }

  return cloned as T;
}

/**
 * Compute a hash for a value (for deduplication)
 * Handles circular references safely
 */
export function computeHash(
  value: unknown,
  seen = new WeakSet<object>(),
): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";

  if (typeof value === "string") return `s:${value}`;
  if (typeof value === "number") {
    if (Number.isNaN(value)) return "n:NaN";
    return `n:${value}`;
  }
  if (typeof value === "boolean") return `b:${value}`;

  if (typeof value !== "object") return String(value);

  // Handle circular reference
  if (seen.has(value as object)) {
    return "[Circular]";
  }
  seen.add(value as object);

  if (value instanceof Date) return `d:${value.getTime()}`;

  if (value instanceof RegExp) return `r:${value.source}:${value.flags}`;

  if (value instanceof Map) {
    const entries = Array.from(value.entries())
      .map(([k, v]) => `${computeHash(k, seen)}=>${computeHash(v, seen)}`)
      .sort()
      .join(",");
    return `m:{${entries}}`;
  }

  if (value instanceof Set) {
    const items = Array.from(value)
      .map((v) => computeHash(v, seen))
      .sort()
      .join(",");
    return `set:{${items}}`;
  }

  if (Array.isArray(value)) {
    const items = value.map((v, i) => {
      if (!Object.prototype.hasOwnProperty.call(value, i)) return "<empty>";
      return computeHash(v, seen);
    });
    return `a:[${items.join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${computeHash(v, seen)}`);
  return `o:{${entries.join(",")}}`;
}
