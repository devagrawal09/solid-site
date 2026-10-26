import { createSignal } from 'solid-js';
import { Title } from '@solidjs/meta';
import { optOut } from '../experiments/client';

export default function Privacy() {
  const [status, setStatus] = createSignal('');
  const [pending, setPending] = createSignal(false);
  return (
    <article class="container max-w-3xl space-y-6 px-6 py-16">
      <Title>Privacy | SolidJS</Title>
      <h1 class="text-3xl font-semibold">Privacy and page experiments</h1>
      <p>
        We are comparing three versions of our homepage introduction to understand which helps
        people get started with Solid. A first-party cookie keeps the same version on this browser
        for up to 90 days.
      </p>
      <p>
        When you see the introduction, we record its version and a random browser identifier. We
        also count whether you open learning material, edit the playground, or interact with the
        tutorial within seven days. Each browser counts once per outcome. This is an estimate of
        browsers, not an identification of people across devices.
      </p>
      <p>
        The experiment does not store your name, email, IP address, browsing history, or any code
        you write. Results stay with this site. Hosting providers and embedded services may process
        their own operational data.
      </p>
      <p>
        We respect Global Privacy Control and Do Not Track. Opting out removes this browser’s
        current experiment records, clears its assignment, and stores an opt-out preference for one
        year. Remaining experiment records older than 90 days are removed when the owner opens the
        results dashboard.
      </p>
      <button
        class="button"
        disabled={pending()}
        onClick={async () => {
          setPending(true);
          try {
            await optOut();
            setStatus('You are opted out. Your current experiment records have been removed.');
          } catch (error) {
            setStatus(String(error instanceof Error ? error.message : error));
          } finally {
            setPending(false);
          }
        }}
      >
        Opt out of page experiments
      </button>
      <p role="status">{status()}</p>
      <a href="/" class="underline">
        Return to the homepage
      </a>
    </article>
  );
}
