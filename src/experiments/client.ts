import { createSignal, onSettled } from 'solid-js';
import { loadAssignment } from './bootstrap';
import { experimentId, isGoal, isVariant, variants, type Assignment, type Goal } from './config';

declare global {
  interface Window {
    __HOME_EXPERIMENT__?: Assignment;
  }
}
const initial: Assignment = window.__HOME_EXPERIMENT__ ?? {
  experiment: experimentId,
  variant: 'control',
  mode: 'disabled',
};
const [assignment, setAssignment] = createSignal(initial);
export const homeMessage = () => variants[assignment().variant];
export const previewMode = () => assignment().mode === 'preview';
let exposed = initial.eligible === true;
export async function initializeExperiment(): Promise<void> {
  const value = await loadAssignment(window.__HOME_EXPERIMENT__, window.location.search);
  setAssignment(value);
  exposed = value.eligible === true;
}
const recorded = new Set<Goal>();
export function trackGoal(goal: Goal): void {
  if (
    assignment().mode !== 'live' ||
    (!exposed && goal !== 'exposure') ||
    recorded.has(goal) ||
    navigator.doNotTrack === '1' ||
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl
  )
    return;
  if (goal === 'exposure') exposed = true;
  recorded.add(goal);
  // Include the already-observed exposure so fast navigation cannot race its request.
  void fetch('/api/experiments/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events: goal === 'exposure' ? ['exposure'] : ['exposure', goal] }),
    keepalive: true,
  }).then(
    (response) => {
      if (!response.ok) recorded.delete(goal);
    },
    () => recorded.delete(goal),
  );
}
export async function optOut(): Promise<void> {
  const response = await fetch('/api/experiments/opt-out', { method: 'POST' });
  if (!response.ok) throw new Error('Could not save your preference. Please try again.');
  setAssignment({ ...assignment(), mode: 'disabled' });
}
export function startExperimentTracking(): void {
  onSettled(() => {
    let observer: IntersectionObserver | undefined;
    let visible = false;
    const observe = () => {
      observer?.disconnect();
      visible = false;
      if (location.pathname !== '/' || assignment().mode !== 'live') return;
      const heading = document.querySelector('#header h1');
      if (!heading) return;
      observer = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
          if (visible && !document.hidden) trackGoal('exposure');
        },
        { threshold: 0.5 },
      );
      observer.observe(heading);
    };
    const visibility = () => {
      if (visible && !document.hidden) trackGoal('exposure');
    };
    const click = (event: MouseEvent) => {
      if (
        !event.isTrusted ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>('[data-experiment-goal]')
          : null;
      const goal = target?.dataset.experimentGoal;
      if (isGoal(goal) && goal !== 'exposure') trackGoal(goal);
    };
    document.addEventListener('click', click, true);
    document.addEventListener('visibilitychange', visibility);
    observe();
    const mutation = new MutationObserver(observe);
    mutation.observe(document.getElementById('header')?.parentElement ?? document.body, {
      childList: true,
    });
    return () => {
      observer?.disconnect();
      mutation.disconnect();
      document.removeEventListener('click', click, true);
      document.removeEventListener('visibilitychange', visibility);
    };
  });
}
export function trackPage(pathname: string): void {
  if (pathname.startsWith('/tutorial/')) trackGoal('tutorial_opened');
  if (pathname === '/guides/getting-started') trackGoal('setup_opened');
  if (pathname === '/docs' || pathname.startsWith('/docs/')) trackGoal('docs_opened');
}
export function previewLink(variant: string): string {
  return isVariant(variant) ? `/?home_variant=${variant}` : '/';
}
