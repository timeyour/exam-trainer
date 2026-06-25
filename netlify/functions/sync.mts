import { createHash } from "node:crypto";
import { getDeployStore, getStore } from "@netlify/blobs";

const MAX_BODY_BYTES = 1_000_000;
const STORE_NAME = "exam-sync";

export default async (req) => {
  try {
    if (req.method === "GET") {
      return await handleGet(req);
    }
    if (req.method === "PUT" || req.method === "POST") {
      return await handlePut(req);
    }
    return json(405, { error: "Method not allowed" });
  } catch (error) {
    return json(error.statusCode || 500, { error: error.message || "Sync failed" });
  }
};

async function handleGet(req) {
  const url = new URL(req.url);
  const syncKey = normalizeSyncKey(url.searchParams.get("key"));
  const store = getSyncStore();
  const record = await store.get(hashSyncKey(syncKey), { type: "json" });
  if (!record) {
    return json(200, { exists: false });
  }
  return json(200, {
    exists: true,
    updatedAt: record.updatedAt,
    snapshot: record.snapshot
  });
}

async function handlePut(req) {
  const text = await req.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    throw httpError(413, "同步数据太大，请先清理旧记录后再上传。");
  }
  const body = parseJsonBody(text);
  const syncKey = normalizeSyncKey(body.key);
  const snapshot = validateSnapshot(body.snapshot);
  const updatedAt = new Date().toISOString();
  const store = getSyncStore();
  await store.setJSON(hashSyncKey(syncKey), {
    version: 1,
    updatedAt,
    snapshot
  });
  return json(200, { ok: true, updatedAt });
}

function parseJsonBody(body) {
  try {
    return JSON.parse(body || "{}");
  } catch {
    throw httpError(400, "请求格式不是 JSON。");
  }
}

function normalizeSyncKey(value) {
  const key = String(value || "").trim();
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(key)) {
    throw httpError(400, "同步码需要 6-64 位，只能用英文、数字、短横线或下划线。");
  }
  return key;
}

function validateSnapshot(snapshot) {
  if (!snapshot || snapshot.app !== "exam-trainer" || typeof snapshot.storage !== "object") {
    throw httpError(400, "同步数据格式不对。");
  }
  return snapshot;
}

function hashSyncKey(syncKey) {
  return createHash("sha256").update(syncKey).digest("hex");
}

function getSyncStore() {
  if (globalThis.Netlify?.context?.deploy?.context === "production") {
    return getStore(STORE_NAME, { consistency: "strong" });
  }
  return getDeployStore(STORE_NAME);
}

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
