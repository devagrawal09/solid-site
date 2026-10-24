<p>
  <img width="100%" src="https://assets.solidjs.com/banner?project=Website&type=core" alt="Solid Docs">
</p>

# Solid Website

This is the source code for the solid website: [https://solidjs.com/](https://solidjs.com/)

## Getting started

The website is built with [Solid](https://github.com/solidjs/solid). In order to get going, you should be familiar with the core API of Solid and how it works on the surface.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/solidjs/solid-site?title=SolidJS)

### Prerequisites

- Node.js 22.12 or newer
- [pnpm](https://pnpm.io/installation) 12.11.2 (pinned in `packageManager`)

### Install

1. Clone the project locally: `git clone https://github.com/solidjs/solid-site`
2. Change directory into your local copy: `cd solid-site`
3. Install the dependencies: `pnpm install --frozen-lockfile`

### Available commands

- `pnpm i`: Install the dependencies
- `pnpm dev`: Start the dev server
- `pnpm build`: Build the project
- `pnpm build:sitemap`: Generate the `sitemap.xml` file
- `pnpm format`: Format the whole project with prettier
- `pnpm type:check`: Check the TypeScript source
- `pnpm test:e2e`: Run the browser regression tests
- `pnpm deploy:dev`: Helper method to deploy to dev
- `pnpm deploy:prod`: Helper method to deploy to prod

### Solid 2 migration

The site runs on `solid-js`, `@solidjs/web`, and `@solidjs/signals` **2.0.0-rc.18** with `@solidjs/vite-plugin`. The router and Solid Primitives use their Solid 2 releases. Async page data uses `createMemo` and `Loading`; effects use separate tracking and apply functions, stores use draft setters, and links use the router's native anchor handling.

`solid-repl` comes from [Solid Playground PR #201](https://github.com/solidjs/solid-playground/pull/201), pinned to [commit 2b803dd](https://github.com/devagrawal09/solid-playground/commit/2b803dd675d63ca2e4b07a57dfce43c0dcfd4e5c) using pnpm's Git subdirectory dependency support. Its host, bundled default compiler, and homepage preview target rc.18. The first install builds the package from that commit; its build permission is restricted to the same commit in `pnpm-workspace.yaml`.

The tutorial is a local [42-lesson Solid 2 curriculum](src/content/tutorials/README.md), organized around sources and derivations, ownership, async reads, and mutations. All 15 examples and both exercise variants target rc.18. The 40 former tutorial URLs redirect into the new sequence and preserve query strings. English lessons are shown in every site locale with a notice until the new translations are available.

Preview execution needs access to the REPL's external CDNs. The template-literal and hyperscript examples pin `@solidjs/html` and `@solidjs/h` at `2.0.0-rc.0`, their independently versioned Solid 2 renderer releases, with the web/core runtime on rc.18.

The small `packages/docs-jsx` renderer handles the automatic JSX calls published by `@solid.js/docs` and generated from blog MDX. It replaces the documentation package's Solid 1 renderer. The site's menu, icon, transition, and social embed components also use Solid 2 directly.

### Browser tests

Install Chromium once with `pnpm exec playwright install chromium`, then run `pnpm test:e2e`. To use an existing Chromium installation, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable.

The tests build fixtures from the installed Solid 2 development runtime and alternate renderers, and block third-party requests. They compile all 99 starter/solution/example file sets with the actual REPL worker and execute every solved lesson and example. Behavioral checks cover source changes, pending updates, retries, authoritative refresh, optimistic rollback, and todo operations in all three renderers.

## Additional information

#### How do the documentation files work?

They're imported from the [Solid Docs](https://github.com/solidjs/solid-docs) package. There's a script there that builds the markdown files into consumable JSON files, and the package provides functions to load them.

## Credits

- [SolidJS](https://github.com/solidjs/solid) - Reactive Javascript UI library
- [TailwindCSS](https://tailwindcss.com/) - For all the styles
- [Cloudflare Wrangler](https://github.com/cloudflare/wrangler) - Cloudflare Wrangler to deploy to Workers
- [Vite](http://vitejs.dev/) - For the bundler / dev server
- [pnpm](https://pnpm.io) - The package manager
- [Shiki](https://github.com/shikijs/shiki) - For the code highlight

## Contributions

We are actively accepting contributions to improve the Solid website. We accept PRs that are well-structured, have formatting applied and follow the general structure of the site. If you have any questions, want to report a bug or a general concern, feel free to reach us on GitHub Issues or Discord.

## Sponsors

Thank you to our generous and helpful sponsors. If you're interested in sponsoring Solid, reach out to us on Discord.

- [Cloudflare](https://www.cloudflare.com/)
- [Netlify](https://www.netlify.com/)
- [Builder.io](https://www.builder.io/)
- [SauceLabs](https://saucelabs.com/)
