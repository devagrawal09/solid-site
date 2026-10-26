import { createEffect, onSettled, Show, type Accessor, type ParentComponent } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { Transition } from './Transition';

interface Animation {
  appendToElement?: 'menuPopup';
  enterClass?: string;
  enterToClass?: string;
  exitClass?: string;
  exitToClass?: string;
}

const classes = (value = '') => value.split(/\s+/).filter(Boolean);

const Dismiss: ParentComponent<{
  open: Accessor<boolean>;
  setOpen: (value: boolean) => void;
  menuButton: HTMLElement | HTMLElement[];
  class?: JSX.ClassValue;
  show?: boolean;
  animation?: Animation;
}> = (props) => {
  let container!: HTMLDivElement;
  const buttons = () => (Array.isArray(props.menuButton) ? props.menuButton : [props.menuButton]);

  createEffect(props.open, (open) => {
    for (const button of buttons()) button?.setAttribute('aria-expanded', String(open));
  });

  onSettled(() => {
    const toggle = () => props.setOpen(!props.open());
    const outside = (event: PointerEvent) => {
      const target = event.target;
      if (!props.open() || !(target instanceof Node)) return;
      if (container.contains(target) || buttons().some((button) => button?.contains(target)))
        return;
      props.setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !props.open()) return;
      props.setOpen(false);
      buttons()[0]?.focus();
    };
    const triggers = buttons().filter(Boolean);
    triggers.forEach((button) => button.addEventListener('click', toggle));
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      triggers.forEach((button) => button.removeEventListener('click', toggle));
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  });

  const animate = (element: Element, from?: string, to?: string) => {
    element.classList.remove(...classes(to));
    element.classList.add(...classes(from));
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (!element.isConnected) return;
        element.classList.remove(...classes(from));
        element.classList.add(...classes(to));
      }),
    );
  };

  return (
    <div ref={container} class={props.class}>
      <Transition
        onBeforeEnter={(element) =>
          animate(element, props.animation?.enterClass, props.animation?.enterToClass)
        }
        onExit={(element, done) => {
          if (!props.animation) {
            done();
            return;
          }
          animate(element, props.animation.exitClass, props.animation.exitToClass);
          element.addEventListener('transitionend', done, { once: true });
          return () => element.removeEventListener('transitionend', done);
        }}
      >
        <Show when={props.show || props.open()}>{props.children}</Show>
      </Transition>
    </div>
  );
};

export default Dismiss;
