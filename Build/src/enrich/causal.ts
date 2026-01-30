const scopeLastEvent = new Map<string, string>();
let globalLastEvent: string | undefined;

export function getCausalLink(scope: string, previousEventId?: string): string | undefined {
  if (previousEventId) {
    return previousEventId;
  }

  return scopeLastEvent.get(scope) || globalLastEvent;
}

export function updateCausalLink(scope: string, eventId: string): void {
  scopeLastEvent.set(scope, eventId);
  globalLastEvent = eventId;
}

export function clearCausalLinks(): void {
  scopeLastEvent.clear();
  globalLastEvent = undefined;
}