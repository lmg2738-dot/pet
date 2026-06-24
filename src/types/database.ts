export type PetSpecies = "dog" | "cat" | "other";
export type RecordType = "weight" | "vaccination" | "memo";
export type RiskLevel = "low" | "medium" | "high";

export interface StatusDetail {
  status: string;
  confidence: number;
  notes: string;
}

export interface Pet {
  id: string;
  owner_id: string;
  name: string;
  species: PetSpecies;
  breed: string | null;
  birth_date: string | null;
  weight_kg: number | null;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface HealthRecord {
  id: string;
  pet_id: string;
  record_type: RecordType;
  title: string;
  value: string | null;
  recorded_at: string;
  notes: string | null;
  created_at: string;
}

export interface AnalysisResult {
  id: string;
  pet_id: string;
  image_url: string;
  eye_status: StatusDetail;
  skin_status: StatusDetail;
  ear_status: StatusDetail;
  body_status: StatusDetail;
  behavior_status: StatusDetail;
  overall_summary: string;
  risk_level: RiskLevel;
  veterinary_recommended: boolean;
  recommendations: string[];
  created_at: string;
}

export interface AnalysisResponse {
  eye_status: StatusDetail;
  skin_status: StatusDetail;
  ear_status: StatusDetail;
  body_status: StatusDetail;
  behavior_status: StatusDetail;
  overall_summary: string;
  risk_level: RiskLevel;
  veterinary_recommended: boolean;
  recommendations: string[];
}

export interface DashboardStats {
  totalPets: number;
  totalAnalyses: number;
  recentAnalyses: AnalysisResult[];
  vetRecommendedCount: number;
  weeklyAnalysisCount: number;
  monthlyAnalysisCount: number;
}

export interface CreatePetInput {
  name: string;
  species: PetSpecies;
  breed?: string;
  birth_date?: string;
  weight_kg?: number;
}

export interface CreateHealthRecordInput {
  pet_id: string;
  record_type: RecordType;
  title: string;
  value?: string;
  recorded_at?: string;
  notes?: string;
}
