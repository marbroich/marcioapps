-- Migration: Astrology + Numerology section
-- Date: 2026-04-30
-- Description: Adds astro_profiles (1:1 with app_users), astro_charts_cache,
--              astro_invites (allowlist), RLS, and a SECURITY DEFINER function
--              to fetch minimal chart data for synastry without exposing PII.

BEGIN;

-- =============================================
-- astro_profiles: extends app_users with astro/personality/professional fields
-- =============================================
CREATE TABLE IF NOT EXISTS public.astro_profiles (
  user_id              uuid PRIMARY KEY REFERENCES public.app_users(id) ON DELETE CASCADE,

  -- Birth data (date is on app_users.birthday; we mirror for convenience + add time/place)
  birth_date           date,
  birth_time           time,            -- nullable; unknown is OK
  birth_time_known     boolean NOT NULL DEFAULT false,
  birth_place_name     text,            -- e.g. "São Paulo, Brazil"
  birth_lat            numeric(8, 5),   -- -90 to 90
  birth_lon            numeric(8, 5),   -- -180 to 180
  birth_tz             text,            -- IANA tz, e.g. "America/Sao_Paulo"

  -- Personal extras (relationship_status not on app_users)
  relationship_status  text,

  -- Professional
  job_title            text,
  company              text,
  industry             text,
  skills               text[] DEFAULT '{}',
  linkedin_url         text,
  professional_bio     text,
  career_goals         text,

  -- Personality / preferences
  mbti                 text,
  enneagram            text,
  love_languages       text[] DEFAULT '{}',
  hobbies              text[] DEFAULT '{}',
  personal_values      text[] DEFAULT '{}',

  -- Astro preferences
  prefs                jsonb NOT NULL DEFAULT '{"house_system":"placidus","ayanamsa":"lahiri"}'::jsonb,

  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS astro_profiles_birth_date_idx ON public.astro_profiles(birth_date);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.astro_profiles_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS astro_profiles_updated_at ON public.astro_profiles;
CREATE TRIGGER astro_profiles_updated_at
  BEFORE UPDATE ON public.astro_profiles
  FOR EACH ROW EXECUTE FUNCTION public.astro_profiles_set_updated_at();

-- =============================================
-- astro_charts_cache: cached computed charts (Western/Vedic) per user
-- =============================================
CREATE TABLE IF NOT EXISTS public.astro_charts_cache (
  user_id        uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  system         text NOT NULL CHECK (system IN ('western', 'vedic')),
  chart_data     jsonb NOT NULL,
  computed_at    timestamptz NOT NULL DEFAULT now(),
  source_hash    text,        -- hash of birth inputs; recompute if changes
  PRIMARY KEY (user_id, system)
);

-- =============================================
-- astro_invites: allowlist of emails that may use the astro section
-- =============================================
CREATE TABLE IF NOT EXISTS public.astro_invites (
  email         text PRIMARY KEY,
  invited_at    timestamptz NOT NULL DEFAULT now(),
  invited_by    uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  accepted_at   timestamptz,
  notes         text
);

-- =============================================
-- RLS
-- =============================================
ALTER TABLE public.astro_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.astro_charts_cache  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.astro_invites       ENABLE ROW LEVEL SECURITY;

-- astro_profiles: each user can read/write only their own row
DROP POLICY IF EXISTS astro_profiles_select_own ON public.astro_profiles;
CREATE POLICY astro_profiles_select_own ON public.astro_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS astro_profiles_insert_own ON public.astro_profiles;
CREATE POLICY astro_profiles_insert_own ON public.astro_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS astro_profiles_update_own ON public.astro_profiles;
CREATE POLICY astro_profiles_update_own ON public.astro_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can read all astro_profiles (for support / synastry admin view)
DROP POLICY IF EXISTS astro_profiles_admin_select ON public.astro_profiles;
CREATE POLICY astro_profiles_admin_select ON public.astro_profiles
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.app_users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

-- astro_charts_cache: same pattern
DROP POLICY IF EXISTS astro_charts_cache_select_own ON public.astro_charts_cache;
CREATE POLICY astro_charts_cache_select_own ON public.astro_charts_cache
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS astro_charts_cache_insert_own ON public.astro_charts_cache;
CREATE POLICY astro_charts_cache_insert_own ON public.astro_charts_cache
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS astro_charts_cache_update_own ON public.astro_charts_cache;
CREATE POLICY astro_charts_cache_update_own ON public.astro_charts_cache
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS astro_charts_cache_delete_own ON public.astro_charts_cache;
CREATE POLICY astro_charts_cache_delete_own ON public.astro_charts_cache
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- astro_invites: admin-only
DROP POLICY IF EXISTS astro_invites_admin_all ON public.astro_invites;
CREATE POLICY astro_invites_admin_all ON public.astro_invites
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.app_users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.app_users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

-- Anyone authenticated can check if their own email is invited (used at gate)
DROP POLICY IF EXISTS astro_invites_check_self ON public.astro_invites;
CREATE POLICY astro_invites_check_self ON public.astro_invites
  FOR SELECT TO authenticated
  USING (lower(email) = lower((SELECT u.email FROM public.app_users u WHERE u.id = auth.uid())));

-- =============================================
-- list_astro_partners: returns members the current user can run synastry with
-- (display_name + user_id, no PII). Restricted to users who have astro_profiles
-- with at least a birth_date set.
-- =============================================
CREATE OR REPLACE FUNCTION public.list_astro_partners()
RETURNS TABLE (user_id uuid, display_name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id AS user_id, u.display_name
  FROM public.app_users u
  JOIN public.astro_profiles ap ON ap.user_id = u.id
  WHERE ap.birth_date IS NOT NULL
    AND u.id <> auth.uid()
  ORDER BY u.display_name;
$$;

REVOKE ALL ON FUNCTION public.list_astro_partners() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_astro_partners() TO authenticated;

-- =============================================
-- get_synastry_partner_chart: returns ONLY birth data + chart positions for a
-- chosen partner, never PII (no bio, profession, contact info, etc).
-- Caller must be authenticated; returned data is the bare minimum needed for
-- synastry math + a display name. Computed chart caching happens client-side
-- after positions are fetched.
-- =============================================
CREATE OR REPLACE FUNCTION public.get_synastry_partner_chart(partner_user_id uuid)
RETURNS TABLE (
  user_id          uuid,
  display_name     text,
  birth_date       date,
  birth_time       time,
  birth_time_known boolean,
  birth_lat        numeric,
  birth_lon        numeric,
  birth_tz         text,
  western_chart    jsonb,
  vedic_chart      jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id,
    u.display_name,
    ap.birth_date,
    ap.birth_time,
    ap.birth_time_known,
    ap.birth_lat,
    ap.birth_lon,
    ap.birth_tz,
    (SELECT chart_data FROM public.astro_charts_cache c
       WHERE c.user_id = u.id AND c.system = 'western'),
    (SELECT chart_data FROM public.astro_charts_cache c
       WHERE c.user_id = u.id AND c.system = 'vedic')
  FROM public.app_users u
  JOIN public.astro_profiles ap ON ap.user_id = u.id
  WHERE u.id = partner_user_id
    AND ap.birth_date IS NOT NULL
    -- Caller must themselves have an astro_profile (i.e. be a member of the section)
    AND EXISTS (SELECT 1 FROM public.astro_profiles me WHERE me.user_id = auth.uid());
$$;

REVOKE ALL ON FUNCTION public.get_synastry_partner_chart(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_synastry_partner_chart(uuid) TO authenticated;

-- =============================================
-- ensure_astro_profile: idempotent helper to seed an astro_profiles row for
-- the current user if one doesn't exist. Called when a user first lands on
-- the astro section.
-- =============================================
CREATE OR REPLACE FUNCTION public.ensure_astro_profile()
RETURNS public.astro_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.astro_profiles;
BEGIN
  INSERT INTO public.astro_profiles (user_id, birth_date)
  SELECT auth.uid(), u.birthday
  FROM public.app_users u
  WHERE u.id = auth.uid()
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO result FROM public.astro_profiles WHERE user_id = auth.uid();
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_astro_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_astro_profile() TO authenticated;

COMMIT;
