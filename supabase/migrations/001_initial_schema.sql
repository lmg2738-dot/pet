-- PawInsight AI - Initial Schema
-- pets, health_records, analysis_results

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Updated-at trigger helper
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Pets
CREATE TABLE IF NOT EXISTS pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT NOT NULL,
  name VARCHAR(100) NOT NULL,
  species VARCHAR(50) NOT NULL DEFAULT 'dog' CHECK (species IN ('dog', 'cat', 'other')),
  breed VARCHAR(100),
  birth_date DATE,
  weight_kg DECIMAL(6, 2) CHECK (weight_kg IS NULL OR weight_kg > 0),
  profile_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pets_owner_id ON pets(owner_id);
CREATE INDEX idx_pets_created_at ON pets(created_at DESC);

CREATE TRIGGER pets_updated_at
  BEFORE UPDATE ON pets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Health records (weight, vaccination, memo)
CREATE TABLE IF NOT EXISTS health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  record_type VARCHAR(50) NOT NULL CHECK (record_type IN ('weight', 'vaccination', 'memo')),
  title VARCHAR(200) NOT NULL,
  value TEXT,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_health_records_pet_id ON health_records(pet_id);
CREATE INDEX idx_health_records_recorded_at ON health_records(recorded_at DESC);
CREATE INDEX idx_health_records_type ON health_records(record_type);

-- AI analysis results
CREATE TABLE IF NOT EXISTS analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  eye_status JSONB NOT NULL DEFAULT '{}',
  skin_status JSONB NOT NULL DEFAULT '{}',
  ear_status JSONB NOT NULL DEFAULT '{}',
  body_status JSONB NOT NULL DEFAULT '{}',
  behavior_status JSONB NOT NULL DEFAULT '{}',
  overall_summary TEXT NOT NULL,
  risk_level VARCHAR(20) NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  veterinary_recommended BOOLEAN NOT NULL DEFAULT false,
  recommendations TEXT[] NOT NULL DEFAULT '{}',
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analysis_results_pet_id ON analysis_results(pet_id);
CREATE INDEX idx_analysis_results_created_at ON analysis_results(created_at DESC);
CREATE INDEX idx_analysis_results_risk_level ON analysis_results(risk_level);

-- Row Level Security (owner_id isolation)
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS; anon policies for client reads via owner_id header
CREATE POLICY pets_owner_select ON pets
  FOR SELECT USING (owner_id = current_setting('request.jwt.claims', true)::json->>'owner_id'
    OR owner_id = current_setting('app.owner_id', true));

CREATE POLICY pets_owner_insert ON pets
  FOR INSERT WITH CHECK (owner_id = current_setting('app.owner_id', true));

CREATE POLICY pets_owner_update ON pets
  FOR UPDATE USING (owner_id = current_setting('app.owner_id', true));

CREATE POLICY pets_owner_delete ON pets
  FOR DELETE USING (owner_id = current_setting('app.owner_id', true));

CREATE POLICY health_records_select ON health_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = health_records.pet_id
        AND pets.owner_id = current_setting('app.owner_id', true)
    )
  );

CREATE POLICY health_records_insert ON health_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = health_records.pet_id
        AND pets.owner_id = current_setting('app.owner_id', true)
    )
  );

CREATE POLICY health_records_delete ON health_records
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = health_records.pet_id
        AND pets.owner_id = current_setting('app.owner_id', true)
    )
  );

CREATE POLICY analysis_results_select ON analysis_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = analysis_results.pet_id
        AND pets.owner_id = current_setting('app.owner_id', true)
    )
  );

CREATE POLICY analysis_results_insert ON analysis_results
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = analysis_results.pet_id
        AND pets.owner_id = current_setting('app.owner_id', true)
    )
  );
