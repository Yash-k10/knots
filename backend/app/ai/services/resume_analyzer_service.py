import re
from typing import Any, Dict, List, Set, Tuple

# Technical skills classification dictionary
TECH_DICTIONARY = {
    "Frontend": [
        "React",
        "React.js",
        "Angular",
        "Vue",
        "Vue.js",
        "Next.js",
        "TypeScript",
        "JavaScript",
        "HTML",
        "HTML5",
        "CSS",
        "CSS3",
        "Tailwind CSS",
        "Bootstrap",
        "Sass",
        "Redux",
        "Zustand",
        "Webpack",
        "Vite",
        "Responsive Design",
    ],
    "Backend & APIs": [
        "Node.js",
        "Express",
        "Express.js",
        "FastAPI",
        "Django",
        "Flask",
        "Spring",
        "Spring Boot",
        "NestJS",
        "Java",
        "Python",
        "Go",
        "Golang",
        "C#",
        ".NET",
        "PHP",
        "Ruby on Rails",
        "REST API",
        "RESTful APIs",
        "GraphQL",
        "gRPC",
        "WebSockets",
    ],
    "Databases & Storage": [
        "SQL",
        "PostgreSQL",
        "MySQL",
        "MongoDB",
        "Redis",
        "Cassandra",
        "SQLite",
        "Oracle",
        "DynamoDB",
        "Firebase",
        "Supabase",
        "Prisma",
        "SQLAlchemy",
        "Hibernate",
    ],
    "DevOps & Cloud": [
        "AWS",
        "Amazon Web Services",
        "Azure",
        "Microsoft Azure",
        "Google Cloud",
        "GCP",
        "Docker",
        "Kubernetes",
        "Jenkins",
        "GitHub Actions",
        "CI/CD",
        "Terraform",
        "Ansible",
        "Linux",
        "Bash",
        "Prometheus",
        "Grafana",
        "New Relic",
        "Heroku",
    ],
    "AI, ML & Data": [
        "Machine Learning",
        "Deep Learning",
        "PyTorch",
        "TensorFlow",
        "Scikit-learn",
        "Pandas",
        "NumPy",
        "OpenCV",
        "NLP",
        "LLMs",
        "LangChain",
        "RAG",
        "Spark",
        "Kafka",
    ],
    "Testing & Tools": [
        "Git",
        "GitHub",
        "GitLab",
        "Jira",
        "Postman",
        "Jest",
        "PyTest",
        "JUnit",
        "Cypress",
        "Selenium",
        "Swagger",
        "Postman",
        "Agile",
        "Scrum",
    ],
}

STRONG_ACTION_VERBS = {
    "architected",
    "spearheaded",
    "engineered",
    "developed",
    "designed",
    "implemented",
    "optimized",
    "accelerated",
    "reduced",
    "increased",
    "boosted",
    "deployed",
    "orchestrated",
    "automated",
    "streamlined",
    "built",
    "created",
    "integrated",
    "delivered",
    "launched",
    "scaled",
    "refactored",
    "migrated",
    "led",
    "mentored",
}

WEAK_PHRASES = [
    "worked on",
    "helped with",
    "responsible for",
    "assisted in",
    "participated in",
    "handled",
    "did",
    "was part of",
    "tried to",
    "looked into",
]


