import { createComponent, type Component, type Element } from 'solid-js';
import { dynamic, type JSX } from '@solidjs/web';

// @solid.js/docs publishes MDX as automatic-runtime calls. Render that content
// with Solid 2, without loading the Solid 1 renderer used by solid-jsx 0.9.
export const Fragment = (props: { children?: Element }) => props.children;

export function jsx(
  tag: keyof JSX.IntrinsicElements | Component<Record<string, unknown>>,
  props: Record<string, unknown>,
): Element {
  if (typeof tag === 'function') return createComponent(tag, props);
  const attributes = Object.fromEntries(
    Object.entries(props).map(([name, value]) => [
      name === 'className' ? 'class' : name === 'htmlFor' ? 'for' : name,
      value,
    ]),
  );
  return createComponent(
    dynamic(() => tag),
    attributes as JSX.IntrinsicElements[typeof tag],
  );
}

export const jsxs = jsx;

export const jsxDEV = jsx;
