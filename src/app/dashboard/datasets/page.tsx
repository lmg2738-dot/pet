"use client";

import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { RECOMMENDED_DATASET_KEYS } from "@/lib/aihub/types";
import { Database, Download, Search, FolderOpen } from "lucide-react";

interface DatasetItem {
  key: number;
  title: string;
}

interface FileItem {
  path: string;
  name: string;
  size: string;
  filekey: number;
}

export default function DatasetsPage() {
  const { fetchApi } = useApi();
  const [query, setQuery] = useState("반려동물");
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [selectedKey, setSelectedKey] = useState<number | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [selectedFilekeys, setSelectedFilekeys] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadDatasets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = query ? `?q=${encodeURIComponent(query)}` : "";
      const data = await fetchApi<{ datasets: DatasetItem[] }>(
        `/api/aihub/datasets${params}`
      );
      setDatasets(data.datasets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "조회 실패");
      setDatasets([]);
    } finally {
      setLoading(false);
    }
  }, [fetchApi, query]);

  useEffect(() => {
    loadDatasets();
  }, [loadDatasets]);

  async function loadFiles(datasetKey: number) {
    setSelectedKey(datasetKey);
    setFilesLoading(true);
    setSelectedFilekeys([]);
    setError("");
    try {
      const data = await fetchApi<{ files: FileItem[] }>(
        `/api/aihub/datasets/${datasetKey}`
      );
      setFiles(data.files);
    } catch (err) {
      setError(err instanceof Error ? err.message : "파일 목록 조회 실패");
      setFiles([]);
    } finally {
      setFilesLoading(false);
    }
  }

  function toggleFilekey(filekey: number) {
    setSelectedFilekeys((prev) =>
      prev.includes(filekey)
        ? prev.filter((k) => k !== filekey)
        : [...prev, filekey]
    );
  }

  async function handleDownload(all: boolean) {
    if (!selectedKey) return;

    setDownloading(true);
    setMessage("");
    setError("");

    try {
      const data = await fetchApi<{ message: string; downloadDir: string }>(
        "/api/aihub/download",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "dataset",
            key: selectedKey,
            filekeys: all ? undefined : selectedFilekeys,
          }),
        }
      );
      setMessage(`${data.message} (저장: ${data.downloadDir})`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "다운로드 실패");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">AI Hub 데이터셋</h1>
        <p className="mt-1 text-stone-500">
          aihubshell API를 통해 AI Hub 학습용 데이터를 조회·다운로드합니다
        </p>
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <p className="text-sm text-blue-900">
          <strong>추천 데이터셋:</strong> #{RECOMMENDED_DATASET_KEYS.PET_ANIMAL_VIDEO}{" "}
          반려동물 구분을 위한 동물 영상
        </p>
        <p className="mt-1 text-xs text-blue-700">
          다운로드 전 AI Hub에서 데이터셋 승인이 완료되어야 합니다. API key는
          서버 환경변수로만 관리되며 GitHub에 업로드되지 않습니다.
        </p>
      </Card>

      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            label="검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: 반려동물, 이미지"
            onKeyDown={(e) => e.key === "Enter" && loadDatasets()}
          />
        </div>
        <div className="flex items-end">
          <Button onClick={loadDatasets} loading={loading} variant="secondary">
            <Search className="h-4 w-4" />
            검색
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              데이터셋 목록 ({datasets.length})
            </CardTitle>
          </CardHeader>

          {loading ? (
            <p className="text-sm text-stone-500">불러오는 중...</p>
          ) : datasets.length > 0 ? (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {datasets.map((ds) => (
                <button
                  key={ds.key}
                  type="button"
                  onClick={() => loadFiles(ds.key)}
                  className={`w-full rounded-xl border p-3 text-left text-sm transition-colors ${
                    selectedKey === ds.key
                      ? "border-amber-400 bg-amber-50"
                      : "border-stone-100 hover:bg-stone-50"
                  }`}
                >
                  <span className="font-medium text-amber-700">#{ds.key}</span>
                  <span className="ml-2 text-stone-800">{ds.title}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-stone-400">
              데이터셋이 없습니다. aihubshell 설치 및 API key를 확인하세요.
            </p>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              파일 목록
              {selectedKey && (
                <span className="text-sm font-normal text-stone-500">
                  (dataset #{selectedKey})
                </span>
              )}
            </CardTitle>
          </CardHeader>

          {filesLoading ? (
            <p className="text-sm text-stone-500">파일 목록 불러오는 중...</p>
          ) : files.length > 0 ? (
            <>
              <div className="mb-4 max-h-64 space-y-2 overflow-y-auto">
                {files.map((file) => (
                  <label
                    key={file.filekey}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-stone-100 p-2 hover:bg-stone-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFilekeys.includes(file.filekey)}
                      onChange={() => toggleFilekey(file.filekey)}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="truncate font-medium text-stone-800">
                        {file.name}
                      </p>
                      <p className="text-xs text-stone-400">
                        {file.size} · filekey: {file.filekey}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleDownload(true)}
                  loading={downloading}
                  className="flex-1"
                >
                  <Download className="h-4 w-4" />
                  전체 다운로드
                </Button>
                <Button
                  onClick={() => handleDownload(false)}
                  loading={downloading}
                  disabled={selectedFilekeys.length === 0}
                  variant="secondary"
                  className="flex-1"
                >
                  선택 다운로드 ({selectedFilekeys.length})
                </Button>
              </div>
            </>
          ) : (
            <p className="py-8 text-center text-sm text-stone-400">
              {selectedKey
                ? "파일이 없거나 조회에 실패했습니다."
                : "데이터셋을 선택하면 파일 목록이 표시됩니다."}
            </p>
          )}
        </Card>
      </div>

      {message && (
        <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}
