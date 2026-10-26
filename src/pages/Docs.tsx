import { For } from 'solid-js';
import { Title } from '@solidjs/meta';
import { guideDirectory, solidReferenceUrl, solidVersion } from '../content/guides';
import tutorialDirectory from '../content/tutorials/directory.json';
import { useRouteReadyState } from '../utils/routeReadyState';
import DocsLanguageNotice from '../components/DocsLanguageNotice';
import Footer from '../components/Footer';

const topics = [
  {
    id: 'mental-model',
    title: 'Think in sources and answers',
    description: 'Use signals for what can change and derivations for what follows from it.',
    path: '/tutorial/derived-values',
    label: 'Practice derivations',
  },
  {
    id: 'ownership',
    title: 'Give state and work a lifetime',
    description: 'Components and control-flow branches own reactive work and its cleanup.',
    path: '/tutorial/ownership',
    label: 'Explore ownership',
  },
  {
    id: 'async',
    title: 'Read async answers in the same graph',
    description: 'Separate first readiness, pending changes, failures, and writes to the server.',
    path: '/tutorial/async-memos',
    label: 'Learn async derivations',
  },
];

const references = [
  {
    id: 'api',
    title: 'API reference',
    path: '/reference',
    description: 'Core, web, router, and tooling APIs.',
  },
  {
    id: 'server-rendering',
    title: 'Server rendering',
    path: '/concepts/rendering-and-ssr',
    description: 'HTML, hydration, and streaming.',
  },
  {
    id: 'typescript',
    title: 'TypeScript',
    path: '/guides/typescript',
    description: 'Props, JSX, events, and reactive types.',
  },
  {
    id: 'testing',
    title: 'Testing',
    path: '/guides/testing',
    description: 'Test components and wait for reactive work.',
  },
];

export default function Docs() {
  useRouteReadyState();

  return (
    <>
      <Title>Learn Solid 2 | SolidJS</Title>
      <div dir="ltr" lang="en" class="container px-5 py-12 lg:px-12">
        <DocsLanguageNotice />
        <section aria-labelledby="learn-solid" class="max-w-3xl">
          <p class="mb-4 text-sm font-semibold uppercase tracking-wider text-solid-light">
            Solid {solidVersion} · Release candidate
          </p>
          <h1 id="learn-solid" class="mb-6 text-4xl font-semibold sm:text-5xl">
            Learn Solid 2
          </h1>
          <p class="mb-8 text-xl leading-relaxed text-gray-600 dark:text-gray-300">
            Describe what your UI depends on. Solid tracks those reads and updates the parts that
            change, including when an answer takes time to arrive.
          </p>
          <a
            href="/tutorial/welcome"
            class="inline-block rounded-lg bg-solid-medium px-6 py-3 text-white transition hover:bg-solid-dark"
          >
            Start the interactive tutorial
          </a>
          <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">
            {tutorialDirectory.length} lessons with editable examples. No setup required.
          </p>
        </section>

        <section aria-labelledby="choose-path" class="mt-14">
          <h2 id="choose-path" class="mb-6 text-2xl font-semibold">
            Choose your next step
          </h2>
          <div class="grid gap-5 md:grid-cols-3">
            <For each={guideDirectory}>
              {(guide) => (
                <a
                  href={`/guides/${guide.id}`}
                  class="rounded-xl border border-gray-200 p-6 hover:border-solid-light dark:border-solid-light/30"
                >
                  <h3 class="mb-3 text-xl font-semibold text-solid-light">{guide.title} →</h3>
                  <p>{guide.description}</p>
                </a>
              )}
            </For>
            <a
              href="/examples/counter"
              class="rounded-xl border border-gray-200 p-6 hover:border-solid-light dark:border-solid-light/30"
            >
              <h3 class="mb-3 text-xl font-semibold text-solid-light">
                Explore working examples →
              </h3>
              <p>Try counters, forms, stores, and async UI in the editor.</p>
            </a>
          </div>
        </section>

        <section aria-labelledby="model-title" class="mt-14">
          <h2 id="model-title" class="mb-6 text-2xl font-semibold">
            Build the model first
          </h2>
          <div class="grid gap-8 md:grid-cols-3">
            <For each={topics}>
              {(topic) => (
                <div id={topic.id} class="scroll-mt-24">
                  <h3 class="mb-3 text-xl font-semibold">{topic.title}</h3>
                  <p class="mb-4">{topic.description}</p>
                  <a href={topic.path} class="text-solid-light underline">
                    {topic.label} →
                  </a>
                </div>
              )}
            </For>
          </div>
        </section>

        <section id="reference" aria-labelledby="reference-title" class="mt-14 scroll-mt-24">
          <h2 id="reference-title" class="mb-4 text-2xl font-semibold">
            Keep the Solid 2 reference nearby
          </h2>
          <p class="mb-6 max-w-3xl">
            The dedicated Solid 2 documentation covers APIs and complete applications. This site's
            exercises use {solidVersion}; check release notes when choosing a newer RC.
          </p>
          <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <For each={references}>
              {(reference) => (
                <a
                  id={reference.id}
                  href={`${solidReferenceUrl}${reference.path}`}
                  class="scroll-mt-24 rounded-xl bg-solid-light/10 p-5 hover:bg-solid-light/20"
                >
                  <h3 class="mb-2 font-semibold text-solid-light">{reference.title} ↗</h3>
                  <p>{reference.description}</p>
                </a>
              )}
            </For>
          </div>
          <p class="mt-8 text-sm text-gray-600 dark:text-gray-300">
            Maintaining a Solid 1 app? Use the{' '}
            <a class="underline" href="https://docs.solidjs.com">
              Solid 1 documentation
            </a>
            . Libraries and starter templates need to support the same Solid major as your app.
          </p>
        </section>
      </div>
      <Footer />
    </>
  );
}
