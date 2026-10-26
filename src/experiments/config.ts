// Freeze a running experiment. Change the ID before changing its copy or allocation.
export const experimentId = 'homepage-message-v1';
export const attributionDays = 7;
export const enrollmentDays = 14;
export const variants = {
  control: {
    label: 'Technical (control)',
    headline: 'Reactive UI, ready for async.',
    intro:
      'Build interfaces from state and the answers that depend on it. Solid connects those reads to precise updates, whether the answer is ready now or arrives later.',
  },
  speed: {
    label: 'Speed and responsiveness',
    headline: 'Build apps that feel instant.',
    intro:
      'Create fast, interactive web experiences with a JavaScript framework that keeps your code straightforward.',
  },
  experience: {
    label: 'Developer experience',
    headline: 'From idea to interactive.',
    intro:
      'Build with familiar JavaScript, expressive components, and tools that help you stay focused on your application.',
  },
} as const;
export type Variant = keyof typeof variants;
export const variantIds = Object.keys(variants) as Variant[];
export const goals = [
  'exposure',
  'hero_cta',
  'tutorial_opened',
  'learning_started',
  'setup_opened',
  'docs_opened',
  'playground_edited',
] as const;
export type Goal = (typeof goals)[number];
export type Assignment = {
  experiment: typeof experimentId;
  variant: Variant;
  mode: 'live' | 'preview' | 'disabled';
  eligible?: boolean;
};
export function isVariant(value: unknown): value is Variant {
  return typeof value === 'string' && Object.hasOwn(variants, value);
}
export function isGoal(value: unknown): value is Goal {
  return typeof value === 'string' && goals.includes(value as Goal);
}
export function rateInterval(successes: number, total: number): [number, number] {
  if (!total) return [0, 1];
  const z = 1.959963984540054;
  const p = successes / total;
  const denominator = 1 + (z * z) / total;
  const center = (p + (z * z) / (2 * total)) / denominator;
  const radius = (z * Math.sqrt((p * (1 - p) + (z * z) / (4 * total)) / total)) / denominator;
  return [Math.max(0, center - radius), Math.min(1, center + radius)];
}
