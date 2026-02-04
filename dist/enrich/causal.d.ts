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
export declare class CausalGraph {
    private nodes;
    private scopeLastEvent;
    private globalLastEvent;
    private maxNodes;
    /**
     * Add a new event to the causal graph
     */
    addEvent(eventId: string, scope: string, causeEventIds?: string[]): void;
    /**
     * Get the causal link for a new event
     */
    getCausalLink(scope: string, previousEventId?: string): string | undefined;
    /**
     * Get all causes (direct and transitive) for an event
     */
    getCauses(eventId: string, depth?: number): string[];
    /**
     * Get all effects (direct and transitive) for an event
     */
    getEffects(eventId: string, depth?: number): string[];
    /**
     * Get the causal chain from root to an event
     */
    getCausalChain(eventId: string): string[];
    /**
     * Get node information
     */
    getNode(eventId: string): CausalNode | undefined;
    /**
     * Check if two events are causally related
     */
    areCausallyRelated(eventId1: string, eventId2: string): boolean;
    /**
     * Get events in the same scope
     */
    getEventsByScope(scope: string): string[];
    /**
     * Prune oldest nodes to stay within memory limits
     */
    private pruneOldest;
    /**
     * Clear all causal links
     */
    clear(): void;
    /**
     * Get statistics about the causal graph
     */
    getStats(): {
        nodeCount: number;
        avgCauses: number;
        avgEffects: number;
    };
}
export declare function getCausalLink(scope: string, previousEventId?: string): string | undefined;
export declare function updateCausalLink(scope: string, eventId: string, causeEventIds?: string[]): void;
export declare function clearCausalLinks(): void;
export declare function getCausalGraph(): CausalGraph;
export declare const causalGraph: {
    getCauses: (eventId: string, depth?: number) => string[];
    getEffects: (eventId: string, depth?: number) => string[];
    getCausalChain: (eventId: string) => string[];
    areCausallyRelated: (eventId1: string, eventId2: string) => boolean;
    getEventsByScope: (scope: string) => string[];
    getStats: () => {
        nodeCount: number;
        avgCauses: number;
        avgEffects: number;
    };
};
export {};
