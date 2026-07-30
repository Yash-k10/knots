import { useEffect, useState } from 'react'
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
} from 'lucide-react'
import {
  analyticsService,
  SystemStats,
  ProfileViewsResponse,
  PostEngagementResponse,
  TrendingPost,
  PlatformEngagementSummary,
} from '../services/analytics'
import { profileService, ProfileResponse } from '../services/profile'
import {
  ProfileViewsChart,
  PostEngagementChart,
  PlatformEngagementDonut,
  TrendingPostsWidget,
} from '../components/analytics'
import { ActivitySummaryCards, AiRecommendationsHub } from '../components/dashboard'
import {
  aiService,
  ConnectionSuggestion,
  JobRecommendation,
  ContentRecommendation,
  ResumeAnalysisResult,
  CareerRoadmapResult,
} from '../services/ai'

export default function Dashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [profileViews, setProfileViews] = useState<ProfileViewsResponse | null>(null)
  const [engagement, setEngagement] = useState<PostEngagementResponse | null>(null)
  const [summary, setSummary] = useState<PlatformEngagementSummary | null>(null)
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([])
  const [profile, setProfile] = useState<ProfileResponse | null>(null)

  // AI Recommendation States
  const [connectionSuggestions, setConnectionSuggestions] = useState<ConnectionSuggestion[]>([])
  const [jobRecommendations, setJobRecommendations] = useState<JobRecommendation[]>([])
  const [contentRecommendations, setContentRecommendations] = useState<ContentRecommendation[]>([])

  // UI View States
  const [mainTab, setMainTab] = useState<'recommendations' | 'analytics' | 'aitools'>('recommendations')
  const [aiToolCategory, setAiToolCategory] = useState<'resume' | 'roadmap'>('resume')

  // Interactive AI Tools States
  const [resumeText, setResumeText] = useState('')
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false)
  const [resumeResult, setResumeResult] = useState<ResumeAnalysisResult | null>(null)

  const [targetRole, setTargetRole] = useState('')
  const [skillsInput, setSkillsInput] = useState('')
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false)
  const [roadmapResult, setRoadmapResult] = useState<CareerRoadmapResult | null>(null)

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [sysStats, viewsData, engData, engSummary, trending, userProfile, connSugg, jobRecs, contentRecs] =
          await Promise.all([
            analyticsService.getSystemStats().catch(() => null),
            analyticsService.getProfileViews(7).catch(() => null),
            analyticsService.getPostEngagement().catch(() => null),
            analyticsService.getPlatformEngagementSummary().catch(() => null),
            analyticsService.getTrendingPosts(5).catch(() => []),
            profileService.getOwnProfile().catch(() => null),
            aiService.getConnectionSuggestions(6).catch(() => []),
            aiService.getJobRecommendations(6).catch(() => []),
            aiService.getContentRecommendations(6).catch(() => []),
          ])

        setStats(sysStats)
        setProfileViews(viewsData)
        setEngagement(engData)
        setSummary(engSummary)
        setTrendingPosts(trending || [])
        setProfile(userProfile)
        setConnectionSuggestions(connSugg || [])
        setJobRecommendations(jobRecs || [])
        setContentRecommendations(contentRecs || [])
      } catch (error) {
        console.error('Failed to load dashboard data', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const handleAnalyzeResume = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resumeText.trim()) return
    setIsAnalyzingResume(true)
    try {
      const res = await aiService.analyzeResume(resumeText)
      setResumeResult(res)
    } catch (err) {
      console.error('Resume analysis failed', err)
    } finally {
      setIsAnalyzingResume(false)
    }
  }

  const handleGenerateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetRole.trim()) return
    setIsGeneratingRoadmap(true)
    const skillsList = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    try {
      const res = await aiService.generateRoadmap(targetRole, skillsList)
      setRoadmapResult(res)
    } catch (err) {
      console.error('Roadmap generation failed', err)
    } finally {
      setIsGeneratingRoadmap(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-44 bg-slate-900 border border-slate-800 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-900 border border-slate-800 rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-slate-900 border border-slate-800 rounded-2xl" />
      </div>
    )
  }

  const greetingName = profile?.first_name ? `, ${profile.first_name}` : ''

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Hero Intro Panel */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900/40 border border-indigo-500/20 rounded-2xl p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> AI Engine Active
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome Back{greetingName} 👋
          </h2>
          <p className="text-indigo-200 text-sm max-w-2xl leading-relaxed">
            Your personalized AI Hub has analyzed your skills, network activity, and target role to bring you high-value recommendations and career utilities.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3 shrink-0">
          <a
            href="/jobs"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white rounded-xl font-semibold text-xs transition flex items-center gap-1.5"
          >
            Explore Jobs <Briefcase className="h-4 w-4 text-emerald-400" />
          </a>
          <a
            href="/profile"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs tracking-wider uppercase transition shadow-lg shadow-indigo-600/30 hover:scale-[1.02] flex items-center gap-1.5"
          >
            My Profile <ArrowUpRight className="h-4 w-4" />
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-900 pb-4 gap-4">
        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-900 gap-1">
          <button
            onClick={() => setMainTab('recommendations')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              mainTab === 'recommendations'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sparkles className="h-4 w-4" /> AI Recommendations
          </button>
          <button
            onClick={() => setMainTab('analytics')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              mainTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <TrendingUp className="h-4 w-4" /> Performance & Analytics
          </button>
          <button
            onClick={() => setMainTab('aitools')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              mainTab === 'aitools'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Brain className="h-4 w-4" /> AI Career Tools
          </button>
        </div>
      </div>

      {/* TAB CONTENT 1: AI Recommendations Hub */}
      {mainTab === 'recommendations' && (
        <AiRecommendationsHub
          connectionSuggestions={connectionSuggestions}
          jobRecommendations={jobRecommendations}
          contentRecommendations={contentRecommendations}
        />
      )}

      {/* TAB CONTENT 2: Performance & Analytics (Member 2 Components Integration) */}
      {mainTab === 'analytics' && (
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
      {mainTab === 'aitools' && (
        <div className="space-y-6">
          <div className="flex gap-3">
            <button
              onClick={() => setAiToolCategory('resume')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition border flex items-center gap-2 ${
                aiToolCategory === 'resume'
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-950 text-slate-400 border-slate-900 hover:border-slate-800'
              }`}
            >
              <FileText className="h-4 w-4" /> AI Resume Optimizer
            </button>
            <button
              onClick={() => setAiToolCategory('roadmap')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition border flex items-center gap-2 ${
                aiToolCategory === 'roadmap'
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-950 text-slate-400 border-slate-900 hover:border-slate-800'
              }`}
            >
              <Compass className="h-4 w-4" /> AI Career Roadmap Generator
            </button>
          </div>

          {/* AI Resume Optimizer */}
          {aiToolCategory === 'resume' && (
            <div className="bg-slate-950/50 border border-slate-900 rounded-2xl p-6 backdrop-blur-md space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-400" />
                  Smart Resume Feedback Sandbox
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Paste your resume text below to receive automated feedback on skills, formatting, and key recommendations.
                </p>
              </div>

              <form onSubmit={handleAnalyzeResume} className="space-y-4">
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume content or bullet points here..."
                  rows={6}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
                <button
                  type="submit"
                  disabled={isAnalyzingResume || !resumeText.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                >
                  {isAnalyzingResume ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Analyzing Resume...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Analyze Resume
                    </>
                  )}
                </button>
              </form>

              {resumeResult && (
                <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-6 space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Analysis Results
                    </h4>
                    {resumeResult.score !== undefined && (
                      <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 rounded-full text-xs font-black">
                        Resume Score: {resumeResult.score}/100
                      </span>
                    )}
                  </div>

                  {resumeResult.feedback && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-300">Key Feedback:</span>
                      <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
                        {resumeResult.feedback.map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* AI Career Roadmap Generator */}
          {aiToolCategory === 'roadmap' && (
            <div className="bg-slate-950/50 border border-slate-900 rounded-2xl p-6 backdrop-blur-md space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Compass className="h-5 w-5 text-indigo-400" />
                  Target Career Step Generator
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Specify your target role and current skill set to generate tailored learning steps.
                </p>
              </div>

              <form onSubmit={handleGenerateRoadmap} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Role</label>
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g. Senior Full-Stack Engineer, AI Research Intern"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Current Skills (comma separated)
                    </label>
                    <input
                      type="text"
                      value={skillsInput}
                      onChange={(e) => setSkillsInput(e.target.value)}
                      placeholder="e.g. Python, React, PostgreSQL"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isGeneratingRoadmap || !targetRole.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                >
                  {isGeneratingRoadmap ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Generating Roadmap...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Generate Learning Steps
                    </>
                  )}
                </button>
              </form>

              {roadmapResult && (
                <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-6 space-y-4 animate-in fade-in duration-300">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Compass className="h-4 w-4 text-indigo-400" /> Proposed Career Path
                  </h4>
                  {roadmapResult.milestones && (
                    <div className="space-y-3">
                      {roadmapResult.milestones.map((step: any, idx: number) => (
                        <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-start gap-3">
                          <span className="h-6 w-6 rounded-full bg-indigo-600/20 text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <h5 className="text-xs font-bold text-white">{step.title}</h5>
                            <p className="text-xs text-slate-400 mt-1">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
