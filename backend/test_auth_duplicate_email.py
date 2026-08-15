import unittest

from app.auth.schemas.auth import UserRegister


class TestDuplicateEmailRegistration(unittest.TestCase):
    def test_schema_normalizes_email(self):
        reg = UserRegister(
            email="  TestUser@sbjit.edu.in  ",
            password="password123",
            role_id=2,
        )
        self.assertEqual(reg.email, "testuser@sbjit.edu.in")


if __name__ == "__main__":
    unittest.main()
