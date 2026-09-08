"""
Department Controller & Central Admin High-Security Access Keys Registry for SBJIT.
These high-entropy cryptographic keys must be provided during registration to authenticate official controllers and administrators.
"""

DEPARTMENT_CONTROLLER_KEYS = {
    "First Year": "SBJIT-CTRL-FY-9Q5W-3E1R-8T2Y-4U7I",
    "CSE": "SBJIT-CTRL-CSE-8F3A-7E2D-9B4C-1A05",
    "CSE(AIML)": "SBJIT-CTRL-AIML-4K9P-2X7M-5Q8W-3N1V",
    "CSE(AIDS)": "SBJIT-CTRL-AIDS-7B2N-9X4M-1Q8W-6V3Z",
    "IT": "SBJIT-CTRL-IT-6R2T-8Y5U-1I4O-7P9E",
    "ETC": "SBJIT-CTRL-ETC-3Z8X-9C1V-7B4N-2M6Q",
    "EE": "SBJIT-CTRL-EE-5W9E-1R4T-8Y2U-6I3O",
    "ME": "SBJIT-CTRL-ME-7A3S-9D1F-4G8H-2J6K",
    "BCA": "SBJIT-CTRL-BCA-2L8K-4J1H-7G9F-5D3S",
    "MCA": "SBJIT-CTRL-MCA-8N3V-6X9P-2M1W-4Q7Y",
    "MBA": "SBJIT-CTRL-MBA-1H4J-9K2L-6F8D-5S3A",
}

CENTRAL_ADMIN_KEY = "SBJIT-SUPER-ADMIN-9X8K-4M2P-7Q1W-5V3Z-9842"


def get_expected_key(management_role: str | None, department: str | None) -> str | None:
    """Returns the expected secret security key for a given role and department."""
    if not management_role:
        return None

    role_clean = management_role.strip().lower()
    if role_clean == "controller":
        if not department:
            return None
        dept_clean = department.strip().upper().replace(" ", "")
        for dept_name, key in DEPARTMENT_CONTROLLER_KEYS.items():
            if dept_name.upper().replace(" ", "") == dept_clean:
                return key
        return None
    elif role_clean in ["central admin", "central_admin", "admin"]:
        return CENTRAL_ADMIN_KEY

    return None


def verify_security_key(
    management_role: str | None,
    department: str | None,
    provided_key: str | None,
) -> bool:
    """Validates provided security key against the department or role."""
    expected = get_expected_key(management_role, department)
    if not expected:
        return True  # No special key required for other roles

    if not provided_key:
        return False

    return provided_key.strip().upper() == expected.strip().upper()
