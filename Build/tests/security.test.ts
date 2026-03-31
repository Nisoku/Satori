import { describe, test, expect, it, afterEach, beforeEach } from '@jest/globals';
import { createSatori } from '../src/logger/createSatori';
import type { LogEntry } from '../src/core/types';

describe('XSS Prevention', () => {
  let satori: ReturnType<typeof createSatori>;
  let capturedEvents: LogEntry[] = [];

  beforeEach(() => {
    capturedEvents = [];
    satori = createSatori();
    // Use bus.subscribe instead of on()
    satori.bus.subscribe((event) => capturedEvents.push(event));
  });

  afterEach(() => {
    satori.dispose();
  });

  describe('Message sanitization', () => {
    it('should preserve but not execute script tags in messages', () => {
      const logger = satori.createLogger('test');
      const maliciousMessage = '<script>alert("xss")</script>';
      
      logger.info(maliciousMessage);
      
      // Message should be stored as-is (not executed, but preserved for logging)
      expect(capturedEvents[0].message).toBe(maliciousMessage);
      // When rendering, the application should escape this
    });

    it('should handle event handler injection attempts', () => {
      const logger = satori.createLogger('test');
      const payloads = [
        '<img src=x onerror=alert("xss")>',
        '<div onmouseover="alert(1)">hover me</div>',
        '<a href="javascript:alert(1)">click</a>',
        '<svg onload=alert("xss")>',
        '<body onload=alert("xss")>'
      ];
      
      payloads.forEach(payload => {
        logger.info(payload);
      });
      
      // All payloads should be stored (for logging purposes)
      // The library stores data; rendering/escaping is the consumer's responsibility
      expect(capturedEvents.length).toBe(payloads.length);
      payloads.forEach((payload, i) => {
        expect(capturedEvents[i].message).toBe(payload);
      });
    });

    it('should handle HTML entity encoding attempts', () => {
      const logger = satori.createLogger('test');
      const payloads = [
        '&lt;script&gt;alert("xss")&lt;/script&gt;',
        '&#60;script&#62;alert("xss")&#60;/script&#62;',
        '&#x3C;script&#x3E;alert("xss")&#x3C;/script&#x3E;'
      ];
      
      payloads.forEach(payload => {
        logger.info(payload);
      });
      
      expect(capturedEvents.length).toBe(payloads.length);
    });

    it('should handle unicode escape attempts', () => {
      const logger = satori.createLogger('test');
      const payload = '\u003cscript\u003ealert("xss")\u003c/script\u003e';
      
      logger.info(payload);
      
      expect(capturedEvents[0].message).toBe(payload);
    });
  });

  describe('Scope sanitization', () => {
    it('should handle malicious scope names', () => {
      const maliciousScopes = [
        '<script>alert(1)</script>',
        'test"><script>alert(1)</script>',
        "test'><script>alert(1)</script>",
        'javascript:alert(1)'
      ];
      
      maliciousScopes.forEach(scope => {
        const logger = satori.createLogger(scope);
        logger.info('test');
      });
      
      expect(capturedEvents.length).toBe(maliciousScopes.length);
      maliciousScopes.forEach((scope, i) => {
        expect(capturedEvents[i].scope).toBe(scope);
      });
    });
  });

  describe('Tags sanitization', () => {
    it('should handle malicious tags', () => {
      const logger = satori.createLogger('test');
      const maliciousTags = [
        '<script>alert(1)</script>',
        '" onclick="alert(1)"',
        "' onclick='alert(1)'",
        'javascript:alert(1)'
      ];
      
      // Use tag() method to add tags
      let taggedLogger = logger;
      for (const tag of maliciousTags) {
        taggedLogger = taggedLogger.tag(tag) as typeof logger;
      }
      taggedLogger.info('test');
      
      expect(capturedEvents[0].tags).toEqual(maliciousTags);
    });
  });

  describe('State sanitization', () => {
    it('should handle malicious state values', () => {
      const logger = satori.createLogger('test');
      const maliciousState = {
        html: '<script>alert(1)</script>',
        attr: '" onclick="alert(1)"',
        url: 'javascript:alert(1)',
        nested: {
          deep: '<img src=x onerror=alert(1)>'
        }
      };
      
      logger.info('test', { state: maliciousState });
      
      const state = (capturedEvents[0] as any).state;
      expect(state).toBeDefined();
    });

    it('should handle prototype pollution attempts', () => {
      const logger = satori.createLogger('test');
      
      // These should not pollute Object.prototype
      const maliciousState = {
        '__proto__': { polluted: true },
        'constructor': { prototype: { polluted: true } }
      };
      
      logger.info('test', { state: maliciousState });
      
      // Verify no pollution occurred
      expect(({} as any).polluted).toBeUndefined();
      expect(Object.prototype.hasOwnProperty('polluted')).toBe(false);
    });
  });

  describe('JSON injection', () => {
    it('should handle JSON breaking attempts in messages', () => {
      const logger = satori.createLogger('test');
      const payloads = [
        '"},"injected":"value',
        '{"__proto__":{"admin":true}}',
        'test\n}\n{"injected": true',
        '\\"}],"injected":"value'
      ];
      
      payloads.forEach(payload => {
        logger.info(payload);
      });
      
      // All events should be properly formed
      capturedEvents.forEach(event => {
        expect(event.id).toBeDefined();
        expect(event.timestamp).toBeDefined();
        expect(event.level).toBe('info');
      });
    });
  });

  describe('Template injection', () => {
    it('should handle template literal injection attempts', () => {
      const logger = satori.createLogger('test');
      const payloads = [
        '${alert(1)}',
        '`${alert(1)}`',
        '{{constructor.constructor("alert(1)")()}}',
        '#{alert(1)}'
      ];
      
      payloads.forEach(payload => {
        logger.info(payload);
      });
      
      expect(capturedEvents.length).toBe(payloads.length);
    });
  });

  describe('Path traversal in scope', () => {
    it('should handle path traversal attempts in scope', () => {
      const maliciousScopes = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        'test/../../secret',
        '%2e%2e%2f%2e%2e%2f'
      ];
      
      maliciousScopes.forEach(scope => {
        const logger = satori.createLogger(scope);
        logger.info('test');
      });
      
      // Scopes are just strings for organization, not file paths
      expect(capturedEvents.length).toBe(maliciousScopes.length);
    });
  });

  describe('Large payload handling', () => {
    it('should handle very large messages', () => {
      const logger = satori.createLogger('test');
      const largeMessage = 'x'.repeat(1000000);  // 1MB string
      
      expect(() => logger.info(largeMessage)).not.toThrow();
    });

    it('should handle very large state objects', () => {
      const logger = satori.createLogger('test');
      const largeState: Record<string, string> = {};
      
      for (let i = 0; i < 10000; i++) {
        largeState[`key${i}`] = `value${i}`;
      }
      
      expect(() => logger.info('test', largeState)).not.toThrow();
    });

    it('should handle many tags', () => {
      const logger = satori.createLogger('test');
      let taggedLogger = logger;
      for (let i = 0; i < 100; i++) {
        taggedLogger = taggedLogger.tag(`tag${i}`) as typeof logger;
      }
      
      expect(() => taggedLogger.info('test')).not.toThrow();
    });
  });

  describe('Null byte injection', () => {
    it('should handle null bytes in messages', () => {
      const logger = satori.createLogger('test');
      const payload = 'test\x00<script>alert(1)</script>';
      
      logger.info(payload);
      
      expect(capturedEvents[0].message).toBe(payload);
    });

    it('should handle null bytes in scope', () => {
      const scope = 'test\x00malicious';
      const logger = satori.createLogger(scope);
      
      logger.info('test');
      
      expect(capturedEvents[0].scope).toBe(scope);
    });
  });

  describe('Control character handling', () => {
    it('should handle control characters in messages', () => {
      const logger = satori.createLogger('test');
      const controlChars = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';
      
      logger.info(`test${controlChars}message`);
      
      expect(capturedEvents.length).toBe(1);
    });
  });
});

describe('Input validation', () => {
  it('should handle empty config gracefully', () => {
    // Empty config should use defaults
    const satori = createSatori({});
    expect(satori).toBeDefined();
    satori.dispose();
  });

  it('should handle undefined logger scope', () => {
    const satori = createSatori();
    
    // Should handle undefined gracefully
    expect(() => satori.createLogger(undefined as any)).not.toThrow();
    
    satori.dispose();
  });

  it('should handle null message', () => {
    const satori = createSatori();
    const logger = satori.createLogger('test');
    
    expect(() => logger.info(null as any)).not.toThrow();
    expect(() => logger.info(undefined as any)).not.toThrow();
    
    satori.dispose();
  });

  it('should handle circular references in state', () => {
    const satori = createSatori();
    const logger = satori.createLogger('test');
    
    const circular: any = { a: 1 };
    circular.self = circular;
    
    // Should not throw or hang
    expect(() => logger.info('test', circular)).not.toThrow();
    
    satori.dispose();
  });
});
