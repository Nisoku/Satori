let counter = 0;
const base = Date.now().toString(36);

export function generateId(): string {
  return `${base}-${++counter}`;
}
