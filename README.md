# Space Coast Sounds website concept

A standalone wedding DJ website with an interactive Three.js dance-floor room, a package feature matrix, optional original synthesized audio, a music preference selector, a demo inquiry form, and the owner's Instagram link.

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

Confirm all prices and inclusions with the owner. The package comparison follows the supplied sheet and uses “Not listed” for unspecified features. The site does not infer that expensive packages inherit every feature. The personal discount negotiation is outside this repository and is not advertised on the public sample.

The room is a procedural, imagined 3D venue with abstract figures. The cinematic image and fallback are AI-generated concept artwork, not photography from a real Space Coast Sounds event. There are no invented reviews, clients, awards, bookings, or availability claims. The music preference selector uses authored directions; it is not an AI chatbot.

## Included assets

- Three.js 0.186.1 and official postprocessing modules: MIT license in `public/vendor/THREE-LICENSE.txt`.
- Space Grotesk: SIL Open Font License, included alongside the local font.
- Original concept image: generated with the built-in imagegen tool; prompt in `ASSET-PROMPT.md`.
- Original synthesized preview beat: browser Web Audio, muted until enabled.

## Motion and fallback

The 34-person crowd uses instanced geometry. The scene pauses its rendering when outside the viewport or when the document is hidden. It respects reduced-motion preferences and includes a pause control. Audio stops when the page becomes hidden. WebGL failure displays the concept artwork; no package or form functionality depends on WebGL.
