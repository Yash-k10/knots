import unittest
from app.ai.services.career_roadmap_service import LocalCareerRoadmapService


class TestCareerRoadmap(unittest.TestCase):
    def setUp(self):
        self.service = LocalCareerRoadmapService()

    def test_roadmap_full_stack_developer(self):
        res = self.service.generate_roadmap(
            target_role_raw="Full-Stack Engineer",
            current_skills_raw=["Python", "reactjs", "postgres"],
        )

        self.assertNotIn("error", res)
        self.assertEqual(res["role"], "Full Stack Developer")
        self.assertIn("React", res["matchedSkills"])
        self.assertIn("PostgreSQL", res["matchedSkills"])
        self.assertIn("HTML", res["missingSkills"])
        self.assertIn("JavaScript", res["missingSkills"])
        self.assertGreater(res["completionPercentage"], 0)
        self.assertGreater(len(res["learningSteps"]), 0)

        # Check first step
        step1 = res["learningSteps"][0]
        self.assertEqual(step1["step"], 1)
        self.assertIn("HTML", step1["skills"])
        self.assertIn(step1["status"], ["not_started", "completed", "in_progress"])

    def test_roadmap_machine_learning_engineer(self):
        res = self.service.generate_roadmap(
            target_role_raw="ML Engineer",
            current_skills_raw=["python", "numpy", "pandas", "sklearn"],
        )
        self.assertNotIn("error", res)
        self.assertEqual(res["role"], "Machine Learning Engineer")
        self.assertIn("Python", res["matchedSkills"])
        self.assertIn("Scikit-learn", res["matchedSkills"])
        self.assertTrue(
            "PyTorch" in res["missingSkills"] or "TensorFlow" in res["missingSkills"]
        )
        self.assertGreater(res["completionPercentage"], 0)

    def test_roadmap_data_analyst(self):
        res = self.service.generate_roadmap(
            target_role_raw="Data Analytics",
            current_skills_raw=["excel", "sql", "power bi"],
        )
        self.assertNotIn("error", res)
        self.assertEqual(res["role"], "Data Analyst")
        self.assertIn("Excel", res["matchedSkills"])
        self.assertIn("SQL", res["matchedSkills"])
        self.assertIn("Power BI", res["matchedSkills"])
        self.assertGreater(res["completionPercentage"], 0)

    def test_empty_role(self):
        res = self.service.generate_roadmap("", ["Python"])
        self.assertIn("error", res)

    def test_unknown_role(self):
        res = self.service.generate_roadmap("Astronaut Chef 9000", ["Python"])
        self.assertIn("error", res)


if __name__ == "__main__":
    unittest.main()
