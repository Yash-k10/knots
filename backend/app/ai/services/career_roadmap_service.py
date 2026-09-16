import json
import os
import re
from typing import Any, Dict, List, Optional

ROLE_ALIASES = {
    # Full Stack
    "full stack developer": "Full Stack Developer",
    "full stack engineer": "Full Stack Developer",
    "full-stack developer": "Full Stack Developer",
    "full-stack engineer": "Full Stack Developer",
    "fullstack developer": "Full Stack Developer",
    "fullstack engineer": "Full Stack Developer",
    "full stack dev": "Full Stack Developer",
    "full-stack dev": "Full Stack Developer",
    "mern developer": "Full Stack Developer",
    "mean developer": "Full Stack Developer",
    # Frontend
    "frontend developer": "Frontend Developer",
    "front end developer": "Frontend Developer",
    "front-end developer": "Frontend Developer",
    "frontend engineer": "Frontend Developer",
    "front end engineer": "Frontend Developer",
    "front-end engineer": "Frontend Developer",
    "frontend dev": "Frontend Developer",
    "front end dev": "Frontend Developer",
    # Backend
    "backend developer": "Backend Developer",
    "back end developer": "Backend Developer",
    "back-end developer": "Backend Developer",
    "backend engineer": "Backend Developer",
    "back end engineer": "Backend Developer",
    "back-end engineer": "Backend Developer",
    "backend dev": "Backend Developer",
    "back end dev": "Backend Developer",
    # Software Dev / SWE
    "software developer": "Software Developer",
    "software dev": "Software Developer",
    "sde": "Software Developer",
    "software engineer": "Software Engineer",
    "swe": "Software Engineer",
    "programmer": "Software Developer",
    "software programmer": "Software Developer",
    # Web Dev
    "web developer": "Web Developer",
    "web dev": "Web Developer",
    "web application developer": "Web Developer",
    "web designer and developer": "Web Developer",
    # Python
    "python developer": "Python Developer",
    "python dev": "Python Developer",
    "python engineer": "Python Developer",
    "django developer": "Python Developer",
    "fastapi developer": "Python Developer",
    # Java
    "java developer": "Java Developer",
    "java dev": "Java Developer",
    "java engineer": "Java Developer",
    "spring developer": "Java Developer",
    "spring boot developer": "Java Developer",
    # JavaScript / React / Angular / Node
    "javascript developer": "JavaScript Developer",
    "js developer": "JavaScript Developer",
    "javascript dev": "JavaScript Developer",
    "typescript developer": "JavaScript Developer",
    "react developer": "React Developer",
    "reactjs developer": "React Developer",
    "react.js developer": "React Developer",
    "react dev": "React Developer",
    "react engineer": "React Developer",
    "angular developer": "Angular Developer",
    "angularjs developer": "Angular Developer",
    "angular.js developer": "Angular Developer",
    "angular dev": "Angular Developer",
    "angular engineer": "Angular Developer",
    "node developer": "Node.js Developer",
    "nodejs developer": "Node.js Developer",
    "node.js developer": "Node.js Developer",
    "node dev": "Node.js Developer",
    "node engineer": "Node.js Developer",
    # Mobile
    "mobile app developer": "Mobile App Developer",
    "mobile developer": "Mobile App Developer",
    "mobile engineer": "Mobile App Developer",
    "flutter developer": "Mobile App Developer",
    "react native developer": "Mobile App Developer",
    "android developer": "Android Developer",
    "android dev": "Android Developer",
    "android engineer": "Android Developer",
    "kotlin developer": "Android Developer",
    "ios developer": "iOS Developer",
    "ios dev": "iOS Developer",
    "ios engineer": "iOS Developer",
    "swift developer": "iOS Developer",
    # DevOps & Cloud
    "devops engineer": "DevOps Engineer",
    "devops": "DevOps Engineer",
    "dev ops engineer": "DevOps Engineer",
    "site reliability engineer": "DevOps Engineer",
    "sre": "DevOps Engineer",
    "cloud engineer": "Cloud Engineer",
    "cloud architect": "Cloud Engineer",
    "cloud infrastructure engineer": "Cloud Engineer",
    "aws cloud engineer": "AWS Cloud Engineer",
    "aws engineer": "AWS Cloud Engineer",
    "aws developer": "AWS Cloud Engineer",
    "aws solutions architect": "AWS Cloud Engineer",
    "azure cloud engineer": "Azure Cloud Engineer",
    "azure engineer": "Azure Cloud Engineer",
    "azure developer": "Azure Cloud Engineer",
    "azure architect": "Azure Cloud Engineer",
    # Data & AI/ML
    "data engineer": "Data Engineer",
    "big data engineer": "Data Engineer",
    "data pipeline engineer": "Data Engineer",
    "data analyst": "Data Analyst",
    "data analytics": "Data Analyst",
    "data analytics analyst": "Data Analyst",
    "business intelligence analyst": "Business Intelligence Analyst",
    "bi analyst": "Business Intelligence Analyst",
    "bi developer": "Business Intelligence Analyst",
    "data scientist": "Data Scientist",
    "applied data scientist": "Data Scientist",
    "machine learning scientist": "Data Scientist",
    "machine learning engineer": "Machine Learning Engineer",
    "ml engineer": "Machine Learning Engineer",
    "machine learning developer": "Machine Learning Engineer",
    "ai engineer": "AI Engineer",
    "ai/ml engineer": "AI Engineer",
    "artificial intelligence engineer": "AI Engineer",
    "ai developer": "AI Engineer",
    "deep learning engineer": "Deep Learning Engineer",
    "dl engineer": "Deep Learning Engineer",
    "nlp engineer": "NLP Engineer",
    "natural language processing engineer": "NLP Engineer",
    "computer vision engineer": "Computer Vision Engineer",
    "cv engineer": "Computer Vision Engineer",
    "generative ai engineer": "Generative AI Engineer",
    "gen ai engineer": "Generative AI Engineer",
    "llm engineer": "Generative AI Engineer",
    "mlops engineer": "MLOps Engineer",
    "mlops": "MLOps Engineer",
    # Database & Storage
    "database administrator": "Database Administrator",
    "dba": "Database Administrator",
    "database admin": "Database Administrator",
    "database developer": "Database Developer",
    "db developer": "Database Developer",
    "sql developer": "SQL Developer",
    "sql engineer": "SQL Developer",
    # Security & Network
    "cybersecurity analyst": "Cybersecurity Analyst",
    "cyber security analyst": "Cybersecurity Analyst",
    "soc analyst": "Cybersecurity Analyst",
    "cybersecurity engineer": "Cybersecurity Engineer",
    "cyber security engineer": "Cybersecurity Engineer",
    "infosec engineer": "Cybersecurity Engineer",
    "network engineer": "Network Engineer",
    "network administrator": "Network Engineer",
    "network admin": "Network Engineer",
    # QA & Testing
    "qa engineer": "QA Engineer",
    "qa": "QA Engineer",
    "quality assurance engineer": "QA Engineer",
    "software tester": "QA Engineer",
    "automation test engineer": "Automation Test Engineer",
    "automation engineer": "Automation Test Engineer",
    "test automation engineer": "Automation Test Engineer",
    "sdet": "Automation Test Engineer",
    # SysAdmin & Architecture
    "system administrator": "System Administrator",
    "systems administrator": "System Administrator",
    "sysadmin": "System Administrator",
    "linux administrator": "System Administrator",
    "solutions architect": "Solutions Architect",
    "solution architect": "Solutions Architect",
    # Design & Product
    "ui/ux designer": "UI/UX Designer",
    "ui ux designer": "UI/UX Designer",
    "ui-ux designer": "UI/UX Designer",
    "ux designer": "UI/UX Designer",
    "ui designer": "UI/UX Designer",
    "product designer": "Product Designer",
    "product manager": "Product Manager",
    "pm": "Product Manager",
    "associate product manager": "Product Manager",
    "technical product manager": "Technical Product Manager",
    "tpm": "Technical Product Manager",
    "business analyst": "Business Analyst",
    "ba": "Business Analyst",
    "technical business analyst": "Technical Business Analyst",
    "technical ba": "Technical Business Analyst",
    # Emerging & Cross-Cutting
    "blockchain developer": "Blockchain Developer",
    "web3 developer": "Blockchain Developer",
    "smart contract developer": "Blockchain Developer",
    "solidity developer": "Blockchain Developer",
    "game developer": "Game Developer",
    "game programmer": "Game Developer",
    "unity developer": "Game Developer",
    "unreal developer": "Game Developer",
    "embedded systems developer": "Embedded Systems Developer",
    "embedded developer": "Embedded Systems Developer",
    "firmware engineer": "Embedded Systems Developer",
    "robotics engineer": "Robotics Engineer",
    "robotics software engineer": "Robotics Engineer",
}

