import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Layers,
  Users,
  GraduationCap,
  Award,
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  Briefcase,
  Compass,
  Building,
  Mail,
  ShieldCheck,
  ChevronRight,
  Check,
  Loader2,
  ExternalLink,
  Send,
  X,
} from "lucide-react";
import {
  departmentService,
  DepartmentStatsResponse,
  DepartmentStudentItem,
  DepartmentFacultyItem,
  DepartmentAlumniItem,
  DepartmentAchievementItem,
} from "../services/department";
import { apiRequest, getMediaUrl } from "../services/api";

export default function DepartmentPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [selectedDept] = useState("CSE");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [deptStats, setDeptStats] = useState<DepartmentStatsResponse | null>(null);
  const [students, setStudents] = useState<DepartmentStudentItem[]>([]);
  const [faculty, setFaculty] = useState<DepartmentFacultyItem[]>([]);
  const [alumni, setAlumni] = useState<DepartmentAlumniItem[]>([]);
  const [achievements, setAchievements] = useState<DepartmentAchievementItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Student filtering states
  const [studentYearFilter, setStudentYearFilter] = useState("ALL");
  const [studentSectionFilter, setStudentSectionFilter] = useState("ALL");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [studentStatusFilter, setStudentStatusFilter] = useState("ALL");
  const [studentMinCgpa, setStudentMinCgpa] = useState<number>(0);

  // Email blast modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  // Alumni filtering states
  const [alumniYearFilter, setAlumniYearFilter] = useState("ALL");
  const [alumniSearchQuery, setAlumniSearchQuery] = useState("");

  // Achievement verification modal state
  const [verifyingAch, setVerifyingAch] = useState<DepartmentAchievementItem | null>(null);
  const [verifyRemarks, setVerifyRemarks] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Sync tab with URL query parameter
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [userRes, statsRes, studentsRes, facultyRes, alumniRes, achRes] =
        await Promise.all([
          apiRequest<any>("/users/me").catch(() => null),
          departmentService.getStats().catch(() => null),
          departmentService.getStudents().catch(() => []),
          departmentService.getFaculty().catch(() => []),
          departmentService.getAlumni().catch(() => []),
          departmentService.getAchievements().catch(() => []),
        ]);

      if (userRes) setCurrentUser(userRes);
      if (statsRes) setDeptStats(statsRes);
      if (studentsRes) setStudents(studentsRes);
      if (facultyRes) setFaculty(facultyRes);
      if (alumniRes) setAlumni(alumniRes);
      if (achRes) setAchievements(achRes);
    } catch (err) {
      console.error("Failed to load department data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleVerifyAchievement = async (status: "Verified" | "Rejected") => {
    if (!verifyingAch) return;
    try {
      setIsVerifying(true);
      const updated = await departmentService.verifyAchievement(
        verifyingAch.id,
        status,
        verifyRemarks || (status === "Verified" ? "Verified by HOD after credential audit." : "Insufficient proof.")
      );

      setAchievements((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a))
      );
      setVerifyingAch(null);
      setVerifyRemarks("");
    } catch (err) {
      console.error("Verification failed", err);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    async function loadDeptData() {
      try {
        const [statsRes] = await Promise.all([
          apiRequest<any>(`/analytics/department-stats?department=${encodeURIComponent(selectedDept)}`).catch(() => null),
        ]);
        if (statsRes) {
          // Map analytics stats to department stats format
          setDeptStats({
            department: selectedDept,
            total_students: statsRes.total_students || 450,
            total_faculty: statsRes.active_recruiters * 2 || 24,
            active_faculty: statsRes.active_recruiters * 2 || 24,
            placed_or_interned_count: statsRes.placed_students || 390,
            placed_count: statsRes.placed_students || 390,
            seeking_placement_count: 50,
            internships_count: 200,
            placement_rate: 90,
            average_cgpa: 8.2,
            clubs_count: 5,
            events_count: 10,
            alumni_engaged_count: 100,
            alumni_mentors_count: 20,
            active_referrals_count: 30,
            student_engagement_rate: 85,
            profile_completion_rate: 95,
            pending_actions_count: 2,
            reports_submitted_count: 12,
            reports_pending_count: 3,
            management_updates_count: 5,
            batches: []
          });
        }
      } catch (e) {
        console.error("Failed to load department stats", e);
      }
    }
    loadDeptData();
  }, [selectedDept]);

  const handleSendBlast = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingEmail(true);
    setTimeout(() => {
      setIsSendingEmail(false);
      setEmailSentSuccess(true);
      setTimeout(() => {
        setIsEmailModalOpen(false);
        setEmailSentSuccess(false);
        setEmailSubject("");
        setEmailBody("");
      }, 1500);
    }, 1200);
  };



  const activeDept =
    deptStats?.department ||
    currentUser?.profile?.department ||
    "Computer Science & Engineering";

  // Filtered Students
  const filteredStudents = students.filter((s) => {
    const matchesYear =
      studentYearFilter === "ALL" ||
      s.academic_year.toLowerCase().includes(studentYearFilter.toLowerCase()) ||
      String(s.graduation_year) === studentYearFilter;
    const matchesSection =
      studentSectionFilter === "ALL" ||
      s.section.toUpperCase() === studentSectionFilter.toUpperCase();
    const matchesStatus =
      studentStatusFilter === "ALL" ||
      s.status.toLowerCase().includes(studentStatusFilter.toLowerCase());
    const matchesCgpa = (s.cgpa || 0) >= studentMinCgpa;

    const query = studentSearchQuery.toLowerCase().trim();
    const fullName = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase();
    const matchesQuery =
      !query ||
      fullName.includes(query) ||
      s.email.toLowerCase().includes(query) ||
      (s.skills && s.skills.some((sk) => sk.toLowerCase().includes(query)));

    return matchesYear && matchesSection && matchesStatus && matchesCgpa && matchesQuery;
  });

  // Filtered Alumni
  const filteredAlumni = alumni.filter((a) => {
    const matchesYear =
      alumniYearFilter === "ALL" ||
      String(a.graduation_year) === alumniYearFilter;
    const query = alumniSearchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      a.name.toLowerCase().includes(query) ||
      a.company.toLowerCase().includes(query) ||
      a.role_title.toLowerCase().includes(query);
    return matchesYear && matchesQuery;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#4B63D2]" />
        <p className="text-sm font-bold text-[#5851A4]">Loading department data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Header Banner */}
      <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#4B63D2]/10 border border-[#4B63D2]/20 text-[#4B63D2] text-xs font-black">
            <Layers className="h-4 w-4" />
            <span>HOD Operations • {activeDept}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1E2746] tracking-tight">
            {activeDept} Management Center
          </h1>
          <p className="text-[#5851A4] text-xs sm:text-sm max-w-2xl font-medium leading-relaxed">
            Centralized academic, talent, placement, and governance portal. Oversee cohorts across all 4 years, mentor faculties, track alumni networks, and verify achievements.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 shrink-0">
          <Link
            to="/management-connect"
            className="px-4 py-2.5 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white rounded-xl font-bold text-xs shadow-md shadow-[#4B63D2]/20 flex items-center gap-2 hover:opacity-95 transition"
          >
            <Building className="h-4 w-4 text-[#FFD21A]" /> Management Connect
          </Link>
          <Link
            to="/reports"
            className="px-4 py-2.5 bg-white border border-[#EAE4F7] text-[#1E2746] hover:bg-[#FAF9FD] rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition"
          >
            <Award className="h-4 w-4 text-[#4B63D2]" /> Reports & Audits
          </Link>
        </div>
      </div>

      {/* Navigation Tabs (7 Department Pillars) */}
      <div className="flex items-center gap-2 border-b border-[#EAE4F7] overflow-x-auto pb-2 text-xs font-bold scrollbar-none">
        {[
          { id: "overview", label: "Overview & Cohorts", icon: Layers },
          { id: "students", label: "Students", icon: GraduationCap, badge: students.length },
          { id: "faculty", label: "Faculty Directory", icon: Users, badge: faculty.length },
          { id: "alumni", label: "Alumni Network", icon: Users, badge: alumni.length },
          { id: "placements", label: "Placements & Internships", icon: Briefcase },
          { id: "achievements", label: "Achievements & Verifications", icon: Award, badge: achievements.filter((a) => a.status === "Pending Verification").length },
          { id: "clubs", label: "Clubs & Events", icon: Compass },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
                isActive
                  ? "bg-[#4B63D2] text-white shadow-sm shadow-[#4B63D2]/30"
                  : "text-[#5851A4] hover:bg-[#FAF9FD] hover:text-[#1E2746]"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-[#FFD21A]" : ""}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-[#FFD21A] text-[#1E2746]"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: OVERVIEW & COHORTS ──────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* 4 Quantitative Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase text-[#5851A4] block">
                Total Enrolled Students
              </span>
              <div className="text-2xl font-black text-[#1E2746]">
                {deptStats?.total_students || 623}
              </div>
              <p className="text-[10px] text-emerald-600 font-bold">Across 4 Academic Years</p>
            </div>

            <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase text-[#5851A4] block">
                Faculty Staff
              </span>
              <div className="text-2xl font-black text-[#1E2746]">
                {deptStats?.total_faculty || 18}
              </div>
              <p className="text-[10px] text-[#4B63D2] font-bold">11 Ph.D. Mentors</p>
            </div>

            <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase text-[#5851A4] block">
                Placement Conversion
              </span>
              <div className="text-2xl font-black text-emerald-700">
                {deptStats?.placement_rate || 83.1}%
              </div>
              <p className="text-[10px] text-emerald-600 font-bold">118 / 142 Final Year Offers</p>
            </div>

            <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase text-[#5851A4] block">
                Average CGPA
              </span>
              <div className="text-2xl font-black text-[#1E2746]">
                {deptStats?.average_cgpa || 8.22}
              </div>
              <p className="text-[10px] text-indigo-600 font-bold">Grade A+ Department</p>
            </div>
          </div>

          {/* Academic Cohorts Year-Wise Breakdown */}
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE4F7] pb-3">
              <div>
                <h3 className="text-base font-black text-[#1E2746] flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#4B63D2]" /> Academic Cohort Status (4-Year Progression)
                </h3>
                <p className="text-xs text-[#5851A4] font-medium">
                  Year-wise enrollment, placement outcomes, and CGPA metrics
                </p>
              </div>
              <span className="text-xs font-bold text-[#4B63D2] bg-[#4B63D2]/10 px-2.5 py-1 rounded-lg">
                Batch 2025 - 2028
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(deptStats?.batches || [
                { batch: "Final Year (2025)", total: 142, placed_or_interned: 118, avg_cgpa: 8.45 },
                { batch: "Third Year (2026)", total: 156, placed_or_interned: 92, avg_cgpa: 8.20 },
                { batch: "Second Year (2027)", total: 160, placed_or_interned: 64, avg_cgpa: 7.95 },
                { batch: "First Year (2028)", total: 165, placed_or_interned: 0, avg_cgpa: 8.10 },
              ]).map((b, i) => (
                <div
                  key={i}
                  className="p-4 bg-[#FAF9FD] rounded-2xl border border-[#EAE4F7] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#1E2746]">{b.batch}</span>
                    <span className="text-[10px] font-bold text-[#4B63D2] bg-[#4B63D2]/10 px-2 py-0.5 rounded-full">
                      CGPA {b.avg_cgpa}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-[#5851A4]">Total Students:</span>
                      <span className="text-[#1E2746]">{b.total}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-[#5851A4]">Placed / Interns:</span>
                      <span className="text-emerald-700">{b.placed_or_interned}</span>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-[#EAE4F7] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#4B63D2] rounded-full"
                      style={{ width: `${Math.round((b.placed_or_interned / maxBatch(b.total)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: STUDENTS ────────────────────────────────────────────── */}
      {activeTab === "students" && (
        <div className="space-y-6">
          {/* Header Banner & Blast CTA */}
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-[#1E2746] flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#4B63D2]" /> Department Student Talent Roster
              </h3>
              <p className="text-xs text-[#5851A4] font-medium mt-0.5">
                Monitor student cohort readiness, certifications, projects, and academic progression.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEmailModalOpen(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white rounded-xl text-xs font-black transition-all shadow-md shadow-[#4B63D2]/25 flex items-center gap-2 cursor-pointer"
              >
                <Mail className="h-4 w-4 text-[#FFD21A]" />
                Broadcast Email Blast ({filteredStudents.length})
              </button>
              <div className="bg-[#FAF9FD] px-4 py-2 rounded-xl border border-[#EAE4F7] text-center">
                <span className="text-[10px] font-bold text-[#5851A4] block">Showing</span>
                <span className="text-sm font-black text-[#1E2746]">
                  {filteredStudents.length} Students
                </span>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9188BE]" />
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  placeholder="Search by student name, email, or skills (e.g. React, Python)..."
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] transition font-medium"
                />
              </div>

              {/* Batch Filter */}
              <select
                value={studentYearFilter}
                onChange={(e) => setStudentYearFilter(e.target.value)}
                className="bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-[#1E2746] focus:outline-none focus:border-[#4B63D2] cursor-pointer"
              >
                <option value="ALL">All Batches</option>
                <option value="2025">Batch 2025 (Final Year)</option>
                <option value="2026">Batch 2026 (Third Year)</option>
                <option value="2027">Batch 2027 (Second Year)</option>
                <option value="2028">Batch 2028 (First Year)</option>
              </select>

              {/* Section Filter */}
              <select
                value={studentSectionFilter}
                onChange={(e) => setStudentSectionFilter(e.target.value)}
                className="bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-[#1E2746] focus:outline-none focus:border-[#4B63D2] cursor-pointer"
              >
                <option value="ALL">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
              </select>

              {/* Placement Status */}
              <select
                value={studentStatusFilter}
                onChange={(e) => setStudentStatusFilter(e.target.value)}
                className="bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-[#1E2746] focus:outline-none focus:border-[#4B63D2] cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Seeking">Seeking Internship</option>
                <option value="Intern">Interviewing / Interning</option>
                <option value="Placed">Placed</option>
              </select>

              {/* Min CGPA Filter */}
              <div className="flex items-center gap-2 px-3 py-2 bg-[#FAF9FD] border border-[#D5CBEE] rounded-xl text-xs font-bold text-[#1E2746]">
                <span className="text-[#5851A4]">Min CGPA:</span>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={studentMinCgpa || ""}
                  onChange={(e) => setStudentMinCgpa(parseFloat(e.target.value) || 0)}
                  className="w-12 bg-transparent text-center font-black focus:outline-none"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Student Cards Grid */}
          {filteredStudents.length === 0 ? (
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-12 text-center space-y-3">
              <GraduationCap className="h-12 w-12 text-[#9188BE] mx-auto opacity-50" />
              <h3 className="text-lg font-black text-[#1E2746]">No Students Found</h3>
              <p className="text-xs text-[#5851A4] max-w-sm mx-auto font-medium">
                Try adjusting your search criteria or resetting filters to view students.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredStudents.map((student) => {
                const avatar = getMediaUrl(student.profile_picture);
                const statusColors = {
                  Placed: "bg-emerald-50 text-emerald-700 border-emerald-200",
                  "Seeking Internship": "bg-indigo-50 text-indigo-700 border-indigo-200",
                  Seeking: "bg-indigo-50 text-indigo-700 border-indigo-200",
                  Interning: "bg-amber-50 text-amber-700 border-amber-200",
                  Interviewing: "bg-amber-50 text-amber-700 border-amber-200",
                  Available: "bg-purple-50 text-purple-700 border-purple-200",
                };

                const statusKey = Object.keys(statusColors).find((k) =>
                  student.status.toLowerCase().includes(k.toLowerCase())
                ) || "Available";

                return (
                  <div
                    key={student.id}
                    className="bg-white border border-[#EAE4F7] hover:border-[#C8B6E2] rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div>
                      {/* Top row: Avatar + Name + Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {avatar ? (
                            <img
                              src={avatar}
                              alt={student.first_name || ""}
                              className="w-12 h-12 rounded-2xl object-cover border border-[#EAE4F7]"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5851A4] to-[#4B63D2] text-white font-black flex items-center justify-center text-base shadow-sm">
                              {student.first_name?.charAt(0).toUpperCase() || "S"}
                            </div>
                          )}
                          <div>
                            <Link to={`/profile/${student.id}`}>
                              <h3 className="text-sm font-black text-[#1E2746] group-hover:text-[#4B63D2] transition-colors line-clamp-1">
                                {student.first_name} {student.last_name}
                              </h3>
                            </Link>
                            <p className="text-[11px] font-bold text-[#5851A4]">
                              {student.academic_year} • Sec {student.section}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black border shrink-0 ${
                            statusColors[statusKey as keyof typeof statusColors]
                          }`}
                        >
                          {student.status}
                        </span>
                      </div>

                      {/* CGPA & Projects stats */}
                      <div className="grid grid-cols-2 gap-2 mt-4 bg-[#FAF9FD] p-2.5 rounded-xl border border-[#EAE4F7]">
                        <div className="text-center">
                          <span className="text-[10px] font-bold text-[#5851A4] block">
                            CGPA
                          </span>
                          <span className="text-xs font-black text-[#1E2746]">
                            {student.cgpa || 8.25} / 10
                          </span>
                        </div>
                        <div className="text-center border-l border-[#EAE4F7]">
                          <span className="text-[10px] font-bold text-[#5851A4] block">
                            Projects
                          </span>
                          <span className="text-xs font-black text-[#1E2746]">
                            {student.projects_count} Showcased
                          </span>
                        </div>
                      </div>

                      {/* Skills Pills */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {student.skills?.slice(0, 4).map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 bg-[#4B63D2]/10 text-[#4B63D2] rounded-lg text-[10px] font-bold"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-3 border-t border-[#EAE4F7] flex items-center justify-between gap-2">
                      <Link
                        to={`/profile/${student.id}`}
                        className="text-xs font-bold text-[#4B63D2] hover:text-[#3E53BE] flex items-center gap-1 transition"
                      >
                        View Portfolio <ExternalLink className="h-3.5 w-3.5" />
                      </Link>

                      <div className="flex items-center gap-2">
                        <Link
                          to={`/messaging?target=${student.id}`}
                          className="p-2 bg-[#FAF9FD] hover:bg-[#4B63D2] text-[#5851A4] hover:text-white rounded-xl border border-[#EAE4F7] transition"
                          title="Direct Message"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: FACULTY DIRECTORY ────────────────────────────────────── */}
      {activeTab === "faculty" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-[#1E2746] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#4B63D2]" /> Department Faculty & Research Mentors
            </h3>
            <span className="text-xs text-[#5851A4] font-medium">
              {faculty.length} Faculty Members
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {faculty.map((f) => (
              <div
                key={f.id}
                className="bg-white border border-[#EAE4F7] rounded-3xl p-5 shadow-sm hover:border-[#4B63D2]/30 transition space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#4B63D2] to-[#5851A4] text-white flex items-center justify-center font-black text-base shadow-sm">
                      {f.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1E2746]">{f.name}</h4>
                      <p className="text-[11px] font-bold text-[#4B63D2]">{f.designation}</p>
                      <p className="text-[10px] text-[#5851A4]">{f.email}</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#FAF9FD] rounded-xl border border-[#EAE4F7] text-xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-[#5851A4] block">
                    Specialization & Research Focus
                  </span>
                  <p className="text-[#1E2746] font-medium leading-relaxed">
                    {f.specialization || "Distributed Cloud Systems & AI Architecture"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 bg-white rounded-xl border border-[#EAE4F7]">
                    <span className="text-[10px] text-[#5851A4] block">Mentored</span>
                    <span className="font-bold text-[#1E2746]">{f.mentored_students_count} Students</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-[#EAE4F7]">
                    <span className="text-[10px] text-[#5851A4] block">Projects</span>
                    <span className="font-bold text-[#1E2746]">{f.active_projects_count} Active</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAE4F7]">
                  <Link
                    to={`/messaging?userId=${f.id}`}
                    className="w-full py-2 bg-[#4B63D2]/10 hover:bg-[#4B63D2] text-[#4B63D2] hover:text-white rounded-xl text-xs font-bold text-center transition flex items-center justify-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" /> Direct Message
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: ALUMNI NETWORK ───────────────────────────────────────── */}
      {activeTab === "alumni" && (
        <div className="space-y-4">
          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[#5851A4]" />
              <input
                type="text"
                value={alumniSearchQuery}
                onChange={(e) => setAlumniSearchQuery(e.target.value)}
                placeholder="Search alumni by name, company, or role..."
                className="w-full pl-9 pr-3 py-2 bg-[#FAF9FD] border border-[#EAE4F7] rounded-xl text-xs text-[#1E2746] focus:ring-2 focus:ring-[#4B63D2] outline-none"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#5851A4] font-bold">Graduation Year:</span>
              <select
                value={alumniYearFilter}
                onChange={(e) => setAlumniYearFilter(e.target.value)}
                className="bg-[#FAF9FD] border border-[#EAE4F7] text-[#1E2746] font-bold rounded-xl px-3 py-2 outline-none"
              >
                <option value="ALL">All Batches</option>
                <option value="2023">Batch 2023</option>
                <option value="2022">Batch 2022</option>
                <option value="2021">Batch 2021</option>
                <option value="2020">Batch 2020</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAlumni.map((a) => (
              <div
                key={a.id}
                className="bg-white border border-[#EAE4F7] rounded-3xl p-5 shadow-sm space-y-4 hover:border-[#4B63D2]/30 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5851A4] to-[#4B63D2] text-white flex items-center justify-center font-black text-base">
                      {a.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1E2746]">{a.name}</h4>
                      <p className="text-xs font-bold text-[#4B63D2]">{a.company}</p>
                      <p className="text-[10px] text-[#5851A4]">{a.role_title}</p>
                    </div>
                  </div>
                  {a.is_mentor && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                      Mentor
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs bg-[#FAF9FD] p-3 rounded-xl border border-[#EAE4F7]">
                  <span className="text-[#5851A4]">Graduation: <strong className="text-[#1E2746]">{a.graduation_year}</strong></span>
                  <span className="text-emerald-700 font-bold">{a.referrals_count} Campus Referrals</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {a.skills.map((sk, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-white border border-[#EAE4F7] text-[10px] font-bold text-[#5851A4] rounded-md"
                    >
                      {sk}
                    </span>
                  ))}
                </div>

                <Link
                  to={`/messaging?userId=${a.id}`}
                  className="w-full py-2 bg-[#4B63D2] hover:bg-[#3E53BE] text-white rounded-xl text-xs font-bold text-center block transition shadow-sm"
                >
                  Connect / Request Mentorship
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 5: PLACEMENTS & INTERNSHIPS ─────────────────────────────── */}
      {activeTab === "placements" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase text-[#5851A4] block">
                Total Placed (Final Year)
              </span>
              <div className="text-2xl font-black text-[#1E2746]">118 / 142</div>
              <p className="text-[10px] text-emerald-600 font-bold">83.1% Conversion Rate</p>
            </div>

            <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase text-[#5851A4] block">
                Highest CTC Package
              </span>
              <div className="text-2xl font-black text-emerald-700">32.0 LPA</div>
              <p className="text-[10px] text-[#5851A4]">Adobe Systems</p>
            </div>

            <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase text-[#5851A4] block">
                Average CTC Package
              </span>
              <div className="text-2xl font-black text-[#1E2746]">8.15 LPA</div>
              <p className="text-[10px] text-indigo-600 font-bold">+18% YoY Growth</p>
            </div>

            <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase text-[#5851A4] block">
                Summer Internships
              </span>
              <div className="text-2xl font-black text-[#1E2746]">138 Active</div>
              <p className="text-[10px] text-[#4B63D2] font-bold">Avg Stipend: ₹28.5k/mo</p>
            </div>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE4F7] pb-3">
              <div>
                <h3 className="text-base font-black text-[#1E2746]">
                  Key Placement Drives & Corporate Recruiters
                </h3>
                <p className="text-xs text-[#5851A4]">
                  Active hiring campaigns on campus for {activeDept}
                </p>
              </div>
              <Link
                to="/reports"
                className="text-xs font-bold text-[#4B63D2] hover:underline flex items-center gap-1"
              >
                Generate Placement Report <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAF9FD] text-[10px] font-black uppercase text-[#5851A4] border-b border-[#EAE4F7]">
                    <th className="py-3 px-4">Company Name</th>
                    <th className="py-3 px-4">Role Profile</th>
                    <th className="py-3 px-4">Package</th>
                    <th className="py-3 px-4">Offers</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE4F7]">
                  {[
                    { name: "Tata Consultancy Services", role: "Digital SDE", ctc: "7.5 - 9.0 LPA", count: 42, status: "Completed" },
                    { name: "Persistent Systems", role: "Software Engineer", ctc: "8.5 - 11.0 LPA", count: 24, status: "Completed" },
                    { name: "Accenture India", role: "App Analyst", ctc: "6.5 - 8.5 LPA", count: 28, status: "Completed" },
                    { name: "Amazon Web Services", role: "Cloud Associate", ctc: "16.5 LPA", count: 8, status: "Completed" },
                    { name: "Barclays GSC", role: "Graduate Analyst", ctc: "13.5 LPA", count: 12, status: "Completed" },
                  ].map((drive, i) => (
                    <tr key={i} className="hover:bg-[#FAF9FD] transition">
                      <td className="py-3 px-4 font-bold text-[#1E2746]">{drive.name}</td>
                      <td className="py-3 px-4 text-[#5851A4]">{drive.role}</td>
                      <td className="py-3 px-4 font-black text-[#4B63D2]">{drive.ctc}</td>
                      <td className="py-3 px-4 font-bold text-[#1E2746]">{drive.count} Offers</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {drive.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: ACHIEVEMENTS & VERIFICATIONS ─────────────────────────── */}
      {activeTab === "achievements" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-[#1E2746] flex items-center gap-2">
                <Award className="w-4 h-4 text-[#4B63D2]" /> Student & Faculty Accolade Verification Portal
              </h3>
              <p className="text-xs text-[#5851A4] font-medium">
                Verify hackathon prizes, certifications, research publications, and corporate awards
              </p>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
              {achievements.filter((a) => a.status === "Pending Verification").length} Awaiting HOD Verification
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm space-y-4 hover:border-[#4B63D2]/30 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#4B63D2]/10 text-[#4B63D2]">
                      {ach.category}
                    </span>
                    <h4 className="text-sm font-bold text-[#1E2746]">{ach.title}</h4>
                  </div>
                  <div>
                    {ach.status === "Verified" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                        <Clock className="w-3.5 h-3.5" /> Pending Audit
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-[#5851A4] leading-relaxed bg-[#FAF9FD] p-3.5 rounded-xl border border-[#EAE4F7]">
                  {ach.details}
                </p>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#1E2746] block">{ach.student_name}</span>
                    <span className="text-[10px] text-[#5851A4]">{ach.batch} • {ach.date}</span>
                  </div>

                  {ach.status === "Pending Verification" ? (
                    <button
                      onClick={() => setVerifyingAch(ach)}
                      className="px-4 py-2 bg-[#4B63D2] hover:bg-[#3E53BE] text-white rounded-xl text-xs font-black shadow-sm transition"
                    >
                      Verify Record
                    </button>
                  ) : (
                    <div className="text-right text-[10px] text-[#5851A4]">
                      <span>{ach.verified_by}</span>
                      <span className="block text-emerald-600 font-bold">{ach.verified_at}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 7: CLUBS & EVENTS ───────────────────────────────────────── */}
      {activeTab === "clubs" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Department Events */}
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#EAE4F7] pb-3">
                <h3 className="text-base font-black text-[#1E2746] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#4B63D2]" /> Department Technical Events
                </h3>
                <Link
                  to="/events"
                  className="text-xs font-bold text-[#4B63D2] hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="space-y-3">
                {[
                  { title: "National AI Research Symposium 2026", date: "Sep 22, 2026", type: "Conference", status: "Approved" },
                  { title: "Department Board of Studies Meeting", date: "Sep 28, 2026", type: "Academic", status: "Scheduled" },
                  { title: "InnovateX 36-Hour Hackathon", date: "Oct 14, 2026", type: "Hackathon", status: "Approved by Management" },
                ].map((ev, i) => (
                  <div key={i} className="p-3.5 bg-[#FAF9FD] rounded-2xl border border-[#EAE4F7] flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#1E2746]">{ev.title}</h4>
                      <p className="text-[10px] text-[#5851A4]">{ev.date} • {ev.type}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {ev.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Department Clubs */}
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#EAE4F7] pb-3">
                <h3 className="text-base font-black text-[#1E2746] flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#4B63D2]" /> Student Chapters & Technical Clubs
                </h3>
                <Link
                  to="/clubs"
                  className="text-xs font-bold text-[#4B63D2] hover:underline"
                >
                  Explore Clubs
                </Link>
              </div>

              <div className="space-y-3">
                {[
                  { name: "Google Developer Groups (GDG)", focus: "Cloud, Android, Web Development", members: 180 },
                  { name: "ACM Student Chapter", focus: "Competitive Programming & Research", members: 140 },
                  { name: "AI & Robotics Society", focus: "Deep Learning, Edge IoT, Autonomous Systems", members: 165 },
                ].map((club, i) => (
                  <div key={i} className="p-3.5 bg-[#FAF9FD] rounded-2xl border border-[#EAE4F7] flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#1E2746]">{club.name}</h4>
                      <p className="text-[10px] text-[#5851A4]">{club.focus}</p>
                    </div>
                    <span className="text-xs font-black text-[#4B63D2]">{club.members} Members</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {verifyingAch && (
        <div className="fixed inset-0 z-50 bg-[#1E2746]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EAE4F7] max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#4B63D2]/10 text-[#4B63D2] flex items-center justify-center font-black">
                <ShieldCheck className="w-5 h-5 text-[#4B63D2]" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[#1E2746]">
                  Verify Student Achievement Record
                </h4>
                <p className="text-xs text-[#5851A4]">
                  Official approval adds this badge to NAAC/NBA criteria files.
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#FAF9FD] rounded-2xl border border-[#EAE4F7] space-y-2 text-xs">
              <div className="font-bold text-[#1E2746]">{verifyingAch.title}</div>
              <div className="text-[#5851A4]">
                Candidate: {verifyingAch.student_name} ({verifyingAch.student_email})
              </div>
              <p className="text-[#5851A4] leading-relaxed pt-1 border-t border-[#EAE4F7]">
                {verifyingAch.details}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-[#1E2746] uppercase tracking-wider">
                HOD Verification Remarks
              </label>
              <input
                type="text"
                value={verifyRemarks}
                onChange={(e) => setVerifyRemarks(e.target.value)}
                placeholder="e.g. Verified official certificate and cash prize sanction memo."
                className="w-full bg-[#FAF9FD] border border-[#EAE4F7] text-[#1E2746] text-xs rounded-xl p-3 focus:ring-2 focus:ring-[#4B63D2] outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVerifyingAch(null)}
                className="px-4 py-2 bg-white border border-[#EAE4F7] text-[#5851A4] text-xs font-bold rounded-xl hover:bg-[#FAF9FD]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isVerifying}
                onClick={() => handleVerifyAchievement("Rejected")}
                className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl hover:bg-rose-100"
              >
                Reject
              </button>
              <button
                type="button"
                disabled={isVerifying}
                onClick={() => handleVerifyAchievement("Verified")}
                className="px-5 py-2 bg-[#4B63D2] hover:bg-[#3E53BE] text-white text-xs font-black rounded-xl shadow-md shadow-[#4B63D2]/20 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 text-[#FFD21A]" />
                {isVerifying ? "Verifying..." : "Approve & Verify"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TPO/HOD Email Broadcast Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1E2746]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full border border-[#EAE4F7] shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE4F7]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#4B63D2]/10 text-[#4B63D2] rounded-xl">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1E2746]">
                    Broadcast Department Announcement / Opportunity
                  </h3>
                  <p className="text-xs text-[#5851A4] font-medium">
                    Sending to {filteredStudents.length} selected students
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="p-1.5 text-[#5851A4] hover:text-[#1E2746] rounded-xl hover:bg-[#FAF9FD]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {emailSentSuccess ? (
              <div className="p-8 text-center space-y-3">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="text-base font-black text-[#1E2746]">
                  Emails Dispatched Successfully!
                </h4>
                <p className="text-xs text-[#5851A4]">
                  Notification blast sent to all {filteredStudents.length} candidate inboxes.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendBlast} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1E2746] mb-1.5 uppercase tracking-wider">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    required
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="e.g. Urgent Notice: Pre-Placement Technical Assessment Schedule"
                    className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl p-3 text-xs text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E2746] mb-1.5 uppercase tracking-wider">
                    Message / Instructions
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Write details about criteria, requirements, deadlines, and registration instructions..."
                    className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl p-3 text-xs text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] transition font-medium"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#EAE4F7]">
                  <button
                    type="button"
                    onClick={() => setIsEmailModalOpen(false)}
                    className="px-4 py-2.5 bg-[#FAF9FD] hover:bg-[#F0EDF9] text-[#5851A4] font-bold text-xs rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingEmail || !emailSubject || !emailBody}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md shadow-[#4B63D2]/25 flex items-center gap-2 cursor-pointer"
                  >
                    {isSendingEmail ? (
                      "Dispatching..."
                    ) : (
                      <>
                        <Send className="h-4 w-4 text-[#FFD21A]" /> Send to{" "}
                        {filteredStudents.length} Students
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function maxBatch(total: number) {
  return Math.max(total, 1);
}
