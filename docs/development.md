# Development

Use Node.js 24 or newer. Install the locked dependencies with `npm ci`.
Run `npm run dev` for local development and `npm run build` for the deployable
static site. Vite serves source modules during development; it does not become
a server dependency for the published website.

## Editing

- Change interface text in `src/config/copy.ts`. The single HTML template is
  `index.html`; Vite fills its escaped placeholders in development and builds.
- Change geography and default conditions in `src/config/places.ts`.
- Edit composition and painting beside each scene in `src/scenes/`.
- Put shared brushwork in `src/drawing/`, motion in `src/motion/`, and layout
  in `src/styles/`. Do not embed interface strings in rendering modules.
- Font subsets live alongside their license notices in `src/assets/fonts/`.
  After changing configured copy, regenerate subsets with `npm run fonts`;
  `npm run check` verifies that every configured character is present in the
  bundled subsets.

## Verification

Run `npm run check` and `npm test`.
Install Chromium with `npx playwright install chromium`, then run
`npm run build && npm run test:browser`.

`check` runs Biome formatting/lint rules, strict TypeScript checks, and bundled
font glyph verification. `build` type-checks, bundles `dist/` with Vite, and
validates the public file allowlist and size budget via `scripts/check-build.mjs`.
Unit tests cover timing, wind, environment boundaries, fish continuity, HTML
copy escaping, asset origin validation, and font table renaming. Browser E2E
tests exercise the built production bundle via `vite preview`, including scene
switching and the static Canvas 2D fallback across viewport resizes.

## Repository layout

- `src/`: runtime code, styles, configured text, and bundled font assets.
- `public/`: static license notices and `robots.txt` copied into `dist/`.
- `scripts/`: build output validation, font subsetting, and HTML copy helpers.
- `tests/`: Node unit tests and Playwright browser E2E checks.
- `docs/`: architecture, development guidance, and historical engineering records.
- `licenses/`: upstream notices that need to accompany bundled dependencies.

Keep only the Vite entry template and tool configuration at the root alongside
project metadata. There is no generated HTML copy or Pages-specific marker.
Dependencies, build output, font downloads, browser reports, coverage, editor
files, and local environment files are ignored. Keep the lockfile, tests,
license notices, and historical engineering records.

## Delivery

Builds include project, font, and bundled dependency notices. Runtime packages
are bundled locally; browsers do not fetch JavaScript from third-party CDNs.
Do not add private values to browser configuration or `VITE_*` variables.
An optional `ASSET_BASE_URL` selects the HTTPS asset CDN origin at build time.
Its resulting public resource URLs are visible to website visitors; it is not a
secret. Concrete deployment credentials stay in GitHub Actions secrets outside
version control, and `.github/workflows/deploy.yml` deploys to the target server
only after the `Check` workflow succeeds on `main`.

## Long-running displays

Keep one Pixi Ticker frame loop. The render-rate and maintenance tickers advance
manually, and Anime timelines are paused and explicitly cancelled when replaced
or finished. Repeated frame-rate drops back off recovery attempts to avoid
60/30 fps oscillation on constrained GPUs.
Scene caches are limited to three paintings; resizing destroys obsolete textures.
All passes share one fullscreen geometry. Internal resolution is capped at
1.8 million pixels to bound Canvas and GPU memory on high-density displays.
Renderer disposal releases owned textures/buffers and the WebGL context. Context
loss, page suspension, and static fallback are tested separately. Never hide a
leak with periodic page reloads or clear unrelated browser state.

Boat motion lives in `src/actors/boat.ts`; adjust the display hierarchy and Anime
keyframes there. Its local coordinate bounds live in `src/config/actors.ts`.
Do not recreate the previous GPU limb-distance functions or full-viewport boat
texture. Actor tests check texture orientation, movement, and a seamless cycle.
A real page departure disposes timelines, tickers, and renderer resources; a
back/forward-cache suspension only pauses them so restoration remains possible.
