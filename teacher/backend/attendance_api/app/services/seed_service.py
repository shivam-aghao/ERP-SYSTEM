import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.db_models import (
    Department, Class, Subject, Teacher, ClassCard, Student, Notification
)
from app.utils.security import hash_password

logger = logging.getLogger("erp_fastapi")

STUDENTS_CSE_DATA = [
    (1, "308979", "Ku. Aarti Ganesh Kawle", False),
    (2, "308652", "Ku. Anuja Bhagwan Garmode", False),
    (3, "308668", "Ku. Anushri Sachin Chavan", False),
    (4, "308596", "Ku. Apurva Prashant Jagtap", False),
    (5, "308615", "Ku. Arpita Satish Mourya", False),
    (6, "308667", "Ku. Dhanashri Santosh Jain", False),
    (7, "308877", "Ku. Divya Naresh Joshi", False),
    (8, "309089", "Ku. Dolly Girishkumarji Bhutada", False),
    (9, "308653", "Ku. Gargi Manoj Mane", False),
    (10, "308834", "Ku. Gouri Pramodrao Deshmukh", False),
    (11, "308746", "Ku. Jiya Jitendra Kamble", False),
    (12, "308835", "Ku. Krushna Suresh Falke", False),
    (13, "308843", "Ku. Pallavi Ganesh Tade", False),
    (14, "309044", "Ku. Ritika Manojkumar Chaudhari", False),
    (15, "308648", "Ku. Sakshi Jitendra Wagh", False),
    (16, "308699", "Ku. Saloni Anil Ghodkhande", False),
    (17, "309012", "Ku. Samiksha Bhujangrao Deshmukh", False),
    (18, "308636", "Ku. Sanchita Ranjit Gawande", False),
    (19, "308677", "Ku. Sayyad Ummehani Asharaf ali", False),
    (20, "308958", "Ku. Shrishti Rajendra Ingale", False),
    (21, "308803", "Ku. Shrushti Ketan Raninga", False),
    (22, "308611", "Ku. Shruti Prakash Bhute", False),
    (23, "308620", "Ku. Snehal Uday Rangankar", False),
    (24, "308597", "Ku. Suhana Harishankar Tiwari", False),
    (25, "308626", "Ku. Tanushri Shirish Kharche", False),
    (26, "309017", "Ku. Tanvi Amol Bichare", False),
    (27, "308684", "Ku. Vaishnavi Ramesh Tale", False),
    (28, "308666", "Abhishek Ajabrao Nirmal", False),
    (29, "308646", "Aditya Sanjay Nagre", False),
    (30, "308887", "Anurag Dhananjay Nagzirkar", False),
    (31, "308628", "Armaan Ramprakash Gupta", False),
    (32, "308785", "Aryan Anil Bobade", False),
    (33, "308954", "Atharv Pradip Sonone", False),
    (34, "308641", "Atharva Umesh Deshmukh", False),
    (35, "308845", "Devesh Girish Talatule", False),
    (36, "308621", "Divyansh Vijay Mate", False),
    (37, "308712", "Dnyaneshwar Raju Bajad", False),
    (38, "309067", "Dnyaneshwar Sunil Deshmukh", False),
    (39, "308594", "Ganesh Dilip Bari", False),
    (40, "308660", "Jagdish Shaligram Bodade", False),
    (41, "308933", "Kartik Bhaskar Hande", False),
    (42, "308748", "Krushana Vitthal Kharsade", False),
    (43, "308661", "Mandar Mukesh Dhamodhar", False),
    (44, "308963", "Manthan Gajanan Morey", False),
    (45, "308629", "Mayuresh Subhash Guhe", True),
    (46, "308643", "Nandan Dilip Kulat", False),
    (47, "308768", "Nikhil Rameshwar Zode", False),
    (48, "308874", "Parth Kiran Jadhav", False),
    (49, "308736", "Pavan Sheshrao Gaikwad", False),
    (50, "308962", "Prajwal Baban Ghawat", False),
    (51, "308602", "Prajwal Himmatrao Virokar", False),
    (52, "308657", "Pranav Bhagwat Gadhave", False),
    (53, "308649", "Pranav Rajesh Dhurde", False),
    (54, "308655", "Rahul Bhashkar Pagrut", False),
    (55, "309090", "Rajveer singh Paramjit singh Popli", False),
    (56, "308794", "Rushikesh Satish Bhawarkar", False),
    (57, "308840", "Sanskar Vijay Dahatre", False),
    (58, "308769", "Satya Sandeep Patil", True),
    (59, "308671", "Saurav Ananta Dhage", False),
    (60, "308637", "Shivam Sanjay Aghao", False),
    (61, "308593", "Shubh Prashant Chandore", False),
    (62, "308960", "Soham Madhukar Patil", False),
    (63, "308862", "Sujal Milind Agame", False),
    (64, "308944", "Sujal Sailendra Patiye", False),
    (65, "308981", "Sumit Subodh Hinge", False),
    (66, "308619", "Swraj Anil Harne", False),
    (67, "308870", "Tushar Gajendra Chatare", False),
    (68, "308676", "Tushar Shankar Patole", False),
    (69, "308645", "Vedant Suryakant Tayade", False),
]

