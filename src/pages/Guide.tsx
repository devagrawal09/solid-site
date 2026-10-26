import { For, Show, type Component } from 'solid-js';
import { dynamic } from '@solidjs/web';
import { Title } from '@solidjs/meta';
import { guideDirectory, solidReferenceUrl, solidVersion } from '../content/guides';
import type { GuideRouteData } from './Guide.data';
import { useRouteReadyState } from '../utils/routeReadyState';
import DocsLanguageNotice from '../components/DocsLanguageNotice';
import Footer from '../components/Footer';
import FourOhFour from './404';

const Guide: Component<{ data: GuideRouteData }> = (props) => {
  const Markdown = dynamic(() => props.data.markdown);
  useRouteReadyState();

  return (
    <Show when={props.data.metadata} fallback={<FourOhFour />}>
      <Title>{props.data.metadata?.title} | SolidJS</Title>
      <div dir="ltr" lang="en" class="container px-5 py-10 lg:px-12">
        <div class="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside>
            <nav aria-label="Solid 2 guides" class="space-y-5 lg:sticky lg:top-24">
              <a href="/docs" class="block font-semibold text-solid-light">
                ← Learning paths
              </a>
              <p class="text-sm text-gray-500 dark:text-gray-400">Solid {solidVersion}</p>
              <ul class="space-y-3">
                <For each={guideDirectory}>
                  {(guide) => (
                    <li>
                      <a
                        href={`/guides/${guide.id}`}
                        aria-current={props.data.metadata?.id === guide.id ? 'page' : undefined}
                        class="block rounded-lg px-3 py-2 hover:bg-solid-light/10 aria-[current=page]:bg-solid-light/10 aria-[current=page]:font-semibold"
                      >
                        {guide.title}
                      </a>
                    </li>
                  )}
                </For>
              </ul>
              <a href={`${solidReferenceUrl}/reference`} class="block text-solid-light underline">
                Solid 2 API reference ↗
              </a>
            </nav>
          </aside>
          <div class="min-w-0 max-w-3xl">
            <DocsLanguageNotice />
            <p class="mb-3 text-sm font-semibold uppercase tracking-wider text-solid-light">
              Solid 2 guide
            </p>
            <h1 class="mb-4 text-4xl font-semibold">{props.data.metadata?.title}</h1>
            <p class="mb-10 text-lg text-gray-600 dark:text-gray-300">
              {props.data.metadata?.description}
            </p>
            <article class="prose max-w-none dark:prose-invert prose-headings:scroll-mt-24 prose-pre:overflow-x-auto prose-table:block prose-table:overflow-x-auto">
              <Markdown />
            </article>
            <a href="/docs" class="mt-12 inline-block text-solid-light underline">
              Back to learning paths
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </Show>
  );
};

export default Guide;
