import fs from "node:fs";
import path from "node:path";
import { createClient as createRedisClient } from "redis";
import pg from "pg";

const { Client: PostgresClient } = pg;

function createMemoryBackend() {
  return {
    kind: "memory",
    async load() {
      return null;
    },
    async save() {},
    async close() {},
    async healthCheck() {
      return { ok: true, backend: "memory" };
    }
  };
}

function createFileBackend({ filePath }) {
  const resolvedPath = path.resolve(filePath);

  function ensureDir() {
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  }

  return {
    kind: "file",
    async load() {
      if (!fs.existsSync(resolvedPath)) return null;
      return JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
    },
    async save(payload) {
      ensureDir();
      const tempPath = `${resolvedPath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2), "utf8");
      fs.renameSync(tempPath, resolvedPath);
    },
    async close() {},
    async healthCheck() {
      ensureDir();
      fs.accessSync(path.dirname(resolvedPath), fs.constants.W_OK);
      return { ok: true, backend: "file", filePath: resolvedPath };
    },
    meta: { filePath: resolvedPath }
  };
}

function createRedisBackend({ redisUrl, key }) {
  const client = createRedisClient({ url: redisUrl });
  let connected = false;

  async function ensureConnected() {
    if (connected) return;
    await client.connect();
    connected = true;
  }

  return {
    kind: "redis",
    async load() {
      await ensureConnected();
      const raw = await client.get(key);
      return raw ? JSON.parse(raw) : null;
    },
    async save(payload) {
      await ensureConnected();
      await client.set(key, JSON.stringify(payload));
    },
    async close() {
      if (connected) {
        await client.quit();
        connected = false;
      }
    },
    async healthCheck() {
      await ensureConnected();
      await client.ping();
      return { ok: true, backend: "redis", key };
    },
    meta: { key }
  };
}

function createPostgresBackend({ postgresUrl, tableName, storeKey }) {
  const client = new PostgresClient({ connectionString: postgresUrl });
  let connected = false;
  const safeTableName = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName) ? tableName : "mcp_feedback_store";

  async function ensureConnected() {
    if (connected) return;
    await client.connect();
    await client.query(
      `CREATE TABLE IF NOT EXISTS ${safeTableName} (
        store_key TEXT PRIMARY KEY,
        payload JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`
    );
    connected = true;
  }

  return {
    kind: "postgres",
    async load() {
      await ensureConnected();
      const result = await client.query(`SELECT payload FROM ${safeTableName} WHERE store_key = $1`, [storeKey]);
      return result.rows[0] ? result.rows[0].payload : null;
    },
    async save(payload) {
      await ensureConnected();
      await client.query(
        `INSERT INTO ${safeTableName} (store_key, payload, updated_at)
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (store_key)
         DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
        [storeKey, JSON.stringify(payload)]
      );
    },
    async close() {
      if (connected) {
        await client.end();
        connected = false;
      }
    },
    async healthCheck() {
      await ensureConnected();
      await client.query("SELECT 1");
      return { ok: true, backend: "postgres", tableName: safeTableName, storeKey };
    },
    meta: { tableName: safeTableName, storeKey }
  };
}

function createFeedbackBackend(runtime = {}) {
  const backend = String(runtime.feedbackStoreBackend || "file").toLowerCase();
  if (backend === "memory") return createMemoryBackend();
  if (backend === "redis") {
    if (!runtime.redisUrl) throw new Error("REDIS_URL is required for redis feedback backend");
    return createRedisBackend({
      redisUrl: runtime.redisUrl,
      key: runtime.redisFeedbackKey || "open-lab-components:feedback-store"
    });
  }
  if (backend === "postgres") {
    if (!runtime.postgresUrl) throw new Error("POSTGRES_URL is required for postgres feedback backend");
    return createPostgresBackend({
      postgresUrl: runtime.postgresUrl,
      tableName: runtime.postgresFeedbackTable || "mcp_feedback_store",
      storeKey: runtime.postgresFeedbackStoreKey || "default"
    });
  }
  return createFileBackend({ filePath: runtime.feedbackStorePath });
}

export { createFeedbackBackend };
