# Open Lab Components MCP Server

English | [中文](./README.zh-CN.md)

Locale-aware MCP server for discovering, recommending, and retrieving components from the Open Lab Components catalog.

## What This Package Exposes

### Transports

- local `stdio`
- remote `Streamable HTTP`

### Tools

- `get_categories`
- `list_components`
- `search_components`
- `recommend_components`
- `submit_recommendation_feedback`
- `get_recommendation_feedback_stats`
- `build_experiment_page`
- `compose_experiment_bundle`
- `get_component`

### Prompts

- `component-recommendation-brief`
- `component-page-builder`
- `experiment-page-executor`
- `experiment-bundle-integrator`

### Resources

- `openlab://catalog/overview`
- `openlab://catalog/categories`
- `openlab://catalog/featured`
- `openlab://component/phy.resistor.axial.basic`

This package remains read-only with respect to component source files. It does not create, edit, or validate component HTML through MCP.

## Documentation

- [中文 README](./README.zh-CN.md)
- [Deployment Guide](./DEPLOYMENT.en.md)
- [Deployment Checklist](./DEPLOYMENT-CHECKLIST.en.md)
- [Operations Guide](./OPERATIONS.en.md)
