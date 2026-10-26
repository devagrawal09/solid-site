import { createSignal } from 'solid-js';
import { render } from '@solidjs/web';

function Counter() {
  const [count, setCount] = createSignal(0);
  const doubled = () => count() * 2;

  return (
    <>
      <button onClick={() => setCount((value) => value + 1)}>Count: {count()}</button>
      <p>Doubled: {doubled()}</p>
      <button onClick={() => setCount(0)}>Reset count</button>
    </>
  );
}

const host = document.getElementById('app');
if (!host) throw new Error('The page needs an #app element.');
render(() => <Counter />, host);
