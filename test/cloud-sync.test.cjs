const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("cloud sync compares snapshot content, not only timestamps", () => {
  const source = fs.readFileSync("web/app.js", "utf8");

  assert.match(source, /function buildLocalSyncFingerprint\(/);
  assert.match(source, /function buildRemoteSyncFingerprint\(/);
  assert.match(source, /contentDiffers/);
  assert.match(source, /id="pullCloudSync"/);
  assert.match(source, /formatSyncProgressSummaryFromStorage/);
  assert.match(source, /renderSyncWorkflowGuide/);
  assert.match(source, /双端刷题怎么同步/);
  assert.match(source, /function flushCloudSyncOnExit\(/);
  assert.match(source, /keepalive:\s*true/);
  assert.match(source, /function defaultSyncFieldValue\(/);
  assert.match(source, /localStorage\.removeItem\(key\)/);
  assert.match(source, /queueAutoCloudSync\("visible"/);
  assert.doesNotMatch(source, /queueAutoCloudSync\("manual", \{ immediate: true, force: true \}\)/);
});
