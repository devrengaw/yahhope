CREATE OR REPLACE FUNCTION public.get_public_children_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM public.children;

  RETURN COALESCE(v_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_children_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_children_count() TO anon, authenticated;
