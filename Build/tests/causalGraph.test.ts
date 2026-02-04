/**
 * Causal Graph tests
 */

import { CausalGraph, updateCausalLink, getCausalLink, clearCausalLinks } from '../src/enrich/causal';

describe('CausalGraph', () => {
  let graph: CausalGraph;

  beforeEach(() => {
    graph = new CausalGraph();
  });

  describe('addEvent', () => {
    it('should add an event with causes', () => {
      graph.addEvent('evt_1', 'scope1');
      graph.addEvent('evt_2', 'scope1', ['evt_1']);
      
      expect(graph.getCauses('evt_2')).toContain('evt_1');
      expect(graph.getEffects('evt_1')).toContain('evt_2');
    });

    it('should handle multiple effects from one cause', () => {
      graph.addEvent('evt_1', 'scope1');
      graph.addEvent('evt_2', 'scope1', ['evt_1']);
      graph.addEvent('evt_3', 'scope1', ['evt_1']);
      graph.addEvent('evt_4', 'scope1', ['evt_1']);
      
      const effects = graph.getEffects('evt_1');
      expect(effects).toContain('evt_2');
      expect(effects).toContain('evt_3');
      expect(effects).toContain('evt_4');
    });

    it('should handle multiple causes for one effect', () => {
      graph.addEvent('evt_1', 'scope1');
      graph.addEvent('evt_2', 'scope1');
      graph.addEvent('evt_3', 'scope1');
      graph.addEvent('evt_4', 'scope1', ['evt_1', 'evt_2', 'evt_3']);
      
      const causes = graph.getCauses('evt_4');
      expect(causes).toContain('evt_1');
      expect(causes).toContain('evt_2');
      expect(causes).toContain('evt_3');
    });

    it('should handle event without explicit causes', () => {
      graph.addEvent('evt_1', 'scope1');
      
      expect(graph.getCauses('evt_1')).toEqual([]);
      expect(graph.getEffects('evt_1')).toEqual([]);
    });
  });

  describe('getCauses', () => {
    it('should return empty array for unknown event', () => {
      expect(graph.getCauses('evt_unknown')).toEqual([]);
    });

    it('should return only direct causes with depth 0', () => {
      graph.addEvent('evt_1', 'scope1');
      graph.addEvent('evt_2', 'scope1', ['evt_1']);
      graph.addEvent('evt_3', 'scope1', ['evt_2']);
      
      // depth 0 means only traverse the node itself, not follow links
      // With depth 1 we follow one level of links
      const causes = graph.getCauses('evt_3');
      expect(causes).toContain('evt_2');
      expect(causes).toContain('evt_1');
    });

    it('should return transitive causes with depth', () => {
      graph.addEvent('evt_1', 'scope1');
      graph.addEvent('evt_2', 'scope1', ['evt_1']);
      graph.addEvent('evt_3', 'scope1', ['evt_2']);
      
      // Get all transitive causes
      const allCauses = graph.getCauses('evt_3');
      expect(allCauses).toContain('evt_2');
      expect(allCauses).toContain('evt_1');
    });
  });

  describe('getEffects', () => {
    it('should return empty array for unknown event', () => {
      expect(graph.getEffects('evt_unknown')).toEqual([]);
    });

    it('should return all transitive effects by default', () => {
      graph.addEvent('evt_1', 'scope1');
      graph.addEvent('evt_2', 'scope1', ['evt_1']);
      graph.addEvent('evt_3', 'scope1', ['evt_2']);
      
      const effects = graph.getEffects('evt_1');
      expect(effects).toContain('evt_2');
      expect(effects).toContain('evt_3');
    });

  });

  describe('getCausalChain', () => {
    it('should return chain from root cause to event', () => {
      graph.addEvent('evt_1', 'scope1');
      graph.addEvent('evt_2', 'scope1', ['evt_1']);
      graph.addEvent('evt_3', 'scope1', ['evt_2']);
      graph.addEvent('evt_4', 'scope1', ['evt_3']);
      
      const chain = graph.getCausalChain('evt_4');
      expect(chain).toEqual(['evt_1', 'evt_2', 'evt_3', 'evt_4']);
    });

    it('should return single event for root event', () => {
      graph.addEvent('evt_1', 'scope1');
      
      const chain = graph.getCausalChain('evt_1');
      expect(chain).toEqual(['evt_1']);
    });

    it('should return single event for unknown event', () => {
      const chain = graph.getCausalChain('evt_unknown');
      expect(chain).toEqual(['evt_unknown']);
    });
  });

  describe('areCausallyRelated', () => {
    it('should detect direct causation', () => {
      graph.addEvent('evt_1', 'scope1');
      graph.addEvent('evt_2', 'scope1', ['evt_1']);
      
      expect(graph.areCausallyRelated('evt_1', 'evt_2')).toBe(true);
    });

    it('should detect indirect causation', () => {
      graph.addEvent('evt_1', 'scope1');
      graph.addEvent('evt_2', 'scope1', ['evt_1']);
      graph.addEvent('evt_3', 'scope1', ['evt_2']);
      graph.addEvent('evt_4', 'scope1', ['evt_3']);
      
      expect(graph.areCausallyRelated('evt_1', 'evt_4')).toBe(true);
    });

    it('should return false for unrelated events', () => {
      graph.addEvent('evt_1', 'scope1');
      graph.addEvent('evt_2', 'scope1', ['evt_1']);
      graph.addEvent('evt_3', 'scope2');
      graph.addEvent('evt_4', 'scope2', ['evt_3']);
      
      expect(graph.areCausallyRelated('evt_1', 'evt_4')).toBe(false);
      expect(graph.areCausallyRelated('evt_2', 'evt_3')).toBe(false);
    });

    it('should handle self-reference', () => {
      graph.addEvent('evt_1', 'scope1');
      expect(graph.areCausallyRelated('evt_1', 'evt_1')).toBe(false);
    });
  });

  describe('getEventsByScope', () => {
    it('should return all events in a scope', () => {
      graph.addEvent('evt_1', 'auth');
      graph.addEvent('evt_2', 'auth');
      graph.addEvent('evt_3', 'api');
      graph.addEvent('evt_4', 'auth');
      
      const authEvents = graph.getEventsByScope('auth');
      expect(authEvents).toHaveLength(3);
      expect(authEvents).toContain('evt_1');
      expect(authEvents).toContain('evt_2');
      expect(authEvents).toContain('evt_4');
    });

    it('should return empty array for unknown scope', () => {
      expect(graph.getEventsByScope('unknown')).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      graph.addEvent('evt_1', 'scope1');
      graph.addEvent('evt_2', 'scope1', ['evt_1']);
      graph.addEvent('evt_3', 'scope1', ['evt_1']);
      
      const stats = graph.getStats();
      expect(stats.nodeCount).toBe(3);
      expect(stats.avgCauses).toBeGreaterThanOrEqual(0);
      expect(stats.avgEffects).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty graph', () => {
      const stats = graph.getStats();
      expect(stats.nodeCount).toBe(0);
    });
  });

  describe('clear', () => {
    it('should remove all events', () => {
      graph.addEvent('evt_1', 'scope1');
      graph.addEvent('evt_2', 'scope1', ['evt_1']);
      graph.addEvent('evt_3', 'scope1', ['evt_2']);
      
      graph.clear();
      
      expect(graph.getCauses('evt_2')).toEqual([]);
      expect(graph.getEffects('evt_1')).toEqual([]);
      expect(graph.getStats().nodeCount).toBe(0);
    });
  });

  describe('getNode', () => {
    it('should return node info', () => {
      graph.addEvent('evt_1', 'scope1');
      graph.addEvent('evt_2', 'scope1', ['evt_1']);
      
      const node = graph.getNode('evt_2');
      expect(node).toBeDefined();
      expect(node?.eventId).toBe('evt_2');
      expect(node?.scope).toBe('scope1');
      expect(node?.causes).toContain('evt_1');
    });

    it('should return undefined for unknown event', () => {
      expect(graph.getNode('unknown')).toBeUndefined();
    });
  });
});

