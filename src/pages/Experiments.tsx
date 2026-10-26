import { createMemo, createSignal, For, Loading, Show, Errored } from 'solid-js';
import { Title } from '@solidjs/meta';
import {
  attributionDays,
  experimentId,
  rateInterval,
  variants,
  variantIds,
  type Variant,
} from '../experiments/config';
import { previewLink } from '../experiments/client';

interface Arm {
  variant: Variant;
  visitors: number;
  hero_cta: number;
  tutorial_opened: number;
  learning_started: number;
  setup_opened: number;
  docs_opened: number;
  playground_edited: number;
  matured_visitors: number;
  matured_conversions: number;
  first_exposure?: number;
}
type Report = { arms: Arm[]; generatedAt: number; startedAt: number | null };
const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
// Planning assumption: 10% -> 13%, 80% power, two two-sided comparisons, family-wise alpha 5%.
const plannedSample = Math.ceil(
  ((2.2414027 * Math.sqrt(2 * 0.115 * 0.885) + 0.8416212 * Math.sqrt(0.1 * 0.9 + 0.13 * 0.87)) /
    0.03) **
    2,
);

function Results(props: { report: Report }) {
  const first = () => props.report.startedAt ?? Infinity;
  const enoughTime = () =>
    Number.isFinite(first()) && Date.now() - first() >= (14 + attributionDays) * 86_400_000;
  const ready = () =>
    enoughTime() && props.report.arms.every((arm) => arm.matured_visitors >= plannedSample);
  const rate = (arm: Arm) => (arm.visitors ? arm.learning_started / arm.visitors : 0);
  const baseline = () => props.report.arms.find((arm) => arm.variant === 'control')!;
  return (
    <>
      <div class="grid gap-4 sm:grid-cols-3">
        <For each={props.report.arms}>
          {(arm) => (
            <section class="rounded-xl border border-gray-300 p-6 dark:border-gray-600">
              <p class="text-sm text-gray-600 dark:text-gray-300">{variants[arm.variant].label}</p>
              <h2 class="mt-3 text-2xl font-semibold">
                {arm.visitors ? percent(rate(arm)) : 'No data yet'}
              </h2>
              <p class="mt-2">
                {arm.learning_started} / {arm.visitors} browsers started learning
              </p>
              <Show when={arm.visitors > 0}>
                <p class="mt-2 text-sm">
                  95% interval:{' '}
                  {rateInterval(arm.learning_started, arm.visitors).map(percent).join(' – ')}
                </p>
              </Show>
              <Show
                when={
                  arm.variant !== 'control' && baseline().learning_started > 0 && arm.visitors > 0
                }
              >
                <p class="mt-2 text-sm">
                  Observed relative lift: {percent(rate(arm) / rate(baseline()) - 1)}. Not a winner
                  declaration.
                </p>
              </Show>
            </section>
          )}
        </For>
      </div>
      <p class="rounded-xl bg-solid-light/10 p-5">
        {ready()
          ? 'Planned sample reached — ready for a fixed-horizon review.'
          : enoughTime()
            ? 'Study complete — insufficient sample for the planned effect. Treat the result as inconclusive.'
            : 'Collecting data — no winner yet.'}{' '}
        Initial plan: at least {plannedSample.toLocaleString()} mature browsers per version, 14 days
        of enrollment, then seven days for outcomes. Enrollment closes automatically. The 10%
        baseline and 30% relative improvement are planning assumptions. Review the plan before
        driving traffic.
      </p>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <caption class="mb-4 text-left font-semibold">
            Unique browsers per outcome · provisional, seven-day attribution
          </caption>
          <thead>
            <tr>
              <th class="p-3">Version</th>
              <th class="p-3">Exposed</th>
              <th class="p-3">Hero clicks</th>
              <th class="p-3">Tutorial opened</th>
              <th class="p-3">Learning started</th>
              <th class="p-3">Setup opened</th>
              <th class="p-3">Docs opened</th>
              <th class="p-3">Playground edited</th>
              <th class="p-3">Mature cohort</th>
              <th class="p-3">Mature learning rate</th>
            </tr>
          </thead>
          <tbody>
            <For each={props.report.arms}>
              {(arm) => (
                <tr class="border-t border-gray-300 dark:border-gray-600">
                  <th class="p-3">{variants[arm.variant].label}</th>
                  <For
                    each={[
                      arm.visitors,
                      arm.hero_cta,
                      arm.tutorial_opened,
                      arm.learning_started,
                      arm.setup_opened,
                      arm.docs_opened,
                      arm.playground_edited,
                      arm.matured_visitors,
                    ]}
                  >
                    {(value) => <td class="p-3">{value}</td>}
                  </For>
                  <td class="p-3">
                    {arm.matured_visitors
                      ? percent(arm.matured_conversions / arm.matured_visitors)
                      : '—'}
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
      <p class="text-sm">
        Updated {new Date(props.report.generatedAt).toLocaleString()}. Intervals describe
        uncertainty; repeated peeking and multiple comparisons can produce misleading apparent
        winners. Use mature cohorts for the final comparison, check allocation balance, and retain
        unsuccessful outcomes in the denominator.
      </p>
    </>
  );
}

export default function Experiments() {
  const [refresh, setRefresh] = createSignal(0);
  const report = createMemo(async () => {
    refresh();
    const response = await fetch('/api/experiments/results', { cache: 'no-store' });
    const data = await response.json();
    return { status: response.status, data: data as Report & { error?: string } };
  });
  return (
    <article class="container space-y-8 px-6 py-16 lg:px-12">
      <Title>Landing page experiments | SolidJS</Title>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-sm">{experimentId}</p>
          <h1 class="mt-2 text-3xl font-semibold">Which introduction helps people get started?</h1>
        </div>
        <button class="button" onClick={() => setRefresh((value) => value + 1)}>
          Refresh results
        </button>
      </div>
      <p>
        The three versions change only the hero headline and introduction. Allocation is random and
        equal; the same browser keeps its version. Primary outcome: editing tutorial code, choosing
        Solve, or advancing to the next lesson within seven days of a visible homepage introduction.
        Opens and clicks are secondary outcomes.
      </p>
      <Errored
        fallback={(error) => (
          <p role="alert">Could not load results: {String(error())}. Try refreshing.</p>
        )}
      >
        <Loading fallback={<p>Loading experiment results…</p>}>
          <Show
            when={report().status === 200}
            fallback={
              <div class="space-y-4 rounded-xl border p-6">
                <p role="status">{report().data.error ?? 'Results are unavailable.'}</p>
                <Show when={report().status === 401}>
                  <a
                    href="/signin-with-chatgpt?return_to=%2Fexperiments"
                    target="_top"
                    class="button"
                  >
                    Sign in with ChatGPT
                  </a>
                </Show>
              </div>
            }
          >
            <Results report={report().data} />
          </Show>
        </Loading>
      </Errored>
      <section class="space-y-4 border-t pt-8">
        <h2 class="text-xl font-semibold">Preview each version</h2>
        <p>
          Preview links, signed-in owner visits, bots, and privacy opt-outs are excluded from
          measurements.
        </p>
        <div class="flex flex-wrap gap-4">
          <For each={variantIds}>
            {(variant) => (
              <a class="underline" href={previewLink(variant)} target="_blank" rel="noopener">
                {variants[variant].label} ↗
              </a>
            )}
          </For>
        </div>
      </section>
      <p class="text-sm">
        Blocked cookies, cleared cookies, multiple devices, bots that evade detection, and low
        traffic limit these results. This is a comparison of browsers on this deployment, not all
        Solid users.
      </p>
    </article>
  );
}
