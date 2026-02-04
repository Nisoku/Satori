/**
 * Satori Demo
 * Interactive demonstration of Satori logging library features
 */

import { createSatori } from './dist/satori.mjs';

// Global state
let satori = null;
let logger = null;
let counterWatchHandle = null;
let events = [];
let state = {
  counter: 0,
  isWatching: true
};

// DOM Elements
const elements = {};

/**
 * Initialize the Satori instance
 */
function initSatori() {
  // Reset any previous instance
  if (satori) {
    satori.dispose();
  }
  events = [];
  
  satori = createSatori({
    appVersion: 'demo-1.0.0',
    enableEnvInfo: true,
    logLevel: 'debug',
    
    // Custom levels
    customLevels: [
      { name: 'critical', severity: 100, color: '#7c2d12' }
    ],
    
    // Rate limiting: low threshold for demo visibility
    rateLimiting: {
      enabled: true,
      maxEventsPerSecond: 10,  // Low limit to see rate limiting in action
      samplingRate: 0.2,
      strategy: 'sample'
    },
    
    // Deduplication
    deduplication: {
      enabled: true,
      windowMs: 2000,
      fields: ['message', 'scope', 'level'],
      maxCacheSize: 100
    },
    
    // Circuit breaker
    circuitBreaker: {
      enabled: true,
      failureThreshold: 50,
      resetTimeout: 5000,
      successThreshold: 3
    }
  });
  
  // Subscribe to all events
  satori.bus.subscribe((entry) => {
    events.push(entry);
    renderEvent(entry);
    updateMetrics();
  });
  
  // Create default logger
  logger = satori.createLogger('demo');
  
  // Log initialization
  logger.info('Satori initialized', { 
    tags: ['system'],
    state: { version: '1.0.0' }
  });
  
  // Setup counter watcher
  setupCounterWatch();
  
  // Update UI
  updateMetrics();
  updateWatchStatus();
}

/**
 * Setup counter watching
 */
function setupCounterWatch() {
  if (counterWatchHandle) {
    counterWatchHandle.dispose();
    counterWatchHandle = null;
  }
  
  if (state.isWatching) {
    const watchLogger = satori.createLogger('watcher');
    counterWatchHandle = watchLogger.watch(
      () => state.counter,
      'counter'
    );
  }
}

/**
 * Initialize DOM elements
 */
function initElements() {
  elements.scope = document.getElementById('scope');
  elements.level = document.getElementById('level');
  elements.message = document.getElementById('message');
  elements.tags = document.getElementById('tags');
  elements.logBtn = document.getElementById('logBtn');
  elements.clearBtn = document.getElementById('clearBtn');
  
  elements.counterValue = document.getElementById('counterValue');
  elements.incrementBtn = document.getElementById('incrementBtn');
  elements.decrementBtn = document.getElementById('decrementBtn');
  elements.watchDot = document.getElementById('watchDot');
  elements.watchStatus = document.getElementById('watchStatus');
  elements.toggleWatchBtn = document.getElementById('toggleWatchBtn');
  
  elements.bulkBtn = document.getElementById('bulkBtn');
  elements.dedupBtn = document.getElementById('dedupBtn');
  elements.causalBtn = document.getElementById('causalBtn');
  elements.errorBtn = document.getElementById('errorBtn');
  
  elements.metricTotal = document.getElementById('metricTotal');
  elements.metricRate = document.getElementById('metricRate');
  elements.metricDropped = document.getElementById('metricDropped');
  elements.metricDeduped = document.getElementById('metricDeduped');
  elements.metricCircuit = document.getElementById('metricCircuit');
  elements.metricWatchers = document.getElementById('metricWatchers');
  
  elements.eventCount = document.getElementById('eventCount');
  elements.eventList = document.getElementById('eventList');
  elements.filterLevel = document.getElementById('filterLevel');
  elements.filterSearch = document.getElementById('filterSearch');
  elements.autoScroll = document.getElementById('autoScroll');
  elements.showJson = document.getElementById('showJson');
  
  elements.themeToggle = document.getElementById('themeToggle');
}

/**
 * Bind event handlers
 */
