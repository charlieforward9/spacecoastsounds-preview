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
- Scene sound is enabled by default, with a visible mute control. Where browsers block autoplay, the first tap or keypress unlocks it; the speaker icon remains muted until playback starts, with its state exposed to assistive technology and hover titles.

## Motion and fallback

The site opens in ceremony mode with a closer camera centered on the couple and guests and an optional 3.8-second camera approach. The lighthouse is a background landmark; its top may crop in this tighter framing. The ceremony is an interpretation of Jupiter Inlet Lighthouse & Museum: red masonry lighthouse, dark lantern and balcony, a broad banyan/Ficus canopy with hanging aerial roots, white ceremony chairs on a wooden deck, and moving inlet water. Reference links and modeling assumptions are in `VENUE-REFERENCES.md`.

The lighthouse now sits on a contoured coastal dune, with 34 approach steps, irregular shoreline, a sandy path, coquina-toned ground, planted scrub and palms, and a secondary pier and keeper's building silhouette. Terrain and vegetation are based on the official venue and BLM habitat descriptions, with illustrative camera-adapted dimensions rather than survey data.

Cocktail hour is inspired by Taylor Beach House Cafe in Hobe Sound, assumed to be the requested venue. The camera is inside its open pavilion at eye height, looking past guests toward the bar, shelves, bottles, woven woodwork, hanging lights, fans, exposed rafters, and interior planting. Distance haze reduces exterior contrast. Reception uses the very same pavilion object at night; it does not duplicate or replace the roof, patio, bar, facade, or planting. These are authored interpretations, not surveyed digital twins or records of the business's events.

One persistent set of 33 guest identities, clothing colors, and instanced body parts moves between seated ceremony, cocktail groups, and dancing. Phase and body posture blend continuously, including interrupted scene changes. A small deterministic footprint solver separates guests and checks circles and rotated rectangles for furniture, the bar, tree, posts, speakers, and microphones. Chairs and tables make yielding adjustments while relocating so moving furniture does not trap guests; props ease back to their layouts. It is footprint avoidance, not full body or cloth physics. Twenty-four chairs retain their geometry in two instanced batches while moving to perimeter seating. Four tables move and lower for the reception. The DJ console, speakers, and microphones persist and relocate. Location changes dissolve the two backgrounds behind the same moving guests and props; sunset-to-night uses a single scene pass with interpolated lighting, sky, fog, bulbs, and linear reflection maps. Audio retains the synchronized 2.6-second equal-power crossfade with a quintic easing curve: recorded ceremony trumpets, modeled glass clinks, and an original 120 BPM reception loop.

Package selection updates the illustrated audio rig and the inquiry form together. Selecting the $800 Reception package switches to reception and disables ceremony and cocktail controls with lock icons. Scene and audio controls enforce the same coverage rules; switching to either higher package reopens all three phases. Reception-only coverage shows equipment only in the reception; the middle package shows the main system and wireless microphone across its covered scenes; All-Day Audio adds a secondary sound setup and additional microphone. Multiple-speaker and multiple-microphone cells show repeated symbols plus a plus sign because the supplied sheet does not state exact quantities. Consultation, music planning, MC, timeline coordination, and event support each have distinct symbols. Equipment appearance, cabinet numbers, and layout are illustrative; no make, model, wattage, or guaranteed microphone count was provided. The higher tier does not automatically inherit unspecified MC or planning services.

Mouse movement and dragging change the camera and ground light trail. Reduced motion and pause stop camera moves, scene transitions, particles, shader movement, and GSAP motion. On phones, horizontal swipes orbit the scene after an intent threshold; vertical and diagonal gestures remain native scrolling. Pinch zoom remains available. Portrait camera framing adapts the field of view to retain more of the interior. Scene sound is default-enabled, with a visible mute control; where autoplay is blocked, the first trusted tap or keypress starts it. Audio and scene animation suspend in hidden tabs.

The renderer retains its 300,000-pixel mobile and 600,000-pixel desktop buffer limits with adaptive reduction on sustained slow frames. Static architecture and rigid props are grouped by material; chairs, guests, decorative bulbs, foliage and equalizer bars use instanced geometry. Location transitions render at most two background scenes; changing time in the pavilion uses one. Reflection maps are baked from three procedural sky states at 128px, then blended into one linear 384 × 512 texture only while the weights change, at most every sixth frame. Desktop floor reflections update every sixth frame at 384 × 256; phones omit them. Desktop shadow maps are 512px. Crowds update each desktop frame and at 30Hz on touch devices; construction yields, shaders are precompiled, and the scene stops offscreen. WebGL failure leaves pricing and the preview form usable.

Prices appear once directly below the venue, stay side by side on phones, and select the form package and audio illustration. Each feature category and populated package cell has a distinct pictogram; additional gear uses repeated icons. The chosen column is highlighted, while inactive feature buttons are disabled and dimmed. Price buttons stay selectable, and the form package selector remains synchronized. Compact feature icons expand into source-specific details as rows enter the viewport, or by tap/keyboard on the selected cell or category label. Locks mean explicitly excluded coverage; em dashes mean the sheet does not list the feature. The form follows the comparison. On phones and touch tablets, the feature category spans its own row and all three icon cells have explicit matching grid columns, fixing the prior zero-width first icon. Selected feature details span the full width at a readable text size; undecided visitors retain three-column details. The scene fills its full height without venue labels, an equipment caption, or exploration instructions. Sound and motion use icon controls at the top; rings, a cocktail glass, and a record select phases in a compact floating pill. Accessible names, pressed states, package locks, and hover titles remain available. There is no repeated brand overlay, visible scene-selection text, or scroll instruction. The visible flow is scene, package comparison, then form. Prices remain side by side and sticky beneath the header. Form fields stack below 480px, date fields and selects use full-width 16px controls, and safe-area spacing protects the header and footer. Personal discount terms remain outside this public sample.

## Verification boundary

Geometry, mouse camera framing, rapid scene changes, reduced-motion settlement, pixel budgets, HTTP assets, and preview form storage can be checked independently. A fresh browser visual review and GPU/frame-rate capture were unavailable due to the browser security policy in the editing session; these source checks do not establish a measured no-lag result. Mobile input orchestration was checked with synthetic pointer events, and camera resize/pixel-budget calculations were checked at six portrait/landscape dimensions from 320px to 844px wide. Those checks do not replace a real phone visual review or an iOS/Android keyboard and native date-picker check.
