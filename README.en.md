# Open Lab Components

A **HTML fragment component library** for "host systems/editors/canvas": components are responsible only for "what the apparatus looks like + which parameters are configurable + how parameters map to visuals", not for page layout/backgrounds/descriptions.

English | [中文](./README.md)

## ✨ Core Features

- 🎯 **Pure HTML Fragment**: Each component is an independent HTML fragment with no external framework dependencies
- 🎨 **CSS Variable Driven**: All configurable parameters are exposed via CSS variables for flexibility
- 🚫 **Zero External Dependencies**: Components are completely self-contained with no external resource references
- 🔒 **Style Isolation**: CSS scoping is fully isolated to prevent polluting the host environment
- 📦 **Plug and Play**: Can be copy-pasted directly into any HTML environment
- 🛠️ **Type Safe**: Parameter types and defaults declared through Manifest
- ♿ **Accessibility Support**: Built-in ARIA labels for screen reader support

## 📦 Component List

Currently includes **6 physics experiment components**, covering the following categories:

### Physics Apparatus
- 💡 **Light Bulb** (`phy.apparatus.bulb.basic`) - Basic light bulb component
- 📏 **Ruler** (`phy.ruler.vertical.metric`) - Vertical metric ruler
- ⚖️ **Weight (Basic)** (`phy.weight.mass.basic`) - Basic weight component
- ⚖️ **Weight (Realistic)** (`phy.weight.hook.realistic`) - Realistic weight with hook

### Circuit Components
- 🔌 **Resistor** (`phy.resistor.axial.basic`) - Axial resistor with customizable color bands
- 🔋 **Voltmeter** (`phy.meter.voltage.draggable`) - Draggable voltmeter component

> Visit the [Component Showcase](./site/index.html) or run `npm run dev:site` to see more component details

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/itkdm/open-lab-components.git
cd open-lab-components

# Install dependencies
npm install
```

### Using Components

#### Method 1: Direct Copy HTML Fragment

1. Find the component file you need in the `components/` directory
2. Copy the entire file content
3. Paste it into your HTML page
4. Configure parameters via CSS variables or `data-props` attribute

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            padding: 40px;
            background: #f5f5f5;
        }
    </style>
</head>
<body>
    <!-- Paste component HTML directly -->
    <div class="cmp" data-cmp-id="phy.resistor.axial.basic" 
         style="--cmp-size: 80px; --cmp-body: #caa070;">
        <!-- ... component content ... -->
    </div>
</body>
</html>
```

#### Method 2: Using data-props Attribute

```html
<div class="cmp" 
     data-cmp-id="phy.resistor.axial.basic"
     data-props='{"size": 100, "body": "#caa070", "stroke": "#111827"}'>
    <!-- Component will automatically parse data-props and apply configuration -->
</div>
```

#### Method 3: Dynamic Loading (JavaScript)

```javascript
async function loadComponent(componentId) {
    const response = await fetch(`components/physics/circuit/${componentId}.html`);
    const html = await response.text();
    return html;
}

// Usage example
const resistorHtml = await loadComponent('phy.resistor.axial.basic');
document.getElementById('container').innerHTML = resistorHtml;
```

### Local Development

```bash
# Validate all components
npm run validate

# Build registry and showcase site
npm run build

# Start local development server (component showcase)
npm run dev:site
```

Visit `http://localhost:3000` to access the component showcase, where you can:
- Browse all components
- Preview and adjust parameters in real-time
- Copy component code
- View component documentation

### Deploy to GitHub Pages

The project is configured with GitHub Actions to automatically deploy to GitHub Pages. Setup steps:

1. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Select "GitHub Actions" as the Source
   - Save settings

2. **Automatic Deployment**
   - Every push to `main` or `master` branch will automatically build and deploy the site
   - After deployment, the site will be accessible at `https://itkdm.github.io/open-lab-components`

3. **Check Deployment Status**
   - View deployment progress in the repository's Actions tab
   - After successful deployment, you can see the site URL in repository settings

## 📁 Project Structure

```
open-lab-components/
├── components/          # Component source files (1 file = 1 component)
│   └── physics/
│       ├── apparatus/   # Physics apparatus components
│       └── circuit/     # Circuit component components
├── registry/           # Machine-readable index (auto-generated)
│   ├── registry.json   # Component registry
│   ├── categories.json # Category information
│   └── tags.json       # Tag statistics
├── site/               # Showcase site (component gallery)
│   ├── index.html      # Homepage
│   ├── components.html # Component list page
│   ├── playground.html # Component debugging tool
│   └── docs.html       # Documentation page
├── tools/              # Build and validation tools
│   ├── validate/       # Component validation script
│   ├── build-registry/ # Registry builder
│   ├── build-site/     # Showcase site builder
│   └── dev-site/       # Development server
├── docs/               # Documentation and specifications
│   ├── SPEC.md         # Component specification protocol
│   ├── CATEGORY.md     # Category and naming rules
│   └── CONTRIBUTING.md # Contributing guide
└── .github/
    └── workflows/
        └── ci.yml      # CI/CD configuration
```

