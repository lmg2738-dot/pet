"use client";

import { useState } from "react";
import { useApi } from "@/hooks/useApi";
import { PetSelector } from "@/components/pet/PetSelector";
import { ImageUpload } from "@/components/analyze/ImageUpload";
import { AnalysisResultCard } from "@/components/analyze/AnalysisResult";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Sparkles } from "lucide-react";
import type { AnalysisResult } from "@/types/database";

export default function AnalyzePage() {
  const { fetchApi } = useApi();
  const [petId, setPetId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [modelUsed, setModelUsed] = useState("");
  const [error, setError] = useState("");

  async function handleAnalyze() {
    if (!petId || !imageUrl) {
      setError("반려동물과 사진을 모두 선택해 주세요.");
      return;
    }

    setError("");
    setAnalyzing(true);
    setResult(null);
    setModelUsed("");

    try {
      const data = await fetchApi<{
        analysis: AnalysisResult;
        model_used: string;
        disclaimer: string;
      }>("/api/pet/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pet_id: petId, image_url: imageUrl }),
      });

      setResult(data.analysis);
      setModelUsed(data.model_used);
    } catch (err) {
      setError(err instanceof Error ? err.message : "분석에 실패했습니다.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">AI 건강 분석</h1>
        <p className="mt-1 text-stone-500">
          사진 한 장으로 반려동물의 건강 상태를 관찰합니다 (진단 아님)
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>사진 업로드</CardTitle>
          </CardHeader>

          <div className="space-y-4">
            <PetSelector value={petId} onChange={setPetId} />

            {petId && (
              <ImageUpload
                petId={petId}
                onUploaded={(url) => {
                  setImageUrl(url);
                  setResult(null);
                }}
                disabled={analyzing}
              />
            )}

            {imageUrl && (
              <Button
                onClick={handleAnalyze}
                loading={analyzing}
                className="w-full"
                disabled={!petId}
              >
                <Sparkles className="h-4 w-4" />
                AI 건강 분석 시작
              </Button>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        </Card>

        <div>
          {analyzing ? (
            <Card className="flex h-64 flex-col items-center justify-center">
              <span className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
              <p className="font-medium text-stone-700">AI가 사진을 분석 중...</p>
              <p className="mt-1 text-sm text-stone-400">
                눈, 피부, 귀, 체형, 행동을 확인합니다
              </p>
            </Card>
          ) : result ? (
            <div className="space-y-3">
              {modelUsed && (
                <p className="text-xs text-stone-400">
                  사용 모델: <span className="font-mono">{modelUsed}</span> (OpenRouter 무료)
                </p>
              )}
              <AnalysisResultCard analysis={result} />
            </div>
          ) : (
            <Card className="flex h-64 flex-col items-center justify-center text-center">
              <Sparkles className="mb-3 h-10 w-10 text-stone-300" />
              <p className="font-medium text-stone-500">분석 결과가 여기에 표시됩니다</p>
              <p className="mt-1 text-sm text-stone-400">
                반려동물 사진을 업로드하고 분석을 시작하세요
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
