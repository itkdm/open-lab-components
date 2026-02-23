# Open Lab Components

**210+ zero-dependency, plug-and-play STEM education interactive component library**, covering Physics, Chemistry, Biology, Math, and Science.

[![npm](https://img.shields.io/npm/v/@itkdm/open-lab-components)](https://www.npmjs.com/package/@itkdm/open-lab-components)
[![license](https://img.shields.io/github/license/itkdm/open-lab-components)](./LICENSE)

English | [中文](./README.md)

![Open Lab Components Homepage](./assets/home.png)

## ✨ Features

- 🎯 **Pure HTML Fragment** — No framework dependency, copy and use
- 🎨 **CSS Variable Driven** — All parameters configured via CSS variables
- 🔒 **Style Isolation** — No host environment pollution
- 🛠️ **TypeScript Support** — Full type definitions
- ♿ **Accessible** — Built-in ARIA labels

## 📦 Component Overview

**210 components**, **44 categories**:

| Subject | Categories | Examples |
|---------|-----------|----------|
| Physics | Circuit, Mechanics, Optics, Thermal, Wave, EM, Fluid | Projectile, Lens, Oscilloscope, Carnot Cycle |
| Chemistry | Labware, Reaction, Gas, Solution, Molecular Model | Acid-Base, Ideal Gas Law, Periodic Table |
| Biology | Cell, Organ, Genetics, Ecology | Mitosis, DNA Structure, Circulatory System |
| Math | Geometry, Function, Calculus, Statistics, Vector | Function Graph, Unit Circle, Abacus |
| Science | Earth Science, Life Science, Science Tools | Solar System, Water Cycle, Microscope |

> [Live Demo](https://itkdm.github.io/open-lab-components/) — Browse all components, tweak parameters, copy code

## 🚀 Quick Start

### npm Install

```bash
npm install @itkdm/open-lab-components
```

```js
const lab = require('@itkdm/open-lab-components');

const all = lab.list();                                    // All 210 components
const physics = lab.list({ category: 'physics/mechanics' }); // Filter by category
const html = lab.readSync('phy.mechanics.projectile.interactive'); // Read HTML
```

### Use HTML Directly

Copy a component file from `components/`, paste into your page, configure via CSS variables:

```html
<div class="cmp" data-cmp-id="phy.resistor.axial.basic"
     style="--cmp-size: 80px; --cmp-body: #caa070;">
    <!-- component content -->
</div>
```

### Local Development

```bash
git clone https://github.com/itkdm/open-lab-components.git
cd open-lab-components && npm install
npm run dev:site      # Start dev server
npm run validate      # Validate components
npm run build         # Build all
```

## 🤝 Contributing

PRs welcome! Flow: Fork → Branch → Commit → PR

See [Contributing Guide](./docs/CONTRIBUTING.md) · [Component Spec](./docs/SPEC.md) · [Category Rules](./docs/CATEGORY.md) · [Event Protocol](./docs/EVENT.md)

## 📄 License

[MIT](./LICENSE)

## ☕ Sponsor & Contact

This project is independently developed and maintained by a college junior. If it helps you, feel free to buy me a coffee :)

<table>
  <tr>
    <td align="center">
      <img src="./assets/wechat-pay.png" width="200" alt="WeChat Pay"><br>
      <b>WeChat</b>
    </td>
    <td align="center">
      <img src="./assets/alipay.png" width="200" alt="Alipay"><br>
      <b>Alipay</b>
    </td>
  </tr>
</table>

WeChat: `17884902310` (note: OLC) · GitHub: [@itkdm](https://github.com/itkdm)

## 🙏 Acknowledgments

- [@PastW1nd](https://github.com/PastW1nd)

---

Made by **布吉岛** · ⭐ Star if you find it useful
