# Space Coast Sounds website concept

A standalone wedding DJ website with three venue-inspired Three.js scenes, an interactive package comparison, default-enabled scene audio, a demo inquiry form, and the owner's Instagram link.

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

The site opens in ceremony mode with an optional 3.8-second camera approach and a brief, quiet brand reveal. The ceremony is an interpretation of Jupiter Inlet Lighthouse & Museum: red masonry lighthouse, dark lantern and balcony, a broad banyan/Ficus canopy with hanging aerial roots, white ceremony chairs on a wooden deck, and moving inlet water. Reference links and modeling assumptions are in `VENUE-REFERENCES.md`.

Cocktail hour is inspired by Taylor Beach House Cafe in Hobe Sound, assumed to be the requested venue: a thatched hip roof, exposed wood rafters, open garden pavilion, bar, palms, curved fire-pit bench, and string lights just before sunset. Reception uses the exact same roof geometry, patio, bar, fence, house facade, and planting plan at night, with warm string lights and lamps, a DJ booth, dancing guests, speakers, and moving accents. These are authored interpretations, not surveyed digital twins or records of the business's events.

Scene changes dissolve over 1.8 seconds with a gentle camera move. Interrupting a transition preserves its current blend. Audio uses the same eased equal-power transition. Recorded trumpets accompany ceremony; modeled glass clinks accompany cocktails; the reception uses an original 120 BPM loop. Audio remains enabled across all scenes, suspends in a hidden tab, and resumes if it was enabled. Where autoplay is blocked, the first trusted tap or keypress starts it. The visible control can mute it.

Mouse movement and dragging change the camera and aim a light trail at the ground. Interaction dismisses the intro so the scene responds immediately. Static architecture is combined by material; figures, leaves, roof fringe, and decorative bulbs use instanced geometry. Inactive scenes skip animation work. Reduced-motion preferences and the pause control stop camera moves, venue transitions, particles, shader movement, and GSAP motion. Touch scrolling remains available.

The renderer limits its buffer to 300,000 pixels on coarse-pointer devices and 600,000 on desktop, with adaptive reduction under sustained slow frames. Settled scenes render directly; transitions use smaller offscreen buffers and a dissolve compositor. Environment reflections are baked once from each procedural sky at 128px. Desktop reception floor reflections update every sixth frame at 384 × 256. Phones use contact shadows; desktop shadow maps are 512px and reused. Crowds update at 30Hz, construction yields between batches, shaders are precompiled, and scene animation stops offscreen or in a hidden tab. WebGL failure leaves prices and the preview form usable.

Prices appear once directly below the venue, stay side by side on phones, and select the inquiry form's package. Compact feature icons expand into source-specific details as rows enter the viewport, or by tap/keyboard. The form follows the comparison. Personal discount terms remain outside this public sample.

## Verification boundary

Geometry, mouse camera framing, rapid scene changes, reduced-motion settlement, pixel budgets, HTTP assets, and preview form storage can be checked independently. A fresh browser visual review and GPU/frame-rate capture were unavailable due to the browser security policy in the editing session; these source checks do not establish a measured no-lag result.
