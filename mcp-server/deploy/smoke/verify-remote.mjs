const baseUrl = process.env.MCP_BASE_URL || "http://127.0.0.1:3000";
const adminToken = process.env.MCP_ADMIN_BEARER_TOKEN;
const metricsToken = process.env.MCP_METRICS_BEARER_TOKEN || adminToken;

async function getJson(path, token, requestId) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (requestId) {
    headers["x-request-id"] = requestId;
  }

  const response = await fetch(new URL(path, baseUrl), { headers });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { response, body };
}

async function main() {
  const health = await getJson("/healthz");
  if (!health.response.ok || health.body?.status !== "ok") {
    throw new Error(`health check failed: ${health.response.status}`);
  }

  if (!adminToken) {
    console.log("healthz ok");
    console.log("Set MCP_ADMIN_BEARER_TOKEN to verify /admin/overview and /readyz.");
    return;
  }

  const ready = await getJson("/readyz", adminToken, "smoke-readyz");
  if (!ready.response.ok) {
    throw new Error(`readyz failed: ${ready.response.status}`);
  }

  const overview = await getJson("/admin/overview", adminToken, "smoke-admin-overview");
  if (!overview.response.ok) {
    throw new Error(`admin overview failed: ${overview.response.status}`);
  }
  if (overview.response.headers.get("x-request-id") !== "smoke-admin-overview") {
    throw new Error("admin overview did not echo x-request-id");
  }

  if (!metricsToken) {
    console.log("healthz ok");
    console.log("readyz ok");
    console.log("admin overview ok");
    console.log("Set MCP_METRICS_BEARER_TOKEN to verify /metrics when it differs from admin.");
    return;
  }

  const metrics = await getJson("/metrics", metricsToken);
  if (!metrics.response.ok) {
    throw new Error(`metrics failed: ${metrics.response.status}`);
  }

  console.log("healthz ok");
  console.log("readyz ok");
  console.log("admin overview ok");
  console.log("metrics ok");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
