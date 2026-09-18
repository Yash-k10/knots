import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Briefcase,
  Sparkles,
  Compass,
  FileText,
  CheckCircle2,
  AlertCircle,
  Brain,
  Send,
  Loader2,
  TrendingUp,
  GraduationCap,
  Users,
  Award,
  Calendar,
  Layers,
  FileCheck2,
  BarChart3,
  Building,
  ShieldCheck,
  DollarSign,
  Globe,
  Sliders,
  Download,
  Search,
  Eye,
  Filter,
  Clock,
  ChevronRight,
} from "lucide-react";
import {
  analyticsService,
  SystemStats,
  ProfileViewsResponse,
  PostEngagementResponse,
  TrendingPost,
  PlatformEngagementSummary,
} from "../services/analytics";
import { profileService, ProfileResponse } from "../services/profile";
import { apiRequest } from "../services/api";
import {
  ProfileViewsChart,
  PostEngagementChart,
  PlatformEngagementDonut,
  TrendingPostsWidget,
} from "../components/analytics";
import {
  ActivitySummaryCards,
  AiRecommendationsHub,
} from "../components/dashboard";
import {
  aiService,
  ConnectionSuggestion,
  JobRecommendation,
  ContentRecommendation,
  ResumeAnalysisResult,
  CareerRoadmapResult,
} from "../services/ai";
import {
  departmentService,
  DepartmentStatsResponse,
  ManagementAnnouncement,
  DepartmentAchievementItem,
  DepartmentReportItem,
} from "../services/department";

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [profileViews, setProfileViews] = useState<ProfileViewsResponse | null>(null);
  const [engagement, setEngagement] = useState<PostEngagementResponse | null>(null);
  const [summary, setSummary] = useState<PlatformEngagementSummary | null>(null);
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);

  // AI Recommendation States
  const [connectionSuggestions, setConnectionSuggestions] = useState<ConnectionSuggestion[]>([]);
  const [jobRecommendations, setJobRecommendations] = useState<JobRecommendation[]>([]);
  const [contentRecommendations, setContentRecommendations] = useState<ContentRecommendation[]>([]);

  // Alumni Real-Time Platform States
  const [alumniConnections, setAlumniConnections] = useState<any[]>([]);
  const [alumniJobs, setAlumniJobs] = useState<any[]>([]);

  // UI View States for Student Hub
  const [mainTab, setMainTab] = useState<"recommendations" | "analytics" | "aitools">("recommendations");
  const [aiToolCategory, setAiToolCategory] = useState<"resume" | "roadmap">("resume");

  // Interactive AI Tools States
  const [resumeText, setResumeText] = useState("");
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [resumeResult, setResumeResult] = useState<ResumeAnalysisResult | null>(null);

  const [targetRole, setTargetRole] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [roadmapError, setRoadmapError] = useState<string | null>(null);
  const [roadmapResult, setRoadmapResult] = useState<CareerRoadmapResult | null>(null);

  // Department Controller Console States
  const [controllerStats, setControllerStats] = useState<any>(null);
  const [controllerStudents, setControllerStudents] = useState<any[]>([]);
  const [controllerFaculty, setControllerFaculty] = useState<any[]>([]);
  const [controllerBatchFilter, setControllerBatchFilter] = useState<string>("all");
  const [controllerSearchQuery, setControllerSearchQuery] = useState<string>("");

  // HOD Dashboard States
  const [hodStats, setHodStats] = useState<DepartmentStatsResponse | null>(null);
  const [hodAnnouncements, setHodAnnouncements] = useState<ManagementAnnouncement[]>([]);
  const [hodAchievements, setHodAchievements] = useState<DepartmentAchievementItem[]>([]);
  const [hodReports, setHodReports] = useState<DepartmentReportItem[]>([]);

  // Admin & TPO Shared States
  const [dashboardDept, setDashboardDept] = useState<string>("All");
  const DEPARTMENTS = ["All", "CSE", "AIML", "AIDS", "MCA", "BCA", "MBA", "IT", "Mechanical", "Electrical"];
  
  const handleExportExcel = () => {
    // Mock generate CSV export based on selected department
    const rows = [
      ["Department", "Students", "Placed", "Highest CTC", "Average CTC", "Recruiters"],
      ["CSE", 450, 410, "32.5 LPA", "8.4 LPA", 12],
      ["IT", 320, 290, "24.0 LPA", "7.8 LPA", 8],
      ["AIML", 180, 160, "28.0 LPA", "8.1 LPA", 6],
      ["AIDS", 150, 130, "22.0 LPA", "7.2 LPA", 5],
      ["MCA", 120, 95, "18.0 LPA", "6.5 LPA", 4],
      ["BCA", 160, 110, "12.0 LPA", "5.0 LPA", 3],
      ["MBA", 200, 175, "16.0 LPA", "6.8 LPA", 7],
      ["Mechanical", 140, 90, "10.0 LPA", "4.5 LPA", 4],
      ["Electrical", 130, 85, "11.0 LPA", "4.8 LPA", 3],
    ];
    let exportRows = rows;
    if (dashboardDept !== "All") {
      exportRows = [rows[0], ...rows.filter(r => r[0] === dashboardDept)];
    }
    const csvContent = "data:text/csv;charset=utf-8," + exportRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `placement_report_${dashboardDept}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [
          userMe,
          sysStats,
          viewsData,
          engData,
          engSummary,
          trending,
          userProfile,
          connSugg,
          jobRecs,
          contentRecs,
          userConns,
          allJobsList,
        ] = await Promise.all([
          apiRequest<any>("/users/me").catch(() => null),
          analyticsService.getSystemStats().catch(() => null),
          analyticsService.getProfileViews(7).catch(() => null),
          analyticsService.getPostEngagement().catch(() => null),
          analyticsService.getPlatformEngagementSummary().catch(() => null),
          analyticsService.getTrendingPosts(5).catch(() => []),
          profileService.getOwnProfile().catch(() => null),
          aiService.getConnectionSuggestions(6).catch(() => []),
          aiService.getJobRecommendations(6).catch(() => []),
          aiService.getContentRecommendations(6).catch(() => []),
          apiRequest<any[]>("/connections/me").catch(() => []),
          apiRequest<any[]>("/jobs").catch(() => []),
        ]);

        const cleanSuggestions = (connSugg || []).filter((item) => {
          const name = `${item.first_name || ""} ${item.last_name || ""}`.toLowerCase();
          const dept = (item.department || "").toLowerCase();
          const bio = (item.bio || "").toLowerCase();
          return (
            !name.includes("super admin") &&
            !name.includes("superadmin") &&
            !dept.includes("super admin") &&
            !dept.includes("superadmin") &&
            !bio.includes("super admin") &&
            !bio.includes("superadmin")
          );
        });

        setCurrentUser(userMe);
        setStats(sysStats);
        setProfileViews(viewsData);
        setEngagement(engData);
        setSummary(engSummary);
        setTrendingPosts(trending || []);
        setProfile(userProfile);
        setConnectionSuggestions(cleanSuggestions);
        setJobRecommendations(jobRecs || []);
        setContentRecommendations(contentRecs || []);
        setAlumniConnections(Array.isArray(userConns) ? userConns : []);
        setAlumniJobs(Array.isArray(allJobsList) ? allJobsList : []);

        if (userMe?.role?.name?.toLowerCase().trim() === "controller") {
          const [deptStats, deptStudents, deptFaculty] = await Promise.all([
            apiRequest<any>("/departments/stats").catch(() => null),
            apiRequest<any[]>("/departments/students?limit=100").catch(() => []),
            apiRequest<any[]>("/departments/faculty").catch(() => []),
          ]);
          setControllerStats(deptStats);
          setControllerStudents(Array.isArray(deptStudents) ? deptStudents : []);
          setControllerFaculty(Array.isArray(deptFaculty) ? deptFaculty : []);
        }

        if (userMe?.role?.name?.toLowerCase().trim() === "hod") {
          const [dStats, dAnn, dAch, dRep] = await Promise.all([
            departmentService.getStats().catch(() => null),
            departmentService.getManagementAnnouncements().catch(() => []),
            departmentService.getAchievements().catch(() => []),
            departmentService.getReports().catch(() => []),
          ]);
          setHodStats(dStats);
          setHodAnnouncements(dAnn || []);
          setHodAchievements(dAch || []);
          setHodReports(dRep || []);
        }
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAnalyzeResume = async (e: React.FormEvent) => {
    e.preventDefault();
    setResumeError(null);
    if (!resumeText.trim()) {
      setResumeError("Please paste your resume text or bullet points to analyze.");
      return;
    }
    setIsAnalyzingResume(true);
    try {
      const res = await aiService.analyzeResume(resumeText);
      if (res.error) {
        setResumeError(res.error);
        setResumeResult(null);
      } else {
        setResumeResult(res);
      }
    } catch (err: any) {
      console.error("Resume analysis failed", err);
      setResumeError(err?.message || "Failed to analyze resume. Please try again.");
    } finally {
      setIsAnalyzingResume(false);
    }
  };

  const handleGenerateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoadmapError(null);
    if (!targetRole.trim()) {
      setRoadmapError("Please enter a Target Role (e.g. Full Stack Developer, Data Analyst).");
      return;
    }
    setIsGeneratingRoadmap(true);
    const skillsList = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const res = await aiService.generateRoadmap(targetRole, skillsList);
      if (res.error) {
        setRoadmapError(res.error);
        setRoadmapResult(null);
      } else {
        setRoadmapResult(res);
      }
    } catch (err: any) {
      console.error("Roadmap generation failed", err);
      setRoadmapError(err?.message || "Failed to generate roadmap. Please check your target role.");
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-44 bg-white border border-[#EAE4F7] rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-white border border-[#EAE4F7] rounded-2xl"
            />
          ))}
        </div>
        <div className="h-96 bg-white border border-[#EAE4F7] rounded-3xl" />
      </div>
    );
  }

  const roleName = currentUser?.role?.name?.toLowerCase().trim() || "student";
  const greetingName = profile?.first_name ? `, ${profile.first_name}` : "";

  const handleExportStudentsCSV = () => {
    if (!controllerStudents || controllerStudents.length === 0) return;
    const headers = [
      "ID",
      "Name",
      "Email",
      "Department",
      "Graduation Year",
      "CGPA",
      "Placement Status",
      "Skills",
    ];
    const rows = controllerStudents.map((s) => [
      s.id,
      `"${((s.first_name || "") + " " + (s.last_name || "")).trim()}"`,
      s.email || "",
      `"${s.department || ""}"`,
      s.graduation_year || "",
      s.cgpa ?? "",
      s.placement_status || "",
      `"${(s.skills || []).join("; ")}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${(controllerStats?.department || "department")
        .toLowerCase()
        .replace(/[\s&]+/g, "_")}_students.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================================================================
  // 0. HEAD OF DEPARTMENT (HOD) DASHBOARD VIEW
  // =========================================================================
  if (roleName === "hod") {
    const activeDeptName =
      hodStats?.department || profile?.department || "Computer Science & Engineering";
    const pendingVerifications = hodAchievements.filter(
      (a) => a.status === "Pending Verification"
    );

    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-12">
        {/* HOD Top Banner */}
        <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm relative overflow-hidden">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#4B63D2]/10 border border-[#4B63D2]/20 text-[#4B63D2] text-xs font-black">
              <ShieldCheck className="h-4 w-4" />
              <span>HOD – {activeDeptName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1E2746] tracking-tight">
              Department Operations Hub
            </h1>
            <p className="text-[#5851A4] text-xs sm:text-sm max-w-2xl leading-relaxed font-medium">
              Academic leadership, operational governance, and institutional collaboration console for{" "}
              <strong className="text-[#1E2746]">{activeDeptName}</strong>. Monitor student cohorts, track placement progression, review faculty output, and coordinate with Central Management.
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
              <BarChart3 className="h-4 w-4 text-[#4B63D2]" /> Reports & Audits
            </Link>
            <Link
              to="/department"
              className="px-4 py-2.5 bg-white border border-[#EAE4F7] text-[#1E2746] hover:bg-[#FAF9FD] rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition"
            >
              <Layers className="h-4 w-4 text-[#4B63D2]" /> Department Center
            </Link>
          </div>
        </div>

        {/* 4 Core KPI Cards with Cohort Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Students with Year-wise Breakdown */}
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-[#5851A4] tracking-wider">
                Total Students
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#4B63D2]/10 text-[#4B63D2] flex items-center justify-center">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>

            <div>
              <div className="text-2xl font-black text-[#1E2746]">
                {hodStats?.total_students || 623}
              </div>
              <p className="text-[10px] text-[#5851A4] font-medium mt-0.5">Enrolled across 4 cohorts</p>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-[#EAE4F7] text-[10px]">
              <div className="bg-[#FAF9FD] p-1.5 rounded-lg border border-[#EAE4F7]">
                <span className="text-[#5851A4] block">1st Year:</span>
                <span className="font-bold text-[#1E2746]">{hodStats?.cohorts?.first_year || 165}</span>
              </div>
              <div className="bg-[#FAF9FD] p-1.5 rounded-lg border border-[#EAE4F7]">
                <span className="text-[#5851A4] block">2nd Year:</span>
                <span className="font-bold text-[#1E2746]">{hodStats?.cohorts?.second_year || 160}</span>
              </div>
              <div className="bg-[#FAF9FD] p-1.5 rounded-lg border border-[#EAE4F7]">
                <span className="text-[#5851A4] block">3rd Year:</span>
                <span className="font-bold text-[#1E2746]">{hodStats?.cohorts?.third_year || 156}</span>
              </div>
              <div className="bg-[#FAF9FD] p-1.5 rounded-lg border border-[#EAE4F7]">
                <span className="text-[#5851A4] block">4th Year:</span>
                <span className="font-bold text-[#1E2746]">{hodStats?.cohorts?.fourth_year || 142}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Faculty Staff */}
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-[#5851A4] tracking-wider">
                Faculty Staff
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#4B63D2]/10 text-[#4B63D2] flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>

            <div>
              <div className="text-2xl font-black text-[#1E2746]">
                {hodStats?.total_faculty || 18}
              </div>
              <p className="text-[10px] text-emerald-600 font-bold mt-0.5">16 Active Teaching Mentors</p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[#EAE4F7] text-xs">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#5851A4]">Ph.D. Guides:</span>
                <span className="font-bold text-[#1E2746]">11 Professors</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#5851A4]">Active Projects:</span>
                <span className="font-bold text-[#4B63D2]">28 Guided</span>
              </div>
            </div>
          </div>

          {/* Card 3: Placement & Internship */}
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-[#5851A4] tracking-wider">
                Placement & Internships
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Award className="h-4 w-4" />
              </div>
            </div>

            <div>
              <div className="text-2xl font-black text-emerald-700">
                {hodStats?.placement_rate || 83.1}%
              </div>
              <p className="text-[10px] text-[#5851A4] font-medium mt-0.5">Final Year Conversion</p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[#EAE4F7] text-xs">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#5851A4]">Placed Students:</span>
                <span className="font-bold text-emerald-700">{hodStats?.placed_count || 118} Offers</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#5851A4]">Summer Interns:</span>
                <span className="font-bold text-indigo-700">138 Active</span>
              </div>
            </div>
          </div>

          {/* Card 4: Alumni Engaged */}
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-[#5851A4] tracking-wider">
                Alumni Network
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>

            <div>
              <div className="text-2xl font-black text-[#1E2746]">
                {hodStats?.alumni_engaged_count || 84}
              </div>
              <p className="text-[10px] text-[#4B63D2] font-bold mt-0.5">Engaged Alumni in Network</p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[#EAE4F7] text-xs">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#5851A4]">Active Mentors:</span>
                <span className="font-bold text-[#1E2746]">26 Registered</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#5851A4]">Referrals Shared:</span>
                <span className="font-bold text-emerald-700">31 in 2026</span>
              </div>
            </div>
          </div>
        </div>

        {/* Core Section 1: Student Engagement & Department Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Engagement Overview Gauge */}
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm space-y-4 lg:col-span-1">
            <h3 className="text-sm font-black text-[#1E2746] flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#4B63D2]" /> Student Engagement & Health
            </h3>

            <div className="space-y-3">
              <div className="p-4 bg-[#FAF9FD] rounded-2xl border border-[#EAE4F7] space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#5851A4]">Weekly Engagement:</span>
                  <span className="text-[#4B63D2]">{hodStats?.student_engagement_rate || 88.5}%</span>
                </div>
                <div className="w-full h-2 bg-[#EAE4F7] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#4B63D2] to-[#5851A4] rounded-full" style={{ width: "88.5%" }} />
                </div>
              </div>

              <div className="p-4 bg-[#FAF9FD] rounded-2xl border border-[#EAE4F7] space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#5851A4]">Profile Completion:</span>
                  <span className="text-emerald-700">{hodStats?.profile_completion_rate || 92.4}%</span>
                </div>
                <div className="w-full h-2 bg-[#EAE4F7] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "92.4%" }} />
                </div>
              </div>

              <div className="p-3 bg-[#FAF9FD] rounded-2xl border border-[#EAE4F7] space-y-1 text-xs">
                <span className="text-[10px] uppercase font-black text-[#5851A4] block">Accreditation Readiness</span>
                <span className="font-bold text-emerald-700 block">NBA Tier-1 Criteria Compliance: 96.2%</span>
              </div>
            </div>
          </div>

          {/* Department Activity Roll-Up */}
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-[#EAE4F7] pb-3">
              <h3 className="text-sm font-black text-[#1E2746] flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#4B63D2]" /> Department Activity & Upcoming Milestones
              </h3>
              <Link to="/events" className="text-xs font-bold text-[#4B63D2] hover:underline">
                View Calendar
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: "National AI Research Symposium", date: "Sep 22, 2026", cat: "Conference", status: "Approved" },
                { title: "Board of Studies Semester Curriculum", date: "Sep 28, 2026", cat: "Academic", status: "Scheduled" },
                { title: "Smart India Hackathon Mentorship", date: "Oct 04, 2026", cat: "Competition", status: "In Progress" },
                { title: "AWS Cloud Certification Exam Drive", date: "Oct 12, 2026", cat: "Certification", status: "Sanctioned" },
              ].map((act, i) => (
                <div key={i} className="p-3.5 bg-[#FAF9FD] rounded-2xl border border-[#EAE4F7] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-[#4B63D2] bg-[#4B63D2]/10 px-2 py-0.5 rounded-md">
                      {act.cat}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold">{act.status}</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#1E2746]">{act.title}</h4>
                  <p className="text-[10px] text-[#5851A4]">{act.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Core Section 2: Pending Actions & Management Updates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Actions Requiring HOD Attention */}
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE4F7] pb-3">
              <div>
                <h3 className="text-sm font-black text-[#1E2746] flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" /> Pending Actions & Verifications
                </h3>
                <p className="text-xs text-[#5851A4]">
                  Items requiring your sign-off or review
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                {pendingVerifications.length + 2} Pending
              </span>
            </div>

            <div className="space-y-3">
              {pendingVerifications.slice(0, 2).map((ach) => (
                <div key={ach.id} className="p-3.5 bg-[#FAF9FD] rounded-2xl border border-[#EAE4F7] flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#4B63D2]">{ach.category}</span>
                    <h4 className="text-xs font-bold text-[#1E2746]">{ach.title}</h4>
                    <p className="text-[10px] text-[#5851A4]">{ach.student_name} • {ach.batch}</p>
                  </div>
                  <Link
                    to="/department?tab=achievements"
                    className="px-3 py-1.5 bg-[#4B63D2] text-white text-[11px] font-bold rounded-xl shrink-0 shadow-xs"
                  >
                    Verify
                  </Link>
                </div>
              ))}

              <div className="p-3.5 bg-[#FAF9FD] rounded-2xl border border-[#EAE4F7] flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-indigo-700">Proposal Sign-off</span>
                  <h4 className="text-xs font-bold text-[#1E2746]">TCS Industrial Visit Consent Letters</h4>
                  <p className="text-[10px] text-[#5851A4]">Third Year (2026) • 120 Consents Filed</p>
                </div>
                <Link
                  to="/management-connect?tab=requests"
                  className="px-3 py-1.5 bg-white border border-[#EAE4F7] text-[#1E2746] text-[11px] font-bold rounded-xl shrink-0"
                >
                  Review
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Management Updates */}
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE4F7] pb-3">
              <div>
                <h3 className="text-sm font-black text-[#1E2746] flex items-center gap-2">
                  <Building className="h-4 w-4 text-[#4B63D2]" /> Recent Management Updates
                </h3>
                <p className="text-xs text-[#5851A4]">
                  Institutional directives & executive decisions
                </p>
              </div>
              <Link to="/management-connect" className="text-xs font-bold text-[#4B63D2] hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {hodAnnouncements.slice(0, 3).map((ann) => (
                <div key={ann.id} className="p-3.5 bg-[#FAF9FD] rounded-2xl border border-[#EAE4F7] space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-[#4B63D2]">{ann.sender}</span>
                    <span className="text-[#5851A4]">{ann.date}</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#1E2746]">{ann.title}</h4>
                  <p className="text-[11px] text-[#5851A4] line-clamp-2">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Core Section 3: Reports Status Ledger */}
        <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#EAE4F7] pb-3">
            <div>
              <h3 className="text-base font-black text-[#1E2746] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#4B63D2]" /> Department Reports Status Ledger
              </h3>
              <p className="text-xs text-[#5851A4]">
                Submitted, under review, and completed dossiers for Institutional Leadership
              </p>
            </div>
            <Link
              to="/reports"
              className="px-4 py-2 bg-[#4B63D2] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <span>Full Reports Suite</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#FAF9FD] text-[10px] font-black uppercase text-[#5851A4] border-b border-[#EAE4F7]">
                  <th className="py-3 px-4">Report Title</th>
                  <th className="py-3 px-4">Pillar</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Feedback Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4F7]">
                {hodReports.slice(0, 4).map((rep) => (
                  <tr key={rep.id} className="hover:bg-[#FAF9FD] transition">
                    <td className="py-3.5 px-4 font-bold text-[#1E2746]">{rep.title}</td>
                    <td className="py-3.5 px-4 text-[#5851A4]">{rep.report_type}</td>
                    <td className="py-3.5 px-4 font-bold text-[#1E2746]">{rep.period}</td>
                    <td className="py-3.5 px-4 text-[#5851A4]">{rep.submitted_at || "Draft"}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          rep.status === "Completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : rep.status === "Under Review"
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {rep.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#5851A4] italic">
                      {rep.management_feedback || "Received by Dean's Office."}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 0. DEPARTMENT CONTROLLER DASHBOARD VIEW
  // =========================================================================
  if (roleName === "controller") {
    const filteredStudents = controllerStudents.filter((s) => {
      const matchesBatch =
        controllerBatchFilter === "all" ||
        String(s.graduation_year) === controllerBatchFilter;
      const query = controllerSearchQuery.toLowerCase().trim();
      const fullName = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase();
      const matchesQuery =
        !query ||
        fullName.includes(query) ||
        (s.email && s.email.toLowerCase().includes(query)) ||
        (s.skills && s.skills.some((sk: string) => sk.toLowerCase().includes(query)));
      return matchesBatch && matchesQuery;
    });

    const activeDeptName =
      controllerStats?.department || profile?.department || "Computer Science & Engineering";

    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-12">
        {/* Banner */}
        <div className="bg-white border border-[#EAE4F7] rounded-3xl p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm relative overflow-hidden">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#4B63D2]/10 border border-[#4B63D2]/20 text-[#4B63D2] text-xs font-black">
              <ShieldCheck className="h-3.5 w-3.5" /> Department Controller Console
            </div>
            <h2 className="text-3xl font-black text-[#1E2746] tracking-tight">
              Welcome Back{greetingName} 👋
            </h2>
            <p className="text-[#5851A4] text-sm max-w-2xl leading-relaxed font-medium">
              Administrative & Academic Operations for{" "}
              <strong className="text-[#1E2746]">{activeDeptName}</strong>. Inspect cohort
              batches, monitor placement statistics, and manage departmental student talent.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              onClick={handleExportStudentsCSV}
              disabled={controllerStudents.length === 0}
              className="px-4 py-2.5 bg-white hover:bg-[#FAF9FD] border border-[#EAE4F7] text-[#1E2746] rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition disabled:opacity-50"
            >
              <Download className="h-4 w-4 text-[#4B63D2]" /> Export Talent Roster (CSV)
            </button>
            <Link
              to="/department"
              className="px-5 py-2.5 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white rounded-xl font-bold text-xs shadow-md shadow-[#4B63D2]/20 flex items-center gap-2"
            >
              <Layers className="h-4 w-4 text-[#FFD21A]" /> Department Overview
            </Link>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Enrolled Students</span>
              <GraduationCap className="h-4 w-4 text-[#4B63D2]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">
              {controllerStats?.total_students ?? 0}
            </span>
            <p className="text-[10px] text-indigo-600 font-bold mt-1">
              {controllerStats?.batches?.length ?? 0} active cohort batches
            </p>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Department Faculty</span>
              <Users className="h-4 w-4 text-[#4B63D2]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">
              {controllerStats?.faculty_count ?? 0}
            </span>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">Mentors & Research Guides</p>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Placement Rate</span>
              <Briefcase className="h-4 w-4 text-[#4B63D2]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">
              {controllerStats?.placement_rate ?? 0}%
            </span>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">
              {controllerStats?.placed_count ?? 0} placed / interning
            </p>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Clubs & Events</span>
              <Compass className="h-4 w-4 text-[#FFD21A]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">
              {(controllerStats?.club_count ?? 0) + (controllerStats?.event_count ?? 0)}
            </span>
            <p className="text-[10px] text-indigo-600 font-bold mt-1">
              {controllerStats?.club_count ?? 0} clubs • {controllerStats?.event_count ?? 0} events
            </p>
          </div>
        </div>

        {/* Cohort Batches Progress Breakdown */}
        {controllerStats?.batches && controllerStats.batches.length > 0 && (
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#1E2746] flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#4B63D2]" /> Cohort Batches Distribution
              </h3>
              <span className="text-xs text-[#5851A4] font-medium">
                Showing all active student academic batches
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {controllerStats.batches.map((b: any, idx: number) => {
                const pct =
                  b.total_students > 0
                    ? Math.round((b.placed_students / b.total_students) * 100)
                    : 0;
                return (
                  <div
                    key={idx}
                    className="p-4 bg-[#FAF9FD] rounded-2xl border border-[#EAE4F7] space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold text-[#1E2746]">
                        Batch {b.graduation_year}
                      </span>
                      <span className="text-[11px] font-bold text-[#4B63D2] px-2 py-0.5 bg-[#4B63D2]/10 rounded-full">
                        {b.avg_cgpa ? `${b.avg_cgpa} CGPA` : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-[#5851A4]">
                      <span>{b.total_students} Students</span>
                      <span>
                        {b.placed_students} Placed ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#EAE4F7] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#4B63D2] h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Department Student Talent Roster Table */}
        <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-[#1E2746] flex items-center gap-2">
                <Users className="h-4 w-4 text-[#4B63D2]" /> Department Student Talent Roster
              </h3>
              <p className="text-xs text-[#5851A4] mt-0.5 font-medium">
                Displaying enrolled students for {activeDeptName}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Batch Filter */}
              <div className="flex items-center gap-1.5 bg-[#FAF9FD] px-3 py-1.5 rounded-xl border border-[#EAE4F7] text-xs font-bold text-[#1E2746]">
                <Filter className="h-3.5 w-3.5 text-[#4B63D2]" />
                <select
                  value={controllerBatchFilter}
                  onChange={(e) => setControllerBatchFilter(e.target.value)}
                  className="bg-transparent border-none focus:outline-none text-xs text-[#1E2746] font-bold cursor-pointer"
                >
                  <option value="all">All Cohorts</option>
                  {(controllerStats?.batches || []).map((b: any, idx: number) => (
                    <option key={idx} value={String(b.graduation_year)}>
                      Batch {b.graduation_year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5851A4]" />
                <input
                  type="text"
                  placeholder="Search students, skills..."
                  value={controllerSearchQuery}
                  onChange={(e) => setControllerSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-[#FAF9FD] border border-[#EAE4F7] rounded-xl text-xs text-[#1E2746] focus:outline-none focus:border-[#4B63D2] w-48 sm:w-56"
                />
              </div>
            </div>
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EAE4F7] text-[11px] font-black text-[#5851A4] uppercase tracking-wider">
                  <th className="pb-3 px-2">Student</th>
                  <th className="pb-3 px-2">Batch</th>
                  <th className="pb-3 px-2">CGPA</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2">Top Skills</th>
                  <th className="pb-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4F7] text-xs">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s: any) => (
                    <tr key={s.id} className="hover:bg-[#FAF9FD] transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4B63D2] to-[#5851A4] text-white flex items-center justify-center font-black text-xs shrink-0">
                            {s.first_name ? s.first_name[0].toUpperCase() : "S"}
                          </div>
                          <div>
                            <div className="font-bold text-[#1E2746]">
                              {s.first_name || ""} {s.last_name || ""}
                            </div>
                            <div className="text-[11px] text-[#5851A4]">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 font-medium text-[#1E2746]">
                        {s.graduation_year ? `Batch ${s.graduation_year}` : "N/A"}
                      </td>
                      <td className="py-3 px-2">
                        {s.cgpa ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              s.cgpa >= 8.5
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : s.cgpa >= 7.5
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-slate-50 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {s.cgpa}
                          </span>
                        ) : (
                          <span className="text-[#5851A4]">N/A</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            s.placement_status === "Placed"
                              ? "bg-emerald-100 text-emerald-800"
                              : s.placement_status === "Interning"
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {s.placement_status || "Seeking"}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(s.skills || []).slice(0, 3).map((sk: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-[#FAF9FD] border border-[#EAE4F7] text-[10px] font-semibold text-[#5851A4] rounded-md"
                            >
                              {sk}
                            </span>
                          ))}
                          {(s.skills || []).length > 3 && (
                            <span className="text-[10px] text-[#5851A4] font-bold self-center">
                              +{s.skills.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Link
                          to={`/profile/${s.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#4B63D2] hover:bg-[#4B63D2]/10 rounded-lg transition"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#5851A4]">
                      No students found matching current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Faculty Directory Preview */}
        {controllerFaculty && controllerFaculty.length > 0 && (
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#1E2746] flex items-center gap-2">
                <Users className="h-4 w-4 text-[#4B63D2]" /> Department Faculty & Mentors
              </h3>
              <span className="text-xs text-[#5851A4] font-medium">
                {controllerFaculty.length} Faculty Members
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {controllerFaculty.map((f: any) => (
                <div
                  key={f.id}
                  className="p-4 bg-[#FAF9FD] rounded-2xl border border-[#EAE4F7] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#4B63D2]/10 text-[#4B63D2] flex items-center justify-center font-black text-sm">
                      {f.first_name ? f.first_name[0] : "F"}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1E2746]">
                        {f.first_name || ""} {f.last_name || ""}
                      </h4>
                      <p className="text-[11px] text-[#5851A4]">
                        {f.designation || "Faculty Mentor"}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/messaging?userId=${f.id}`}
                    className="px-3 py-1 bg-white border border-[#EAE4F7] text-[#4B63D2] hover:bg-[#4B63D2] hover:text-white rounded-lg text-xs font-bold transition shrink-0"
                  >
                    Message
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 1. FACULTY DASHBOARD VIEW
  // =========================================================================
  if (roleName === "faculty") {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-12">
        <div className="bg-white border border-[#EAE4F7] rounded-3xl p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm relative overflow-hidden">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#4B63D2]/10 border border-[#4B63D2]/20 text-[#4B63D2] text-xs font-black">
              <GraduationCap className="h-3.5 w-3.5" /> Faculty Academic Console
            </div>
            <h2 className="text-3xl font-black text-[#1E2746] tracking-tight">
              Welcome Back{greetingName} 👋
            </h2>
            <p className="text-[#5851A4] text-sm max-w-2xl leading-relaxed font-medium">
              Monitor connected student cohorts, review mentorship inquiries, inspect
              academic progress, and collaborate across departmental research.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/students"
              className="px-5 py-2.5 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white rounded-xl font-bold text-xs shadow-md shadow-[#4B63D2]/20 flex items-center gap-2"
            >
              <Users className="h-4 w-4 text-[#FFD21A]" /> View Student Talent Roster
            </Link>
          </div>
        </div>

        {/* Faculty KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Mentored Students</span>
              <GraduationCap className="h-4 w-4 text-[#4B63D2]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">48</span>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">12 Active Projects</p>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Department Ties</span>
              <Users className="h-4 w-4 text-[#4B63D2]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">124</span>
            <p className="text-[10px] text-indigo-600 font-bold mt-1">Faculty & Alumni</p>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Upcoming Events</span>
              <Calendar className="h-4 w-4 text-[#FFD21A]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">4 Scheduled</span>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">Workshops & Seminars</p>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Course Evaluation</span>
              <Award className="h-4 w-4 text-[#4B63D2]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">4.8 / 5.0</span>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">Student Feedback</p>
          </div>
        </div>

        {/* Faculty Active Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black text-[#1E2746] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#4B63D2]" /> Mentorship & Project Requests
            </h3>
            <div className="space-y-3">
              {[
                { name: "Rahul Verma", dept: "CS 2026", topic: "Guidance on Distributed Systems Paper" },
                { name: "Sneha Nair", dept: "IT 2025", topic: "Final Year Capstone Review: Cloud AI" },
                { name: "Aditya Shah", dept: "ECE 2027", topic: "Embedded IoT Architecture Discussion" },
              ].map((req, i) => (
                <div key={i} className="p-3.5 bg-[#FAF9FD] rounded-2xl border border-[#EAE4F7] flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-[#1E2746]">{req.name} <span className="text-[#5851A4] font-normal">({req.dept})</span></h4>
                    <p className="text-[11px] text-[#5851A4] font-medium mt-0.5">{req.topic}</p>
                  </div>
                  <Link to="/messaging" className="px-3 py-1.5 bg-[#4B63D2] text-white text-[10px] font-bold rounded-xl shrink-0">
                    Respond
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black text-[#1E2746] flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#4B63D2]" /> Upcoming Department Events
            </h3>
            <div className="space-y-3">
              {[
                { title: "National AI Research Symposium", date: "Sep 22, 2026", type: "Conference" },
                { title: "Department Board of Studies Meeting", date: "Sep 28, 2026", type: "Academic" },
                { title: "Hackathon Mentorship Clinic", date: "Oct 04, 2026", type: "Workshop" },
              ].map((ev, i) => (
                <div key={i} className="p-3.5 bg-[#FAF9FD] rounded-2xl border border-[#EAE4F7] flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-[#1E2746]">{ev.title}</h4>
                    <p className="text-[11px] text-[#5851A4] font-medium mt-0.5">{ev.date} • {ev.type}</p>
                  </div>
                  <Link to="/events" className="text-xs font-bold text-[#4B63D2] hover:underline">
                    View &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. HOD DASHBOARD VIEW
  // =========================================================================
  if (roleName === "hod") {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-12">
        <div className="bg-white border border-[#EAE4F7] rounded-3xl p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm relative overflow-hidden">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#4B63D2]/10 border border-[#4B63D2]/20 text-[#4B63D2] text-xs font-black">
              <Layers className="h-3.5 w-3.5" /> Head of Department Command
            </div>
            <h2 className="text-3xl font-black text-[#1E2746] tracking-tight">
              Department Operations Hub
            </h2>
            <p className="text-[#5851A4] text-sm max-w-2xl leading-relaxed font-medium">
              Oversee departmental academic health, student placement performance, faculty
              workload, cohort analytics, and curriculum alignment.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/department"
              className="px-4 py-2.5 bg-[#F8F6FD] border border-[#EAE4F7] text-[#1E2746] rounded-xl font-bold text-xs"
            >
              Department Console
            </Link>
            <Link
              to="/reports"
              className="px-5 py-2.5 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white rounded-xl font-bold text-xs shadow-md shadow-[#4B63D2]/20 flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4 text-[#FFD21A]" /> Department Reports
            </Link>
          </div>
        </div>

        {/* HOD KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Total Students</span>
              <GraduationCap className="h-4 w-4 text-[#4B63D2]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">620</span>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">4 Academic Cohorts</p>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Faculty Staff</span>
              <Users className="h-4 w-4 text-[#4B63D2]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">28</span>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">100% Retained</p>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Placement Index</span>
              <Award className="h-4 w-4 text-[#FFD21A]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">92.4%</span>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">Rank 1 in College</p>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Alumni Engaged</span>
              <Users className="h-4 w-4 text-[#4B63D2]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">420+</span>
            <p className="text-[10px] text-indigo-600 font-bold mt-1">Active Mentors</p>
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ProfileViewsChart initialData={profileViews} />
          <PostEngagementChart engagement={engagement} />
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. ALUMNI DASHBOARD VIEW
  // =========================================================================
  if (roleName === "alumni") {
    const postedJobsCount = alumniJobs.filter(
      (j: any) => j.posted_by_id === currentUser?.id,
    ).length;

    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-12">
        {/* Alumni Header Console */}
        <div className="bg-white border border-[#EAE4F7] rounded-3xl p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm relative overflow-hidden">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFD21A]/20 border border-[#FFD21A]/50 text-[#1E2746] text-xs font-black">
              <GraduationCap className="h-3.5 w-3.5 text-[#5851A4]" /> Alumni Career & Contribution Hub
            </div>
            <h2 className="text-3xl font-black text-[#1E2746] tracking-tight">
              Welcome Back{greetingName} 🎓
            </h2>
            <p className="text-[#5851A4] text-sm max-w-2xl leading-relaxed font-medium">
              Stay connected with your alma mater, mentor aspiring juniors, share career referrals, and network with fellow alumni across global tech hubs.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/connections"
              className="px-5 py-2.5 bg-[#4B63D2] hover:bg-[#3E53BE] text-white rounded-xl font-bold text-xs shadow-md shadow-[#4B63D2]/20 flex items-center gap-2 transition"
            >
              <Users className="h-4 w-4" /> Alumni & Student Ties
            </Link>
          </div>
        </div>

        {/* Alumni KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Mentorship Mentees</span>
              <GraduationCap className="h-4 w-4 text-[#4B63D2]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">
              {alumniConnections.length > 0 ? `${alumniConnections.length} Students` : "18 Students"}
            </span>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">Career Guidance</p>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Referrals Posted</span>
              <Briefcase className="h-4 w-4 text-[#4B63D2]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">
              {postedJobsCount > 0 ? `${postedJobsCount} Opportunities` : "6 Opportunities"}
            </span>
            <p className="text-[10px] text-[#4B63D2] font-bold mt-1">At your current company</p>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Alumni Chapters</span>
              <Globe className="h-4 w-4 text-[#4B63D2]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">8 Cities</span>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">Active Global Network</p>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Upcoming Meetups</span>
              <Calendar className="h-4 w-4 text-[#FFD21A]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">Annual Gala</span>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">Dec 2026 on Campus</p>
          </div>
        </div>

        {/* AI Recommendations Hub */}
        <AiRecommendationsHub
          connectionSuggestions={connectionSuggestions}
          jobRecommendations={jobRecommendations}
          contentRecommendations={contentRecommendations}
        />
      </div>
    );
  }


  // =========================================================================
  // 4. CONTROLLER DASHBOARD VIEW
  // =========================================================================
  if (roleName === "controller") {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-12">
        <div className="bg-white border border-[#EAE4F7] rounded-3xl p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm relative overflow-hidden">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#4B63D2]/10 border border-[#4B63D2]/20 text-[#4B63D2] text-xs font-black">
              <Sliders className="h-3.5 w-3.5" /> Department Controller Console
            </div>
            <h2 className="text-3xl font-black text-[#1E2746] tracking-tight">
              Controller Operations & Audit
            </h2>
            <p className="text-[#5851A4] text-sm max-w-2xl leading-relaxed font-medium">
              Control department event permissions, monitor applications pipeline, audit
              content, and track student cohort participation metrics.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/applications"
              className="px-5 py-2.5 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white rounded-xl font-bold text-xs shadow-md shadow-[#4B63D2]/20 flex items-center gap-2"
            >
              <FileCheck2 className="h-4 w-4 text-[#FFD21A]" /> Manage Applications
            </Link>
          </div>
        </div>

        {/* Controller KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Active Applications</span>
              <FileCheck2 className="h-4 w-4 text-[#4B63D2]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">158</span>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">Pending Verification</p>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Events Supervised</span>
              <Calendar className="h-4 w-4 text-[#FFD21A]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">14</span>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">RSVP Active</p>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Cohort Compliance</span>
              <ShieldCheck className="h-4 w-4 text-[#4B63D2]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">99.2%</span>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">Verified Records</p>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Platform Moderation</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">Zero Flags</span>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">Community Clean</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PostEngagementChart engagement={engagement} />
          <PlatformEngagementDonut summary={summary} />
        </div>
      </div>
    );
  }

  // =========================================================================
  // 5. TPO PLACEMENT DASHBOARD VIEW
  // =========================================================================
  if (roleName === "tpo") {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-12">
        <div className="bg-white border border-[#EAE4F7] rounded-3xl p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm relative overflow-hidden">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFD21A]/20 border border-[#FFD21A]/40 text-[#1E2746] text-xs font-black">
              <Award className="h-3.5 w-3.5 text-[#5851A4]" /> Training & Placement Command
            </div>
            <h2 className="text-3xl font-black text-[#1E2746] tracking-tight">
              Placement Operations Center
            </h2>
            <p className="text-[#5851A4] text-sm max-w-2xl leading-relaxed font-medium">
              Manage corporate recruitment drives, track candidate pipelines from shortlisting
              to offer release, broadcast opportunity email blasts, and verify placement packages.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/students"
              className="px-4 py-2.5 bg-[#F8F6FD] border border-[#EAE4F7] text-[#1E2746] rounded-xl font-bold text-xs"
            >
              Filter Candidates
            </Link>
            <Link
              to="/placements"
              className="px-5 py-2.5 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white rounded-xl font-bold text-xs shadow-md shadow-[#4B63D2]/20 flex items-center gap-2"
            >
              <Award className="h-4 w-4 text-[#FFD21A]" /> Placement Registry
            </Link>
          </div>
        </div>

        {/* TPO KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Placed Students</span>
              <GraduationCap className="h-4 w-4 text-[#4B63D2]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">428</span>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">86.2% Batch Placed</p>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Recruiter Partners</span>
              <Building className="h-4 w-4 text-[#4B63D2]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">52 Companies</span>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">Active On Campus</p>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Highest CTC</span>
              <Award className="h-4 w-4 text-[#FFD21A]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">₹32.5 LPA</span>
            <p className="text-[10px] text-indigo-600 font-bold mt-1">Google Cloud Offer</p>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Average CTC</span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">₹8.4 LPA</span>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">+14.2% Growth</p>
          </div>
        </div>

        {/* Department Filters & Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#EAE4F7] p-3 rounded-2xl shadow-sm mb-6">
          <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide flex-1">
            {DEPARTMENTS.map(dept => (
              <button
                key={dept}
                onClick={() => setDashboardDept(dept)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  dashboardDept === dept
                    ? "bg-[#4B63D2] text-white shadow-sm"
                    : "bg-[#F8F6FD] text-[#5851A4] hover:bg-[#EAE4F7]"
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" /> Export Report (Excel)
          </button>
        </div>

        {/* Action Pipelines */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black text-[#1E2746] flex items-center justify-between">
              <span>Recruitment Drive Pipeline</span>
              <Link to="/applications" className="text-xs text-[#4B63D2] font-bold hover:underline">
                View All &rarr;
              </Link>
            </h3>
            <div className="space-y-3">
              {[
                { company: "Microsoft India", role: "Software Engineer", stage: "Interviews Today", count: 18 },
                { company: "Amazon AWS", role: "Cloud Support Associate", stage: "Online Assessment", count: 45 },
                { company: "Goldman Sachs", role: "Analyst - Engineering", stage: "Technical Round", count: 12 },
              ].map((drive, i) => (
                <div key={i} className="p-3.5 bg-[#FAF9FD] rounded-2xl border border-[#EAE4F7] flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-black text-[#1E2746]">{drive.company}</h4>
                    <p className="text-[11px] text-[#5851A4] font-medium">{drive.role} • <span className="text-[#4B63D2] font-bold">{drive.count} Candidates</span></p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {drive.stage}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black text-[#1E2746] flex items-center justify-between">
              <span>Recent Placement Verifications</span>
              <Link to="/placements" className="text-xs text-[#4B63D2] font-bold hover:underline">
                Open Registry &rarr;
              </Link>
            </h3>
            <div className="space-y-3">
              {[
                { name: "Yash Kulkarni", comp: "Google Cloud", pkg: "₹28 LPA", dept: "CSE" },
                { name: "Ananya Deshpande", comp: "Deloitte Digital", pkg: "₹12.5 LPA", dept: "IT" },
                { name: "Rohan Patil", comp: "TCS Digital", pkg: "₹9.2 LPA", dept: "ECE" },
              ].map((p, i) => (
                <div key={i} className="p-3.5 bg-[#FAF9FD] rounded-2xl border border-[#EAE4F7] flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-black text-[#1E2746]">{p.name} <span className="text-[#5851A4] font-normal">({p.dept})</span></h4>
                    <p className="text-[11px] text-[#4B63D2] font-bold">{p.comp}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {p.pkg}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 6. CENTRAL ADMIN / SUPER ADMIN DASHBOARD VIEW
  // =========================================================================
  if (
    roleName === "central admin" ||
    roleName === "admin" ||
    roleName === "super admin" ||
    roleName === "superadmin" ||
    roleName === "management"
  ) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-12">
        <div className="bg-white border border-[#EAE4F7] rounded-3xl p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm relative overflow-hidden">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#4B63D2]/10 border border-[#4B63D2]/20 text-[#4B63D2] text-xs font-black">
              <ShieldCheck className="h-3.5 w-3.5" /> Central Administration Master Console
            </div>
            <h2 className="text-3xl font-black text-[#1E2746] tracking-tight">
              Institutional Master Hub
            </h2>
            <p className="text-[#5851A4] text-sm max-w-2xl leading-relaxed font-medium">
              Full platform governance across accounts, role permissions, academic
              departments, audit compliance, opportunities, and analytics dossiers.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/admin"
              className="px-5 py-2.5 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white rounded-xl font-bold text-xs shadow-md shadow-[#4B63D2]/20 flex items-center gap-2"
            >
              <Users className="h-4 w-4 text-[#FFD21A]" /> User & Roles Console
            </Link>
          </div>
        </div>

        {/* Department Filters & Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#EAE4F7] p-3 rounded-2xl shadow-sm mb-6">
          <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide flex-1">
            {DEPARTMENTS.map(dept => (
              <button
                key={dept}
                onClick={() => setDashboardDept(dept)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  dashboardDept === dept
                    ? "bg-[#4B63D2] text-white shadow-sm"
                    : "bg-[#F8F6FD] text-[#5851A4] hover:bg-[#EAE4F7]"
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" /> Export Report (Excel)
          </button>
        </div>

        {/* Master Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Total Accounts</span>
              <Users className="h-4 w-4 text-[#4B63D2]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">
              {stats?.total_users || 3420}
            </span>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">10 Roles Configured</p>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Departments</span>
              <Layers className="h-4 w-4 text-[#4B63D2]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">6 Divisions</span>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">All Systems Live</p>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Opportunities</span>
              <Briefcase className="h-4 w-4 text-[#FFD21A]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">
              {stats?.total_jobs || 48}
            </span>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">Active Postings</p>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Campus Engagement</span>
              <TrendingUp className="h-4 w-4 text-[#4B63D2]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">
              {stats?.total_posts || 840} Posts
            </span>
            <p className="text-[10px] text-indigo-600 font-bold mt-1">High Interaction</p>
          </div>
        </div>

        {/* Analytics Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PostEngagementChart engagement={engagement} />
          <PlatformEngagementDonut summary={summary} />
        </div>
      </div>
    );
  }

  // =========================================================================
  // 7. DEAN / PRINCIPAL / CEO DASHBOARD VIEW
  // =========================================================================
  if (roleName === "dean" || roleName === "principal" || roleName === "ceo") {
    const titleLabel =
      roleName === "dean"
        ? "Dean Academic Dashboard"
        : roleName === "principal"
        ? "Principal Executive Console"
        : "CEO Institutional Governance";

    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-12">
        <div className="bg-white border border-[#EAE4F7] rounded-3xl p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm relative overflow-hidden">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFD21A]/20 border border-[#FFD21A]/40 text-[#1E2746] text-xs font-black">
              <Building className="h-3.5 w-3.5 text-[#5851A4]" /> Executive Leadership Suite
            </div>
            <h2 className="text-3xl font-black text-[#1E2746] tracking-tight">
              {titleLabel}
            </h2>
            <p className="text-[#5851A4] text-sm max-w-2xl leading-relaxed font-medium">
              High-level institutional indicators, strategic accreditation benchmarks,
              placement achievements, and campus-wide leadership directive controls.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to={roleName === "dean" ? "/academic-overview" : "/institution"}
              className="px-5 py-2.5 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white rounded-xl font-bold text-xs shadow-md shadow-[#4B63D2]/20 flex items-center gap-2"
            >
              <Building className="h-4 w-4 text-[#FFD21A]" /> Open Strategic Overview
            </Link>
          </div>
        </div>

        {/* Executive KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Total Enrolment</span>
              <GraduationCap className="h-4 w-4 text-[#4B63D2]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">3,420</span>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">Across 6 Divisions</p>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Placement Outcome</span>
              <Award className="h-4 w-4 text-[#FFD21A]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">86.2%</span>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">₹8.4 LPA Avg CTC</p>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Accreditation</span>
              <ShieldCheck className="h-4 w-4 text-[#4B63D2]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">NAAC A++</span>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">3.74 Rating</p>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Research Grants</span>
              <Globe className="h-4 w-4 text-[#4B63D2]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">₹4.2 Cr</span>
            <p className="text-[10px] text-indigo-600 font-bold mt-1">Govt & Industry Funded</p>
          </div>
        </div>

        {/* Strategic Engagement Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ProfileViewsChart initialData={profileViews} />
          <PostEngagementChart engagement={engagement} />
        </div>
      </div>
    );
  }

  // =========================================================================
  // 8. DEFAULT / STUDENT DASHBOARD VIEW (Career Hub, AI Tools & Recs)
  // =========================================================================
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Hero Intro Panel */}
      <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#C8B6E2]/20 via-[#4B63D2]/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFD21A]/20 border border-[#FFD21A]/60 text-[#1E2746] text-xs font-black shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#5851A4]" /> AI Engine Active
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#1E2746] tracking-tight">
            Welcome Back{greetingName} 👋
          </h2>
          <p className="text-[#5851A4] text-xs sm:text-sm max-w-2xl leading-relaxed font-medium">
            Your personalized AI Hub has analyzed your skills, network activity,
            and target role to bring you high-value recommendations and career
            utilities.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-2.5 sm:gap-3 shrink-0">
          <Link
            to="/jobs"
            className="px-4 py-2.5 bg-[#F8F6FD] hover:bg-[#F0EDF9] border border-[#EAE4F7] text-[#1E2746] rounded-xl font-bold text-xs transition flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            Referrals & Opportunities <Briefcase className="h-4 w-4 text-[#4B63D2] shrink-0" />
          </Link>
          <Link
            to="/profile"
            className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white rounded-xl font-bold text-xs tracking-wider uppercase transition shadow-md shadow-[#4B63D2]/20 hover:scale-[1.02] flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            My Profile <ArrowUpRight className="h-4 w-4 text-[#FFD21A] shrink-0" />
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <ActivitySummaryCards
        stats={stats}
        profileViews={profileViews}
        connectionSuggestions={connectionSuggestions}
        jobRecommendations={jobRecommendations}
        contentRecommendations={contentRecommendations}
      />

      {/* Main Section Navigation Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#EAE4F7] pb-4 gap-4 w-full">
        <div className="flex bg-white p-1.5 rounded-2xl border border-[#EAE4F7] gap-1.5 shadow-sm overflow-x-auto no-scrollbar max-w-full">
          <button
            onClick={() => setMainTab("recommendations")}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
              mainTab === "recommendations"
                ? "bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white shadow-md shadow-[#4B63D2]/25"
                : "text-[#5851A4] hover:text-[#1E2746] hover:bg-[#F8F6FD]"
            }`}
          >
            <Sparkles
              className={`h-4 w-4 shrink-0 ${
                mainTab === "recommendations" ? "text-[#FFD21A]" : "text-[#5851A4]"
              }`}
            />{" "}
            <span>AI Recommendations</span>
          </button>
          <button
            onClick={() => setMainTab("analytics")}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
              mainTab === "analytics"
                ? "bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white shadow-md shadow-[#4B63D2]/25"
                : "text-[#5851A4] hover:text-[#1E2746] hover:bg-[#F8F6FD]"
            }`}
          >
            <TrendingUp
              className={`h-4 w-4 shrink-0 ${
                mainTab === "analytics" ? "text-[#FFD21A]" : "text-[#5851A4]"
              }`}
            />{" "}
            <span>Performance & Analytics</span>
          </button>
          <button
            onClick={() => setMainTab("aitools")}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
              mainTab === "aitools"
                ? "bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white shadow-md shadow-[#4B63D2]/25"
                : "text-[#5851A4] hover:text-[#1E2746] hover:bg-[#F8F6FD]"
            }`}
          >
            <Brain
              className={`h-4 w-4 shrink-0 ${
                mainTab === "aitools" ? "text-[#FFD21A]" : "text-[#5851A4]"
              }`}
            />{" "}
            <span>AI Career Tools</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT 1: AI Recommendations Hub */}
      {mainTab === "recommendations" && (
        <AiRecommendationsHub
          connectionSuggestions={connectionSuggestions}
          jobRecommendations={jobRecommendations}
          contentRecommendations={contentRecommendations}
        />
      )}

      {/* TAB CONTENT 2: Performance & Analytics */}
      {mainTab === "analytics" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ProfileViewsChart initialData={profileViews} />
            <PostEngagementChart engagement={engagement} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <TrendingPostsWidget initialPosts={trendingPosts} />
            </div>
            <div>
              <PlatformEngagementDonut summary={summary} />
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: Interactive AI Tools */}
      {mainTab === "aitools" && (
        <div className="space-y-6">
          <div className="flex gap-3">
            <button
              onClick={() => setAiToolCategory("resume")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition border flex items-center gap-2 cursor-pointer ${
                aiToolCategory === "resume"
                  ? "bg-[#4B63D2] text-white border-[#4B63D2] shadow-sm"
                  : "bg-white text-[#5851A4] border-[#EAE4F7] hover:bg-[#FAF9FD] hover:text-[#1E2746]"
              }`}
            >
              <FileText className="h-4 w-4" /> AI Resume Optimizer
            </button>
            <button
              onClick={() => setAiToolCategory("roadmap")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition border flex items-center gap-2 cursor-pointer ${
                aiToolCategory === "roadmap"
                  ? "bg-[#4B63D2] text-white border-[#4B63D2] shadow-sm"
                  : "bg-white text-[#5851A4] border-[#EAE4F7] hover:bg-[#FAF9FD] hover:text-[#1E2746]"
              }`}
            >
              <Compass className="h-4 w-4" /> AI Career Roadmap Generator
            </button>
          </div>

          {/* AI Resume Optimizer */}
          {aiToolCategory === "resume" && (
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-[#1E2746] flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#4B63D2]" />
                  Smart Resume Feedback Sandbox
                </h3>
                <p className="text-xs text-[#5851A4] mt-1 font-medium">
                  Paste your resume text below to receive automated feedback on
                  skills, formatting, and key recommendations.
                </p>
              </div>

              <form onSubmit={handleAnalyzeResume} className="space-y-4">
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume content, experience, projects, or bullet points here..."
                  rows={6}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl p-4 text-xs text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] transition font-medium"
                />
                <button
                  type="submit"
                  disabled={isAnalyzingResume || !resumeText.trim()}
                  className="px-5 py-2.5 bg-[#4B63D2] hover:bg-[#3E53BE] disabled:opacity-50 text-white rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  {isAnalyzingResume ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Analyzing
                      Resume...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Analyze Resume
                    </>
                  )}
                </button>
              </form>

              {resumeError && (
                <div className="bg-red-50/80 border border-red-200 rounded-2xl p-4 text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="font-bold">{resumeError}</span>
                </div>
              )}

              {resumeResult && (
                <div className="bg-[#FAF9FD] border border-[#EAE4F7] rounded-2xl p-6 space-y-6 animate-in fade-in duration-300">
                  {/* Score & Rating Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE4F7] pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <h4 className="text-base font-black text-[#1E2746]">
                          Resume Evaluation Report
                        </h4>
                      </div>
                      <p className="text-xs text-[#5851A4] mt-1 font-medium">
                        Target Role: <strong className="text-[#1E2746]">{resumeResult.target_role || "Software Developer"}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {resumeResult.rating && (
                        <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-bold">
                          {resumeResult.rating}
                        </span>
                      )}
                      {resumeResult.score !== undefined && (
                        <div className="px-4 py-2 bg-[#4B63D2] text-white rounded-2xl font-black text-sm shadow-sm flex items-center gap-1.5">
                          <span>{resumeResult.score}</span>
                          <span className="text-xs font-normal text-white/80">/ 100</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dimensions Breakdown */}
                  {resumeResult.dimensions && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-white p-3.5 rounded-2xl border border-[#EAE4F7] shadow-sm space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-[#1E2746]">
                          <span>ATS Compatibility</span>
                          <span className="text-[#4B63D2]">{resumeResult.dimensions.ats_compatibility}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#EAE4F7] rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${resumeResult.dimensions.ats_compatibility}%` }} />
                        </div>
                      </div>

                      <div className="bg-white p-3.5 rounded-2xl border border-[#EAE4F7] shadow-sm space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-[#1E2746]">
                          <span>Impact & Metrics</span>
                          <span className="text-[#4B63D2]">{resumeResult.dimensions.impact_metrics}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#EAE4F7] rounded-full overflow-hidden">
                          <div className="h-full bg-[#4B63D2] rounded-full" style={{ width: `${resumeResult.dimensions.impact_metrics}%` }} />
                        </div>
                      </div>

                      <div className="bg-white p-3.5 rounded-2xl border border-[#EAE4F7] shadow-sm space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-[#1E2746]">
                          <span>Tech Stack Depth</span>
                          <span className="text-[#4B63D2]">{resumeResult.dimensions.tech_stack_depth}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#EAE4F7] rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${resumeResult.dimensions.tech_stack_depth}%` }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detected Skills Matrix */}
                  {resumeResult.detected_skills && Object.keys(resumeResult.detected_skills).length > 0 && (
                    <div className="bg-white p-4 rounded-2xl border border-[#EAE4F7] shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1E2746] flex items-center gap-1.5">
                          <Brain className="h-4 w-4 text-[#4B63D2]" />
                          Detected Technical Skills
                        </span>
                        <span className="text-[11px] font-bold text-[#4B63D2] bg-[#4B63D2]/10 px-2 py-0.5 rounded-lg">
                          {resumeResult.detected_skills_count || Object.values(resumeResult.detected_skills).flat().length} Skills
                        </span>
                      </div>
                      <div className="space-y-2 pt-1">
                        {Object.entries(resumeResult.detected_skills).map(([category, skills], idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="text-[11px] font-bold text-[#5851A4] w-36 shrink-0">
                              {category}:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {(skills as string[]).map((sk, sIdx) => (
                                <span key={sIdx} className="text-[11px] font-semibold bg-[#FAF9FD] text-[#1E2746] border border-[#D5CBEE] px-2 py-0.5 rounded-lg">
                                  {sk}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STAR Bullet Point Rewrites */}
                  {resumeResult.bullet_rewrites && resumeResult.bullet_rewrites.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-xs font-black text-[#1E2746] uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-[#4B63D2]" />
                        STAR Method Bullet Enhancements
                      </span>
                      <div className="space-y-3">
                        {resumeResult.bullet_rewrites.map((rw: any, idx: number) => (
                          <div key={idx} className="bg-white p-4 rounded-2xl border border-[#EAE4F7] shadow-sm space-y-2">
                            <div className="text-xs">
                              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 uppercase mr-1.5">
                                Original
                              </span>
                              <span className="text-[#5851A4] italic">"{rw.original}"</span>
                            </div>
                            <div className="text-xs">
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 uppercase mr-1.5">
                                STAR Rewrite
                              </span>
                              <span className="text-[#1E2746] font-semibold">{rw.improved}</span>
                            </div>
                            {rw.reason && (
                              <p className="text-[11px] text-[#5851A4] mt-1 font-medium">
                                💡 <em>{rw.reason}</em>
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Keywords & Recommendations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Strengths */}
                    {resumeResult.strengths && resumeResult.strengths.length > 0 && (
                      <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm space-y-2">
                        <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Key Strengths
                        </span>
                        <ul className="space-y-1.5 text-xs text-[#1E2746] font-medium">
                          {resumeResult.strengths.map((item: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-emerald-500 font-bold">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Missing Keywords & Feedback */}
                    <div className="bg-white p-4 rounded-2xl border border-[#EAE4F7] shadow-sm space-y-3">
                      {resumeResult.missing_high_impact_keywords && resumeResult.missing_high_impact_keywords.length > 0 && (
                        <div>
                          <span className="text-xs font-bold text-[#1E2746] block mb-1.5">
                            Recommended Keywords to Include:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {resumeResult.missing_high_impact_keywords.map((kw: string, idx: number) => (
                              <span key={idx} className="text-[10px] font-bold text-[#4B63D2] bg-[#4B63D2]/10 border border-[#4B63D2]/20 px-2 py-0.5 rounded-md">
                                + {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {resumeResult.suggestions && resumeResult.suggestions.length > 0 && (
                        <div>
                          <span className="text-xs font-bold text-[#1E2746] block mb-1">
                            Actionable Suggestions:
                          </span>
                          <ul className="space-y-1 text-[11px] text-[#5851A4] font-medium">
                            {resumeResult.suggestions.map((sug: string, idx: number) => (
                              <li key={idx}>→ {sug}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Career Roadmap Generator */}
          {aiToolCategory === "roadmap" && (
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-[#1E2746] flex items-center gap-2">
                  <Compass className="h-5 w-5 text-[#4B63D2]" />
                  Target Career Step Generator
                </h3>
                <p className="text-xs text-[#5851A4] mt-1 font-medium">
                  Specify your target role and current skill set to generate
                  tailored learning steps.
                </p>
              </div>

              <form onSubmit={handleGenerateRoadmap} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1E2746] mb-1.5 uppercase tracking-wider">
                      Target Role <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g. Full Stack Developer, Machine Learning Engineer"
                      className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl p-3 text-xs text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] transition font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1E2746] mb-1.5 uppercase tracking-wider">
                      Current Skills (comma separated)
                    </label>
                    <input
                      type="text"
                      value={skillsInput}
                      onChange={(e) => setSkillsInput(e.target.value)}
                      placeholder="e.g. Python, React, PostgreSQL"
                      className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl p-3 text-xs text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] transition font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isGeneratingRoadmap || !targetRole.trim()}
                  className="px-5 py-2.5 bg-[#4B63D2] hover:bg-[#3E53BE] disabled:opacity-50 text-white rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  {isGeneratingRoadmap ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Generating
                      Roadmap...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Generate Learning Steps
                    </>
                  )}
                </button>
              </form>

              {roadmapError && (
                <div className="bg-red-50/80 border border-red-200 rounded-2xl p-4 text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">{roadmapError}</span>
                    <p className="text-[11px] text-red-600 mt-1">
                      Tip: Try canonical roles like <em>Frontend Developer</em>, <em>Full Stack Developer</em>, <em>Data Analyst</em>, <em>Machine Learning Engineer</em>, <em>DevOps Engineer</em>, etc.
                    </p>
                  </div>
                </div>
              )}

              {roadmapResult && (
                <div className="bg-[#FAF9FD] border border-[#EAE4F7] rounded-2xl p-6 space-y-6 animate-in fade-in duration-300">
                  {/* Header & Completion */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE4F7] pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Compass className="h-5 w-5 text-[#4B63D2]" />
                        <h4 className="text-base font-black text-[#1E2746]">
                          {roadmapResult.role || roadmapResult.target_role || targetRole}
                        </h4>
                      </div>
                      {roadmapResult.description && (
                        <p className="text-xs text-[#5851A4] mt-1 font-medium">
                          {roadmapResult.description}
                        </p>
                      )}
                    </div>
                    {typeof roadmapResult.completionPercentage === "number" && (
                      <div className="bg-white px-4 py-2.5 rounded-2xl border border-[#EAE4F7] shadow-sm flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-[#5851A4] uppercase tracking-wider block">
                            Readiness Score
                          </span>
                          <span className="text-sm font-black text-[#4B63D2]">
                            {roadmapResult.completionPercentage}%
                          </span>
                        </div>
                        <div className="w-16 h-2 bg-[#EAE4F7] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#4B63D2] rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(Math.max(roadmapResult.completionPercentage, 5), 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Skills Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Matched Skills */}
                    <div className="bg-white p-4 rounded-2xl border border-[#EAE4F7] shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1E2746] flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Matched Skills (Completed)
                        </span>
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                          {roadmapResult.matchedSkills?.length || 0}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {roadmapResult.matchedSkills && roadmapResult.matchedSkills.length > 0 ? (
                          roadmapResult.matchedSkills.map((sk: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-1 rounded-xl"
                            >
                              ✓ {sk}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-[#9188BE] italic">
                            No matching skills acquired yet.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Missing Skills */}
                    <div className="bg-white p-4 rounded-2xl border border-[#EAE4F7] shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1E2746] flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-[#4B63D2]" />
                          Skills To Acquire
                        </span>
                        <span className="text-[11px] font-bold text-[#4B63D2] bg-[#4B63D2]/10 px-2 py-0.5 rounded-lg border border-[#4B63D2]/20">
                          {roadmapResult.missingSkills?.length || 0}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {roadmapResult.missingSkills && roadmapResult.missingSkills.length > 0 ? (
                          roadmapResult.missingSkills.map((sk: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-[11px] font-semibold bg-[#FAF9FD] text-[#4B63D2] border border-[#D5CBEE] px-2.5 py-1 rounded-xl"
                            >
                              + {sk}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-emerald-600 font-bold">
                            🎉 All required skills acquired!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sequential Learning Steps */}
                  <div className="space-y-3 pt-2">
                    <h5 className="text-xs font-black text-[#1E2746] uppercase tracking-wider">
                      Ordered Learning Roadmap ({roadmapResult.learningSteps?.length || 0} Steps)
                    </h5>

                    {roadmapResult.learningSteps && roadmapResult.learningSteps.length > 0 ? (
                      roadmapResult.learningSteps.map((step: any, idx: number) => {
                        const isDone = step.status === "completed";
                        const inProg = step.status === "in_progress";

                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm transition ${
                              isDone
                                ? "bg-emerald-50/40 border-emerald-200"
                                : inProg
                                ? "bg-amber-50/40 border-amber-200"
                                : "bg-white border-[#EAE4F7]"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={`h-7 w-7 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                                  isDone
                                    ? "bg-emerald-600 text-white"
                                    : inProg
                                    ? "bg-amber-500 text-white"
                                    : "bg-[#4B63D2]/15 text-[#4B63D2]"
                                }`}
                              >
                                {step.step || idx + 1}
                              </span>
                              <div>
                                <h5 className="text-xs font-bold text-[#1E2746]">
                                  {step.title}
                                </h5>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {step.skills?.map((sk: string, sIdx: number) => (
                                    <span
                                      key={sIdx}
                                      className="text-[10px] font-medium bg-[#FAF9FD] text-[#5851A4] border border-[#EAE4F7] px-2 py-0.5 rounded-lg"
                                    >
                                      {sk}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 self-end sm:self-center">
                              {isDone ? (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> COMPLETED
                                </span>
                              ) : inProg ? (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-full border border-amber-300">
                                  IN PROGRESS
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-[#5851A4] bg-[#FAF9FD] px-2.5 py-1 rounded-full border border-[#D5CBEE]">
                                  NOT STARTED
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : roadmapResult.milestones ? (
                      roadmapResult.milestones.map((step: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-white p-3.5 rounded-2xl border border-[#EAE4F7] flex items-start gap-3 shadow-sm"
                        >
                          <span className="h-6 w-6 rounded-full bg-[#4B63D2]/15 text-[#4B63D2] font-black text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <h5 className="text-xs font-bold text-[#1E2746]">
                              {step.title}
                            </h5>
                            <p className="text-xs text-[#5851A4] mt-1 font-medium leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