SKILL_EQUIVALENCES = {
    "js": "javascript",
    "ts": "typescript",
    "reactjs": "react",
    "react.js": "react",
    "node": "node.js",
    "nodejs": "node.js",
    "express": "express.js",
    "expressjs": "express.js",
    "postgres": "postgresql",
    "postgres db": "postgresql",
    "postgresql db": "postgresql",
    "mongo": "mongodb",
    "mongo db": "mongodb",
    "sklearn": "scikit-learn",
    "scikit learn": "scikit-learn",
    "tf": "tensorflow",
    "py": "python",
    "html5": "html",
    "css3": "css",
    "nextjs": "next.js",
    "next.js": "next.js",
    "vuejs": "vue",
    "vue.js": "vue",
    "angularjs": "angular",
    "angular.js": "angular",
    "docker container": "docker",
    "docker containers": "docker",
    "k8s": "kubernetes",
    "kube": "kubernetes",
    "gcp": "google cloud",
    "google cloud platform": "google cloud",
    "aws services": "aws",
    "amazon web services": "aws",
    "rest": "rest api",
    "restful api": "rest api",
    "restful apis": "rest api",
    "rest apis": "rest api",
    "rest-api": "rest api",
    "powerbi": "power bi",
    "pytorch": "pytorch",
    "nlp": "nlp",
    "natural language processing": "nlp",
    "cv": "computer vision",
    "opencv": "opencv",
    "sql server": "sql",
    "ms sql": "sql",
    "dsa": "data structures & algorithms",
    "data structures and algorithms": "data structures & algorithms",
    "data structures": "data structures & algorithms",
    "ml": "machine learning",
    "machine learning": "machine learning",
    "dl": "deep learning",
    "deep learning": "deep learning",
    "ci/cd": "ci/cd",
    "cicd": "ci/cd",
    "continuous integration": "ci/cd",
    "tailwind": "tailwind css",
    "tailwindcss": "tailwind css",
    "fastapi framework": "fastapi",
    "springboot": "spring boot",
    "spring": "spring boot",
    "ros2": "ros2",
    "ros 2": "ros2",
    "llm": "llms",
    "large language models": "llms",
}


