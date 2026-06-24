import path from "path";

export function getAihubApiKey(): string {
  const key = process.env.AIHUB_API_KEY;
  if (!key) {
    throw new Error(
      "AIHUB_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인하세요."
    );
  }
  return key;
}

export function isAihubConfigured(): boolean {
  return Boolean(process.env.AIHUB_API_KEY);
}

export function getAihubShellPath(): string {
  return (
    process.env.AIHUB_SHELL_PATH ??
    path.join(process.cwd(), "tools", "aihubshell")
  );
}

export function getAihubDownloadDir(): string {
  return (
    process.env.AIHUB_DOWNLOAD_DIR ??
    path.join(process.cwd(), "data", "aihub-downloads")
  );
}

export const AIHUB_SHELL_DOWNLOAD_URL =
  "https://api.aihub.or.kr/api/aihubshell.do";
