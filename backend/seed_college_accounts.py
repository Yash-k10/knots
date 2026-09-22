import asyncio
from sqlalchemy import select

import app.core.base  # noqa: F401
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.profiles.models.profile import Profile
from app.users.models.role import Role
from app.users.models.user import User

PASSWORD_DEFAULT = "pass@knots"

ACCOUNTS = [
    # ─── CSE STUDENTS (10) ───────────────────────────────────────────────────
    # 4th Year (grad 2025)
    {
        "email": "student1.cse@sbjit.edu.in",
        "role": "Student",
        "first_name": "Aarav",
        "last_name": "Sharma",
        "department": "Computer Science & Engineering",
        "graduation_year": 2025,
        "bio": "Final year CSE student specializing in distributed cloud systems and full-stack development.",
        "headline": "Final Year CSE Student | Cloud & Full-Stack",
        "skills": ["Python", "FastAPI", "React", "Docker", "PostgreSQL"],
    },
    {
        "email": "student2.cse@sbjit.edu.in",
        "role": "Student",
        "first_name": "Priya",
        "last_name": "Patel",
        "department": "Computer Science & Engineering",
        "graduation_year": 2025,
        "bio": "4th year CSE student passionate about web technologies and open source contributions.",
        "headline": "Final Year CSE Student | Frontend Architect",
        "skills": ["TypeScript", "Next.js", "TailwindCSS", "Node.js", "GraphQL"],
    },
    {
        "email": "student3.cse@sbjit.edu.in",
        "role": "Student",
        "first_name": "Rohan",
        "last_name": "Verma",
        "department": "Computer Science & Engineering",
        "graduation_year": 2025,
        "bio": "Final year CSE student focusing on high performance algorithms and competitive programming.",
        "headline": "Final Year CSE Student | Competitive Programmer",
        "skills": ["C++", "Java", "Data Structures", "Algorithms", "System Design"],
    },
    # 3rd Year (grad 2026)
    {
        "email": "student4.cse@sbjit.edu.in",
        "role": "Student",
        "first_name": "Ananya",
        "last_name": "Iyer",
        "department": "Computer Science & Engineering",
        "graduation_year": 2026,
        "bio": "3rd year CSE student interested in backend engineering and database optimization.",
        "headline": "Third Year CSE Student | Backend Enthusiast",
        "skills": ["Python", "Django", "SQL", "Redis", "Git"],
    },
    {
        "email": "student5.cse@sbjit.edu.in",
        "role": "Student",
        "first_name": "Aditya",
        "last_name": "Joshi",
        "department": "Computer Science & Engineering",
        "graduation_year": 2026,
        "bio": "3rd year CSE student exploring cloud computing, microservices, and DevOps automation.",
        "headline": "Third Year CSE Student | DevOps Explorer",
        "skills": ["Docker", "Kubernetes", "Linux", "AWS", "Bash"],
    },
    {
        "email": "student6.cse@sbjit.edu.in",
        "role": "Student",
        "first_name": "Sneha",
        "last_name": "Kulkarni",
        "department": "Computer Science & Engineering",
        "graduation_year": 2026,
        "bio": "3rd year CSE student eager to build scalable web applications and intuitive user interfaces.",
        "headline": "Third Year CSE Student | Web Developer",
        "skills": ["React", "JavaScript", "Python", "MongoDB", "Figma"],
    },
    # 2nd Year (grad 2027)
    {
        "email": "student7.cse@sbjit.edu.in",
        "role": "Student",
        "first_name": "Tanmay",
        "last_name": "Deshmukh",
        "department": "Computer Science & Engineering",
        "graduation_year": 2027,
        "bio": "2nd year CSE student building foundational strengths in core computer science and web tech.",
        "headline": "Second Year CSE Student | Aspiring Software Engineer",
        "skills": ["Java", "Python", "HTML/CSS", "JavaScript", "SQL"],
    },
    {
        "email": "student8.cse@sbjit.edu.in",
        "role": "Student",
        "first_name": "Riya",
        "last_name": "Gupta",
        "department": "Computer Science & Engineering",
        "graduation_year": 2027,
        "bio": "2nd year CSE student enthusiastic about problem solving, hackathons, and software engineering.",
        "headline": "Second Year CSE Student | Hackathon Enthusiast",
        "skills": ["C", "C++", "Python", "Web Design", "Git"],
    },
    {
        "email": "student9.cse@sbjit.edu.in",
        "role": "Student",
        "first_name": "Harsh",
        "last_name": "Mehta",
        "department": "Computer Science & Engineering",
        "graduation_year": 2027,
        "bio": "2nd year CSE student active in tech clubs and competitive coding.",
        "headline": "Second Year CSE Student | Tech Club Lead",
        "skills": ["Java", "Data Structures", "Object Oriented Programming", "MySQL"],
    },
    {
        "email": "student10.cse@sbjit.edu.in",
        "role": "Student",
        "first_name": "Pooja",
        "last_name": "Nair",
        "department": "Computer Science & Engineering",
        "graduation_year": 2027,
        "bio": "2nd year CSE student passionate about collaborative coding, UI/UX, and web development.",
        "headline": "Second Year CSE Student | UI/UX & Web",
        "skills": ["React", "HTML5", "CSS3", "JavaScript", "Python"],
    },
    # ─── CSE FACULTY (4) ─────────────────────────────────────────────────────
    {
        "email": "faculty1.cse@sbjit.edu.in",
        "role": "Faculty",
        "first_name": "Dr. Rajesh",
        "last_name": "Kumar",
        "department": "Computer Science & Engineering",
        "bio": "Assistant Professor in CSE. Research in distributed systems, networking, and cloud architectures.",
        "headline": "Assistant Professor, CSE | PhD in Distributed Systems",
        "skills": [
            "Cloud Computing",
            "Computer Networks",
            "Distributed Systems",
            "Linux",
        ],
    },
    {
        "email": "faculty2.cse@sbjit.edu.in",
        "role": "Faculty",
        "first_name": "Prof. Sunita",
        "last_name": "Rao",
        "department": "Computer Science & Engineering",
        "bio": "Associate Professor in CSE. Specializing in Database Management Systems and Software Engineering.",
        "headline": "Associate Professor, CSE | DBMS & Software Engineering",
        "skills": [
            "Database Systems",
            "Software Engineering",
            "SQL",
            "Agile Methodology",
        ],
    },
    {
        "email": "faculty3.cse@sbjit.edu.in",
        "role": "Faculty",
        "first_name": "Dr. Vikram",
        "last_name": "Patil",
        "department": "Computer Science & Engineering",
        "bio": "Assistant Professor in CSE. Mentoring student capstones in cybersecurity and secure coding.",
        "headline": "Assistant Professor, CSE | Cybersecurity & Cryptography",
        "skills": [
            "Information Security",
            "Network Security",
            "Ethical Hacking",
            "Python",
        ],
    },
    {
        "email": "faculty4.cse@sbjit.edu.in",
        "role": "Faculty",
        "first_name": "Prof. Neha",
        "last_name": "Deshpande",
        "department": "Computer Science & Engineering",
        "bio": "Assistant Professor in CSE. Leading web technologies lab and campus programming contests.",
        "headline": "Assistant Professor, CSE | Web Tech Lab In-charge",
        "skills": ["Web Technologies", "Java Programming", "Object Oriented Design"],
    },
    # ─── CSE HOD (1) ─────────────────────────────────────────────────────────
    {
        "email": "hod.cse@sbjit.edu.in",
        "role": "HOD",
        "first_name": "Dr. Arvind",
        "last_name": "Sharma",
        "department": "Computer Science & Engineering",
        "bio": "Professor & Head of Computer Science & Engineering Department. Leading academic excellence, research initiatives, and student career mentorship.",
        "headline": "Head of Department (HOD) - Computer Science & Engineering",
        "skills": [
            "Academic Leadership",
            "Curriculum Design",
            "Research Mentorship",
            "Distributed Systems",
        ],
    },
    # ─── CSE CONTROLLER (1) ──────────────────────────────────────────────────
    {
        "email": "controller.cse@sbjit.edu.in",
        "role": "Controller",
        "first_name": "Prof. Amit",
        "last_name": "Saxena",
        "department": "Computer Science & Engineering",
        "bio": "Department Controller & Associate Professor in CSE. Managing departmental operations, student compliance, event moderation, and student leadership appointments.",
        "headline": "Department Controller - Computer Science & Engineering",
        "skills": [
            "Department Administration",
            "Event Management",
            "Compliance & Moderation",
            "Mentorship",
        ],
    },
    # ─── CSE ALUMNI (5) ──────────────────────────────────────────────────────
    {
        "email": "alumni1.cse@sbjit.edu.in",
        "role": "Alumni",
        "first_name": "Kunal",
        "last_name": "Shinde",
        "department": "Computer Science & Engineering",
        "graduation_year": 2023,
        "bio": "Software Development Engineer at Microsoft. Alumnus class of 2023. Happy to mentor juniors for campus placement and tech interviews.",
        "headline": "SDE-2 at Microsoft | SBJIT CSE Alumnus (2023)",
        "skills": ["C#", ".NET", "Azure", "System Design", "Mentorship"],
    },
    {
        "email": "alumni2.cse@sbjit.edu.in",
        "role": "Alumni",
        "first_name": "Meera",
        "last_name": "Bhatt",
        "department": "Computer Science & Engineering",
        "graduation_year": 2022,
        "bio": "Cloud Infrastructure Engineer at Amazon Web Services (AWS). Class of 2022. Helping students with cloud architecture certifications.",
        "headline": "Cloud Engineer at AWS | SBJIT CSE Alumna (2022)",
        "skills": ["AWS", "Terraform", "Kubernetes", "DevOps", "Python"],
    },
    {
        "email": "alumni3.cse@sbjit.edu.in",
        "role": "Alumni",
        "first_name": "Siddharth",
        "last_name": "Jain",
        "department": "Computer Science & Engineering",
        "graduation_year": 2021,
        "bio": "Senior Backend Engineer at Razorpay. Class of 2021. Actively sharing job referrals and reviewing student resumes.",
        "headline": "Senior Backend Engineer at Razorpay | CSE Alumnus (2021)",
        "skills": ["Go", "Kafka", "PostgreSQL", "FinTech", "Referrals"],
    },
    {
        "email": "alumni4.cse@sbjit.edu.in",
        "role": "Alumni",
        "first_name": "Divya",
        "last_name": "Wagh",
        "department": "Computer Science & Engineering",
        "graduation_year": 2023,
        "bio": "Full Stack Engineer at Google India. Passionate about scalable web systems, UX performance, and women in tech mentoring.",
        "headline": "Software Engineer at Google | CSE Alumna (2023)",
        "skills": ["JavaScript", "TypeScript", "React", "Python", "GCP"],
    },
    {
        "email": "alumni5.cse@sbjit.edu.in",
        "role": "Alumni",
        "first_name": "Akash",
        "last_name": "Mohite",
        "department": "Computer Science & Engineering",
        "graduation_year": 2020,
        "bio": "Data Platform Architect at Uber. Class of 2020. Conducting guest lectures and placement guidance for final year engineering students.",
        "headline": "Staff Data Engineer at Uber | CSE Alumnus (2020)",
        "skills": [
            "Apache Spark",
            "Big Data",
            "Distributed Computing",
            "Java",
            "Mentorship",
        ],
    },
    # ─── CSE(AIML) STUDENTS (10) ─────────────────────────────────────────────
    # 4th Year (grad 2025)
    {
        "email": "student1.aiml@sbjit.edu.in",
        "role": "Student",
        "first_name": "Aryan",
        "last_name": "Kapoor",
        "department": "Artificial Intelligence & Machine Learning",
        "graduation_year": 2025,
        "bio": "Final year AIML student focusing on Large Language Models, generative AI pipelines, and model evaluation.",
        "headline": "Final Year AIML Student | Generative AI & LLMs",
        "skills": ["PyTorch", "HuggingFace", "Python", "FastAPI", "Vector DBs"],
    },
    {
        "email": "student2.aiml@sbjit.edu.in",
        "role": "Student",
        "first_name": "Isha",
        "last_name": "Sen",
        "department": "Artificial Intelligence & Machine Learning",
        "graduation_year": 2025,
        "bio": "4th year AIML student researching Computer Vision and real-time medical image segmentation models.",
        "headline": "Final Year AIML Student | Computer Vision Researcher",
        "skills": ["OpenCV", "PyTorch", "TensorFlow", "YOLO", "Python"],
    },
    {
        "email": "student3.aiml@sbjit.edu.in",
        "role": "Student",
        "first_name": "Varun",
        "last_name": "Malhotra",
        "department": "Artificial Intelligence & Machine Learning",
        "graduation_year": 2025,
        "bio": "Final year AIML student building end-to-end MLOps deployment pipelines and scalable API inference servers.",
        "headline": "Final Year AIML Student | MLOps & Production AI",
        "skills": ["MLflow", "Docker", "Kubernetes", "FastAPI", "AWS SageMaker"],
    },
    # 3rd Year (grad 2026)
    {
        "email": "student4.aiml@sbjit.edu.in",
        "role": "Student",
        "first_name": "Mehak",
        "last_name": "Chawla",
        "department": "Artificial Intelligence & Machine Learning",
        "graduation_year": 2026,
        "bio": "3rd year AIML student fascinated by Natural Language Processing and speech recognition models.",
        "headline": "Third Year AIML Student | NLP Enthusiast",
        "skills": ["NLP", "NLTK", "Transformers", "Python", "Pandas"],
    },
    {
        "email": "student5.aiml@sbjit.edu.in",
        "role": "Student",
        "first_name": "Dev",
        "last_name": "Singhania",
        "department": "Artificial Intelligence & Machine Learning",
        "graduation_year": 2026,
        "bio": "3rd year AIML student specializing in reinforcement learning and intelligent robotics simulations.",
        "headline": "Third Year AIML Student | Robotics & RL",
        "skills": ["Reinforcement Learning", "Python", "Gymnasium", "ROS", "PyTorch"],
    },
    {
        "email": "student6.aiml@sbjit.edu.in",
        "role": "Student",
        "first_name": "Shreya",
        "last_name": "Ghoshal",
        "department": "Artificial Intelligence & Machine Learning",
        "graduation_year": 2026,
        "bio": "3rd year AIML student with a passion for predictive analytics and data science visualization.",
        "headline": "Third Year AIML Student | Data Science & Analytics",
        "skills": ["Scikit-Learn", "Matplotlib", "Seaborn", "SQL", "Python"],
    },
    # 2nd Year (grad 2027)
    {
        "email": "student7.aiml@sbjit.edu.in",
        "role": "Student",
        "first_name": "Kabir",
        "last_name": "Bedi",
        "department": "Artificial Intelligence & Machine Learning",
        "graduation_year": 2027,
        "bio": "2nd year AIML student mastering machine learning fundamentals, statistics, and linear algebra.",
        "headline": "Second Year AIML Student | ML Fundamentals",
        "skills": ["Python", "NumPy", "Pandas", "Linear Algebra", "Calculus"],
    },
    {
        "email": "student8.aiml@sbjit.edu.in",
        "role": "Student",
        "first_name": "Simran",
        "last_name": "Kaur",
        "department": "Artificial Intelligence & Machine Learning",
        "graduation_year": 2027,
        "bio": "2nd year AIML student exploring neural networks and modern deep learning frameworks.",
        "headline": "Second Year AIML Student | Deep Learning Explorer",
        "skills": ["Python", "PyTorch Basics", "Data Analysis", "Jupyter"],
    },
    {
        "email": "student9.aiml@sbjit.edu.in",
        "role": "Student",
        "first_name": "Ayush",
        "last_name": "Roy",
        "department": "Artificial Intelligence & Machine Learning",
        "graduation_year": 2027,
        "bio": "2nd year AIML student interested in AI-driven web apps and intelligent automation.",
        "headline": "Second Year AIML Student | AI Web Developer",
        "skills": ["Python", "JavaScript", "React", "Flask", "SQL"],
    },
    {
        "email": "student10.aiml@sbjit.edu.in",
        "role": "Student",
        "first_name": "Kriti",
        "last_name": "Sanon",
        "department": "Artificial Intelligence & Machine Learning",
        "graduation_year": 2027,
        "bio": "2nd year AIML student passionate about ethical AI, bias detection in algorithms, and machine learning.",
        "headline": "Second Year AIML Student | Ethical AI Advocate",
        "skills": ["Python", "Scikit-Learn", "Statistics", "Data Storytelling"],
    },
    # ─── CSE(AIML) FACULTY (4) ───────────────────────────────────────────────
    {
        "email": "faculty1.aiml@sbjit.edu.in",
        "role": "Faculty",
        "first_name": "Dr. Pradeep",
        "last_name": "Mishra",
        "department": "Artificial Intelligence & Machine Learning",
        "bio": "Associate Professor in AIML. Leading Advanced AI lab with focus on foundation models and multimodal learning.",
        "headline": "Associate Professor, AIML | Lead - AI Research Lab",
        "skills": ["Deep Learning", "Multimodal AI", "PyTorch", "Model Fine-Tuning"],
    },
    {
        "email": "faculty2.aiml@sbjit.edu.in",
        "role": "Faculty",
        "first_name": "Prof. Kavita",
        "last_name": "Rao",
        "department": "Artificial Intelligence & Machine Learning",
        "bio": "Assistant Professor in AIML. Specializing in computer vision algorithms, visual tracking, and autonomous navigation.",
        "headline": "Assistant Professor, AIML | Computer Vision Specialist",
        "skills": ["Computer Vision", "Object Detection", "Image Processing", "OpenCV"],
    },
    {
        "email": "faculty3.aiml@sbjit.edu.in",
        "role": "Faculty",
        "first_name": "Dr. Sanjay",
        "last_name": "Trivedi",
        "department": "Artificial Intelligence & Machine Learning",
        "bio": "Assistant Professor in AIML. Research in natural language processing, transformers, and knowledge graphs.",
        "headline": "Assistant Professor, AIML | NLP & Knowledge Graphs",
        "skills": [
            "Natural Language Processing",
            "Knowledge Representation",
            "Graph Neural Networks",
        ],
    },
    {
        "email": "faculty4.aiml23@sbjit.edu.in",
        "role": "Faculty",
        "first_name": "Prof. Anjali",
        "last_name": "Somani",
        "department": "Artificial Intelligence & Machine Learning",
        "bio": "Assistant Professor in AIML. Coordinator for AI industry tie-ups, student certifications, and deep learning curriculum.",
        "headline": "Assistant Professor, AIML | Academic Coordinator",
        "skills": ["Machine Learning", "Data Mining", "Big Data Analytics", "Python"],
    },
    {
        "email": "faculty4.aiml@sbjit.edu.in",
        "role": "Faculty",
        "first_name": "Prof. Anjali",
        "last_name": "Somani",
        "department": "Artificial Intelligence & Machine Learning",
        "bio": "Assistant Professor in AIML. Coordinator for AI industry tie-ups, student certifications, and deep learning curriculum.",
        "headline": "Assistant Professor, AIML | Academic Coordinator",
        "skills": ["Machine Learning", "Data Mining", "Big Data Analytics", "Python"],
    },
    # ─── CSE(AIML) HOD (1) ───────────────────────────────────────────────────
    {
        "email": "hod.aiml@sbjit.edu.in",
        "role": "HOD",
        "first_name": "Dr. Manisha",
        "last_name": "Kulkarni",
        "department": "Artificial Intelligence & Machine Learning",
        "bio": "Professor & Head of Artificial Intelligence & Machine Learning Department. Driving high-impact research, GPU laboratory infrastructure, and premier placements.",
        "headline": "Head of Department (HOD) - AI & Machine Learning",
        "skills": [
            "AI Research",
            "Departmental Leadership",
            "Neural Networks",
            "Industry Partnerships",
        ],
    },
    # ─── CSE(AIML) CONTROLLER (1) ────────────────────────────────────────────
    {
        "email": "controller.aiml23@sbjit.edu.in",
        "role": "Controller",
        "first_name": "Prof. Deepak",
        "last_name": "Verma",
        "department": "Artificial Intelligence & Machine Learning",
        "bio": "Department Controller & Associate Professor in AIML. Managing AIML department operations, faculty assignments, student moderation, and club mentor appointments.",
        "headline": "Department Controller - AI & Machine Learning",
        "skills": [
            "Department Operations",
            "Club Mentor Coordination",
            "Academic Oversight",
            "Mentorship",
        ],
    },
    {
        "email": "controller.aiml@sbjit.edu.in",
        "role": "Controller",
        "first_name": "Prof. Deepak",
        "last_name": "Verma",
        "department": "Artificial Intelligence & Machine Learning",
        "bio": "Department Controller & Associate Professor in AIML. Managing AIML department operations, faculty assignments, student moderation, and club mentor appointments.",
        "headline": "Department Controller - AI & Machine Learning",
        "skills": [
            "Department Operations",
            "Club Mentor Coordination",
            "Academic Oversight",
            "Mentorship",
        ],
    },
    # ─── CSE(AIML) ALUMNI (5) ────────────────────────────────────────────────
    {
        "email": "alumni1.aiml@sbjit.edu.in",
        "role": "Alumni",
        "first_name": "Sameer",
        "last_name": "Sheikh",
        "department": "Artificial Intelligence & Machine Learning",
        "graduation_year": 2023,
        "bio": "AI Research Engineer at OpenAI. Class of 2023. Specializing in generative language models and alignment research. Ready to mentor student researchers.",
        "headline": "AI Research Engineer at OpenAI | AIML Alumnus (2023)",
        "skills": [
            "Deep Learning",
            "LLM Alignment",
            "PyTorch",
            "Transformer Architectures",
            "Research",
        ],
    },
    {
        "email": "alumni2.aiml@sbjit.edu.in",
        "role": "Alumni",
        "first_name": "Nidhi",
        "last_name": "Agrawal",
        "department": "Artificial Intelligence & Machine Learning",
        "graduation_year": 2022,
        "bio": "Machine Learning Engineer at NVIDIA. Class of 2022. Working on TensorRT acceleration and CUDA model optimization.",
        "headline": "Senior ML Engineer at NVIDIA | AIML Alumna (2022)",
        "skills": ["CUDA", "TensorRT", "GPU Optimization", "C++", "PyTorch"],
    },
    {
        "email": "alumni3.aiml@sbjit.edu.in",
        "role": "Alumni",
        "first_name": "Gaurav",
        "last_name": "Taneja",
        "department": "Artificial Intelligence & Machine Learning",
        "graduation_year": 2021,
        "bio": "Staff Computer Vision Engineer at Tesla Autopilot team. Class of 2021. Actively reviewing portfolios and conducting campus tech talks.",
        "headline": "Computer Vision Engineer at Tesla | AIML Alumnus (2021)",
        "skills": [
            "Computer Vision",
            "Autonomous Driving",
            "Perception Systems",
            "C++",
            "Python",
        ],
    },
    {
        "email": "alumni4.aiml@sbjit.edu.in",
        "role": "Alumni",
        "first_name": "Pallavi",
        "last_name": "Shrestha",
        "department": "Artificial Intelligence & Machine Learning",
        "graduation_year": 2023,
        "bio": "NLP Scientist at Meta AI. Class of 2023. Working on multilingual speech and translation models. Mentoring final year capstone projects.",
        "headline": "NLP Scientist at Meta | AIML Alumna (2023)",
        "skills": [
            "NLP",
            "Speech Recognition",
            "PyTorch",
            "Machine Translation",
            "Mentorship",
        ],
    },
    {
        "email": "alumni5.aiml@sbjit.edu.in",
        "role": "Alumni",
        "first_name": "Nikhil",
        "last_name": "Kamath",
        "department": "Artificial Intelligence & Machine Learning",
        "graduation_year": 2020,
        "bio": "Robotics & Perception Lead at Boston Dynamics. Class of 2020. Conducting guest workshops on intelligent robotics and sensor fusion.",
        "headline": "Perception Lead at Boston Dynamics | AIML Alumnus (2020)",
        "skills": [
            "Robotics",
            "SLAM",
            "Sensor Fusion",
            "Reinforcement Learning",
            "Mentorship",
        ],
    },
    # ─── CAMPUS-WIDE ADMIN & TPO ─────────────────────────────────────────────
    {
        "email": "centraladmin@sbjit.edu.in",
        "role": "Central Admin",
        "first_name": "Central",
        "last_name": "Administrator",
        "department": "Central Administration",
        "bio": "Master Central Administrator of SBJIT Campus Platform. Responsible for institutional governance, campus-wide department oversight, and master policy controls.",
        "headline": "Central Administrator | Institutional Governance",
        "skills": [
            "Campus Administration",
            "System Governance",
            "Policy Enforcement",
            "Platform Oversight",
        ],
    },
    {
        "email": "tpo@sbjit.edu.in",
        "role": "TPO",
        "first_name": "Training & Placement",
        "last_name": "Officer",
        "department": "Training & Placement Cell (TPO)",
        "bio": "Head of Training & Placement Office (TPO). Coordinating campus placement drives, industrial hiring tie-ups, internship programs, and corporate relations.",
        "headline": "Head - Training & Placement Office (TPO)",
        "skills": [
            "Corporate Relations",
            "Placement Drives",
            "Internships",
            "Campus Recruitment",
            "Career Guidance",
        ],
    },
]


