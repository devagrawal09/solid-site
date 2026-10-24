import {
  For,
  type Component,
  Show,
  createSignal,
  createEffect,
  Loading,
  createMemo,
  Errored,
} from 'solid-js';
import { dynamic } from '@solidjs/web';
import Repl from '../components/Repl';

import { Icon } from '../components/icons/Icon';
import { arrowLeft, arrowRight, chevronDown, chevronDoubleRight } from '../components/icons/solid';
import { Title } from '@solidjs/meta';

import type { TutorialRouteData } from './Tutorial.data';
import Dismiss from '../components/Dismiss';
import { useRouteReadyState } from '../utils/routeReadyState';
import { reflow } from '../utils/reflow';
import { useAppState } from '../AppContext';
import type { LessonLookup } from '../content/tutorials';
import type { Tab } from 'solid-repl';
const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

interface DirectoryMenuProps {
  directory?: Record<string, LessonLookup[]>;
  current?: LessonLookup;
}

const DirectoryMenu: Component<DirectoryMenuProps> = (props) => {
  const [showDirectory, setShowDirectory] = createSignal(false);
  const [searchQuery, setSearchQuery] = createSignal('');
  let listContainer!: HTMLOListElement;
  let menuButton!: HTMLButtonElement;
  let search!: HTMLInputElement;
  const directory = createMemo(() => Object.entries(props.directory || {}));
  const filteredDirectory = createMemo<[string, LessonLookup[]][]>(() => {
    return (
      directory()
        .map<[string, LessonLookup[]]>(([section, entries]) => [
          section,
          // TODO: Refactor this to be more easily digesteable (it's not that bad)
          entries.filter((entry) =>
            Object.values(entry).some((value: string) =>
              value.toLowerCase().includes(searchQuery().toLowerCase()),
            ),
          ),
        ])
        // Filter out sections that have no entries
        .filter(([, entries]) => entries.length > 0)
    );
  });

  // Close the dropdown menu every time the `current` page changes
  // and reset the querySearch
  createEffect(
    () => props.current,
    () => {
      const timer = setTimeout(() => {
        setShowDirectory(false);
        setSearchQuery('');
      }, 0);
      return () => clearTimeout(timer);
    },
  );

  createEffect(showDirectory, (visible) => {
    if (visible) {
      search.focus();
      document.documentElement.style.scrollBehavior = 'auto';
      reflow(); // reflow

      const activeItem = listContainer.querySelector('a[data-active]');
      if (activeItem) {
        activeItem.scrollIntoView();
        listContainer.scroll({ top: listContainer.scrollTop - search.offsetHeight }); // reflow
      }

      window.scrollTo({ top: 0 });
      document.documentElement.style.scrollBehavior = 'smooth';
    }
  });

  return (
    <>
      <button
        class="py-2 px-10 flex items-center focus:outline-none space-x-1 group"
        ref={menuButton}
      >
        <div class="flex-grow inline-flex flex-col items-baseline">
          <h3 class="text-xl text-solid leading-none">{props.current?.lessonName}</h3>
        </div>

        <Icon
          path={chevronDown}
          class={[
            'h-8 -mb-1 transform transition group-hover:translate-y-0.5 duration-300',
            { 'translate-y-0.5': showDirectory() },
          ]}
        />
      </button>
      <Dismiss menuButton={menuButton} open={showDirectory} setOpen={setShowDirectory}>
        <ol
          ref={listContainer}
          class={[
            'shadow-lg rounded-br-lg rounded-bl-lg absolute bg-white dark:bg-solid-darkLighterBg w-64 max-h-[50vh] left-8 overflow-auto rounded-b space-y-3 z-10',
            { hidden: !showDirectory() },
          ]}
        >
          <li class="sticky top-0">
            <input
              ref={search}
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              id="search"
              name="search"
              type="search"
              placeholder="Search..."
              autocomplete="off"
              class="py-2 px-3 block w-full"
            />
          </li>
          <For each={filteredDirectory()}>
            {([section, entries], sectionIndex) => (
              <li class="js-section-title bg-3">
                <p class="inline-block px-3 py-1 font-semibold">
                  {sectionIndex() + 1}. {section}
                </p>

                <ul class="divide-y divide-gray-500 box-border">
                  <For each={entries}>
                    {(entry, entryIndex) => (
                      <li>
                        <a
                          href={`/tutorial/${entry.internalName}`}
                          class={[
                            'hover:bg-blue-100 dark:hover:bg-solid-medium py-3 px-5 block',
                            'data-[active]:bg-blue-50 data-[active]:dark:bg-solid-darkbg',
                          ]}
                        >
                          <p class="text-sm font-medium text-gray-900 dark:text-gray-200">
                            {alphabet[entryIndex()]}. {entry.lessonName}
                          </p>
                        </a>
                      </li>
                    )}
                  </For>
                </ul>
              </li>
            )}
          </For>
        </ol>
      </Dismiss>
    </>
  );
};

