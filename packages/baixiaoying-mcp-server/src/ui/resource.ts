import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const UI_RESOURCE_URI = "ui://baixiaoying/chat-result";

function resolvePackageRoot(): string {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(currentDir, "..", "..");
}

async function readFirstExisting(pathsToTry: string[]): Promise<string> {
  for (const filePath of pathsToTry) {
    try {
      return await fs.readFile(filePath, "utf-8");
    } catch {
      // try next
    }
  }
  throw new Error(
    `UI HTML not found. Tried: ${pathsToTry.join(", ")}`
  );
}

export async function loadUiHtml(): Promise<string> {
  const packageRoot = resolvePackageRoot();
  const candidates = [
    path.join(packageRoot, "dist/ui/chat-result.html"),
    path.join(packageRoot, "dist/ui/src/ui/chat-result.html"),
    path.join(packageRoot, "src/ui/chat-result.html"),
  ];
  return readFirstExisting(candidates);
}

export function getUiResourceUri(): string {
  return UI_RESOURCE_URI;
}
