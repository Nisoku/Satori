export interface CallsiteInfo {
  file: string;
  line: number;
  column: number;
  function?: string;
}

export function extractCallsite(depth = 2): string | undefined {
  try {
    const stack = new Error().stack;
    if (!stack) return undefined;

    const lines = stack.split("\n");
    const callerLine = lines[depth];

    if (!callerLine) return undefined;

    const match =
      callerLine.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/) ||
      callerLine.match(/at\s+(.+?):(\d+):(\d+)/);

    if (match) {
      const [, func, file, line, column] = match;
      return `${file}:${line}:${column}${func ? ` (${func})` : ""}`;
    }

    return callerLine.trim();
  } catch {
    return undefined;
  }
}
