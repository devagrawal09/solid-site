# How OpenClaw moved its dashboard from Lit to Solid 2

Before OpenClaw chose Solid, it built the same Logs screen twice. The team put Svelte 5 and a release candidate of Solid 2 through the same Chromium scenarios. Both could do the job. What swung the decision toward Solid was what the team saw in the code: TSX fit its TypeScript application, and a view could subscribe to the particular values it displayed. As Peter Steinberger put it in the [migration plan](https://github.com/openclaw/openclaw/issues/168114), “The gain is deleting hand-built reactivity, not raw render speed.”

The distinction mattered. OpenClaw’s Gateway already knew which session was active, which requests it had accepted, and what to do when a connection came back. Replacing that logic to get a different text box would have been a bad trade. The job was to replace the browser dashboard built on top of it. Nor did a third-party plugin author need to learn Solid: a plugin could still mount into a container and return the same update, focus, and disposal methods.

## Two renderers, one dashboard

OpenClaw put [Solid RC.13 alongside Lit](https://github.com/openclaw/openclaw/pull/168305) and left production rendering alone in that first change. It then moved [Workboard](https://github.com/openclaw/openclaw/pull/168606), the chat transcript, the composer, and the shell in slices. For a time, the existing app and the new views had to agree on when a screen was mounted, when an input still belonged to the user, and when a subscription should end.

On October 16 the team [removed the dashboard’s direct Lit dependencies](https://github.com/openclaw/openclaw/pull/174213). Applying the same inventory tool before and after, across the Control UI and the Workboard and X plugin trees, turns up **800 production files importing Lit before, zero after**. That is a useful cutover date. It is a poor date to declare the design finished.

Take a Workboard column that can expand or collapse. In Lit the button’s listener changed on redraw. Its first Solid translation chose a listener when the button was bound. The same button could keep the wrong choice as the state around it changed. The fix was to choose inside the click callback. The [regression test](https://github.com/openclaw/openclaw/pull/182293) finds the button **once**, clicks to collapse, checks `aria-expanded`, then clicks that same button to expand it again. Remounting it halfway through the test would miss the mistake.

## What changed after the imports disappeared

Between that October cutover and November 24, core UI files directly importing a Solid runtime value went from **776 to 1,126**. Over the same period, written calls to `createEffect` went from **323 to 85**. Most of the drop had happened by October 31. Those are [source counts](./evidence.md), not counts of work the browser did.

One [plugin-slot change](https://github.com/openclaw/openclaw/pull/174551/files) explains the direction. An effect used to change which source supplied a slot. The new view derives the source from where the slot is placed. Retiring that selection releases the old subscription; revoking a plugin’s permission still takes effect immediately in the application. There is one less piece of code whose job is to tell another piece that its input changed.

The payoff is easiest to see in the next repair. OpenClaw’s Debug page used to pass a [21-field bundle of values and callbacks](https://github.com/openclaw/openclaw/pull/175155) into a private view. The first Solid translation kept it. After the team removed that handoff, someone found an accessible-label bug: submit `health`, select `status` while waiting, and the `health` reply would arrive labeled `status`. The [repair](https://github.com/openclaw/openclaw/pull/199347) remembered the method at submission, right beside the code that labeled the result. One production file changed. There is no measurement of developer hours here; there is a concrete interface that the person fixing the bug no longer had to cross.

The same approach supported new work. In the [Skills Workshop on `main`](https://github.com/openclaw/openclaw/pull/202572), applying a draft used to send the reviewer away from the queue. The revised screen derives the next draft from the existing list and keeps the reviewer in place. No new Gateway operation was necessary. That feature was on `main`, ahead of the November 24 stable snapshot.

## What someone typing could notice

When a reply streams, a new piece of text need not redraw the entire conversation. OpenClaw narrowed which part of the transcript observed changes to row geometry. In [ten paired runs](https://github.com/openclaw/openclaw/pull/180884) with a synthetic Gateway, 400 messages, and 645 streaming updates, whole-pane renders fell **from 353 to one**, and median script CPU time fell **51%**. Both builds used Solid. Getting the subscription right, after the port, produced that result.

Fast typing also needs a correctness test. The Lit composer already checked that pressing Enter to confirm Japanese text didn’t send the message. Its [Solid tests](https://github.com/openclaw/openclaw/blob/v2026.11.8/ui/src/pages/chat/chat-composer-solid.test.tsx) also watch the native textarea’s `value` setter: a streaming update must neither replace the element nor write into it mid-composition. Change sessions, however, and a late composition event must leave the new draft alone. Some old tests were already exactly right. Disabling the same double-teardown guard in the [old and ported fixtures](https://github.com/openclaw/openclaw/pull/169387) made both fail on the same second teardown.

Did less code reach users? It depends on what they loaded. Comparing the v2026.11.4 and v2026.11.5 distributions, JavaScript linked directly from the entry HTML outside route templates fell **73% gzipped**. Count *all* packaged dashboard JavaScript, including lazy chunks, and it **grew 17%**. Features, locales, and chunking changed between the releases. Neither number is a measurement of the framework alone; the smaller entry list isn’t a network trace of an interactive chat. The [asset comparison](./evidence.md) gives both counts.

## What OpenClaw sent back

One report gave the Solid team a particularly good test. In Settings, validation could update an attribute on a focused input. The compiler had grouped that update with the input’s `value` binding. If the app waited for `change` to accept the edit, the browser held newly typed text that the application hadn’t saved yet. The grouped update could put the old text back.

Splitting the bindings would have added reactive work per row. Instead, Solid shipped a [development warning in RC.17](https://github.com/solidjs/solid/pull/4205) that explains the conflicting writes, at no measured production cost in the PR’s size checks. It doesn’t rescue the draft. In a later [custom model-name field](https://github.com/openclaw/openclaw/pull/191045#issuecomment-6576819002), OpenClaw did that part: its binding watched only the committed value. The browser test lost a 31-character draft on the old build and kept it on the new one.

Steinberger also contributed fixes for a [select that retained its form](https://github.com/solidjs/solid/pull/4253) and [disposed work left in an idle queue](https://github.com/solidjs/solid/pull/4254). Both reached Solid RC.19 and then 2.0.0. This yields an unusual pair of release notes: OpenClaw helped fix stable Solid before it shipped stable Solid. [OpenClaw v2026.11.10](https://github.com/openclaw/openclaw/blob/v2026.11.10/ui/package.json) still used patched RC.18. Its [stable-upgrade PR](https://github.com/openclaw/openclaw/pull/200929) reported the original memory checks passing without those patches and passed its hosted size check; overall CI and approval for the final revision hadn’t cleared at our check.

The original Logs trial asked what OpenClaw could stop maintaining. By November there were several good answers: a copy of an input, a redraw subscription, a page-to-view interface. There was also code worth keeping: a small binding that lets someone finish typing, and the test that tells the next developer why it is there.
