# Why did “Grace” change back to “Ada”?

Type “Grace” over “Ada.” Don’t leave the field. A validation update runs, and suddenly you’re looking at “Ada” again.

Those names come from a [Solid regression test](https://github.com/solidjs/solid/blob/6cca8b574decd20e8ca495a9376e735b6bc5655a/packages/web/test/uncommitted-input-overwritten.spec.tsx). The original report came from OpenClaw’s Settings UI. The user hadn’t pressed Escape. The server hadn’t rejected an edit. In fact, the server didn’t need to be involved at all. The browser knew what the person was typing, the application knew the last saved value, and a routine update to the input was enough to make the two disagree in public.

There are two questions here. Why did OpenClaw want its dashboard wired up this way? And once we on the Solid side understood the failure, whose job was it to fix it?

## Before there was a failing field, there was a Logs screen

OpenClaw’s [framework trial](https://team.openclaw.ai/chat/roboclaw/timeline-of-solid-js-to-lit-pr-refactors-5ba10f632c29434c9f79a92c3c16a7a3) put Svelte and Solid through the same Logs-view scenarios. The argument for Solid was a good fit between TSX and the existing TypeScript, and the chance to delete code that told views when to redraw. There was no proposal to replace the Gateway. It already decided which requests counted, stored sessions, and handled reconnects. Third-party plugin authors could keep mounting into a container with the same update, focus, and dispose contract.

The team [installed Solid RC.13 next to Lit](https://github.com/openclaw/openclaw/pull/168305). Workboard went over first; chat transcript rows, the composer, and the shell followed. By October 16, the dashboard had [retired direct Lit dependencies](https://github.com/openclaw/openclaw/pull/174213). Across the UI and two plugin trees, a like-for-like scan found **800 production files importing Lit before the migration and zero at that cutover**. The new renderer was in place. OpenClaw had kept its authority over saved state. And someone was still perfectly entitled to type an unsaved value.

## What validation actually wrote

The Settings field bound `value` to committed state but waited for `change` to accept what the user had entered. In between, “Grace” existed only in the native input. Validation changed another attribute on that element. The compiler had grouped the attribute and value updates, so that work also wrote the still-committed “Ada” back into the text box.

One possible framework fix was to split up the effects. [Ryan Carniato declined that approach](https://github.com/solidjs/solid/pull/4198#issuecomment-6320288827): extra effects per row were a cost every affected view would pay. Instead, **Solid RC.17 gained a [development warning](https://github.com/solidjs/solid/pull/4205)**, with no increase in the PR’s production-size checks. A developer can keep a draft current on `onInput` or let the browser own it with `defaultValue`. The warning doesn't silently choose a policy. In the original failing pattern, both framework versions put “Ada” back; the newer one tells you why.

OpenClaw later fixed a [custom model-name field](https://github.com/openclaw/openclaw/pull/191045#issuecomment-6576819002) by watching only the committed value. A background refresh could change other attributes without disturbing the live edit. A browser check lost a 31-character draft twice on the old build and preserved it twice after the fix. The Solid test and the OpenClaw test establish different things: a developer gets a diagnosis, and a person actually gets to finish typing.

## Is it the same button? Is it the same conversation?

There was another way a straightforward translation could be wrong. A Workboard toggle chose between “expand” and “collapse.” Lit refreshed the binding on redraw; the translated Solid expression picked once when it bound the button. The repair moved the decision inside the event callback. The [test clicks the same button twice](https://github.com/openclaw/openclaw/pull/182293) and checks the expanded state after each click. Construct a fresh button before the second click and the test exercises the wrong thing.

Now consider someone composing Japanese text while a chat reply streams. Checking the final string alone can miss a disruptive write to the textarea. OpenClaw already tested the Enter key under Lit. Its [Solid composer test](https://github.com/openclaw/openclaw/blob/v2026.11.8/ui/src/pages/chat/chat-composer-solid.test.tsx) also checks that the streaming update neither replaces the element nor writes its native `value`. Switch conversations, and the expectation reverses: the new draft must be safe from a late event on the old element.

That’s more precise coverage of these interactions. It doesn’t mean the old suite was generally weaker. Remove one guard against repeated teardown from disposable copies of both versions: [both fixtures](https://github.com/openclaw/openclaw/pull/169387) pass with the guard and both catch the same duplicate call without it.

## Follow the next repair

An accessible label on the Debug page also confused *current* with *submitted*. Send a `health` request, then select `status` before the reply arrives. Which name should a screen reader announce for the reply? The page used to send its view 21 fields and callbacks. A [post-port cleanup](https://github.com/openclaw/openclaw/pull/175155) put the request and the label together. A later developer could [capture the submitted name](https://github.com/openclaw/openclaw/pull/199347) once and use it through completion, leaving the next request editable. The fix touched one production file.

Scale that change out to the core UI. From the October 16 cutover to November 24, files directly importing a Solid runtime value rose **from 776 to 1,126**, while direct `createEffect` call sites fell **from 323 to 85**. Those [counts](./evidence.md) don’t grade the code. They make an interesting prediction: more of the UI should be able to read what it needs without a separate callback to keep a copy current. On `main`, the [Workshop draft queue](https://github.com/openclaw/openclaw/pull/202572) did just that. After Apply, it derives the next draft from what the app already knows. The reviewer stays in the queue, with no new Gateway operation.

In a [controlled streaming test](https://github.com/openclaw/openclaw/pull/180884), narrowing subscriptions reduced whole-pane renders from **353 to one** and median script CPU time by **51%**. Both sides were Solid builds. Size tells a less tidy story: from OpenClaw v2026.11.4 to v2026.11.5, directly referenced entry HTML JavaScript outside route templates shrank **73% gzipped**, while all shipped dashboard JavaScript **grew 17%**. Features and chunking changed. A lighter entry list, a larger full distribution, and a less busy chat pane can all be true.

## What reached stable first

The lost edit wasn’t the only report that traveled in both directions. OpenClaw’s Peter Steinberger submitted Solid fixes for a [closed form still held by a select](https://github.com/solidjs/solid/pull/4253) and [disposed computations left in a queue](https://github.com/solidjs/solid/pull/4254). Ryan merged both, and they shipped in RC.19 and then stable Solid 2.0.

OpenClaw’s own [v2026.11.10 manifest](https://github.com/openclaw/openclaw/blob/v2026.11.10/ui/package.json) still pins patched RC.18. The [2.0 upgrade branch](https://github.com/openclaw/openclaw/pull/200929) passed the original memory checks without the patches and cleared its size check, but its aggregate CI and final dependency approval hadn’t cleared at our check. The people who found the problems had already helped other Solid users before shipping the stable framework themselves.

Back at the input, “Grace” and “Ada” can both be correct. One is the edit in progress; one is the last accepted value. OpenClaw’s job was to let the user decide when the first should replace the second. Ours was to make it harder for a developer to miss the moment they’d taken that decision away.
