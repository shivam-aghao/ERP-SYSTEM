CREATE OR REPLACE FUNCTION public.get_auth_role()
  RETURNS text
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  AS $function$
    SELECT r.name 
    FROM public.profiles p 
    JOIN public.roles r ON p.role_id = r.id 
    WHERE p.id = auth.uid() 
    LIMIT 1;
$function$;

GRANT EXECUTE ON FUNCTION "public"."get_auth_role"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."get_auth_role"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."get_auth_role"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_auth_role"() TO "postgres";
