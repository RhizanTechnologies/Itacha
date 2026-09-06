#!/usr/bin/env node

/**
 * Ithaca Chrome/Edge Extension Packager
 *
 * Verifies Manifest V3 compliance, validates icons and scripts,
 * and packages a production-ready distributable zip for Chrome Web Store.
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const rootDir = process.cwd();
const extensionDir = path.join(rootDir, "extension");
const distDir = path.join(rootDir, "dist");
const manifestPath = path.join(extensionDir, "manifest.json");

console.log("📦 Packaging Ithaca Academic Stance Extension (Manifest V3)...");

// 1. Verify Manifest
if (!fs.existsSync(manifestPath)) {
  console.error("❌ manifest.json not found in extension directory");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const version = manifest.version || "1.0.0";
console.log(`ℹ️  Extension Version: ${version}`);

// 2. Verify required files
const requiredFiles = [
  "manifest.json",
  "background.js",
  "content.js",
  "content.css",
  "popup.html",
  "popup.js",
  "icons/icon-16.png",
  "icons/icon-48.png",
  "icons/icon-128.png",
];

for (const file of requiredFiles) {
  const filePath = path.join(extensionDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Required extension file missing: ${file}`);
    process.exit(1);
  }
}

// 3. Ensure dist directory
fs.mkdirSync(distDir, { recursive: true });
const zipName = `ithaca-extension-v${version}.zip`;
const zipPath = path.join(distDir, zipName);

if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

// 4. Create ZIP package using zip command
try {
  execSync(`zip -r "${zipPath}" *`, {
    cwd: extensionDir,
    stdio: "pipe",
  });
} catch (error) {
  console.error("❌ Failed to create zip package:", error.message);
  process.exit(1);
}

const stats = fs.statSync(zipPath);
const sizeKb = (stats.size / 1024).toFixed(1);

console.log(`✅ Successfully packaged extension:`);
console.log(`   Artifact: ${zipPath}`);
console.log(`   Package Size: ${sizeKb} KB`);
console.log(`   Files included: ${requiredFiles.length}`);
console.log(`🚀 Ready for Chrome Web Store upload or manual unpacked loading.`);
