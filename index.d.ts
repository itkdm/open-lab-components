export interface ComponentPropText {
  label: string;
  desc: string;
  category?: string;
}

export interface ComponentProp {
  key: string;
  type: string;
  default: string | number | boolean;
  min?: number;
  max?: number;
  enum?: string[];
  label?: string;
  desc?: string;
  category?: string;
}

export interface ComponentEventText {
  label?: string;
  desc?: string;
  values: Record<string, string>;
}

export interface ComponentEvent {
  name: string;
  type: string;
  label?: string;
  desc?: string;
  values: Record<string, string>;
}

export interface ComponentLocaleData {
  name: string;
  tags: string[];
  ariaLabel: string;
  description?: string;
  props?: Record<string, ComponentPropText>;
  events?: Record<string, ComponentEventText>;
}

export interface ComponentManifest {
  schema: string;
  normalizedSchema: string;
  id: string;
  name: string;
  nameEn: string;
  ariaLabel: string;
  category: string;
  categoryName?: string;
  categoryNameEn?: string;
  categoryLocales?: Record<string, string>;
  version: string;
  viewport: { w: number; h: number };
  tags: string[];
  props: ComponentProp[];
  propTexts?: Record<string, ComponentPropText>;
  cssVars: Record<string, string>;
  events?: ComponentEvent[];
  eventTexts?: Record<string, ComponentEventText>;
  locales: Record<string, ComponentLocaleData>;
  sourcePath: string;
  description?: string | null;
}

export interface Registry {
  schema: string;
  generatedAt: string;
  defaultLocale: string;
  locales: string[];
  count: number;
  items: ComponentManifest[];
}

export interface VisualLocaleData {
  title: string;
  summary: string;
  prompt: string;
  tags: string[];
}

export interface VisualPersonMeta {
  name: string | null;
  url: string | null;
}

export interface VisualLinkMeta {
  label?: string | null;
  name?: string | null;
  url: string | null;
}

export interface VisualAsset {
  schema: string;
  id: string;
  subject: string;
  topic: string;
  type: string;
  version: string;
  format: string;
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  aiPrompt: string;
  aiPromptEn: string;
  tags: string[];
  gradeRange: string[];
  relatedComponents: string[];
  size: { width: number; height: number } | null;
  originType: string;
  author: VisualPersonMeta | null;
  source: VisualLinkMeta | null;
  license: VisualLinkMeta | null;
  thumbnailMode: string;
  focalPoint: { x: number; y: number } | null;
  featured: boolean;
  locales: Record<string, VisualLocaleData>;
  sourcePath: string;
  assetPath: string;
  thumbnailPath: string;
}

export interface VisualTaxonomy {
  schema: string;
  generatedAt: string;
  defaultLocale: string;
  locale: string;
  locales: string[];
  subjects: Record<string, string>;
  types: Record<string, string>;
  grades: Record<string, string>;
  originTypes: Record<string, string>;
  thumbnailModes: Record<string, string>;
}

export interface VisualRegistry {
  schema: string;
  generatedAt: string;
  defaultLocale: string;
  locales: string[];
  count: number;
  items: VisualAsset[];
}

export interface ListFilter {
  category?: string;
  tag?: string;
}

export interface VisualListFilter {
  subject?: string;
  topic?: string;
  type?: string;
  tag?: string;
}

export interface LocaleOptions {
  locale?: string;
}

export function list(filter?: ListFilter, options?: LocaleOptions): ComponentManifest[];
export function get(id: string, options?: LocaleOptions): ComponentManifest | null;
export function categories(): string[];
export function readSync(id: string): string;
export function read(id: string): Promise<string>;
export function resolve(id: string): string;
export function mount(html: string, container: HTMLElement, props?: Record<string, unknown>): void;
export function unmount(container: HTMLElement): void;
export function updateProps(container: HTMLElement, props?: Record<string, unknown>): void;
export const registry: Registry;
export const visuals: {
  list(filter?: VisualListFilter, options?: LocaleOptions): VisualAsset[];
  get(id: string, options?: LocaleOptions): VisualAsset | null;
  subjects(): string[];
  readSync(id: string): string | Uint8Array;
  read(id: string): Promise<string | Uint8Array>;
  resolve(id: string): string;
  taxonomy(locale?: string): VisualTaxonomy;
  registry: VisualRegistry;
};
