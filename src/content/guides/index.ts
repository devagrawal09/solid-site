import type { Component } from 'solid-js';
import directory from './directory.json';

export const guideDirectory = directory;
export type GuideMetadata = (typeof directory)[number];
export const solidVersion = __SOLID_VERSION__;
export const solidReferenceUrl = 'https://v2.solidjs.com';

const sources = import.meta.glob<{ default: Component }>('./*.mdx');

// Keep published guide URLs useful without serving the Solid 1 explanations.
export const legacyGuideDestinations: Record<string, string> = {
  reactivity: '/tutorial/signals',
  rendering: '/tutorial/jsx',
  server: '/docs#server-rendering',
  typescript: '/docs#typescript',
  testing: '/docs#testing',
  comparison: '/docs#mental-model',
  faq: '/docs#reference',
};

export async function getGuide(id: string) {
  return (await sources[`./${id}.mdx`]?.())?.default;
}
