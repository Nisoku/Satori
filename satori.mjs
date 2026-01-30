class g {
  subscribers = [];
  middleware = [];
  buffer = [];
  maxBufferSize;
  constructor(e = 1e3) {
    this.maxBufferSize = e;
  }
  publish(e) {
    let t = 0;
    const r = () => {
      if (t >= this.middleware.length) {
        this.subscribers.forEach((a) => a(e)), this.addToBuffer(e);
        return;
      }
      const n = this.middleware[t];
      t++, n(e, r);
    };
    r();
  }
  subscribe(e) {
    return this.subscribers.push(e), () => {
      const t = this.subscribers.indexOf(e);
      t >= 0 && this.subscribers.splice(t, 1);
    };
  }
  use(e) {
    this.middleware.push(e);
  }
  getReplayBuffer() {
    return [...this.buffer];
  }
  addToBuffer(e) {
    this.buffer.push(e), this.buffer.length > this.maxBufferSize && this.buffer.shift();
  }
}
let v = 0;
const p = Date.now().toString(36);
function w() {
  return `${p}-${++v}`;
}
function E() {
  return Date.now();
}
function V(s) {
  return new Date(s).toISOString();
}
function b(s = 2) {
  try {
    const e = new Error().stack;
    if (!e) return;
    const r = e.split(`
`)[s];
    if (!r) return;
    const n = r.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/) || r.match(/at\s+(.+?):(\d+):(\d+)/);
    if (n) {
      const [, a, i, c, o] = n;
      return `${i}:${c}:${o}${a ? ` (${a})` : ""}`;
    }
    return r.trim();
  } catch {
    return;
  }
}
function I(s) {
  const e = {
    platform: typeof window < "u" ? "browser" : "node",
    appVersion: s.appVersion
  };
  return typeof window < "u" ? (e.userAgent = navigator.userAgent, e.url = window.location.href, e.referrer = document.referrer) : typeof process < "u" && (e.nodeVersion = process.version, e.platform = process.platform, e.arch = process.arch), e;
}
function m(s) {
  if (!s.stateSelectors || s.stateSelectors.length === 0)
    return;
  const e = {};
  try {
    s.stateSelectors.forEach((t, r) => {
      try {
        const n = t();
        n != null && (e[`selector_${r}`] = n);
      } catch (n) {
        e[`selector_${r}_error`] = n instanceof Error ? n.message : String(n);
      }
    });
  } catch (t) {
    e.error = t instanceof Error ? t.message : String(t);
  }
  return Object.keys(e).length > 0 ? e : void 0;
}
const u = /* @__PURE__ */ new Map();
let d;
function S(s, e) {
  return e || u.get(s) || d;
}
function F(s, e) {
  u.set(s, e), d = e;
}
function y(s, e, t) {
  const r = w(), n = E(), a = [
    ...s.inheritedTags || [],
    ...s.options?.tags || []
  ], i = {
    id: r,
    timestamp: n,
    level: s.level,
    scope: s.scope,
    message: s.message,
    tags: a,
    cause: s.inheritedCause || s.options?.cause,
    causeEventId: s.inheritedCauseEventId || s.options?.causeEventId,
    suggest: s.options?.suggest
  };
  if (e.enableCallsite && !i.__internal?.isReplay && (i.callsite = b(3)), e.enableEnvInfo && !i.__internal?.isReplay && (i.env = I(e)), e.enableStateSnapshot && !i.__internal?.isReplay && (i.state = m(e)), e.enableCausalLinks && !i.__internal?.isReplay) {
    const c = S(s.scope, t);
    c && (i.previousEventId = c);
  }
  return i;
}
class C {
  constructor(e, t) {
    this.logger = e, this.config = t;
  }
  watchers = /* @__PURE__ */ new Map();
  whenHandlers = /* @__PURE__ */ new Map();
  watch(e, t) {
    const r = Math.random().toString(36).substr(2, 9), n = typeof e == "function" ? e : () => e;
    let a;
    const c = setInterval(() => {
      try {
        const o = n();
        if (o !== a) {
          const l = t || `watch_${r}`, f = typeof o == "object" ? `${l}: state changed` : `${l}: ${a} → ${o}`;
          this.logger.info(f, {
            tags: ["watch"],
            state: {
              [`${l}_prev`]: a,
              [`${l}_current`]: o
            }
          }), a = o;
        }
      } catch (o) {
        this.logger.error(`Watch error for ${t || r}`, {
          tags: ["watch", "error"],
          state: { error: o instanceof Error ? o.message : String(o) }
        });
      }
    }, this.config.pollingInterval);
    return this.watchers.set(r, {
      id: r,
      getValue: n,
      label: t,
      intervalId: c
    }), {
      dispose: () => {
        c && clearInterval(c), this.watchers.delete(r);
      }
    };
  }
  when(e, t, r) {
    const n = Math.random().toString(36).substr(2, 9), a = typeof e == "function" ? e : () => e;
    let i;
    const o = setInterval(() => {
      try {
        const l = a();
        t(i, l) && r(l, i), i = l;
      } catch (l) {
        this.logger.error(`When condition error for ${n}`, {
          tags: ["when", "error"],
          state: { error: l instanceof Error ? l.message : String(l) }
        });
      }
    }, this.config.pollingInterval);
    return this.whenHandlers.set(n, {
      getValue: a,
      predicate: t,
      onTrigger: r,
      lastValue: i,
      intervalId: o
    }), {
      dispose: () => {
        clearInterval(o), this.whenHandlers.delete(n);
      }
    };
  }
  dispose() {
    this.watchers.forEach((e) => {
      e.intervalId && clearInterval(e.intervalId);
    }), this.whenHandlers.forEach((e) => {
      clearInterval(e.intervalId);
    }), this.watchers.clear(), this.whenHandlers.clear();
  }
}
class h {
  constructor(e, t, r, n) {
    this.scope = e, this.config = t, this.bus = r, this.lastEventId = n, this.watcherEngine = new C(this, t);
  }
  inheritedTags = [];
  inheritedCause;
  inheritedCauseEventId;
  watcherEngine;
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
  tag(...e) {
    const t = new h(this.scope, this.config, this.bus, this.lastEventId);
    return t.inheritedTags = [...this.inheritedTags, ...e], t;
  }
  causedBy(e) {
    const t = new h(this.scope, this.config, this.bus, this.lastEventId);
    return typeof e == "string" ? t.inheritedCause = e : (t.inheritedCause = e.message, t.inheritedCauseEventId = e.id), t;
  }
  watch(e, t) {
    return this.watcherEngine.watch(e, t);
  }
  when(e, t, r) {
    return this.watcherEngine.when(e, t, r);
  }
  log(e, t, r) {
    const n = y(
      {
        level: e,
        scope: this.scope,
        message: t,
        options: r,
        inheritedTags: this.inheritedTags,
        inheritedCause: this.inheritedCause,
        inheritedCauseEventId: this.inheritedCauseEventId
      },
      this.config,
      this.lastEventId
    );
    F(this.scope, n.id), this.lastEventId = n.id, this.bus.publish(n);
  }
}
const L = {
  enableCallsite: !0,
  enableEnvInfo: !0,
  enableStateSnapshot: !1,
  enableCausalLinks: !0,
  stateSelectors: [],
  maxBufferSize: 1e3,
  logLevel: "info",
  appVersion: "1.0.0",
  pollingInterval: 100
};
function A(s = {}) {
  const e = { ...L, ...s }, t = new g(e.maxBufferSize), r = new h("root", e, t);
  return {
    config: e,
    bus: t,
    rootLogger: r,
    createLogger(n) {
      return new h(n, e, t);
    },
    dispose() {
      const n = t.getReplayBuffer?.();
      n && (n.length = 0);
    }
  };
}
function x(s, e) {
  if (!e) return s;
  const t = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  }, r = t[e];
  return s.filter((n) => t[n.level] >= r);
}
function B(s, e) {
  return e.length === 0 ? s : s.filter((t) => e.includes(t.scope));
}
function T(s, e) {
  return e.length === 0 ? s : s.filter((t) => e.some((r) => t.tags.includes(r)));
}
function $(s, e) {
  if (!e || e.trim() === "") return s;
  const t = e.toLowerCase();
  return s.filter(
    (r) => r.message.toLowerCase().includes(t) || r.scope.toLowerCase().includes(t) || r.tags.some((n) => n.toLowerCase().includes(t))
  );
}
function _(s, e) {
  let t = s;
  return t = x(t, e.level), t = B(t, e.scopes), t = T(t, e.tags), t = $(t, e.text), t;
}
class k {
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
    return _(this.events, this.filters);
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
class R {
  constructor(e) {
    this.eventBus = e, this.subscribe();
  }
  state = new k();
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
function z(s) {
  const e = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  }, t = e[s];
  return (r, n) => {
    e[r.level] >= t && n();
  };
}
function H(s) {
  return (e, t) => {
    (s.length === 0 || e.tags.some((r) => s.includes(r))) && t();
  };
}
function M(s) {
  return (e, t) => {
    (s.length === 0 || s.includes(e.scope)) && t();
  };
}
function D(s) {
  const e = s.toLowerCase();
  return (t, r) => {
    (e === "" || t.message.toLowerCase().includes(e) || t.scope.toLowerCase().includes(e) || t.tags.some((n) => n.toLowerCase().includes(e))) && r();
  };
}
export {
  L as DEFAULT_CONFIG,
  R as OverlayBridge,
  k as OverlayState,
  h as ScopedLogger,
  g as SimpleEventBus,
  C as WatcherEngine,
  _ as applyAllFilters,
  z as createLevelFilter,
  A as createSatori,
  M as createScopeFilter,
  H as createTagFilter,
  D as createTextFilter,
  b as extractCallsite,
  x as filterByLevel,
  B as filterByScopes,
  T as filterByTags,
  $ as filterByText,
  V as formatTimestamp,
  w as generateId,
  E as now
};
//# sourceMappingURL=satori.mjs.map
