import { build } from 'vite';
import { resolve } from 'node:path';

export default async function prepareRuntime() {
  const nodeEnv = process.env.NODE_ENV;
  try {
    await build({
      configFile: false,
      logLevel: 'warn',
      resolve: { conditions: ['browser', 'development', 'module'] },
      define: { 'process.env.NODE_ENV': JSON.stringify('development') },
      build: {
        outDir: '.cache/test-runtime',
        emptyOutDir: true,
        lib: { entry: resolve('tests/runtime.ts'), formats: ['es'], fileName: () => 'solid-v2.js' },
        minify: false,
      },
    });
    await build({
      configFile: false,
      logLevel: 'warn',
      build: {
        outDir: '.cache/test-runtime',
        emptyOutDir: false,
        lib: {
          entry: { html: resolve('tests/runtime-html.ts'), h: resolve('tests/runtime-h.ts') },
          formats: ['es'],
          fileName: (_format, name) => `${name}.js`,
        },
        rolldownOptions: {
          external: ['solid-js', 'solid-js/internal', '@solidjs/web', '@solidjs/signals'],
          output: { paths: () => 'https://solid-site-test.invalid/runtime.js' },
        },
        minify: false,
      },
    });
  } finally {
    if (nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = nodeEnv;
  }
}
