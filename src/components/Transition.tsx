import { children, onCleanup, type ParentComponent } from 'solid-js';
import { createSwitchTransition } from '@solid-primitives/transition-group';

export const Transition: ParentComponent<{
  onBeforeEnter?: (element: Element) => void | (() => void);
  onExit?: (element: Element, done: () => void) => void | (() => void);
}> = (props) => {
  const content = children(() => props.children);
  const cleanups = new Map<Element, () => void>();
  let disposed = false;
  onCleanup(() => {
    disposed = true;
    cleanups.forEach((cleanup) => cleanup());
    cleanups.clear();
  });
  const rendered = createSwitchTransition(
    () => {
      const value = content();
      return value instanceof Element ? value : undefined;
    },
    {
      onEnter(element, done) {
        const cleanup = props.onBeforeEnter?.(element);
        if (cleanup) cleanups.set(element, cleanup);
        done();
      },
      onExit(element, finish) {
        cleanups.get(element)?.();
        let finished = false;
        let stop: void | (() => void);
        const cleanup = () => {
          clearTimeout(timer);
          stop?.();
        };
        const done = () => {
          if (finished || disposed) return;
          finished = true;
          cleanup();
          cleanups.delete(element);
          finish();
        };
        // Detached elements and reduced-motion styles may never emit transitionend.
        const timer = setTimeout(done, 550);
        cleanups.set(element, cleanup);
        if (props.onExit) {
          stop = props.onExit(element, done);
          if (finished) stop?.();
        } else done();
      },
    },
  );
  return <>{rendered()}</>;
};
