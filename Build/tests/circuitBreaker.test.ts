import { CircuitBreaker, CircuitOpenError } from '../src/bus/circuitBreaker';
import type { CircuitBreakerConfig } from '../src/core/types';

describe('CircuitBreaker', () => {
  const defaultConfig: CircuitBreakerConfig = {
    enabled: true,
    failureThreshold: 3,
    resetTimeout: 1000,
    successThreshold: 2
  };

  describe('when disabled', () => {
    it('should always allow execution', () => {
      const cb = new CircuitBreaker({ ...defaultConfig, enabled: false });

      // Should allow even with failures
      for (let i = 0; i < 10; i++) {
        try {
          cb.executeSync(() => {
            throw new Error('fail');
          });
        } catch (e) {
          // Expected
        }
      }

      expect(cb.canExecute()).toBe(true);
    });
  });

  describe('closed state', () => {
    it('should start in closed state', () => {
      const cb = new CircuitBreaker(defaultConfig);
      expect(cb.getState()).toBe('closed');
    });

    it('should allow execution in closed state', () => {
      const cb = new CircuitBreaker(defaultConfig);
      expect(cb.canExecute()).toBe(true);
    });

    it('should execute functions successfully', () => {
      const cb = new CircuitBreaker(defaultConfig);
      const result = cb.executeSync(() => 42);
      expect(result).toBe(42);
    });

    it('should stay closed on success', () => {
      const cb = new CircuitBreaker(defaultConfig);
      
      cb.executeSync(() => 1);
      cb.executeSync(() => 2);
      
      expect(cb.getState()).toBe('closed');
    });

    it('should open after failure threshold', () => {
      const cb = new CircuitBreaker(defaultConfig);

      for (let i = 0; i < defaultConfig.failureThreshold; i++) {
        try {
          cb.executeSync(() => {
            throw new Error('fail');
          });
        } catch (e) {
          // Expected
        }
      }

      expect(cb.getState()).toBe('open');
    });
  });

  describe('open state', () => {
    it('should reject execution in open state', () => {
      const cb = new CircuitBreaker(defaultConfig);

      // Force open
      for (let i = 0; i < defaultConfig.failureThreshold; i++) {
        try {
          cb.executeSync(() => {
            throw new Error('fail');
          });
        } catch (e) {
          // Expected
        }
      }

      expect(cb.getState()).toBe('open');
      expect(cb.canExecute()).toBe(false);

      expect(() => {
        cb.executeSync(() => 'test');
      }).toThrow(CircuitOpenError);
    });
  });

  describe('half-open state', () => {
    it('should transition to half-open after reset timeout', async () => {
      const cb = new CircuitBreaker({
        ...defaultConfig,
        resetTimeout: 50
      });

      // Force open
      for (let i = 0; i < defaultConfig.failureThreshold; i++) {
        try {
          cb.executeSync(() => {
            throw new Error('fail');
          });
        } catch (e) {
          // Expected
        }
      }

      expect(cb.getState()).toBe('open');

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should now be able to execute (transition to half-open)
      expect(cb.canExecute()).toBe(true);
      expect(cb.getState()).toBe('half-open');
    });

    it('should close after success threshold in half-open', async () => {
      const cb = new CircuitBreaker({
        ...defaultConfig,
        resetTimeout: 50,
        successThreshold: 2
      });

      // Force open
      for (let i = 0; i < defaultConfig.failureThreshold; i++) {
        try {
          cb.executeSync(() => {
            throw new Error('fail');
          });
        } catch (e) {
          // Expected
        }
      }

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 100));

      // Execute successfully twice
      cb.executeSync(() => 'success');
      cb.executeSync(() => 'success');

      expect(cb.getState()).toBe('closed');
    });

    it('should reopen on failure in half-open', async () => {
      const cb = new CircuitBreaker({
        ...defaultConfig,
        resetTimeout: 50
      });

      // Force open
      for (let i = 0; i < defaultConfig.failureThreshold; i++) {
        try {
          cb.executeSync(() => {
            throw new Error('fail');
          });
        } catch (e) {
          // Expected
        }
      }

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 100));

      // canExecute() triggers the state transition to half-open
      expect(cb.canExecute()).toBe(true);
      expect(cb.getState()).toBe('half-open');

      // Fail in half-open
      try {
        cb.executeSync(() => {
          throw new Error('fail');
        });
      } catch (e) {
        // Expected
      }

      expect(cb.getState()).toBe('open');
    });
  });

  describe('events', () => {
    it('should emit state change events', () => {
      const stateChanges: string[] = [];
      
      const cb = new CircuitBreaker(defaultConfig, {
        onStateChange: (state) => stateChanges.push(state)
      });

      // Force open
      for (let i = 0; i < defaultConfig.failureThreshold; i++) {
        try {
          cb.executeSync(() => {
            throw new Error('fail');
          });
        } catch (e) {
          // Expected
        }
      }

      expect(stateChanges).toContain('open');
    });

    it('should emit failure events', () => {
      let failureCount = 0;
      
      const cb = new CircuitBreaker(defaultConfig, {
        onFailure: () => failureCount++
      });

      try {
        cb.executeSync(() => {
          throw new Error('fail');
        });
      } catch (e) {
        // Expected
      }

      expect(failureCount).toBe(1);
    });
  });

  describe('statistics', () => {
    it('should track statistics', () => {
      const cb = new CircuitBreaker(defaultConfig);

      cb.executeSync(() => 'success');
      
      try {
        cb.executeSync(() => {
          throw new Error('fail');
        });
      } catch (e) {
        // Expected
      }

      const stats = cb.getStats();
      expect(stats.totalSuccesses).toBe(1);
      expect(stats.totalFailures).toBe(1);
    });
  });

  describe('manual control', () => {
    it('should allow forcing open', () => {
      const cb = new CircuitBreaker(defaultConfig);
      
      cb.forceOpen();
      
      expect(cb.getState()).toBe('open');
    });

    it('should allow forcing closed', () => {
      const cb = new CircuitBreaker(defaultConfig);
      
      cb.forceOpen();
      cb.forceClose();
      
      expect(cb.getState()).toBe('closed');
    });

    it('should allow resetting', () => {
      const cb = new CircuitBreaker(defaultConfig);
      
      // Force some failures
      try {
        cb.executeSync(() => {
          throw new Error('fail');
        });
      } catch (e) {
        // Expected
      }

      cb.reset();

      const stats = cb.getStats();
      expect(stats.failureCount).toBe(0);
      expect(stats.totalFailures).toBe(0);
      expect(cb.getState()).toBe('closed');
    });
  });

  describe('async execution', () => {
    it('should handle async functions', async () => {
      const cb = new CircuitBreaker(defaultConfig);
      
      const result = await cb.execute(async () => {
        return 'async result';
      });

      expect(result).toBe('async result');
    });

    it('should handle async failures', async () => {
      const cb = new CircuitBreaker(defaultConfig);

      await expect(cb.execute(async () => {
        throw new Error('async fail');
      })).rejects.toThrow('async fail');
    });
  });
});
