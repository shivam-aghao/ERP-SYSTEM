import urllib.request, json, ctypes, sqlite3, uuid
from ctypes import wintypes

class CREDENTIAL(ctypes.Structure):
    _fields_ = [
        ('Flags', wintypes.DWORD), ('Type', wintypes.DWORD), ('TargetName', wintypes.LPWSTR),
        ('Comment', wintypes.LPWSTR), ('LastWritten', wintypes.FILETIME), ('CredentialBlobSize', wintypes.DWORD),
        ('CredentialBlob', ctypes.POINTER(ctypes.c_char)), ('Persist', wintypes.DWORD),
        ('AttributeCount', wintypes.DWORD), ('Attributes', ctypes.c_void_p),
        ('TargetAlias', wintypes.LPWSTR), ('UserName', wintypes.LPWSTR)
    ]

advapi32 = ctypes.windll.advapi32
cred_ptr = ctypes.POINTER(CREDENTIAL)()
advapi32.CredReadW('LegacyGeneric:target=Supabase CLI:supabase', 1, 0, ctypes.byref(cred_ptr))
token = ctypes.string_at(cred_ptr.contents.CredentialBlob, cred_ptr.contents.CredentialBlobSize).decode('utf-8')

def run_query(sql):
    req = urllib.request.Request(
        'https://api.supabase.com/v1/projects/gftqvclenyplnuoocbwe/database/query',
        data=json.dumps({'query': sql}).encode('utf-8'),
        headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

courses = [
    {
        'code': '5CS220PC', 'name': 'Database Management Systems', 'short': 'DBMS', 'credits': 3.0, 'sem': 'V', 'type': 'Core Theory',
        'faculty': 'Dr. J. M. Patil', 'desig': 'Assistant Professor', 'email': 'emp-cse-1001@ssgmce.ac.in', 'cabin': 'CSE Cabin 201', 'progress': 65,
        'outcomes': [
            'Design entity-relationship models and relational schemas for real-world enterprise databases.',
            'Formulate complex SQL queries including joins, nested queries, aggregate functions, and views.',
            'Apply relational database design theories and normalization (1NF, 2NF, 3NF, BCNF) to eliminate redundancies.',
            'Understand ACID transactions, concurrency control protocols, and database recovery techniques.'
        ],
        'books': [
            'Abraham Silberschatz, Henry Korth, S. Sudarshan — Database System Concepts (7th Edition, McGraw-Hill)',
            'Ramez Elmasri, Shamkant B. Navathe — Fundamentals of Database Systems (7th Edition, Pearson)'
        ],
        'units': [
            (1, 'Unit I · Database Architecture & ER Modeling', 7, ['Database system concepts', 'Data models and schemas', 'ER diagrams', 'Relational constraints']),
            (2, 'Unit II · SQL & Relational Algebra', 8, ['DDL, DML, DCL commands', 'Joins and nested subqueries', 'Views and triggers', 'Relational algebra operations']),
            (3, 'Unit III · Normalization & Schema Refinement', 7, ['Functional dependencies', '1NF, 2NF, 3NF', 'Boyce-Codd Normal Form (BCNF)', 'Multi-valued dependencies']),
            (4, 'Unit IV · Transactions & Concurrency Control', 8, ['ACID properties', 'Schedules & serializability', 'Two-Phase Locking (2PL)', 'Deadlock detection & recovery']),
            (5, 'Unit V · Storage, Indexing & NoSQL Systems', 6, ['File organization', 'B-Trees and B+ Trees hashing', 'Introduction to NoSQL and MongoDB architecture'])
        ]
    },
    {
        'code': '5CS221PC', 'name': 'Compiler Design', 'short': 'CD', 'credits': 4.0, 'sem': 'V', 'type': 'Core Theory',
        'faculty': 'Dr. N. M. Kandoi', 'desig': 'Assistant Professor', 'email': 'emp-cse-1002@ssgmce.ac.in', 'cabin': 'CSE Cabin 202', 'progress': 58,
        'outcomes': [
            'Understand the phases of a compiler and build lexical analyzers using regular expressions.',
            'Design top-down and bottom-up parsers (LL, LR, LALR) for context-free grammars.',
            'Generate syntax-directed translations and three-address intermediate code representations.',
            'Implement basic block control flow graphs, code optimizations, and target machine code generation.'
        ],
        'books': [
            'Alfred V. Aho, Monica S. Lam, Ravi Sethi, Jeffrey D. Ullman — Compilers: Principles, Techniques, and Tools (Dragon Book)',
            'Kenneth C. Louden — Compiler Construction: Principles and Practice (Cengage Learning)'
        ],
        'units': [
            (1, 'Unit I · Lexical Analysis & Finite Automata', 7, ['Compiler phases overview', 'Regular expressions and Lex', 'DFA and NFA construction', 'Lexical errors']),
            (2, 'Unit II · Syntax Analysis & Parsing', 8, ['Context-free grammars', 'Top-down parsing (Recursive Descent, LL(1))', 'Bottom-up parsing (Shift-Reduce, LR(0), SLR(1))', 'LALR and CLR parsers']),
            (3, 'Unit III · Syntax-Directed Translation & Semantics', 7, ['Syntax-directed definitions (SDD)', 'Attribute grammars (S-attributed, L-attributed)', 'Type checking', 'Symbol table management']),
            (4, 'Unit IV · Intermediate Code Generation', 7, ['Three-address code', 'Quadruples, triples, indirect triples', 'Control flow translation', 'Boolean expressions']),
            (5, 'Unit V · Code Optimization & Generation', 7, ['Principal sources of optimization', 'Basic blocks and flow graphs', 'Loop optimization', 'Target machine code generation'])
        ]
    },
    {
        'code': '5CS222PC', 'name': 'Computer Architecture & Organization', 'short': 'CAO', 'credits': 3.0, 'sem': 'V', 'type': 'Core Theory',
        'faculty': 'Prof. R. V. Deshmukh', 'desig': 'Assistant Professor', 'email': 'emp-cse-1009@ssgmce.ac.in', 'cabin': 'CSE Cabin 205', 'progress': 60,
        'outcomes': [
            'Analyze modern processor architectures, instruction sets, and addressing modes.',
            'Evaluate instruction pipelining, pipeline hazards, and superscalar execution.',
            'Analyze memory hierarchy design, cache mapping techniques, and virtual memory systems.',
            'Understand multi-core architectures, parallel processing paradigms, and interconnection networks.'
        ],
        'books': [
            'David A. Patterson, John L. Hennessy — Computer Organization and Design: RISC-V Edition (Morgan Kaufmann)',
            'William Stallings — Computer Organization and Architecture: Designing for Performance (Pearson)'
        ],
        'units': [
            (1, 'Unit I · Digital Logic & Computer Evolution', 6, ['Von Neumann architecture', 'Instruction execution cycle', 'Bus interconnection', 'Addressing modes']),
            (2, 'Unit II · Central Processing Unit & ALU', 7, ['Integer and floating-point arithmetic', 'ALU design', 'Instruction formats', 'RISC vs CISC concepts']),
            (3, 'Unit III · Pipelining & Instruction-Level Parallelism', 8, ['Basic 5-stage pipeline', 'Data, structural, control hazards', 'Branch prediction', 'Superscalar processors']),
            (4, 'Unit IV · Memory Hierarchy & Cache Design', 8, ['Cache memory mapping (Direct, Associative, Set-associative)', 'Cache replacement policies', 'Virtual memory and TLB', 'Main memory technologies']),
            (5, 'Unit V · I/O Organization & Parallel Architectures', 7, ['Programmed I/O, Interrupt-driven I/O, DMA', 'Multicore processors', 'Flynn classification', 'Cache coherence (MESI)'])
        ]
    },
    {
        'code': '5CS223PE', 'name': 'Data Science and Statistics', 'short': 'DSS', 'credits': 3.0, 'sem': 'V', 'type': 'Professional Elective',
        'faculty': 'Dr. R. A. Zamare', 'desig': 'Assistant Professor', 'email': 'emp-cse-1008@ssgmce.ac.in', 'cabin': 'CSE Cabin 204', 'progress': 70,
        'outcomes': [
            'Understand foundational probability distributions and inferential statistical testing.',
            'Perform exploratory data analysis (EDA), data wrangling, and feature transformations in Python.',
            'Formulate hypothesis testing (t-test, ANOVA, Chi-square) for engineering data.',
            'Develop predictive regression models and classification analytics pipelines.'
        ],
        'books': [
            'Jake VanderPlas — Python Data Science Handbook (O\'Reilly Media)',
            'Gareth James, Daniela Witten, Trevor Hastie, Robert Tibshirani — An Introduction to Statistical Learning (Springer)'
        ],
        'units': [
            (1, 'Unit I · Foundations of Probability & Random Variables', 7, ['Sample space and probability rules', 'Discrete & continuous distributions (Binomial, Poisson, Normal)', 'Central Limit Theorem']),
            (2, 'Unit II · Descriptive Statistics & Exploratory Data Analysis', 7, ['Measures of central tendency & dispersion', 'Covariance and correlation', 'Data cleaning & outlier treatment', 'Data visualization']),
            (3, 'Unit III · Statistical Inference & Hypothesis Testing', 8, ['Point estimation and confidence intervals', 'Null and alternate hypotheses', 'p-values, Z-test, t-test, Paired t-test', 'Chi-Square and ANOVA']),
            (4, 'Unit IV · Regression Modeling & Analytics', 7, ['Simple and multiple linear regression', 'Assumptions of OLS regression', 'Regularization (Ridge, Lasso)', 'Model evaluation (R-squared, RMSE)']),
            (5, 'Unit V · Practical Data Science Workflows', 7, ['Data pipeline orchestration', 'Feature engineering techniques', 'Dimensionality reduction (PCA)', 'Real-world case studies in Python'])
        ]
    },
    {
        'code': '5CS224PC', 'name': 'Database Management Systems-LAB', 'short': 'DBMS Lab', 'credits': 1.5, 'sem': 'V', 'type': 'Core Practical',
        'faculty': 'Dr. J. M. Patil', 'desig': 'Assistant Professor', 'email': 'emp-cse-1001@ssgmce.ac.in', 'cabin': 'CSE Lab 1', 'progress': 80,
        'outcomes': [
            'Execute SQL DDL and DML commands to create relational database structures.',
            'Formulate nested subqueries, views, stored procedures, and triggers in PostgreSQL/MySQL.',
            'Develop a full-stack database application connecting Python/Node.js with PostgreSQL.'
        ],
        'books': ['PostgreSQL Official Documentation', 'MySQL 8.0 Reference Manual'],
        'units': [
            (1, 'Experiment 1-4: DDL, DML & Key Constraints', 10, ['Table creation with PK/FK constraints', 'Data manipulation commands', 'Complex WHERE filters']),
            (2, 'Experiment 5-8: Joins, Nested Queries & Aggregate Analysis', 12, ['Inner, Left, Right, Full Outer Joins', 'Subqueries with IN, EXISTS', 'GROUP BY and HAVING clauses']),
            (3, 'Experiment 9-12: Stored Procedures, Triggers & Mini-Project', 14, ['PL/pgSQL stored procedures', 'Row-level and statement-level triggers', 'Full database application integration'])
        ]
    },
    {
        'code': '5CS225PC', 'name': 'Compiler Design_LAB', 'short': 'CD Lab', 'credits': 1.5, 'sem': 'V', 'type': 'Core Practical',
        'faculty': 'Dr. N. M. Kandoi', 'desig': 'Assistant Professor', 'email': 'emp-cse-1002@ssgmce.ac.in', 'cabin': 'CSE Lab 2', 'progress': 75,
        'outcomes': [
            'Implement lexical analysis programs using Flex/Lex tools.',
            'Develop parsing specifications using Bison/Yacc for arithmetic and syntax grammars.',
            'Generate intermediate code and construct syntax trees for programming constructs.'
        ],
        'books': ['John Levine — flex & bison (O\'Reilly Media)'],
        'units': [
            (1, 'Experiment 1-4: Lexical Analyzer with Lex/Flex', 10, ['Pattern matching for C tokens', 'Counting lines, words, characters', 'Lex specification design']),
            (2, 'Experiment 5-8: Syntax Parsers with Yacc/Bison', 12, ['Grammar validation for arithmetic expressions', 'Abstract syntax tree generation', 'Shift-reduce conflict debugging']),
            (3, 'Experiment 9-12: Intermediate Code & Mini Compiler', 14, ['Three-address code generation', 'Evaluation of infix/postfix notations', 'Target code assembly translation'])
        ]
    },
    {
        'code': '3CS201PC', 'name': 'Data Structures & Algorithms', 'short': 'DSA', 'credits': 4.0, 'sem': 'III', 'type': 'Core Theory',
        'faculty': 'Dr. V. S. Mahalle', 'desig': 'Assistant Professor', 'email': 'emp-cse-1004@ssgmce.ac.in', 'cabin': 'CSE Cabin 203', 'progress': 72,
        'outcomes': [
            'Analyze computational asymptotic complexity using Big-O, Omega, and Theta notations.',
            'Implement linear data structures including linked lists, stacks, and queues.',
            'Apply non-linear structures (binary search trees, AVL trees, graphs) to solve computing problems.',
            'Synthesize divide-and-conquer, greedy, dynamic programming, and backtracking algorithms.'
        ],
        'books': [
            'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein — Introduction to Algorithms (CLRS)',
            'Mark Allen Weiss — Data Structures and Algorithm Analysis in C++ (Pearson)'
        ],
        'units': [
            (1, 'Unit I · Algorithm Analysis & Linear Data Structures', 7, ['Asymptotic notation', 'Arrays and linked lists', 'Stacks and queues applications', 'Infix to postfix conversion']),
            (2, 'Unit II · Trees & Binary Search Trees', 8, ['Binary tree traversals', 'Binary search trees (BST)', 'AVL balanced trees', 'B-Trees and Heaps']),
            (3, 'Unit III · Graph Algorithms', 8, ['Graph representations', 'BFS and DFS traversal', 'Minimum Spanning Trees (Prim, Kruskal)', 'Shortest Path (Dijkstra, Bellman-Ford)']),
            (4, 'Unit IV · Sorting, Searching & Hashing', 7, ['Divide and conquer sorting (Merge, Quick)', 'Hash functions and collision resolution', 'Universal hashing']),
            (5, 'Unit V · Dynamic Programming & Greedy Algorithms', 6, ['Greedy choice property (Huffman, Fractional Knapsack)', 'Dynamic programming (0/1 Knapsack, LCS)', 'Backtracking'])
        ]
    },
    {
        'code': '3CS202PC', 'name': 'Object Oriented Programming with Java', 'short': 'OOP Java', 'credits': 4.0, 'sem': 'III', 'type': 'Core Theory',
        'faculty': 'Prof. C. M. Mankar', 'desig': 'Assistant Professor', 'email': 'emp-cse-1003@ssgmce.ac.in', 'cabin': 'CSE Cabin 202', 'progress': 70,
        'outcomes': [
            'Apply object-oriented paradigms: encapsulation, inheritance, polymorphism, and abstraction.',
            'Handle runtime exceptions and design multi-threaded concurrent Java applications.',
            'Utilize the Java Collections Framework (List, Set, Map) and Streams for processing.',
            'Build interactive desktop and web services using modern Java features.'
        ],
        'books': [
            'Herbert Schildt — Java: The Complete Reference (McGraw-Hill)',
            'Joshua Bloch — Effective Java (Addison-Wesley)'
        ],
        'units': [
            (1, 'Unit I · Java Fundamentals & OOP Architecture', 7, ['JVM, JRE, JDK architecture', 'Classes, objects, constructors', 'Access specifiers', 'Static keyword and memory']),
            (2, 'Unit II · Inheritance, Interfaces & Packages', 8, ['Types of inheritance', 'Method overriding & dynamic dispatch', 'Abstract classes & interfaces', 'Package structure']),
            (3, 'Unit III · Exception Handling & Multithreading', 8, ['Try-catch-finally mechanisms', 'Custom exception creation', 'Thread lifecycle', 'Synchronization & inter-thread communication']),
            (4, 'Unit IV · Java Collections & Generics', 7, ['Generics classes and methods', 'ArrayList, LinkedList, Vector', 'HashSet, TreeSet', 'HashMap, TreeMap']),
            (5, 'Unit V · File I/O, Lambdas & Modern Java', 6, ['Byte and Character Streams', 'Lambda expressions', 'Stream API filter/map/reduce', 'Serialization'])
        ]
    },
    {
        'code': '3CS204PC', 'name': 'Operating Systems', 'short': 'OS', 'credits': 4.0, 'sem': 'III', 'type': 'Core Theory',
        'faculty': 'Prof. K. P. Sable', 'desig': 'Assistant Professor', 'email': 'emp-cse-1006@ssgmce.ac.in', 'cabin': 'CSE Cabin 203', 'progress': 68,
        'outcomes': [
            'Explain core operating system structures, system calls, and dual-mode CPU operations.',
            'Analyze process scheduling algorithms and synchronization primitives (Semaphores, Mutex).',
            'Model deadlock conditions, avoidance algorithms (Banker\'s), and recovery mechanisms.',
            'Evaluate memory management schemes including paging, segmentation, and virtual memory.'
        ],
        'books': [
            'Abraham Silberschatz, Peter B. Galvin, Greg Gagne — Operating System Concepts (Wiley)',
            'Andrew S. Tanenbaum, Herbert Bos — Modern Operating Systems (Pearson)'
        ],
        'units': [
            (1, 'Unit I · Operating System Architecture', 7, ['Services and system calls', 'OS structures (Monolithic, Microkernel)', 'Dual mode operation', 'Bootstrapping']),
            (2, 'Unit II · Process Management & CPU Scheduling', 8, ['Process states and PCB', 'FCFS, SJF, Priority, Round Robin scheduling', 'Multi-threading models', 'Thread pools']),
            (3, 'Unit III · Process Synchronization & Deadlocks', 8, ['Critical-Section problem', 'Peterson\'s solution, Mutex, Semaphores', 'Deadlock conditions and prevention', 'Banker\'s algorithm']),
            (4, 'Unit IV · Memory Management & Virtual Memory', 7, ['Contiguous allocation', 'Paging and page table structures', 'Virtual memory demand paging', 'Page replacement (FIFO, LRU, Optimal)']),
            (5, 'Unit V · Storage & File Systems', 6, ['File access methods and directory structure', 'File allocation methods', 'Disk scheduling (FCFS, SSTF, SCAN, C-SCAN)', 'RAID architectures'])
        ]
    },
    {
        'code': '3CS205MD', 'name': 'Computer Networks', 'short': 'Networks', 'credits': 3.0, 'sem': 'III', 'type': 'Core Theory',
        'faculty': 'Prof. S. B. Pagrut', 'desig': 'Assistant Professor', 'email': 'emp-cse-1007@ssgmce.ac.in', 'cabin': 'CSE Cabin 204', 'progress': 75,
        'outcomes': [
            'Understand OSI 7-layer and TCP/IP protocol reference models.',
            'Analyze error detection/correction mechanisms and data link flow control protocols.',
            'Design IPv4/IPv6 subnetting schemes and evaluate routing protocols (OSPF, BGP).',
            'Examine transport layer reliability (TCP handshakes, congestion control) and application protocols (HTTP, DNS).'
        ],
        'books': [
            'Andrew S. Tanenbaum, David J. Wetherall — Computer Networks (Pearson)',
            'James F. Kurose, Keith W. Ross — Computer Networking: A Top-Down Approach (Pearson)'
        ],
        'units': [
            (1, 'Unit I · Network Models & Physical Layer', 6, ['OSI reference model vs TCP/IP', 'Network topologies', 'Transmission media', 'Switching (Circuit, Packet)']),
            (2, 'Unit II · Data Link Layer & MAC Protocols', 7, ['Framing and error detection (CRC)', 'Sliding window protocols', 'Ethernet IEEE 802.3 standard', 'CSMA/CD and CSMA/CA']),
            (3, 'Unit III · Network Layer & IP Addressing', 8, ['IPv4 addressing and subnetting (CIDR)', 'IPv6 transition', 'Routing algorithms (Distance Vector, Link State)', 'OSPF and BGP overview']),
            (4, 'Unit IV · Transport Layer Protocols', 8, ['UDP vs TCP operations', 'Three-way handshake connection establishment', 'Flow control (sliding window)', 'TCP congestion control algorithms']),
            (5, 'Unit V · Application Layer Services & Security', 7, ['Domain Name System (DNS)', 'HTTP/1.1, HTTP/2, and HTTPS', 'Email protocols (SMTP, POP3, IMAP)', 'Firewalls and network security basics'])
        ]
    },
    {
        'code': '7KS01', 'name': 'Cloud Computing', 'short': 'CC', 'credits': 3.0, 'sem': 'VII', 'type': 'Core Theory',
        'faculty': 'Prof. S. M. Jawake', 'desig': 'Assistant Professor', 'email': 'emp-cse-1010@ssgmce.ac.in', 'cabin': 'CSE Cabin 205', 'progress': 82,
        'outcomes': [
            'Evaluate cloud delivery models (IaaS, PaaS, SaaS) and deployment archetypes.',
            'Understand server virtualization technologies (Type-1/Type-2 Hypervisors, Containers, Docker).',
            'Architect scalable cloud infrastructure utilizing load balancing, auto-scaling, and cloud storage.',
            'Formulate cloud security governance, data privacy, and SLA policies.'
        ],
        'books': [
            'Rajkumar Buyya, Christian Vecchiola, S. Thamarai Selvi — Mastering Cloud Computing (McGraw-Hill)',
            'Thomas Erl, Zaigham Mahmood, Ricardo Puttini — Cloud Computing: Concepts, Technology & Architecture (Prentice Hall)'
        ],
        'units': [
            (1, 'Unit I · Cloud Computing Fundamentals', 6, ['NIST cloud computing definition', 'Cloud service models (IaaS, PaaS, SaaS)', 'Public, Private, Hybrid cloud deployment', 'Economics of cloud']),
            (2, 'Unit II · Virtualization Architecture', 7, ['Hypervisor architecture (KVM, ESXi)', 'Virtual machines vs Linux containers', 'Docker container lifecycle', 'Storage & network virtualization']),
            (3, 'Unit III · Cloud Infrastructure & Resource Management', 8, ['Elastic compute services', 'Object storage vs Block storage (S3, EBS)', 'Load balancing algorithms', 'Auto-scaling groups']),
            (4, 'Unit IV · Cloud Security & Governance', 8, ['Shared responsibility model', 'Identity and Access Management (IAM)', 'Data encryption in transit & rest', 'SLA agreements & monitoring']),
            (5, 'Unit V · Serverless Computing & Emerging Trends', 7, ['Function as a Service (FaaS / AWS Lambda)', 'Kubernetes orchestration basics', 'Edge computing and Multi-cloud strategy'])
        ]
    },
    {
        'code': '7KS02', 'name': 'Data Warehousing & Mining', 'short': 'DWM', 'credits': 3.0, 'sem': 'VII', 'type': 'Core Theory',
        'faculty': 'Prof. T. A. Puranik', 'desig': 'Assistant Professor', 'email': 'emp-cse-1011@ssgmce.ac.in', 'cabin': 'CSE Cabin 205', 'progress': 80,
        'outcomes': [
            'Design data warehouse multidimensional schemas (Star, Snowflake, Fact Constellation).',
            'Formulate OLAP slicing, dicing, drilling, and pivoting analytical queries.',
            'Apply association rule mining algorithms (Apriori, FP-Growth) on transaction data.',
            'Develop classification and clustering models for big data discovery.'
        ],
        'books': [
            'Jiawei Han, Micheline Kamber, Jian Pei — Data Mining: Concepts and Techniques (Morgan Kaufmann)',
            'Paulraj Ponniah — Data Warehousing Fundamentals: A Comprehensive Guide for IT Professionals (Wiley)'
        ],
        'units': [
            (1, 'Unit I · Data Warehouse Architecture & Modeling', 7, ['Operational databases vs Data warehouses', 'Multidimensional data models', 'Star schema, Snowflake schema, Fact constellation', 'Data cubes']),
            (2, 'Unit II · OLAP Technologies & ETL Processing', 7, ['MOLAP, ROLAP, HOLAP engines', 'OLAP operations (Roll-up, Drill-down, Slice, Dice, Pivot)', 'ETL extraction, transformation, loading pipelines']),
            (3, 'Unit III · Data Preprocessing & Association Rule Mining', 8, ['Data cleaning, integration, reduction, discretization', 'Market basket analysis', 'Apriori algorithm for frequent itemsets', 'FP-Growth tree algorithm']),
            (4, 'Unit IV · Classification & Prediction Modeling', 7, ['Decision Tree induction (ID3, C4.5)', 'Bayesian classification (Naive Bayes)', 'Rule-based classification', 'Evaluating model accuracy (Confusion matrix, ROC)']),
            (5, 'Unit V · Clustering Analysis & Modern Trends', 7, ['Partitioning methods (k-Means, k-Medoids)', 'Hierarchical clustering (Agglomerative, Divisive)', 'Density-based clustering (DBSCAN)', 'Web and Text mining overview'])
        ]
    }
]

print("Populating Supabase & SQLite subject_syllabus and curriculum_units...")

# Supabase inserts
for c in courses:
    outcomes_str = json.dumps(c['outcomes']).replace("'", "''")
    books_str = json.dumps(c['books']).replace("'", "''")
    s_sql = f"""
    INSERT INTO public.subject_syllabus 
    (subject_code, subject_name, short_name, department_code, semester, credits, subject_type, faculty_name, faculty_designation, faculty_email, faculty_cabin, syllabus_progress, course_outcomes, reference_books)
    VALUES (
        '{c['code']}', '{c['name']}', '{c['short']}', 'CSE', '{c['sem']}', {c['credits']}, '{c['type']}',
        '{c['faculty']}', '{c['desig']}', '{c['email']}', '{c['cabin']}', {c['progress']},
        '{outcomes_str}'::jsonb,
        '{books_str}'::jsonb
    )
    ON CONFLICT (subject_code) DO UPDATE SET
        subject_name = EXCLUDED.subject_name,
        faculty_name = EXCLUDED.faculty_name,
        syllabus_progress = EXCLUDED.syllabus_progress,
        course_outcomes = EXCLUDED.course_outcomes,
        reference_books = EXCLUDED.reference_books;
    """
    run_query(s_sql)

    # Insert units
    run_query(f"DELETE FROM public.curriculum_units WHERE subject_code = '{c['code']}';")
    for u in c['units']:
        topics_str = json.dumps(u[3]).replace("'", "''")
        u_sql = f"""
        INSERT INTO public.curriculum_units (subject_code, unit_number, unit_title, planned_hours, topics)
        VALUES ('{c['code']}', {u[0]}, '{u[1]}', {u[2]}, '{topics_str}'::jsonb);
        """
        run_query(u_sql)

print("Supabase insertion complete!")

# Sync to SQLite erp.db
con = sqlite3.connect('backend/erp.db')
con.execute('DROP TABLE IF EXISTS curriculum_units;')
con.execute('''CREATE TABLE curriculum_units (
    id TEXT PRIMARY KEY,
    subject_code TEXT,
    unit_number INTEGER,
    unit_title TEXT,
    planned_hours INTEGER,
    topics TEXT
);''')

con.execute('DROP TABLE IF EXISTS subject_syllabus;')
con.execute('''CREATE TABLE subject_syllabus (
    id TEXT PRIMARY KEY,
    subject_code TEXT UNIQUE,
    subject_name TEXT,
    short_name TEXT,
    department_code TEXT,
    semester TEXT,
    academic_year TEXT,
    credits REAL,
    subject_type TEXT,
    faculty_name TEXT,
    faculty_designation TEXT,
    faculty_email TEXT,
    faculty_cabin TEXT,
    syllabus_progress INTEGER,
    university_curriculum_code TEXT,
    curriculum_pdf_url TEXT,
    course_outcomes TEXT,
    reference_books TEXT
);''')

for c in courses:
    sid = str(uuid.uuid4())
    pdf_url = f"https://ssgmce.ac.in/academics/syllabus/cse-sem{c['sem']}.pdf"
    con.execute('''INSERT INTO subject_syllabus 
    (id, subject_code, subject_name, short_name, department_code, semester, academic_year, credits, subject_type, faculty_name, faculty_designation, faculty_email, faculty_cabin, syllabus_progress, university_curriculum_code, curriculum_pdf_url, course_outcomes, reference_books)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''', (
        sid, c['code'], c['name'], c['short'], 'CSE', c['sem'], '2026-2027', c['credits'], c['type'],
        c['faculty'], c['desig'], c['email'], c['cabin'], c['progress'],
        'SGBAU-AUTONOMOUS-CSE-2026', pdf_url,
        json.dumps(c['outcomes']), json.dumps(c['books'])
    ))
    for u in c['units']:
        con.execute('''INSERT INTO curriculum_units 
        (id, subject_code, unit_number, unit_title, planned_hours, topics)
        VALUES (?, ?, ?, ?, ?, ?)''', (
            str(uuid.uuid4()), c['code'], u[0], u[1], u[2], json.dumps(u[3])
        ))

con.commit()
print("SQLite erp.db synced successfully!")
print("Total subjects in subject_syllabus:", con.execute('SELECT count(*) FROM subject_syllabus').fetchone()[0])
print("Total units in curriculum_units:", con.execute('SELECT count(*) FROM curriculum_units').fetchone()[0])