class LocalResumeAnalyzerService:
    """Local, deterministic, high-information student resume analyzer."""

    def analyze_resume(
        self, resume_text: str, target_role: str = "Software Developer"
    ) -> Dict[str, Any]:
        if not resume_text or not resume_text.strip():
            return {
                "score": 0,
                "rating": "Needs Attention",
                "dimensions": {
                    "overall": 0,
                    "ats_compatibility": 0,
                    "impact_metrics": 0,
                    "tech_stack_depth": 0,
                },
                "detected_skills": {},
                "detected_skills_count": 0,
                "missing_high_impact_keywords": [
                    "JavaScript",
                    "Python",
                    "SQL",
                    "Git",
                    "REST APIs",
                ],
                "bullet_rewrites": [],
                "feedback": [
                    "Please paste your resume text to receive personalized ATS feedback."
                ],
                "strengths": [],
                "suggestions": [
                    "Add your education, work experience or projects, and core technical skills."
                ],
            }

        text = resume_text.strip()
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        lower_text = text.lower()

        # 1. Contact Information Detection
        has_email = bool(re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text))
        has_phone = bool(
            re.search(
                r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10}", text
            )
        )
        has_linkedin = "linkedin" in lower_text or "in/" in lower_text
        has_github = (
            "github" in lower_text
            or "gitlab" in lower_text
            or "portfolio" in lower_text
        )

        # 2. Section Headings Detection
        sections = {
            "Experience": any(
                re.search(
                    r"\b(experience|work history|employment|internship)\b",
                    line_str,
                    re.I,
                )
                for line_str in lines
            ),
            "Education": any(
                re.search(
                    r"\b(education|degree|bachelor|master|b\.tech|university|college|gpa)\b",
                    line_str,
                    re.I,
                )
                for line_str in lines
            ),
            "Projects": any(
                re.search(
                    r"\b(project|projects|academic projects|key projects)\b",
                    line_str,
                    re.I,
                )
                for line_str in lines
            ),
            "Skills": any(
                re.search(
                    r"\b(skills|technical skills|technologies|proficiencies)\b",
                    line_str,
                    re.I,
                )
                for line_str in lines
            ),
            "Certifications": any(
                re.search(
                    r"\b(certification|certifications|certified|licenses)\b",
                    line_str,
                    re.I,
                )
                for line_str in lines
            ),
        }

        # 3. Skills Categorization
        detected_skills: Dict[str, List[str]] = {}
        all_detected_set: Set[str] = set()

        for category, skill_list in TECH_DICTIONARY.items():
            cat_matches = []
            for sk in skill_list:
                pattern = r"(?<!\w)" + re.escape(sk.lower()) + r"(?!\w)"
                if re.search(pattern, lower_text):
                    cat_matches.append(sk)
                    all_detected_set.add(sk.lower())
            if cat_matches:
                detected_skills[category] = cat_matches

        total_skills_count = sum(len(v) for v in detected_skills.values())

        # 4. Metric & Quantifiable Impact Analysis
        metric_matches = re.findall(
            r"\b\d+%\b|\b\d+\s*(?:ms|seconds|minutes|hours|days|x|users|k|m|gpa)\b|[\$₹€£]\s*\d+|\b\d+\+\b|\breducing\s+\w+\s+by\s+\d+|\bincreasing\s+\w+\s+by\s+\d+",
            lower_text,
        )
        metric_count = len(metric_matches)

        # 5. Bullet Points Extraction & Action Verb Evaluation
        bullet_candidates = []
        for line_str in lines:
            if line_str.startswith(("-", "•", "*", "–")) or re.match(
                r"^\d+[\.\)]\s+", line_str
            ):
                clean_l = re.sub(r"^[-•*–\d\.\)\s]+", "", line_str).strip()
                if len(clean_l.split()) >= 4:
                    bullet_candidates.append(clean_l)
            elif len(line_str.split()) >= 6 and (
                any(line_str.lower().startswith(v) for v in STRONG_ACTION_VERBS)
                or any(phrase in line_str.lower() for phrase in WEAK_PHRASES)
            ):
                bullet_candidates.append(line_str)

        # 6. Generate STAR Bullet Point Rewrites
        bullet_rewrites = []
        for bullet in bullet_candidates:
            b_lower = bullet.lower()
            has_metric = bool(re.search(r"\d+%|\d+\s*(?:ms|users|k|x)|\$\d+", b_lower))
            has_weak = any(phrase in b_lower for phrase in WEAK_PHRASES)

            # If bullet lacks metric or has weak starter, craft a STAR rewrite
            if (not has_metric or has_weak) and len(bullet_rewrites) < 3:
                improved, reason = self._generate_star_rewrite(bullet, detected_skills)
                bullet_rewrites.append(
                    {"original": bullet, "improved": improved, "reason": reason}
                )

        # Fallback bullet rewrites if none matched condition
        if not bullet_rewrites and bullet_candidates:
            sample_b = bullet_candidates[0]
            improved, reason = self._generate_star_rewrite(sample_b, detected_skills)
            bullet_rewrites.append(
                {"original": sample_b, "improved": improved, "reason": reason}
            )

        # 7. Identify Missing High-Impact Keywords
        ideal_keywords = [
            "Unit Testing",
            "CI/CD",
            "Docker",
            "RESTful APIs",
            "System Architecture",
            "PostgreSQL",
            "Git",
            "Redis",
            "Agile",
            "TypeScript",
            "Cloud Deployment",
        ]
        missing_keywords = [
            kw for kw in ideal_keywords if kw.lower() not in all_detected_set
        ][:6]

        # 8. Score Computations (ATS Compatibility, Impact, Depth, Overall)
        ats_score = 40
        if has_email:
            ats_score += 15
        if has_phone:
            ats_score += 10
        if has_linkedin or has_github:
            ats_score += 15
        if sections["Experience"] or sections["Projects"]:
            ats_score += 10
        if sections["Education"]:
            ats_score += 10
        ats_score = min(ats_score, 98)

        impact_score = min(30 + (metric_count * 12) + (len(bullet_candidates) * 4), 95)

        tech_score = min(35 + (total_skills_count * 5), 96)

        overall_score = int(
            round((ats_score * 0.35) + (impact_score * 0.35) + (tech_score * 0.30))
        )

        if overall_score >= 85:
            rating = "Exceptional Candidate"
        elif overall_score >= 70:
            rating = "Strong Competency"
        elif overall_score >= 50:
            rating = "Promising Foundation"
        else:
            rating = "Needs Refinement"

        # 9. Key Strengths & Actionable Recommendations
        strengths = []
        if has_email and has_phone and (has_linkedin or has_github):
            strengths.append(
                "Complete professional contact header with direct social/portfolio links."
            )
        if total_skills_count >= 8:
            strengths.append(
                f"Strong breadth across {len(detected_skills)} technology domains with {total_skills_count} total detected skills."
            )
        if metric_count >= 3:
            strengths.append(
                f"Effective use of quantifiable results ({metric_count} metrics detected, e.g. latency/performance improvements)."
            )
        if sections["Certifications"]:
            strengths.append(
                "Verified industry certifications enhance recruiter confidence and ATS ranking."
            )
        if sections["Projects"] and sections["Experience"]:
            strengths.append(
                "Balanced blend of real-world work experience and hands-on portfolio projects."
            )
        if not strengths:
            strengths.append(
                "Clear foundational technical background with relevant academic focus."
            )

        feedback = []
        suggestions = []

        if metric_count < 3:
            feedback.append(
                "Increase quantifiable outcome metrics (e.g. '% reduction in build time', 'X ms faster query response', 'serving N active users')."
            )
            suggestions.append(
                "Apply the Google XYZ formula: 'Accomplished [X] as measured by [Y], by doing [Z]'."
            )

        if not (has_github or has_linkedin):
            feedback.append(
                "Add your active GitHub profile and LinkedIn URL to the header for recruiter verification."
            )
            suggestions.append(
                "Ensure repositories pinned on GitHub have clean READMEs and live demo links."
            )

        if len(missing_keywords) > 0:
            feedback.append(
                f"Consider integrating high-value industry keywords: {', '.join(missing_keywords[:4])}."
            )
            suggestions.append(
                "Include mention of testing frameworks (e.g. Jest, PyTest) and CI/CD pipelines in your projects."
            )

        if not sections["Certifications"]:
            suggestions.append(
                "Earning entry-level cloud credentials (e.g. AWS Cloud Practitioner / Azure Fundamentals) will elevate your resume."
            )

        return {
            "score": overall_score,
            "rating": rating,
            "target_role": target_role,
            "dimensions": {
                "overall": overall_score,
                "ats_compatibility": ats_score,
                "impact_metrics": impact_score,
                "tech_stack_depth": tech_score,
            },
            "detected_skills": detected_skills,
            "detected_skills_count": total_skills_count,
            "missing_high_impact_keywords": missing_keywords,
            "bullet_rewrites": bullet_rewrites,
            "feedback": (
                feedback
                if feedback
                else [
                    "Your resume demonstrates strong technical depth and clean structure."
                ]
            ),
            "strengths": strengths,
            "suggestions": (
                suggestions
                if suggestions
                else [
                    "Maintain updated project links and tailor keyword density to specific job postings."
                ]
            ),
        }

    def _generate_star_rewrite(
        self, bullet: str, detected_skills: Dict[str, List[str]]
    ) -> Tuple[str, str]:
        b = bullet.strip().rstrip(".")
        b_lower = b.lower()

        # Find any tech mentioned in bullet
        tech_words = []
        for cat_skills in detected_skills.values():
            for sk in cat_skills:
                if sk.lower() in b_lower:
                    tech_words.append(sk)

        tech_mention = (
            f" using {tech_words[0]} and {tech_words[1]}"
            if len(tech_words) >= 2
            else (f" using {tech_words[0]}" if tech_words else "")
        )

        if "develop" in b_lower or "created" in b_lower or "built" in b_lower:
            improved = f"Architected and deployed high-performance modules{tech_mention}, improving overall system throughput by 35% and reducing deployment cycle to under 15 minutes."
            reason = "Replaces generic creation verb with 'Architected & deployed' and incorporates concrete latency and throughput metrics."
        elif (
            "integrat" in b_lower
            or "api" in b_lower
            or "payment" in b_lower
            or "auth" in b_lower
        ):
            improved = f"Engineered secure API integrations and authentication protocols{tech_mention}, achieving 99.9% uptime and zero security vulnerabilities across 10K+ active sessions."
            reason = "Specifies security robustness, uptime guarantees, and active session scale."
        elif (
            "optimiz" in b_lower
            or "database" in b_lower
            or "query" in b_lower
            or "performance" in b_lower
        ):
            improved = f"Refactored relational schemas and optimized indexing strategies{tech_mention}, slashing database query latency by 45% and reducing CPU utilization during peak traffic."
            reason = "Quantifies the exact latency reduction (45%) and highlights database optimization."
        elif "lead" in b_lower or "team" in b_lower or "collaborat" in b_lower:
            improved = f"Spearheaded cross-functional development across a team of 5 engineers{tech_mention}, delivering key sprint milestones 2 weeks ahead of schedule with 98% test coverage."
            reason = "Highlights leadership impact, milestone velocity, and measurable test coverage."
        else:
            improved = f"Engineered and automated production workflows{tech_mention}, increasing operational reliability by 40% and eliminating manual intervention across release cycles."
            reason = "Applies the STAR framework with strong action verbs and measurable business impact."

        return improved, reason
