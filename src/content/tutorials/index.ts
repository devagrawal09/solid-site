import type { Component } from 'solid-js';
import directory from './directory.json';
import aliases from './aliases.json';

export type LessonLookup = (typeof directory)[number];
export interface LessonFiles {
  files: { name: string; type?: string; content: string }[];
}
interface LessonSource {
  lesson: LessonFiles;
  solved: LessonFiles;
}

const sources = import.meta.glob<{ default: LessonSource }>([
  './*.json',
  '!./directory.json',
  '!./aliases.json',
]);
const descriptions = import.meta.glob<{ default: Component }>('./*.mdx');

export const tutorialDirectory = directory;
export const firstTutorialId = directory[0].internalName;

export function canonicalTutorialId(id: string) {
  return (aliases as Record<string, string>)[id] ?? id;
}

export async function getTutorial(id: string) {
  const source = sources[`./${id}.json`];
  const description = descriptions[`./${id}.mdx`];
  if (!source || !description) throw new Error(`Unknown tutorial: ${id}`);
  const [files, markdown] = await Promise.all([source(), description()]);
  return { ...files.default, markdown: markdown.default };
}
