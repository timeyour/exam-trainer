const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("exam app no longer loads or exposes industrial equipment content", () => {
  const index = fs.readFileSync("web/index.html", "utf8");
  const app = fs.readFileSync("web/app.js", "utf8");
  const styles = fs.readFileSync("web/styles.css", "utf8");
  const worker = fs.readFileSync("web/sw.js", "utf8");
  assert.doesNotMatch(index, /equipment-data\.js/);
  assert.doesNotMatch(app, /设备资料卡|renderEquipmentDetail|EQUIPMENT_ROUTE_PREFIX|EQUIPMENT_PARAMETERS/);
  assert.doesNotMatch(styles, /\.equipment-/);
  assert.doesNotMatch(worker, /equipment-data\.js/);
  assert.equal(fs.existsSync("web/equipment-data.js"), false);
});

test("app shell wires exam cram plan into today flow", () => {
  const appSource = fs.readFileSync("web/app.js", "utf8");
  const indexSource = fs.readFileSync("web/index.html", "utf8");
  const workerSource = fs.readFileSync("web/sw.js", "utf8");
  assert.match(appSource, /function getCramFlowForToday/);
  assert.match(appSource, /function startDemoTopStudy/);
  assert.match(indexSource, /exam-cram-plan\.js/);
  assert.match(workerSource, /"exam-cram-plan\.js"/);
});

test("public demo has no personal identifiers", () => {
  const app = fs.readFileSync("web/app.js", "utf8");
  assert.doesNotMatch(app, /liuxin|2428630442|20252310820099|中原路42号|装调工/);
  assert.doesNotMatch(app, /人工智能导论|模式识别与机器学习/);
});
