# Shared Visual Prompts

## Purpose

This document defines the shared image-generation prompt used by the visual asset module.

These visuals are not meant to recreate textbook pages or dense handouts.
Their job is to:

- make one knowledge point easier to see
- help teachers explain it more intuitively
- let students understand structure, relation, change, or contrast at a glance

So the visual system follows a low-text, high-clarity, strong-diagram direction by default.

The goal is to avoid rewriting style instructions from scratch for every image.
Instead:

1. reuse the shared base prompt
2. append the specific teaching topic
3. append required concepts, layout, and grade range

This keeps the full image library visually and pedagogically consistent.

## Shared Base Prompt

```text
K-12 classroom teaching visual designed for lesson explanation, slide decks, and board-support use. The core goal is to make a single knowledge point more intuitive and easier to understand at a glance. Prioritize subject accuracy, clear structure, strong visual communication, and direct classroom usability. Use a flat 2D educational diagram style with orderly layout, clear hierarchy, and strong emphasis on the core concept. Express knowledge mainly through shapes, arrows, spatial relationships, grouping, process flow, and contrast rather than through long written explanations. Keep the text minimal by default: only necessary titles, keywords, and essential labels. Do not write long sentences, paragraph explanations, or handout-like copy blocks. Use a white or very light clean background with enough whitespace and safe margins. The composition should fit a high-resolution 16:9 horizontal canvas suitable for projection. Labels should be clear, readable, and classroom-friendly, but text quantity should remain restrained. Visual elements should mainly be diagrams, flowcharts, structure maps, comparison charts, and concept boards. Do not use main human characters, photo style, realism, 3D, complex lighting, heavy texture noise, watermarks, logos, brand marks, or unrelated background elements. The overall visual language should stay unified, clean, rational, and teaching-oriented for long-term reuse in an educational asset library.
```

## Shared Negative Prompt

```text
realistic style, photography, 3D render, poster design, game UI, cinematic look, cyberpunk, excessive shadow, strong perspective distortion, complex background, main human character, cartoon face character, messy layout, decorative clutter, low resolution, blurry text, broken Chinese text, typos, watermark, logo, branding, signature, cropped edges, overcrowded composition, oversaturated colors, neon colors, noise, dirty background, long paragraphs, sentence-heavy explanation, textbook-page look, handout-style dense copy
```

## Design Principles

Every teaching visual should default to these rules:

1. One image should focus on one knowledge point.
2. Use visual structure first, text second.
3. Show relation, process, direction, contrast, or spatial logic before writing explanations.
4. The teacher explains the idea; the image makes it visible.
5. If an image needs too much text, it usually should be split into two images.

## Recommended Composition Pattern

For each actual image, append the following fields after the shared base prompt:

- `Topic: <knowledge point>`
- `Image type: concept map / flowchart / comparison chart / diagram`
- `Must include: <key concepts>`
- `Recommended layout: split comparison / horizontal flow / structured sections / centered map`
- `Primary palette: green / blue / orange / teal`
- `Grade range: primary / middle school / high school`
- `Text control: titles, keywords, and essential labels only; avoid long sentences`

Template:

```text
[Shared Base Prompt]
Topic: XXX
Image type: XXX
Must include: XXX, XXX, XXX
Recommended layout: XXX
Primary palette: XXX
Grade range: XXX
Text control: titles, keywords, and essential labels only; avoid long sentences
```

## Example

```text
K-12 classroom teaching visual designed for lesson explanation, slide decks, and board-support use. The core goal is to make a single knowledge point more intuitive and easier to understand at a glance. Prioritize subject accuracy, clear structure, strong visual communication, and direct classroom usability. Use a flat 2D educational diagram style with orderly layout, clear hierarchy, and strong emphasis on the core concept. Express knowledge mainly through shapes, arrows, spatial relationships, grouping, process flow, and contrast rather than through long written explanations. Keep the text minimal by default: only necessary titles, keywords, and essential labels. Do not write long sentences, paragraph explanations, or handout-like copy blocks. Use a white or very light clean background with enough whitespace and safe margins. The composition should fit a high-resolution 16:9 horizontal canvas suitable for projection. Labels should be clear, readable, and classroom-friendly, but text quantity should remain restrained. Visual elements should mainly be diagrams, flowcharts, structure maps, comparison charts, and concept boards. Do not use main human characters, photo style, realism, 3D, complex lighting, heavy texture noise, watermarks, logos, brand marks, or unrelated background elements. The overall visual language should stay unified, clean, rational, and teaching-oriented for long-term reuse in an educational asset library.
Topic: comparison of series and parallel circuits
Image type: comparison concept board
Must include: connection pattern, current paths, component interaction, what happens when one bulb fails
Recommended layout: split comparison
Primary palette: blue green
Grade range: middle school
Text control: titles, keywords, and essential labels only; avoid long sentences
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
