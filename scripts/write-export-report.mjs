import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function readJsonSafe(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readTextSafe(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function writeText(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, "utf8");
}

function replaceAll(template, map) {
  let out = template;
  for (const [key, value] of Object.entries(map)) {
    out = out.replace(new RegExp(`{{${key}}}`, "g"), value ?? "");
  }
  return out;
}

function main() {
  const templatePath = path.join(root, "src", "debug", "templates", "EXPORT_DIAGNOSTIC_REPORT.template.md");
  const diagJsonPath = path.join(root, "docs", "export_diag_last.json");
  const outPath = path.join(root, "docs", "EXPORT_DIAGNOSTIC_REPORT.md");
  const pkgPath = path.join(root, "package.json");

  const template = readTextSafe(templatePath);
  if (!template) {
    console.error("Template not found at", templatePath);
    process.exit(1);
  }

  const diag = readJsonSafe(diagJsonPath) || {};
  const pkg = readJsonSafe(pkgPath) || {};

  const device = diag.device || {};
  const items = Array.isArray(diag.items) ? diag.items : [];

  const getStatusLabel = (id, defaultLabel = "UNKNOWN") => {
    const found = items.find((it) => it.id === id);
    return found?.status ?? defaultLabel;
  };

  const map = {
    OS: String(device.os ?? ""),
    OS_VERSION: String(device.osVersion ?? ""),
    APP_VERSION: String(device.appVersion ?? pkg.version ?? ""),
    SDK_VERSION: String(device.expoConfig?.sdkVersion ?? ""),
    RUN_AT: String(diag.runAt ?? ""),
    PERM_ADDONLY_STATUS: getStatusLabel("perm-addonly"),
    PERM_INITIAL_STATUS: getStatusLabel("perm-initial"),
    ALBUM_READ_STATUS: getStatusLabel("album-read"),
    DUMMY_ASSET_STATUS: getStatusLabel("dummy-asset"),
    FILE_URI_STATUS: "SEE EXPORT LOGS",
    ERRORS_STATUS: items.some((it) => it.status === "FAIL") ? "FAIL" : "PASS",
    LATEST_RESULTS_JSON: JSON.stringify(diag, null, 2),
    RECOMMENDATION: String(diag.recommendation ?? ""),
    PERM_INITIAL_JSON: JSON.stringify(diag.permissionInitial ?? {}, null, 2),
    PERM_ADDONLY_JSON: JSON.stringify(diag.permissionAddOnly ?? {}, null, 2),
    ALBUM_READ_JSON: JSON.stringify(diag.albumReadCalls ?? {}, null, 2),
    DUMMY_WRITE_JSON: JSON.stringify(diag.dummyWrite ?? {}, null, 2),
    ALBUM_GET_CALLED: String(
      (diag.albumReadCalls && diag.albumReadCalls.getAlbumAsyncCalled) ? "YES" : "NO"
    ),
    ALBUM_ADD_CALLED: String(
      (diag.albumReadCalls && diag.albumReadCalls.addAssetsToAlbumAsyncCalled) ? "YES" : "NO"
    ),
  };

  const rendered = replaceAll(template, map);
  writeText(outPath, rendered);

  console.log("Wrote", outPath);
}

main();


