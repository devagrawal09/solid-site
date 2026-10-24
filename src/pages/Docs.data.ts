import { useLocation } from '@solidjs/router';
import type { RouteDataFactory } from '../utils/routeData';
import { createMemo, isPending } from 'solid-js';
import { type DocFile, getApi } from '@solid.js/docs';
import { useAppState } from '../AppContext';

export interface DocData {
  loading: boolean;
  fallback: boolean;
  doc?: DocFile;
}

export const DocsData: RouteDataFactory<DocData> = () => {
  const location = useLocation();
  const ctx = useAppState();

  const lang = () =>
    typeof location.query.locale === 'string' ? location.query.locale : ctx.locale;
  const resource = createMemo(async () => {
    const currentLang = lang();
    const requestedLang = await getApi(currentLang);
    if (requestedLang) return { doc: requestedLang, fallback: false };
    return { doc: await getApi('en'), fallback: true };
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
