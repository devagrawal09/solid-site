import { createSignal, lazy, onSettled, For, Loading, Show } from 'solid-js';
import { Meta, Title } from '@solidjs/meta';
import { createViewportObserver } from '@solid-primitives/intersection-observer';
import iconBlocks1 from '../assets/icons/blocks1.svg';
import iconBlocks2 from '../assets/icons/blocks2.svg';
import sandbox from '../assets/icons/sandbox.svg';
import performant from '../assets/icons/performant.svg';
import powerful from '../assets/icons/powerful.svg';
import pragmatic from '../assets/icons/pragmatic.svg';
import productive from '../assets/icons/productive.svg';
import Footer from '../components/Footer';
import { useRouteReadyState } from '../utils/routeReadyState';
import { useAppState } from '../AppContext';
import { solidReferenceUrl, solidVersion } from '../content/site';
import counterSource from '../content/home/counter.tsx?raw';
import { homeMessage, previewMode } from '../experiments/client';

const Repl = lazy(() => import('../components/ReplTab'));
const icons: Record<string, string> = { performant, powerful, pragmatic, productive };
const demoTabs = [{ name: 'main.tsx', source: counterSource }];

export default function Home() {
  const context = useAppState();
  const { t } = context;
  const [loadRepl, setLoadRepl] = createSignal(false);
  const [observeInteraction] = createViewportObserver({ threshold: 0.4 });
  let playgroundRef!: HTMLDivElement;

  onSettled(() => {
    observeInteraction(playgroundRef, (entry) => entry.isIntersecting && setLoadRepl(true));
  });
  useRouteReadyState();

  return (
    <>
      <Title>SolidJS · Reactive UI, ready for async</Title>
      <Meta name="description" content={t('home.v2.intro')} />
      <div dir="ltr" lang="en" class="flex flex-col">
        <div class="container px-5 pt-8 lg:px-12">
          <Show when={previewMode()}>
            <p role="note" class="mb-6 rounded-lg border border-solid-light p-4">
              Copy preview: {homeMessage().label}. This visit is excluded from experiment results.
            </p>
          </Show>
          <Show when={context.locale !== 'en'}>
            <p
              role="note"
              class="mb-6 rounded-lg border border-solid-light/30 bg-solid-light/10 p-4"
            >
              {t('home.v2.translation_notice')}
            </p>
          </Show>
          <a
            href="/docs"
            class="block rounded-xl bg-solid-light/10 px-6 py-4 text-solid-medium transition hover:bg-solid-light/20 dark:text-solid-darkdefault"
          >
            <span class="font-semibold">Solid {solidVersion}</span>
            {' · '}
            {t('home.v2.announcement')} →
          </a>
          <section
            aria-label="Solid 2 principles"
            class="grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4"
          >
            <For each={t('home.v2.principles')}>
              {(principle: { icon: string; label: string; description: string }) => (
                <div>
                  <img
                    class="mb-5 h-12 w-12 dark:brightness-150"
                    src={icons[principle.icon]}
                    alt=""
                  />
                  <h2 class="mb-3 text-xl font-semibold">{principle.label}</h2>
                  <p class="leading-7 text-gray-600 dark:text-gray-300">{principle.description}</p>
                </div>
              )}
            </For>
          </section>
        </div>

        <div class="container px-5 lg:px-12">
          <section
            aria-labelledby="playground-title"
            class="grid scroll-mt-24 gap-10 py-12 xl:grid-cols-[minmax(0,12fr)_minmax(0,9fr)]"
          >
            <div
              id="playground"
              class="min-w-0 order-2 scroll-mt-24 xl:order-1"
              ref={playgroundRef}
            >
              <p class="mb-3 text-sm text-gray-500 dark:text-gray-400">
                {t('home.v2.example.hint')}
              </p>
              <div
                class="flex h-[65vh] min-h-[475px] max-h-[600px] flex-col overflow-hidden rounded-xl shadow-xl outline outline-2 outline-gray-200 dark:outline-solid-darkLighterBg"
                data-home-playground
              >
                <Show
                  when={loadRepl()}
                  fallback={<p class="m-auto p-6">{t('home.v2.example.loading')}</p>}
                >
                  <Loading fallback={<p class="m-auto p-6">{t('home.v2.example.loading')}</p>}>
                    <Repl tabs={demoTabs} />
                  </Loading>
                </Show>
              </div>
            </div>
            <div class="order-1 flex flex-col justify-center xl:order-2">
              <img class="w-20" src={iconBlocks1} alt="" />
              <h2 id="playground-title" class="mt-6 text-3xl font-semibold leading-tight">
                {t('home.v2.example.headline')}
              </h2>
              <For each={t('home.v2.example.copy')}>
                {(copy: string) => <p class="mt-6 leading-7">{copy}</p>}
              </For>
              <a
                href="/tutorial/signals"
                class="mt-8 font-semibold text-solid-default underline dark:text-solid-darkdefault"
              >
                {t('home.v2.example.link_label')} →
              </a>
            </div>
          </section>

          <section
            aria-labelledby="ownership-title"
            class="my-12 grid gap-8 rounded-3xl bg-solid-lightgray px-6 py-12 dark:bg-solid-darkLighterBg md:grid-cols-2 lg:px-12"
          >
            <div>
              <img class="w-16" src={sandbox} alt="" />
              <h2 id="ownership-title" class="mt-6 text-3xl font-semibold leading-tight">
                {t('home.v2.ownership.headline')}
              </h2>
            </div>
            <div class="flex flex-col justify-center">
              <p class="leading-7">{t('home.v2.ownership.copy')}</p>
              <a
                href="/tutorial/ownership"
                class="mt-6 font-semibold text-solid-default underline dark:text-solid-darkdefault"
              >
                {t('home.v2.ownership.link_label')} →
              </a>
            </div>
          </section>

          <section aria-labelledby="async-title" class="py-12">
            <div class="max-w-3xl">
              <img class="w-20" src={iconBlocks2} alt="" />
              <h2 id="async-title" class="mt-6 text-3xl font-semibold leading-tight">
                {t('home.v2.async.headline')}
              </h2>
              <p class="mt-6 leading-7">{t('home.v2.async.copy')}</p>
            </div>
            <ol class="mt-8 grid gap-5 md:grid-cols-3">
              <For each={t('home.v2.async.steps')}>
                {(step: { title: string; copy: string; link: string; label: string }) => (
                  <li class="flex flex-col rounded-xl border border-gray-200 p-6 dark:border-solid-light/30">
                    <h3 class="text-xl font-semibold">{step.title}</h3>
                    <p class="mt-4 flex-1 leading-7">{step.copy}</p>
                    <a
                      href={step.link}
                      class="mt-6 font-semibold text-solid-default underline dark:text-solid-darkdefault"
                    >
                      {step.label} →
                    </a>
                  </li>
                )}
              </For>
            </ol>
          </section>

          <section
            aria-labelledby="features-title"
            class="my-12 rounded-3xl bg-solid-lightgray px-6 py-12 dark:bg-solid-darkLighterBg lg:px-12"
          >
            <h2 id="features-title" class="text-3xl font-semibold">
              {t('home.v2.features.headline')}
            </h2>
            <p class="mt-5 max-w-3xl leading-7">{t('home.v2.features.copy')}</p>
            <ul class="mt-6 flex flex-wrap gap-3">
              <For each={t('home.v2.features.list')}>
                {(feature: string) => (
                  <li class="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600">
                    {feature}
                  </li>
                )}
              </For>
            </ul>
            <div class="mt-8 flex flex-wrap gap-6 font-semibold text-solid-default underline dark:text-solid-darkdefault">
              <a href="/guides/getting-started">{t('home.v2.features.setup')} →</a>
              <a href={`${solidReferenceUrl}/reference`}>{t('home.v2.features.reference')} ↗</a>
            </div>
            <p class="mt-8 text-sm leading-6 text-gray-600 dark:text-gray-300">
              {t('home.v2.performance.copy')}{' '}
              <a href="https://github.com/krausest/js-framework-benchmark" class="underline">
                {t('home.v2.performance.link_label')} ↗
              </a>
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}
