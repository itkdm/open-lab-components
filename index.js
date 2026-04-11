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
var i18n;
try { i18n = require('./lib/i18n.js'); } catch (e) { i18n = null; }
var runtime;
try { runtime = require('./lib/runtime.js'); } catch (e) { runtime = null; }

var _registry = null;

function getRegistry() {
  if (_registry) return _registry;
  _registry = require('./registry/registry.json');
  return _registry;
}

function getLocale(options) {
  if (!i18n) return 'zh-CN';
  return i18n.normalizeLocale(options && options.locale);
}

function localizeItem(item, options) {
  if (!item) return null;
  if (!i18n || !i18n.localizeRegistryItem) return item;
  return i18n.localizeRegistryItem(item, getLocale(options));
}

/**
 * List all available components.
 * @param {object} [filter] - Optional filter: { category, tag }
 * @param {object} [options] - Optional options: { locale }
 * @returns {Array<object>} Array of component manifest objects
 */
function list(filter, options) {
  var reg = getRegistry();
  var items = reg.items;
  var locale = getLocale(options);
  var selected = !filter ? items.slice() : items.filter(function (item) {
    if (filter.category && item.category !== filter.category) return false;
    if (filter.tag) {
      var localized = localizeItem(item, { locale: locale });
      if (!localized.tags || localized.tags.indexOf(filter.tag) === -1) return false;
    }
    return true;
  });
  return selected.map(function (item) { return localizeItem(item, { locale: locale }); });
}

/**
 * Get a single component manifest by ID.
 * @param {string} id - Component ID (e.g. 'phy.apparatus.bulb.basic')
 * @param {object} [options] - Optional options: { locale }
 * @returns {object|null} Component manifest or null if not found
 */
function get(id, options) {
  var reg = getRegistry();
  for (var i = 0; i < reg.items.length; i++) {
    if (reg.items[i].id === id) return localizeItem(reg.items[i], options);
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
  var comp = get(id, { locale: 'zh-CN' });
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
  var comp = get(id, { locale: 'zh-CN' });
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
  var comp = get(id, { locale: 'zh-CN' });
  if (!comp) throw new Error('Component not found: ' + id);
  return pathMod.join(__dirname, comp.sourcePath);
}

module.exports = {
  list: list,
  get: get,
  categories: categories,
  readSync: readSync,
  read: read,
  resolve: resolve,
  mount: runtime && runtime.mount,
  unmount: runtime && runtime.unmount,
  updateProps: runtime && runtime.updateProps,
  get registry() { return getRegistry(); }
};
