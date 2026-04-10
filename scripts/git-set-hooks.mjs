#!/usr/bin/env node
/**
 * Sets `git config core.hooksPath .githooks` when `.git` exists (repo checkout).
 * Used by `npm run prepare` / `npm run git:hooks`.
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
if (!existsSync(path.join(root, ".git"))) {
  process.exit(0);
}
try {
  execSync("git config core.hooksPath .githooks", { cwd: root, stdio: "inherit" });
  if (process.env.npm_lifecycle_event !== "prepare") {
    console.log("git: core.hooksPath = .githooks (pre-push runs npm run verify)");
  }
} catch {
  process.exit(0);
}
