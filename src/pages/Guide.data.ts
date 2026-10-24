import { useLocation } from '@solidjs/router';
import type { RouteDataFactory } from '../utils/routeData';
import { createMemo, isPending } from 'solid-js';
import { getDoc } from '@solid.js/docs';
import type { DocData } from './Docs.data';
import { useAppState } from '../AppContext';

export const GuideData: RouteDataFactory<DocData> = (props) => {
  const location = useLocation();
  const ctx = useAppState();

  const paramList = () => ({
    lang: typeof location.query.locale === 'string' ? location.query.locale : ctx.locale,
    resource: props.params.id,
  });
  const resource = createMemo(async () => {
    const { lang, resource } = paramList();
    const requestedLang = await getDoc(lang, resource);
    if (requestedLang) return { doc: requestedLang, fallback: false };
    return { doc: await getDoc('en', resource), fallback: true };
  });
  return {
    get doc() {
      return resource()?.doc;
    },
    get loading() {
      return isPending(resource);
    },
    get fallback() {
      return !!resource()?.fallback;
    },
  };
};
