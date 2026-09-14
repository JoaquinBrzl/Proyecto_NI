-- Grupo NI user profile: public profile fields, private contacts, interests catalog.
-- Does not duplicate auth.users; email stays on Auth (never stored here).
-- WhatsApp is private (owner + admin only). Native Auth profile name is synced from JS.

-- ---------------------------------------------------------------------------
-- profiles (public / shareable fields; unique username)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  nombres TEXT NOT NULL DEFAULT '',
  apellidos TEXT NOT NULL DEFAULT '',
  universidad TEXT NOT NULL DEFAULT '',
  carrera TEXT NOT NULL DEFAULT '',
  ciclo_academico TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_username_format CHECK (
    username ~ '^[a-zA-Z0-9_]{3,30}$'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_uidx
  ON public.profiles (lower(username));

CREATE INDEX IF NOT EXISTS idx_profiles_universidad ON public.profiles (universidad);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

CREATE OR REPLACE FUNCTION public.prevent_profile_user_id_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'user_id cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_guard_user_id
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_user_id_change();

-- ---------------------------------------------------------------------------
-- user_private_contacts (WhatsApp — never publicly readable)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_private_contacts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  whatsapp TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER user_private_contacts_updated_at
  BEFORE UPDATE ON public.user_private_contacts
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

CREATE OR REPLACE FUNCTION public.prevent_private_contact_user_id_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'user_id cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_private_contacts_guard_user_id
  BEFORE UPDATE ON public.user_private_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_private_contact_user_id_change();

-- ---------------------------------------------------------------------------
-- interests catalog + user_interests junction
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT interests_slug_format CHECK (slug ~ '^[a-z0-9-]{2,40}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS interests_slug_uidx ON public.interests (slug);

CREATE TABLE IF NOT EXISTS public.user_interests (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL REFERENCES public.interests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, interest_id)
);

CREATE INDEX IF NOT EXISTS idx_user_interests_interest_id
  ON public.user_interests (interest_id);

-- Seed catalog (idempotent)
INSERT INTO public.interests (slug, label, sort_order) VALUES
  ('emprendimiento', 'Emprendimiento', 10),
  ('finanzas', 'Finanzas', 20),
  ('marketing', 'Marketing', 30),
  ('tecnologia', 'Tecnología', 40),
  ('liderazgo', 'Liderazgo', 50),
  ('networking', 'Networking', 60),
  ('investigacion', 'Investigación', 70),
  ('diseno', 'Diseño', 80),
  ('sostenibilidad', 'Sostenibilidad', 90),
  ('carrera-profesional', 'Carrera profesional', 100)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- RLS + privileges
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_private_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.profiles FROM anon, authenticated;
REVOKE ALL ON public.user_private_contacts FROM anon, authenticated;
REVOKE ALL ON public.interests FROM anon, authenticated;
REVOKE ALL ON public.user_interests FROM anon, authenticated;

-- profiles: authenticated can read any row (public fields only live here);
-- writes only for owner (or admin).
GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

CREATE POLICY profiles_select_authenticated ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  );

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  );

CREATE POLICY profiles_delete_own ON public.profiles
  FOR DELETE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  );

-- private contacts: owner + admin only (email is never stored here)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_private_contacts TO authenticated;

CREATE POLICY private_contacts_select_own_or_admin ON public.user_private_contacts
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  );

CREATE POLICY private_contacts_insert_own ON public.user_private_contacts
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  );

CREATE POLICY private_contacts_update_own ON public.user_private_contacts
  FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  );

CREATE POLICY private_contacts_delete_own ON public.user_private_contacts
  FOR DELETE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  );

-- interests catalog: readable by authenticated; mutations admin-only via CLI/admin
GRANT SELECT ON public.interests TO authenticated, anon;

CREATE POLICY interests_select_all ON public.interests
  FOR SELECT TO authenticated, anon
  USING (true);

-- user_interests: readable by authenticated (public interest tags);
-- mutate own rows only
GRANT SELECT ON public.user_interests TO authenticated;
GRANT INSERT, DELETE ON public.user_interests TO authenticated;

CREATE POLICY user_interests_select_authenticated ON public.user_interests
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY user_interests_insert_own ON public.user_interests
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  );

CREATE POLICY user_interests_delete_own ON public.user_interests
  FOR DELETE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  );
