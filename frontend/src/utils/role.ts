export interface RoleFormatUser {
  role?: { id?: number; name?: string } | null;
  role_id?: number | null;
  role_name?: string | null;
  profile?: {
    department?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  } | null;
  department?: string | null;
  email?: string | null;
}

/**
 * Returns canonical role name based on DB role ID mapping.
 */
export function getRoleNameById(roleId: number): string {
  switch (roleId) {
    case 1:
      return "Super Admin";
    case 2:
      return "Admin";
    case 3:
      return "Student";
    case 4:
      return "Alumni";
    case 5:
      return "Recruiter";
    case 6:
      return "Faculty";
    case 7:
      return "Management";
    case 8:
      return "Controller";
    case 9:
      return "Central Admin";
    case 10:
      return "HOD";
    case 11:
      return "TPO";
    case 12:
      return "Dean";
    case 13:
      return "Principal";
    case 14:
      return "CEO";
    default:
      return "Campus Member";
  }
}

/**
 * Formats user role label accurately:
 * - Controller: "Controller - <department>" (e.g. "Controller - CSE")
 * - Faculty: "Faculty • <department>" or "Faculty Account"
 * - HOD: "HOD • <department>" or "HOD Account"
 * - Alumni: "Alumni • SBJIT" or "Alumni Account"
 * - Student: "Student • <department>" or "Student Account"
 * - Management / Officials: Exact role title (e.g. "Dean", "Principal", "CEO", "TPO")
 */
export function formatRoleLabel(user?: RoleFormatUser | null): string {
  if (!user) return "Campus Member";

  const rawRoleName =
    user.role?.name ||
    user.role_name ||
    (user.role_id ? getRoleNameById(user.role_id) : "");

  const roleLower = (rawRoleName || "").toLowerCase().trim();
  const dept = (user.profile?.department || user.department || "").trim();

  if (roleLower === "controller") {
    return dept ? `Controller - ${dept}` : "Controller";
  }
  if (roleLower === "faculty") {
    return dept ? `Faculty • ${dept}` : "Faculty Account";
  }
  if (roleLower === "hod") {
    return dept ? `HOD • ${dept}` : "HOD Account";
  }
  if (roleLower === "alumni") {
    return "Alumni • SBJIT";
  }
  if (roleLower === "student") {
    return dept ? `Student • ${dept}` : "Student Account";
  }
  if (roleLower === "tpo") return "TPO";
  if (roleLower === "dean") return "Dean";
  if (roleLower === "principal") return "Principal";
  if (roleLower === "ceo") return "CEO";
  if (roleLower === "super admin" || roleLower === "superadmin") return "Super Admin";
  if (roleLower === "central admin") return "Central Admin";
  if (roleLower === "admin") return "Admin";
  if (roleLower === "management") return "Management";
  if (roleLower === "recruiter") return "Recruiter";

  if (rawRoleName) return rawRoleName;
  return "Campus Member";
}