const Tutorial: Component<{ data: TutorialRouteData }> = (props) => {
  const data = props.data;
  const Markdown = dynamic(() => data.markdown);
  const context = useAppState();
  const { t } = context;
  const [tabs, setTabs] = createSignal<Tab[]>([]);
  const [open, setOpen] = createSignal(true);
  let markDownRef!: HTMLDivElement;

  useRouteReadyState();

  createEffect(
    () => (data.solved ? data.solvedJs : data.js)?.files,
    (files) => {
      if (markDownRef) {
        markDownRef.scrollTop = 0;
      }
      if (!files) return;

      const newTabs = files.map((file) => {
        return {
          name: file.name + (file.type ? `.${file.type}` : '.jsx'),
          source: file.content,
        };
      });
      setTabs(newTabs);
    },
  );

  return (
    <>
      <Title>Tutorials | SolidJS </Title>
      <Loading fallback={<p>Loading...</p>}>
        <div
          dir="ltr"
          class={[
            'md:grid transition-all duration-300 h-[calc(100vh-64px)]',
            {
              'grid-cols-[minmax(40%,_600px)_auto]': open(),
              'grid-cols-[minmax(100%,_600px)_auto]': !open(),
            },
          ]}
        >
          <div class="flex flex-col bg-gray-50 dark:bg-solid-darkbg h-full overflow-hidden border-r-2 dark:border-solid-darkLighterBg border-grey mb-10 md:mb-0 ">
            <div class="box-border pt-3 pb-2 rounded-t border-b-2 border-solid bg-white dark:bg-solid-darkLighterBg dark:border-solid-darkLighterBg">
              <button
                type="button"
                class="hidden md:block mr-5 mt-1 float-right"
                onClick={() => setOpen(!open())}
              >
                <Icon
                  path={chevronDoubleRight}
                  class={['h-6 opacity-50 transition-all duration-300', { '-rotate-180': !open() }]}
                />
              </button>
              <DirectoryMenu
                current={data.tutorialDirectoryEntry}
                directory={data.tutorialDirectory}
              />
            </div>
            <div
              ref={markDownRef}
              class="p-10 prose dark:prose-invert flex-1 max-w-full overflow-auto"
            >
              <Show when={context.locale !== 'en'}>
                <p class="text-sm border-l-4 border-solid-light pl-4" role="note">
                  These Solid 2 lessons are available in English while translations are being
                  updated.
                </p>
              </Show>
              <Markdown />
            </div>

            <div class="py-4 px-10 flex items-center justify-between border-t-2 dark:border-solid-darkLighterBg">
              <Show
                when={data.solved}
                fallback={
                  <a
                    class="inline-flex py-2 px-3 bg-solid-default hover:bg-solid-medium text-white rounded"
                    href={`/tutorial/${data.id}?solved`}
                    onClick={() => setOpen(true)}
                  >
                    {t('tutorial.solve')}
                  </a>
                }
              >
                <a
                  class="inline-flex py-2 px-3 bg-solid-default hover:bg-solid-medium text-white rounded"
                  href={`/tutorial/${data.id}`}
                  onClick={() => setOpen(true)}
                >
                  {t('tutorial.reset')}
                </a>
              </Show>
              <div class="flex items-center space-x-4">
                <span data-tooltip={data.previousLesson}>
                  <a href={data.previousUrl ?? '#'}>
                    <span class="sr-only">Previous step</span>
                    <Icon path={arrowLeft} class={['h-6', { 'opacity-25': !data.previousUrl }]} />
                  </a>
                </span>

                <span data-tooltip={data.nextLesson}>
                  <a href={data.nextUrl ?? '#'}>
                    <span class="sr-only">Next step</span>
                    <Icon path={arrowRight} class={['h-6', { 'opacity-25': !data.nextUrl }]} />
                  </a>
                </span>
              </div>
            </div>
          </div>
          <Show when={open() && tabs().length > 0}>
            <Errored
              fallback={
                <>
                  Repl failed to load. You may be using a browser that doesn't support Web Workers.
                </>
              }
            >
              <Repl
                dark={context.isDark}
                tabs={tabs()}
                reset={() => {
                  const fileset = data.solved ? data.solvedJs : data.js;
                  const files = fileset?.files;
                  if (!files) return;

                  const newTabs = files.map((file) => {
                    return {
                      name: file.name + (file.type ? `.${file.type}` : '.jsx'),
                      source: file.content,
                    };
                  });
                  setTabs(newTabs);
                }}
                setTabs={setTabs}
                id="tutorial"
              />
            </Errored>
          </Show>
        </div>
      </Loading>
    </>
  );
};

export default Tutorial;
