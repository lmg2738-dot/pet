# PawInsight AI - Supabase Schema Reference

## Tables

### pets
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| owner_id | TEXT | Session-based owner identifier |
| name | VARCHAR(100) | Pet name |
| species | VARCHAR(50) | dog, cat, other |
| breed | VARCHAR(100) | Breed (optional) |
| birth_date | DATE | Birth date (optional) |
| weight_kg | DECIMAL | Weight in kg (optional) |
| profile_image_url | TEXT | Profile image URL (optional) |

### health_records
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| pet_id | UUID | FK → pets |
| record_type | VARCHAR(50) | weight, vaccination, memo |
| title | VARCHAR(200) | Record title |
| value | TEXT | Value content |
| recorded_at | DATE | Record date |
| notes | TEXT | Additional notes |

### analysis_results
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| pet_id | UUID | FK → pets |
| image_url | TEXT | Analyzed image URL |
| eye_status | JSONB | Eye observation |
| skin_status | JSONB | Skin observation |
| ear_status | JSONB | Ear observation |
| body_status | JSONB | Body shape observation |
| behavior_status | JSONB | Behavior observation |
| overall_summary | TEXT | Summary in Korean |
| risk_level | VARCHAR(20) | low, medium, high |
| veterinary_recommended | BOOLEAN | Vet visit recommended |
| recommendations | TEXT[] | Action items |

## Apply migrations

```bash
# Using Supabase CLI
supabase db push

# Or run SQL files manually in Supabase SQL Editor:
# 1. supabase/migrations/001_initial_schema.sql
# 2. supabase/migrations/002_storage_bucket.sql
```

## Storage

- Bucket: `pet-images` (public read, 10MB limit)
- Allowed: JPEG, PNG, WebP, GIF
