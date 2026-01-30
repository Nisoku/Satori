export function now(): number {
  return Date.now();
}

export function formatTimestamp(ts: number): string {
  return new Date(ts).toISOString();
}