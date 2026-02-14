
-- Fix RLS: Drop permissive policies, add restrictive service-role-only policy
DROP POLICY IF EXISTS "Service role manages verification codes" ON public.verification_codes;
DROP POLICY IF EXISTS "No public access to verification codes" ON public.verification_codes;

-- Only service role can do anything with verification codes
CREATE POLICY "Service role full access to verification codes"
  ON public.verification_codes
  FOR ALL
  USING ((current_setting('request.jwt.claims', true)::json ->> 'role') = 'service_role')
  WITH CHECK ((current_setting('request.jwt.claims', true)::json ->> 'role') = 'service_role');
