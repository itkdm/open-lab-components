# 变更日志

## 0.2.0 - 2026-03

### 新增

- 新增支持 locale-aware 元数据的 `cmp-manifest/v2`
- 新增原始视图与本地化视图的 registry 输出
- 公共 JS API 新增 `locale` 支持
- 所有公开 MCP tools 新增 `locale` 支持
- 站点新增 locale-aware 加载与切换
- 新增一组 i18n 与元数据升级发布说明

### 变更

- 整个组件目录迁移到 `v2` manifest 形态
- 针对高频物理、化学、生物、数学组件补齐并优化英文元数据
- 更新 package metadata，使其更准确表达“协议 + runtime”定位

### 兼容性

- `cmp-manifest/v1` 在迁移窗口内仍然可读
- 默认 locale 仍为 `zh-CN`
- 宿主侧应优先使用本地化 registry 视图，缺失字段再按字段回退到 `zh-CN`

### 验证

- `npm run release:ready`
- `npm run release:check`
- `npm run release:pack`
- `npm run validate`
- `npm run build:registry`
- `npm run mcp:test`
- `npm run build:site`