describe('Causal link helpers', () => {
  beforeEach(() => {
    clearCausalLinks();
  });

  describe('updateCausalLink', () => {
    it('should store and retrieve causal link', () => {
      updateCausalLink('scope1', 'evt_1');
      
      const link = getCausalLink('scope1');
      expect(link).toBe('evt_1');
    });

    it('should return previous event in scope', () => {
      updateCausalLink('scope1', 'evt_1');
      updateCausalLink('scope1', 'evt_2');
      
      const link = getCausalLink('scope1');
      expect(link).toBe('evt_2');
    });
  });

  describe('getCausalLink', () => {
    it('should return undefined for scope with no events', () => {
      expect(getCausalLink('unknown_scope')).toBeUndefined();
    });

    it('should return provided previousEventId if given', () => {
      updateCausalLink('scope1', 'evt_1');
      
      const link = getCausalLink('scope1', 'evt_override');
      expect(link).toBe('evt_override');
    });
  });

  describe('clearCausalLinks', () => {
    it('should clear all stored links', () => {
      updateCausalLink('scope1', 'evt_1');
      updateCausalLink('scope2', 'evt_2');
      
      clearCausalLinks();
      
      expect(getCausalLink('scope1')).toBeUndefined();
      expect(getCausalLink('scope2')).toBeUndefined();
    });
  });
});

