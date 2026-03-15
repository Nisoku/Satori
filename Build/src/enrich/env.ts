import type {
  SatoriConfig,
  EnvironmentInfo,
  RuntimePlatform,
} from "../core/types.js";

/**
 * Detect the current runtime platform
 */
export function detectPlatform(): RuntimePlatform {
  // Check for Deno
  if (typeof globalThis !== "undefined" && "Deno" in globalThis) {
    return "deno";
  }

  // Check for Bun
  if (typeof globalThis !== "undefined" && "Bun" in globalThis) {
    return "bun";
  }

  // Check for Cloudflare Workers
  if (
    typeof globalThis !== "undefined" &&
    "caches" in globalThis &&
    typeof (globalThis as Record<string, unknown>).caches === "object" &&
    !("window" in globalThis)
  ) {
    return "cloudflare-workers";
  }

  // Check for Edge runtime (Vercel Edge, etc.)
  if (typeof globalThis !== "undefined" && "EdgeRuntime" in globalThis) {
    return "edge";
  }

  // Check for browser
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    return "browser";
  }

  // Check for Node.js
  if (
    typeof process !== "undefined" &&
    process.versions &&
    process.versions.node
  ) {
    return "node";
  }

  return "unknown";
}

/**
 * Get environment information based on the current platform
 */
export function getEnvInfo(config: SatoriConfig): EnvironmentInfo {
  const platform = detectPlatform();

  const env: EnvironmentInfo = {
    platform,
    appVersion: config.appVersion,
  };

  switch (platform) {
    case "browser":
      if (typeof navigator !== "undefined") {
        env.userAgent = navigator.userAgent;
      }
      if (typeof window !== "undefined") {
        env.url = window.location?.href;
        if (typeof document !== "undefined") {
          env.referrer = document.referrer;
        }
      }
      break;

    case "node":
      if (typeof process !== "undefined") {
        env.nodeVersion = process.version;
        env.arch = process.arch;
        if (process.env.NODE_ENV) {
          env.nodeEnv = process.env.NODE_ENV;
        }
      }
      break;

    case "deno":
      try {
        const Deno = (globalThis as Record<string, unknown>).Deno as {
          version?: { deno?: string; v8?: string; typescript?: string };
          build?: { os?: string; arch?: string };
        };
        if (Deno?.version) {
          env.denoVersion = Deno.version.deno;
          env.v8Version = Deno.version.v8;
          env.typescriptVersion = Deno.version.typescript;
        }
        if (Deno?.build) {
          env.os = Deno.build.os;
          env.arch = Deno.build.arch;
        }
      } catch {
        // Deno APIs might be restricted
      }
      break;

    case "bun":
      try {
        const Bun = (globalThis as Record<string, unknown>).Bun as {
          version?: string;
          revision?: string;
        };
        if (Bun?.version) {
          env.bunVersion = Bun.version;
        }
        if (Bun?.revision) {
          env.bunRevision = Bun.revision;
        }
      } catch {
        // Bun APIs might be restricted
      }
      break;

    case "cloudflare-workers":
      // Limited info available in Workers
      env.runtime = "cloudflare-workers";
      break;

    case "edge":
      try {
        const EdgeRuntime = (globalThis as Record<string, unknown>)
          .EdgeRuntime as string;
        env.edgeRuntime = EdgeRuntime;
      } catch {
        // Edge runtime info might be restricted
      }
      break;
  }

  return env;
}
