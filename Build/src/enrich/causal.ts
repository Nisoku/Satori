/**
 * Enhanced Causal Links Module
 * Supports complex causality graphs with forward and backward links
 */

interface CausalNode {
  eventId: string;
  scope: string;
  timestamp: number;
  /** IDs of events that caused this event */
  causes: string[];
  /** IDs of events that this event caused */
  effects: string[];
}

export class CausalGraph {
  private nodes = new Map<string, CausalNode>();
  private scopeLastEvent = new Map<string, string>();
  private globalLastEvent: string | undefined;
  private maxNodes = 10000;

  /**
   * Add a new event to the causal graph
   */
  addEvent(eventId: string, scope: string, causeEventIds?: string[]): void {
    const node: CausalNode = {
      eventId,
      scope,
      timestamp: Date.now(),
      causes: causeEventIds || [],
      effects: [],
    };

    // Add forward links from cause events
    if (causeEventIds) {
      for (const causeId of causeEventIds) {
        const causeNode = this.nodes.get(causeId);
        if (causeNode) {
          causeNode.effects.push(eventId);
        }
      }
    }

    this.nodes.set(eventId, node);
    this.scopeLastEvent.set(scope, eventId);
    this.globalLastEvent = eventId;

    // Prune old nodes if we exceed max
    if (this.nodes.size > this.maxNodes) {
      this.pruneOldest(Math.floor(this.maxNodes * 0.1));
    }
  }

  /**
   * Get the causal link for a new event
   */
  getCausalLink(scope: string, previousEventId?: string): string | undefined {
    if (previousEventId) {
      return previousEventId;
    }
    return this.scopeLastEvent.get(scope) || this.globalLastEvent;
  }

  /**
   * Get all causes (direct and transitive) for an event
   */
  getCauses(eventId: string, depth = Infinity): string[] {
    const causes = new Set<string>();
    const visited = new Set<string>();

    const traverse = (id: string, currentDepth: number) => {
      if (visited.has(id) || currentDepth > depth) return;
      visited.add(id);

      const node = this.nodes.get(id);
      if (!node) return;

      for (const causeId of node.causes) {
        causes.add(causeId);
        traverse(causeId, currentDepth + 1);
      }
    };

    traverse(eventId, 0);
    return Array.from(causes);
  }

  /**
   * Get all effects (direct and transitive) for an event
   */
  getEffects(eventId: string, depth = Infinity): string[] {
    const effects = new Set<string>();
    const visited = new Set<string>();

    const traverse = (id: string, currentDepth: number) => {
      if (visited.has(id) || currentDepth > depth) return;
      visited.add(id);

      const node = this.nodes.get(id);
      if (!node) return;

      for (const effectId of node.effects) {
        effects.add(effectId);
        traverse(effectId, currentDepth + 1);
      }
    };

    traverse(eventId, 0);
    return Array.from(effects);
  }

  /**
   * Get the causal chain from root to an event
   */
  getCausalChain(eventId: string): string[] {
    const chain: string[] = [];
    let currentId: string | undefined = eventId;
    const visited = new Set<string>();

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      chain.unshift(currentId);

      const node = this.nodes.get(currentId);
      if (!node || node.causes.length === 0) break;

      // Follow the first cause (primary chain)
      currentId = node.causes[0];
    }

    return chain;
  }

  /**
   * Get node information
   */
  getNode(eventId: string): CausalNode | undefined {
    return this.nodes.get(eventId);
  }

  /**
   * Check if two events are causally related
   */
  areCausallyRelated(eventId1: string, eventId2: string): boolean {
    const causes1 = this.getCauses(eventId1);
    const effects1 = this.getEffects(eventId1);

    return causes1.includes(eventId2) || effects1.includes(eventId2);
  }

  /**
   * Get events in the same scope
   */
  getEventsByScope(scope: string): string[] {
    const events: string[] = [];
    for (const [id, node] of this.nodes) {
      if (node.scope === scope) {
        events.push(id);
      }
    }
    return events;
  }

  /**
   * Prune oldest nodes to stay within memory limits
   */
  private pruneOldest(count: number): void {
    const sortedNodes = Array.from(this.nodes.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)
      .slice(0, count);

    for (const [id] of sortedNodes) {
      const node = this.nodes.get(id);
      if (node) {
        // Remove references from cause nodes
        for (const causeId of node.causes) {
          const causeNode = this.nodes.get(causeId);
          if (causeNode) {
            causeNode.effects = causeNode.effects.filter((e) => e !== id);
          }
        }
        // Remove references from effect nodes
        for (const effectId of node.effects) {
          const effectNode = this.nodes.get(effectId);
          if (effectNode) {
            effectNode.causes = effectNode.causes.filter((c) => c !== id);
          }
        }
      }
      this.nodes.delete(id);
    }
  }

  /**
   * Clear all causal links
   */
  clear(): void {
    this.nodes.clear();
    this.scopeLastEvent.clear();
    this.globalLastEvent = undefined;
  }

  /**
   * Get statistics about the causal graph
   */
  getStats(): { nodeCount: number; avgCauses: number; avgEffects: number } {
    let totalCauses = 0;
    let totalEffects = 0;

    for (const node of this.nodes.values()) {
      totalCauses += node.causes.length;
      totalEffects += node.effects.length;
    }

    const count = this.nodes.size || 1;
    return {
      nodeCount: this.nodes.size,
      avgCauses: totalCauses / count,
      avgEffects: totalEffects / count,
    };
  }
}

// Global causal graph instance
const globalCausalGraph = new CausalGraph();

// Legacy API for backwards compatibility
const scopeLastEvent = new Map<string, string>();
let _globalLastEvent: string | undefined;

export function getCausalLink(
  scope: string,
  previousEventId?: string,
): string | undefined {
  return globalCausalGraph.getCausalLink(scope, previousEventId);
}

export function updateCausalLink(
  scope: string,
  eventId: string,
  causeEventIds?: string[],
): void {
  globalCausalGraph.addEvent(eventId, scope, causeEventIds);

  // Also maintain legacy maps for compatibility
  scopeLastEvent.set(scope, eventId);
  _globalLastEvent = eventId;
}

export function clearCausalLinks(): void {
  globalCausalGraph.clear();
  scopeLastEvent.clear();
  _globalLastEvent = undefined;
}

// Export the graph for advanced usage
export function getCausalGraph(): CausalGraph {
  return globalCausalGraph;
}

// Export graph operations
export const causalGraph = {
  getCauses: (eventId: string, depth?: number) =>
    globalCausalGraph.getCauses(eventId, depth),
  getEffects: (eventId: string, depth?: number) =>
    globalCausalGraph.getEffects(eventId, depth),
  getCausalChain: (eventId: string) =>
    globalCausalGraph.getCausalChain(eventId),
  areCausallyRelated: (eventId1: string, eventId2: string) =>
    globalCausalGraph.areCausallyRelated(eventId1, eventId2),
  getEventsByScope: (scope: string) =>
    globalCausalGraph.getEventsByScope(scope),
  getStats: () => globalCausalGraph.getStats(),
};
