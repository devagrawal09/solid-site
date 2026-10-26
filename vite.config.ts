import { defineConfig, type Plugin } from 'vite';
import solid from '@solidjs/vite-plugin';
import mdx from '@mdx-js/rollup';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import pckg from './package.json' with { type: 'json' };
import { cloudflare } from '@cloudflare/vite-plugin';
import { sites } from './scripts/vite/sites-vite-plugin';

const require = createRequire(import.meta.url);
const replRoot = dirname(require.resolve('solid-repl/package.json'));

export default defineConfig({
  define: {
    __UPDATED_AT__: JSON.stringify(new Date().toLocaleString()),
    __SOLID_VERSION__: JSON.stringify(pckg.dependencies['solid-js']),
  },
  plugins: [
    sites({ mockAuth: false }),
    cloudflare({
      configPath: './worker.config.json',
      viteEnvironment: { name: 'server' },
      inspectorPort: false,
      remoteBindings: false,
    }),
    {
      ...mdx({
        jsx: false,
        jsxImportSource: '@solid-site/docs-jsx',
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeHighlight],
      }),
      enforce: 'pre',
    } as Plugin,
    solid({ extensions: ['.md', '.mdx'] }),
  ],
  optimizeDeps: {
    exclude: ['solid-repl'],
  },
  resolve: {
    alias: { 'styled-system': resolve(replRoot, 'dist/styled-system') },
    dedupe: ['solid-js', '@solidjs/web', '@solidjs/signals'],
  },
  worker: { format: 'es' },
  server:
    process.env.SITES_MANAGED_LINUX_CONTAINER === '1'
      ? { host: '0.0.0.0', allowedHosts: ['terminal.local'] }
      : {},
  build: {
    target: 'esnext',
  },
});
