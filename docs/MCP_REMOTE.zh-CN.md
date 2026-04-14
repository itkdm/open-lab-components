# 远程 MCP 部署

Open Lab Components 可以通过 `mcp-server/` 包部署成远程 MCP 服务，用于 VIP 客户或托管场景。

## 运行环境

- Node.js 18+
- 单台 Linux 服务器
- Nginx 反向代理
- 由 `systemd` 或 PM2 管理 Node 进程

## 远程模式

远程服务当前使用：

- MCP `Streamable HTTP`
- Bearer token 鉴权
- 基于配置文件的客户注册表
- 按客户维度的内存限流
- 结构化 JSON 日志

启动入口：

```bash
cd mcp-server
npm run start:http
```

或在仓库根目录启动：

```bash
npm run mcp:start:http
```

## 必需配置

环境变量：

- `HOST`
- `PORT`
- `CUSTOMERS_CONFIG_PATH`
- `LOG_LEVEL`
- `ALLOWED_HOSTS`
- `TRUST_PROXY`

示例：

```bash
HOST=127.0.0.1
PORT=3000
CUSTOMERS_CONFIG_PATH=/srv/open-lab-components/customers.json
LOG_LEVEL=info
ALLOWED_HOSTS=mcp.example.com
TRUST_PROXY=true
```

## 客户配置

先复制示例配置：

```bash
cp mcp-server/config/customers.example.json /srv/open-lab-components/customers.json
```

生成新的 token：

```bash
cd mcp-server
npm run token:generate
```

只把输出中的 `tokenHash` 写入配置文件。原始 token 通过你的安全渠道发给客户。

## 端点

- MCP 入口：`/mcp`
- 健康检查：`/healthz`

## Nginx 示例

```nginx
server {
    listen 443 ssl http2;
    server_name mcp.example.com;

    ssl_certificate     /etc/letsencrypt/live/mcp.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mcp.example.com/privkey.pem;

    location /mcp {
        proxy_pass http://127.0.0.1:3000/mcp;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600;
        proxy_send_timeout 3600;
    }

    location /healthz {
        proxy_pass http://127.0.0.1:3000/healthz;
        proxy_set_header Host $host;
    }
}
```

## systemd 示例

```ini
[Unit]
Description=Open Lab Components Remote MCP Server
After=network.target

[Service]
Type=simple
WorkingDirectory=/srv/open-lab-components/mcp-server
Environment=HOST=127.0.0.1
Environment=PORT=3000
Environment=CUSTOMERS_CONFIG_PATH=/srv/open-lab-components/customers.json
Environment=LOG_LEVEL=info
Environment=ALLOWED_HOSTS=mcp.example.com
Environment=TRUST_PROXY=true
ExecStart=/usr/bin/node /srv/open-lab-components/mcp-server/src/http-cli.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

## 验证

运行：

```bash
npm run mcp:test
npm run mcp:test:remote
```

然后检查：

- `GET /healthz` 返回 `200`
- 有效 Bearer token 可以连接 `/mcp`
- 无效 token 返回 `401`
- 被禁用或过期 token 返回 `403`
- 高频重复调用会触发 `429`
