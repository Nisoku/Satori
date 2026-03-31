import { describe, test, expect, it } from '@jest/globals';
import { deepEqual, deepClone, computeHash } from '../src/core/utils/deepEqual';

describe('deepEqual', () => {
  describe('primitives', () => {
    it('should return true for identical primitives', () => {
      expect(deepEqual(1, 1)).toBe(true);
      expect(deepEqual('hello', 'hello')).toBe(true);
      expect(deepEqual(true, true)).toBe(true);
      expect(deepEqual(null, null)).toBe(true);
      expect(deepEqual(undefined, undefined)).toBe(true);
    });

    it('should return false for different primitives', () => {
      expect(deepEqual(1, 2)).toBe(false);
      expect(deepEqual('hello', 'world')).toBe(false);
      expect(deepEqual(true, false)).toBe(false);
      expect(deepEqual(null, undefined)).toBe(false);
    });

    it('should return false for different types', () => {
      expect(deepEqual(1, '1')).toBe(false);
      expect(deepEqual(0, false)).toBe(false);
      expect(deepEqual(null, 0)).toBe(false);
    });
  });

  describe('arrays', () => {
    it('should return true for identical arrays', () => {
      expect(deepEqual([], [])).toBe(true);
      expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(deepEqual(['a', 'b'], ['a', 'b'])).toBe(true);
    });

    it('should return false for different arrays', () => {
      expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
      expect(deepEqual([1, 2, 3], [1, 3, 2])).toBe(false);
    });

    it('should handle nested arrays', () => {
      expect(deepEqual([[1, 2], [3, 4]], [[1, 2], [3, 4]])).toBe(true);
      expect(deepEqual([[1, 2], [3, 4]], [[1, 2], [3, 5]])).toBe(false);
    });
  });

  describe('objects', () => {
    it('should return true for identical objects', () => {
      expect(deepEqual({}, {})).toBe(true);
      expect(deepEqual({ a: 1 }, { a: 1 })).toBe(true);
      expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    });

    it('should return false for different objects', () => {
      expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
      expect(deepEqual({ a: 1 }, { b: 1 })).toBe(false);
      expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });

    it('should handle nested objects', () => {
      expect(deepEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
      expect(deepEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
    });

    it('should ignore property order', () => {
      expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    });
  });

  describe('special types', () => {
    it('should handle Date objects', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-01');
      const date3 = new Date('2024-01-02');
      
      expect(deepEqual(date1, date2)).toBe(true);
      expect(deepEqual(date1, date3)).toBe(false);
    });

    it('should handle RegExp objects', () => {
      expect(deepEqual(/test/gi, /test/gi)).toBe(true);
      expect(deepEqual(/test/g, /test/i)).toBe(false);
      expect(deepEqual(/test/, /other/)).toBe(false);
    });
  });
});

describe('deepClone', () => {
  it('should clone primitives', () => {
    expect(deepClone(1)).toBe(1);
    expect(deepClone('hello')).toBe('hello');
    expect(deepClone(null)).toBe(null);
    expect(deepClone(undefined)).toBe(undefined);
  });

  it('should clone arrays', () => {
    const original = [1, 2, 3];
    const cloned = deepClone(original);
    
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    
    cloned.push(4);
    expect(original.length).toBe(3);
  });

  it('should clone objects', () => {
    const original = { a: 1, b: { c: 2 } };
    const cloned = deepClone(original);
    
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.b).not.toBe(original.b);
    
    cloned.b.c = 3;
    expect(original.b.c).toBe(2);
  });

  it('should clone Date objects', () => {
    const original = new Date('2024-01-01');
    const cloned = deepClone(original);
    
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
  });
});

describe('computeHash', () => {
  it('should compute consistent hashes for primitives', () => {
    expect(computeHash(1)).toBe('n:1');
    expect(computeHash('hello')).toBe('s:hello');
    expect(computeHash(true)).toBe('b:true');
    expect(computeHash(null)).toBe('null');
    expect(computeHash(undefined)).toBe('undefined');
  });

  it('should compute consistent hashes for arrays', () => {
    const hash1 = computeHash([1, 2, 3]);
    const hash2 = computeHash([1, 2, 3]);
    expect(hash1).toBe(hash2);
    
    const hash3 = computeHash([1, 3, 2]);
    expect(hash1).not.toBe(hash3);
  });

  it('should compute consistent hashes for objects', () => {
    // Object hashes should be order-independent
    const hash1 = computeHash({ a: 1, b: 2 });
    const hash2 = computeHash({ b: 2, a: 1 });
    expect(hash1).toBe(hash2);
  });
});