class LocalCareerRoadmapService:
    """Local career knowledge base & deterministic roadmap generator."""

    def __init__(self):
        self.roadmaps = self._load_roadmaps()

    def _load_roadmaps(self) -> Dict[str, Any]:
        data_dir = os.path.join(
            os.path.dirname(
                os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            ),
            "data",
        )
        json_file = os.path.join(data_dir, "career_roadmaps.json")
        if os.path.exists(json_file):
            try:
                with open(json_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading {json_file}: {e}")
        return {}

    def normalize_role_name(self, role: str) -> Optional[str]:
        if not role or not role.strip():
            return None
        cleaned = role.strip().lower()
        cleaned = re.sub(r"[\t\r\n]+", " ", cleaned)
        cleaned = re.sub(r"\s+", " ", cleaned)

        # Exact alias match
        if cleaned in ROLE_ALIASES:
            return ROLE_ALIASES[cleaned]

        # Replace hyphens with spaces and check
        hyphen_normalized = cleaned.replace("-", " ")
        if hyphen_normalized in ROLE_ALIASES:
            return ROLE_ALIASES[hyphen_normalized]

        # Check canonical role names
        for canonical_name in self.roadmaps.keys():
            if (
                canonical_name.lower() == cleaned
                or canonical_name.lower() == hyphen_normalized
            ):
                return canonical_name

        # Substring / partial matching
        for alias, canonical in ROLE_ALIASES.items():
            if alias in cleaned or cleaned in alias:
                return canonical

        for canonical_name in self.roadmaps.keys():
            if canonical_name.lower() in cleaned or cleaned in canonical_name.lower():
                return canonical_name

        return None

    def normalize_skill(self, skill: str) -> str:
        s = skill.strip().lower()
        s = re.sub(r"\s+", " ", s)
        return SKILL_EQUIVALENCES.get(s, s)

    def generate_roadmap(
        self, target_role_raw: str, current_skills_raw: List[str]
    ) -> Dict[str, Any]:
        if not target_role_raw or not target_role_raw.strip():
            return {"error": "Target role is required. Please specify a target role."}

        canonical_role = self.normalize_role_name(target_role_raw)
        if not canonical_role or canonical_role not in self.roadmaps:
            supported_roles_sample = list(self.roadmaps.keys())[:10]
            return {
                "error": f"No matching role found in the career dataset for '{target_role_raw}'.",
                "suggestions": supported_roles_sample,
            }

        role_data = self.roadmaps[canonical_role]
        required_skills: List[str] = role_data.get("skills", [])
        steps_template: List[Dict[str, Any]] = role_data.get("steps", [])

        # Parse user's current skills
        parsed_current_skills: List[str] = []
        user_norm_set = set()
        for item in current_skills_raw:
            if not item:
                continue
            for part in str(item).split(","):
                clean = part.strip()
                if clean:
                    parsed_current_skills.append(clean)
                    user_norm_set.add(self.normalize_skill(clean))

        # Check matched vs missing skills
        matched_skills = []
        missing_skills = []
        for req_skill in required_skills:
            req_norm = self.normalize_skill(req_skill)
            if req_norm in user_norm_set:
                matched_skills.append(req_skill)
            else:
                missing_skills.append(req_skill)

        total_req_count = len(required_skills)
        completion_pct = int(
            round((len(matched_skills) / max(total_req_count, 1)) * 100)
        )

        # Build learning steps with progress state
        learning_steps = []
        milestones = []
        for idx, step_def in enumerate(steps_template):
            step_skills = step_def.get("skills", [])
            step_matched = [
                s for s in step_skills if self.normalize_skill(s) in user_norm_set
            ]

            if len(step_matched) == len(step_skills) and len(step_skills) > 0:
                status = "completed"
            elif len(step_matched) > 0:
                status = "in_progress"
            else:
                status = "not_started"

            step_obj = {
                "step": step_def.get("step", idx + 1),
                "title": step_def.get("title", f"Step {idx + 1}"),
                "skills": step_skills,
                "status": status,
            }
            learning_steps.append(step_obj)

            # Milestones for UI compatibility
            milestones.append(
                {
                    "phase": f"Phase {idx + 1}",
                    "title": step_def.get("title", f"Step {idx + 1}"),
                    "duration": "2-4 Weeks",
                    "description": f"Master {', '.join(step_skills)} to establish core competency for {canonical_role}.",
                    "status": status,
                    "skills": step_skills,
                }
            )

        return {
            "role": canonical_role,
            "description": role_data.get("description", ""),
            "currentSkills": parsed_current_skills,
            "matchedSkills": matched_skills,
            "missingSkills": missing_skills,
            "totalRequiredSkills": total_req_count,
            "completionPercentage": completion_pct,
            "learningSteps": learning_steps,
            "milestones": milestones,
            "role_overview": {
                "title": canonical_role,
                "market_demand": "High Demand across tech companies & startups",
                "estimated_duration": f"{len(steps_template) * 3} Weeks",
                "salary_range": "$75,000 - $145,000",
            },
            "skill_gap_analysis": {
                "matching_skills": matched_skills,
                "skills_to_acquire": missing_skills,
                "readiness_percentage": completion_pct,
            },
        }
