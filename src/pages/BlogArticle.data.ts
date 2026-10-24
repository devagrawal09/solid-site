import { createMemo, isPending } from 'solid-js';
import type { RouteDataFactory } from '../utils/routeData';
import { type BlogInfo, list, type MDXComponent } from './Blog.data';

export interface BlogArticleData {
  loading: boolean;
  slug: string;
  details: BlogInfo;
  article?: MDXComponent;
}

export const BlogArticleData: RouteDataFactory<BlogArticleData> = (props) => {
  const article = createMemo(async () => (await list[props.params.slug!].body()).default);
  return {
    get slug() {
      return props.params.slug!;
    },
    get loading() {
      return isPending(article);
    },
    get details() {
      return list[props.params.slug!];
    },
    get article() {
      return article();
    },
  };
};
