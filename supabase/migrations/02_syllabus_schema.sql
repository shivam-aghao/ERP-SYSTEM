-- ==========================================================================
-- Supabase SQL Migration: Syllabus Module Tables and Seed Data
-- Description: Creates tables for syllabus subjects, units, faculty, meta,
--              and documents, with public read access and initial seed data.
-- ==========================================================================

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.syllabus_subjects (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Core',
    credits NUMERIC NOT NULL DEFAULT 3.0,
    faculty_name TEXT,
    short_description TEXT,
    department TEXT DEFAULT 'IT',
    semester TEXT DEFAULT 'Semester V',
    academic_year TEXT DEFAULT '2025-2026',
    syllabus_progress INTEGER DEFAULT 75,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.syllabus_units (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    subject_code TEXT NOT NULL REFERENCES public.syllabus_subjects(code) ON DELETE CASCADE,
    unit_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    hours INTEGER NOT NULL DEFAULT 6,
    topics TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.syllabus_faculty (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT DEFAULT 'IT',
    subjects TEXT,
    email TEXT,
    tag TEXT,
    cabin TEXT DEFAULT 'LH-201',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.syllabus_curriculum_meta (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    subject_code TEXT UNIQUE NOT NULL REFERENCES public.syllabus_subjects(code) ON DELETE CASCADE,
    outcomes TEXT NOT NULL,
    books TEXT NOT NULL,
    scheme TEXT DEFAULT 'Autonomous B.Tech R-2023 / NEP-2020',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.syllabus_documents (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    title TEXT NOT NULL,
    description TEXT,
    document_type TEXT DEFAULT 'Syllabus Regulations',
    file_size TEXT DEFAULT '2.4 MB',
    file_url TEXT NOT NULL,
    department TEXT DEFAULT 'IT',
    semester TEXT DEFAULT 'Semester V',
    updated_date TEXT DEFAULT 'Jan 2026',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS) & Allow Public Read
ALTER TABLE public.syllabus_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_curriculum_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_documents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read for syllabus_subjects') THEN
        CREATE POLICY "Public read for syllabus_subjects" ON public.syllabus_subjects FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read for syllabus_units') THEN
        CREATE POLICY "Public read for syllabus_units" ON public.syllabus_units FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read for syllabus_faculty') THEN
        CREATE POLICY "Public read for syllabus_faculty" ON public.syllabus_faculty FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read for syllabus_curriculum_meta') THEN
        CREATE POLICY "Public read for syllabus_curriculum_meta" ON public.syllabus_curriculum_meta FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read for syllabus_documents') THEN
        CREATE POLICY "Public read for syllabus_documents" ON public.syllabus_documents FOR SELECT USING (true);
    END IF;
END $$;

-- Also allow full access for service_role / anon inserts if desired
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon manage for syllabus_subjects') THEN
        CREATE POLICY "Anon manage for syllabus_subjects" ON public.syllabus_subjects FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon manage for syllabus_units') THEN
        CREATE POLICY "Anon manage for syllabus_units" ON public.syllabus_units FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon manage for syllabus_faculty') THEN
        CREATE POLICY "Anon manage for syllabus_faculty" ON public.syllabus_faculty FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon manage for syllabus_curriculum_meta') THEN
        CREATE POLICY "Anon manage for syllabus_curriculum_meta" ON public.syllabus_curriculum_meta FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon manage for syllabus_documents') THEN
        CREATE POLICY "Anon manage for syllabus_documents" ON public.syllabus_documents FOR ALL USING (true);
    END IF;
END $$;

-- 3. Seed Data

-- Seed syllabus_subjects
INSERT INTO public.syllabus_subjects (id, code, name, type, credits, faculty_name, short_description, department, semester, academic_year, syllabus_progress, pdf_url) VALUES ('d8fcf5da-c7ac-4388-b65d-e806f4eb5a10', '5IT220PC', 'Database Management Systems', 'Core', 3.0, 'M. Faizan I. Khandwani', 'Database systems, SQL, normalization, transactions and indexing.', 'IT', 'Semester V', '2025-2026', 82, 'https://ssgmce.ac.in/academics/syllabus/it-dbms-sem5.pdf') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.syllabus_subjects (id, code, name, type, credits, faculty_name, short_description, department, semester, academic_year, syllabus_progress, pdf_url) VALUES ('1a8f875c-57a8-4db6-bad0-5788d0065d04', '5IT221PC', 'Operating Systems', 'Core', 3.0, 'Sumit Muddalkar', 'Processes, memory management, file systems and OS security.', 'IT', 'Semester V', '2025-2026', 78, 'https://ssgmce.ac.in/academics/syllabus/it-os-sem5.pdf') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.syllabus_subjects (id, code, name, type, credits, faculty_name, short_description, department, semester, academic_year, syllabus_progress, pdf_url) VALUES ('a3f3d255-7ae9-453e-a762-11b265e91979', '5IT222PC', 'Theory of Computation', 'Core', 3.0, 'Sumit Muddalkar', 'Automata, regular languages, grammars, PDA and Turing machines.', 'IT', 'Semester V', '2025-2026', 70, 'https://ssgmce.ac.in/academics/syllabus/it-toc-sem5.pdf') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.syllabus_subjects (id, code, name, type, credits, faculty_name, short_description, department, semester, academic_year, syllabus_progress, pdf_url) VALUES ('95de58f4-9a27-450d-8527-9e2feaef0358', '5IT223PE', 'Data Science & Statistics', 'PE1', 3.0, 'A. S. Manekar', 'Statistics, data analysis, visualization and predictive analytics.', 'IT', 'Semester V', '2025-2026', 85, 'https://ssgmce.ac.in/academics/syllabus/it-ds-sem5.pdf') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.syllabus_subjects (id, code, name, type, credits, faculty_name, short_description, department, semester, academic_year, syllabus_progress, pdf_url) VALUES ('138eafd7-41e8-4a13-9e6a-99fb5605c0af', '5IT227MD', 'Computer Networks', 'MD', 3.0, 'Rahul Patil', 'Networking models, LAN, routing, transport and application protocols.', 'IT', 'Semester V', '2025-2026', 68, 'https://ssgmce.ac.in/academics/syllabus/it-cn-sem5.pdf') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.syllabus_subjects (id, code, name, type, credits, faculty_name, short_description, department, semester, academic_year, syllabus_progress, pdf_url) VALUES ('ac473284-6aa6-416e-bdbe-1439f9aa9d60', '5IT228MD', 'Object Oriented Programming', 'MD', 3.0, 'Sneha Kulkarni', 'Classes, objects, inheritance, polymorphism, collections and design.', 'IT', 'Semester V', '2025-2026', 90, 'https://ssgmce.ac.in/academics/syllabus/it-oop-sem5.pdf') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.syllabus_subjects (id, code, name, type, credits, faculty_name, short_description, department, semester, academic_year, syllabus_progress, pdf_url) VALUES ('8d7234cb-bd8e-4b6c-a767-2d972667d35f', '5IT230OE', 'Fundamentals of Cyber Security', 'OE', 3.0, 'Rohit Joshi', 'Cyber threats, cryptography, network security and secure practices.', 'IT', 'Semester V', '2025-2026', 72, 'https://ssgmce.ac.in/academics/syllabus/it-cs-sem5.pdf') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.syllabus_subjects (id, code, name, type, credits, faculty_name, short_description, department, semester, academic_year, syllabus_progress, pdf_url) VALUES ('17f86c49-86d2-41df-836f-65c8b4ac4d9c', 'CS-301', 'Data Structures & Algorithms', 'Core', 4.0, 'Prof. Rajesh Sharma', 'Advanced data structures, trees, graphs, sorting and asymptotic analysis.', 'CSE', 'Semester V', '2025-2026', 82, 'https://ssgmce.ac.in/academics/syllabus/cse-sem4.pdf') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.syllabus_subjects (id, code, name, type, credits, faculty_name, short_description, department, semester, academic_year, syllabus_progress, pdf_url) VALUES ('ed834c72-4947-47d1-a0b0-d38422bde3a2', 'CS-302', 'Java & Object Oriented Programming', 'Theory + Lab', 3.5, 'Dr. Rohan Deshmukh', 'Object-oriented design patterns, multithreading, collections, and streams.', 'CSE', 'Semester V', '2025-2026', 80, 'https://ssgmce.ac.in/academics/syllabus/cse-sem4.pdf') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.syllabus_subjects (id, code, name, type, credits, faculty_name, short_description, department, semester, academic_year, syllabus_progress, pdf_url) VALUES ('52f5796a-48b2-43c5-bc33-c418892c48dc', 'CS-303', 'Operating Systems Concepts', 'Core Theory', 3.0, 'Prof. Priya Patil', 'Concurrency control, CPU scheduling, virtual memory, and distributed systems.', 'CSE', 'Semester V', '2025-2026', 75, 'https://ssgmce.ac.in/academics/syllabus/cse-sem4.pdf') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.syllabus_subjects (id, code, name, type, credits, faculty_name, short_description, department, semester, academic_year, syllabus_progress, pdf_url) VALUES ('b5cbcc6a-072a-48ae-a4d9-f32b4055873d', 'CS-304', 'Database Management Systems', 'Core Theory + Lab', 4.0, 'Dr. Vikram Joshi', 'Relational algebra, SQL, normal forms, transaction ACID properties.', 'CSE', 'Semester V', '2025-2026', 78, 'https://ssgmce.ac.in/academics/syllabus/cse-sem4.pdf') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.syllabus_subjects (id, code, name, type, credits, faculty_name, short_description, department, semester, academic_year, syllabus_progress, pdf_url) VALUES ('7659422e-bdac-46bb-9ac4-9175a6f6d61e', 'CS-305', 'Computer Networks & Security', 'Core Theory', 3.0, 'Dr. Ananya Sen', 'OSI 7-layer architecture, IP routing, TCP/UDP, TLS/SSL and firewall rules.', 'CSE', 'Semester V', '2025-2026', 65, 'https://ssgmce.ac.in/academics/syllabus/cse-sem4.pdf') ON CONFLICT (code) DO NOTHING;

-- Seed syllabus_faculty
INSERT INTO public.syllabus_faculty (id, name, role, department, subjects, email, tag, cabin, avatar_url) VALUES ('0db882d0-4fe3-4b43-af3b-a93f92337031', 'M. Faizan I. Khandwani', 'Assistant Professor · IT', 'IT', 'Database Management Systems', 'faizankhandwani@ssgmce.ac.in', 'DBMS', 'LH-202', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_faculty (id, name, role, department, subjects, email, tag, cabin, avatar_url) VALUES ('50ea5fe4-0f99-4f52-8610-3d2036e5f24b', 'Sumit Muddalkar', 'Assistant Professor · IT', 'IT', 'Operating Systems · Theory of Computation', 'sumitmuddalkar@gmail.com', 'OS / ToC', 'LH-203', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_faculty (id, name, role, department, subjects, email, tag, cabin, avatar_url) VALUES ('07d25a53-7907-4fa4-bb7d-c0cf5398e430', 'A. S. Manekar', 'Faculty · IT', 'IT', 'Data Science & Statistics', 'faculty@ssgmce.ac.in', 'Data Science', 'LH-205', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_faculty (id, name, role, department, subjects, email, tag, cabin, avatar_url) VALUES ('cedb8401-2861-485a-80f9-956785e64900', 'Rahul Patil', 'Faculty · IT', 'IT', 'Computer Networks', 'faculty@ssgmce.ac.in', 'Networks', 'LH-206', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_faculty (id, name, role, department, subjects, email, tag, cabin, avatar_url) VALUES ('c62fb37a-785c-4b74-8e1b-da5b8197927d', 'Sneha Kulkarni', 'Faculty · IT', 'IT', 'Object Oriented Programming', 'faculty@ssgmce.ac.in', 'OOP', 'LH-207', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_faculty (id, name, role, department, subjects, email, tag, cabin, avatar_url) VALUES ('14b48cbf-e5e6-4d12-b051-2ce3af7a473e', 'Rohit Joshi', 'Faculty · IT', 'IT', 'Fundamentals of Cyber Security', 'faculty@ssgmce.ac.in', 'Cyber Security', 'LH-209', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_faculty (id, name, role, department, subjects, email, tag, cabin, avatar_url) VALUES ('6ead5627-08c0-454f-9cee-1bd0e012d2d0', 'Dr. S. D. Padiya', 'Associate Professor & Head · IT', 'IT', 'Information Technology Department', 'sdpadiya@ssgmce.ac.in', 'HOD', 'HOD Cabin IT', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_faculty (id, name, role, department, subjects, email, tag, cabin, avatar_url) VALUES ('3cf66dfa-f01c-4a96-859c-d748a978575f', 'Prof. Rajesh Sharma', 'Assistant Professor · CSE', 'CSE', 'Data Structures & Algorithms (CS-301)', 'rajesh.sharma@ssgmce.ac.in', 'DSA', 'Cabin LH-201', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_faculty (id, name, role, department, subjects, email, tag, cabin, avatar_url) VALUES ('2b98f1f8-1967-47ea-8f73-d31512295213', 'Dr. Rohan Deshmukh', 'Associate Professor & HOD · CSE', 'CSE', 'Java & Object Oriented Programming (CS-302)', 'rohan.deshmukh@ssgmce.ac.in', 'HOD', 'Cabin LH-204', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_faculty (id, name, role, department, subjects, email, tag, cabin, avatar_url) VALUES ('ee0dc54e-05c4-4e74-afb6-e4b28cfdb4c2', 'Prof. Priya Patil', 'Assistant Professor · CSE', 'CSE', 'Operating Systems Concepts (CS-303)', 'priya.patil@ssgmce.ac.in', 'OS', 'Cabin LH-210', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_faculty (id, name, role, department, subjects, email, tag, cabin, avatar_url) VALUES ('5f7ff9d6-5ca0-4377-8819-b11670e1ee04', 'Dr. Vikram Joshi', 'Assistant Professor · CSE', 'CSE', 'Database Management Systems (CS-304)', 'vikram.joshi@ssgmce.ac.in', 'DBMS', 'Lab 3 Annex', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_faculty (id, name, role, department, subjects, email, tag, cabin, avatar_url) VALUES ('8224f5eb-d1f9-4222-a714-0e7c335db618', 'Dr. Ananya Sen', 'Associate Professor · CSE', 'CSE', 'Computer Networks & Security (CS-305)', 'ananya.sen@ssgmce.ac.in', 'Networks', 'Cabin LH-108', NULL) ON CONFLICT (id) DO NOTHING;

-- Seed syllabus_curriculum_meta
INSERT INTO public.syllabus_curriculum_meta (id, subject_code, outcomes, books, scheme) VALUES ('54fba4b2-64ab-4624-84f8-f0882a83deeb', '5IT220PC', '["Design an ER model", "Write SQL queries", "Apply normalization", "Explain transactions and concurrency"]', '["Silberschatz, Korth & Sudarshan \u2014 Database System Concepts", "Elmasri & Navathe \u2014 Fundamentals of Database Systems"]', 'Autonomous B.Tech R-2023 / NEP-2020') ON CONFLICT (subject_code) DO NOTHING;
INSERT INTO public.syllabus_curriculum_meta (id, subject_code, outcomes, books, scheme) VALUES ('666794f4-c360-47ea-b87d-31ebc89eed27', '5IT221PC', '["Explain OS structures and services", "Apply CPU scheduling techniques", "Explain memory management and virtual memory", "Understand file, storage and protection mechanisms"]', '["Silberschatz, Galvin & Gagne \u2014 Operating System Concepts", "Tanenbaum \u2014 Modern Operating Systems"]', 'Autonomous B.Tech R-2023 / NEP-2020') ON CONFLICT (subject_code) DO NOTHING;
INSERT INTO public.syllabus_curriculum_meta (id, subject_code, outcomes, books, scheme) VALUES ('c065f21f-e139-40b3-b746-ef1be3968ca6', '5IT222PC', '["Construct finite automata", "Use regular expressions and grammars", "Design and analyze pushdown automata", "Explain Turing machines and decidability"]', '["John C. Martin \u2014 Introduction to Languages and the Theory of Computation", "Michael Sipser \u2014 Introduction to the Theory of Computation"]', 'Autonomous B.Tech R-2023 / NEP-2020') ON CONFLICT (subject_code) DO NOTHING;
INSERT INTO public.syllabus_curriculum_meta (id, subject_code, outcomes, books, scheme) VALUES ('e0b450f6-c079-4023-b647-2dfe71705d7f', '5IT223PE', '["Prepare and explore datasets", "Apply statistical techniques", "Create meaningful visualizations", "Interpret data science results"]', '["Wes McKinney \u2014 Python for Data Analysis", "Joel Grus \u2014 Data Science from Scratch"]', 'Autonomous B.Tech R-2023 / NEP-2020') ON CONFLICT (subject_code) DO NOTHING;
INSERT INTO public.syllabus_curriculum_meta (id, subject_code, outcomes, books, scheme) VALUES ('76ccbfa5-c5cb-4aed-8210-072822526c42', '5IT227MD', '["Explain network architectures and protocols", "Understand LAN technologies and routing", "Compare TCP and UDP", "Explain common application layer protocols"]', '["Tanenbaum \u2014 Computer Networks", "Forouzan \u2014 Data Communications and Networking"]', 'Autonomous B.Tech R-2023 / NEP-2020') ON CONFLICT (subject_code) DO NOTHING;
INSERT INTO public.syllabus_curriculum_meta (id, subject_code, outcomes, books, scheme) VALUES ('5b8a348e-2342-479f-bfba-960601439c90', '5IT228MD', '["Apply object-oriented programming concepts", "Use inheritance and polymorphism", "Handle exceptions and files", "Build reusable object-oriented programs"]', '["Herbert Schildt \u2014 Java: The Complete Reference", "Robert C. Martin \u2014 Clean Code"]', 'Autonomous B.Tech R-2023 / NEP-2020') ON CONFLICT (subject_code) DO NOTHING;
INSERT INTO public.syllabus_curriculum_meta (id, subject_code, outcomes, books, scheme) VALUES ('cb1af97d-bd85-4a73-97de-bd9ffaa52e61', '5IT230OE', '["Identify common cyber security threats", "Explain cryptographic techniques", "Understand network security controls", "Apply secure computing practices"]', '["William Stallings \u2014 Cryptography and Network Security", "Easttom \u2014 Computer Security Fundamentals"]', 'Autonomous B.Tech R-2023 / NEP-2020') ON CONFLICT (subject_code) DO NOTHING;
INSERT INTO public.syllabus_curriculum_meta (id, subject_code, outcomes, books, scheme) VALUES ('dabbc8dd-05d8-49e6-9de1-d9c4c4296918', 'CS-301', '["Master core theory and design principles", "Apply algorithmic techniques to engineering problems", "Implement efficient software solutions", "Analyze performance and trade-offs"]', '["Cormen, Leiserson, Rivest, Stein \u2014 Introduction to Algorithms", "Tanenbaum & Bos \u2014 Modern Operating Systems", "Silberschatz \u2014 Database System Concepts"]', 'Autonomous B.Tech R-2023 / SGBAU') ON CONFLICT (subject_code) DO NOTHING;
INSERT INTO public.syllabus_curriculum_meta (id, subject_code, outcomes, books, scheme) VALUES ('6ec5b6a1-f3fa-4240-8437-ebf8bd2f4b52', 'CS-302', '["Master core theory and design principles", "Apply algorithmic techniques to engineering problems", "Implement efficient software solutions", "Analyze performance and trade-offs"]', '["Cormen, Leiserson, Rivest, Stein \u2014 Introduction to Algorithms", "Tanenbaum & Bos \u2014 Modern Operating Systems", "Silberschatz \u2014 Database System Concepts"]', 'Autonomous B.Tech R-2023 / SGBAU') ON CONFLICT (subject_code) DO NOTHING;
INSERT INTO public.syllabus_curriculum_meta (id, subject_code, outcomes, books, scheme) VALUES ('435055d2-cedc-4994-a343-e27a66cda9c1', 'CS-303', '["Master core theory and design principles", "Apply algorithmic techniques to engineering problems", "Implement efficient software solutions", "Analyze performance and trade-offs"]', '["Cormen, Leiserson, Rivest, Stein \u2014 Introduction to Algorithms", "Tanenbaum & Bos \u2014 Modern Operating Systems", "Silberschatz \u2014 Database System Concepts"]', 'Autonomous B.Tech R-2023 / SGBAU') ON CONFLICT (subject_code) DO NOTHING;
INSERT INTO public.syllabus_curriculum_meta (id, subject_code, outcomes, books, scheme) VALUES ('a4c78401-741d-4513-a43e-15a7ba9cbe44', 'CS-304', '["Master core theory and design principles", "Apply algorithmic techniques to engineering problems", "Implement efficient software solutions", "Analyze performance and trade-offs"]', '["Cormen, Leiserson, Rivest, Stein \u2014 Introduction to Algorithms", "Tanenbaum & Bos \u2014 Modern Operating Systems", "Silberschatz \u2014 Database System Concepts"]', 'Autonomous B.Tech R-2023 / SGBAU') ON CONFLICT (subject_code) DO NOTHING;
INSERT INTO public.syllabus_curriculum_meta (id, subject_code, outcomes, books, scheme) VALUES ('f4b1750c-b0ba-4f58-a04c-d80af5d2b47a', 'CS-305', '["Master core theory and design principles", "Apply algorithmic techniques to engineering problems", "Implement efficient software solutions", "Analyze performance and trade-offs"]', '["Cormen, Leiserson, Rivest, Stein \u2014 Introduction to Algorithms", "Tanenbaum & Bos \u2014 Modern Operating Systems", "Silberschatz \u2014 Database System Concepts"]', 'Autonomous B.Tech R-2023 / SGBAU') ON CONFLICT (subject_code) DO NOTHING;

-- Seed syllabus_documents
INSERT INTO public.syllabus_documents (id, title, description, document_type, file_size, file_url, department, semester, updated_date) VALUES ('d5e3a2fc-a330-4c80-9b53-77cdb28b14b4', 'B.Tech Information Technology Semester V Full Syllabus', 'Complete unit breakdown, practical laboratory guidelines, textbooks & credit schemes for Semester V.', 'Official Syllabus', '2.8 MB', 'https://ssgmce.ac.in/academics/syllabus/btech-it-sem5.pdf', 'IT', 'Semester V', 'Jan 2026') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_documents (id, title, description, document_type, file_size, file_url, department, semester, updated_date) VALUES ('8fdc2fe3-b489-47e8-bda3-2567c128d299', 'B.Tech Computer Science Semester VI Full Syllabus', 'Includes complete unit course objectives, textbooks, reference materials & laboratory scheme.', 'Official Syllabus', '2.4 MB', 'https://ssgmce.ac.in/academics/syllabus/cse-sem4.pdf', 'CSE', 'Semester VI', 'Jan 2026') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_documents (id, title, description, document_type, file_size, file_url, department, semester, updated_date) VALUES ('3adf4053-d1d6-4917-82c8-b0fdea5be988', 'Autonomous Academic Examination Scheme & Regulations', 'Official Autonomous academic rules, continuous internal evaluation (CIE) distribution, passing standards & grace marks policy.', 'Regulations', '1.8 MB', 'https://ssgmce.ac.in/academics/regulations/autonomous-rules-r2023.pdf', 'All', 'All', 'Jan 2026') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_documents (id, title, description, document_type, file_size, file_url, department, semester, updated_date) VALUES ('d68aac34-42a9-4d7e-bd9d-ca8a46a8ac69', 'AICTE Model Curriculum & SGBAU Autonomous Ordinance', 'National Education Policy (NEP 2020) compliant curriculum structure with multidisciplinary minor options.', 'Curriculum Scheme', '3.1 MB', 'https://ssgmce.ac.in/academics/ordinance/aicte-sgbau-ordinance.pdf', 'All', 'All', 'Jan 2026') ON CONFLICT (id) DO NOTHING;

-- Seed syllabus_units
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('cbbcc4e7-1cd4-428c-bf01-2ee9120ddb74', '5IT220PC', 1, 'Unit I — Introduction to DBMS', 7, '["Database system concepts and architecture", "Data models and database schemas", "ER model and ER diagrams", "Relational model, keys and constraints", "Relational algebra fundamentals"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('ee0f34be-e080-4029-9c6e-f401493336f0', '5IT220PC', 2, 'Unit II — SQL & Normalization', 8, '["SQL, DDL, DML and DCL", "Operators, aggregate functions, GROUP BY and HAVING", "Joins and nested queries", "Functional dependencies", "1NF, 2NF, 3NF and BCNF"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('6981ed79-7dea-48b3-b1cc-14e16c5d76aa', '5IT220PC', 3, 'Unit III — Transactions & Concurrency', 7, '["Transaction concepts and states", "ACID properties", "Serializability and schedules", "Lock-based concurrency control", "Deadlocks and recovery"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('8de80207-6de7-4991-8d7b-cb43215d308d', '5IT220PC', 4, 'Unit IV — Indexing & Storage', 6, '["File and storage organization", "Primary and secondary indexes", "Dense and sparse indexes", "B-tree and B+ tree", "Hashing techniques"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('e04af50e-269a-4c68-896f-01bc77852394', '5IT220PC', 5, 'Unit V — NoSQL & Emerging Trends', 6, '["Need for NoSQL databases", "Document and key-value databases", "Column-family and graph databases", "Distributed database concepts", "Emerging database technologies"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('1a24ec5a-f14a-411f-8906-6a318773d9b7', '5IT221PC', 1, 'Unit I — OS Basics', 7, '["OS functions and services", "System calls and system programs", "OS structures and architectures", "Processes and process states"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('d22bce4e-7bff-4820-8654-e089d19db585', '5IT221PC', 2, 'Unit II — Process Management', 8, '["CPU scheduling", "Threads", "Inter-process communication", "Process synchronization"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('34e00268-5bdd-43d7-8714-fb4b5c8d2384', '5IT221PC', 3, 'Unit III — Memory Management', 7, '["Contiguous memory allocation", "Paging and segmentation", "Virtual memory", "Page replacement algorithms"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('d020d5e2-2b08-4cd6-bf41-d888963b8e56', '5IT221PC', 4, 'Unit IV — File & Storage', 6, '["File systems", "Directories", "File allocation methods", "Disk scheduling"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('76a89208-8156-426d-9867-bb1d40108e31', '5IT221PC', 5, 'Unit V — Protection & Security', 6, '["Protection mechanisms", "Access control", "Security threats", "Authentication and security"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('9adad55f-bb68-42eb-b85d-d8f9b4a89dc4', '5IT222PC', 1, 'Unit I — Finite Automata', 7, '["Alphabet, strings and languages", "DFA and NFA", "Regular expressions", "Equivalence of automata"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('5ece83ad-44b9-440c-95f6-421087f3592c', '5IT222PC', 2, 'Unit II — Regular Languages', 7, '["Regular grammars", "Closure properties", "Pumping lemma", "Applications of regular languages"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('7b8f51d5-4364-466d-83d9-74b5ef235ee2', '5IT222PC', 3, 'Unit III — Context Free Grammar', 8, '["CFG and derivations", "Parse trees", "Ambiguity", "Normal forms"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('7391ece7-0cb9-4e9b-8204-fc617744f850', '5IT222PC', 4, 'Unit IV — Pushdown Automata', 7, '["Definition of PDA", "Acceptance by PDA", "CFG and PDA equivalence", "Deterministic PDA"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('08b559ad-431c-4a09-b191-cb325c01866c', '5IT222PC', 5, 'Unit V — Turing Machines', 6, '["Turing machine model and languages", "Variants of Turing machines", "Decidability", "Undecidability and complexity basics"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('c296438b-9e38-40c9-9825-41f2ee486b76', '5IT223PE', 1, 'Unit I — Foundations', 7, '["Data science lifecycle", "Data types", "Data collection and cleaning", "Exploratory data analysis"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('458254eb-132d-4b05-a7b0-2632bd38bb26', '5IT223PE', 2, 'Unit II — Statistics', 7, '["Descriptive statistics", "Probability", "Sampling and estimation", "Hypothesis testing"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('3f860fa7-5334-4f39-b9cb-3a2bce94d490', '5IT223PE', 3, 'Unit III — Visualization', 6, '["Principles of data visualization", "Charts and plots", "Dashboards", "Data storytelling"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('67f30f77-dfc7-49f5-adb3-4ff339330b94', '5IT223PE', 4, 'Unit IV — Predictive Analytics', 8, '["Correlation and regression", "Classification", "Model evaluation", "Feature preparation"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('caf5846b-48f6-4783-9bde-b7f9b3fd915a', '5IT223PE', 5, 'Unit V — Practical', 6, '["Python tools for data science", "Case studies", "Ethics in data science", "Communicating analytical results"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('4401acf8-1fd4-4cd7-a6ea-6cd6ca587724', '5IT227MD', 1, 'Unit I — Foundations', 7, '["Network models and protocols", "OSI and TCP/IP models", "Physical layer", "Data link layer"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('5dc5fa8e-9b90-4125-b09c-604d1e78227a', '5IT227MD', 2, 'Unit II — Data Link & LAN', 7, '["Ethernet and switching", "MAC addressing", "Error detection", "Local Area Networks"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('ce49ab7d-8aa8-4377-a8a6-b795dd292148', '5IT227MD', 3, 'Unit III — Network Layer', 8, '["IPv4 and IPv6", "Routing", "ARP and ICMP", "Routing algorithms"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('2df5dca3-2e41-40d2-950b-93794b42e684', '5IT227MD', 4, 'Unit IV — Transport', 7, '["TCP and UDP", "Flow control", "Congestion control", "Ports and sockets"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('10ec205d-31d3-4d27-ac37-0894e3360292', '5IT227MD', 5, 'Unit V — Application', 6, '["DNS and HTTP", "Email protocols", "DHCP", "Common network applications"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('5b73ca1d-d86f-482c-bf0c-599a4d75ad53', '5IT228MD', 1, 'Unit I — OOP Fundamentals', 7, '["Objects and classes", "Encapsulation", "Abstraction", "Constructors and methods"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('ea7eb078-c45a-4b7c-a748-37df38d46145', '5IT228MD', 2, 'Unit II — Inheritance & Polymorphism', 7, '["Types of inheritance", "Method overriding", "Polymorphism", "Interfaces"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('51936d25-a891-4375-aa15-be450aee46ec', '5IT228MD', 3, 'Unit III — Exception & File Handling', 7, '["Exception hierarchy", "Custom exceptions", "Streams and files", "Serialization"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('8e046888-156b-4766-b15d-c1189d375d1a', '5IT228MD', 4, 'Unit IV — Collections & Generics', 7, '["Collection framework", "Lists, sets and maps", "Generics", "Iterators"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('e62fd8da-d3ac-49cd-8bdb-06982ff46fa6', '5IT228MD', 5, 'Unit V — Software Design', 6, '["Packages and modules", "Software design principles", "Reusable components", "Testing"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('63f51adc-4394-42bb-bd15-1e2d23a1b9b8', '5IT230OE', 1, 'Unit I — Foundations', 7, '["Security goals and principles", "Threats and vulnerabilities", "Security policies", "Risk management"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('43645b0a-c786-4819-9c62-a4ef3dd5592f', '5IT230OE', 2, 'Unit II — Cryptography', 7, '["Symmetric cryptography", "Asymmetric cryptography", "Hash functions", "Digital signatures"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('b78ef63c-48e3-402f-9b12-fd161263c90c', '5IT230OE', 3, 'Unit III — Network Security', 7, '["Firewalls", "IDS and IPS", "Secure protocols", "Wireless security"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('ad9091df-77e3-4a53-ba51-27b4fd3a9bde', '5IT230OE', 4, 'Unit IV — Application Security', 7, '["Web security threats", "Authentication and authorization", "Secure coding", "Data protection"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('1f711ba1-dc7f-413e-8047-7a476b965bd6', '5IT230OE', 5, 'Unit V — Cyber Law & Best Practices', 6, '["Cyber security incidents", "Privacy", "Cyber law basics", "Security awareness"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('48ab7248-b5d0-4dd8-a7c7-95146c6dd9e5', 'CS-301', 1, 'Unit I — Foundations & Core Principles', 7, '["Basic concepts and terminology", "Mathematical foundations", "Elementary data representations", "Algorithm efficiency & complexity"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('db9eb7d6-5548-4d3a-86bc-728c962fff9b', 'CS-301', 2, 'Unit II — Core Techniques & Implementation', 8, '["Linear data organization", "Search and sorting algorithms", "Memory management & allocation", "Practical implementations"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('91ddcc3b-c83b-4571-b5d0-31eb1f0ad8f3', 'CS-301', 3, 'Unit III — Advanced Structures & Algorithms', 7, '["Non-linear hierarchical models", "Traversal and graph algorithms", "Dynamic optimization", "Greedy and heuristic approaches"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('d5b6f62a-7a35-4fca-992e-11deb8959a27', 'CS-301', 4, 'Unit IV — System Architecture & Integration', 6, '["Storage formats and serialization", "Index structures and performance", "API design and component contracts", "Security and concurrency primitives"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('77ce53ab-8425-487c-a73d-2f45c28ade84', 'CS-301', 5, 'Unit V — Industrial Applications & Trends', 6, '["Real-world case studies", "Cloud and distributed considerations", "Recent standards and best practices", "Modern software frameworks"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('cb0b6699-7a20-4596-8e72-a36312fa29fe', 'CS-302', 1, 'Unit I — Foundations & Core Principles', 7, '["Basic concepts and terminology", "Mathematical foundations", "Elementary data representations", "Algorithm efficiency & complexity"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('4da1ffe5-4dc6-4298-8873-48ddad8b5e80', 'CS-302', 2, 'Unit II — Core Techniques & Implementation', 8, '["Linear data organization", "Search and sorting algorithms", "Memory management & allocation", "Practical implementations"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('d6294b19-c471-442d-8bcc-518eb6860395', 'CS-302', 3, 'Unit III — Advanced Structures & Algorithms', 7, '["Non-linear hierarchical models", "Traversal and graph algorithms", "Dynamic optimization", "Greedy and heuristic approaches"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('ab28504a-dda3-4dfd-9d7c-c367503525de', 'CS-302', 4, 'Unit IV — System Architecture & Integration', 6, '["Storage formats and serialization", "Index structures and performance", "API design and component contracts", "Security and concurrency primitives"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('4b913da0-0d8e-4325-944c-35359ba2978c', 'CS-302', 5, 'Unit V — Industrial Applications & Trends', 6, '["Real-world case studies", "Cloud and distributed considerations", "Recent standards and best practices", "Modern software frameworks"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('222e9d3e-0cb4-4d83-88c9-0ba144d7cff1', 'CS-303', 1, 'Unit I — Foundations & Core Principles', 7, '["Basic concepts and terminology", "Mathematical foundations", "Elementary data representations", "Algorithm efficiency & complexity"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('903900c8-9160-4b97-bee3-3702795177b5', 'CS-303', 2, 'Unit II — Core Techniques & Implementation', 8, '["Linear data organization", "Search and sorting algorithms", "Memory management & allocation", "Practical implementations"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('f7ce98a4-8713-4c57-9f0c-6a76b2969993', 'CS-303', 3, 'Unit III — Advanced Structures & Algorithms', 7, '["Non-linear hierarchical models", "Traversal and graph algorithms", "Dynamic optimization", "Greedy and heuristic approaches"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('d7ca7771-cb8b-4d2d-94e6-e810b022b328', 'CS-303', 4, 'Unit IV — System Architecture & Integration', 6, '["Storage formats and serialization", "Index structures and performance", "API design and component contracts", "Security and concurrency primitives"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('65b1fb15-bdc6-45e8-b5c6-95cb3ac1d851', 'CS-303', 5, 'Unit V — Industrial Applications & Trends', 6, '["Real-world case studies", "Cloud and distributed considerations", "Recent standards and best practices", "Modern software frameworks"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('14ce74a7-905a-4055-9981-eaacfbf55647', 'CS-304', 1, 'Unit I — Foundations & Core Principles', 7, '["Basic concepts and terminology", "Mathematical foundations", "Elementary data representations", "Algorithm efficiency & complexity"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('4ccd55c9-2442-43d6-80ce-f40a28b6950c', 'CS-304', 2, 'Unit II — Core Techniques & Implementation', 8, '["Linear data organization", "Search and sorting algorithms", "Memory management & allocation", "Practical implementations"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('023f9297-3c41-4415-8d99-9b741b6b8f6a', 'CS-304', 3, 'Unit III — Advanced Structures & Algorithms', 7, '["Non-linear hierarchical models", "Traversal and graph algorithms", "Dynamic optimization", "Greedy and heuristic approaches"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('62f122a9-d320-490f-8e7a-075a79998d27', 'CS-304', 4, 'Unit IV — System Architecture & Integration', 6, '["Storage formats and serialization", "Index structures and performance", "API design and component contracts", "Security and concurrency primitives"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('8de4529d-6182-449d-a919-b863a4ea7489', 'CS-304', 5, 'Unit V — Industrial Applications & Trends', 6, '["Real-world case studies", "Cloud and distributed considerations", "Recent standards and best practices", "Modern software frameworks"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('31d4c935-8ce9-4f2f-b54a-05e945d9979f', 'CS-305', 1, 'Unit I — Foundations & Core Principles', 7, '["Basic concepts and terminology", "Mathematical foundations", "Elementary data representations", "Algorithm efficiency & complexity"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('5a24770a-7788-42d1-9abe-2f93c83cc10b', 'CS-305', 2, 'Unit II — Core Techniques & Implementation', 8, '["Linear data organization", "Search and sorting algorithms", "Memory management & allocation", "Practical implementations"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('bda5a7b2-532d-424f-a7ee-f2d4a5cdce65', 'CS-305', 3, 'Unit III — Advanced Structures & Algorithms', 7, '["Non-linear hierarchical models", "Traversal and graph algorithms", "Dynamic optimization", "Greedy and heuristic approaches"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('43a3bdc4-a9bd-4da8-bc16-e7de77fed5ac', 'CS-305', 4, 'Unit IV — System Architecture & Integration', 6, '["Storage formats and serialization", "Index structures and performance", "API design and component contracts", "Security and concurrency primitives"]') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.syllabus_units (id, subject_code, unit_number, title, hours, topics) VALUES ('bd603dad-0680-4751-a192-99fe9030741e', 'CS-305', 5, 'Unit V — Industrial Applications & Trends', 6, '["Real-world case studies", "Cloud and distributed considerations", "Recent standards and best practices", "Modern software frameworks"]') ON CONFLICT (id) DO NOTHING;