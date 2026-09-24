import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import FacultyOpportunities from "./FacultyOpportunities";
import HodDashboard from "./HodDashboard";
import Jobs from "./Jobs";
import { Loader2, Briefcase, GraduationCap } from "lucide-react";

/**
 * OpportunitiesPage dynamically routes the Opportunities section based on user role:
 * - HOD: Dedicated HOD Department Opportunities, Participation Tracker, and Faculty KPIs (HodDashboard).
 * - Faculty, Coordinator, TPO, Admins: Faculty Academic Opportunities Hub (with Faculty Research) and Job Board.
 * - Students & Others: Student Opportunities & Job Board (Faculty Research Collaborations, Job explore, Referrals).
 */
export default function OpportunitiesPage() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePortal, setActivePortal] = useState<"faculty" | "jobs">("faculty");

  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      try {
        const user = await apiRequest<{
          role_id?: number;
          role?: { name: string };
        }>("/users/me");
        if (isMounted) {
          const roleName = user.role?.name?.toLowerCase().trim() || "student";
          setRole(roleName);
          if (roleName.includes("faculty") || roleName.includes("coordinator")) {
            setActivePortal("faculty");
          } else {
            setActivePortal("jobs");
          }
        }
      } catch {
        if (isMounted) {
          setRole("student");
          setActivePortal("jobs");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchUser();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-10 h-10 text-[#4B63D2] animate-spin" />
        <p className="text-xs font-semibold text-[#5851A4] dark:text-[#94A3B8]">
          Loading Opportunities...
        </p>
      </div>
    );
  }

  const roleName = (role || "").toLowerCase();

  // HOD has a distinct departmental opportunities & performance dashboard
  if (roleName.includes("hod")) {
    return (
      <div className="space-y-4">
        <HodDashboard />
      </div>
    );
  }

  const canSwitchPortals =
    roleName.includes("faculty") ||
    roleName.includes("coordinator") ||
    roleName === "tpo" ||
    roleName === "admin" ||
    roleName === "super admin" ||
    roleName === "controller";

  if (canSwitchPortals) {
    return (
      <div className="space-y-4">
        {/* Portal Switcher Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2 bg-white dark:bg-[#1E2337] border border-[#EAE4F7] dark:border-[#2D334D] rounded-2xl p-1.5 sm:p-2 px-2 sm:px-3 shadow-sm max-w-xl mx-auto">
          <button
            onClick={() => setActivePortal("faculty")}
            className={`w-full sm:flex-1 py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activePortal === "faculty"
                ? "bg-[#4B63D2] text-white shadow-sm"
                : "text-[#5851A4] dark:text-[#94A3B8] hover:text-[#1E2746] dark:hover:text-white"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Faculty Academic Hub</span>
          </button>
          <button
            onClick={() => setActivePortal("jobs")}
            className={`w-full sm:flex-1 py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activePortal === "jobs"
                ? "bg-[#4B63D2] text-white shadow-sm"
                : "text-[#5851A4] dark:text-[#94A3B8] hover:text-[#1E2746] dark:hover:text-white"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Placements & Job Board</span>
          </button>
        </div>

        {activePortal === "faculty" ? <FacultyOpportunities /> : <Jobs />}
      </div>
    );
  }

  // All other users (students, alumni, recruiters, etc.) get the student/general portal
  return <Jobs />;
}
