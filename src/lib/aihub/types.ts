export type AihubListMode = "dataset" | "datapackage";
export type AihubDownloadMode = "dataset" | "datapackage";

export interface AihubDatasetItem {
  key: number;
  title: string;
}

export interface AihubFileItem {
  path: string;
  name: string;
  size: string;
  filekey: number;
}

export interface AihubDownloadRequest {
  type: AihubDownloadMode;
  key: number;
  filekeys?: number[];
}

export interface AihubDownloadResult {
  success: boolean;
  output: string;
  downloadDir: string;
}

/** PawInsight 관련 추천 데이터셋 (AI Hub datasetkey) */
export const RECOMMENDED_DATASET_KEYS = {
  PET_ANIMAL_VIDEO: 59,
} as const;