async def seed_college_accounts():
    print(f"Starting creation/update of {len(ACCOUNTS)} college accounts...")
    hashed_pwd = hash_password(PASSWORD_DEFAULT)

    async with SessionLocal() as db:
        # Load all roles
        roles_result = await db.execute(select(Role))
        roles_by_name = {
            r.name.lower().strip(): r for r in roles_result.scalars().all()
        }
        print(
            f"Loaded {len(roles_by_name)} database roles: {list(roles_by_name.keys())}"
        )

        created_count = 0
        updated_count = 0

        for acc in ACCOUNTS:
            email = acc["email"].strip().lower()
            role_key = acc["role"].lower().strip()
            role_obj = roles_by_name.get(role_key)

            if not role_obj:
                print(
                    f"[!] Warning: Role '{acc['role']}' not found in DB! Skipping {email}"
                )
                continue

            # Check if user exists
            stmt = select(User).filter(User.email.ilike(email))
            user = (await db.execute(stmt)).scalars().first()

            if not user:
                user = User(
                    email=email,
                    hashed_password=hashed_pwd,
                    role_id=role_obj.id,
                    is_active=True,
                    is_verified=True,
                )
                db.add(user)
                await db.flush()

                profile = Profile(
                    user_id=user.id,
                    first_name=acc["first_name"],
                    last_name=acc["last_name"],
                    bio=acc.get("bio", ""),
                    department=acc["department"],
                    graduation_year=acc.get("graduation_year"),
                    designation=acc.get("designation") or acc.get("headline", ""),
                    skills=acc.get("skills", []),
                )
                db.add(profile)
                created_count += 1
                print(
                    f"[+] Created: {email} | Role: {role_obj.name} | Dept: {acc['department']}"
                )
            else:
                user.hashed_password = hashed_pwd
                user.role_id = role_obj.id
                user.is_active = True
                user.is_verified = True

                # Check / update profile
                prof_stmt = select(Profile).filter(Profile.user_id == user.id)
                prof = (await db.execute(prof_stmt)).scalars().first()
                if not prof:
                    prof = Profile(
                        user_id=user.id,
                        first_name=acc["first_name"],
                        last_name=acc["last_name"],
                        bio=acc.get("bio", ""),
                        department=acc["department"],
                        graduation_year=acc.get("graduation_year"),
                        designation=acc.get("designation") or acc.get("headline", ""),
                        skills=acc.get("skills", []),
                    )
                    db.add(prof)
                else:
                    prof.first_name = acc["first_name"]
                    prof.last_name = acc["last_name"]
                    prof.bio = acc.get("bio", prof.bio)
                    prof.department = acc["department"]
                    if acc.get("graduation_year"):
                        prof.graduation_year = acc["graduation_year"]
                    if acc.get("headline") or acc.get("designation"):
                        prof.designation = acc.get("designation") or acc.get("headline")
                    if acc.get("skills"):
                        prof.skills = acc["skills"]

                updated_count += 1
                print(
                    f"[*] Updated: {email} | Role: {role_obj.name} | Dept: {acc['department']}"
                )

        await db.commit()
        print(
            f"\nSuccessfully finished! Created: {created_count}, Updated: {updated_count}, Total: {len(ACCOUNTS)}"
        )


if __name__ == "__main__":
    asyncio.run(seed_college_accounts())
