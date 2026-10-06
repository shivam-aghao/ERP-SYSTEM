CREATE TABLE "public"."teacher_class_cards" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "teacher_id"      uuid                     NOT NULL,
  "department_code" text                     NOT NULL,
  "class_code"      text                     NOT NULL,
  "subject_code"    text                     NOT NULL,
  "created_at"      timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "teacher_class_cards_pkey" PRIMARY KEY (id),
  CONSTRAINT "teacher_class_cards_teacher_dept_class_sub_key" UNIQUE (teacher_id, department_code, class_code, subject_code)
);

CREATE TRIGGER trg_teacher_class_cards_updated_at
  BEFORE UPDATE ON public.teacher_class_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."teacher_class_cards" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."teacher_class_cards" TO "service_role";

REVOKE ALL ON TABLE "public"."teacher_class_cards" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."teacher_class_cards" TO "postgres";
