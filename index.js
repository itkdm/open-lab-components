/**
 * open-lab-components
 * Zero-dependency HTML fragment component library for STEM education.
 *
 * @example
 * const lab = require('open-lab-components');
 * // or: import lab from 'open-lab-components';
 *
 * // Browse all components
 * const list = lab.list();
 *
 * // Get a specific component
 * const comp = lab.get('phy.apparatus.bulb.basic');
 * console.log(comp.name);       // "灯泡（基础）"
 * console.log(comp.sourcePath); // "components/physics/apparatus/phy.apparatus.bulb.basic.html"
 *
 * // Read component HTML (Node.js)
 * const html = lab.readSync('phy.apparatus.bulb.basic');
 *
 * // Load into DOM (browser)
 * lab.load('phy.apparatus.bulb.basic', document.getElementById('container'));
 */

'use strict';

var fs, pathMod;
try { fs = require('fs'); pathMod = require('path'); } catch (e) { /* browser */ }

var _registry = null;
var _instances = typeof WeakMap === 'function' ? new WeakMap() : null;
var _runtimeHooksInstalled = false;
var _activeRoot = null;
var _listenerWrappers = typeof WeakMap === 'function' ? new WeakMap() : null;

function getRegistry() {
  if (_registry) return _registry;
  _registry = require('./registry/registry.json');
  return _registry;
}

/**
 * List all available components.
 * @param {object} [filter] - Optional filter: { category, tag }
 * @returns {Array<object>} Array of component manifest objects
 */
function list(filter) {
  var reg = getRegistry();
  var items = reg.items;
  if (!filter) return items.slice();
  return items.filter(function (item) {
    if (filter.category && item.category !== filter.category) return false;
    if (filter.tag && (!item.tags || item.tags.indexOf(filter.tag) === -1)) return false;
    return true;
  });
}

/**
 * Get a single component manifest by ID.
 * @param {string} id - Component ID (e.g. 'phy.apparatus.bulb.basic')
 * @returns {object|null} Component manifest or null if not found
 */
function get(id) {
  var reg = getRegistry();
  for (var i = 0; i < reg.items.length; i++) {
    if (reg.items[i].id === id) return reg.items[i];
  }
  return null;
}

/**
 * Get all available categories.
 * @returns {Array<string>} Category strings (e.g. ['physics/apparatus', 'chemistry/labware'])
 */
function categories() {
  var seen = {};
  var result = [];
  var items = getRegistry().items;
  for (var i = 0; i < items.length; i++) {
    var cat = items[i].category;
    if (!seen[cat]) { seen[cat] = true; result.push(cat); }
  }
  return result;
}

/**
 * Read component HTML source synchronously (Node.js only).
 * @param {string} id - Component ID
 * @returns {string} HTML source
 */
