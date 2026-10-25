import { createSignal, createUniqueId, Errored, type Component } from 'solid-js';
import type { Tab } from 'solid-repl';
import Repl from './Repl';
import { useAppState } from '../AppContext';

const ReplTab: Component<{ tabs: Tab[] }> = (props) => {
  const id = `repl-${createUniqueId()}`;
  const context = useAppState();
  const [tabs, setTabs] = createSignal(() => props.tabs);
  return (
    <Errored fallback="Repl failed to load. You may be using a browser that doesn't support Web Workers.">
      <Repl
        id={id}
        reset={() => {
          setTabs(props.tabs);
        }}
        hideDevtools
        vertical
        dark={context.isDark}
        tabs={tabs()}
        setTabs={setTabs}
      />
    </Errored>
  );
};
export default ReplTab;
