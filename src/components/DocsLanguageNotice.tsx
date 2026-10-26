import { Show } from 'solid-js';
import { useAppState } from '../AppContext';

export default function DocsLanguageNotice() {
  const context = useAppState();
  return (
    <Show when={context.locale !== 'en'}>
      <p class="mb-8 rounded-lg border border-solid-light/30 bg-solid-light/10 p-4" role="note">
        These Solid 2 guides are currently available in English. Site navigation stays in your
        selected language.
      </p>
    </Show>
  );
}
