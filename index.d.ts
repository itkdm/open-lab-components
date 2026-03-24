/**
 * open-lab-components
 * Zero-dependency HTML fragment component library for STEM education.
 */

export interface ComponentProp {
  key: string;
  type: string;
  default: string | number | boolean;
  min?: number;
  max?: number;
  enum?: string[];
  desc: string;
}

export interface ComponentEvent {
  name: string;
  type: string;
  values: Record<string, string>;
}

export interface ComponentManifest {
  schema: string;
  id: string;
  name: string;
  nameEn: string;
  category: string;
  categoryName?: string;
  categoryNameEn?: string;
  version: string;
  viewport: { w: number; h: number };
  tags: string[];
  props: ComponentProp[];
  cssVars: Record<string, string>;
  events?: ComponentEvent[];
  sourcePath: string;
}

export interface Registry {
  schema: string;
  generatedAt: string;
  count: number;
  items: ComponentManifest[];
}

export interface ListFilter {
  category?: string;
  tag?: string;
}

/** List all available components, optionally filtered by category or tag. */
export function list(filter?: ListFilter): ComponentManifest[];

/** Get a single component manifest by ID. */
export function get(id: string): ComponentManifest | null;

/** Get all available category strings. */
export function categories(): string[];

/** Read component HTML source synchronously (Node.js only). */
export function readSync(id: string): string;

/** Read component HTML source asynchronously (Node.js only). */
export function read(id: string): Promise<string>;

/** Resolve the absolute file path of a component (Node.js only). */
export function resolve(id: string): string;

/** Mount component HTML into a DOM container (browser). Handles script re-activation. */
export function mount(html: string, container: HTMLElement, props?: Record<string, unknown>): void;

/** Unmount a previously mounted component and run any registered cleanup callbacks. */
export function unmount(container: HTMLElement): void;

/** Update data-props on the mounted component root. */
export function updateProps(container: HTMLElement, props?: Record<string, unknown>): void;

/** The full component registry object. */
export const registry: Registry;
