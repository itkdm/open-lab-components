# Category and Naming Rules

This document defines the shared rules for component directory layout, `category`, `id`, and `tags`, so the catalog stays consistent as it grows.

---

## 1. Category

### 1.1 Format

- Fixed two-part shape: `subject/domain`
- Example: `physics/apparatus`, `physics/circuit`

### 1.2 Mapping to directories

Directories should align with the category:

- `physics/apparatus` -> `components/physics/apparatus/`
- `physics/circuit` -> `components/physics/circuit/`

This keeps directory browsing and category-based search aligned.

### 1.3 Recommended starter category set

- `physics/apparatus`
- `physics/circuit`
- `chemistry/labware`
- `chemistry/substance`
- `biology/model`
- `math/geometry`
- `general/ui`

### 1.4 Localized category names

Category display names are defined in `registry/category-names.json`, for example:

```json
{
  "schema": "cmp-category-names/v1",
  "categories": {
    "physics/apparatus": {
      "name": "物理器材",
      "nameEn": "Physics Apparatus"
    }
  }
}
```

Notes:

- `name` is the Chinese label
- `nameEn` is the English label
- build scripts read this file and include localized names in generated registry outputs

When you add a new category:

1. use the new category in a component manifest
2. add localized names to `registry/category-names.json`
3. run `npm run build:registry`

---

## 2. Component ID

### 2.1 Recommended format

`<subject-abbr>.<domain>.<name>.<variant>`

Examples:

- `phy.apparatus.bulb.basic`
- `phy.weight.mass.basic`
- `phy.resistor.axial.basic`
- `phy.meter.voltage.draggable`

### 2.2 Rules

- only lowercase letters, numbers, dots, and hyphens
- must be globally unique
- must match the component root `data-cmp-id`

---

## 3. Variant

Use `variant` to represent style or interaction differences within the same teaching object:

- visual variants: `basic`, `flat`, `outline`, `realistic`
- interaction variants: `draggable`, `rotatable`, `interactive`

Do not encode size as a variant. Size should come from CSS variables such as `--cmp-size`.

---

## 4. Tags

### 4.1 Minimum recommendation

Each component should usually have at least two tags:

- one object tag such as `resistor` or `bulb`
- one domain or scenario tag such as `circuit` or `apparatus`

### 4.2 Recommended tag dimensions

- function: `meter`, `sensor`, `switch`, `connector`
- interaction: `static`, `draggable`, `rotatable`
- style: `outline`, `flat`, `realistic`
- teaching level: `primary`, `junior`, `senior`
- property: `voltage`, `mass`, `resistance`

Category determines where the component belongs. Tags determine how it is searched and filtered.

---

## 5. File Naming

File names should stay tightly aligned with the component id:

- `components/physics/circuit/phy.resistor.axial.basic.html`
- `components/physics/apparatus/phy.apparatus.bulb.basic.html`
