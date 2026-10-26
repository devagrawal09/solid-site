import { experimentId, isVariant, type Assignment } from './config';

const fallback: Assignment = { experiment: experimentId, variant: 'control', mode: 'disabled' };
function valid(value: unknown): value is Assignment {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'experiment' in value &&
      value.experiment === experimentId &&
      'variant' in value &&
      isVariant(value.variant) &&
      'mode' in value &&
      ['live', 'preview', 'disabled'].includes(String(value.mode)) &&
      (!('eligible' in value) || typeof value.eligible === 'boolean'),
  );
}
export async function loadAssignment(
  injected: unknown,
  search: string,
  fetcher: typeof fetch = fetch,
): Promise<Assignment> {
  if (valid(injected)) return injected;
  const preview = new URLSearchParams(search).get('home_variant');
  const endpoint = `/api/experiments/assignment${isVariant(preview) ? `?home_variant=${preview}` : ''}`;
  try {
    const response = await fetcher(endpoint, {
      cache: 'no-store',
      signal: AbortSignal.timeout(1500),
    });
    if (!response.ok) return fallback;
    const value: unknown = await response.json();
    return valid(value) ? value : fallback;
  } catch {
    return fallback;
  }
}