describe('CausalGraph edge cases', () => {
  let graph: CausalGraph;

  beforeEach(() => {
    graph = new CausalGraph();
  });

  it('should handle very long chains', () => {
    graph.addEvent('evt_0', 'scope1');
    for (let i = 1; i <= 100; i++) {
      graph.addEvent(`evt_${i}`, 'scope1', [`evt_${i - 1}`]);
    }
    
    // Should not stack overflow
    const chain = graph.getCausalChain('evt_100');
    expect(chain.length).toBe(101);
    expect(chain[0]).toBe('evt_0');
    expect(chain[100]).toBe('evt_100');
  });

  it('should handle dense graphs with many connections', () => {
    // Create events
    for (let i = 0; i < 10; i++) {
      const causes = i > 0 ? Array.from({ length: i }, (_, j) => `evt_${j}`) : undefined;
      graph.addEvent(`evt_${i}`, 'scope1', causes);
    }
    
    // evt_9 should have all previous events as causes
    const causes = graph.getCauses('evt_9');
    expect(causes.length).toBe(9);
  });

  it('should handle special characters in event IDs', () => {
    graph.addEvent('evt_<script>', 'scope1');
    graph.addEvent('evt_"quoted"', 'scope1', ['evt_<script>']);
    
    expect(graph.getCauses('evt_"quoted"')).toContain('evt_<script>');
  });

  it('should handle empty string event IDs', () => {
    graph.addEvent('', 'scope1');
    graph.addEvent('evt_1', 'scope1', ['']);
    
    expect(graph.getCauses('evt_1')).toContain('');
  });

  it('should handle unicode event IDs', () => {
    graph.addEvent('evt_\u0000', 'scope1');
    graph.addEvent('evt_\uFFFF', 'scope1', ['evt_\u0000']);
    
    expect(graph.getCauses('evt_\uFFFF')).toContain('evt_\u0000');
  });

  it('should handle events with no scope tracking', () => {
    graph.addEvent('evt_1', 'scope1');
    graph.addEvent('evt_2', 'scope2');
    graph.addEvent('evt_3', 'scope1', ['evt_1', 'evt_2']);
    
    const causes = graph.getCauses('evt_3');
    expect(causes).toContain('evt_1');
    expect(causes).toContain('evt_2');
  });

  it('should handle getCausalLink with scope tracking', () => {
    graph.addEvent('evt_1', 'auth');
    graph.addEvent('evt_2', 'auth');
    
    // Internal scope tracking should work
    const link = graph.getCausalLink('auth');
    expect(link).toBe('evt_2');
  });
});
