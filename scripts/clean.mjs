#!/usr/bin/env node

/**
 * Clean all build artifacts.
 * Usage: node scripts/clean.mjs
 */

import { rmSync, existsSync } from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");

const dirs = [
  "packages/parser/dist",
  "packages/validator/dist",
  "packages/formatter/dist",
  "packages/cli/dist",
  "packages/vscode-extension/out",
  "playground/dist",
  "website/.next",
];

for (const dir of dirs) {
  const full = path.join(root, dir);
  if (existsSync(full)) {
    rmSync(full, { recursive: true, force: true });
    console.log(`  Removed ${dir}`);
  }
}

console.log("\n  Clean complete.");
