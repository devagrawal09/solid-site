import { ParentComponent, Switch, Match, Show, createMemo } from 'solid-js';
import { Transition } from './Transition';
import { useLocation } from '@solidjs/router';
import Nav from './Nav';
import { useAppState } from '../AppContext';
import logo from '../assets/logo.svg';
import wordmark from '../assets/wordmark.svg';
import { chevronRight, play } from './icons/outline';
import { Icon } from './icons/Icon';
import PageLoadingBar from './LoadingBar/PageLoadingBar';
import { routeReadyState, page } from '../utils/routeReadyState';

const Header: ParentComponent<{ title?: string }> = () => {
  const location = useLocation();
  const showHeaderSplash = createMemo(() => location.pathname === '/');
  const showHeaderSmall = createMemo(
    () => location.pathname !== '/' && !location.pathname.includes('tutorial'),
  );
  const showLogo = createMemo(() => !showHeaderSplash());

  const context = useAppState();
  const { t } = context;

  const Title: ParentComponent = (props) => (
    <span class="inline-block transition-all duration-200">{props.children}</span>
  );
  return (
    <>
      <Transition onBeforeEnter={onEnterBigHeader} onExit={onExitBigHeader}>
        <Show when={showHeaderSplash()}>
          <header
            id="header"
            class="relative mx-2 rounded-br-3xl rounded-bl-3xl bg-gradient-to-r from-solid-light via-solid-medium/85 to-solid-dark/80 dark:from-solid-light/40 dark:via-solid-medium/80 dark:to-solid-medium/90 text-white overflow-hidden z-[1]"
          >
            <PageLoadingBar active={routeReadyState().loadingBar} postion="bottom"></PageLoadingBar>
            <a
              target="_blank"
              href={t('home.ukraine.link')}
              class="absolute w-full text-center text-[15px] p-3 bg-yellow-500 hover:bg-yellow-500/80 transition duration-200"
            >
              <span class="text-whit">
                <b>{t('home.ukraine.support')}</b>&nbsp;
                {t('home.ukraine.petition')}
              </span>{' '}
            </a>
            <div class="md:bg-hero dark:from-bg-gray-700 bg-no-repeat bg-right rtl:bg-left px-10">
              <a target="_blank" href="https://www.youtube.com/watch?v=pFah4QqiUAg&t=9503s">
                <img
                  class="hidden md:block absolute md:top-20 lg:top-32 md:right-20 md:w-40 lg:w-72"
                  src="/img/award-badge.svg"
                />
              </a>
              <section class="px-3 lg:px-12 container space-y-10 lg:pb-20 lg:pt-52 py-10">
                <div class="flex items-center mt-10 w-[calc(100%+40px)] space-y-4 lg:space-y-0 lg:space-x-4 lg:mt-0">
                  <img
                    class="w-[6rem] h-30 lg:w-48"
                    style="filter: drop-shadow(-10px 4px 8px rgb(0 22 100 / 10%))"
                    src={logo}
                    alt="Solid logo"
                    width="166"
                    height="155.3"
                  />
                  <img
                    class="w-52 min-w-0 h-15 lg:w-80"
                    src={wordmark}
                    alt="Solid wordmark"
                    width="306.42"
                    height="70.7"
                  />
                </div>
                <h2 class="lg:font-semibold text-[26px] sm:text-3xl leading-8 lg:text-4xl lg:leading-10 xl:max-w-3xl">
                  {t('home.hero')}
                </h2>
                <div class="space-y-2 md:flex md:space-y-0 md:space-x-2">
                  <div>
                    <a
                      href="/guides/getting-started"
                      class="bg-solid-medium flex justify-center items-center px-5 py-3 text-md rounded-lg hover:bg-solid-gray transition"
                    >
                      {t('home.get_started')}
                      <Icon stroke-width="3" class="w-5" path={chevronRight} />
                    </a>
                  </div>
                  <div class="flex flex-col space-y-1">
                    <a
                      target="_blank"
                      href="https://www.youtube.com/watch?v=hw3Bx5vxKl0"
                      class="bg-solid-light flex items-center px-5 py-3 text-md rounded-lg hover:bg-solid-gray transition"
                    >
                      <Icon stroke-width="2" class="w-6 mr-2" path={play} />
                      {t('home.intro_video')}
                    </a>
                    <a
                      target="_blank"
                      href="https://www.youtube.com/watch?v=cELFZQAMdhQ"
                      class="bg-solid-light bg-opacity-50 flex items-center px-5 py-3 text-md rounded-lg hover:bg-solid-gray transition"
                    >
                      <Icon stroke-width="2" class="w-6 mr-2" path={play} />
                      {t('home.intro_video_advanced')}
                    </a>
                  </div>
                </div>
              </section>
            </div>
          </header>
        </Show>
      </Transition>
      <Nav showLogo={showLogo()} />
      <div>
        <Transition onBeforeEnter={onEnterSmallHeader} onExit={onExitSmallHeader}>
          <Show when={showHeaderSmall() && !location.pathname.includes('/hack')}>
            <header class="overflow-hidden">
              <div class="bg-gradient-to-r from-solid-light via-solid-medium to-solid-medium/80 dark:from-solid-light/70 dark:via-solid-medium/70 dark:to-solid-medium/40 text-white text-center md:text-left rtl:text-right">
                <div class="px-3 lg:px-12 container">
                  <h1 class="py-8 text-3xl">
                    <Switch>
                      <Match when={location.pathname.includes('/blog')}>
                        <Title>
                          {/* {t('global.blog.title')} */}
                          Blog
                        </Title>
                      </Match>
                      <Match when={location.pathname.includes('/guide')}>
                        <Title>
                          {/* {t('guides.title')} */}
                          Guides
                        </Title>
                      </Match>
                      <Match when={location.pathname.includes('/docs')}>
                        <Title>{t('docs.title')}</Title>
                      </Match>
                      <Match when={location.pathname.includes('/ecosystem')}>
                        <Title>{t('resources.title')}</Title>
                      </Match>
                      <Match when={location.pathname.includes('/store')}>
                        <Title>
                          {/* {t('store.title')} */}
                          Solid Store
                        </Title>
                      </Match>
                      <Match when={location.pathname.includes('/examples')}>
                        <Title>{t('examples.title')}</Title>
                      </Match>
                      <Match when={location.pathname.includes('/media')}>
                        <Title>{t('media.title')}</Title>
                      </Match>
                      <Match when={location.pathname.includes('/contributors')}>
                        <Title>{t('contributors.title')}</Title>
                      </Match>
                    </Switch>
                  </h1>
                </div>
              </div>
            </header>
          </Show>
        </Transition>
      </div>
    </>
  );
};

