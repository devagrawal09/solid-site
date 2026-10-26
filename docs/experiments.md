# Homepage message experiment

`homepage-message-v1` compares the current technical introduction with a speed-focused message and a developer-experience message. Only the hero headline and introduction change. Keep layout, CTAs, destinations, and the rest of the page identical so the comparison measures messaging.

## Assignment and measurement

- The Worker allocates browsers equally using cryptographic randomness and signs the assignment with HMAC. Its first-party, Secure, HttpOnly cookie lasts 90 days. Assignment happens before application JavaScript renders, avoiding a control-to-variant flash. If the host serves HTML assets before the Worker, a bounded bootstrap API request resolves the assignment before rendering; after 1.5 seconds or a service failure, the control page renders without collecting data.
- A visible hero heading (at least 50%, while the document is visible) records one exposure. Browsers that never see it are outside the cohort. A blocked cookie cannot participate.
- Primary outcome: `learning_started`, meaning a tutorial code edit, Solve click, or Next step click. This is an engagement proxy, not proof that someone learned Solid or adopted it in production.
- Secondary outcomes: hero CTA click, tutorial opened, setup opened, docs opened, and homepage playground edited. Each outcome counts once per exposed browser. The denominator includes non-converters.
- Outcomes are attributed for seven days after the first exposure. Repeat visits cannot extend that deadline. Enrollment closes fourteen days after the first real exposure; enrolled browsers can finish their outcome window afterward. Non-personal run metadata preserves this deadline even after visitors opt out or old records are removed.
- Preview URLs (`/?home_variant=control`, `speed`, or `experience`), signed-in owner visits, recognized bots, DNT/GPC, and opt-outs are excluded. Previewing does not replace an existing live assignment.

## Results and decisions

Open `/experiments` and sign in with the site owner's ChatGPT account. `/api/experiments/results` requires the dispatch-authenticated email to match the configured owner email; the page's public JavaScript contains no results or admin secrets.

The dashboard shows unique browsers, conversion rates, 95% Wilson intervals, secondary outcomes, and a separate mature cohort whose entire seven-day window has elapsed. Counts remain provisional before maturation. No variation is automatically declared the winner.

The initial planning assumption is a 10% primary conversion rate and a 30% relative improvement (10% to 13%). A conventional two-proportion normal approximation, 80% power and Bonferroni adjustment for two challenger/control comparisons gives the displayed target per arm. These assumptions are not observed results. Review them before directing traffic. Do not extend the enrollment window after seeing favorable results; insufficient sample at the end is inconclusive. A small preview audience may never support a reliable winner.

For a final review, wait for enrollment plus attribution to finish, check roughly equal allocation, compare the mature primary outcome using a two-comparison-adjusted method, and inspect the intervals and practical effect size. The per-arm 95% intervals and observed lifts are descriptive; they are not an adjusted significance test. Avoid choosing a winner from a secondary outcome after inspecting all of them.

Change the experiment ID before modifying copy, weights, goals, or timing. Keep a record of a closed experiment before starting another. The current dashboard queries only the current ID. Browser identities do not link people across devices; cookie clearing and undetected bots can affect counts. This deployment measures its own traffic, not the traffic of `solidjs.com`.

## Hosting and maintenance

The app remains a Solid/Vite SPA with a Cloudflare Worker for first-party assignment, collection, and the private report. Sites uses the existing project ID and public URL. Its manifest declares `"d1": "DB"`; the Cloudflare Vite plugin builds `dist/server/index.js` and `dist/client`, and the maintained Sites plugin packages the manifest and generated Drizzle migrations.

Runtime secrets are configured in Sites, not the repository: `EXPERIMENT_SIGNING_KEY` (random, stable across deployments) and `EXPERIMENT_ADMIN_EMAIL` (the site owner). Other hosting providers must supply equivalent bindings and trusted authentication for the report. A missing configuration or assignment failure serves the control page without collecting data.

`pnpm build` includes TypeScript and the experiment integration checks before production compilation. `pnpm test:experiments` tests real SQLite constraints and aggregation through the Worker handler. `pnpm db:generate` produces schema migrations. Apply local migrations using the Sites starter workflow; production publication applies packaged migrations. Never run schema creation during an HTTP request.

The privacy page explains the random identifier and first-party outcomes. Opt-out erases that browser's current experiment records. The private report removes records older than 90 days when opened; this is cleanup on access, not an unattended deletion schedule. No names, email addresses, IP addresses, user code, free-form URLs, or user-agent strings are stored in experiment tables.
