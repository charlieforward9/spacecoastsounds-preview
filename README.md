# Space Coast Sounds website concept

A standalone wedding DJ website with three independent Three.js scenes, an interactive package comparison, optional original synthesized audio, a demo inquiry form, and the owner's Instagram link.

## Run locally

Requires Node.js 20 or newer; there are no npm dependencies to install.

```sh
npm run dev
```

Open http://127.0.0.1:4173. Set `PORT` if needed. All browser modules, fonts, and images are vendored locally.

The Node server saves test inquiries to `.data/inquiries.jsonl`, outside the public directory. That file is ignored by Git. `SCS_DATA_DIR` can select a different private inbox directory. No email or Instagram messages are sent.

## Preview hosting

GitHub Pages serves the contents of `public/` through the included Actions workflow. The demo form uses the local Node server via the temporary Cloudflare URL in `public/preview-config.json`. That inbox is available only while the server and tunnel are running. The website itself remains available on GitHub Pages after the tunnel stops.

For local-only use, set `apiBase` to an empty string. To use another tunnel, replace it with that tunnel's HTTPS origin. If hosting on a different frontend domain, add the origin to `SCS_ALLOWED_ORIGINS` when starting the server.

## Before a real business launch

The form clearly identifies itself as a preview and requests sample details. It does not forward leads to Space Coast Sounds or confirm bookings. Connect the form to the owner's approved receiving email or production lead service, configure spam protection and retention, and update the confirmation copy before collecting real customer inquiries.

Confirm all prices and inclusions with the owner. The eight-row package comparison follows the supplied sheet and uses an em dash for unspecified features. Full source inclusions are available below it. The site does not infer that expensive packages inherit every feature. The personal discount negotiation is outside this repository and is not advertised on the public sample.

The scenes are procedural, imagined venues with stylized figures. The fallback image is AI-generated concept artwork. These are not real Space Coast Sounds events. There are no invented reviews, clients, awards, bookings, or availability claims. The music style dropdown saves the visitor's choice with the test inquiry.

## Included assets

- Three.js 0.186.1 and official postprocessing modules: MIT license in `public/vendor/THREE-LICENSE.txt`.
- GSAP and ScrollTrigger 3.15.0: vendored official distributions with their original notices; [GSAP Standard License](https://gsap.com/standard-license/).
- Space Grotesk: SIL Open Font License, included alongside the local font.
- Original concept image: generated with the built-in imagegen tool; prompt in `ASSET-PROMPT.md`.
- Original synthesized preview beat: browser Web Audio, muted until enabled.

## Motion and fallback

Ceremony has an aisle, floral arch, seated guests, couple, sound system, and sunset terrace. Cocktail hour has a bar, tables, drinks, conversational guest groups, lounge seating, and string lights. The dance floor has a DJ booth, speakers, dancing guests, LED wall and floor, moving light rigs, and a disco ball. Scene changes slide between separate scene graphs and remain interruptible.

Mouse movement changes camera azimuth and elevation, aims the dance-floor lights, and projects a light and particle trail onto the floor. Dragging adds direct orbit control. Static architecture is combined by material, and people use instanced geometry. Only the active scene and its outgoing transition are rendered. The comparison highlights the selected package and synchronizes the inquiry form; phones show one selected package with a sliding selector.

The scene pauses rendering outside the viewport or when the document is hidden. Reduced-motion preferences and the pause control stop orbit, scene transitions, particles, shaders, and GSAP motion. Touch scrolling remains available. Audio stops when the page becomes hidden. WebGL failure displays the concept artwork; package and form functionality remain available.