def seed_database(db: Session):
    """Seed initial master data, students, teacher, and cards."""
    # 1. Departments
    dept_map = {}
    default_departments = [
        {"code": "CSE", "name": "Computer Science & Engineering", "icon": "💻", "classes_count": 4, "desc": "Department of Computer Science & Engineering"},
        {"code": "IT", "name": "Information Technology", "icon": "🌐", "classes_count": 4, "desc": "Department of Information Technology"},
        {"code": "ASH", "name": "Applied Sciences & Humanities", "icon": "🔬", "classes_count": 4, "desc": "Applied Sciences & Humanities (First Year)"},
        {"code": "MECH", "name": "Mechanical Engineering", "icon": "⚙️", "classes_count": 4, "desc": "Department of Mechanical Engineering"},
        {"code": "EE", "name": "Electrical Engineering", "icon": "⚡", "classes_count": 4, "desc": "Department of Electrical Engineering"},
        {"code": "ENTC", "name": "Electronics & Telecommunication", "icon": "📡", "classes_count": 4, "desc": "Department of Electronics & Telecommunication"},
    ]

    for d in default_departments:
        dept = db.query(Department).filter_by(code=d["code"]).first()
        if not dept:
            dept = Department(
                code=d["code"],
                name=d["name"],
                icon=d["icon"],
                classes_count=d["classes_count"],
                description=d["desc"]
            )
            db.add(dept)
            db.flush()
        dept_map[d["code"]] = dept

    # 2. Classes
    classes_data = {
        "CSE": [
            ("2R1", "2nd Year - Sem 3", "Div 1", "Lab 301 / Hall A", 60),
            ("2R2", "2nd Year - Sem 3", "Div 2", "Hall B", 60),
            ("3R",  "3rd Year - Sem 5", "Div 1", "Hall C", 69),
            ("4R",  "4th Year - Sem 7", "Div 1", "Seminar Hall", 58),
        ],
        "IT": [
            ("2N1", "2nd Year - Sem 3", "Div 1", "IT Lab 1", 60),
            ("2N2", "2nd Year - Sem 3", "Div 2", "IT Lab 2", 60),
            ("3N",  "3rd Year - Sem 5", "Div 1", "Classroom 204", 60),
            ("4N",  "4th Year - Sem 7", "Div 1", "Classroom 205", 55),
        ],
        "EE": [
            ("2S1", "2nd Year - Sem 3", "Div 1", "Power Lab", 60),
            ("2S2", "2nd Year - Sem 3", "Div 2", "Circuits Lab", 58),
            ("3S",  "3rd Year - Sem 5", "Div 1", "Classroom 108", 56),
            ("4S",  "4th Year - Sem 7", "Div 1", "Control Lab", 54),
        ],
        "MECH": [
            ("2M1", "2nd Year - Sem 3", "Div 1", "Workshop Hall", 60),
            ("2M2", "2nd Year - Sem 3", "Div 2", "Thermodynamics Lab", 60),
            ("3M",  "3rd Year - Sem 5", "Div 1", "CAD Lab", 58),
            ("4M",  "4th Year - Sem 7", "Div 1", "Classroom 302", 52),
        ],
        "ENTC": [
            ("2E1", "2nd Year - Sem 3", "Div 1", "DSP Lab", 60),
            ("2E2", "2nd Year - Sem 3", "Div 2", "VLSI Lab", 60),
            ("3E",  "3rd Year - Sem 5", "Div 1", "Classroom 401", 58),
            ("4E",  "4th Year - Sem 7", "Div 1", "Classroom 402", 50),
        ],
        "ASH": [
            ("1A", "1st Year - Sem 1", "Div 1", "Classroom 101", 60),
            ("1B", "1st Year - Sem 1", "Div 2", "Classroom 102", 60),
            ("1C", "1st Year - Sem 1", "Div 3", "Classroom 103", 60),
            ("1D", "1st Year - Sem 1", "Div 4", "Classroom 104", 60),
        ]
    }

    class_map = {}
    for code, cls_list in classes_data.items():
        dept = dept_map.get(code)
        if not dept:
            continue
        for name, yr, div, rm, strength in cls_list:
            cls = db.query(Class).filter_by(department_id=dept.id, name=name).first()
            if not cls:
                cls = Class(
                    department_id=dept.id,
                    name=name,
                    academic_year="2025-26",
                    semester=int(name[0]) if name[0].isdigit() else 1,
                    division=div,
                    room=rm,
                    total_students=strength
                )
                db.add(cls)
                db.flush()
            class_map[f"{code}_{name}"] = cls

    # 3. Subjects
    subjects_data = [
        ("CSE", "CS301", "Discrete Mathematics", 3, "THEORY"),
        ("CSE", "CS302", "Data Structures", 3, "THEORY"),
        ("CSE", "CS303", "Java Programming", 3, "PRACTICAL"),
        ("CSE", "CS305", "Database Management", 5, "THEORY"),
        ("CSE", "CS501", "Computer Networks", 5, "THEORY"),
        ("CSE", "CS502", "Operating Systems", 5, "THEORY"),
        ("IT", "IT301", "Web Technologies", 3, "THEORY"),
        ("IT", "IT302", "Software Engineering", 3, "THEORY"),
        ("IT", "IT501", "Cloud Computing", 5, "THEORY"),
        ("EE", "EE301", "Network Analysis", 3, "THEORY"),
        ("MECH", "ME301", "Fluid Mechanics", 3, "THEORY"),
        ("ENTC", "EC301", "Signals & Systems", 3, "THEORY"),
    ]

    subj_map = {}
    for code, scode, sname, sem, stype in subjects_data:
        dept = dept_map.get(code)
        if not dept:
            continue
        subj = db.query(Subject).filter_by(department_id=dept.id, code=scode).first()
        if not subj:
            subj = Subject(
                department_id=dept.id,
                code=scode,
                name=sname,
                semester=sem,
                type=stype
            )
            db.add(subj)
            db.flush()
        subj_map[scode] = subj

    # 4. Teacher (Dr. J.M.Patil)
    cse_dept = dept_map.get("CSE")
    teacher = db.query(Teacher).filter_by(emp_code="EMP-CSE-1042").first()
    if not teacher:
        teacher = Teacher(
            full_name="Dr. J.M.Patil",
            emp_code="EMP-CSE-1042",
            email="jm.patil@ssgmce.ac.in",
            password_hash=hash_password("password123"),
            designation="Associate Professor",
            department_id=cse_dept.id if cse_dept else None,
            phone="+91 98765 43210",
            avatar="RS"
        )
        db.add(teacher)
        db.flush()

    # 5. Students for CSE 3R (including Roll 60 Shivam Sanjay Aghao)
    cls_3r = class_map.get("CSE_3R")
    if cls_3r:
        for roll, code, name, prov in STUDENTS_CSE_DATA:
            st = db.query(Student).filter_by(student_code=code).first()
            if not st:
                st = Student(
                    class_id=cls_3r.id,
                    roll_no=roll,
                    student_code=code,
                    full_name=name,
                    is_provisional=prov
                )
                db.add(st)
        db.flush()

    # Students for other classes (e.g. 2R1, 2R2)
    cls_2r1 = class_map.get("CSE_2R1")
    if cls_2r1 and db.query(Student).filter_by(class_id=cls_2r1.id).count() == 0:
        for r in range(1, 41):
            db.add(Student(
                class_id=cls_2r1.id,
                roll_no=r,
                student_code=f"3070{r:02d}",
                full_name=f"Student 2R1-{r:02d}",
                is_provisional=False
            ))
        db.flush()

    # 6. Default Class Cards for Teacher
    card_defs = [
        {"class_key": "CSE_3R", "subj_code": "CS305", "room": "Hall C", "color": "from-blue-600 to-indigo-700", "order": 1},
        {"class_key": "CSE_2R1", "subj_code": "CS303", "room": "Lab 301 / Hall A", "color": "from-indigo-600 to-purple-700", "order": 2},
        {"class_key": "CSE_2R2", "subj_code": "CS302", "room": "Hall B", "color": "from-teal-600 to-emerald-700", "order": 3},
    ]

    for c in card_defs:
        cls_obj = class_map.get(c["class_key"])
        subj_obj = subj_map.get(c["subj_code"])
        if cls_obj and subj_obj and cse_dept:
            existing_card = db.query(ClassCard).filter_by(
                teacher_id=teacher.id,
                class_id=cls_obj.id,
                subject_id=subj_obj.id
            ).first()
            if not existing_card:
                db.add(ClassCard(
                    teacher_id=teacher.id,
                    department_id=cse_dept.id,
                    class_id=cls_obj.id,
                    subject_id=subj_obj.id,
                    room_number=c["room"],
                    color_gradient=c["color"],
                    sort_order=c["order"]
                ))

    # 7. Notifications
    if db.query(Notification).filter_by(teacher_id=teacher.id).count() == 0:
        db.add(Notification(
            teacher_id=teacher.id,
            title="Active Semester 2025-26",
            message="Welcome to Odd Semester 2025-26. Attendance portal is active for daily submission.",
            type="INFO"
        ))
        db.add(Notification(
            teacher_id=teacher.id,
            title="Timetable Updated",
            message="CSE-3R Database Management lectures scheduled on Mon, Wed, Fri at 10:00 AM.",
            type="SUCCESS"
        ))
        db.add(Notification(
            teacher_id=teacher.id,
            title="Monthly Defaulter Review",
            message="Reminder: Students with attendance below 75% require counseling before mid-term exams.",
            type="WARNING"
        ))

    db.commit()
    logger.info("Database seeding completed successfully.")
