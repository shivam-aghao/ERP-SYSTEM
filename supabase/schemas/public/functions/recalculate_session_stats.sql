CREATE OR REPLACE FUNCTION public.recalculate_session_stats()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
DECLARE
  v_session_id UUID;
  v_total INT;
  v_present INT;
  v_absent INT;
BEGIN
  v_session_id := COALESCE(NEW.session_id, OLD.session_id);

  SELECT COUNT(*),
         COUNT(*) FILTER (WHERE status = 'PRESENT'),
         COUNT(*) FILTER (WHERE status = 'ABSENT')
  INTO v_total, v_present, v_absent
  FROM attendance_records
  WHERE session_id = v_session_id;

  UPDATE attendance_sessions
  SET total_students  = v_total,
      present_count   = v_present,
      absent_count    = v_absent,
      attendance_rate = CASE WHEN v_total > 0
                             THEN ROUND((v_present::numeric / v_total) * 100, 2)
                             ELSE 0 END,
      updated_at      = NOW()
  WHERE id = v_session_id;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."recalculate_session_stats"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."recalculate_session_stats"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."recalculate_session_stats"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."recalculate_session_stats"() TO "postgres";