## 🔧 Component Specification

Each component must follow these specifications (see [SPEC.md](./docs/SPEC.md) for details):

### 1. File Format
- ✅ Must be HTML fragment (no `<!doctype>`, `<html>`, `<head>`, `<body>`)
- ✅ Contains only one root node with `class="cmp"` and `data-cmp-id`
- ✅ Must include `role="img"` and `aria-label` attributes

### 2. Manifest Metadata
Component file must include `@cmp-manifest` comment block at the top:

```html
<!-- @cmp-manifest
{
  "schema": "cmp-manifest/v1",
  "id": "phy.resistor.axial.basic",
  "name": "电阻",
  "nameEn": "Resistor",
  "category": "physics/circuit",
  "version": "1.0.0",
  "viewport": { "w": 108, "h": 40 },
  "props": [...],
  "cssVars": {...},
  "tags": ["resistor", "circuit"]
}
-->
```

### 3. Style Requirements
- ✅ Styles must be inline (`<style>` tag)
- ✅ CSS selectors must be scope-isolated (prefixed with `.cmp[data-cmp-id="..."]`)
- ❌ No global selectors (`html`, `body`, `:root`, `*`)
- ❌ No external resource references (no `http://`, `https://`, `@import`)

### 4. JavaScript (Optional)
- ✅ Must use IIFE for self-containment
- ✅ No variables exposed to global scope
- ✅ Only manipulate component's own DOM

## 🛠️ Development Guide

### Adding a New Component

1. **Choose Category and Location**
   - Check [CATEGORY.md](./docs/CATEGORY.md) for category rules
   - Create corresponding directory structure under `components/`

2. **Create Component File**
   - Copy an existing component as a template
   - Fill in Manifest metadata
   - Implement component HTML/CSS/JS

3. **Local Validation**
   ```bash
   npm run validate
   ```

4. **Submit PR**
   - See [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for detailed process
   - Ensure CI validation passes

### Available Scripts

```bash
# Validate all components against specifications
npm run validate

# Build component registry
npm run build:registry

# Build showcase site
npm run build:site

# Build everything
npm run build

# Start development server (showcase site)
npm run dev:site
```

## 🤝 Contributing

We welcome all forms of contributions!

### Contribution Types
- 🆕 Add new components
- 🐛 Fix bugs
- 📝 Improve documentation
- 🎨 UI/UX improvements
- ⚡ Performance optimizations

### Contribution Process

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-component`)
3. Commit your changes (`git commit -m 'Add amazing component'`)
4. Push to the branch (`git push origin feature/amazing-component`)
5. Open a Pull Request

### Pre-submission Checklist

- [ ] Component is HTML fragment (no doctype/html/head/body)
- [ ] File contains only one root node (component root container)
- [ ] Root node includes: `class="cmp"`, `data-cmp-id`, `role="img"`, `aria-label`
- [ ] `@cmp-manifest` exists at file top and JSON is parseable
- [ ] Manifest.id matches data-cmp-id exactly and id is globally unique
- [ ] No external resources (no http/https/@import)
- [ ] CSS is scope-isolated (no html/body/:root/* global pollution)
- [ ] Key configurable items exposed via CSS variables with fallbacks
- [ ] If JS included: IIFE self-contained, no global pollution, no network requests, only manipulates own DOM
- [ ] Run `npm run validate` passes

For detailed specifications, see:
- [Component Specification](./docs/SPEC.md)
- [Category Rules](./docs/CATEGORY.md)
- [Contributing Guide](./docs/CONTRIBUTING.md)

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

## 🔗 Related Links

- [Component Showcase](./site/index.html) - Browse and test components online
- [Component Specification](./docs/SPEC.md) - Detailed component development specifications
- [Category Rules](./docs/CATEGORY.md) - Component category and naming rules
- [Contributing Guide](./docs/CONTRIBUTING.md) - How to contribute

## 📝 Changelog

### v0.1.0 (2025-01-08)
- ✨ Initial release
- 🎯 Support for 6 physics experiment components
- 📦 Complete build and validation toolchain
- 📚 Component showcase and documentation system

## 🙏 Acknowledgments

Thanks to all developers who contributed to this project!

---

⭐ If this project helps you, please give us a Star!

