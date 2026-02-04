class M {
  constructor(e) {
    this.config = e;
  }
  eventTimestamps = [];
  buffer = [];
  droppedCount = 0;
  sampledCount = 0;
  /**
   * Check if an event should be allowed through
   * Returns: { allowed: boolean, sampled?: boolean }
   */
  shouldAllow(e) {
    if (!this.config.enabled)
      return { allowed: !0, sampled: !1 };
    const t = Date.now();
    if (this.eventTimestamps = this.eventTimestamps.filter((r) => t - r < 1e3), this.eventTimestamps.length < this.config.maxEventsPerSecond)
      return this.eventTimestamps.push(t), { allowed: !0, sampled: !1 };
    switch (this.config.strategy) {
      case "drop":
        return this.droppedCount++, { allowed: !1, sampled: !1 };
      case "sample":
        return Math.random() < this.config.samplingRate ? (this.eventTimestamps.push(t), this.sampledCount++, { allowed: !0, sampled: !0 }) : (this.droppedCount++, { allowed: !1, sampled: !1 });
      case "buffer":
        return this.buffer.length < (this.config.bufferSize || 100) ? this.buffer.push(e) : this.droppedCount++, { allowed: !1, sampled: !1 };
      default:
        return { allowed: !0, sampled: !1 };
    }
  }
  /**
   * Get buffered events and clear the buffer
   */
  flushBuffer() {
    const e = [...this.buffer];
    return this.buffer = [], e;
  }
  /**
   * Get current rate (events per second)
   */
  getCurrentRate() {
    const e = Date.now();
    return this.eventTimestamps = this.eventTimestamps.filter((t) => e - t < 1e3), this.eventTimestamps.length;
  }
  /**
   * Get statistics
   */
  getStats() {
    return {
      dropped: this.droppedCount,
      sampled: this.sampledCount,
      buffered: this.buffer.length,
      currentRate: this.getCurrentRate()
    };
  }
  /**
   * Reset statistics
   */
  reset() {
    this.eventTimestamps = [], this.buffer = [], this.droppedCount = 0, this.sampledCount = 0;
  }
  /**
   * Update configuration
   */
  updateConfig(e) {
    this.config = { ...this.config, ...e };
  }
}
function m(s, e, t = /* @__PURE__ */ new WeakMap()) {
  if (s === e) return !0;
  if (typeof s == "number" && typeof e == "number")
    return Number.isNaN(s) && Number.isNaN(e) ? !0 : s === e;
  if (s === null || e === null || s === void 0 || e === void 0) return s === e;
  if (typeof s != typeof e || typeof s != "object") return !1;
  const i = s, r = e;
  if (t.has(i))
    return t.get(i) === r;
  if (t.set(i, r), s instanceof Date && e instanceof Date)
    return s.getTime() === e.getTime();
  if (s instanceof Date || e instanceof Date) return !1;
  if (s instanceof RegExp && e instanceof RegExp)
    return s.source === e.source && s.flags === e.flags;
  if (s instanceof RegExp || e instanceof RegExp) return !1;
  if (s instanceof Map && e instanceof Map) {
    if (s.size !== e.size) return !1;
    for (const [c, l] of s)
      if (!e.has(c) || !m(l, e.get(c), t)) return !1;
    return !0;
  }
  if (s instanceof Map || e instanceof Map) return !1;
  if (s instanceof Set && e instanceof Set) {
    if (s.size !== e.size) return !1;
    const c = Array.from(s), l = Array.from(e);
    for (const u of c) {
      let d = !1;
      for (const h of l)
        if (m(u, h, t)) {
          d = !0;
          break;
        }
      if (!d) return !1;
    }
    return !0;
  }
  if (s instanceof Set || e instanceof Set) return !1;
  if (Array.isArray(s) && Array.isArray(e)) {
    if (s.length !== e.length) return !1;
    const c = Object.keys(s).filter((h) => /^\d+$/.test(h)).map(Number), l = Object.keys(e).filter((h) => /^\d+$/.test(h)).map(Number);
    if (c.length !== l.length) return !1;
    for (const h of c)
      if (!l.includes(h)) return !1;
    for (let h = 0; h < s.length; h++) {
      const T = Object.prototype.hasOwnProperty.call(s, h), $ = Object.prototype.hasOwnProperty.call(e, h);
      if (T !== $ || T && !m(s[h], e[h], t)) return !1;
    }
    const u = Object.keys(s).filter((h) => !/^\d+$/.test(h)), d = Object.keys(e).filter((h) => !/^\d+$/.test(h));
    if (u.length !== d.length) return !1;
    for (const h of u)
      if (!Object.prototype.hasOwnProperty.call(e, h) || !m(s[h], e[h], t)) return !1;
    return !0;
  }
  if (Array.isArray(s) !== Array.isArray(e)) return !1;
  const n = s, o = e, a = Object.keys(n), f = Object.keys(o);
  if (a.length !== f.length) return !1;
  for (const c of a)
    if (!Object.prototype.hasOwnProperty.call(o, c) || !m(n[c], o[c], t)) return !1;
  return !0;
}
function p(s, e = /* @__PURE__ */ new WeakMap()) {
  if (s == null || typeof s != "object") return s;
  const t = s;
  if (e.has(t))
    return e.get(t);
  if (s instanceof Date)
    return new Date(s.getTime());
  if (s instanceof RegExp)
    return new RegExp(s.source, s.flags);
  if (s instanceof Map) {
    const r = /* @__PURE__ */ new Map();
    e.set(t, r);
    for (const [n, o] of s)
      r.set(p(n, e), p(o, e));
    return r;
  }
  if (s instanceof Set) {
    const r = /* @__PURE__ */ new Set();
    e.set(t, r);
    for (const n of s)
      r.add(p(n, e));
    return r;
  }
  if (Array.isArray(s)) {
    const r = [];
    e.set(t, r);
    for (let n = 0; n < s.length; n++)
      Object.prototype.hasOwnProperty.call(s, n) && (r[n] = p(s[n], e));
    for (const n of Object.keys(s))
      /^\d+$/.test(n) || (r[n] = p(s[n], e));
    return r;
  }
  const i = {};
  e.set(t, i);
  for (const r of Object.keys(s))
    i[r] = p(s[r], e);
  return i;
}
function b(s, e = /* @__PURE__ */ new WeakSet()) {
  return s === null ? "null" : s === void 0 ? "undefined" : typeof s == "string" ? `s:${s}` : typeof s == "number" ? Number.isNaN(s) ? "n:NaN" : `n:${s}` : typeof s == "boolean" ? `b:${s}` : typeof s != "object" ? String(s) : e.has(s) ? "[Circular]" : (e.add(s), s instanceof Date ? `d:${s.getTime()}` : s instanceof RegExp ? `r:${s.source}:${s.flags}` : s instanceof Map ? `m:{${Array.from(s.entries()).map(([r, n]) => `${b(r, e)}=>${b(n, e)}`).sort().join(",")}}` : s instanceof Set ? `set:{${Array.from(s).map((r) => b(r, e)).sort().join(",")}}` : Array.isArray(s) ? `a:[${s.map((r, n) => Object.prototype.hasOwnProperty.call(s, n) ? b(r, e) : "<empty>").join(",")}]` : `o:{${Object.entries(s).sort(([i], [r]) => i.localeCompare(r)).map(([i, r]) => `${i}:${b(r, e)}`).join(",")}}`);
}
class F {
  constructor(e) {
    this.config = e;
  }
  cache = /* @__PURE__ */ new Map();
  deduplicatedCount = 0;
  /**
   * Compute a deduplication key for an entry based on configured fields
   */
  computeDedupKey(e) {
    const t = [];
    for (const i of this.config.fields)
      switch (i) {
        case "message":
          t.push(`m:${e.message}`);
          break;
        case "scope":
          t.push(`s:${e.scope}`);
          break;
        case "level":
          t.push(`l:${e.level}`);
          break;
        case "tags":
          t.push(`t:${e.tags.sort().join(",")}`);
          break;
        case "state":
          e.state && t.push(`st:${b(e.state)}`);
          break;
      }
    return t.join("|");
  }
  /**
   * Check if an event is a duplicate
   * Returns: { isDuplicate: boolean, originalId?: string, duplicateCount: number }
   */
  isDuplicate(e) {
    if (!this.config.enabled)
      return { isDuplicate: !1, duplicateCount: 0 };
    const t = Date.now(), i = this.computeDedupKey(e);
    this.cleanExpired(t);
    const r = this.cache.get(i);
    return r && t - r.timestamp < this.config.windowMs ? (r.count++, this.deduplicatedCount++, { isDuplicate: !0, duplicateCount: r.count }) : (this.cache.set(i, {
      hash: i,
      timestamp: t,
      count: 1
    }), this.cache.size > this.config.maxCacheSize && this.evictOldest(), { isDuplicate: !1, duplicateCount: 1 });
  }
  /**
   * Clean expired entries from cache
   */
  cleanExpired(e) {
    for (const [t, i] of this.cache.entries())
      e - i.timestamp >= this.config.windowMs && this.cache.delete(t);
  }
  /**
   * Evict oldest entries when cache is full
   */
  evictOldest() {
    let e = null, t = 1 / 0;
    for (const [i, r] of this.cache.entries())
      r.timestamp < t && (t = r.timestamp, e = i);
    e && this.cache.delete(e);
  }
  /**
   * Get statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      deduplicatedCount: this.deduplicatedCount
    };
  }
  /**
   * Reset the deduplicator
   */
  reset() {
    this.cache.clear(), this.deduplicatedCount = 0;
  }
  /**
   * Update configuration
   */
  updateConfig(e) {
    this.config = { ...this.config, ...e };
  }
}
class I {
  constructor(e, t = {}) {
    this.config = e, this.events = t;
  }
  state = "closed";
  failureCount = 0;
  successCount = 0;
  lastFailureTime = 0;
  totalFailures = 0;
  totalSuccesses = 0;
  /**
   * Execute a function with circuit breaker protection
   */
  async execute(e) {
    if (!this.config.enabled)
      return e();
    if (!this.canExecute())
      throw new L("Circuit breaker is open");
    try {
      const t = await e();
      return this.recordSuccess(), t;
    } catch (t) {
      throw this.recordFailure(t instanceof Error ? t : new Error(String(t))), t;
    }
  }
  /**
   * Execute synchronously with circuit breaker protection
   */
  executeSync(e) {
    if (!this.config.enabled)
      return e();
    if (!this.canExecute())
      throw new L("Circuit breaker is open");
    try {
      const t = e();
      return this.recordSuccess(), t;
    } catch (t) {
      throw this.recordFailure(t instanceof Error ? t : new Error(String(t))), t;
    }
  }
  /**
   * Check if execution is allowed
   */
  canExecute() {
    return this.state === "closed" ? !0 : this.state === "open" ? Date.now() - this.lastFailureTime >= this.config.resetTimeout ? (this.transitionTo("half-open"), !0) : !1 : !0;
  }
  /**
   * Record a successful execution
   */
  recordSuccess() {
    this.totalSuccesses++, this.events.onSuccess?.(this.successCount + 1), this.state === "half-open" ? (this.successCount++, this.successCount >= this.config.successThreshold && this.transitionTo("closed")) : this.state === "closed" && (this.failureCount = 0);
  }
  /**
   * Record a failed execution
   */
  recordFailure(e) {
    this.totalFailures++, this.failureCount++, this.lastFailureTime = Date.now(), this.events.onFailure?.(e, this.failureCount), this.state === "half-open" ? this.transitionTo("open") : this.state === "closed" && this.failureCount >= this.config.failureThreshold && this.transitionTo("open");
  }
  /**
   * Transition to a new state
   */
  transitionTo(e) {
    const t = this.state;
    this.state = e, e === "closed" ? (this.failureCount = 0, this.successCount = 0, this.events.onClose?.()) : e === "open" ? (this.successCount = 0, this.events.onOpen?.()) : e === "half-open" && (this.successCount = 0, this.events.onHalfOpen?.()), this.events.onStateChange?.(e, t);
  }
  /**
   * Get current state
   */
  getState() {
    return this.state;
  }
  /**
   * Get statistics
   */
  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
      lastFailureTime: this.lastFailureTime
    };
  }
  /**
   * Manually reset the circuit breaker
   */
  reset() {
    this.transitionTo("closed"), this.failureCount = 0, this.successCount = 0, this.totalFailures = 0, this.totalSuccesses = 0, this.lastFailureTime = 0;
  }
  /**
   * Force the circuit open (for testing/manual intervention)
   */
  forceOpen() {
    this.transitionTo("open"), this.lastFailureTime = Date.now();
  }
  /**
   * Force the circuit closed (for testing/manual intervention)
   */
  forceClose() {
    this.transitionTo("closed");
  }
}
class L extends Error {
  constructor(e) {
    super(e), this.name = "CircuitOpenError";
  }
}
class C {
  startTime;
  totalPublished = 0;
  totalDropped = 0;
  totalSampled = 0;
  totalDeduplicated = 0;
  recentEvents = [];
  loggerCount = 0;
  watcherCount = 0;
  subscriberCount = 0;
  bufferSize = 0;
  circuitState = "closed";
  // For tracking events per second
  eventTimestamps = [];
  // Historical snapshots for trending
  snapshots = [];
  maxSnapshots = 60;
  // Keep last 60 snapshots (e.g., 1 per second = 1 minute)
  constructor() {
    this.startTime = Date.now();
  }
  /**
   * Record a published event
   */
  recordPublished() {
    this.totalPublished++;
    const e = Date.now();
    this.eventTimestamps.push(e), this.eventTimestamps = this.eventTimestamps.filter((t) => e - t < 1e3);
  }
  /**
   * Record a dropped event
   */
  recordDropped() {
    this.totalDropped++;
  }
  /**
   * Record a sampled event
   */
  recordSampled() {
    this.totalSampled++;
  }
  /**
   * Record a deduplicated event
   */
  recordDeduplicated() {
    this.totalDeduplicated++;
  }
  /**
   * Update logger count
   */
  setLoggerCount(e) {
    this.loggerCount = e;
  }
  /**
   * Update watcher count
   */
  setWatcherCount(e) {
    this.watcherCount = e;
  }
  /**
   * Update subscriber count
   */
  setSubscriberCount(e) {
    this.subscriberCount = e;
  }
  /**
   * Update buffer size
   */
  setBufferSize(e) {
    this.bufferSize = e;
  }
  /**
   * Update circuit state
   */
  setCircuitState(e) {
    this.circuitState = e;
  }
  /**
   * Get current events per second
   */
  getEventsPerSecond() {
    const e = Date.now();
    return this.eventTimestamps = this.eventTimestamps.filter((t) => e - t < 1e3), this.eventTimestamps.length;
  }
  /**
   * Get current bus metrics
   */
  getBusMetrics() {
    return {
      totalPublished: this.totalPublished,
      totalDropped: this.totalDropped,
      totalSampled: this.totalSampled,
      totalDeduplicated: this.totalDeduplicated,
      eventsPerSecond: this.getEventsPerSecond(),
      bufferSize: this.bufferSize,
      subscriberCount: this.subscriberCount
    };
  }
  /**
   * Get full Satori metrics
   */
  getMetrics() {
    return {
      bus: this.getBusMetrics(),
      loggerCount: this.loggerCount,
      watcherCount: this.watcherCount,
      circuitState: this.circuitState,
      uptime: Date.now() - this.startTime
    };
  }
  /**
   * Take a snapshot for historical tracking
   */
  takeSnapshot() {
    const e = {
      timestamp: Date.now(),
      bus: this.getBusMetrics(),
      loggerCount: this.loggerCount,
      watcherCount: this.watcherCount,
      circuitState: this.circuitState,
      uptime: Date.now() - this.startTime
    };
    return this.snapshots.push(e), this.snapshots.length > this.maxSnapshots && (this.snapshots = this.snapshots.slice(-this.maxSnapshots)), e;
  }
  /**
   * Get historical snapshots
   */
  getSnapshots() {
    return [...this.snapshots];
  }
  /**
   * Get average events per second over time
   */
  getAverageEventsPerSecond() {
    return this.snapshots.length === 0 ? 0 : this.snapshots.reduce((t, i) => t + i.bus.eventsPerSecond, 0) / this.snapshots.length;
  }
  /**
   * Reset all metrics
   */
  reset() {
    this.startTime = Date.now(), this.totalPublished = 0, this.totalDropped = 0, this.totalSampled = 0, this.totalDeduplicated = 0, this.eventTimestamps = [], this.snapshots = [];
  }
}
let w = null;
function he() {
  return w || (w = new C()), w;
}
function de() {
  w = null;
}
const k = {
  enabled: !1,
  maxEventsPerSecond: 1e3,
  samplingRate: 0.1,
  strategy: "sample",
  bufferSize: 100
}, B = {
  enabled: !1,
  windowMs: 5e3,
  fields: ["message", "scope", "level"],
  maxCacheSize: 1e3
}, E = {
  enabled: !1,
  failureThreshold: 5,
  resetTimeout: 3e4,
  successThreshold: 3
}, y = {
  enableCallsite: !0,
  enableEnvInfo: !0,
  enableStateSnapshot: !1,
  enableCausalLinks: !0,
  enableMetrics: !0,
  enableConsole: !0,
  stateSelectors: [],
  maxBufferSize: 1e3,
  logLevel: "info",
  appVersion: "1.0.0",
  pollingInterval: 250,
  // More reasonable default
  customLevels: [],
  rateLimiting: k,
  deduplication: B,
  circuitBreaker: E
};
class R {
  subscribers = [];
  middleware = [];
  buffer = [];
  maxBufferSize;
  rateLimiter;
  deduplicator;
  circuitBreaker;
  metrics;
  enableMetrics;
  constructor(e = {}) {
    typeof e == "number" && (e = { maxBufferSize: e }), this.maxBufferSize = e.maxBufferSize || 1e3, this.enableMetrics = e.enableMetrics ?? !0, this.rateLimiter = new M({
      ...k,
      ...e.rateLimiting
    }), this.deduplicator = new F({
      ...B,
      ...e.deduplication
    }), this.circuitBreaker = new I({
      ...E,
      ...e.circuitBreaker
    }, {
      onStateChange: (t) => {
        this.enableMetrics && this.metrics.setCircuitState(t);
      }
    }), this.metrics = new C();
  }
  publish(e) {
    if (!e.__internal?.isReplay && !e.skipDedup && this.deduplicator.isDuplicate(e).isDuplicate) {
      this.enableMetrics && this.metrics.recordDeduplicated();
      return;
    }
    if (!e.__internal?.isReplay && !e.skipRateLimit) {
      const t = this.rateLimiter.shouldAllow(e);
      if (!t.allowed) {
        this.enableMetrics && this.metrics.recordDropped();
        return;
      }
      t.sampled && (e.__internal = e.__internal || {}, e.__internal.sampled = !0, this.enableMetrics && this.metrics.recordSampled());
    }
    try {
      this.circuitBreaker.executeSync(() => {
        this.doPublish(e);
      }), this.enableMetrics && (this.metrics.recordPublished(), this.metrics.setBufferSize(this.buffer.length), this.metrics.setSubscriberCount(this.subscribers.length));
    } catch {
      this.enableMetrics && this.metrics.recordDropped();
    }
  }
  doPublish(e) {
    let t = 0;
    const i = () => {
      if (t >= this.middleware.length) {
        this.subscribers.forEach((n) => n(e)), this.addToBuffer(e);
        return;
      }
      const r = this.middleware[t];
      t++, r(e, i);
    };
    i();
  }
  subscribe(e) {
    return this.subscribers.push(e), this.enableMetrics && this.metrics.setSubscriberCount(this.subscribers.length), () => {
      const t = this.subscribers.indexOf(e);
      t >= 0 && (this.subscribers.splice(t, 1), this.enableMetrics && this.metrics.setSubscriberCount(this.subscribers.length));
    };
  }
  use(e) {
    this.middleware.push(e);
  }
  getReplayBuffer() {
    return [...this.buffer];
  }
  getMetrics() {
    return this.metrics.getBusMetrics();
  }
  /**
   * Get the rate limiter instance for advanced configuration
   */
  getRateLimiter() {
    return this.rateLimiter;
  }
  /**
   * Get the deduplicator instance for advanced configuration
   */
  getDeduplicator() {
    return this.deduplicator;
  }
  /**
   * Get the circuit breaker instance for advanced configuration
   */
  getCircuitBreaker() {
    return this.circuitBreaker;
  }
  /**
   * Clear the event buffer
   */
  clearBuffer() {
    this.buffer.length = 0, this.enableMetrics && this.metrics.setBufferSize(0);
  }
  /**
   * Reset all state
   */
  reset() {
    this.buffer.length = 0, this.middleware.length = 0, this.rateLimiter.reset(), this.deduplicator.reset(), this.circuitBreaker.reset(), this.metrics.reset();
  }
  addToBuffer(e) {
    this.buffer.push(e), this.buffer.length > this.maxBufferSize && this.buffer.shift();
  }
}
let A = 0;
const N = Date.now().toString(36);
function O() {
  return `${N}-${++A}`;
}
function z() {
  return Date.now();
}
function pe(s) {
  return new Date(s).toISOString();
}
function j(s = 2) {
  try {
    const e = new Error().stack;
    if (!e) return;
    const i = e.split(`
`)[s];
    if (!i) return;
    const r = i.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/) || i.match(/at\s+(.+?):(\d+):(\d+)/);
    if (r) {
      const [, n, o, a, f] = r;
      return `${o}:${a}:${f}${n ? ` (${n})` : ""}`;
    }
    return i.trim();
  } catch {
    return;
  }
}
function P() {
  return typeof globalThis < "u" && "Deno" in globalThis ? "deno" : typeof globalThis < "u" && "Bun" in globalThis ? "bun" : typeof globalThis < "u" && "caches" in globalThis && typeof globalThis.caches == "object" && !("window" in globalThis) ? "cloudflare-workers" : typeof globalThis < "u" && "EdgeRuntime" in globalThis ? "edge" : typeof window < "u" && typeof document < "u" ? "browser" : typeof process < "u" && process.versions && process.versions.node ? "node" : "unknown";
}
function V(s) {
  const e = P(), t = {
    platform: e,
    appVersion: s.appVersion
  };
  switch (e) {
    case "browser":
      typeof navigator < "u" && (t.userAgent = navigator.userAgent), typeof window < "u" && (t.url = window.location?.href, typeof document < "u" && (t.referrer = document.referrer));
      break;
    case "node":
      typeof process < "u" && (t.nodeVersion = process.version, t.arch = process.arch, process.env.NODE_ENV && (t.nodeEnv = process.env.NODE_ENV));
      break;
    case "deno":
      try {
        const i = globalThis.Deno;
        i?.version && (t.denoVersion = i.version.deno, t.v8Version = i.version.v8, t.typescriptVersion = i.version.typescript), i?.build && (t.os = i.build.os, t.arch = i.build.arch);
      } catch {
      }
      break;
    case "bun":
      try {
        const i = globalThis.Bun;
        i?.version && (t.bunVersion = i.version), i?.revision && (t.bunRevision = i.revision);
      } catch {
      }
      break;
    case "cloudflare-workers":
      t.runtime = "cloudflare-workers";
      break;
    case "edge":
      try {
        const i = globalThis.EdgeRuntime;
        t.edgeRuntime = i;
      } catch {
      }
      break;
  }
  return t;
}
function _(s) {
  if (!s.stateSelectors || s.stateSelectors.length === 0)
    return;
  const e = {};
  for (let t = 0; t < s.stateSelectors.length; t++) {
    const i = s.stateSelectors[t], r = typeof i == "function" ? i : i.selector, n = typeof i == "function" ? `selector_${t}` : i.name || `selector_${t}`;
    try {
      const o = r();
      o != null && (e[n] = p(o));
    } catch (o) {
      e[`${n}_error`] = o instanceof Error ? o.message : String(o);
    }
  }
  return Object.keys(e).length > 0 ? e : void 0;
}
function ge(s, e) {
  return { name: s, selector: e };
}
function me(...s) {
  const e = {};
  for (const t of s)
    t && Object.assign(e, t);
  return e;
}
function be(s, e) {
  const t = [], i = [], r = [], n = new Set(s ? Object.keys(s) : []), o = new Set(e ? Object.keys(e) : []);
  for (const a of o)
    n.has(a) || t.push(a);
  for (const a of n)
    o.has(a) || i.push(a);
  for (const a of n)
    o.has(a) && s && e && JSON.stringify(s[a]) !== JSON.stringify(e[a]) && r.push(a);
  return { added: t, removed: i, changed: r };
}
class W {
  nodes = /* @__PURE__ */ new Map();
  scopeLastEvent = /* @__PURE__ */ new Map();
  globalLastEvent;
  maxNodes = 1e4;
  /**
   * Add a new event to the causal graph
   */
  addEvent(e, t, i) {
    const r = {
      eventId: e,
      scope: t,
      timestamp: Date.now(),
      causes: i || [],
      effects: []
    };
    if (i)
      for (const n of i) {
        const o = this.nodes.get(n);
        o && o.effects.push(e);
      }
    this.nodes.set(e, r), this.scopeLastEvent.set(t, e), this.globalLastEvent = e, this.nodes.size > this.maxNodes && this.pruneOldest(Math.floor(this.maxNodes * 0.1));
  }
  /**
   * Get the causal link for a new event
   */
  getCausalLink(e, t) {
    return t || this.scopeLastEvent.get(e) || this.globalLastEvent;
  }
  /**
   * Get all causes (direct and transitive) for an event
   */
  getCauses(e, t = 1 / 0) {
    const i = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set(), n = (o, a) => {
      if (r.has(o) || a > t) return;
      r.add(o);
      const f = this.nodes.get(o);
      if (f)
        for (const c of f.causes)
          i.add(c), n(c, a + 1);
    };
    return n(e, 0), Array.from(i);
  }
  /**
   * Get all effects (direct and transitive) for an event
   */
  getEffects(e, t = 1 / 0) {
    const i = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set(), n = (o, a) => {
      if (r.has(o) || a > t) return;
      r.add(o);
      const f = this.nodes.get(o);
      if (f)
        for (const c of f.effects)
          i.add(c), n(c, a + 1);
    };
    return n(e, 0), Array.from(i);
  }
  /**
   * Get the causal chain from root to an event
   */
  getCausalChain(e) {
    const t = [];
    let i = e;
    const r = /* @__PURE__ */ new Set();
    for (; i && !r.has(i); ) {
      r.add(i), t.unshift(i);
      const n = this.nodes.get(i);
      if (!n || n.causes.length === 0) break;
      i = n.causes[0];
    }
    return t;
  }
  /**
   * Get node information
   */
  getNode(e) {
    return this.nodes.get(e);
  }
  /**
   * Check if two events are causally related
   */
  areCausallyRelated(e, t) {
    const i = this.getCauses(e), r = this.getEffects(e);
    return i.includes(t) || r.includes(t);
  }
  /**
   * Get events in the same scope
   */
  getEventsByScope(e) {
    const t = [];
    for (const [i, r] of this.nodes)
      r.scope === e && t.push(i);
    return t;
  }
  /**
   * Prune oldest nodes to stay within memory limits
   */
  pruneOldest(e) {
    const t = Array.from(this.nodes.entries()).sort(([, i], [, r]) => i.timestamp - r.timestamp).slice(0, e);
    for (const [i] of t) {
      const r = this.nodes.get(i);
      if (r) {
        for (const n of r.causes) {
          const o = this.nodes.get(n);
          o && (o.effects = o.effects.filter((a) => a !== i));
        }
        for (const n of r.effects) {
          const o = this.nodes.get(n);
          o && (o.causes = o.causes.filter((a) => a !== i));
        }
      }
      this.nodes.delete(i);
    }
  }
  /**
   * Clear all causal links
   */
  clear() {
    this.nodes.clear(), this.scopeLastEvent.clear(), this.globalLastEvent = void 0;
  }
  /**
   * Get statistics about the causal graph
   */
  getStats() {
    let e = 0, t = 0;
    for (const r of this.nodes.values())
      e += r.causes.length, t += r.effects.length;
    const i = this.nodes.size || 1;
    return {
      nodeCount: this.nodes.size,
      avgCauses: e / i,
      avgEffects: t / i
    };
  }
}
const g = new W(), x = /* @__PURE__ */ new Map();
function K(s, e) {
  return g.getCausalLink(s, e);
}
function H(s, e, t) {
  g.addEvent(e, s, t), x.set(s, e);
}
function ve() {
  g.clear(), x.clear();
}
function ye() {
  return g;
}
const we = {
  getCauses: (s, e) => g.getCauses(s, e),
  getEffects: (s, e) => g.getEffects(s, e),
  getCausalChain: (s) => g.getCausalChain(s),
  areCausallyRelated: (s, e) => g.areCausallyRelated(s, e),
  getEventsByScope: (s) => g.getEventsByScope(s),
  getStats: () => g.getStats()
};
function G(s, e, t) {
  const i = O(), r = z(), n = [
    ...s.inheritedTags || [],
    ...s.options?.tags || []
  ], o = {
    id: i,
    timestamp: r,
    level: s.level,
    scope: s.scope,
    message: s.message,
    tags: n,
    cause: s.inheritedCause || s.options?.cause,
    causeEventId: s.inheritedCauseEventId || s.options?.causeEventId,
    suggest: s.options?.suggest
  };
  if (s.options?.state && (o.state = { ...s.options.state }), e.enableCallsite && !o.__internal?.isReplay && (o.callsite = j(4)), e.enableEnvInfo && !o.__internal?.isReplay && (o.env = V(e)), e.enableStateSnapshot && !o.__internal?.isReplay) {
    const a = _(e);
    a && (o.state = { ...o.state, ...a });
  }
  if (e.enableCausalLinks && !o.__internal?.isReplay) {
    const a = K(s.scope, t);
    a && (o.previousEventId = a);
  }
  return o;
}
class U {
  constructor(e, t) {
    this.logger = e, this.config = t, this.circuitBreaker = new I({
      ...E,
      enabled: t.circuitBreaker?.enabled ?? !1,
      ...t.circuitBreaker
    }, {
      onOpen: () => {
        this.logger.warn("WatcherEngine circuit breaker opened: too many errors", {
          tags: ["watcher", "circuit-breaker"]
        });
      },
      onClose: () => {
        this.logger.info("WatcherEngine circuit breaker closed: recovered", {
          tags: ["watcher", "circuit-breaker"]
        });
      }
    });
  }
  watchers = /* @__PURE__ */ new Map();
  whenHandlers = /* @__PURE__ */ new Map();
  circuitBreaker;
  disposed = !1;
  watch(e, t) {
    if (this.disposed)
      throw new Error("WatcherEngine has been disposed");
    const i = this.generateId(), r = typeof e == "function" ? e : () => e, n = {
      id: i,
      getValue: r,
      label: t,
      lastValue: void 0,
      errorCount: 0,
      disposed: !1
    }, o = () => {
      if (!(n.disposed || this.disposed))
        try {
          this.circuitBreaker.executeSync(() => {
            const f = r();
            if (!m(f, n.lastValue)) {
              const c = t || `watch_${i}`;
              let l;
              if (typeof f == "object" && f !== null)
                l = `${c}: state changed`;
              else {
                const u = this.formatValue(n.lastValue), d = this.formatValue(f);
                l = `${c}: ${u} -> ${d}`;
              }
              this.logger.info(l, {
                tags: ["watch"],
                state: {
                  [`${c}_prev`]: p(n.lastValue),
                  [`${c}_current`]: p(f)
                }
              }), n.lastValue = p(f);
            }
            n.errorCount = 0;
          });
        } catch (f) {
          n.errorCount++, (n.errorCount <= 3 || n.errorCount % 10 === 0) && this.logger.error(`Watch error for ${t || i} (count: ${n.errorCount})`, {
            tags: ["watch", "error"],
            state: { error: f instanceof Error ? f.message : String(f) }
          }), n.errorCount >= 50 && (this.logger.error(`Watch ${t || i} disposed due to repeated errors`, {
            tags: ["watch", "error", "auto-disposed"]
          }), this.disposeWatcher(i));
        }
    };
    o();
    const a = setInterval(o, this.config.pollingInterval || 250);
    return n.intervalId = a, this.watchers.set(i, n), {
      dispose: () => this.disposeWatcher(i)
    };
  }
  when(e, t, i) {
    if (this.disposed)
      throw new Error("WatcherEngine has been disposed");
    const r = this.generateId(), n = typeof e == "function" ? e : () => e, o = {
      id: r,
      getValue: n,
      predicate: t,
      onTrigger: i,
      lastValue: void 0,
      intervalId: null,
      errorCount: 0,
      disposed: !1
    }, f = setInterval(() => {
      if (!(o.disposed || this.disposed))
        try {
          this.circuitBreaker.executeSync(() => {
            const c = n(), l = o.lastValue !== void 0 ? p(o.lastValue) : void 0, u = p(c);
            t(l, u) && i(u, l), o.lastValue = u, o.errorCount = 0;
          });
        } catch (c) {
          o.errorCount++, (o.errorCount <= 3 || o.errorCount % 10 === 0) && this.logger.error(`When condition error for ${r} (count: ${o.errorCount})`, {
            tags: ["when", "error"],
            state: { error: c instanceof Error ? c.message : String(c) }
          }), o.errorCount >= 50 && (this.logger.error(`When handler ${r} disposed due to repeated errors`, {
            tags: ["when", "error", "auto-disposed"]
          }), this.disposeWhenHandler(r));
        }
    }, this.config.pollingInterval || 250);
    return o.intervalId = f, this.whenHandlers.set(r, o), {
      dispose: () => this.disposeWhenHandler(r)
    };
  }
  disposeWatcher(e) {
    const t = this.watchers.get(e);
    t && (t.disposed = !0, t.intervalId && clearInterval(t.intervalId), this.watchers.delete(e));
  }
  disposeWhenHandler(e) {
    const t = this.whenHandlers.get(e);
    t && (t.disposed = !0, t.intervalId && clearInterval(t.intervalId), this.whenHandlers.delete(e));
  }
  generateId() {
    return Math.random().toString(36).substring(2, 11);
  }
  formatValue(e) {
    return e === void 0 ? "undefined" : e === null ? "null" : typeof e == "string" ? `"${e}"` : typeof e == "number" || typeof e == "boolean" ? String(e) : Array.isArray(e) ? `Array(${e.length})` : typeof e == "object" ? `Object(${Object.keys(e).length} keys)` : String(e);
  }
  /**
   * Get the number of active watchers
   */
  getWatcherCount() {
    return this.watchers.size + this.whenHandlers.size;
  }
  /**
   * Get circuit breaker state
   */
  getCircuitState() {
    return this.circuitBreaker.getState();
  }
  /**
   * Dispose all watchers and clean up
   */
  dispose() {
    this.disposed || (this.disposed = !0, this.watchers.forEach((e) => {
      e.disposed = !0, e.intervalId && clearInterval(e.intervalId);
    }), this.whenHandlers.forEach((e) => {
      e.disposed = !0, e.intervalId && clearInterval(e.intervalId);
    }), this.watchers.clear(), this.whenHandlers.clear());
  }
  /**
   * Check if the engine has been disposed
   */
  isDisposed() {
    return this.disposed;
  }
}
const q = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};
class v {
  constructor(e, t, i, r) {
    if (this.scope = e, this.config = t, this.bus = i, this.lastEventId = r, this.watcherEngine = new U(this, t), this.levelSeverities = { ...q }, t.customLevels)
      for (const n of t.customLevels)
        this.levelSeverities[n.name] = n.severity;
  }
  inheritedTags = [];
  inheritedCause;
  inheritedCauseEventId;
  watcherEngine;
  disposed = !1;
  levelSeverities;
  event(e, t) {
    this.log("info", e, t);
  }
  info(e, t) {
    this.log("info", e, t);
  }
  warn(e, t) {
    this.log("warn", e, t);
  }
  error(e, t) {
    this.log("error", e, t);
  }
  debug(e, t) {
    this.log("debug", e, t);
  }
  /**
   * Log with any level (built-in or custom)
   */
  log(e, t, i) {
    if (this.disposed) {
      console.warn(`Attempted to log on disposed logger (scope: ${this.scope})`);
      return;
    }
    e in this.levelSeverities || (console.warn(`Unknown log level: ${e}, defaulting to info`), e = "info");
    const r = this.config.logLevel || "info", n = this.levelSeverities[r] ?? 1;
    if ((this.levelSeverities[e] ?? 1) < n)
      return;
    const a = G(
      {
        level: e,
        scope: this.scope,
        message: t,
        options: i,
        inheritedTags: this.inheritedTags,
        inheritedCause: this.inheritedCause,
        inheritedCauseEventId: this.inheritedCauseEventId
      },
      this.config,
      this.lastEventId
    ), f = this.inheritedCauseEventId ? [this.inheritedCauseEventId] : void 0;
    H(this.scope, a.id, f), this.lastEventId = a.id, this.bus.publish(a);
  }
  tag(...e) {
    const t = new v(this.scope, this.config, this.bus, this.lastEventId);
    return t.inheritedTags = [...this.inheritedTags, ...e], t.inheritedCause = this.inheritedCause, t.inheritedCauseEventId = this.inheritedCauseEventId, t;
  }
  causedBy(e) {
    const t = new v(this.scope, this.config, this.bus, this.lastEventId);
    return t.inheritedTags = [...this.inheritedTags], typeof e == "string" ? t.inheritedCause = e : (t.inheritedCause = e.message, t.inheritedCauseEventId = e.id), t;
  }
  watch(e, t) {
    if (this.disposed)
      throw new Error(`Cannot create watch on disposed logger (scope: ${this.scope})`);
    return this.watcherEngine.watch(e, t);
  }
  when(e, t, i) {
    if (this.disposed)
      throw new Error(`Cannot create when handler on disposed logger (scope: ${this.scope})`);
    return this.watcherEngine.when(e, t, i);
  }
  /**
   * Get the number of active watchers on this logger
   */
  getWatcherCount() {
    return this.watcherEngine.getWatcherCount();
  }
  /**
   * Dispose this logger and all its watchers
   */
  dispose() {
    this.disposed || (this.disposed = !0, this.watcherEngine.dispose());
  }
  /**
   * Check if this logger has been disposed
   */
  isDisposed() {
    return this.disposed;
  }
}
const S = ["debug", "info", "warn", "error"];
function D(s) {
  const e = [], t = [];
  if (s.enableCallsite !== void 0 && typeof s.enableCallsite != "boolean" && e.push("enableCallsite must be a boolean"), s.enableEnvInfo !== void 0 && typeof s.enableEnvInfo != "boolean" && e.push("enableEnvInfo must be a boolean"), s.enableStateSnapshot !== void 0 && typeof s.enableStateSnapshot != "boolean" && e.push("enableStateSnapshot must be a boolean"), s.enableCausalLinks !== void 0 && typeof s.enableCausalLinks != "boolean" && e.push("enableCausalLinks must be a boolean"), s.stateSelectors !== void 0 && (Array.isArray(s.stateSelectors) ? s.stateSelectors.forEach((i, r) => {
    typeof i != "function" && e.push(`stateSelectors[${r}] must be a function`);
  }) : e.push("stateSelectors must be an array")), s.maxBufferSize !== void 0 && (typeof s.maxBufferSize != "number" ? e.push("maxBufferSize must be a number") : s.maxBufferSize < 1 ? e.push("maxBufferSize must be at least 1") : s.maxBufferSize > 1e5 && t.push("maxBufferSize is very large (>100000), this may cause memory issues")), s.logLevel !== void 0 && (S.includes(s.logLevel) || e.push(`logLevel must be one of: ${S.join(", ")}`)), s.appVersion !== void 0 && typeof s.appVersion != "string" && e.push("appVersion must be a string"), s.pollingInterval !== void 0 && (typeof s.pollingInterval != "number" ? e.push("pollingInterval must be a number") : s.pollingInterval < 10 ? e.push("pollingInterval must be at least 10ms") : s.pollingInterval < 50 && t.push("pollingInterval is very low (<50ms), this may impact performance")), s.rateLimiting !== void 0)
    if (typeof s.rateLimiting != "object" || s.rateLimiting === null)
      e.push("rateLimiting must be an object");
    else {
      const i = s.rateLimiting;
      i.enabled !== void 0 && typeof i.enabled != "boolean" && e.push("rateLimiting.enabled must be a boolean"), i.maxEventsPerSecond !== void 0 && (typeof i.maxEventsPerSecond != "number" ? e.push("rateLimiting.maxEventsPerSecond must be a number") : i.maxEventsPerSecond < 1 && e.push("rateLimiting.maxEventsPerSecond must be at least 1")), i.samplingRate !== void 0 && (typeof i.samplingRate != "number" ? e.push("rateLimiting.samplingRate must be a number") : (i.samplingRate < 0 || i.samplingRate > 1) && e.push("rateLimiting.samplingRate must be between 0 and 1"));
    }
  if (s.deduplication !== void 0)
    if (typeof s.deduplication != "object" || s.deduplication === null)
      e.push("deduplication must be an object");
    else {
      const i = s.deduplication;
      if (i.enabled !== void 0 && typeof i.enabled != "boolean" && e.push("deduplication.enabled must be a boolean"), i.windowMs !== void 0 && (typeof i.windowMs != "number" ? e.push("deduplication.windowMs must be a number") : i.windowMs < 100 && e.push("deduplication.windowMs must be at least 100ms")), i.fields !== void 0)
        if (!Array.isArray(i.fields))
          e.push("deduplication.fields must be an array");
        else {
          const r = ["message", "scope", "level", "tags", "state"];
          i.fields.forEach((n, o) => {
            typeof n != "string" ? e.push(`deduplication.fields[${o}] must be a string`) : r.includes(n) || e.push(`deduplication.fields[${o}] "${n}" is not a valid field. Valid fields: ${r.join(", ")}`);
          });
        }
    }
  if (s.customLevels !== void 0)
    if (!Array.isArray(s.customLevels))
      e.push("customLevels must be an array");
    else {
      const i = /* @__PURE__ */ new Set(), r = ["log", "event"];
      s.customLevels.forEach((n, o) => {
        typeof n.name != "string" || n.name.trim() === "" ? e.push(`customLevels[${o}].name must be a non-empty string`) : (i.has(n.name) && e.push(`customLevels[${o}].name "${n.name}" is a duplicate`), i.add(n.name), r.includes(n.name.toLowerCase()) && e.push(`customLevels[${o}].name "${n.name}" is a reserved method name`), S.includes(n.name) && t.push(`customLevels[${o}].name "${n.name}" shadows a built-in level`)), typeof n.severity != "number" && e.push(`customLevels[${o}].severity must be a number`);
      });
    }
  return {
    valid: e.length === 0,
    errors: e,
    warnings: t
  };
}
function Se(s) {
  const e = D(s);
  if (!e.valid)
    throw new Error(`Invalid Satori configuration:
${e.errors.join(`
`)}`);
}
class Ce {
  name = "memory";
  store = [];
  maxSize;
  constructor(e = 1e4) {
    this.maxSize = e;
  }
  async write(e) {
    this.store.push(...e), this.store.length > this.maxSize && (this.store = this.store.slice(-this.maxSize));
  }
  async read(e) {
    let t = [...this.store];
    return e?.startTime && (t = t.filter((i) => i.timestamp >= e.startTime)), e?.endTime && (t = t.filter((i) => i.timestamp <= e.endTime)), e?.levels?.length && (t = t.filter((i) => e.levels.includes(i.level))), e?.scopes?.length && (t = t.filter((i) => e.scopes.includes(i.scope))), e?.offset && (t = t.slice(e.offset)), e?.limit && (t = t.slice(0, e.limit)), t;
  }
  async clear() {
    this.store = [];
  }
  async close() {
  }
  getSize() {
    return this.store.length;
  }
}
class Ee {
  name = "localStorage";
  storageKey;
  maxSize;
  constructor(e = "satori_logs", t = 1e3) {
    this.storageKey = e, this.maxSize = t;
  }
  async write(e) {
    if (typeof localStorage > "u")
      throw new Error("localStorage is not available in this environment");
    const r = [...await this.read(), ...e].slice(-this.maxSize);
    localStorage.setItem(this.storageKey, JSON.stringify(r));
  }
  async read(e) {
    if (typeof localStorage > "u")
      return [];
    const t = localStorage.getItem(this.storageKey);
    if (!t) return [];
    let i;
    try {
      i = JSON.parse(t);
    } catch {
      return [];
    }
    return e?.startTime && (i = i.filter((r) => r.timestamp >= e.startTime)), e?.endTime && (i = i.filter((r) => r.timestamp <= e.endTime)), e?.levels?.length && (i = i.filter((r) => e.levels.includes(r.level))), e?.scopes?.length && (i = i.filter((r) => e.scopes.includes(r.scope))), e?.offset && (i = i.slice(e.offset)), e?.limit && (i = i.slice(0, e.limit)), i;
  }
  async clear() {
    typeof localStorage < "u" && localStorage.removeItem(this.storageKey);
  }
  async close() {
  }
}
class Te {
  name = "indexedDB";
  dbName;
  storeName = "logs";
  db = null;
  maxSize;
  constructor(e = "satori", t = 1e5) {
    this.dbName = e, this.maxSize = t;
  }
  async getDB() {
    return this.db ? this.db : new Promise((e, t) => {
      if (typeof indexedDB > "u") {
        t(new Error("IndexedDB is not available in this environment"));
        return;
      }
      const i = indexedDB.open(this.dbName, 1);
      i.onerror = () => t(i.error), i.onsuccess = () => {
        this.db = i.result, e(this.db);
      }, i.onupgradeneeded = () => {
        const r = i.result;
        if (!r.objectStoreNames.contains(this.storeName)) {
          const n = r.createObjectStore(this.storeName, { keyPath: "id" });
          n.createIndex("timestamp", "timestamp"), n.createIndex("level", "level"), n.createIndex("scope", "scope");
        }
      };
    });
  }
  async write(e) {
    const t = await this.getDB();
    return new Promise((i, r) => {
      const n = t.transaction(this.storeName, "readwrite"), o = n.objectStore(this.storeName);
      for (const a of e)
        o.put(a);
      n.oncomplete = () => i(), n.onerror = () => r(n.error);
    });
  }
  async read(e) {
    const t = await this.getDB();
    return new Promise((i, r) => {
      const a = t.transaction(this.storeName, "readonly").objectStore(this.storeName).index("timestamp"), f = [], c = a.openCursor();
      c.onsuccess = () => {
        const l = c.result;
        if (l) {
          const u = l.value;
          let d = !0;
          e?.startTime && u.timestamp < e.startTime && (d = !1), e?.endTime && u.timestamp > e.endTime && (d = !1), e?.levels?.length && !e.levels.includes(u.level) && (d = !1), e?.scopes?.length && !e.scopes.includes(u.scope) && (d = !1), d && f.push(u), l.continue();
        } else {
          let u = f;
          e?.offset && (u = u.slice(e.offset)), e?.limit && (u = u.slice(0, e.limit)), i(u);
        }
      }, c.onerror = () => r(c.error);
    });
  }
  async clear() {
    const e = await this.getDB();
    return new Promise((t, i) => {
      const o = e.transaction(this.storeName, "readwrite").objectStore(this.storeName).clear();
      o.onsuccess = () => t(), o.onerror = () => i(o.error);
    });
  }
  async close() {
    this.db && (this.db.close(), this.db = null);
  }
}
class Le {
  name = "console";
  inMemory = [];
  async write(e) {
    for (const t of e) {
      const i = t.level;
      (console[i === "debug" ? "log" : i] ?? console.log)(`[${t.scope}] ${t.message}`, t), this.inMemory.push(t);
    }
  }
  async read() {
    return [...this.inMemory];
  }
  async clear() {
    this.inMemory = [];
  }
  async close() {
  }
}
class J {
  buffer = [];
  flushTimer = null;
  config;
  constructor(e) {
    this.config = e, e.enabled && e.flushInterval && this.startAutoFlush();
  }
  /**
   * Add an entry to the persistence buffer
   */
  add(e) {
    this.config.enabled && (this.buffer.push(e), this.config.batchSize && this.buffer.length >= this.config.batchSize && this.flush());
  }
  /**
   * Flush the buffer to the adapter
   */
  async flush() {
    if (this.buffer.length === 0) return;
    const e = [...this.buffer];
    this.buffer = [];
    try {
      await this.config.adapter.write(e);
    } catch (t) {
      throw this.buffer.length < 1e4 && (this.buffer = [...e, ...this.buffer]), t;
    }
  }
  /**
   * Start auto-flush timer
   */
  startAutoFlush() {
    this.flushTimer || (this.flushTimer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.config.flushInterval));
  }
  /**
   * Stop auto-flush and close adapter
   */
  async close() {
    this.flushTimer && (clearInterval(this.flushTimer), this.flushTimer = null), await this.flush(), await this.config.adapter.close?.();
  }
  /**
   * Get buffer size
   */
  getBufferSize() {
    return this.buffer.length;
  }
}
function Ie(s = {}) {
  const e = D(s);
  if (!e.valid)
    throw new Error(`Invalid Satori configuration:
${e.errors.join(`
`)}`);
  e.warnings.length > 0 && console.warn("Satori configuration warnings:", e.warnings);
  const t = {
    ...y,
    ...s,
    // Merge nested configs properly
    rateLimiting: { ...y.rateLimiting, ...s.rateLimiting },
    deduplication: { ...y.deduplication, ...s.deduplication },
    circuitBreaker: { ...y.circuitBreaker, ...s.circuitBreaker }
  }, i = new R({
    maxBufferSize: t.maxBufferSize,
    rateLimiting: t.rateLimiting,
    deduplication: t.deduplication,
    circuitBreaker: t.circuitBreaker,
    enableMetrics: t.enableMetrics
  });
  !(typeof process < "u" && process.env?.NODE_ENV === "test") && t.enableConsole !== !1 && typeof console < "u" && i.subscribe((l) => {
    const u = l.level;
    (console[u === "debug" ? "log" : u] ?? console.log)(`[${l.scope}] ${l.message}`, l);
  });
  const n = new v("root", t, i), o = /* @__PURE__ */ new Map();
  o.set("root", n);
  let a = null;
  t.persistence?.enabled && (a = new J(t.persistence), i.subscribe((l) => {
    a?.add(l);
  }));
  const f = new C(), c = Date.now();
  return {
    config: t,
    bus: i,
    rootLogger: n,
    createLogger(l) {
      const u = new v(l, t, i);
      return o.set(l, u), f.setLoggerCount(o.size), u;
    },
    getMetrics() {
      let l = 0;
      for (const u of o.values())
        u.isDisposed() || (l += u.getWatcherCount());
      return f.setWatcherCount(l), {
        bus: i.getMetrics(),
        loggerCount: o.size,
        watcherCount: l,
        circuitState: i.getCircuitBreaker().getState(),
        uptime: Date.now() - c
      };
    },
    async flush() {
      a && await a.flush();
    },
    dispose() {
      for (const u of o.values())
        u.dispose();
      o.clear();
      const l = i.getReplayBuffer?.();
      l && (l.length = 0), i.reset(), a && a.close().catch(console.error);
    }
  };
}
const Q = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};
function X(s, e, t) {
  if (!e) return s;
  const i = { ...Q };
  if (t)
    for (const n of t)
      i[n.name] = n.severity;
  const r = i[e] ?? 1;
  return s.filter((n) => (i[n.level] ?? 1) >= r);
}
function Y(s, e) {
  return e.length === 0 ? s : s.filter((t) => e.includes(t.scope));
}
function Z(s, e) {
  const t = typeof e == "string" ? new RegExp(e) : e;
  return s.filter((i) => t.test(i.scope));
}
function ee(s, e) {
  return e.length === 0 ? s : s.filter((t) => e.some((i) => t.tags.includes(i)));
}
function te(s, e) {
  return e.length === 0 ? s : s.filter((t) => e.every((i) => t.tags.includes(i)));
}
function se(s, e) {
  if (!e || e.trim() === "") return s;
  const t = e.toLowerCase();
  return s.filter(
    (i) => i.message.toLowerCase().includes(t) || i.scope.toLowerCase().includes(t) || i.tags.some((r) => r.toLowerCase().includes(t))
  );
}
function ie(s, e) {
  const t = typeof e == "string" ? new RegExp(e, "i") : e;
  return s.filter(
    (i) => t.test(i.message) || t.test(i.scope) || i.tags.some((r) => t.test(r))
  );
}
function re(s, e, t) {
  return s.filter((i) => !(e && i.timestamp < e || t && i.timestamp > t));
}
function ne(s, e) {
  const t = Date.now() - e;
  return s.filter((i) => i.timestamp >= t);
}
function oe(s, e) {
  return s.filter((t) => t.causeEventId === e);
}
function ae(s) {
  return s.filter((e) => e.causeEventId !== void 0);
}
function ce(s, e) {
  return s.filter((t) => e(t.state));
}
function le(s, e) {
  return s.filter((t) => t.state && e in t.state);
}
function ke(s, e, t) {
  return s.filter(
    (i) => i.state && i.state[e] === t
  );
}
function ue(s, e) {
  let t = s;
  "level" in e && e.level && (t = X(t, e.level, e.customLevels)), "scopes" in e && e.scopes && e.scopes.length > 0 && (t = Y(t, e.scopes)), "scopePattern" in e && e.scopePattern && (t = Z(t, e.scopePattern)), "tags" in e && e.tags && e.tags.length > 0 && (t = ee(t, e.tags)), "allTags" in e && e.allTags && e.allTags.length > 0 && (t = te(t, e.allTags)), "text" in e && e.text && (t = se(t, e.text)), "regex" in e && e.regex && (t = ie(t, e.regex));
  const i = e;
  return (i.startTime || i.endTime) && (t = re(t, i.startTime, i.endTime)), i.relativeTime && (t = ne(t, i.relativeTime)), i.causeEventId && (t = oe(t, i.causeEventId)), i.hasCause && (t = ae(t)), i.stateKey && (t = le(t, i.stateKey)), i.statePredicate && (t = ce(t, i.statePredicate)), t;
}
function Be(s, e) {
  const t = /* @__PURE__ */ new Map();
  for (const i of s) {
    const r = i[e], n = t.get(r) || [];
    n.push(i), t.set(r, n);
  }
  return t;
}
function xe(s, e) {
  const t = /* @__PURE__ */ new Map();
  for (const i of s) {
    const r = Math.floor(i.timestamp / e) * e, n = t.get(r) || [];
    n.push(i), t.set(r, n);
  }
  return t;
}
function De(s) {
  const e = {};
  for (const t of s)
    e[t.level] = (e[t.level] || 0) + 1;
  return e;
}
function $e(s) {
  const e = {};
  for (const t of s)
    e[t.scope] = (e[t.scope] || 0) + 1;
  return e;
}
class fe {
  events = [];
  selectedEventId;
  filters = {
    level: void 0,
    scopes: [],
    tags: [],
    text: void 0
  };
  addEvent(e) {
    this.events.push(e);
  }
  getAllEvents() {
    return [...this.events];
  }
  getFilteredEvents() {
    return ue(this.events, this.filters);
  }
  selectEvent(e) {
    this.selectedEventId = e;
  }
  getSelectedEventId() {
    return this.selectedEventId;
  }
  getSelectedEvent() {
    if (this.selectedEventId)
      return this.events.find((e) => e.id === this.selectedEventId);
  }
  getEventById(e) {
    return this.events.find((t) => t.id === e);
  }
  setLevelFilter(e) {
    this.filters.level = e;
  }
  getLevelFilter() {
    return this.filters.level;
  }
  setScopeFilter(e) {
    this.filters.scopes = [...e];
  }
  getScopeFilter() {
    return [...this.filters.scopes];
  }
  setTagFilter(e) {
    this.filters.tags = [...e];
  }
  getTagFilter() {
    return [...this.filters.tags];
  }
  setTextFilter(e) {
    this.filters.text = e;
  }
  getTextFilter() {
    return this.filters.text;
  }
  clear() {
    this.events.length = 0, this.selectedEventId = void 0, this.filters = {
      level: void 0,
      scopes: [],
      tags: [],
      text: void 0
    };
  }
}
class Me {
  constructor(e) {
    this.eventBus = e, this.subscribe();
  }
  state = new fe();
  unsubscribe;
  subscribe() {
    this.unsubscribe = this.eventBus.subscribe((e) => {
      this.state.addEvent(e);
    });
  }
  getFilteredEvents() {
    return this.state.getFilteredEvents();
  }
  setLevelFilter(e) {
    this.state.setLevelFilter(e);
  }
  setScopeFilter(e) {
    this.state.setScopeFilter(e);
  }
  setTagFilter(e) {
    this.state.setTagFilter(e);
  }
  setTextFilter(e) {
    this.state.setTextFilter(e);
  }
  selectEvent(e) {
    this.state.selectEvent(e);
  }
  getSelectedEvent() {
    return this.state.getSelectedEvent();
  }
  getEventById(e) {
    return this.state.getEventById(e);
  }
  clearEvents() {
    this.state.clear();
  }
  dispose() {
    this.unsubscribe && (this.unsubscribe(), this.unsubscribe = void 0), this.state.clear();
  }
  getState() {
    return {
      events: this.state.getAllEvents(),
      filteredEvents: this.state.getFilteredEvents(),
      selectedEventId: this.state.getSelectedEventId(),
      selectedEvent: this.state.getSelectedEvent(),
      filters: {
        level: this.state.getLevelFilter(),
        scopes: this.state.getScopeFilter(),
        tags: this.state.getTagFilter(),
        text: this.state.getTextFilter()
      }
    };
  }
}
function Fe(s) {
  const e = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  }, t = e[s];
  return (i, r) => {
    (e[i.level] ?? 0) >= t && r();
  };
}
function Re(s) {
  return (e, t) => {
    (s.length === 0 || e.tags.some((i) => s.includes(i))) && t();
  };
}
function Ae(s) {
  return (e, t) => {
    (s.length === 0 || s.includes(e.scope)) && t();
  };
}
function Ne(s) {
  const e = s.toLowerCase();
  return (t, i) => {
    (e === "" || t.message.toLowerCase().includes(e) || t.scope.toLowerCase().includes(e) || t.tags.some((r) => r.toLowerCase().includes(e))) && i();
  };
}
export {
  I as CircuitBreaker,
  L as CircuitOpenError,
  Le as ConsoleAdapter,
  E as DEFAULT_CIRCUIT_BREAKER_CONFIG,
  y as DEFAULT_CONFIG,
  B as DEFAULT_DEDUP_CONFIG,
  k as DEFAULT_RATE_LIMIT_CONFIG,
  F as Deduplicator,
  Te as IndexedDBAdapter,
  Ee as LocalStorageAdapter,
  Ce as MemoryAdapter,
  C as MetricsCollector,
  Me as OverlayBridge,
  fe as OverlayState,
  J as PersistenceManager,
  M as RateLimiter,
  v as ScopedLogger,
  R as SimpleEventBus,
  U as WatcherEngine,
  xe as aggregateByTime,
  ue as applyAllFilters,
  Se as assertValidConfig,
  _ as captureStateSnapshot,
  we as causalGraph,
  ve as clearCausalLinks,
  b as computeHash,
  De as countByLevel,
  $e as countByScope,
  Fe as createLevelFilter,
  Ie as createSatori,
  Ae as createScopeFilter,
  ge as createStateSelector,
  Re as createTagFilter,
  Ne as createTextFilter,
  p as deepClone,
  m as deepEqual,
  P as detectPlatform,
  be as diffSnapshots,
  j as extractCallsite,
  te as filterByAllTags,
  oe as filterByCause,
  ae as filterByHasCause,
  X as filterByLevel,
  ie as filterByRegex,
  ne as filterByRelativeTime,
  Z as filterByScopePattern,
  Y as filterByScopes,
  ce as filterByState,
  le as filterByStateKey,
  ke as filterByStateValue,
  ee as filterByTags,
  se as filterByText,
  re as filterByTimeRange,
  pe as formatTimestamp,
  O as generateId,
  ye as getCausalGraph,
  K as getCausalLink,
  V as getEnvInfo,
  he as getGlobalMetrics,
  Be as groupBy,
  me as mergeSnapshots,
  z as now,
  de as resetGlobalMetrics,
  H as updateCausalLink,
  D as validateConfig
};
//# sourceMappingURL=satori.mjs.map