function readSync(id) {
  if (!fs) throw new Error('readSync is only available in Node.js');
  var comp = get(id);
  if (!comp) throw new Error('Component not found: ' + id);
  var filePath = pathMod.join(__dirname, comp.sourcePath);
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Read component HTML source asynchronously (Node.js only).
 * @param {string} id - Component ID
 * @returns {Promise<string>} HTML source
 */
function read(id) {
  if (!fs) return Promise.reject(new Error('read is only available in Node.js'));
  var comp = get(id);
  if (!comp) return Promise.reject(new Error('Component not found: ' + id));
  var filePath = pathMod.join(__dirname, comp.sourcePath);
  return new Promise(function (resolve, reject) {
    fs.readFile(filePath, 'utf-8', function (err, data) {
      if (err) reject(err); else resolve(data);
    });
  });
}

/**
 * Resolve the file path of a component (Node.js only).
 * @param {string} id - Component ID
 * @returns {string} Absolute file path
 */
function resolve(id) {
  if (!pathMod) throw new Error('resolve is only available in Node.js');
  var comp = get(id);
  if (!comp) throw new Error('Component not found: ' + id);
  return pathMod.join(__dirname, comp.sourcePath);
}

function getMountedRoot(container) {
  return container && container.querySelector ? container.querySelector('.cmp') : null;
}

function withActiveRoot(root, fn, thisArg, args) {
  var prevRoot = _activeRoot;
  _activeRoot = root;
  try {
    return fn && fn.apply ? fn.apply(thisArg, args || []) : undefined;
  } finally {
    _activeRoot = prevRoot;
  }
}

function normalizeListenerOptions(options) {
  if (options == null) return false;
  if (typeof options === 'boolean') return options;
  return !!options.capture;
}

function rememberWrappedListener(listener, record) {
  if (!_listenerWrappers || typeof listener !== 'function') return;
  var records = _listenerWrappers.get(listener);
  if (!records) {
    records = [];
    _listenerWrappers.set(listener, records);
  }
  records.push(record);
}

function findWrappedListener(target, type, listener, options) {
  if (!_listenerWrappers || typeof listener !== 'function') return null;
  var records = _listenerWrappers.get(listener);
  if (!records || !records.length) return null;
  var capture = normalizeListenerOptions(options);
  for (var i = records.length - 1; i >= 0; i--) {
    var record = records[i];
    if (record.target === target && record.type === type && record.capture === capture) {
      return record.wrapped;
    }
  }
  return null;
}

function setRootProps(root, props) {
  if (!root || !props) return;
  root.setAttribute('data-props', JSON.stringify(props));
}

function prepareRoot(root) {
  if (!root) return;
  root.__olcCleanups = [];
  root.__olcRegisterCleanup = function (cleanup) {
    if (typeof cleanup === 'function') root.__olcCleanups.push(cleanup);
  };
}

function cleanupRoot(root) {
  if (!root) return;
  if (root.__olcCleanups && root.__olcCleanups.length) {
    for (var i = root.__olcCleanups.length - 1; i >= 0; i--) {
      try { root.__olcCleanups[i](); } catch (e) { /* ignore cleanup failures */ }
    }
  }
  root.__olcCleanups = null;
  root.__olcRegisterCleanup = null;
}

function ensureRuntimeHooks() {
  if (_runtimeHooksInstalled) return;
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (typeof EventTarget === 'undefined') return;

  var originalAddEventListener = EventTarget.prototype.addEventListener;
  var originalRemoveEventListener = EventTarget.prototype.removeEventListener;
  var OriginalMutationObserver = typeof window.MutationObserver === 'function' ? window.MutationObserver : null;
  var originalRequestAnimationFrame = typeof window.requestAnimationFrame === 'function' ? window.requestAnimationFrame.bind(window) : null;
  var originalSetTimeout = typeof window.setTimeout === 'function' ? window.setTimeout.bind(window) : null;
  var originalSetInterval = typeof window.setInterval === 'function' ? window.setInterval.bind(window) : null;

  EventTarget.prototype.addEventListener = function (type, listener, options) {
    var root = _activeRoot;
    if (!root || typeof listener !== 'function') {
      return originalAddEventListener.call(this, type, listener, options);
    }

    var target = this;
    var wrapped = function () {
      return withActiveRoot(root, listener, this, arguments);
    };
    var record = {
      target: target,
      type: type,
      capture: normalizeListenerOptions(options),
      wrapped: wrapped
    };

    rememberWrappedListener(listener, record);
    originalAddEventListener.call(target, type, wrapped, options);

    if (typeof root.__olcRegisterCleanup === 'function') {
      root.__olcRegisterCleanup(function () {
        try { originalRemoveEventListener.call(target, type, wrapped, options); } catch (e) { /* ignore */ }
      });
      if (target === window && type === 'beforeunload') {
        root.__olcRegisterCleanup(function () {
          var evt = typeof Event === 'function' ? new Event('beforeunload') : { type: 'beforeunload' };
          try { wrapped.call(window, evt); } catch (e) { /* ignore */ }
        });
      }
    }
  };

  EventTarget.prototype.removeEventListener = function (type, listener, options) {
    var wrapped = findWrappedListener(this, type, listener, options);
    return originalRemoveEventListener.call(this, type, wrapped || listener, options);
  };

  if (OriginalMutationObserver) {
    window.MutationObserver = function MutationObserverWrapper(callback) {
      var root = _activeRoot;
      var wrappedCallback = callback;
      if (root && typeof callback === 'function') {
        wrappedCallback = function () {
          return withActiveRoot(root, callback, this, arguments);
        };
      }
      var observer = new OriginalMutationObserver(wrappedCallback);
      if (root && typeof root.__olcRegisterCleanup === 'function') {
        root.__olcRegisterCleanup(function () {
          try { observer.disconnect(); } catch (e) { /* ignore */ }
        });
      }
      return observer;
    };
    window.MutationObserver.prototype = OriginalMutationObserver.prototype;
  }

  if (originalRequestAnimationFrame) {
    window.requestAnimationFrame = function (callback) {
      var root = _activeRoot;
      if (!root || typeof callback !== 'function') return originalRequestAnimationFrame(callback);
      var wrapped = function (time) {
        return withActiveRoot(root, callback, this, [time]);
      };
      var id = originalRequestAnimationFrame(wrapped);
      if (typeof root.__olcRegisterCleanup === 'function') {
        root.__olcRegisterCleanup(function () {
          try { window.cancelAnimationFrame(id); } catch (e) { /* ignore */ }
        });
      }
      return id;
    };
  }

  if (originalSetTimeout) {
    window.setTimeout = function (callback, delay) {
      var root = _activeRoot;
      if (!root || typeof callback !== 'function') return originalSetTimeout.apply(window, arguments);
      var args = Array.prototype.slice.call(arguments, 2);
      var wrapped = function () {
        return withActiveRoot(root, callback, this, args);
      };
      var id = originalSetTimeout(wrapped, delay);
      if (typeof root.__olcRegisterCleanup === 'function') {
        root.__olcRegisterCleanup(function () {
          try { window.clearTimeout(id); } catch (e) { /* ignore */ }
        });
      }
      return id;
    };
  }

  if (originalSetInterval) {
    window.setInterval = function (callback, delay) {
      var root = _activeRoot;
      if (!root || typeof callback !== 'function') return originalSetInterval.apply(window, arguments);
      var args = Array.prototype.slice.call(arguments, 2);
      var wrapped = function () {
        return withActiveRoot(root, callback, this, args);
      };
      var id = originalSetInterval(wrapped, delay);
      if (typeof root.__olcRegisterCleanup === 'function') {
        root.__olcRegisterCleanup(function () {
          try { window.clearInterval(id); } catch (e) { /* ignore */ }
        });
      }
      return id;
    };
  }

  _runtimeHooksInstalled = true;
}

/**
 * Load a component into a DOM container (browser only).
 * Handles script re-activation automatically.
 *
 * @param {string} html - Component HTML string
 * @param {HTMLElement} container - Target DOM element
 * @param {object} [props] - Optional props to set via data-props attribute
 */
function mount(html, container, props) {
  unmount(container);
  container.innerHTML = html;
  var root = getMountedRoot(container);
  prepareRoot(root);
  setRootProps(root, props);
  ensureRuntimeHooks();
  // Re-activate inline scripts (innerHTML doesn't execute them)
  var scripts = container.querySelectorAll('script');
  for (var i = 0; i < scripts.length; i++) {
    var oldScript = scripts[i];
    var newScript = document.createElement('script');
    newScript.textContent = oldScript.textContent;
    withActiveRoot(root, function () {
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }
  root = getMountedRoot(container);
  if (root && !root.__olcRegisterCleanup) prepareRoot(root);
  if (_instances) _instances.set(container, { root: root });
}

function unmount(container) {
  if (!container) return;
  var record = _instances ? _instances.get(container) : null;
  var root = record && record.root ? record.root : getMountedRoot(container);
  cleanupRoot(root);
  if (_instances) _instances.delete(container);
  container.innerHTML = '';
}

function updateProps(container, props) {
  if (!container) return;
  var record = _instances ? _instances.get(container) : null;
  var root = record && record.root ? record.root : getMountedRoot(container);
  if (!root) return;
  setRootProps(root, props || {});
}

module.exports = {
  list: list,
  get: get,
  categories: categories,
  readSync: readSync,
  read: read,
  resolve: resolve,
  mount: mount,
  unmount: unmount,
  updateProps: updateProps,
  get registry() { return getRegistry(); }
};
