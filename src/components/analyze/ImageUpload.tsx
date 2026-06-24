"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from "@/lib/validations";

interface ImageUploadProps {
  petId: string;
  onUploaded: (imageUrl: string) => void;
  disabled?: boolean;
}

export function ImageUpload({ petId, onUploaded, disabled }: ImageUploadProps) {
  const { fetchApi } = useApi();
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      return "JPEG, PNG, WebP, GIF 형식만 업로드 가능합니다.";
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return "파일 크기는 10MB 이하여야 합니다.";
    }
    return null;
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setError("");
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      previewRef.current = objectUrl;
      setPreview(objectUrl);
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("pet_id", petId);

        const data = await fetchApi<{ image_url: string }>("/api/upload", {
          method: "POST",
          body: formData,
        });

        onUploaded(data.image_url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "업로드에 실패했습니다.");
        setPreview(null);
      } finally {
        setUploading(false);
      }
    },
    [petId, onUploaded, validateFile, fetchApi]
  );

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  function clearPreview() {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    setPreview(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        className={cn(
          "relative flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors",
          dragOver
            ? "border-amber-400 bg-amber-50"
            : "border-stone-200 bg-stone-50 hover:border-amber-300",
          disabled && "pointer-events-none opacity-50"
        )}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <div className="relative h-full w-full p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="미리보기"
              className="mx-auto max-h-52 rounded-xl object-contain"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearPreview();
              }}
              className="absolute right-6 top-6 rounded-full bg-white p-1.5 shadow-md hover:bg-stone-50"
            >
              <X className="h-4 w-4 text-stone-600" />
            </button>
          </div>
        ) : (
          <>
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
              <ImageIcon className="h-7 w-7 text-amber-600" />
            </div>
            <p className="font-medium text-stone-700">
              사진을 드래그하거나 클릭하여 업로드
            </p>
            <p className="mt-1 text-sm text-stone-400">
              JPEG, PNG, WebP, GIF · 최대 10MB
            </p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          disabled={disabled || uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-amber-700">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          이미지 업로드 중...
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!preview && (
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          <Upload className="h-4 w-4" />
          사진 선택
        </Button>
      )}
    </div>
  );
}
