import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);

const bump = getArgValue(["--bump", "-b"]); // 可选，不指定则不更新版本号
const tag = getArgValue(["--tag"]);
const dryRun = hasArg("--dry-run");
const requested = getMultiArgValues([
  "--package",
  "--packages",
  "-p",
  "--filter",
  "-f",
]);
const publishAll = hasArg("--all");

const allowedBumps = new Set(["patch", "minor", "major"]);
if (bump && !allowedBumps.has(bump)) {
  printAndExit(`无效的版本类型: ${bump}. 仅支持 patch | minor | major`);
}

const rootDir = process.cwd();
const packagesDir = join(rootDir, "packages");
const allPackages = listPackages(packagesDir);

const selectedPackages = resolveSelectedPackages({
  allPackages,
  requested,
  publishAll,
});

if (selectedPackages.length === 0) {
  printAndExit("没有可发布的包（可能都是 private 或筛选未命中）。");
}

for (const pkg of selectedPackages) {
  // 仅当指定 --bump 时才更新版本号
  if (bump) {
    runCommand(
      "pnpm",
      ["-C", pkg.dir, "version", bump, "--no-git-tag-version"],
      dryRun,
    );
  }

  const publishArgs = [
    "-C",
    pkg.dir,
    "publish",
    "--access",
    "public",
    "--no-git-checks",
  ];
  if (tag) {
    publishArgs.push("--tag", tag);
  }
  runCommand("pnpm", publishArgs, dryRun);
}

function listPackages(baseDir) {
  const entries = readdirSync(baseDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dir = join(baseDir, entry.name);
      const pkgJsonPath = join(dir, "package.json");
      let pkgJson;
      try {
        pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
      } catch {
        return null;
      }
      return {
        dir,
        folder: entry.name,
        name: pkgJson.name,
        private: Boolean(pkgJson.private),
      };
    })
    .filter(Boolean);
}

function resolveSelectedPackages({ allPackages, requested, publishAll }) {
  const candidates = allPackages.filter((pkg) => !pkg.private);
  if (publishAll || requested.length === 0) {
    return candidates;
  }

  const resolved = [];
  const missing = [];

  for (const raw of requested) {
    const input = raw.trim();
    if (!input) continue;
    const match = candidates.find(
      (pkg) =>
        pkg.name === input ||
        pkg.folder === input ||
        (pkg.name && pkg.name.endsWith(`/${input}`)),
    );
    if (!match) {
      missing.push(input);
      continue;
    }
    if (!resolved.includes(match)) {
      resolved.push(match);
    }
  }

  if (missing.length > 0) {
    const available = candidates
      .map((pkg) => pkg.name || pkg.folder)
      .join(", ");
    printAndExit(
      `未找到包: ${missing.join(", ")}。可用包: ${available || "无"}`,
    );
  }

  return resolved;
}

function getArgValue(names) {
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    for (const name of names) {
      if (arg === name) {
        return args[i + 1];
      }
      if (arg.startsWith(`${name}=`)) {
        return arg.slice(name.length + 1);
      }
    }
  }
  return null;
}

function getMultiArgValues(names) {
  const values = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    for (const name of names) {
      if (arg === name) {
        values.push(args[i + 1] ?? "");
      } else if (arg.startsWith(`${name}=`)) {
        values.push(arg.slice(name.length + 1));
      }
    }
  }
  return values
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function hasArg(name) {
  return args.includes(name) || args.some((arg) => arg.startsWith(`${name}=`));
}

function runCommand(command, commandArgs, dryRunMode) {
  const commandText = `${command} ${commandArgs.join(" ")}`;
  if (dryRunMode) {
    console.log(`[dry-run] ${commandText}`);
    return;
  }
  const result = spawnSync(command, commandArgs, { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function printAndExit(message) {
  console.error(message);
  process.exit(1);
}
