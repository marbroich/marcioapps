-- Migration: Astro section bootstrap (combined)
-- Date: 2026-05-03
-- Description: Self-contained migration for the astrology + numerology section.
--              Creates app_users (minimal, used by astro and other pages) plus
--              the astro-specific tables, RLS, and helper functions.
--              Safe to run on a fresh Supabase project.

BEGIN;

-- =============================================
-- app_users — base user profile, 1:1 with auth.users
-- (created if missing; safe to re-run)
-- =============================================
CREATE TABLE IF NOT EXISTS public.app_users (
  id                    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 text,
  contact_email         text,
  display_name          text,
  first_name            text,
  last_name             text,
  avatar_url            text,
  bio                   text,
  phone                 text,
  phone2                text,
  whatsapp              text,
  gender                text,
  pronouns              text,
  birthday              date,
  instagram             text,
  telegram              text,
  facebook_url          text,
  links                 jsonb DEFAULT '{}'::jsonb,
  nationality           text,
  location_base         text,
  dietary_preferences   text[] DEFAULT '{}',
  allergies             text[] DEFAULT '{}',
  privacy_settings      jsonb DEFAULT '{}'::jsonb,
  vehicle_limit         int DEFAULT 1,
  is_current_resident   boolean DEFAULT false,
  person_id             uuid,
  slug                  text UNIQUE,
  role                  text NOT NULL DEFAULT 'resident'
                        CHECK (role IN ('resident', 'admin', 'staff', 'guest')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_users_email_idx ON public.app_users(lower(email));

-- Auto-create an app_users row whenever a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.app_users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name',
             NEW.raw_user_meta_data->>'name',
             split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Backfill: if any auth.users already exist without an app_users row, create them
INSERT INTO public.app_users (id, email, display_name)
SELECT u.id, u.email,
       COALESCE(u.raw_user_meta_data->>'full_name',
                u.raw_user_meta_data->>'name',
                split_part(u.email, '@', 1))
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.app_users a WHERE a.id = u.id);

-- RLS for app_users: each user reads/updates own; admins read all
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_users_select_own ON public.app_users;
CREATE POLICY app_users_select_own ON public.app_users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS app_users_update_own ON public.app_users;
CREATE POLICY app_users_update_own ON public.app_users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS app_users_admin_select_all ON public.app_users;
CREATE POLICY app_users_admin_select_all ON public.app_users
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.app_users a WHERE a.id = auth.uid() AND a.role = 'admin'));

-- updated_at trigger for app_users
CREATE OR REPLACE FUNCTION public.app_users_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS app_users_updated_at ON public.app_users;
CREATE TRIGGER app_users_updated_at
  BEFORE UPDATE ON public.app_users
  FOR EACH ROW EXECUTE FUNCTION public.app_users_set_updated_at();


-- =============================================
-- astro_profiles: extends app_users with astro/personality/professional fields
-- =============================================
CREATE TABLE IF NOT EXISTS public.astro_profiles (
  user_id              uuid PRIMARY KEY REFERENCES public.app_users(id) ON DELETE CASCADE,

  -- Birth data
  birth_date           date,
  birth_time           time,
  birth_time_known     boolean NOT NULL DEFAULT false,
  birth_place_name     text,
  birth_lat            numeric(8, 5),
  birth_lon            numeric(8, 5),
  birth_tz             text,

  -- Personal extras
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

CREATE OR REPLACE FUNCTION public.astro_profiles_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS astro_profiles_updated_at ON public.astro_profiles;
CREATE TRIGGER astro_profiles_updated_at
  BEFORE UPDATE ON public.astro_profiles
  FOR EACH ROW EXECUTE FUNCTION public.astro_profiles_set_updated_at();


-- =============================================
-- astro_charts_cache
-- =============================================
CREATE TABLE IF NOT EXISTS public.astro_charts_cache (
  user_id        uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  system         text NOT NULL CHECK (system IN ('western', 'vedic')),
  chart_data     jsonb NOT NULL,
  computed_at    timestamptz NOT NULL DEFAULT now(),
  source_hash    text,
  PRIMARY KEY (user_id, system)
);


-- =============================================
-- astro_invites
-- =============================================
CREATE TABLE IF NOT EXISTS public.astro_invites (
  email         text PRIMARY KEY,
  invited_at    timestamptz NOT NULL DEFAULT now(),
  invited_by    uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  accepted_at   timestamptz,
  notes         text
);


-- =============================================
-- RLS for astro tables
-- =============================================
ALTER TABLE public.astro_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.astro_charts_cache  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.astro_invites       ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS astro_profiles_select_own ON public.astro_profiles;
CREATE POLICY astro_profiles_select_own ON public.astro_profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS astro_profiles_insert_own ON public.astro_profiles;
CREATE POLICY astro_profiles_insert_own ON public.astro_profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS astro_profiles_update_own ON public.astro_profiles;
CREATE POLICY astro_profiles_update_own ON public.astro_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS astro_profiles_admin_select ON public.astro_profiles;
CREATE POLICY astro_profiles_admin_select ON public.astro_profiles
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.app_users u WHERE u.id = auth.uid() AND u.role = 'admin'));