const pageTransitionDuration = 500;
type Movement = [element: HTMLElement, from: string, to: string];

// Animation objects leave no inline transforms behind when navigation interrupts them.
const animateHeader = (movements: Movement[], done?: () => void) => {
  const animations = movements.map(([element, from, to]) =>
    element.animate([{ transform: from }, { transform: to }], {
      duration: pageTransitionDuration,
      easing: 'ease',
    }),
  );
  const cleanup = () => animations.forEach((animation) => animation.cancel());
  void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
    cleanup();
    done?.();
  });
  return cleanup;
};

const onEnterBigHeader = (el: Element) => {
  let cleanup: (() => void) | undefined;
  const frame = requestAnimationFrame(() => {
    const header = el as HTMLElement;
    const parent = header.parentElement;
    if (!header.isConnected || !parent) return;
    const banner = header.firstElementChild as HTMLElement;
    const siblings = [...parent.children].filter((element) => element !== header) as HTMLElement[];
    const height = header.clientHeight;
    window.scrollTo({ top: 0, behavior: 'instant' });
    cleanup = animateHeader([
      ...[header, ...siblings].map(
        (element): Movement => [element, `translateY(-${height}px)`, 'translateY(0)'],
      ),
      [banner, `translateY(${height}px)`, 'translateY(0)'],
    ]);
  });
  return () => {
    cancelAnimationFrame(frame);
    cleanup?.();
  };
};

const onExitBigHeader = (el: Element, done: () => void) => {
  const header = el as HTMLElement;
  const parent = header.parentElement;
  if (!parent) {
    done();
    return;
  }
  const height = header.clientHeight;
  if (page.scrollY >= height) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    done();
    return;
  }
  const banner = header.firstElementChild as HTMLElement;
  const siblings = [...parent.children].filter((element) => element !== header) as HTMLElement[];
  return animateHeader(
    [
      ...[header, ...siblings].map(
        (element): Movement => [element, 'translateY(0)', `translateY(-${height}px)`],
      ),
      [banner, 'translateY(0)', `translateY(${height}px)`],
    ],
    done,
  );
};

const smallHeaderMovements = (header: HTMLElement, entering: boolean): Movement[] => {
  const background = header.firstElementChild as HTMLElement | null;
  const content = background?.firstElementChild as HTMLElement | null;
  const main = document.getElementById('main-content')?.firstElementChild as HTMLElement | null;
  if (!background || !content || !main) return [];
  const movements: Movement[] = [
    [background, 'translateY(-100%)', 'translateY(0)'],
    [content, 'translateY(100%)', 'translateY(0)'],
    [main, `translateY(-${background.clientHeight}px)`, 'translateY(0)'],
  ];
  return movements.map(([element, from, to]) =>
    entering ? ([element, from, to] as Movement) : ([element, to, from] as Movement),
  );
};

const onEnterSmallHeader = (el: Element) => {
  let cleanup: (() => void) | undefined;
  const frame = requestAnimationFrame(() => {
    if (el.isConnected) cleanup = animateHeader(smallHeaderMovements(el as HTMLElement, true));
  });
  return () => {
    cancelAnimationFrame(frame);
    cleanup?.();
  };
};

const onExitSmallHeader = (el: Element, done: () => void) => {
  const header = el as HTMLElement;
  if (page.scrollY >= header.clientHeight + 64) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    done();
    return;
  }
  return animateHeader(smallHeaderMovements(header, false), done);
};
export default Header;
