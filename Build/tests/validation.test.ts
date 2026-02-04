import { validateConfig, assertValidConfig } from '../src/core/validation';

describe('Configuration Validation', () => {
  describe('validateConfig', () => {
    it('should return valid for empty config', () => {
      const result = validateConfig({});
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should validate boolean fields', () => {
      const result = validateConfig({
        enableCallsite: 'true' as unknown as boolean
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('enableCallsite must be a boolean');
    });

    it('should validate maxBufferSize', () => {
      const result = validateConfig({
        maxBufferSize: -1
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('maxBufferSize must be at least 1');
    });

    it('should warn for large maxBufferSize', () => {
      const result = validateConfig({
        maxBufferSize: 200000
      });
      
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should validate logLevel', () => {
      const result = validateConfig({
        logLevel: 'invalid' as any
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('logLevel'))).toBe(true);
    });

    it('should validate pollingInterval minimum', () => {
      const result = validateConfig({
        pollingInterval: 5
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('pollingInterval must be at least 10ms');
    });

    it('should warn for low pollingInterval', () => {
      const result = validateConfig({
        pollingInterval: 20
      });
      
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('pollingInterval'))).toBe(true);
    });

    it('should validate rateLimiting', () => {
      const result = validateConfig({
        rateLimiting: {
          enabled: 'yes' as unknown as boolean
        }
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('rateLimiting.enabled must be a boolean');
    });

    it('should validate rateLimiting.maxEventsPerSecond', () => {
      const result = validateConfig({
        rateLimiting: {
          maxEventsPerSecond: 0
        }
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('rateLimiting.maxEventsPerSecond must be at least 1');
    });

    it('should validate rateLimiting.samplingRate range', () => {
      const result = validateConfig({
        rateLimiting: {
          samplingRate: 1.5
        }
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('rateLimiting.samplingRate must be between 0 and 1');
    });

    it('should validate deduplication', () => {
      const result = validateConfig({
        deduplication: {
          windowMs: 50
        }
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('deduplication.windowMs must be at least 100ms');
    });

    it('should validate customLevels', () => {
      const result = validateConfig({
        customLevels: [
          { name: '', severity: 5 }
        ]
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('customLevels[0].name'))).toBe(true);
    });

    it('should warn for shadowing built-in levels', () => {
      const result = validateConfig({
        customLevels: [
          { name: 'info', severity: 5 }
        ]
      });
      
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('shadows'))).toBe(true);
    });

    it('should validate stateSelectors', () => {
      const result = validateConfig({
        stateSelectors: ['not a function' as any]
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('stateSelectors[0]'))).toBe(true);
    });
  });

  describe('assertValidConfig', () => {
    it('should not throw for valid config', () => {
      expect(() => {
        assertValidConfig({
          enableCallsite: true,
          maxBufferSize: 500
        });
      }).not.toThrow();
    });

    it('should throw for invalid config', () => {
      expect(() => {
        assertValidConfig({
          maxBufferSize: -1
        });
      }).toThrow('Invalid Satori configuration');
    });
  });
});
