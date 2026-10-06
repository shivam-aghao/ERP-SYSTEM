CREATE TABLE "public"."quiz_attempts" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "quiz_id"            uuid                     NOT NULL,
  "student_id"         uuid,
  "started_at"         timestamp with time zone DEFAULT now(),
  "submitted_at"       timestamp with time zone,
  "time_taken_seconds" integer                  DEFAULT 0,
  "score"              numeric(6,2)             DEFAULT 0.0,
  "accuracy"           numeric(5,2)             DEFAULT 0.0,
  "total_correct"      integer                  DEFAULT 0,
  "total_wrong"        integer                  DEFAULT 0,
  "total_unanswered"   integer                  DEFAULT 0,
  "status"             character varying(20)    DEFAULT 'in_progress'::character varying,
  "created_at"         timestamp with time zone DEFAULT now(),
  "updated_at"         timestamp with time zone DEFAULT now(),
  "attempt_number"     integer                  DEFAULT 1,
  "expires_at"         timestamp with time zone,
  "percentage"         numeric(6,2)             DEFAULT 0,
  "passed"             boolean                  DEFAULT false,
  "correct_count"      integer                  DEFAULT 0,
  "incorrect_count"    integer                  DEFAULT 0,
  "unanswered_count"   integer                  DEFAULT 0,
  CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY (id),
  CONSTRAINT "quiz_attempts_status_check"
    CHECK
    (((status)::text = ANY ((ARRAY['in_progress'::character varying, 'submitted'::character varying, 'auto_submitted'::character varying, 'IN_PROGRESS'::character varying,
    'SUBMITTED'::character varying, 'TIMED_OUT'::character varying])::text[]))),
  CONSTRAINT "quiz_attempts_quiz_id_fkey" FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE
);

ALTER TABLE "public"."quiz_attempts"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX quiz_attempts_quiz_id_idx ON public.quiz_attempts USING btree (quiz_id);

CREATE INDEX quiz_attempts_status_idx ON public.quiz_attempts USING btree (status);

CREATE INDEX quiz_attempts_student_id_idx ON public.quiz_attempts USING btree (student_id);

CREATE POLICY "Anyone can manage attempts" ON "public"."quiz_attempts"
  FOR ALL
  TO PUBLIC
  USING (true);

CREATE POLICY "Students create own attempts" ON "public"."quiz_attempts"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((student_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM (public.quizzes q
     JOIN public.students s ON ((s.class_id = q.class_id)))
  WHERE ((q.id = quiz_attempts.quiz_id) AND (s.id = ( SELECT auth.uid() AS uid)) AND ((q.status)::text = 'PUBLISHED'::text))))));

CREATE POLICY "Students read own attempts" ON "public"."quiz_attempts"
  FOR SELECT
  TO "authenticated"
  USING (((student_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM public.quizzes q
  WHERE ((q.id = quiz_attempts.quiz_id) AND (q.teacher_id = ( SELECT auth.uid() AS uid))))) OR (EXISTS ( SELECT 1
   FROM public.teachers t
  WHERE (t.id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "Students update own attempts" ON "public"."quiz_attempts"
  FOR UPDATE
  TO "authenticated"
  USING ((student_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((student_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "quiz_attempts_public_access" ON "public"."quiz_attempts"
  FOR ALL
  TO PUBLIC
  USING (true)
  WITH CHECK (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."quiz_attempts" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."quiz_attempts" TO "service_role";

REVOKE ALL ON TABLE "public"."quiz_attempts" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."quiz_attempts" TO "postgres";
