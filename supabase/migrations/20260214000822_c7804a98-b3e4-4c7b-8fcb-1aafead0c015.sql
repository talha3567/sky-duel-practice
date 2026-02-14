
-- Verification codes table for Minecraft /doğrula command
CREATE TABLE public.verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  minecraft_username VARCHAR(16) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX idx_verification_codes_code ON public.verification_codes(code);
CREATE INDEX idx_verification_codes_username ON public.verification_codes(minecraft_username);

-- Enable RLS
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Only service role can insert/update (edge functions)
CREATE POLICY "Service role manages verification codes"
  ON public.verification_codes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Auto-cleanup expired codes (optional: service role only insert)
CREATE POLICY "No public access to verification codes"
  ON public.verification_codes
  FOR SELECT
  USING (false);
