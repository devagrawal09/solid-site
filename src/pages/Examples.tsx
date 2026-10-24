import Repl from '../components/Repl';
import { useParams } from '@solidjs/router';
import {
  For,
  type Component,
  createSignal,
  createMemo,
  createEffect,
  onCleanup,
  Errored,
  Show,
} from 'solid-js';
import type { ExamplesDataRoute } from './Examples.data';

import { useRouteReadyState } from '../utils/routeReadyState';
import { useAppState } from '../AppContext';
import type { Tab } from 'solid-repl';
import { entries } from '@solid-primitives/utils';
import { Title } from '@solidjs/meta';

const Examples: Component<{ data: ExamplesDataRoute }> = (props) => {
  const data = props.data;
  const context = useAppState();
  const { t } = context;
  const params = useParams<{ id: string }>();
  const [tabs, setTabs] = createSignal<Tab[]>([]);

  useRouteReadyState();

  let currentData: {
    name: string;
    source: string;
  }[] = [];

  const example = createMemo(async () => {
    const controller = new AbortController();
    onCleanup(() => controller.abort());
    const response = await fetch(`/examples/${encodeURIComponent(params.id)}.json`, {
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Unable to load example (${response.status})`);
    return (await response.json()) as {
      files: { name: string; type?: string; content: string | string[] }[];
    };
  });
  createEffect(example, (exampleData) => {
    currentData = [
      ...exampleData.files.map((file) => ({
        name: file.name + (file.type ? `.${file.type}` : '.jsx'),
        source: Array.isArray(file.content) ? file.content.join('\n') : file.content,
      })),
    ];
    setTabs(currentData);
  });

  return (
    <div class="flex flex-col relative">
      <Title>Examples | SolidJS</Title>
      <div class="container my-10 w-[98vw] mx-auto">
        <div class="md:grid md:grid-cols-12 gap-6">
          <div class="md:col-span-4 lg:col-span-3 overflow-auto border dark:border-solid-darkLighterBg p-5 rounded md:h-[82vh]">
            {entries(data.list).map(([name, examples]) => (
              <>
                <h3 class="text-xl text-solid-default dark:border-solid-darkLighterBg dark:text-solid-darkdefault border-b-2 font-semibold border-solid pb-2">
                  {t(`examples.${name.toLowerCase() as Lowercase<typeof name>}`)}
                </h3>
                <div class="mb-10">
                  <For each={examples}>
                    {(example) => (
                      <a
                        dir="ltr"
                        href={`/examples/${example.id}`}
                        class={[
                          'block my-4 space-y-2 text-sm py-3 pl-2 border-b hover:opacity-60 dark:border-solid-darkLighterBg',
                          'data-[active]:text-solid-light data-[active]:dark:text-solid-darkdefault',
                        ]}
                      >
                        <span>{example.name}</span>
                        <span>{example.id === params.id}</span>
                        <span class="block text-gray-500 text-xs dark:text-white/40 text-md">
                          {example.description}
                        </span>
                      </a>
                    )}
                  </For>
                </div>
              </>
            ))}
          </div>

          <div
            dir="ltr"
            class="h-[82vh] rounded-lg md:col-span-8 lg:col-span-9 overflow-hidden shadow-2xl flex"
          >
            <Errored
              fallback={
                <>
                  Repl failed to load. You may be using a browser that doesn't support Web Workers.
                </>
              }
            >
              <Show when={tabs().length}>
                <Repl
                  version="1.9.17"
                  dark={context.isDark}
                  tabs={tabs()}
                  reset={() => {
                    setTabs(currentData);
                  }}
                  setTabs={setTabs}
                  id="examples"
                />
              </Show>
            </Errored>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Examples;
