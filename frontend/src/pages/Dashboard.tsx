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
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-12">
        {/* Alumni Header Console */}
        <div className="bg-white border border-[#EAE4F7] rounded-3xl p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm relative overflow-hidden">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFD21A]/20 border border-[#FFD21A]/50 text-[#1E2746] text-xs font-black">
              <Award className="h-3.5 w-3.5 text-[#5851A4]" /> Alumni Career & Contribution Hub
            </div>
            <h2 className="text-3xl font-black text-[#1E2746] tracking-tight">
              Welcome Back{greetingName} 🎓
            </h2>
            <p className="text-[#5851A4] text-sm max-w-2xl leading-relaxed font-medium">
              Stay connected with your alma mater, mentor aspiring juniors, publish company
              referrals, and accelerate your own career path.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/jobs"
              className="px-5 py-2.5 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white rounded-xl font-bold text-xs shadow-md shadow-[#4B63D2]/20 flex items-center gap-2 hover:opacity-95 transition-all"
            >
              <Briefcase className="h-4 w-4 text-[#FFD21A]" /> Post a Referral / Job
            </Link>
            <Link
              to="/connections"
              className="px-4 py-2.5 bg-[#F8F6FD] border border-[#EAE4F7] text-[#1E2746] hover:bg-[#F0EDF9] rounded-xl font-bold text-xs transition-all flex items-center gap-2"
            >
              <Users className="h-4 w-4 text-[#4B63D2]" /> Alumni & Student Ties
            </Link>
          </div>
        </div>

        {/* Dual Action Cards for Alumni */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/70 border border-indigo-100/80 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-[#4B63D2] text-white flex items-center justify-center font-black">
                <Briefcase className="w-5 h-5 text-[#FFD21A]" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#1E2746]">
                  Working in Industry? Share Referrals
                </h3>
                <p className="text-xs text-[#5851A4] font-medium">
                  Help juniors and batchmates get placed at your organization.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Link
                to="/jobs"
                className="px-4 py-2 bg-[#4B63D2] hover:bg-[#3E53BE] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Post an Opportunity &rarr;
              </Link>
              <Link
                to="/messaging"
                className="px-4 py-2 bg-white border border-[#EAE4F7] hover:bg-[#FAF9FD] text-[#1E2746] text-xs font-bold rounded-xl transition-all"
              >
                Student Mentorship Chats
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/70 border border-emerald-100/80 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black">
                <Sparkles className="w-5 h-5 text-[#FFD21A]" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#1E2746]">
                  Looking for New Roles? AI Career Toolkit
                </h3>
                <p className="text-xs text-[#5851A4] font-medium">
                  Apply for top openings, optimize ATS resume, and generate skills roadmaps.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Link
                to="/jobs"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Explore Top Openings &rarr;
              </Link>
              <button
                onClick={() => {
                  const el = document.getElementById("alumni-ai-tools");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-4 py-2 bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-900 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                AI Resume Polish
              </button>
            </div>
          </div>
        </div>

        {/* Alumni KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Mentorship Mentees</span>
              <GraduationCap className="h-4 w-4 text-[#4B63D2]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">18 Students</span>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">Active Career Guidance</p>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#5851A4] mb-2">
              <span className="text-xs font-bold uppercase">Referrals Posted</span>
              <Briefcase className="h-4 w-4 text-[#4B63D2]" />
            </div>
            <span className="text-2xl font-black text-[#1E2746]">6 Opportunities</span>
            <p className="text-[10px] text-indigo-600 font-bold mt-1">At top tech firms</p>
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

        {/* Interactive AI Career Tools for Alumni (Resume Analyzer & Career Roadmap) */}
        <div id="alumni-ai-tools" className="bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE4F7] pb-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4B63D2]/10 text-[#4B63D2] text-xs font-bold">
                <Brain className="h-3.5 w-3.5" /> AI Career Acceleration Suite
              </div>
              <h3 className="text-xl font-black text-[#1E2746]">
                ATS Resume Optimizer & Career Transition Roadmap
              </h3>
              <p className="text-xs text-[#5851A4] font-medium">
                Tailored for alumni looking to switch companies, step up to Senior/Lead roles, or break into new tech stacks.
              </p>
            </div>

            {/* Sub-tool Category Switcher */}
            <div className="flex bg-[#FAF9FD] p-1 rounded-2xl border border-[#EAE4F7] self-start sm:self-auto shrink-0">
              <button
                onClick={() => setAiToolCategory("resume")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  aiToolCategory === "resume"
                    ? "bg-[#4B63D2] text-white shadow-sm"
                    : "text-[#5851A4] hover:text-[#1E2746]"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Resume Polish</span>
              </button>
              <button
                onClick={() => setAiToolCategory("roadmap")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  aiToolCategory === "roadmap"
                    ? "bg-[#4B63D2] text-white shadow-sm"
                    : "text-[#5851A4] hover:text-[#1E2746]"
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Role Roadmap</span>
              </button>
            </div>
          </div>

          {aiToolCategory === "resume" ? (
            <div className="space-y-6">
              <form onSubmit={handleAnalyzeResume} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1E2746] mb-1">
                    Paste Resume Bullet Points or Work Experience Text
                  </label>
                  <textarea
                    rows={4}
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="e.g. Led backend migration to FastAPI microservices with PostgreSQL on AWS, improving latency by 35%..."
                    className="w-full px-4 py-3 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-2xl text-xs sm:text-sm font-medium text-[#1E2746] focus:outline-none resize-none"
                  />
                </div>

                {resumeError && (
                  <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{resumeError}</span>
                  </p>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isAnalyzingResume}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white rounded-xl text-xs font-bold shadow-md shadow-[#4B63D2]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isAnalyzingResume ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-[#FFD21A]" />
                        <span>Analyzing with AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-[#FFD21A]" />
                        <span>Analyze & Polish Resume</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {resumeResult && (
                <div className="p-5 bg-[#FAF9FD] rounded-2xl border border-[#EAE4F7] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#1E2746]">Resume ATS Assessment</h4>
                      <p className="text-xs text-[#5851A4]">Target Role: {resumeResult.target_role || "Professional"}</p>
                    </div>
                    {resumeResult.score !== undefined && (
                      <div className="px-4 py-2 bg-[#4B63D2] text-white rounded-xl font-black text-sm">
                        {resumeResult.score} / 100
                      </div>
                    )}
                  </div>
                  {resumeResult.dimensions && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="bg-white p-3 rounded-xl border border-[#EAE4F7] text-center">
                        <span className="text-[10px] uppercase font-bold text-[#5851A4]">ATS Compat</span>
                        <p className="text-base font-black text-[#1E2746]">{resumeResult.dimensions.ats_compatibility}%</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-[#EAE4F7] text-center">
                        <span className="text-[10px] uppercase font-bold text-[#5851A4]">Impact Metrics</span>
                        <p className="text-base font-black text-[#1E2746]">{resumeResult.dimensions.impact_metrics}%</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-[#EAE4F7] text-center">
                        <span className="text-[10px] uppercase font-bold text-[#5851A4]">Tech Depth</span>
                        <p className="text-base font-black text-[#1E2746]">{resumeResult.dimensions.tech_stack_depth}%</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <form onSubmit={handleGenerateRoadmap} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1E2746] mb-1">Target Next Role *</label>
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g. Lead Engineer, Engineering Manager, AI Specialist"
                      className="w-full px-4 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs sm:text-sm font-medium text-[#1E2746] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1E2746] mb-1">Your Current Skills</label>
                    <input
                      type="text"
                      value={skillsInput}
                      onChange={(e) => setSkillsInput(e.target.value)}
                      placeholder="e.g. Python, Docker, React, AWS, System Design"
                      className="w-full px-4 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs sm:text-sm font-medium text-[#1E2746] focus:outline-none"
                    />
                  </div>
                </div>

                {roadmapError && (
                  <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{roadmapError}</span>
                  </p>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isGeneratingRoadmap}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white rounded-xl text-xs font-bold shadow-md shadow-[#4B63D2]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingRoadmap ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-[#FFD21A]" />
                        <span>Generating Roadmap...</span>
                      </>
                    ) : (
                      <>
                        <Compass className="h-4 w-4 text-[#FFD21A]" />
                        <span>Generate Career Roadmap</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {roadmapResult && (
                <div className="p-5 bg-[#FAF9FD] rounded-2xl border border-[#EAE4F7] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#1E2746]">Transition Plan to {roadmapResult.target_role}</h4>
                      <p className="text-xs text-[#5851A4]">Estimated Timeframe: {roadmapResult.estimated_timeframe || "3-6 months"}</p>
                    </div>
                  </div>
                  {roadmapResult.steps && (
                    <div className="space-y-3 pt-2">
                      {roadmapResult.steps.map((st: any, sIdx: number) => (
                        <div key={sIdx} className="bg-white p-3.5 rounded-xl border border-[#EAE4F7] space-y-1">
                          <h5 className="text-xs font-bold text-[#1E2746] flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#4B63D2] text-white text-[10px] flex items-center justify-center font-bold">{sIdx + 1}</span>
                            {st.title || st.step_name}
                          </h5>
                          <p className="text-[11px] text-[#5851A4] pl-7">{st.description || st.details}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
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
