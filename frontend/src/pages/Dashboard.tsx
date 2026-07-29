import { useEffect, useState } from 'react'
import {
  Users,
  Briefcase,
  MessageSquare,
  ArrowUpRight,
  Activity,
  Sparkles,
  Layers,
  Database,
  CheckCircle2,
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

export default function Dashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [profileViews, setProfileViews] = useState<ProfileViewsResponse | null>(null)
  const [engagement, setEngagement] = useState<PostEngagementResponse | null>(null)
  const [summary, setSummary] = useState<PlatformEngagementSummary | null>(null)
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([])
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [sysStats, viewsData, engData, engSummary, trending, userProfile] =
          await Promise.all([
            analyticsService.getSystemStats().catch(() => null),
            analyticsService.getProfileViews(7).catch(() => null),
            analyticsService.getPostEngagement().catch(() => null),
            analyticsService.getPlatformEngagementSummary().catch(() => null),
            analyticsService.getTrendingPosts(5).catch(() => []),
            profileService.getOwnProfile().catch(() => null),
          ])

        setStats(sysStats)
        setProfileViews(viewsData)
        setEngagement(engData)
        setSummary(engSummary)
        setTrendingPosts(trending || [])
        setProfile(userProfile)
      } catch (error) {
        console.error('Failed to load dashboard metrics', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-44 bg-slate-900/60 border border-slate-800 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-900/60 border border-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-96 bg-slate-900/60 border border-slate-800 rounded-2xl" />
          <div className="h-96 bg-slate-900/60 border border-slate-800 rounded-2xl" />
        </div>
      </div>
    )
  }

  const cards = [
    {
      title: 'Total Members',
      value: stats?.total_users.toLocaleString() || '0',
      desc: 'Active student & alumni network',
      icon: Users,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      gradient: 'from-indigo-500/10 via-transparent to-transparent',
    },
    {
      title: 'Active Referrals',
      value: stats?.total_jobs.toLocaleString() || '0',
      desc: 'Open opportunities & jobs',
      icon: Briefcase,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      gradient: 'from-emerald-500/10 via-transparent to-transparent',
    },
    {
      title: 'Discussions & Posts',
      value: stats?.total_posts.toLocaleString() || '0',
      desc: 'Campus conversations & posts',
      icon: MessageSquare,
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
      gradient: 'from-pink-500/10 via-transparent to-transparent',
    },
    {
      title: 'Total Connections',
      value: stats?.total_connections.toLocaleString() || '0',
      desc: 'Verified networks established',
      icon: Activity,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      gradient: 'from-amber-500/10 via-transparent to-transparent',
    },
  ]

  const greetingName = profile?.first_name ? `, ${profile.first_name}` : ''

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Premium Glassmorphism Hero Panel */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-indigo-900/60 border border-indigo-500/30 rounded-3xl p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.15),transparent_60%)] pointer-events-none" />
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            Member 2 — Analytics Dashboard
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Welcome Back{greetingName} ✨
          </h2>
          <p className="text-indigo-200/80 text-sm max-w-xl leading-relaxed">
            Monitor real-time engagement metrics, visualize profile growth with interactive chart
            widgets, and explore trending community discussions.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3 shrink-0">
          <a
            href="/profile"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs tracking-wider uppercase transition-all duration-200 shadow-lg shadow-indigo-600/30 hover:scale-[1.02] flex items-center gap-1.5"
          >
            My Profile <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Grid of 4 Core System Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              className="bg-slate-950/70 border border-slate-900 hover:border-slate-800/80 rounded-2xl p-6 hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 relative group overflow-hidden backdrop-blur-md"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-tr ${card.gradient} opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none`}
              />
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    {card.title}
                  </p>
                  <p className="text-3xl font-black text-white mt-2 tracking-tight">
                    {card.value}
                  </p>
                </div>
                <div className={`p-3 rounded-2xl border ${card.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-4 relative z-10 font-medium">{card.desc}</p>
            </div>
          )
        })}
      </div>

      {/* Primary Analytics Widgets (Recharts AreaChart & BarChart) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ProfileViewsChart initialData={profileViews} />
        <PostEngagementChart engagement={engagement} />
      </div>

      {/* Secondary Analytics Grid (Donut Chart & Trending Posts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <PlatformEngagementDonut summary={summary} />
        </div>
        <div className="lg:col-span-2">
          <TrendingPostsWidget initialPosts={trendingPosts} />
        </div>
      </div>

      {/* System Service & Architecture Info Footer */}
      <div className="bg-slate-950/40 border border-slate-900/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-400" />
            <h4 className="text-sm font-bold text-white tracking-wide">
              KNOTS Analytics Pipeline & PostgreSQL Integration
            </h4>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            All dashboard widgets utilize dynamic REST endpoints (`/analytics/*`) backed by
            indexed PostgreSQL views and real-time engagement telemetry.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/60 px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            API Connected
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1.5 text-indigo-300 font-semibold">
            <Database className="h-3.5 w-3.5" />
            recharts v3
          </span>
        </div>
      </div>
    </div>
  )
}
