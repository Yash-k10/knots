import { useEffect, useState } from 'react'
import {
  Users,
  Briefcase,
  MessageSquare,
  ArrowUpRight,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Activity,
  Award,
  Sparkles,
  UserPlus,
  Compass,
  FileText,
  MapPin,
  CheckCircle2,
  Brain,
  Send,
  Loader2,
  Zap,
} from 'lucide-react'
import { analyticsService, SystemStats, ProfileViewsResponse, PostEngagementResponse, TrendingPost } from '../services/analytics'
import { profileService, ProfileResponse } from '../services/profile'
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
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([])
  const [profile, setProfile] = useState<ProfileResponse | null>(null)

  // AI Recommendation States
  const [connectionSuggestions, setConnectionSuggestions] = useState<ConnectionSuggestion[]>([])
  const [jobRecommendations, setJobRecommendations] = useState<JobRecommendation[]>([])
  const [contentRecommendations, setContentRecommendations] = useState<ContentRecommendation[]>([])

  // UI View States
  const [mainTab, setMainTab] = useState<'recommendations' | 'analytics' | 'aitools'>('recommendations')
  const [recCategory, setRecCategory] = useState<'peers' | 'jobs' | 'content'>('peers')
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
        const [sysStats, viewsData, engData, trending, userProfile, connSugg, jobRecs, contentRecs] =
          await Promise.all([
            analyticsService.getSystemStats().catch(() => null),
            analyticsService.getProfileViews(7).catch(() => null),
            analyticsService.getPostEngagement().catch(() => null),
            analyticsService.getTrendingPosts(5).catch(() => []),
            profileService.getOwnProfile().catch(() => null),
            aiService.getConnectionSuggestions(6).catch(() => []),
            aiService.getJobRecommendations(6).catch(() => []),
            aiService.getContentRecommendations(6).catch(() => []),
          ])

        setStats(sysStats)
        setProfileViews(viewsData)
        setEngagement(engData)
        setTrendingPosts(trending)
        setProfile(userProfile)
        setConnectionSuggestions(connSugg)
        setJobRecommendations(jobRecs)
        setContentRecommendations(contentRecs)
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

  // Profile views chart calculation
  const viewsHistory = profileViews?.history || []
  const maxViews = Math.max(...viewsHistory.map((h) => h.views), 10)
  const svgWidth = 500
  const svgHeight = 200
  const padding = 25

  const points = viewsHistory.map((item, idx) => {
    const x = padding + (idx * (svgWidth - padding * 2)) / Math.max(viewsHistory.length - 1, 1)
    const y = svgHeight - padding - (item.views * (svgHeight - padding * 2)) / maxViews
    return { x, y, val: item.views, date: item.date }
  })

  const linePath = points.map((p) => `${p.x},${p.y}`).join(' ')
  const areaPath = points.length
    ? `${points[0].x},${svgHeight - padding} ` +
      linePath +
      ` ${points[points.length - 1].x},${svgHeight - padding}`
    : ''

  const totalViews = engagement?.total_views || 0
  const totalLikes = engagement?.total_likes || 0
  const totalComments = engagement?.total_comments || 0
  const totalEngagements = totalLikes + totalComments

  const greetingName = profile?.first_name ? `, ${profile.first_name}` : ''

  const summaryCards = [
    {
      title: 'AI Peer Matches',
      value: connectionSuggestions.length.toString(),
      desc: `Out of ${stats?.total_users || 0} active members`,
      icon: Users,
      color: 'text-indigo-400 bg-indigo-500/10',
    },
    {
      title: 'Job Recommendations',
      value: jobRecommendations.length.toString(),
      desc: `From ${stats?.total_jobs || 0} active opportunities`,
      icon: Briefcase,
      color: 'text-emerald-400 bg-emerald-500/10',
    },
    {
      title: 'Curated Discussions',
      value: contentRecommendations.length.toString(),
      desc: `Selected from ${stats?.total_posts || 0} posts`,
      icon: MessageSquare,
      color: 'text-pink-400 bg-pink-500/10',
    },
    {
      title: 'Profile Activity',
      value: (profileViews?.total_views || 0).toLocaleString(),
      desc: 'Total profile visits this week',
      icon: Activity,
      color: 'text-amber-400 bg-amber-500/10',
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* 1. Hero Intro & Personalized Summary */}
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

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              className="bg-slate-950/70 border border-slate-900 hover:border-slate-800 rounded-2xl p-6 hover:shadow-2xl hover:scale-[1.01] transition duration-300 relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition duration-300" />
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    {card.title}
                  </p>
                  <p className="text-3xl font-black text-white mt-2 tracking-tight">
                    {card.value}
                  </p>
                </div>
                <div className={`p-3 rounded-2xl ${card.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-4 relative z-10">{card.desc}</p>
            </div>
          )
        })}
      </div>

      {/* 3. Main Section Navigation Tabs */}
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

      {/* 4. TAB CONTENT 1: AI Recommendations Hub */}
      {mainTab === 'recommendations' && (
        <div className="space-y-6">
          {/* Recommendation Sub-Category Switcher */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRecCategory('peers')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition border ${
                recCategory === 'peers'
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-900 hover:border-slate-800'
              }`}
            >
              Peer Suggestions ({connectionSuggestions.length})
            </button>
            <button
              onClick={() => setRecCategory('jobs')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition border ${
                recCategory === 'jobs'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-900 hover:border-slate-800'
              }`}
            >
              Job Matches ({jobRecommendations.length})
            </button>
            <button
              onClick={() => setRecCategory('content')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition border ${
                recCategory === 'content'
                  ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-900 hover:border-slate-800'
              }`}
            >
              Feed Highlights ({contentRecommendations.length})
            </button>
          </div>

          {/* Peer Suggestions Category */}
          {recCategory === 'peers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connectionSuggestions.length > 0 ? (
                connectionSuggestions.map((item) => (
                  <div
                    key={item.user_id}
                    className="bg-slate-950/50 border border-slate-900 hover:border-indigo-500/30 rounded-2xl p-6 backdrop-blur-md transition duration-300 flex flex-col justify-between relative group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-base shadow-inner overflow-hidden">
                            {item.profile_picture ? (
                              <img
                                src={item.profile_picture}
                                alt={item.first_name || 'User'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (item.first_name?.[0] || 'U')
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white leading-tight">
                              {item.first_name || 'User'} {item.last_name || ''}
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {item.department || 'Student'}{' '}
                              {item.graduation_year ? `'${item.graduation_year.toString().slice(-2)}` : ''}
                            </p>
                          </div>
                        </div>

                        {/* Match Score Badge */}
                        <div className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[11px] font-extrabold flex items-center gap-1 shrink-0">
                          <Zap className="h-3 w-3 text-amber-400 fill-amber-400" />
                          {item.match_score}% Match
                        </div>
                      </div>

                      {item.bio && (
                        <p className="text-xs text-slate-300 line-clamp-2 mb-4 leading-relaxed italic">
                          "{item.bio}"
                        </p>
                      )}

                      {/* Rationale */}
                      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 mb-4 text-[11px] text-indigo-200/90 leading-relaxed">
                        <span className="font-semibold text-indigo-300">Why recommended: </span>
                        {item.reason}
                      </div>

                      {/* Shared Skills Tags */}
                      {item.common_skills && item.common_skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {item.common_skills.map((skill, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 text-[10px] font-medium border border-slate-800"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <a
                      href="/connections"
                      className="w-full py-2 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Connect Now
                    </a>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center border border-dashed border-slate-800 rounded-2xl">
                  <Users className="h-10 w-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No peer recommendations found right now.</p>
                </div>
              )}
            </div>
          )}

          {/* Job Recommendations Category */}
          {recCategory === 'jobs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobRecommendations.length > 0 ? (
                jobRecommendations.map((job) => (
                  <div
                    key={job.job_id}
                    className="bg-slate-950/50 border border-slate-900 hover:border-emerald-500/30 rounded-2xl p-6 backdrop-blur-md transition duration-300 flex flex-col justify-between relative group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            {job.job_type || 'Full Time'}
                          </span>
                          <h4 className="text-base font-bold text-white mt-2 leading-tight">
                            {job.title}
                          </h4>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            {job.company_name || 'Partner Company'}
                          </p>
                        </div>
                        <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-extrabold flex items-center gap-1 shrink-0">
                          <Zap className="h-3 w-3 text-amber-400 fill-amber-400" />
                          {job.match_score}% Match
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-4">
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-500" /> {job.location}
                          </span>
                        )}
                        {job.salary_range && (
                          <span className="text-slate-300 font-semibold">{job.salary_range}</span>
                        )}
                      </div>

                      {/* Rationale */}
                      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 mb-4 text-[11px] text-emerald-200/90 leading-relaxed">
                        <span className="font-semibold text-emerald-300">Matching details: </span>
                        {job.reason}
                      </div>

                      {/* Matching Skills */}
                      {job.matching_skills && job.matching_skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {job.matching_skills.map((skill, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-emerald-950/40 text-emerald-300 text-[10px] font-medium border border-emerald-900/50"
                            >
                              ✓ {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <a
                      href="/jobs"
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Briefcase className="h-3.5 w-3.5" /> View Opportunity
                    </a>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center border border-dashed border-slate-800 rounded-2xl">
                  <Briefcase className="h-10 w-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No job recommendations tailored yet.</p>
                </div>
              )}
            </div>
          )}

          {/* Content Recommendations Category */}
          {recCategory === 'content' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {contentRecommendations.length > 0 ? (
                contentRecommendations.map((post) => (
                  <div
                    key={post.post_id}
                    className="bg-slate-950/50 border border-slate-900 hover:border-pink-500/30 rounded-2xl p-6 backdrop-blur-md transition duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-pink-600/20 border border-pink-500/30 text-pink-400 flex items-center justify-center font-bold text-xs">
                            {post.author_name?.[0] || 'A'}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">
                              {post.author_name || 'Campus Member'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recent'}
                            </span>
                          </div>
                        </div>
                        <div className="px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-[11px] font-extrabold flex items-center gap-1">
                          <Award className="h-3 w-3 text-pink-400" />
                          {post.relevance_score} Score
                        </div>
                      </div>

                      <p className="text-xs text-slate-200 leading-relaxed line-clamp-3 mb-4">
                        {post.content}
                      </p>

                      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 mb-4 text-[11px] text-pink-200/90 leading-relaxed">
                        <span className="font-semibold text-pink-300">Topic match: </span>
                        {post.reason}
                      </div>

                      {post.matched_topics && post.matched_topics.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {post.matched_topics.map((topic, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-slate-900 text-pink-300 text-[10px] font-medium border border-slate-800"
                            >
                              #{topic}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-900 text-xs text-slate-400">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5 text-pink-500" /> {post.like_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3.5 w-3.5 text-slate-400" /> {post.comment_count}
                        </span>
                      </div>
                      <a href="/feed" className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
                        Read on Feed <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center border border-dashed border-slate-800 rounded-2xl">
                  <MessageSquare className="h-10 w-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No curated feed recommendations available right now.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB CONTENT 2: Performance & Analytics */}
      {mainTab === 'analytics' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Profile Views Chart */}
            <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-400" />
                    Profile Views Trend
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Unique visits to your profile (last 7 days)</p>
                </div>
                <div className="bg-indigo-500/10 text-indigo-400 text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-500/20">
                  Total: {profileViews?.total_views || 0} views
                </div>
              </div>

              <div className="relative w-full h-[220px]">
                {viewsHistory.length > 0 ? (
                  <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#4f46e5" />
                      </linearGradient>
                    </defs>

                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                      const y = padding + ratio * (svgHeight - padding * 2)
                      return (
                        <line
                          key={i}
                          x1={padding}
                          y1={y}
                          x2={svgWidth - padding}
                          y2={y}
                          stroke="#1e293b"
                          strokeDasharray="4 4"
                        />
                      )
                    })}

                    {areaPath && <polygon points={areaPath} fill="url(#areaGradient)" />}
                    {linePath && (
                      <polyline
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={linePath}
                      />
                    )}

                    {points.map((p, idx) => (
                      <g key={idx} className="group/dot cursor-pointer">
                        <circle cx={p.x} cy={p.y} r="5" fill="#818cf8" stroke="#0f172a" strokeWidth="2.5" />
                        <circle cx={p.x} cy={p.y} r="10" fill="#818cf8" opacity="0" className="hover:opacity-20 transition" />
                        <title>{`${p.val} views on ${p.date}`}</title>
                      </g>
                    ))}
                  </svg>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full border border-dashed border-slate-800 rounded-xl">
                    <Eye className="h-8 w-8 text-slate-700 mb-2" />
                    <p className="text-slate-500 text-xs italic">No views registered yet.</p>
                  </div>
                )}
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-semibold px-4 pt-2">
                {viewsHistory.map((item, idx) => {
                  const dateObj = new Date(item.date)
                  const label = dateObj.toLocaleDateString(undefined, { weekday: 'short' })
                  return <span key={idx}>{label}</span>
                })}
              </div>
            </div>

            {/* Engagement Metrics */}
            <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-indigo-400" />
                  Post Engagement Performance
                </h3>
                <p className="text-xs text-slate-400 mt-1">Total interactions with your published posts</p>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 text-center">
                  <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 w-fit mx-auto mb-2">
                    <Eye className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Views</span>
                  <p className="text-xl font-extrabold text-white mt-1">{totalViews}</p>
                </div>
                <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 text-center">
                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 w-fit mx-auto mb-2">
                    <Heart className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Likes</span>
                  <p className="text-xl font-extrabold text-white mt-1">{totalLikes}</p>
                </div>
                <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 text-center">
                  <div className="p-2 bg-pink-500/10 rounded-xl text-pink-400 w-fit mx-auto mb-2">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Comments</span>
                  <p className="text-xl font-extrabold text-white mt-1">{totalComments}</p>
                </div>
              </div>

              <div className="space-y-4 mt-6">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>Engagement Rate (likes + comments vs views)</span>
                    <span className="font-bold text-white">
                      {totalViews > 0 ? ((totalEngagements / totalViews) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{
                        width: `${Math.min(totalViews > 0 ? (totalEngagements / totalViews) * 100 : 0, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trending Posts List */}
          <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-indigo-400" /> Platform Trending Conversations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trendingPosts.length > 0 ? (
                trendingPosts.map((post) => (
                  <div key={post.post_id} className="bg-slate-950 border border-slate-900 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">{post.author_name}</span>
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        Score: {post.score}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2 mb-3">{post.content}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase">
                      <span>{post.views} Views</span>
                      <span>•</span>
                      <span>{post.likes} Likes</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-xs italic">No trending conversations recorded.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB CONTENT 3: Interactive AI Career Tools */}
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
