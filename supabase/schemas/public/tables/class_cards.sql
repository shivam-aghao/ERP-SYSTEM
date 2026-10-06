CREATE TABLE "public"."class_cards" (
  "id"                  uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "teacher_id"          uuid,
  "department_code"     character varying(20)    NOT NULL,
  "department_name"     character varying(200),
  "class_name"          character varying(50)    NOT NULL,
  "subject_code"        character varying(30)    NOT NULL,
  "subject_name"        character varying(250),
  "card_type"           character varying(20)    DEFAULT 'scheduled'::character varying,
  "replaced_teacher_id" uuid,
  "adjustment_reason"   text,
  "room_number"         character varying(50),
  "time_slot"           character varying(100),
  "color_gradient"      character varying(100)   DEFAULT 'from-blue-600 to-indigo-700'::character varying,
  "display_order"       integer                  DEFAULT 0,
  "is_active"           boolean                  DEFAULT true,
  "created_at"          timestamp with time zone DEFAULT now(),
  "updated_at"          timestamp with time zone DEFAULT now(),
  CONSTRAINT "class_cards_pkey" PRIMARY KEY (id),
  CONSTRAINT "class_cards_teacher_id_department_code_class_name_subject_c_key" UNIQUE (teacher_id, department_code, class_name, subject_code),
  CONSTRAINT "class_cards_department_code_fkey" FOREIGN KEY (department_code) REFERENCES public.departments(code),
  CONSTRAINT "class_cards_replaced_teacher_id_fkey" FOREIGN KEY (replaced_teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL,
  CONSTRAINT "class_cards_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE
);

ALTER TABLE "public"."class_cards"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_class_cards_teacher ON public.class_cards USING btree (teacher_id);

CREATE TRIGGER trg_class_cards_updated_at
  BEFORE UPDATE ON public.class_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Delete class cards" ON "public"."class_cards"
  FOR DELETE
  TO PUBLIC
  USING (true);

CREATE POLICY "Insert class cards" ON "public"."class_cards"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "Read class cards" ON "public"."class_cards"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Update class cards" ON "public"."class_cards"
  FOR UPDATE
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."class_cards" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."class_cards" TO "service_role";

REVOKE ALL ON TABLE "public"."class_cards" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."class_cards" TO "postgres";
