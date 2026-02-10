#!/usr/bin/env node

/**
 * MCPB/DXT Packaging Script
 *
 * Builds and packages the MCP server into distributable .mcpb and .dxt bundles.
 *
 * Strategy (maximum compatibility):
 * - manifest_version: "0.3" (= latest, current standard)
 * - dxt_version: "0.3" (backward compat for old hosts still using DXT naming)
 * - Only v0.1 core fields + v0.2 privacy_policies
 * - Output both .mcpb and .dxt (same ZIP, different extension)
 *
 * Bundle structure:
 *   manifest.json          - MCPB manifest
 *   dist/                  - Compiled server code + UI HTML
 *   node_modules/          - Production dependencies (flat)
 *   package.json           - For Node.js module resolution
 *   icon.png               - Optional icon
 *
 * Usage:
 *   node scripts/pack-mcpb.mjs [--skip-build] [--output <dir>]
 */

import { execSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  copyFileSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { join, resolve, relative } from "node:path";
import { createHash } from "node:crypto";

// ========== Configuration ==========

const ROOT_DIR = resolve(import.meta.dirname, "..");
const PKG_DIR = join(ROOT_DIR, "packages/baixiaoying-mcp-server");
const STAGING_DIR = join(ROOT_DIR, ".mcpb-staging");
const DEFAULT_OUTPUT_DIR = join(ROOT_DIR, "dist-mcpb");

// ========== Parse CLI args ==========

const args = process.argv.slice(2);
const skipBuild = args.includes("--skip-build");
const outputDir = getArgValue("--output") || DEFAULT_OUTPUT_DIR;

function getArgValue(name) {
  const idx = args.indexOf(name);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  const eqArg = args.find((a) => a.startsWith(`${name}=`));
  if (eqArg) return eqArg.slice(name.length + 1);
  return null;
}

// ========== Helper functions ==========

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function run(cmd, opts = {}) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: ROOT_DIR, ...opts });
}

function getAllFiles(dir, base) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllFiles(fullPath, base));
    } else {
      results.push(relative(base, fullPath));
    }
  }
  return results;
}

// ========== Main ==========

