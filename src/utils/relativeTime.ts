import { createMemo, createSignal, onSettled, type Accessor } from 'solid-js';

export const DAY = 86_400_000;
const [now, setNow] = createSignal(Date.now());

/** One clock for all resource cards, disposed with the application. */
export function startRelativeClock() {
  onSettled(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  });
}

export function createTimeAgo(date: Accessor<Date>) {
  const difference = createMemo(() => now() - date().getTime());
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const text = createMemo(() => {
    const seconds = -difference() / 1000;
    for (const [unit, size] of [
      ['year', 31_536_000],
      ['month', 2_592_000],
      ['day', 86_400],
      ['hour', 3600],
      ['minute', 60],
      ['second', 1],
    ] as const) {
      if (Math.abs(seconds) >= size || unit === 'second')
        return formatter.format(Math.round(seconds / size), unit);
    }
    return '';
  });
  return [text, { difference }] as const;
}
