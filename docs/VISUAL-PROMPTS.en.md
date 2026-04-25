# Shared Visual Prompts

## Purpose

This document defines the shared image-generation prompt used by the visual asset module.

The goal is to avoid rewriting style instructions from scratch for every image.
Instead:

1. reuse the shared base prompt
2. append the specific teaching topic
3. append required concepts, layout, and grade range

This keeps the full image library visually and pedagogically consistent.

## Shared Base Prompt

```text
K-12 classroom teaching infographic designed for lesson preparation, slide decks, handouts, and classroom projection. Prioritize subject accuracy, clear structure, and direct teaching usability. Use a flat 2D educational infographic style with orderly layout, clear information hierarchy, and strong emphasis on the core concept. Avoid poster styling, emotional illustration, and excessive decoration. Use a white or very light clean background with enough whitespace and safe margins. The composition should fit a high-resolution 16:9 horizontal canvas. Labels should be clear, readable, and classroom-friendly. Visual elements should mainly be diagrams, flowcharts, structure maps, comparison charts, and concept boards. Do not use main human characters, photo style, realism, 3D, complex lighting, heavy texture noise, watermarks, logos, brand marks, or unrelated background elements. The overall visual language should stay unified, clean, rational, and teaching-oriented for long-term reuse in an educational asset library.
```

## Shared Negative Prompt

```text
realistic style, photography, 3D render, poster design, game UI, cinematic look, cyberpunk, excessive shadow, strong perspective distortion, complex background, main human character, cartoon face character, messy layout, decorative clutter, low resolution, blurry text, broken Chinese text, typos, watermark, logo, branding, signature, cropped edges, overcrowded composition, oversaturated colors, neon colors, noise, dirty background
```

## Recommended Composition Pattern

For each actual image, append the following fields after the shared base prompt:

- `Topic: <knowledge point>`
- `Image type: concept map / flowchart / comparison chart / diagram`
- `Must include: <key concepts>`
- `Recommended layout: split comparison / horizontal flow / structured sections / centered map`
- `Primary palette: green / blue / orange / teal`
- `Grade range: primary / middle school / high school`

Template:

```text
[Shared Base Prompt]
Topic: XXX
Image type: XXX
Must include: XXX, XXX, XXX
Recommended layout: XXX
Primary palette: XXX
Grade range: XXX
```

## Example

```text
K-12 classroom teaching infographic designed for lesson preparation, slide decks, handouts, and classroom projection. Prioritize subject accuracy, clear structure, and direct teaching usability. Use a flat 2D educational infographic style with orderly layout, clear information hierarchy, and strong emphasis on the core concept. Avoid poster styling, emotional illustration, and excessive decoration. Use a white or very light clean background with enough whitespace and safe margins. The composition should fit a high-resolution 16:9 horizontal canvas. Labels should be clear, readable, and classroom-friendly. Visual elements should mainly be diagrams, flowcharts, structure maps, comparison charts, and concept boards. Do not use main human characters, photo style, realism, 3D, complex lighting, heavy texture noise, watermarks, logos, brand marks, or unrelated background elements. The overall visual language should stay unified, clean, rational, and teaching-oriented for long-term reuse in an educational asset library.
Topic: comparison of series and parallel circuits
Image type: comparison concept board
Must include: connection pattern, current paths, component interaction, what happens when one bulb fails
Recommended layout: split comparison
Primary palette: blue green
Grade range: middle school
```

## Where Generated Images Should Live

Store generated images under:

```text
visuals/
```

Grouped by subject:

```text
visuals/biology/
visuals/chemistry/
visuals/cs/
visuals/math/
visuals/physics/
visuals/science/
```

Each asset should usually include at least:

- one image file, such as `vis.physics.series-parallel-circuit.png`
- one matching metadata file, such as `vis.physics.series-parallel-circuit.json`

Example:

```text
visuals/physics/vis.physics.series-parallel-circuit.png
visuals/physics/vis.physics.series-parallel-circuit.json
```

If you later need a dedicated thumbnail, expand it to:

```text
visuals/physics/vis.physics.series-parallel-circuit.png
visuals/physics/vis.physics.series-parallel-circuit.thumb.png
visuals/physics/vis.physics.series-parallel-circuit.json
```

## Naming Convention

Use:

```text
vis.{subject}.{topic-slug}.png
vis.{subject}.{topic-slug}.json
```

Examples:

```text
vis.physics.series-parallel-circuit.png
vis.biology.mitosis-stages.png
vis.chemistry.states-of-matter-particles.png
```
