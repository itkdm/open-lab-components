"use strict";

const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");

const lab = require("../../index.js");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function installDomGlobals(dom) {
  global.window = dom.window;
  global.document = dom.window.document;
  global.EventTarget = dom.window.EventTarget;
  global.MutationObserver = dom.window.MutationObserver;
  global.Event = dom.window.Event;
  Object.defineProperty(global, "navigator", {
    configurable: true,
    writable: true,
    value: dom.window.navigator
  });
}

function cleanupDomGlobals(dom) {
  dom.window.close();
  delete global.window;
  delete global.document;
  delete global.EventTarget;
  delete global.MutationObserver;
  delete global.Event;
  delete global.navigator;
}

async function main() {
  const dom = new JSDOM("<!doctype html><div id=\"app\"></div>", {
    url: "http://localhost/",
    runScripts: "dangerously"
  });

  installDomGlobals(dom);

  try {
    const container = document.getElementById("app");
    const html = [
      "<div class=\"cmp\" data-cmp-id=\"test.runtime.fixture\" role=\"img\" aria-label=\"Runtime Fixture\"></div>",
      "<script>",
      "  const root = document.querySelector('.cmp');",
      "  window.__olcRuntime = { events: 0, intervals: 0, timeouts: 0, mutations: 0 };",
      "  window.addEventListener('olc-runtime-event', () => { window.__olcRuntime.events += 1; });",
      "  window.setTimeout(() => { window.__olcRuntime.timeouts += 1; }, 0);",
      "  window.setInterval(() => { window.__olcRuntime.intervals += 1; }, 5);",
      "  const observer = new MutationObserver(() => { window.__olcRuntime.mutations += 1; });",
      "  observer.observe(root, { attributes: true });",
      "</script>"
    ].join("");

    lab.mount(html, container, { voltage: 5 });

    const root = container.querySelector(".cmp");
    assert.ok(root, "component root should exist after mount");
    assert.equal(root.getAttribute("data-props"), JSON.stringify({ voltage: 5 }));

    lab.updateProps(container, { voltage: 9 });
    assert.equal(root.getAttribute("data-props"), JSON.stringify({ voltage: 9 }));

    await wait(20);
    const runtimeState = window.__olcRuntime;
    assert.equal(runtimeState.timeouts, 1, "timeout should fire once after mount");
    assert.ok(runtimeState.intervals >= 1, "interval should fire before unmount");

    window.dispatchEvent(new window.Event("olc-runtime-event"));
    assert.equal(runtimeState.events, 1, "wrapped event listener should fire before unmount");

    root.setAttribute("data-before-unmount", "1");
    await wait(0);
    assert.ok(runtimeState.mutations >= 1, "observer should receive mutations before unmount");

    const intervalsBeforeUnmount = runtimeState.intervals;
    const mutationsBeforeUnmount = runtimeState.mutations;
    lab.unmount(container);
    assert.equal(container.innerHTML, "", "container should be emptied after unmount");

    window.dispatchEvent(new window.Event("olc-runtime-event"));
    root.setAttribute("data-after-unmount", "1");
    await wait(20);

    assert.equal(runtimeState.events, 1, "event listener should be removed on unmount");
    assert.equal(runtimeState.mutations, mutationsBeforeUnmount, "mutation observer should disconnect on unmount");
    assert.equal(runtimeState.intervals, intervalsBeforeUnmount, "interval should stop after unmount");

    console.log("ok - runtime lifecycle cleanup is stable");
  } finally {
    cleanupDomGlobals(dom);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
