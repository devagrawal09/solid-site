import { createEffect, lazy, type Component } from 'solid-js';
import { useLocation, useNavigate, type RouteDefinition } from '@solidjs/router';
import { pageWithData } from './utils/routeData';
import { ContributorsData } from './pages/Contributors.data';
import { GuideData } from './pages/Guide.data';
import { TutorialData } from './pages/Tutorial.data';
import { PackagesData } from './pages/Packages.data';
import { ResourcesData } from './pages/Resources.data';
import { ExamplesData } from './pages/Examples.data';
import { StoreData } from './pages/Store.data';
import { BlogData } from './pages/Blog.data';
import { BlogArticleData } from './pages/BlogArticle.data';

const redirectTo =
  (href: string): Component =>
  () => {
    const navigate = useNavigate();
    const location = useLocation();
    createEffect(
      () => `${location.search}${location.hash}`,
      (suffix) => navigate(`${href}${suffix}`, { replace: true }),
    );
    return null;
  };

export const routes: RouteDefinition[] = [
  {
    path: '/',
    component: lazy(() => import('./pages/Home')),
  },
  {
    path: '/guides/:id',
    component: pageWithData(GuideData, () => import('./pages/Guide')),
  },
  {
    path: '/hack',
    component: () => {
      typeof window !== 'undefined' && (window.location.href = 'https://hack.solidjs.com');
      return null;
    },
  },
  {
    path: '/guide',
    component: redirectTo('/guides/getting-started'),
  },
  {
    path: '/guides',
    component: redirectTo('/guides/getting-started'),
  },
  {
    path: '/blog/:slug',
    component: pageWithData(BlogArticleData, () => import('./pages/BlogArticle')),
  },
  {
    path: '/blog',
    component: pageWithData(BlogData, () => import('./pages/Blog')),
  },
  {
    path: '/docs',
    component: lazy(() => import('./pages/Docs')),
    children: [
      {
        path: '/:version',
        component: lazy(() => import('./pages/Docs')),
      },
      {
        path: '/*all',
        component: lazy(() => import('./pages/Docs')),
      },
    ],
  },
  {
    path: '/tutorial/:id',
    component: pageWithData(TutorialData, () => import('./pages/Tutorial')),
  },
  {
    path: '/tutorial',
    component: redirectTo('/tutorial/welcome'),
  },

  {
    path: '/examples/:id',
    component: pageWithData(ExamplesData, () => import('./pages/Examples')),
  },
  {
    path: '/examples',
    component: redirectTo('/examples/counter'),
  },
  {
    path: '/contributors',
    component: pageWithData(ContributorsData, () => import('./pages/Contributors')),
  },
  {
    path: '/ecosystem',
    component: pageWithData(PackagesData, () => import('./pages/Packages')),
  },
  {
    path: '/resources',
    component: pageWithData(ResourcesData, () => import('./pages/Resources')),
  },
  {
    path: '/media',
    component: lazy(() => import('./pages/Media')),
  },
  {
    path: '/store',
    component: pageWithData(StoreData, () => import('./pages/Store')),
  },
  {
    path: '/*all',
    component: lazy(() => import('./pages/404')),
  },
];
