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
  "registry"
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
  "export const registry: Registry;"
];

const ROOT_API_README_SNIPPETS = [
  "const lab = require('@itkdm/open-lab-components');",
  "lab.list(",
  "lab.get(",
  "lab.readSync(",
  "npm install @itkdm/open-lab-components"
];

module.exports = {
  ROOT_API_EXPORTS,
  ROOT_API_README_SNIPPETS,
  ROOT_API_TYPE_SNIPPETS
};
