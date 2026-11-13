# Architecture

Follow the Boat is a static, procedural landscape artwork. Its four settings are
the Li River near Xingping, Shimei Bay, Beijing's Liangma River, and an imagined
Suzhou courtyard, with a separate moonlit interior. The courtyard and interior
remain implemented but have no public entry. The visible journey starts randomly
in ink, city, or coast, then cycles through that fixed order. Geometry,
palette, and composition express those places without claiming a surveyed view.

## Stack

- TypeScript defines scene, animation, environment, and rendering contracts.
- Vite provides development serving and produces the static deployment bundle.
- PixiJS owns WebGL programs, textures, render targets, and drawing submission.
- Anime.js provides authored timelines, driven by the artwork's single clock.
- Spine Pixi v8 evaluates the coastal children's authored bone animations.
- Canvas 2D paints deterministic landscape textures and supplies a static fallback.
- GLSL retains the artwork's water, ink, lighting, wildlife, and transition effects.
- Playwright checks the shipped application, including mobile and GPU recovery.

There is no framework for DOM components, second rendering engine, 3D scene,
or weather network dependency. Add dependencies only when they
replace an existing responsibility or implement an accepted requirement.

## Boundaries

`src/config` owns text and geographic references. `src/scenes` owns authored
composition, procedural painting, static fallback, and scene shaders. Shared
drawing primitives belong in `src/drawing`, not in a universal scene engine.

`src/rendering` adapts the scene contract to PixiJS. It owns texture lifetime,
render targets, uniform updates, and composition. Drawing modules neither fetch
data nor import the renderer. Cached Canvas paintings remain the source of
truth for appearance and water hit masks.

`src/motion` owns the journey and wildlife behavior. Anime.js replaces authored
timing/interpolation; analytic waves, wind springs, and animal deformation stay
in their appropriate CPU or GPU modules. A Pixi Ticker owns the application clock;
a manually advanced Ticker handles render-rate limits without scheduling another
frame loop. Anime owns voyage interpolation, completion, and actor timelines.
No library may start a competing
animation loop.

`src/environment` owns bounded render conditions and gradual changes. Geographic
coordinates in configuration are representative weather lookup points. A future
weather adapter must validate provider data, convert units, enforce freshness,
and return provider-independent conditions. Network requests never run per frame.
Rain and daylight rendering remain separate future work.

`src/actors` owns reusable Pixi display objects. The shared boat uses Containers,
Graphics, a procedural hull Sprite, and an Anime rowing timeline. Its small local
render texture supplies coverage and oar lighting masks to each scene's material;
shader code no longer constructs the animated person's limbs. Reflection and
foreground occlusion still use the scene's artistic material. Every scene shares the same
open boat, seated passenger, and rowing timeline. A single actor texture
is refreshed once per frame, including scene transitions.
Coastal children use the official Spine Pixi v8 runtime, with public-domain
Spineboy project bone animation and original procedural vector clothing. No
upstream example images are shipped. Motion provenance and separate runtime
licensing are documented in `licenses/spineboy-project.txt` and `NOTICE`.
The derived data retains only bone timelines and the run and idle clips:
https://github.com/EsotericSoftware/spine-runtimes/tree/4.2/examples/spineboy
Distance traveled controls the run phase, while Spine blends it over idle near
turns. Both tracks use bounded absolute time, with automatic ticker updates off.
The children share immutable skeleton data and one small render atlas, beneath
palm occlusion; the surface owns destruction of all child display objects.

## Rendering contract

Each scene provides a deterministic Canvas painting, a GLSL fragment program,
and a complete static fallback. Shared actor geometry and water interactions
remain common. Scenes prepare lazily, reuse compiled programs across resize,
and release obsolete textures and targets. The courtyard and interior are excluded from the
public cycle and idle preparation. The courtyard navigation and sun entrance are
hidden; retained interior controls and rendering remain available in source.

City, coast, and garden render directly to the screen during normal playback. Ink keeps
its paper-compositing pass; transitions render both scenes and composite them.
Fullscreen targets acquire viewport storage only when used. Uniform vectors
are reused rather than allocated on each frame. City reflections reuse sampled
lighting, and shader work outside its visible region is skipped.

The renderer uses Pixi's WebGL backend. Custom GLSL does not become
WebGPU-compatible automatically. Texture orientation, straight/premultiplied
alpha, framebuffer orientation, and pixel coordinates must be verified during
migration. Preserve existing ink compositing rather than stacking generic filters.

An unavailable or unrecoverable GPU falls back to Canvas 2D. Context recovery,
hidden-tab suspension, resize, and back/forward restoration are explicit app
lifecycle responsibilities. Desktop and mobile retain the same scene controls.

## Build and delivery

The source tree, documentation, tests, font tooling, and deployment tooling are
not public website assets. Only `dist/` is shipped. Keep the short README as the
project introduction; engineering details live here and in `migration.md`.

Vite fills the single HTML template from configured text; font subsetting stays
a project-specific build step. Keep
font licenses, project LICENSE/NOTICE, and dependency notices in the distribution.
Do not publish source maps, credentials, private keys, or deployment destinations.
Browser environment variables are public: never put credentials in `VITE_*`.

Deployment runs from signed `main` commits after CI verification succeeds,
syncing the validated `dist/` output while preserving content-addressed assets
and unrelated hosted files. Do not change TLS, DNS, account privileges, or
infrastructure casually.

## Maintenance rules

Use current stable major versions, pin resolutions in the lockfile, and review
major upgrades deliberately. Type checking is separate from Vite transpilation.
Keep modules focused and concise. Delete superseded infrastructure instead of
maintaining parallel old/new renderers. Tests assert behavior and resource
lifecycle rather than private GL call counts.

The migration is accepted only after the checks in `migration.md` pass; reduced
source size alone is not evidence of equivalent visuals or better performance.

## Shared effects and actor ownership

`drawing/layers.ts` creates named painting layers in one design coordinate space.
Scene shaders use the common sky, water, boat-light and interaction effects in
`rendering/shaders/`; palettes and composition remain local to each scene.
All scene fragment entry points live under `scenes/<name>/shaders/main.ts`.

`actors/surface.ts` centralizes Pixi atlas rendering and disposal. The boat and
beach actors use it with the shared application clock. Static fallback artwork
remains necessary when WebGL is unavailable. Interior playback skips the boat
atlas update. Room uniforms reuse the painting layout and update on resize.

Keep authored drawing code where the image is defined. Do not replace Pixi
resource management or Anime timeline interpolation with another scheduler,
handwritten rasterizer, or duplicate allocation lifecycle. No new dependency
is needed for these effects.

The coastal pier uses Pixi's `PerspectivePlaneGeometry`, shared with
`PerspectiveMesh`, to project planks and support anchors from one rectangular
layout. Portrait and landscape compositions have separate corner presets.
Projected shapes are baked into the existing foreground and material mask;
geometry buffers are destroyed immediately, with no extra per-frame render pass.
