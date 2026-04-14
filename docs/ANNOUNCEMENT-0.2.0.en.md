# Open Lab Components 0.2.0 发布公告

## 标题

`Open Lab Components 0.2.0：多语言元数据、cmp-manifest/v2 与 MCP locale 支持`

## 一句话介绍

Open Lab Components 已从“默认单语言的 STEM 组件库”升级为“面向宿主系统与 AI 的 locale-aware STEM 交互对象基础设施”。

## 本次发布的核心变化

- 新增 `cmp-manifest/v2`
- 新增多语言元数据结构：`zh-CN` / `en`
- 新增原始 registry 与本地化 registry 输出
- JS API 支持 `locale`
- MCP 全部公开工具支持 `locale`
- 站点改为按 locale 加载 registry
- 全量组件迁移到新的 manifest 结构
- 完成高频学科英文元数据精修

## 为什么这次发布重要

这次更新不是简单补了一层国际化，而是把组件的显示元数据、检索元数据、宿主消费接口、AI 调用接口统一到了同一套协议里。

这意味着：

- 宿主系统可以稳定按语言消费组件目录
- AI 客户端可以按 locale 搜索和获取组件
- 后续做场景系统、实验组合、作者工具时，不需要再返工元数据层
- Open Lab Components 的定位可以从“组件库”提升到“STEM 交互对象协议与运行时基础设施”

## 适合谁关注

- 教育产品前端
- 低代码实验编辑器
- LMS / 教学平台嵌入方
- AI 助教 / agent 工具调用方
- 基于组件目录构建检索与生成能力的宿主系统

## 集成侧建议

- 优先读取 `registry/registry.<locale>.json`
- 宿主侧 `list/get` 显式传入 `locale`
- MCP 客户端显式传入 `locale`
- 把 `registry/registry.json` 作为原始多语言源数据使用
- 按字段级回退到 `zh-CN`

## 验证结果

本次发布前已通过：

- `npm run release:ready`
- `npm run validate`
- `npm run build:registry`
- `npm run mcp:test`
- `npm run build:site`

## 下一步方向

- multilingual experiment demo
- scene composition metadata
- scene/runtime API
- 更明确的宿主接入文档和生态出口
