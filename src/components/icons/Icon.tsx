import { omit } from 'solid-js';
import type { JSX } from '@solidjs/web';

export interface IconSource {
  path: () => JSX.Element;
  outline: boolean;
}

export function Icon(props: JSX.SvgSVGAttributes<SVGSVGElement> & { path: IconSource }) {
  const attributes = omit(props, 'path');
  return (
    <svg
      viewBox={props.path.outline ? '0 0 24 24' : '0 0 20 20'}
      fill={props.path.outline ? 'none' : 'currentColor'}
      stroke={props.path.outline ? 'currentColor' : 'none'}
      aria-hidden="true"
      {...attributes}
    >
      {props.path.path()}
    </svg>
  );
}
