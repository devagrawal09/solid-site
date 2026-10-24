import { build } from 'vite';
import { resolve } from 'node:path';

export default async function prepareRuntime() {
  const nodeEnv = process.env.NODE_ENV;
  try {
    await build({
      configFile: false,
      logLevel: 'warn',
      build: {
        outDir: '.cache/test-runtime',
        emptyOutDir: true,
        lib: { entry: resolve('tests/runtime.ts'), formats: ['es'], fileName: () => 'solid-v2.js' },
        minify: false,
      },
    });
  } finally {
    if (nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = nodeEnv;
  }
}
