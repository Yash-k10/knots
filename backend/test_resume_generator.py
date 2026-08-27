import unittest
from app.profiles.services.resume_generator import ResumeGeneratorService


class TestResumeGenerator(unittest.TestCase):
    def test_generate_docx_template(self):
        profile_data = {
            "first_name": "Amit",
            "last_name": "Sharma",
            "department": "Computer Science and Engineering",
            "graduation_year": 2024,
            "bio": "Full stack engineer passionate about cloud architectures.",
            "employment_history": [
                {
                    "company_name": "Tech Solutions Pvt. Ltd.",
                    "title": "Senior Software Engineer",
                    "start_date": "2020-01-01",
                    "end_date": None,
                    "description": "Led team to develop scalable e-commerce platform using React and Node.js.\nImplemented CI/CD pipelines.",
                }
            ],
            "education": [
                {
                    "institution_name": "Indian Institute of Technology, Delhi",
                    "degree": "Bachelor of Technology",
                    "field_of_study": "Computer Science and Engineering",
                    "gpa": 8.7,
                    "start_date": "2013-07-01",
                    "end_date": "2017-05-01",
                }
            ],
            "projects": [
                {
                    "title": "E-commerce Platform Development",
                    "highlights": [
                        "Designed and developed a full-stack e-commerce platform using React and Node.js.",
                        "Integrated a payment gateway and implemented secure user authentication.",
                    ],
                }
            ],
            "skills": {
                "Front-end": ["HTML", "CSS", "JavaScript", "React.js"],
                "Back-end": ["Node.js", "Express.js", "Python", "FastAPI"],
                "Tools": ["Git", "Docker", "AWS"],
            },
            "certifications": [
                {
                    "name": "AWS Certified Solutions Architect",
                    "issuer": "Amazon Web Services",
                }
            ],
        }

        stream = ResumeGeneratorService.generate_docx(
            profile_data, user_email="amit.sharma@example.com"
        )
        self.assertIsNotNone(stream)
        raw_bytes = stream.getvalue()
        self.assertGreater(len(raw_bytes), 1000)
        # Verify ZIP/DOCX magic bytes
        self.assertTrue(raw_bytes.startswith(b"PK\x03\x04"))


if __name__ == "__main__":
    unittest.main()
