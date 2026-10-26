// Remember current search in page URL as ?search=...

import { Accessor, createEffect } from 'solid-js';
import { useNavigate } from '@solidjs/router';

export const rememberSearch = (search: Accessor<string>) => {
  const navigate = useNavigate();
  createEffect(search, (value) => {
    const url = globalThis.location;
    const oldPath = `${url.pathname}${url.search}${url.hash}`;
    const params = new URLSearchParams(url.search);
    if (value) params.set('search', value);
    else params.delete('search');
    const query = params.toString();
    const newPath = `${url.pathname}${query ? `?${query}` : ''}${url.hash}`;
    if (oldPath === newPath) return;
    navigate(newPath, { replace: true, scroll: false });
  });
};