function bindEvents() {
  // Log button
  elements.logBtn.addEventListener('click', () => {
    const scope = elements.scope.value || 'demo';
    const level = elements.level.value;
    const message = elements.message.value || 'Log event';
    const tags = elements.tags.value
      .split(',')
      .map(t => t.trim())
      .filter(t => t);
    
    const scopedLogger = satori.createLogger(scope);
    const options = { tags: tags.length ? tags : undefined };
    
    if (level === 'critical') {
      scopedLogger.log('critical', message, options);
    } else {
      scopedLogger[level](message, options);
    }
  });
  
  // Clear button
  elements.clearBtn.addEventListener('click', () => {
    events = [];
    elements.eventList.innerHTML = '<div class="event-placeholder">No events yet</div>';
    elements.eventCount.textContent = '(0)';
    satori.bus.reset();
    updateMetrics();
    logger.info('Event log cleared', { tags: ['system'] });
  });
  
  // Counter buttons
  elements.incrementBtn.addEventListener('click', () => {
    state.counter++;
    elements.counterValue.textContent = state.counter;
  });
  
  elements.decrementBtn.addEventListener('click', () => {
    state.counter--;
    elements.counterValue.textContent = state.counter;
  });
  
  // Toggle watch
  elements.toggleWatchBtn.addEventListener('click', () => {
    state.isWatching = !state.isWatching;
    setupCounterWatch();
    updateWatchStatus();
  });
  
  // Bulk events
  elements.bulkBtn.addEventListener('click', () => {
    const burstLogger = satori.createLogger('burst');
    const startEvent = burstLogger.info('Starting burst of 50 events', { tags: ['burst', 'start'] });
    
    for (let i = 0; i < 50; i++) {
      burstLogger.info(`Burst event ${i + 1}/50`, { 
        tags: ['burst'],
        state: { index: i }
      });
    }
    
    burstLogger.info('Burst complete: check rate limiting', { tags: ['burst', 'end'] });
  });
  
  // Deduplication test
  elements.dedupBtn.addEventListener('click', () => {
    const dedupLogger = satori.createLogger('dedup-test');
    const message = 'Duplicate message test';
    
    dedupLogger.info('Sending 10 identical messages...', { tags: ['dedup'] });
    
    for (let i = 0; i < 10; i++) {
      dedupLogger.warn(message, { tags: ['dedup', 'duplicate'] });
    }
    
    dedupLogger.info('Done: check deduplication count', { tags: ['dedup'] });
  });
  
  // Causal chain
  elements.causalBtn.addEventListener('click', () => {
    const causalLogger = satori.createLogger('causal');
    
    causalLogger.info('User clicked button', { tags: ['causal', 'trigger'] });
    
    const validateLogger = causalLogger.causedBy('User clicked button');
    validateLogger.info('Validating input', { tags: ['causal', 'process'] });
    
    const submitLogger = validateLogger.causedBy('Validating input');
    submitLogger.info('Submitting form', { tags: ['causal', 'process'] });
    
    const responseLogger = submitLogger.causedBy('Submitting form');
    responseLogger.info('Received response', { 
      tags: ['causal', 'complete'],
      state: { status: 200 }
    });
  });
  
  // Error test
  elements.errorBtn.addEventListener('click', () => {
    const errorLogger = satori.createLogger('error-test');
    
    errorLogger.debug('Attempting risky operation', { tags: ['error'] });
    errorLogger.warn('Resource usage high', { 
      tags: ['error', 'warning'],
      state: { memoryUsage: '85%' }
    });
    errorLogger.error('Operation failed', { 
      tags: ['error', 'failure'],
      state: { errorCode: 'ERR_NETWORK' }
    });
    errorLogger.log('critical', 'System in critical state', { 
      tags: ['error', 'critical'],
      suggest: 'Restart the service'
    });
  });
  
  // Filters
  elements.filterLevel.addEventListener('change', renderAllEvents);
  elements.filterSearch.addEventListener('input', renderAllEvents);
  elements.showJson.addEventListener('change', renderAllEvents);
  
  // Theme toggle
  elements.themeToggle.addEventListener('click', () => {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('satori-demo-theme', newTheme);
  });
}

