# Scene surface and lighting sources

The following photographed PBR textures and captured HDR environments come from [Poly Haven](https://polyhaven.com/), under [CC0 1.0](https://polyhaven.com/license). All runtime files are hosted with this website. No generative AI imagery is used.

| Asset | Use | Source |
| --- | --- | --- |
| Brown Planks 03 | Pavilion and deck wood; diffuse, OpenGL normal, roughness | [Asset page](https://polyhaven.com/a/brown_planks_03) |
| Bark Brown 02 | Banyan trunk and branches; diffuse, OpenGL normal, roughness | [Asset page](https://polyhaven.com/a/bark_brown_02) |
| Red Brick 03 | Lighthouse masonry; diffuse, OpenGL normal, roughness | [Asset page](https://polyhaven.com/a/red_brick_03) |
| Kloppenheim 06 Pure Sky | Day sky and ceremony image-based illumination | [Asset page](https://polyhaven.com/a/kloppenheim_06_puresky) |
| Venice Sunset | Sunset sky and cocktail image-based illumination | [Asset page](https://polyhaven.com/a/venice_sunset) |
| Dikhololo Night | Night sky and reception image-based illumination | [Asset page](https://polyhaven.com/a/dikhololo_night) |

These are generic material and lighting references. They do not document the requested venues or Space Coast Sounds events. Authored geometry, people, terrain, and venue layouts remain live 3D. The sky shader retains the authored horizon and samples the upper captured sky, avoiding photographic background buildings or terrain.

The nine surface JPEGs were conventionally resized to 512 x 512. The three 1K HDR sources were reduced to 512 x 256 by averaging 2 x 2 pixels in linear radiance, then encoded as RGBE. HDR values above display white are retained. The combined file payload is 2,402,049 bytes. The original source URLs, original byte counts and MD5 hashes, derived dimensions, processing methods, and SHA-256 hashes are recorded in [manifest.json](./manifest.json).

The HDR decoder is the unmodified official Three.js 0.186.1 HDRLoader, covered by [the vendored MIT license](../../vendor/THREE-LICENSE.txt).
