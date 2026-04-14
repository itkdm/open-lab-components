# MCP Server 运维说明

本文档说明托管 MCP server 暴露出的运维信号，以及在排查 admin 与远程 MCP 流量问题时应如何使用这些信号。

## Admin 请求追踪

所有 `/admin/*` 路由都会带上 `x-request-id` 响应头。

- 如果客户端传了 `x-request-id`，服务端会原样回显
- 如果客户端没传，服务端会自动生成 UUID
- 同一个 request id 会写入 admin 审计日志

## Admin 错误响应结构

```json
{
  "error": "invalid_customer",
  "category": "validation",
  "message": "customerId is required"
}
```

当前分类包括：

- `validation`
- `conflict`
- `not_found`
- `infrastructure`
- `unknown`

## Admin 审计日志

admin 写操作会产出：

- `admin_customer_write_succeeded`
- `admin_customer_write_failed`

## Metrics 字段

`/metrics` 和 `/admin/overview` 会暴露：

- `adminWrites`
- `adminWriteSummary`
- `remoteMcpErrors`
- `remoteMcpErrorSummary`
- `remoteMcpErrorCodes`

## 推荐排查步骤

当 admin 操作失败时：

1. 先拿到 `x-request-id`
2. 按 `requestId` 检索日志
3. 查看错误 `category`
4. 对照 `adminWrites` 与 `adminWriteSummary`

当远程 MCP 错误上升时：

- 先看 `auth`、`session`、`policy`、`runtime` 哪个桶在上涨
- 如果需要精确拒绝原因，再看 `remoteMcpErrorCodes`
