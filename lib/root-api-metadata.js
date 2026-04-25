"use strict";

const ROOT_API_EXPORTS = [
  "list",
  "get",
  "categories",
  "readSync",
  "read",
  "resolve",
  "mount",
  "unmount",
  "updateProps",
  "registry",
  "visuals"
];

const ROOT_API_TYPE_SNIPPETS = [
  "export function list(filter?: ListFilter, options?: LocaleOptions): ComponentManifest[];",
  "export function get(id: string, options?: LocaleOptions): ComponentManifest | null;",
  "export function categories(): string[];",
  "export function readSync(id: string): string;",
  "export function read(id: string): Promise<string>;",
  "export function resolve(id: string): string;",
  "export function mount(html: string, container: HTMLElement, props?: Record<string, unknown>): void;",
  "export function unmount(container: HTMLElement): void;",
  "export function updateProps(container: HTMLElement, props?: Record<string, unknown>): void;",
  "export const registry: Registry;",
  "export const visuals: {"
];

const ROOT_API_README_SNIPPETS = [
  "const lab = require('@itkdm/open-lab-components');",
  "lab.list(",
  "lab.get(",
  "lab.readSync(",
  "npm install @itkdm/open-lab-components"
];

const ROOT_QUERY_API_CONTRACT = {
  sampleCategory: "physics/circuit",
  sampleEnglishName: "Dry Cell Battery",
  sampleId: "phy.power.battery.basic",
  sampleResolvedSuffix: ["components", "physics", "circuit", "phy.power.battery.basic.html"],
  sampleVisualId: "vis.physics.series-parallel-circuit",
  sampleVisualEnglishTitle: "Series and Parallel Circuit Comparison",
  sampleVisualResolvedSuffix: ["visuals", "physics", "vis.physics.series-parallel-circuit.png"]
};

const ROOT_QUERY_API_README_SNIPPETS = [
  "lab.categories();",
  "lab.list({ category: 'physics/circuit' }, { locale: 'en' });",
  "lab.get('phy.power.battery.basic', { locale: 'en-US' });"
];

module.exports = {
  ROOT_API_EXPORTS,
  ROOT_API_README_SNIPPETS,
  ROOT_API_TYPE_SNIPPETS,
  ROOT_QUERY_API_CONTRACT,
  ROOT_QUERY_API_README_SNIPPETS
};
