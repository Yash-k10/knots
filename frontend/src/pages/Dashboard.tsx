import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Briefcase,
  Sparkles,
  Compass,
  FileText,
  CheckCircle2,
  Brain,
  Send,
  Loader2,
  TrendingUp,
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
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [profileViews, setProfileViews] = useState<ProfileViewsResponse | null>(
    null,
  );
  const [engagement, setEngagement] = useState<PostEngagementResponse | null>(
    null,
  );
  const [summary, setSummary] = useState<PlatformEngagementSummary | null>(
    null,
  );
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);

  // AI Recommendation States
  const [connectionSuggestions, setConnectionSuggestions] = useState<
    ConnectionSuggestion[]
  >([]);
  const [jobRecommendations, setJobRecommendations] = useState<
    JobRecommendation[]
  >([]);
  const [contentRecommendations, setContentRecommendations] = useState<
    ContentRecommendation[]
  >([]);

  // UI View States
  const [mainTab, setMainTab] = useState<
    "recommendations" | "analytics" | "aitools"
  >("recommendations");
  const [aiToolCategory, setAiToolCategory] = useState<"resume" | "roadmap">(
    "resume",
  );

  // Interactive AI Tools States
  const [resumeText, setResumeText] = useState("");
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);
  const [resumeResult, setResumeResult] = useState<ResumeAnalysisResult | null>(
    null,
  );

  const [targetRole, setTargetRole] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [roadmapResult, setRoadmapResult] =
    useState<CareerRoadmapResult | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [
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
    if (!resumeText.trim()) return;
    setIsAnalyzingResume(true);
    try {
      const res = await aiService.analyzeResume(resumeText);
      setResumeResult(res);
    } catch (err) {
      console.error("Resume analysis failed", err);
    } finally {
      setIsAnalyzingResume(false);
    }
  };

  const handleGenerateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRole.trim()) return;
    setIsGeneratingRoadmap(true);
    const skillsList = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const res = await aiService.generateRoadmap(targetRole, skillsList);
      setRoadmapResult(res);
    } catch (err) {
      console.error("Roadmap generation failed", err);
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-44 bg-slate-900 border border-slate-800 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-slate-900 border border-slate-800 rounded-xl"
            />
          ))}
        </div>
        <div className="h-96 bg-slate-900 border border-slate-800 rounded-2xl" />
      </div>
    );
  }

  const greetingName = profile?.first_name ? `, ${profile.first_name}` : "";

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Hero Intro Panel */}
      <div className="bg-white border border-[#EAE4F7] rounded-3xl p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#C8B6E2]/20 via-[#4B63D2]/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFD21A]/20 border border-[#FFD21A]/60 text-[#1E2746] text-xs font-black shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#5851A4]" /> AI Engine Active
          </div>
          <h2 className="text-3xl font-black text-[#1E2746] tracking-tight">
            Welcome Back{greetingName} 👋
          </h2>
          <p className="text-[#5851A4] text-sm max-w-2xl leading-relaxed font-medium">
            Your personalized AI Hub has analyzed your skills, network activity,
            and target role to bring you high-value recommendations and career
            utilities.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3 shrink-0">
          <a
            href="/jobs"
            className="px-4 py-2.5 bg-[#F8F6FD] hover:bg-[#F0EDF9] border border-[#EAE4F7] text-[#1E2746] rounded-xl font-bold text-xs transition flex items-center gap-2"
          >
            Referrals & Opportunities <Briefcase className="h-4 w-4 text-[#4B63D2]" />
          </a>
          <a

            href="/profile"
            className="px-5 py-2.5 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white rounded-xl font-bold text-xs tracking-wider uppercase transition shadow-md shadow-[#4B63D2]/20 hover:scale-[1.02] flex items-center gap-2"
          >
            My Profile <ArrowUpRight className="h-4 w-4 text-[#FFD21A]" />
          </a>
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#EAE4F7] pb-4 gap-4">
        <div className="flex bg-white p-1.5 rounded-2xl border border-[#EAE4F7] gap-1.5 shadow-sm">
          <button
            onClick={() => setMainTab("recommendations")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              mainTab === "recommendations"
                ? "bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white shadow-md shadow-[#4B63D2]/25"
                : "text-[#5851A4] hover:text-[#1E2746] hover:bg-[#F8F6FD]"
            }`}
          >
            <Sparkles className={`h-4 w-4 ${mainTab === "recommendations" ? "text-[#FFD21A]" : "text-[#5851A4]"}`} /> AI Recommendations
          </button>
          <button
            onClick={() => setMainTab("analytics")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              mainTab === "analytics"
                ? "bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white shadow-md shadow-[#4B63D2]/25"
                : "text-[#5851A4] hover:text-[#1E2746] hover:bg-[#F8F6FD]"
            }`}
          >
            <TrendingUp className={`h-4 w-4 ${mainTab === "analytics" ? "text-[#FFD21A]" : "text-[#5851A4]"}`} /> Performance & Analytics
          </button>
          <button
            onClick={() => setMainTab("aitools")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              mainTab === "aitools"
                ? "bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white shadow-md shadow-[#4B63D2]/25"
                : "text-[#5851A4] hover:text-[#1E2746] hover:bg-[#F8F6FD]"
            }`}
          >
            <Brain className={`h-4 w-4 ${mainTab === "aitools" ? "text-[#FFD21A]" : "text-[#5851A4]"}`} /> AI Career Tools
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

      {/* TAB CONTENT 2: Performance & Analytics (Member 2 Components Integration) */}
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
                  placeholder="Paste your resume content or bullet points here..."
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

              {resumeResult && (
                <div className="bg-[#FAF9FD] border border-[#EAE4F7] rounded-2xl p-6 space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-[#1E2746] flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />{" "}
                      Analysis Results
                    </h4>
                    {resumeResult.score !== undefined && (
                      <span className="px-3 py-1 bg-[#4B63D2]/10 border border-[#4B63D2]/30 text-[#4B63D2] rounded-full text-xs font-black">
                        Resume Score: {resumeResult.score}/100
                      </span>
                    )}
                  </div>

                  {resumeResult.feedback && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-[#1E2746]">
                        Key Feedback:
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-xs text-[#5851A4] font-medium">
                        {resumeResult.feedback.map(
                          (item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
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
                      Target Role
                    </label>
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g. Senior Full-Stack Engineer, AI Research Intern"
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

              {roadmapResult && (
                <div className="bg-[#FAF9FD] border border-[#EAE4F7] rounded-2xl p-6 space-y-4 animate-in fade-in duration-300">
                  <h4 className="text-sm font-black text-[#1E2746] flex items-center gap-2">
                    <Compass className="h-4 w-4 text-[#4B63D2]" /> Proposed
                    Career Path
                  </h4>
                  {roadmapResult.milestones && (
                    <div className="space-y-3">
                      {roadmapResult.milestones.map(
                        (step: any, idx: number) => (
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
                        ),
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
