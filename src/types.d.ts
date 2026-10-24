declare module 'github-slugger' {
  export function slug(str: string): string;
}

declare module '*.mdx' {
  const MDXComponent: import('./pages/Blog.data').MDXComponent;
  export default MDXComponent;
}
