-- Mark interests as primary (shown on registration) vs full catalog (profile modal)

ALTER TABLE public.interests
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT false;

-- Keep current catalog visible on registration until admin adjusts
UPDATE public.interests SET is_primary = true WHERE is_primary = false;
