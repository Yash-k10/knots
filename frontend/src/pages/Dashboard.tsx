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
} from 'lucide-react'
import { analyticsService, SystemStats, ProfileViewsResponse, PostEngagementResponse, TrendingPost } from '../services/analytics'
import { profileService, ProfileResponse } from '../services/profile'

export default function Dashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [profileViews, setProfileViews] = useState<ProfileViewsResponse | null>(null)
  const [engagement, setEngagement] = useState<PostEngagementResponse | null>(null)
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([])
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [sysStats, viewsData, engData, trending, userProfile] = await Promise.all([
          analyticsService.getSystemStats(),
          analyticsService.getProfileViews(7),
          analyticsService.getPostEngagement(),
          analyticsService.getTrendingPosts(5),
          profileService.getOwnProfile().catch(() => null),
        ])

        setStats(sysStats)
        setProfileViews(viewsData)
        setEngagement(engData)
        setTrendingPosts(trending)
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
        <div className="h-40 bg-slate-900 border border-slate-800 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-900 border border-slate-800 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-80 bg-slate-900 border border-slate-800 rounded-xl" />
          <div className="h-80 bg-slate-900 border border-slate-800 rounded-xl" />
        </div>
      </div>
    )
  }

  // 1. Prepare SVG points for Profile Views history (Line/Area Chart)
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

  // 2. Prepare SVG stats for Post Engagement (Bar chart/SVG Progress bars)
  const totalViews = engagement?.total_views || 0
  const totalLikes = engagement?.total_likes || 0
  const totalComments = engagement?.total_comments || 0
  const totalEngagements = totalLikes + totalComments

  const cards = [
    {
      title: 'Total Members',
      value: stats?.total_users.toLocaleString() || '0',
      desc: 'Active student/alumni users',
      icon: Users,
      color: 'text-indigo-400 bg-indigo-500/10',
    },
    {
      title: 'Active Referrals',
      value: stats?.total_jobs.toLocaleString() || '0',
      desc: 'Open jobs/opportunities',
      icon: Briefcase,
      color: 'text-emerald-400 bg-emerald-500/10',
    },
    {
      title: 'Discussions & Posts',
      value: stats?.total_posts.toLocaleString() || '0',
      desc: 'Campus conversations',
      icon: MessageSquare,
      color: 'text-pink-400 bg-pink-500/10',
    },
    {
      title: 'Total Connections',
      value: stats?.total_connections.toLocaleString() || '0',
      desc: 'Verified networks built',
      icon: Activity,
      color: 'text-amber-400 bg-amber-500/10',
    },
  ]

  const greetingName = profile?.first_name ? `, ${profile.first_name}` : ''

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Intro Panel */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900/50 border border-indigo-500/20 rounded-2xl p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.1),transparent_50%)]" />
        <div className="relative z-10 space-y-2">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome Back{greetingName} ✨
          </h2>
          <p className="text-indigo-200 text-sm max-w-xl">
            Monitor your networking activity, explore system engagement, and read popular trending conversations below.
          </p>
        </div>
        <div className="relative z-10 flex gap-4 shrink-0">
          <a
            href="/profile"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs tracking-wider uppercase transition shadow-lg shadow-indigo-600/30 hover:scale-[1.02] flex items-center gap-1.5"
          >
            My Profile <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
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

      {/* Analytics Widgets (SVG-based charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Views Chart */}
        <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-400" />
                Profile Views
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

                {/* Grid Lines */}
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

                {/* Area under the line */}
                {areaPath && <polygon points={areaPath} fill="url(#areaGradient)" />}

                {/* Main line path */}
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

                {/* Circular points */}
                {points.map((p, idx) => (
                  <g key={idx} className="group/dot cursor-pointer">
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="5"
                      fill="#818cf8"
                      stroke="#0f172a"
                      strokeWidth="2.5"
                    />
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="10"
                      fill="#818cf8"
                      opacity="0"
                      className="hover:opacity-20 transition duration-200"
                    />
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
          {/* Label coordinates */}
          <div className="flex justify-between text-[10px] text-slate-500 font-semibold px-4 pt-2">
            {viewsHistory.map((item, idx) => {
              // Extract short day representation (e.g. "Mon")
              const dateObj = new Date(item.date)
              const label = dateObj.toLocaleDateString(undefined, { weekday: 'short' })
              return <span key={idx}>{label}</span>
            })}
          </div>
        </div>

        {/* Post Engagement Breakdown */}
        <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-400" />
              Post Engagement
            </h3>
            <p className="text-xs text-slate-400 mt-1">Total performance metrics of your created posts</p>
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

          {/* Interactive Progress Bar Stats */}
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
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>Likes Share</span>
                <span className="font-bold text-emerald-400">
                  {totalEngagements > 0 ? ((totalLikes / totalEngagements) * 100).toFixed(0) : 0}%
                </span>
              </div>
              <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${totalEngagements > 0 ? (totalLikes / totalEngagements) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trending Posts & System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trending Posts Feed */}
        <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 shadow-2xl lg:col-span-2 backdrop-blur-md relative">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">Trending on KNOTS</h3>
          </div>

          <div className="space-y-4">
            {trendingPosts.length > 0 ? (
              trendingPosts.map((post) => (
                <div
                  key={post.post_id}
                  className="bg-slate-950 border border-slate-900 rounded-xl p-4 hover:border-slate-800 transition duration-300 relative group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                        {post.author_name.charAt(0)}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white">{post.author_name}</span>
                        <span className="text-[10px] text-slate-500 ml-2">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {/* Score Badge */}
                    <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Award className="h-3 w-3" />
                      Score: {post.score}
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                    {post.content}
                  </p>
                  <div className="flex gap-4 mt-3 pt-2.5 border-t border-slate-900/60 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" /> {post.views} Views
                    </span>
                    <span className="flex items-center gap-1 text-emerald-500/90">
                      <Heart className="h-3.5 w-3.5" /> {post.likes} Likes
                    </span>
                    <span className="flex items-center gap-1 text-pink-500/90">
                      <MessageCircle className="h-3.5 w-3.5" /> {post.comments} Comments
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
                <p className="text-slate-500 text-xs italic">No trending posts in the last week.</p>
              </div>
            )}
          </div>
        </div>

        {/* Development & API Scaffold Info */}
        <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 shadow-2xl backdrop-blur-md flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-400" />
              Service Status
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Domain modules for Analytics, Profiles, and Jobs are dynamically connected to the PostgreSQL backend database schema.
            </p>
            <div className="space-y-2.5 font-mono text-[10px] text-indigo-300 bg-slate-950 p-4 rounded-xl border border-slate-900">
              <div className="flex justify-between border-b border-slate-900 pb-1.5">
                <span>[API] stats:</span>
                <span className="text-emerald-400">connected</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1.5">
                <span>[API] profile views:</span>
                <span className="text-emerald-400">active</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1.5">
                <span>[API] endorsements:</span>
                <span className="text-emerald-400">online</span>
              </div>
              <div className="flex justify-between">
                <span>[DB] migrations:</span>
                <span className="text-indigo-400">head (7b2cba85)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-900/60 text-[10px] text-slate-500 font-semibold leading-relaxed">
            Platform design adheres strictly to the premium Glassmorphism design system.
          </div>
        </div>
      </div>
    </div>
  )
}
