CREATE OR REPLACE FUNCTION public.generate_session_code()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
  IF NEW.session_code IS NULL THEN
    NEW.session_code := 'REC-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."generate_session_code"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."generate_session_code"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."generate_session_code"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."generate_session_code"() TO "postgres";
