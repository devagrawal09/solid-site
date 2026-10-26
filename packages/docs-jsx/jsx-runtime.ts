import { createComponent, type Component, type Element } from 'solid-js';
import { dynamic, type JSX } from '@solidjs/web';

// MDX compiles to automatic-runtime calls. Render them with Solid 2's owned
// components and DOM factory, including native tags and reactive props.
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
