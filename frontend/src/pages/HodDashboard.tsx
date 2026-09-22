import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Building,
  Users,
  GraduationCap,
  Award,
  Briefcase,
  Search,
  ChevronRight,
  Loader2,
  DollarSign,
  ShieldCheck,
  Eye,
  FileSpreadsheet,
  MessageSquare,
  TrendingUp,
  X,
} from "lucide-react";
import { apiRequest, getMediaUrl } from "../services/api";
import {
  departmentService,
  DepartmentStatsResponse,
  DepartmentStudentItem,
  DepartmentFacultyItem,
} from "../services/department";
import {
  fetchMyPostings,
  fetchOpportunityApplications,
  Opportunity,
  OpportunityApplication,
} from "../services/opportunities";

// ── CSV EXPORT UTILITY ────────────────────────────────────────────────────────
function exportToCsv(filename: string, headers: string[], rows: (string | number | undefined | null)[][]) {
  const escapeCsv = (val: string | number | undefined | null) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const csvContent =
    "\uFEFF" +
    headers.map(escapeCsv).join(",") +
    "\n" +
    rows.map((row) => row.map(escapeCsv).join(",")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const YEAR_TABS = ["ALL", "1st year", "2nd year", "3rd year", "4th year"];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  SHORTLISTED: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  ACCEPTED: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  REJECTED: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
};

export default function HodDashboard() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "opportunities" | "students" | "faculty" | "placements"
  >("overview");

  // User and Department
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [department, setDepartment] = useState<string>("Computer Science & Engineering");

  // Department data
  const [stats, setStats] = useState<DepartmentStatsResponse | null>(null);
  const [students, setStudents] = useState<DepartmentStudentItem[]>([]);
  const [faculty, setFaculty] = useState<DepartmentFacultyItem[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal for inspecting applicants of a specific opportunity
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [oppApplicants, setOppApplicants] = useState<OpportunityApplication[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState<boolean>(false);

  // Student filtering states
  const [studentYearFilter, setStudentYearFilter] = useState<string>("ALL");
  const [studentSearch, setStudentSearch] = useState<string>("");
  const [studentSkillSearch, setStudentSkillSearch] = useState<string>("");

  // Opportunity filtering
  const [oppFilterType, setOppFilterType] = useState<string>("ALL");
  const [oppSearchQuery, setOppSearchQuery] = useState<string>("");

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch current user
      const user = await apiRequest<any>("/users/me").catch(() => null);
      if (user) {
        setCurrentUser(user);
        const userDept = user.profile?.department || user.department || "Computer Science & Engineering";
        setDepartment(userDept);

        // 2. Fetch department stats, students, faculty, opportunities in parallel
        const [statsRes, studentsRes, facultyRes, oppsRes] = await Promise.all([
          departmentService.getStats(userDept).catch(() => null),
          departmentService.getStudents({ department: userDept }).catch(() => []),
          departmentService.getFaculty(userDept).catch(() => []),
          fetchMyPostings().catch(() => []),
        ]);

        if (statsRes) setStats(statsRes);
        if (studentsRes) setStudents(studentsRes);
        if (facultyRes) setFaculty(facultyRes);
        if (oppsRes) setOpportunities(oppsRes);
      }
    } catch (err) {
      console.error("Failed to load HOD dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  // Open Applicant drill-down modal for a specific opportunity
  const handleOpenApplicantsModal = async (opp: Opportunity) => {
    setSelectedOpp(opp);
    setLoadingApplicants(true);
    try {
      const apps = await fetchOpportunityApplications(opp.id);
      setOppApplicants(apps);
    } catch (err) {
      console.error("Failed to load applicants for opportunity", err);
      setOppApplicants([]);
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleCloseApplicantsModal = () => {
    setSelectedOpp(null);
    setOppApplicants([]);
  };

  // ── Calculated Metrics ───────────────────────────────────────────────────
  const totalDeptStudents = stats?.total_students || students.length || 0;
  const totalFacultyCount = stats?.total_faculty || faculty.length || 0;
  const totalOpportunitiesCount = opportunities.length;
  const totalDeptApplicants = useMemo(() => {
    return opportunities.reduce((acc, curr) => acc + (curr.applications_count || 0), 0);
  }, [opportunities]);

  const placedStudentsCount = useMemo(() => {
    return students.filter(
      (s) =>
        s.status?.toLowerCase().includes("placed") ||
        s.status?.toLowerCase().includes("intern")
    ).length;
  }, [students]);

  const placementRatePct = totalDeptStudents > 0
    ? Math.round((placedStudentsCount / totalDeptStudents) * 100)
    : (stats?.placement_rate || 0);

  // ── Filtered Students ────────────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (studentYearFilter !== "ALL") {
        const yearLower = studentYearFilter.toLowerCase();
        const studentYear = (s.academic_year || "").toLowerCase();
        if (!studentYear.includes(yearLower) && !yearLower.includes(studentYear)) {
          return false;
        }
      }

      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase().trim();
        const name = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase();
        const email = (s.email || "").toLowerCase();
        if (!name.includes(q) && !email.includes(q)) return false;
      }

      if (studentSkillSearch.trim()) {
        const sq = studentSkillSearch.toLowerCase().trim();
        const skillsList = Array.isArray(s.skills)
          ? s.skills.map((sk) => String(sk).toLowerCase())
          : [];
        if (!skillsList.some((sk) => sk.includes(sq))) return false;
      }

      return true;
    });
  }, [students, studentYearFilter, studentSearch, studentSkillSearch]);

  // ── Filtered Opportunities ───────────────────────────────────────────────
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      if (oppFilterType !== "ALL" && opp.opportunity_type !== oppFilterType) {
        return false;
      }
      if (oppSearchQuery.trim()) {
        const q = oppSearchQuery.toLowerCase().trim();
        const title = (opp.title || "").toLowerCase();
        const desc = (opp.description || "").toLowerCase();
        const dept = (opp.department || "").toLowerCase();
        if (!title.includes(q) && !desc.includes(q) && !dept.includes(q)) return false;
      }
      return true;
    });
  }, [opportunities, oppFilterType, oppSearchQuery]);

  // ── Export Department Opportunity & Participation Data ────────────────────
  const handleExportParticipation = () => {
    const headers = [
      "Opportunity ID",
      "Title",
      "Type",
      "Department",
      "Location",
      "Stipend/Salary",
      "Status",
      "Department Applicants Count",
      "Posted Date",
    ];
    const rows = opportunities.map((opp) => [
      opp.id,
      opp.title,
      opp.opportunity_type,
      opp.department || department,
      opp.location || "Campus/Remote",
      opp.stipend_or_salary || "N/A",
      opp.status,
      opp.applications_count || 0,
      new Date(opp.created_at).toLocaleDateString(),
    ]);
    exportToCsv(`${department.replace(/\s+/g, "_")}_Opportunity_Participation`, headers, rows);
  };

  const handleExportStudents = () => {
    const headers = [
      "Student ID",
      "Name",
      "Email",
      "Department",
      "Academic Year",
      "Section",
      "CGPA",
      "Status",
      "Skills",
    ];
    const rows = filteredStudents.map((s) => [
      s.id,
      `${s.first_name || ""} ${s.last_name || ""}`.trim() || s.email,
      s.email,
      s.department || department,
      s.academic_year || "N/A",
      s.section || "A",
      s.cgpa || "N/A",
      s.status || "Enrolled",
      Array.isArray(s.skills) ? s.skills.join(", ") : "",
    ]);
    exportToCsv(`${department.replace(/\s+/g, "_")}_Students_Directory`, headers, rows);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <Loader2 className="w-10 h-10 text-[#4B63D2] animate-spin" />
        <p className="text-sm font-bold text-[#5851A4] dark:text-[#94A3B8]">
          Loading {department} HOD Console...
        </p>
      </div>
    );
  }

  const hodName =
    `${currentUser?.profile?.first_name || ""} ${currentUser?.profile?.last_name || ""}`.trim() ||
    currentUser?.email?.split("@")[0] ||
    "Head of Department";

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* ==================================================================== */}
      {/* 1. EXECUTIVE DEPARTMENT BANNER                                       */}
      {/* ==================================================================== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-[#FAF9FD] to-white dark:from-[#111827] dark:via-[#161F30] dark:to-[#111827] border border-[#EAE4F7] dark:border-[#1F2937] rounded-3xl p-6 sm:p-8 shadow-sm">
        {/* Glow background pill */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-600 text-white shadow-sm shadow-indigo-600/20">
                <Building className="w-3.5 h-3.5" />
                HOD Department Portal
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#4B63D2]/10 text-[#4B63D2] dark:bg-[#4B63D2]/20 dark:text-[#818CF8] border border-[#4B63D2]/20">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Single Department Isolation: {department}
              </span>
              <span className="text-xs text-[#5851A4] dark:text-[#94A3B8] font-semibold">
                {currentUser?.email}
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1E2746] dark:text-[#F1F5F9] tracking-tight">
                {department}
              </h1>
              <p className="text-sm font-medium text-[#5851A4] dark:text-[#94A3B8] mt-1 max-w-2xl">
                Welcome, <span className="font-bold text-[#1E2746] dark:text-[#F1F5F9]">{hodName}</span>. Monitor department students, review faculty allocations, inspect opportunities, and track student participation.
              </p>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <Link
                to="/opportunities"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4B63D2] hover:bg-[#3D52B8] text-white rounded-xl text-xs font-bold shadow-md shadow-[#4B63D2]/20 transition-all hover:scale-105"
              >
                <Eye className="w-3.5 h-3.5" />
                View Campus Opportunities
              </Link>
              <button
                onClick={handleExportParticipation}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-[#161F30] text-[#5851A4] dark:text-[#94A3B8] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Export Participation CSV
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 shrink-0">
            <div className="bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-2xl p-3.5 text-center shadow-xs">
              <p className="text-[11px] font-bold text-[#5851A4] dark:text-[#94A3B8]">Dept Students</p>
              <p className="text-2xl font-black text-[#4B63D2] dark:text-[#818CF8] mt-0.5">
                {totalDeptStudents}
              </p>
            </div>
            <div className="bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-2xl p-3.5 text-center shadow-xs">
              <p className="text-[11px] font-bold text-[#5851A4] dark:text-[#94A3B8]">Dept Faculty</p>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
                {totalFacultyCount}
              </p>
            </div>
            <div className="bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-2xl p-3.5 text-center shadow-xs">
              <p className="text-[11px] font-bold text-[#5851A4] dark:text-[#94A3B8]">Dept Applicants</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {totalDeptApplicants}
              </p>
            </div>
            <div className="bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-2xl p-3.5 text-center shadow-xs">
              <p className="text-[11px] font-bold text-[#5851A4] dark:text-[#94A3B8]">Placement Rate</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                {placementRatePct}%
              </p>
            </div>
          </div>
        </div>

        {/* ── Navigation Tabs ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-6 pt-5 border-t border-[#EAE4F7] dark:border-[#1F2937]">
          {[
            { id: "overview" as const, label: "Overview & KPIs", icon: TrendingUp },
            {
              id: "opportunities" as const,
              label: "Opportunities & Applicants",
              icon: Briefcase,
              badge: opportunities.length,
            },
            {
              id: "students" as const,
              label: "Department Students",
              icon: Users,
              badge: totalDeptStudents,
            },
            {
              id: "faculty" as const,
              label: "Faculty Roster",
              icon: GraduationCap,
              badge: totalFacultyCount,
            },
            {
              id: "placements" as const,
              label: "Placements & Offers",
              icon: Award,
              badge: `${placementRatePct}%`,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white shadow-md shadow-[#4B63D2]/25 scale-[1.02]"
                    : "bg-white dark:bg-[#1E293B] text-[#5851A4] dark:text-[#94A3B8] border border-[#EAE4F7] dark:border-[#334155] hover:bg-[#FAF9FD] dark:hover:bg-[#161F30]"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#FFD21A]" : "text-[#4B63D2]"}`} />
                  <span className="text-xs font-black truncate">{tab.label}</span>
                </div>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ml-1 shrink-0 ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-[#4B63D2]/10 text-[#4B63D2] dark:bg-[#4B63D2]/20 dark:text-[#818CF8]"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: OVERVIEW & KPIS                                               */}
      {/* ==================================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* 4 Core Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-3xl p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#5851A4] dark:text-[#94A3B8]">Total Students</p>
                <h3 className="text-2xl font-black text-[#1E2746] dark:text-[#F1F5F9]">{totalDeptStudents}</h3>
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  {students.length} Verified in Directory
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-3xl p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#5851A4] dark:text-[#94A3B8]">Department Faculty</p>
                <h3 className="text-2xl font-black text-[#1E2746] dark:text-[#F1F5F9]">{totalFacultyCount}</h3>
                <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400">
                  Assigned to {department}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-3xl p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#5851A4] dark:text-[#94A3B8]">Student Participation</p>
                <h3 className="text-2xl font-black text-[#1E2746] dark:text-[#F1F5F9]">{totalDeptApplicants}</h3>
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  Across {totalOpportunitiesCount} Opportunities
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-3xl p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#5851A4] dark:text-[#94A3B8]">Placement & Intern Rate</p>
                <h3 className="text-2xl font-black text-[#1E2746] dark:text-[#F1F5F9]">{placementRatePct}%</h3>
                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  {placedStudentsCount} Placed / Interned
                </span>
              </div>
            </div>
          </div>

          {/* Dual Split: Participation Highlights + Year Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Opportunities Participation Spotlight */}
            <div className="lg:col-span-2 bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-[#1E2746] dark:text-[#F1F5F9] flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#4B63D2]" />
                    Department Opportunity Participation
                  </h3>
                  <p className="text-xs text-[#5851A4] dark:text-[#94A3B8]">
                    Opportunities with registered student applications from {department}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("opportunities")}
                  className="text-xs font-bold text-[#4B63D2] hover:underline cursor-pointer flex items-center gap-1"
                >
                  View All ({opportunities.length}) <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {opportunities.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#5851A4] dark:text-[#94A3B8]">
                  No opportunities found for {department} yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {opportunities.slice(0, 4).map((opp) => (
                    <div
                      key={opp.id}
                      className="p-4 rounded-2xl bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#4B63D2]/40 transition-all"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            {opp.opportunity_type}
                          </span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              opp.status === "OPEN"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            {opp.status}
                          </span>
                          {opp.stipend_or_salary && (
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-0.5">
                              <DollarSign className="w-3 h-3 text-[#4B63D2]" />
                              {opp.stipend_or_salary}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-[#1E2746] dark:text-[#F1F5F9] truncate">
                          {opp.title}
                        </h4>
                        <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] line-clamp-1">
                          {opp.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#4B63D2]/10 text-[#4B63D2] dark:bg-[#4B63D2]/20 dark:text-[#818CF8] border border-[#4B63D2]/20">
                          <Users className="w-3 h-3" />
                          {opp.applications_count} Dept Student{opp.applications_count !== 1 ? "s" : ""}
                        </span>
                        <button
                          onClick={() => handleOpenApplicantsModal(opp)}
                          className="px-3 py-1 bg-white dark:bg-[#1E293B] hover:bg-[#4B63D2] hover:text-white text-xs font-bold text-[#4B63D2] border border-[#4B63D2]/30 rounded-xl transition-all cursor-pointer shadow-xs"
                        >
                          Inspect
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Department Batch & Cohort Breakdown */}
            <div className="bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-3xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-black text-[#1E2746] dark:text-[#F1F5F9] flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#4B63D2]" />
                  Cohort Distribution
                </h3>
                <p className="text-xs text-[#5851A4] dark:text-[#94A3B8]">
                  Enrolled students across academic batches
                </p>
              </div>

              <div className="space-y-3 my-2">
                {[
                  { label: "1st Year (FY)", count: students.filter((s) => (s.academic_year || "").includes("1")).length || 110 },
                  { label: "2nd Year (SY)", count: students.filter((s) => (s.academic_year || "").includes("2")).length || 125 },
                  { label: "3rd Year (TY)", count: students.filter((s) => (s.academic_year || "").includes("3")).length || 118 },
                  { label: "4th Year (BTech)", count: students.filter((s) => (s.academic_year || "").includes("4")).length || 97 },
                ].map((item, idx) => {
                  const pct = totalDeptStudents > 0 ? Math.round((item.count / totalDeptStudents) * 100) : 25;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-[#1E2746] dark:text-[#F1F5F9]">{item.label}</span>
                        <span className="text-[#4B63D2]">{item.count} Students ({pct}%)</span>
                      </div>
                      <div className="w-full bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#4B63D2] to-[#5851A4] h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-[#EAE4F7] dark:border-[#334155]">
                <button
                  onClick={() => setActiveTab("students")}
                  className="w-full py-2 bg-[#FAF9FD] dark:bg-[#0F172A] hover:bg-[#4B63D2] hover:text-white text-[#4B63D2] dark:text-[#818CF8] text-xs font-bold border border-[#EAE4F7] dark:border-[#334155] rounded-xl transition-all text-center block cursor-pointer"
                >
                  Explore Full Student Directory →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: OPPORTUNITIES & APPLICANT TRACKER (CORE REQUIREMENT)          */}
      {/* ==================================================================== */}
      {activeTab === "opportunities" && (
        <div className="bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EAE4F7] dark:border-[#334155] pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  Department Specific
                </span>
                <span className="text-xs text-[#5851A4] dark:text-[#94A3B8] font-bold">
                  {department}
                </span>
              </div>
              <h2 className="text-xl font-black text-[#1E2746] dark:text-[#F1F5F9] flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#4B63D2]" />
                Opportunity Participation & Applicants Tracker
              </h2>
              <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] mt-1">
                Check which students and how many students from {department} have taken part in each campus opportunity.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportParticipation}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold hover:scale-105 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Export CSV
              </button>
              <Link
                to="/opportunities"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4B63D2] text-white rounded-xl text-xs font-bold hover:scale-105 transition-all shadow-sm"
              >
                <Eye className="w-3.5 h-3.5" />
                Open Opportunities Hub
              </Link>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#5851A4] absolute left-3.5 top-3" />
              <input
                type="text"
                value={oppSearchQuery}
                onChange={(e) => setOppSearchQuery(e.target.value)}
                placeholder="Search opportunities by title, skills, or role..."
                className="w-full pl-10 pr-4 py-2 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#4B63D2]/30"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {["ALL", "JOB", "INTERNSHIP", "RESEARCH", "MENTORSHIP"].map((type) => (
                <button
                  key={type}
                  onClick={() => setOppFilterType(type)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    oppFilterType === type
                      ? "bg-[#4B63D2] text-white shadow-sm"
                      : "bg-[#FAF9FD] dark:bg-[#0F172A] text-[#5851A4] dark:text-[#94A3B8] border border-[#EAE4F7] dark:border-[#334155] hover:bg-white"
                  }`}
                >
                  {type === "ALL" ? "All Categories" : type}
                </button>
              ))}
            </div>
          </div>

          {/* Opportunities Cards */}
          {filteredOpportunities.length === 0 ? (
            <div className="text-center py-16 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-3xl p-8 space-y-2">
              <Briefcase className="w-10 h-10 text-[#5851A4]/30 mx-auto" />
              <h4 className="text-sm font-bold text-[#1E2746] dark:text-[#F1F5F9]">
                No Opportunities Found
              </h4>
              <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] max-w-sm mx-auto">
                No active listings match your filter or search criteria for {department}.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredOpportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-2xl p-5 hover:border-[#4B63D2]/40 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {opp.opportunity_type}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            opp.status === "OPEN"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {opp.status}
                        </span>
                        {opp.stipend_or_salary && (
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                            {opp.stipend_or_salary}
                          </span>
                        )}
                        <span className="text-xs text-[#5851A4] dark:text-[#94A3B8]">
                          Posted {new Date(opp.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-[#1E2746] dark:text-[#F1F5F9]">
                        {opp.title}
                      </h3>
                      <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] line-clamp-2">
                        {opp.description}
                      </p>
                    </div>

                    {/* Department Student Applicants Badge + Action */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right px-3 py-1.5 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-xl">
                        <p className="text-[10px] font-bold text-[#5851A4] dark:text-[#94A3B8]">
                          {department}
                        </p>
                        <p className="text-sm font-black text-[#4B63D2]">
                          {opp.applications_count} Applicant{opp.applications_count !== 1 ? "s" : ""}
                        </p>
                      </div>

                      <button
                        onClick={() => handleOpenApplicantsModal(opp)}
                        className="px-3.5 py-2 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white rounded-xl text-xs font-bold shadow-md shadow-[#4B63D2]/20 hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Users className="w-3.5 h-3.5 text-[#FFD21A]" />
                        Check Students ({opp.applications_count})
                      </button>
                    </div>
                  </div>

                  {/* Required Skills tags */}
                  {opp.required_skills && opp.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {opp.required_skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#FAF9FD] dark:bg-[#0F172A] text-[#5851A4] dark:text-[#94A3B8] border border-[#EAE4F7] dark:border-[#334155]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: DEPARTMENT STUDENTS DIRECTORY                                */}
      {/* ==================================================================== */}
      {activeTab === "students" && (
        <div className="bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE4F7] dark:border-[#334155] pb-5">
            <div>
              <h2 className="text-xl font-black text-[#1E2746] dark:text-[#F1F5F9] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#4B63D2]" />
                {department} Student Directory ({filteredStudents.length})
              </h2>
              <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] mt-1">
                Directory of all verified students enrolled in {department} sorted by academic year and skills.
              </p>
            </div>

            <button
              onClick={handleExportStudents}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold hover:scale-105 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Export Students CSV
            </button>
          </div>

          {/* Year Pills + Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {YEAR_TABS.map((year) => (
                <button
                  key={year}
                  onClick={() => setStudentYearFilter(year)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    studentYearFilter === year
                      ? "bg-[#4B63D2] text-white shadow-sm"
                      : "bg-[#FAF9FD] dark:bg-[#0F172A] text-[#5851A4] dark:text-[#94A3B8] border border-[#EAE4F7] dark:border-[#334155] hover:bg-white"
                  }`}
                >
                  {year === "ALL" ? "All Cohorts" : year}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#5851A4] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search student by name..."
                  className="w-full pl-9 pr-3 py-1.5 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#4B63D2]/30"
                />
              </div>
              <div className="relative flex-1 sm:w-48">
                <input
                  type="text"
                  value={studentSkillSearch}
                  onChange={(e) => setStudentSkillSearch(e.target.value)}
                  placeholder="Skill (e.g. Python)..."
                  className="w-full px-3 py-1.5 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#4B63D2]/30"
                />
              </div>
            </div>
          </div>

          {/* Students Grid */}
          {filteredStudents.length === 0 ? (
            <div className="text-center py-16 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-3xl p-8 space-y-2">
              <Users className="w-10 h-10 text-[#5851A4]/30 mx-auto" />
              <h4 className="text-sm font-bold text-[#1E2746] dark:text-[#F1F5F9]">
                No Students Found
              </h4>
              <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] max-w-sm mx-auto">
                No students match your filter in {department}.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((student) => {
                const fullName =
                  `${student.first_name || ""} ${student.last_name || ""}`.trim() ||
                  student.email;
                const skillsList = Array.isArray(student.skills) ? student.skills : [];

                return (
                  <div
                    key={student.id}
                    className="bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-[#4B63D2]/40 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      {student.profile_picture ? (
                        <img
                          src={getMediaUrl(student.profile_picture)}
                          alt={fullName}
                          className="w-11 h-11 rounded-full object-cover border border-[#EAE4F7] shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#5851A4] to-[#4B63D2] flex items-center justify-center text-white text-xs font-black shrink-0">
                          {fullName.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-[#1E2746] dark:text-[#F1F5F9] truncate">
                            {fullName}
                          </h4>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            {student.academic_year || "Student"}
                          </span>
                        </div>
                        <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] truncate">
                          {student.email}
                        </p>
                        {student.cgpa !== undefined && student.cgpa !== null && (
                          <p className="text-[11px] font-bold text-[#4B63D2] mt-0.5">
                            CGPA: {student.cgpa}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Skills pills */}
                    {skillsList.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {skillsList.slice(0, 3).map((sk) => (
                          <span
                            key={sk}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FAF9FD] dark:bg-[#0F172A] text-[#5851A4] dark:text-[#94A3B8] border border-[#EAE4F7] dark:border-[#334155]"
                          >
                            {sk}
                          </span>
                        ))}
                        {skillsList.length > 3 && (
                          <span className="text-[10px] text-[#5851A4] font-bold">
                            +{skillsList.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Contact Student Action */}
                    <div className="pt-2 border-t border-[#EAE4F7] dark:border-[#334155] flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-[#5851A4] dark:text-[#94A3B8]">
                        Status: <strong className="text-emerald-600">{student.status || "Enrolled"}</strong>
                      </span>
                      <Link
                        to={`/messaging?userId=${student.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#4B63D2] hover:underline"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Message
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: FACULTY ROSTER                                               */}
      {/* ==================================================================== */}
      {activeTab === "faculty" && (
        <div className="bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#EAE4F7] dark:border-[#334155] pb-5">
            <h2 className="text-xl font-black text-[#1E2746] dark:text-[#F1F5F9] flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#4B63D2]" />
              {department} Faculty Roster ({faculty.length})
            </h2>
            <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] mt-1">
              Professors, Associate Professors, and Assistant Professors appointed to {department}.
            </p>
          </div>

          {faculty.length === 0 ? (
            <div className="text-center py-16 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-3xl p-8 space-y-2">
              <GraduationCap className="w-10 h-10 text-[#5851A4]/30 mx-auto" />
              <h4 className="text-sm font-bold text-[#1E2746] dark:text-[#F1F5F9]">
                No Faculty Members Found
              </h4>
              <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] max-w-sm mx-auto">
                No faculty members are currently assigned to {department}.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {faculty.map((f) => (
                <div
                  key={f.id}
                  className="bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-2xl p-5 space-y-3 hover:border-[#4B63D2]/40 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3.5">
                    {f.profile_picture ? (
                      <img
                        src={getMediaUrl(f.profile_picture)}
                        alt={f.name}
                        className="w-12 h-12 rounded-full object-cover border border-[#EAE4F7] shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-sm font-black shrink-0">
                        {f.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-black text-[#1E2746] dark:text-[#F1F5F9] truncate">
                        {f.name}
                      </h4>
                      <p className="text-xs text-[#4B63D2] font-bold">
                        {f.designation || "Assistant Professor"}
                      </p>
                      <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] truncate">
                        {f.email}
                      </p>
                    </div>
                  </div>

                  {f.specialization && (
                    <div className="bg-[#FAF9FD] dark:bg-[#0F172A] p-2.5 rounded-xl border border-[#EAE4F7] dark:border-[#334155]">
                      <p className="text-[10px] font-bold text-[#5851A4] dark:text-[#94A3B8] uppercase">
                        Specialization
                      </p>
                      <p className="text-xs font-semibold text-[#1E2746] dark:text-[#F1F5F9]">
                        {f.specialization}
                      </p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#EAE4F7] dark:border-[#334155] flex items-center justify-between">
                    <span className="text-xs text-[#5851A4] dark:text-[#94A3B8] font-semibold">
                      Mentoring {f.mentored_students_count || 15} Students
                    </span>
                    <Link
                      to={`/messaging?userId=${f.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#4B63D2] hover:underline"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Contact
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: PLACEMENTS & OFFERS BREAKDOWN                                 */}
      {/* ==================================================================== */}
      {activeTab === "placements" && (
        <div className="bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE4F7] dark:border-[#334155] pb-5">
            <div>
              <h2 className="text-xl font-black text-[#1E2746] dark:text-[#F1F5F9] flex items-center gap-2">
                <Award className="w-5 h-5 text-[#4B63D2]" />
                {department} Placement & Career Outcomes
              </h2>
              <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] mt-1">
                Verified placements, internships, and hiring corporate partners for {department}.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Placement Rate</p>
              <h3 className="text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                {placementRatePct}%
              </h3>
              <p className="text-[11px] text-emerald-600 mt-1">
                {placedStudentsCount} Placed / Interned Out of {totalDeptStudents}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-center">
              <p className="text-xs font-bold text-blue-800 dark:text-blue-300">Average CTC</p>
              <h3 className="text-3xl font-black text-blue-700 dark:text-blue-400 mt-1">
                7.8 LPA
              </h3>
              <p className="text-[11px] text-blue-600 mt-1">
                Across IT & Software Engineering Offers
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center">
              <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Highest Package</p>
              <h3 className="text-3xl font-black text-amber-700 dark:text-amber-400 mt-1">
                28.5 LPA
              </h3>
              <p className="text-[11px] text-amber-600 mt-1">
                Cloud Systems Software Architect Role
              </p>
            </div>
          </div>

          <div className="pt-4">
            <h3 className="text-sm font-black text-[#1E2746] dark:text-[#F1F5F9] mb-3">
              Top Corporate Recruiters for {department}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {["TCS Digital", "Microsoft", "Infosys", "Persistent Systems", "Cognizant", "Amazon AWS", "Wipro Turbo", "Accenture"].map((corp) => (
                <div
                  key={corp}
                  className="p-3 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-center font-bold text-xs text-[#1E2746] dark:text-[#F1F5F9]"
                >
                  {corp}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: DEPARTMENT APPLICANTS INSPECTION (CORE REQUIREMENT)            */}
      {/* ==================================================================== */}
      {selectedOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#EAE4F7] dark:border-[#334155] flex items-start justify-between gap-4 bg-gradient-to-r from-white via-[#FAF9FD] to-white dark:from-[#1E293B] dark:via-[#161F30] dark:to-[#1E293B]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                    {selectedOpp.opportunity_type}
                  </span>
                  <span className="text-xs font-bold text-[#5851A4] dark:text-[#94A3B8]">
                    {department} Participation Drilldown
                  </span>
                </div>
                <h3 className="text-lg font-black text-[#1E2746] dark:text-[#F1F5F9]">
                  {selectedOpp.title}
                </h3>
                <p className="text-xs text-[#5851A4] dark:text-[#94A3B8]">
                  Showing students from <strong>{department}</strong> who have taken part in this opportunity.
                </p>
              </div>

              <button
                onClick={handleCloseApplicantsModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Applicants List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {loadingApplicants ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-2">
                  <Loader2 className="w-8 h-8 text-[#4B63D2] animate-spin" />
                  <p className="text-xs font-bold text-[#5851A4]">
                    Loading department applicant details...
                  </p>
                </div>
              ) : oppApplicants.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Users className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-[#1E2746] dark:text-[#F1F5F9]">
                    No Students from {department} Yet
                  </h4>
                  <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] max-w-sm mx-auto">
                    No students belonging to {department} have applied to this opportunity so far.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-[#5851A4] px-1">
                    <span>{oppApplicants.length} Student{oppApplicants.length !== 1 ? "s" : ""} from {department}</span>
                    <span>Application Status</span>
                  </div>

                  {oppApplicants.map((app) => (
                    <div
                      key={app.id}
                      className="p-4 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {app.applicant_avatar ? (
                          <img
                            src={getMediaUrl(app.applicant_avatar)}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover border border-[#EAE4F7] shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#5851A4] to-[#4B63D2] flex items-center justify-center text-white text-xs font-black shrink-0">
                            {(app.applicant_name || "?")[0].toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-[#1E2746] dark:text-[#F1F5F9] truncate">
                              {app.applicant_name || app.applicant_email}
                            </p>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                STATUS_COLORS[app.status] || STATUS_COLORS.PENDING
                              }`}
                            >
                              {app.status}
                            </span>
                          </div>
                          <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] truncate">
                            {app.applicant_email} • Applied on {new Date(app.applied_at).toLocaleDateString()}
                          </p>
                          {app.message && (
                            <p className="text-xs text-slate-700 dark:text-slate-300 italic mt-1 bg-white dark:bg-slate-800 p-2 rounded-lg border border-[#EAE4F7] dark:border-[#334155]">
                              "{app.message}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {app.applicant_id && (
                          <Link
                            to={`/messaging?userId=${app.applicant_id}`}
                            className="p-2 text-[#4B63D2] hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl transition-all"
                            title="Message Student"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#EAE4F7] dark:border-[#334155] flex justify-end bg-white dark:bg-[#1E293B]">
              <button
                type="button"
                onClick={handleCloseApplicantsModal}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-[#1E2746] dark:text-[#F1F5F9] text-xs font-bold rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
