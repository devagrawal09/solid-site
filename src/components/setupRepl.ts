import CompilerWorker from 'solid-repl/dist/compiler.mjs?worker';
import FormatterWorker from 'solid-repl/dist/formatter.mjs?worker';
import LinterWorker from 'solid-repl/dist/linter.mjs?worker';

export const compiler = new CompilerWorker();
export const formatter = new FormatterWorker();
export const linter = new LinterWorker();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    compiler.terminate();
    formatter.terminate();
    linter.terminate();
  });
}
