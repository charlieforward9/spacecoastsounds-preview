# Space Coast Sounds website concept

A standalone wedding DJ website with three independent Three.js scenes, an interactive package comparison, default-enabled scene audio, a demo inquiry form, and the owner's Instagram link.

## Run locally

Requires Node.js 20 or newer; there are no npm dependencies to install.

```sh
npm run dev
```

Open http://127.0.0.1:4173. Set `PORT` if needed. All browser modules, fonts, and audio are vendored locally.

The Node server saves test inquiries to `.data/inquiries.jsonl`, outside the public directory. That file is ignored by Git. `SCS_DATA_DIR` can select a different private inbox directory. No email or Instagram messages are sent.

## Preview hosting

GitHub Pages serves the contents of `public/` through the included Actions workflow. The demo form uses the local Node server via the temporary Cloudflare URL in `public/preview-config.json`. That inbox is available only while the server and tunnel are running. The website itself remains available on GitHub Pages after the tunnel stops.

For local-only use, set `apiBase` to an empty string. To use another tunnel, replace it with that tunnel's HTTPS origin. If hosting on a different frontend domain, add the origin to `SCS_ALLOWED_ORIGINS` when starting the server.

## Before a real business launch

The form clearly identifies itself as a preview and requests sample details. It does not forward leads to Space Coast Sounds or confirm bookings. Connect the form to the owner's approved receiving email or production lead service, configure spam protection and retention, and update the confirmation copy before collecting real customer inquiries.

Confirm all prices and inclusions with the owner. The eight-row package comparison follows the supplied sheet and uses an em dash for unspecified features. The site does not infer that expensive packages inherit every feature. The personal discount negotiation is outside this repository and is not advertised on the public sample.

The scenes are procedural, imagined venues with stylized figures. All venue visuals are live 3D geometry with procedural material textures. No AI-generated imagery is used. These are not real Space Coast Sounds events. There are no invented reviews, clients, awards, bookings, or availability claims. The music style dropdown saves the visitor's choice with the test inquiry.

## Included assets

- Three.js 0.186.1 and official geometry utilities: MIT license in `public/vendor/THREE-LICENSE.txt`.
- GSAP 3.15.0: vendored official distributions with their original notices; [GSAP Standard License](https://gsap.com/standard-license/).
- Space Grotesk: SIL Open Font License, included alongside the local font.
- Ceremony fanfare: Versilian Studios VSCO 2 Community Edition recorded trumpet samples, CC0; source paths and license in `public/assets/audio/`. Original arrangement.
- Cocktail glass clinks and 120 BPM dance music: original audio DSP compositions. No AI-generated media.
- Scene sound is enabled by default, with a visible mute control. Where browsers block autoplay, the first tap or keypress unlocks it; the button says “Tap for sound” until playback can start.

## Motion and fallback

Ceremony has an aisle, floral arch, seated guests, couple, sound system, and bright white terrace. Cocktail hour has a bar, tables, drinks, conversational guest groups, lounge seating, and string lights. The dance floor has a DJ booth, speakers, dancing guests, LED wall and floor, moving light rigs, and a disco ball. Two physical spotlights illuminate the dancers and floor; ceiling beams, curtains, bar glassware, faces, shirt fronts, and articulated knees add detail. Scene changes dissolve between separately lit 3D renders over 1.8 seconds with a gentle camera move. Interrupting a transition preserves its current blend. The audio uses the same duration and eased equal-power blend, so switching again midway remains continuous.

Mouse movement changes camera azimuth and elevation, aims the dance-floor lights, and projects a light and particle trail onto the floor. Dragging adds direct orbit control. Static architecture is combined by material, and people use instanced geometry. Only contributing scenes are rendered during a transition; inactive rooms skip animation work. The dance floor is the default full-width hero, without a marketing headline or copy column. Prices appear once, in one compact row directly underneath the venue and visible in the landing layout. All three prices stay side by side on phones and synchronize the inquiry form. A single compact icon matrix expands its source-specific rows as they enter the viewport. Rows can also be opened or closed by tap or keyboard; details never introduce another set of prices. Changing packages does not change the scene; the form follows the price row.

The dance floor opens in a dark theme, ceremony switches to white, and cocktail hour uses warm middle tones. Settled scenes render directly; only scene transitions use reduced-resolution offscreen buffers and a small dissolve compositor. PBR stone, wood, fabric, glass, and perforated speakers use deterministic textures. A room environment supplies material reflections; desktop dance-floor reflections update every sixth frame at 384 × 256. Its buffer is capped at 300,000 pixels on coarse-pointer devices and 600,000 on desktop, with adaptive reduction under sustained slow frames. Phones use instanced contact shadows; desktop shadow maps are 512px and reused between updates. All crowds update at 30Hz while the camera responds at display rate. Construction yields between scenes and material batches, and venue shaders are precompiled before interaction. The scene stops scheduling animation frames outside the viewport, while paused, or when the document is hidden. Reduced-motion preferences and the pause control stop orbit, scene transitions, particles, shaders, and GSAP motion. Touch scrolling remains available. Audio suspends when the page becomes hidden and resumes if it was enabled. WebGL failure displays a simple unavailable state; package and form functionality remain available.

## Verification boundary

Geometry, mouse camera framing, rapid scene changes, reduced-motion settlement, pixel budgets, HTTP assets, and preview form storage can be checked independently. A fresh browser visual review and GPU/frame-rate capture were unavailable due to the browser security policy in the editing session; these source checks do not establish a measured no-lag result.
