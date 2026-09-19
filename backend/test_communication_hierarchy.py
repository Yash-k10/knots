import unittest
from app.messaging.services.message import validate_communication_hierarchy


class TestCommunicationHierarchy(unittest.TestCase):
    def test_student_permissions(self):
        # Student can message other Students, Faculty, Alumni, Dean, Principal, etc.
        self.assertTrue(validate_communication_hierarchy("Student", "Student"))
        self.assertTrue(validate_communication_hierarchy("Student", "Faculty"))
        self.assertTrue(validate_communication_hierarchy("Student", "Alumni"))
        self.assertTrue(validate_communication_hierarchy("Student", "Dean"))
        self.assertTrue(validate_communication_hierarchy("Student", "Principal"))
        self.assertTrue(validate_communication_hierarchy("Student", "CEO"))
        self.assertTrue(validate_communication_hierarchy("Student", "Central Admin"))

    def test_faculty_permissions(self):
        # Faculty can message Student, HOD, Controller, Alumni, CEO
        self.assertTrue(validate_communication_hierarchy("Faculty", "Student"))
        self.assertTrue(validate_communication_hierarchy("Faculty", "HOD"))
        self.assertTrue(validate_communication_hierarchy("Faculty", "Controller"))
        self.assertTrue(validate_communication_hierarchy("Faculty", "Alumni"))
        self.assertTrue(validate_communication_hierarchy("Faculty", "CEO"))

    def test_hod_permissions(self):
        # HOD can message Faculty, Controller, Alumni, TPO, Dean, CEO
        self.assertTrue(validate_communication_hierarchy("HOD", "Faculty"))
        self.assertTrue(validate_communication_hierarchy("HOD", "Controller"))
        self.assertTrue(validate_communication_hierarchy("HOD", "Alumni"))
        self.assertTrue(validate_communication_hierarchy("HOD", "TPO"))
        self.assertTrue(validate_communication_hierarchy("HOD", "Dean"))
        self.assertTrue(validate_communication_hierarchy("HOD", "CEO"))

    def test_controller_permissions(self):
        # Controller can message Faculty, HOD, Alumni, Student, CEO
        self.assertTrue(validate_communication_hierarchy("Controller", "Faculty"))
        self.assertTrue(validate_communication_hierarchy("Controller", "HOD"))
        self.assertTrue(validate_communication_hierarchy("Controller", "Alumni"))
        self.assertTrue(validate_communication_hierarchy("Controller", "Student"))
        self.assertTrue(validate_communication_hierarchy("Controller", "CEO"))

    def test_alumni_permissions(self):
        # Alumni can message Student, Faculty, Controller, TPO, Principal
        self.assertTrue(validate_communication_hierarchy("Alumni", "Student"))
        self.assertTrue(validate_communication_hierarchy("Alumni", "Faculty"))
        self.assertTrue(validate_communication_hierarchy("Alumni", "Controller"))
        self.assertTrue(validate_communication_hierarchy("Alumni", "TPO"))
        self.assertTrue(validate_communication_hierarchy("Alumni", "Principal"))

    def test_tpo_permissions(self):
        # TPO can message Central Admin, Dean, Principal, Alumni, HOD, Student
        self.assertTrue(validate_communication_hierarchy("TPO", "Central Admin"))
        self.assertTrue(validate_communication_hierarchy("TPO", "Dean"))
        self.assertTrue(validate_communication_hierarchy("TPO", "Principal"))
        self.assertTrue(validate_communication_hierarchy("TPO", "Alumni"))
        self.assertTrue(validate_communication_hierarchy("TPO", "HOD"))
        self.assertTrue(validate_communication_hierarchy("TPO", "Student"))

    def test_dean_permissions(self):
        # Dean can message HOD, TPO, Principal, CEO, Student
        self.assertTrue(validate_communication_hierarchy("Dean", "HOD"))
        self.assertTrue(validate_communication_hierarchy("Dean", "TPO"))
        self.assertTrue(validate_communication_hierarchy("Dean", "Principal"))
        self.assertTrue(validate_communication_hierarchy("Dean", "CEO"))
        self.assertTrue(validate_communication_hierarchy("Dean", "Student"))

    def test_principal_permissions(self):
        # Principal can message TPO, Dean, CEO, Student
        self.assertTrue(validate_communication_hierarchy("Principal", "TPO"))
        self.assertTrue(validate_communication_hierarchy("Principal", "Dean"))
        self.assertTrue(validate_communication_hierarchy("Principal", "CEO"))
        self.assertTrue(validate_communication_hierarchy("Principal", "Student"))

    def test_ceo_permissions(self):
        # CEO can message Principal, Student, Faculty
        self.assertTrue(validate_communication_hierarchy("CEO", "Principal"))
        self.assertTrue(validate_communication_hierarchy("CEO", "Student"))
        self.assertTrue(validate_communication_hierarchy("CEO", "Faculty"))

    def test_central_admin_permissions(self):
        # Central Admin has full admin communications hierarchy
        self.assertTrue(validate_communication_hierarchy("Central Admin", "TPO"))
        self.assertTrue(validate_communication_hierarchy("Central Admin", "Dean"))
        self.assertTrue(validate_communication_hierarchy("Central Admin", "Principal"))
        self.assertTrue(validate_communication_hierarchy("Central Admin", "Faculty"))
        self.assertTrue(validate_communication_hierarchy("Central Admin", "Student"))


if __name__ == "__main__":
    unittest.main()
