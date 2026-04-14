# MCP Server 部署检查清单

在把托管 MCP 端点暴露给真实客户端之前，先逐项确认：

## 配置

- `CUSTOMERS_CONFIG_PATH` 指向真实可写文件
- `config/customers.json` 已从 `config/customers.example.json` 复制出来
- 每个客户都已配置真实 `tokenHash`
- 演示用客户 id 和 label 已替换成部署环境实际值
- 已设置 `ADMIN_BEARER_TOKEN`
- 若 metrics 不应复用 admin token，已设置 `METRICS_BEARER_TOKEN`
- `ALLOWED_ORIGINS` 只包含真正需要跨域访问的浏览器来源
- 仅在可信反向代理后才启用 `TRUST_PROXY=true`

## 文件系统

- `CUSTOMERS_CONFIG_PATH` 所在目录存在且可写
- 如果使用文件型反馈后端，`FEEDBACK_STORE_PATH` 所在目录存在且可写
- 运行进程用户可以在 `config/customers.json` 旁边创建临时文件

## 运行时验证

- `npm run start:http` 启动时没有缺配置告警
- `GET /healthz` 返回 `ok`
- `GET /readyz` 返回预期客户数量
- 使用 metrics bearer token 调 `GET /metrics` 成功
- 使用 admin bearer token 调 `GET /admin/overview` 成功
- admin 响应会回显 `x-request-id`
- `node ./deploy/smoke/verify-remote.mjs` 校验通过

## 运维信号

- 日志中能看到 `admin_customer_write_succeeded`
- 强制提交一条非法写入后，日志中能看到带 `category` 的 `admin_customer_write_failed`
- `/metrics` 暴露 `adminWrites`
- `/admin/overview` 暴露 `adminWriteSummary`

## 发布产物

- `npm pack --dry-run` 包含 `config/customers.example.json`
- `npm pack --dry-run` 包含 `README.md`
- `npm pack --dry-run` 包含 `DEPLOYMENT.md`
- `npm pack --dry-run` 包含 `OPERATIONS.md`
