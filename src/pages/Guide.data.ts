import { useNavigate } from '@solidjs/router';
import type { RouteDataFactory } from '../utils/routeData';
import { createEffect, createMemo, type Component } from 'solid-js';
import {
  getGuide,
  guideDirectory,
  legacyGuideDestinations,
  type GuideMetadata,
} from '../content/guides';

export interface GuideRouteData {
  metadata?: GuideMetadata;
  markdown?: Component;
}

export const GuideData: RouteDataFactory<GuideRouteData> = (props) => {
  const navigate = useNavigate();
  const metadata = createMemo(() => guideDirectory.find((guide) => guide.id === props.params.id));
  const markdown = createMemo(() => getGuide(props.params.id || ''));

  createEffect(
    () => ({
      destination: Object.hasOwn(legacyGuideDestinations, props.params.id || '')
        ? legacyGuideDestinations[props.params.id!]
        : undefined,
      search: props.location.search,
    }),
    ({ destination, search }) => {
      if (!destination) return;
      const [path, hash] = destination.split('#');
      navigate(`${path}${search}${hash ? `#${hash}` : ''}`, { replace: true });
    },
  );

  return {
    get metadata() {
      return metadata();
    },
    get markdown() {
      return markdown();
    },
  };
};