async function main() {
  console.log("\n========================================");
  console.log("  MCPB/DXT Packaging Script");
  console.log("========================================\n");

  // Read and validate manifest
  const manifestPath = join(PKG_DIR, "manifest.json");
  if (!existsSync(manifestPath)) {
    console.error("ERROR: manifest.json not found at", manifestPath);
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const pkgJson = JSON.parse(
    readFileSync(join(PKG_DIR, "package.json"), "utf-8"),
  );

  // Sync version from package.json to manifest
  if (manifest.version !== pkgJson.version) {
    console.log(
      `Version sync: manifest ${manifest.version} -> package.json ${pkgJson.version}`,
    );
    manifest.version = pkgJson.version;
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  }

  const bundleName = `${manifest.name}-${manifest.version}`;
  console.log(`Package: ${manifest.name}@${manifest.version}`);
  console.log(`Display: ${manifest.display_name || manifest.name}`);
  console.log(`Server:  ${manifest.server.type} (${manifest.server.entry_point})`);
  console.log();

  // Step 1: Build
  if (skipBuild) {
    console.log("Step 1: Build SKIPPED (--skip-build)\n");
  } else {
    console.log("Step 1: Building project...");
    run("pnpm --filter @baichuan-ai/baixiaoying-mcp-server run build");
    console.log();
  }

  // Verify dist exists
  const distDir = join(PKG_DIR, "dist");
  if (!existsSync(distDir)) {
    console.error("ERROR: dist/ not found. Build may have failed.");
    process.exit(1);
  }

  // Step 2: Clean & create staging directory
  console.log("Step 2: Preparing staging directory...");
  if (existsSync(STAGING_DIR)) {
    rmSync(STAGING_DIR, { recursive: true });
  }
  mkdirSync(STAGING_DIR, { recursive: true });

  // Step 3: Copy files to staging
  console.log("\nStep 3: Copying bundle files...");

  // 3a. Copy manifest.json
  copyFileSync(manifestPath, join(STAGING_DIR, "manifest.json"));
  console.log("  + manifest.json");

  // 3b. Copy compiled dist/
  cpSync(distDir, join(STAGING_DIR, "dist"), { recursive: true });
  console.log("  + dist/");

  // 3c. Copy icon if exists
  const iconPath = join(PKG_DIR, "icon.png");
  if (existsSync(iconPath)) {
    copyFileSync(iconPath, join(STAGING_DIR, "icon.png"));
    console.log("  + icon.png");
  }

  // 3d. Create minimal package.json for Node.js module resolution
  const bundlePkgJson = {
    name: pkgJson.name,
    version: pkgJson.version,
    type: "module",
    main: "./dist/index.js",
    dependencies: pkgJson.dependencies,
  };
  writeFileSync(
    join(STAGING_DIR, "package.json"),
    JSON.stringify(bundlePkgJson, null, 2) + "\n",
  );
  console.log("  + package.json (minimal, production deps only)");

  // Step 4: Install production dependencies
  console.log("\nStep 4: Installing production dependencies...");
  execSync("npm install --omit=dev --ignore-scripts --no-audit --no-fund", {
    cwd: STAGING_DIR,
    stdio: "inherit",
  });

  // Remove unnecessary files from node_modules
  const nmDir = join(STAGING_DIR, "node_modules");
  if (existsSync(nmDir)) {
    // Remove .bin symlinks (not needed in bundle)
    const binDir = join(nmDir, ".bin");
    if (existsSync(binDir)) rmSync(binDir, { recursive: true });

    // Remove .cache
    const cacheDir = join(nmDir, ".cache");
    if (existsSync(cacheDir)) rmSync(cacheDir, { recursive: true });

    // Remove package-lock.json created by npm install
    const lockFile = join(STAGING_DIR, "package-lock.json");
    if (existsSync(lockFile)) rmSync(lockFile);
  }

  // Step 5: Create output directory and ZIP
  console.log("\nStep 5: Creating bundles...");
  mkdirSync(resolve(outputDir), { recursive: true });

  const mcpbPath = join(resolve(outputDir), `${bundleName}.mcpb`);
  const dxtPath = join(resolve(outputDir), `${bundleName}.dxt`);

  // Remove old bundles
  if (existsSync(mcpbPath)) rmSync(mcpbPath);
  if (existsSync(dxtPath)) rmSync(dxtPath);

  // Create ZIP using system zip command
  try {
    execSync(`zip -r -9 -q "${mcpbPath}" .`, {
      cwd: STAGING_DIR,
      stdio: "pipe",
    });
  } catch {
    // Fallback: try using tar + gzip if zip is not available
    console.log("  'zip' not found, trying alternative...");
    try {
      execSync(
        `tar -cf - -C "${STAGING_DIR}" . | gzip -9 > "${mcpbPath}"`,
        { stdio: "pipe" },
      );
      console.log(
        "  WARNING: Used tar+gzip fallback. Bundle may not be a standard ZIP.",
      );
    } catch (e) {
      console.error(
        "ERROR: No zip or tar command available. Please install 'zip'.",
      );
      process.exit(1);
    }
  }

  // Copy .mcpb as .dxt (same content, different extension for legacy hosts)
  copyFileSync(mcpbPath, dxtPath);

  // Step 6: Print summary
  const mcpbStat = statSync(mcpbPath);
  const shasum = createHash("sha1")
    .update(readFileSync(mcpbPath))
    .digest("hex");

  // Count files in staging
  const allFiles = getAllFiles(STAGING_DIR, STAGING_DIR);
  let totalUnpackedSize = 0;
  for (const f of allFiles) {
    totalUnpackedSize += statSync(join(STAGING_DIR, f)).size;
  }

  console.log("\n========================================");
  console.log("  Bundle Summary");
  console.log("========================================");
  console.log(`  Name:           ${manifest.name}`);
  console.log(`  Version:        ${manifest.version}`);
  console.log(`  Manifest:       v${manifest.manifest_version}`);
  console.log(`  Server type:    ${manifest.server.type}`);
  console.log(`  Entry point:    ${manifest.server.entry_point}`);
  console.log(`  Tools:          ${manifest.tools?.length || 0}`);
  console.log(`  Total files:    ${allFiles.length}`);
  console.log(`  Unpacked size:  ${formatSize(totalUnpackedSize)}`);
  console.log(`  Bundle size:    ${formatSize(mcpbStat.size)}`);
  console.log(`  SHA1:           ${shasum}`);
  console.log();
  console.log("  Output files:");
  console.log(`    ${mcpbPath}`);
  console.log(`    ${dxtPath}`);
  console.log("========================================\n");

  // Step 7: Cleanup staging
  console.log("Cleaning up staging directory...");
  rmSync(STAGING_DIR, { recursive: true });

  console.log("\nDone! Bundles ready for distribution.\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  // Cleanup on error
  if (existsSync(STAGING_DIR)) {
    rmSync(STAGING_DIR, { recursive: true });
  }
  process.exit(1);
});
