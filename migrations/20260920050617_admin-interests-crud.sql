-- Admin CRUD for interests catalog (is_admin policies)

GRANT SELECT, INSERT, UPDATE, DELETE ON public.interests TO authenticated;

DROP POLICY IF EXISTS interests_select_all ON public.interests;
CREATE POLICY interests_select_all ON public.interests
  FOR SELECT TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS interests_insert_admin ON public.interests;
CREATE POLICY interests_insert_admin ON public.interests
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS interests_update_admin ON public.interests;
CREATE POLICY interests_update_admin ON public.interests
  FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS interests_delete_admin ON public.interests;
CREATE POLICY interests_delete_admin ON public.interests
  FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));
