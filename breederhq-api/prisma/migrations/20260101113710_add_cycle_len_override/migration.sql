-- Migration: add_cycle_len_override
-- Add femaleCycleLenOverrideDays to Animal model

ALTER TABLE "animals" ADD COLUMN "femaleCycleLenOverrideDays" INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN "animals"."femaleCycleLenOverrideDays" IS 'Override for automatic cycle length calculation (30-730 days). Null means use automatic calculation from history or biology.';
