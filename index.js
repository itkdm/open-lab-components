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
 * // Mount into the DOM (browser)
 * lab.mount(html, document.getElementById('container'));
 */

'use strict';

var catalog;
try { catalog = require('./lib/catalog.js'); } catch (e) { catalog = null; }
var runtime;
try { runtime = require('./lib/runtime.js'); } catch (e) { runtime = null; }
var visualCatalog;
try { visualCatalog = require('./lib/visual-catalog.js'); } catch (e) { visualCatalog = null; }

function getRegistry() {
  if (!catalog || !catalog.getRegistry) {
    throw new Error('Catalog loader is unavailable');
  }
  return catalog.getRegistry();
}

module.exports = {
  list: catalog && catalog.list,
  get: catalog && catalog.get,
  categories: catalog && catalog.categories,
  readSync: catalog && catalog.readSync,
  read: catalog && catalog.read,
  resolve: catalog && catalog.resolve,
  mount: runtime && runtime.mount,
  unmount: runtime && runtime.unmount,
  updateProps: runtime && runtime.updateProps,
  get registry() { return getRegistry(); },
  visuals: visualCatalog && {
    list: visualCatalog.list,
    get: visualCatalog.get,
    subjects: visualCatalog.subjects,
    readSync: visualCatalog.readSync,
    read: visualCatalog.read,
    resolve: visualCatalog.resolve,
    get registry() { return visualCatalog.getRegistry(); }
  }
};
