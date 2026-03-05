#!/usr/bin/env node

/**
 * Build all packages in the correct order.
 * Usage: node scripts/build.mjs
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import path from "path";

const packages = [
  "packages/parser",
  "packages/validator",
  "packages/formatter",
  "packages/cli",
];

const root = path.resolve(import.meta.dirname, "..");

for (const pkg of packages) {
  const dir = path.join(root, pkg);
  if (!existsSync(path.join(dir, "tsconfig.json"))) {
    console.log(`  Skipping ${pkg} (no tsconfig.json)`);
    continue;
  }
  console.log(`\n  Building ${pkg}...`);
  execSync("npx tsc --build", { cwd: dir, stdio: "inherit" });
}

console.log("\n  All packages built successfully.");
