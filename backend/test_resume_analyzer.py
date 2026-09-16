import unittest
from app.ai.services.resume_analyzer_service import LocalResumeAnalyzerService

SAMPLE_AMIT_SHARMA_RESUME = """
Amit Sharma
amit.sharma@example.com | 9876543210 | in/amitsharma | github.com/amitsharma

WORK EXPERIENCE
Tech Solutions Pvt. Ltd.
Senior Software Engineer
Jan 2020 - Present
• Led a team of 5 engineers to develop a scalable e-commerce platform using React and Node.js, increasing user engagement by 30%.
• Implemented CI/CD pipelines with Jenkins and Docker, reducing deployment time by 50%.
• Collaborated with cross-functional teams to design and implement new features, boosting customer satisfaction by 20%.

Innovative Web Services
Full Stack Developer
Jun 2017 - Dec 2019
• Developed and maintained web applications using Angular and Express.js, enhancing performance by 20%.
• Designed and integrated RESTful APIs, improving data access and application functionality.
• Worked closely with QA teams to ensure high-quality releases, reducing bugs by 25%.

EDUCATION
Indian Institute of Technology, Delhi
Bachelor of Technology in Computer Science and Engineering - 8.7 GPA
Jul 2013 - May 2017

PROJECT
E-commerce Platform Development
• Designed and developed a full-stack e-commerce platform using React and Node.js.
• Integrated a payment gateway and implemented secure user authentication.
• Optimized database queries, reducing page load time by 40%.

Employee Management System
• Created a web-based employee management system for a mid-sized company using Angular and Spring Boot.
• Implemented role-based access control and real-time data updates using WebSockets.
• Deployed the system on AWS, ensuring high availability and scalability.

Healthcare Appointment Booking System
• Developed a full-stack web application for booking healthcare appointments using React and Node.js.
• Integrated third-party APIs for real-time availability and booking of healthcare professionals.
• Implemented a secure user authentication system using JWT and managed session data.
• Deployed the application on Heroku, ensuring scalability and monitoring performance with New Relic.

SKILLS
• Front-end: HTML, CSS, JavaScript, TypeScript, React.js and Angular.
• Back-end: Node.js, Express.js, and RESTful API design.
• Tools: Git and working with CI/CD pipelines.

CERTIFICATIONS
• AWS Certified Solutions Architect
• Microsoft Certified: Azure Developer Associate
"""


class TestResumeAnalyzer(unittest.TestCase):
    def setUp(self):
        self.analyzer = LocalResumeAnalyzerService()

    def test_amit_sharma_resume_analysis(self):
        res = self.analyzer.analyze_resume(
            SAMPLE_AMIT_SHARMA_RESUME, target_role="Senior Full Stack Engineer"
        )

        self.assertGreaterEqual(res["score"], 80)
        self.assertIn("dimensions", res)
        self.assertGreaterEqual(res["dimensions"]["ats_compatibility"], 85)
        self.assertGreaterEqual(res["dimensions"]["impact_metrics"], 70)

        # Verify detected skills
        self.assertIn("Frontend", res["detected_skills"])
        self.assertIn("Backend & APIs", res["detected_skills"])
        self.assertIn("React", res["detected_skills"]["Frontend"])
        self.assertIn("Node.js", res["detected_skills"]["Backend & APIs"])

        # Verify STAR rewrites
        self.assertGreater(len(res["bullet_rewrites"]), 0)
        first_rewrite = res["bullet_rewrites"][0]
        self.assertIn("original", first_rewrite)
        self.assertIn("improved", first_rewrite)
        self.assertIn("reason", first_rewrite)

        # Verify strengths & feedback
        self.assertGreater(len(res["strengths"]), 0)
        self.assertGreater(len(res["feedback"]), 0)

    def test_empty_resume(self):
        res = self.analyzer.analyze_resume("")
        self.assertEqual(res["score"], 0)
        self.assertGreater(len(res["feedback"]), 0)


if __name__ == "__main__":
    unittest.main()
