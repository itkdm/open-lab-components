# Deployment Guide

## GitHub Pages Deployment

This repository is configured to deploy the public site to GitHub Pages through GitHub Actions. When changes are pushed to the main branch, the site can be rebuilt and published automatically.

### Setup Steps

1. Enable GitHub Pages
   - open the repository settings
   - go to `Pages`
   - set the source to `GitHub Actions`

2. First deployment
   - push to `main` or `master`
   - GitHub Actions will run the CI/CD pipeline
   - inspect the `Actions` tab for progress

3. Visit the site
   - after a successful deployment, the site should be available at:

```text
https://itkdm.github.io/open-lab-components
```

### Deployment Pipeline

The CI/CD workflow includes:

1. validation
   - validate the component catalog
   - run tests on supported Node.js versions

2. deployment
   - only on `main` or `master`
   - build the registry
   - build the site
   - publish to GitHub Pages

### Troubleshooting

If deployment fails, check:

1. GitHub Actions logs
2. Pages source settings
3. branch names referenced by `.github/workflows/ci.yml`

### Local preview of the build output

Before deployment, you can inspect the generated site locally:

```bash
npm run build
```

The final site output is written to `site/dist/`.