DROP POLICY IF EXISTS astro_charts_cache_select_own ON public.astro_charts_cache;
CREATE POLICY astro_charts_cache_select_own ON public.astro_charts_cache
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS astro_charts_cache_insert_own ON public.astro_charts_cache;
CREATE POLICY astro_charts_cache_insert_own ON public.astro_charts_cache
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS astro_charts_cache_update_own ON public.astro_charts_cache;
CREATE POLICY astro_charts_cache_update_own ON public.astro_charts_cache
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS astro_charts_cache_delete_own ON public.astro_charts_cache;
CREATE POLICY astro_charts_cache_delete_own ON public.astro_charts_cache
  FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS astro_invites_admin_all ON public.astro_invites;
CREATE POLICY astro_invites_admin_all ON public.astro_invites
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.app_users u WHERE u.id = auth.uid() AND u.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.app_users u WHERE u.id = auth.uid() AND u.role = 'admin'));

DROP POLICY IF EXISTS astro_invites_check_self ON public.astro_invites;
CREATE POLICY astro_invites_check_self ON public.astro_invites
  FOR SELECT TO authenticated
  USING (lower(email) = lower((SELECT u.email FROM public.app_users u WHERE u.id = auth.uid())));


-- =============================================
-- Helper functions
-- =============================================
CREATE OR REPLACE FUNCTION public.list_astro_partners()
RETURNS TABLE (user_id uuid, display_name text)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT u.id, u.display_name
  FROM public.app_users u
  JOIN public.astro_profiles ap ON ap.user_id = u.id
  WHERE ap.birth_date IS NOT NULL AND u.id <> auth.uid()
  ORDER BY u.display_name;
$$;
REVOKE ALL ON FUNCTION public.list_astro_partners() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_astro_partners() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_synastry_partner_chart(partner_user_id uuid)
RETURNS TABLE (
  user_id uuid, display_name text, birth_date date, birth_time time,
  birth_time_known boolean, birth_lat numeric, birth_lon numeric, birth_tz text,
  western_chart jsonb, vedic_chart jsonb
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT
    u.id, u.display_name,
    ap.birth_date, ap.birth_time, ap.birth_time_known,
    ap.birth_lat, ap.birth_lon, ap.birth_tz,
    (SELECT chart_data FROM public.astro_charts_cache c WHERE c.user_id = u.id AND c.system = 'western'),
    (SELECT chart_data FROM public.astro_charts_cache c WHERE c.user_id = u.id AND c.system = 'vedic')
  FROM public.app_users u
  JOIN public.astro_profiles ap ON ap.user_id = u.id
  WHERE u.id = partner_user_id
    AND ap.birth_date IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.astro_profiles me WHERE me.user_id = auth.uid());
$$;
REVOKE ALL ON FUNCTION public.get_synastry_partner_chart(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_synastry_partner_chart(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.ensure_astro_profile()
RETURNS public.astro_profiles
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  result public.astro_profiles;
BEGIN
  INSERT INTO public.astro_profiles (user_id, birth_date)
  SELECT auth.uid(), u.birthday
  FROM public.app_users u WHERE u.id = auth.uid()
  ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO result FROM public.astro_profiles WHERE user_id = auth.uid();
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.ensure_astro_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_astro_profile() TO authenticated;

COMMIT;

-- =============================================
-- After running this migration, sign up your first user via the website
-- (that creates an auth.users row, which auto-creates an app_users row).
-- Then run this ONE-TIME command to make yourself admin (replace email):
--
--   UPDATE public.app_users SET role = 'admin' WHERE email = 'YOUR_EMAIL_HERE';
--
-- =============================================