/**
 * Update watch status display
 */
function updateWatchStatus() {
  if (state.isWatching) {
    elements.watchDot.classList.remove('stopped');
    elements.watchStatus.textContent = 'Watching';
    elements.toggleWatchBtn.textContent = 'Stop';
  } else {
    elements.watchDot.classList.add('stopped');
    elements.watchStatus.textContent = 'Stopped';
    elements.toggleWatchBtn.textContent = 'Start';
  }
}

/**
 * Update metrics display
 */
function updateMetrics() {
  const metrics = satori.getMetrics();
  
  // Use the bus metrics from the satori instance, not global metrics
  elements.metricTotal.textContent = metrics.bus.totalPublished;
  elements.metricRate.textContent = metrics.bus.eventsPerSecond.toFixed(1);
  elements.metricDropped.textContent = metrics.bus.totalDropped + metrics.bus.totalSampled;
  elements.metricDeduped.textContent = metrics.bus.totalDeduplicated;
  elements.metricCircuit.textContent = metrics.circuitState || 'closed';
  elements.metricWatchers.textContent = metrics.watcherCount;
}

/**
 * Render a single event to the list
 */
function renderEvent(entry) {
  // Check filters
  if (!passesFilters(entry)) {
    return;
  }
  
  // Remove placeholder
  const placeholder = elements.eventList.querySelector('.event-placeholder');
  if (placeholder) {
    placeholder.remove();
  }
  
  const eventEl = createEventElement(entry);
  elements.eventList.appendChild(eventEl);
  
  // Update count
  const visibleCount = elements.eventList.querySelectorAll('.event-item').length;
  elements.eventCount.textContent = `(${visibleCount})`;
  
  // Auto scroll
  if (elements.autoScroll.checked) {
    elements.eventList.scrollTop = elements.eventList.scrollHeight;
  }
}

/**
 * Render all events (used for filter changes)
 */
function renderAllEvents() {
  elements.eventList.innerHTML = '';
  
  let visibleCount = 0;
  for (const entry of events) {
    if (passesFilters(entry)) {
      const eventEl = createEventElement(entry);
      elements.eventList.appendChild(eventEl);
      visibleCount++;
    }
  }
  
  if (visibleCount === 0) {
    elements.eventList.innerHTML = '<div class="event-placeholder">No matching events</div>';
  }
  
  elements.eventCount.textContent = `(${visibleCount})`;
}

/**
 * Check if entry passes current filters
 */
function passesFilters(entry) {
  const levelFilter = elements.filterLevel.value;
  const searchFilter = elements.filterSearch.value.toLowerCase();
  
  if (levelFilter && entry.level !== levelFilter) {
    return false;
  }
  
  if (searchFilter && !entry.message.toLowerCase().includes(searchFilter)) {
    return false;
  }
  
  return true;
}

/**
 * Create DOM element for an event
 */
function createEventElement(entry) {
  const div = document.createElement('div');
  div.className = `event-item level-${entry.level}`;
  
  const time = new Date(entry.timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });
  
  div.innerHTML = `
    <span class="event-time">${time}</span>
    <span class="event-level ${entry.level}">${entry.level}</span>
    <span class="event-message">${escapeHtml(entry.message)}</span>
    <span class="event-scope">${escapeHtml(entry.scope)}</span>
  `;
  
  // Show JSON if enabled
  if (elements.showJson.checked) {
    const jsonDiv = document.createElement('div');
    jsonDiv.className = 'event-json';
    jsonDiv.textContent = JSON.stringify(entry, null, 2);
    div.appendChild(jsonDiv);
  }
  
  return div;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Initialize theme from localStorage
 */
function initTheme() {
  const savedTheme = localStorage.getItem('satori-demo-theme');
  if (savedTheme) {
    document.body.setAttribute('data-theme', savedTheme);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.setAttribute('data-theme', 'dark');
  }
}

/**
 * Initialize the demo
 */
function init() {
  initTheme();
  initElements();
  bindEvents();
  initSatori();
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
