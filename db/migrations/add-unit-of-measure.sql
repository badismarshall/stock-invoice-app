-- Migration script to add unit_of_measure table and migrate product data
-- This script should be run manually or through a migration tool

-- Step 1: Create the unit_of_measure table
CREATE TABLE IF NOT EXISTS unit_of_measure (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  symbol TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Step 2: Insert default units of measure
INSERT INTO unit_of_measure (id, name, symbol, description, is_active) VALUES
  ('unit_1', 'Unité', 'unité', 'Unité de mesure standard', true),
  ('unit_2', 'Kilogramme', 'kg', 'Unité de masse', true),
  ('unit_3', 'Gramme', 'g', 'Unité de masse', true),
  ('unit_4', 'Litre', 'L', 'Unité de volume', true),
  ('unit_5', 'Millilitre', 'ml', 'Unité de volume', true),
  ('unit_6', 'Mètre', 'm', 'Unité de longueur', true),
  ('unit_7', 'Centimètre', 'cm', 'Unité de longueur', true),
  ('unit_8', 'Mètre carré', 'm²', 'Unité de surface', true),
  ('unit_9', 'Mètre cube', 'm³', 'Unité de volume', true),
  ('unit_10', 'Pièce', 'pce', 'Unité de comptage', true)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Add the new column unit_of_measure_id to product table
ALTER TABLE product ADD COLUMN IF NOT EXISTS unit_of_measure_id TEXT;

-- Step 4: Create a mapping function to match existing unit_of_measure values to unit_of_measure_id
-- This will map common unit names to the new IDs
UPDATE product
SET unit_of_measure_id = CASE
  WHEN LOWER(TRIM(unit_of_measure)) IN ('unité', 'unite', 'unit', 'u', 'pce', 'pièce', 'piece') THEN 'unit_1'
  WHEN LOWER(TRIM(unit_of_measure)) IN ('kg', 'kilogramme', 'kilogram', 'kilo') THEN 'unit_2'
  WHEN LOWER(TRIM(unit_of_measure)) IN ('g', 'gramme', 'gram') THEN 'unit_3'
  WHEN LOWER(TRIM(unit_of_measure)) IN ('l', 'litre', 'liter', 'lit') THEN 'unit_4'
  WHEN LOWER(TRIM(unit_of_measure)) IN ('ml', 'millilitre', 'milliliter') THEN 'unit_5'
  WHEN LOWER(TRIM(unit_of_measure)) IN ('m', 'mètre', 'meter', 'metre') THEN 'unit_6'
  WHEN LOWER(TRIM(unit_of_measure)) IN ('cm', 'centimètre', 'centimeter', 'centimetre') THEN 'unit_7'
  WHEN LOWER(TRIM(unit_of_measure)) IN ('m²', 'm2', 'mètre carré', 'meter square', 'metre carre') THEN 'unit_8'
  WHEN LOWER(TRIM(unit_of_measure)) IN ('m³', 'm3', 'mètre cube', 'meter cube', 'metre cube') THEN 'unit_9'
  ELSE 'unit_1' -- Default to 'unité' if no match found
END
WHERE unit_of_measure_id IS NULL;

-- Step 5: For any remaining NULL values, set them to 'unit_1' (unité)
UPDATE product
SET unit_of_measure_id = 'unit_1'
WHERE unit_of_measure_id IS NULL;

-- Step 6: Make unit_of_measure_id NOT NULL
ALTER TABLE product ALTER COLUMN unit_of_measure_id SET NOT NULL;

-- Step 7: Add foreign key constraint
ALTER TABLE product 
ADD CONSTRAINT fk_product_unit_of_measure 
FOREIGN KEY (unit_of_measure_id) 
REFERENCES unit_of_measure(id) 
ON DELETE RESTRICT;

-- Step 8: Create index on unit_of_measure_id
CREATE INDEX IF NOT EXISTS idx_products_unit_of_measure ON product(unit_of_measure_id);

-- Step 9: Drop the old unit_of_measure column (optional - can be done later after verification)
-- ALTER TABLE product DROP COLUMN unit_of_measure;

