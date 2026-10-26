import { createComponent, lazy, type Component } from 'solid-js';
import type { RouteSectionProps } from '@solidjs/router';

export type RouteDataFactory<T = unknown> = (
  props: Pick<RouteSectionProps, 'params' | 'location'>,
) => T;

/** Initialize reactive page data under the page's owner and application providers. */
export function pageWithData<T>(
  data: RouteDataFactory<T>,
  view: () => Promise<{ default: Component<{ data: T }> }>,
): Component<RouteSectionProps> {
  const View = lazy(view);
  return (props) => createComponent(View, { data: data(props) });
}
