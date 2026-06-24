import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import {
  getAihubApiKey,
  getAihubDownloadDir,
  getAihubShellPath,
} from "@/lib/aihub/config";
import { parseDatasetList, parseFileList } from "@/lib/aihub/parse";
import type {
  AihubDatasetItem,
  AihubDownloadMode,
  AihubDownloadResult,
  AihubFileItem,
  AihubListMode,
} from "@/lib/aihub/types";

const execFileAsync = promisify(execFile);

async function runShell(args: string[], cwd?: string): Promise<string> {
  const shellPath = getAihubShellPath();
  const apiKey = getAihubApiKey();

  if (!fs.existsSync(shellPath)) {
    throw new Error(
      `aihubshell을 찾을 수 없습니다: ${shellPath}\n` +
        "scripts/setup-aihubshell.ps1 또는 scripts/setup-aihubshell.sh를 실행하세요."
    );
  }

  const fullArgs = [...args, "-aihubapikey", apiKey];

  try {
    if (process.platform === "win32") {
      const wslPath = shellPath.replace(/\\/g, "/").replace(/^([A-Z]):/i, (_, d) =>
        `/mnt/${d.toLowerCase()}`
      );
      const wslCwd = cwd
        ? cwd.replace(/\\/g, "/").replace(/^([A-Z]):/i, (_, d) =>
            `/mnt/${d.toLowerCase()}`
          )
        : undefined;

      const cmd = [
        wslCwd ? `cd '${wslCwd}' &&` : "",
        `chmod +x '${wslPath}' 2>/dev/null;`,
        `'${wslPath}'`,
        ...fullArgs.map((a) => `'${a.replace(/'/g, "'\\''")}'`),
      ]
        .filter(Boolean)
        .join(" ");

      const { stdout, stderr } = await execFileAsync("wsl", ["bash", "-lc", cmd], {
        maxBuffer: 100 * 1024 * 1024,
        encoding: "utf-8",
        timeout: 60 * 60 * 1000,
      });
      return `${stdout}\n${stderr}`.trim();
    }

    await execFileAsync("chmod", ["+x", shellPath]).catch(() => {});

    const { stdout, stderr } = await execFileAsync(shellPath, fullArgs, {
      maxBuffer: 100 * 1024 * 1024,
      encoding: "utf-8",
      cwd,
      timeout: 60 * 60 * 1000,
    });

    return `${stdout}\n${stderr}`.trim();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "aihubshell 실행 실패";
    throw new Error(message);
  }
}

function listModeArgs(mode: AihubListMode, key?: number): string[] {
  if (mode === "dataset") {
    const args = ["-mode", "l"];
    if (key !== undefined) args.push("-datasetkey", String(key));
    return args;
  }
  const args = ["-mode", "pl"];
  if (key !== undefined) args.push("-datapckagekey", String(key));
  return args;
}

function downloadModeArgs(
  mode: AihubDownloadMode,
  key: number,
  filekeys?: number[]
): string[] {
  const args =
    mode === "dataset"
      ? ["-mode", "d", "-datasetkey", String(key)]
      : ["-mode", "pd", "-datapckagekey", String(key)];

  if (filekeys && filekeys.length > 0) {
    args.push("-filekey", filekeys.join(","));
  }

  return args;
}

export async function listDatasets(): Promise<AihubDatasetItem[]> {
  const output = await runShell(listModeArgs("dataset"));
  return parseDatasetList(output);
}

export async function listDatapackages(): Promise<AihubDatasetItem[]> {
  const output = await runShell(listModeArgs("datapackage"));
  return parseDatasetList(output);
}

export async function listDatasetFiles(
  datasetKey: number
): Promise<AihubFileItem[]> {
  const output = await runShell(listModeArgs("dataset", datasetKey));
  return parseFileList(output);
}

export async function listDatapackageFiles(
  packageKey: number
): Promise<AihubFileItem[]> {
  const output = await runShell(listModeArgs("datapackage", packageKey));
  return parseFileList(output);
}

export async function downloadFromAihub(
  mode: AihubDownloadMode,
  key: number,
  filekeys?: number[]
): Promise<AihubDownloadResult> {
  const downloadDir = getAihubDownloadDir();
  fs.mkdirSync(downloadDir, { recursive: true });

  const args = downloadModeArgs(mode, key, filekeys);
  const output = await runShell(args, downloadDir);

  const success =
    output.includes("Authentication successful") ||
    output.includes("Download successful") ||
    output.includes("병합이 완료");

  return { success, output, downloadDir };
}

export async function getAihubHelp(): Promise<string> {
  return runShell(["-help"]);
}
