import { z } from "zod";

export const petSpeciesSchema = z.enum(["dog", "cat", "other"]);
export const recordTypeSchema = z.enum(["weight", "vaccination", "memo"]);
export const riskLevelSchema = z.enum(["low", "medium", "high"]);

export const createPetSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  species: petSpeciesSchema.default("dog"),
  breed: z.string().max(100).trim().optional(),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  weight_kg: z.number().positive().max(500).optional(),
});

export const createHealthRecordSchema = z.object({
  pet_id: z.string().uuid(),
  record_type: recordTypeSchema,
  title: z.string().min(1).max(200).trim(),
  value: z.string().max(500).trim().optional(),
  recorded_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  notes: z.string().max(2000).trim().optional(),
});

export const imageUrlSchema = z
  .string()
  .max(2048)
  .refine(
    (val) =>
      val.startsWith("/uploads/") ||
      val.startsWith("/api/media/") ||
      val.startsWith("http://") ||
      val.startsWith("https://"),
    { message: "Invalid image URL" }
  );

export const analyzePetSchema = z.object({
  pet_id: z.string().uuid(),
  image_url: imageUrlSchema,
});

export const statusDetailSchema = z.object({
  status: z.string(),
  confidence: z.number().min(0).max(1),
  notes: z.string(),
});

export const analysisResponseSchema = z.object({
  eye_status: statusDetailSchema,
  skin_status: statusDetailSchema,
  ear_status: statusDetailSchema,
  body_status: statusDetailSchema,
  behavior_status: statusDetailSchema,
  overall_summary: z.string(),
  risk_level: riskLevelSchema,
  veterinary_recommended: z.boolean(),
  recommendations: z.array(z.string()).min(1).max(10),
});

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
