import { createSignal, onSettled } from 'solid-js';
export const page = {
  scrollY: 0,
};

export const [routeReadyState, setRouteReadyState] = createSignal(
  {
    loading: false,
    routeChanged: false,
    loadingBar: false,
  },
  { equals: false },
);

let init = true;

export const useRouteReadyState = () => {
  const restorePageHeight = () => {
    const pageEl = document.body;
    pageEl.style.minHeight = '';
  };

  const setRouteReady = (): boolean | void => {
    setRouteReadyState((prev) => ({ ...prev, loading: false, loadingBar: false }));
    restorePageHeight();

    let anchorId = window.location.hash.slice(1);
    try {
      anchorId = decodeURIComponent(anchorId);
    } catch {
      // A malformed escape can still be a literal element ID.
    }
    const anchor = anchorId ? document.getElementById(anchorId) : null;
    if (anchor) anchor.scrollIntoView({ block: 'start', behavior: 'instant' });

    if (init) {
      init = false;
      return true;
    }
    if (!anchor) window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  onSettled(() => {
    setRouteReady();
  });
};
