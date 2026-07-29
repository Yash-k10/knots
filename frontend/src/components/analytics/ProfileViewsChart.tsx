import { useState, useEffect } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { TrendingUp, Eye, Calendar, ArrowUpRight } from 'lucide-react'
import { analyticsService, ProfileViewsResponse } from '../../services/analytics'

interface ProfileViewsChartProps {
  initialData?: ProfileViewsResponse | null
}

export default function ProfileViewsChart({ initialData }: ProfileViewsChartProps) {
  const [data, setData] = useState<ProfileViewsResponse | null>(initialData || null)
  const [days, setDays] = useState<number>(7)
  const [isLoading, setIsLoading] = useState<boolean>(!initialData)

  useEffect(() => {
    // If we already have initialData for 7 days on first mount, use it
    if (initialData && days === 7) {
      setData(initialData)
      setIsLoading(false)
      return
    }

    let isMounted = true
    setIsLoading(true)

    analyticsService
      .getProfileViews(days)
      .then((res) => {
        if (isMounted) {
          setData(res)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        console.error('Failed to load profile views for days:', days, err)
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [days, initialData])

  const history = data?.history || []
  const totalViews = data?.total_views || 0
  const dailyAverage = history.length > 0 ? Math.round((totalViews / history.length) * 10) / 10 : 0

  // Peak day calculation
  const peakItem = history.reduce(
    (max, item) => (item.views > max.views ? item : max),
    { date: '', views: 0 }
  )

  const formattedData = history.map((item) => {
    const dateObj = new Date(item.date)
    const label =
      days <= 7
        ? dateObj.toLocaleDateString(undefined, { weekday: 'short' })
        : dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    return {
      ...item,
      label,
      fullDate: dateObj.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    }
  })

  return (
    <div className="bg-slate-950/60 border border-slate-900 hover:border-slate-800/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md transition duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] via-transparent to-transparent pointer-events-none" />

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Profile Views</h3>
              <p className="text-xs text-slate-400">
                Unique visits to your profile over time
              </p>
            </div>
          </div>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200 ${
                days === d
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {d}D
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary Badges */}
      <div className="grid grid-cols-3 gap-3 mb-6 relative z-10">
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Total Views
            </span>
            <p className="text-lg font-extrabold text-white mt-0.5">{totalViews}</p>
          </div>
          <Eye className="h-4 w-4 text-indigo-400 opacity-80" />
        </div>
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Daily Avg
            </span>
            <p className="text-lg font-extrabold text-white mt-0.5">{dailyAverage}</p>
          </div>
          <Calendar className="h-4 w-4 text-emerald-400 opacity-80" />
        </div>
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Peak Day
            </span>
            <p className="text-lg font-extrabold text-white mt-0.5">
              {peakItem.views > 0 ? peakItem.views : '-'}
            </p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-amber-400 opacity-80" />
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="h-[250px] w-full relative z-10">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
          </div>
        ) : formattedData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="profileViewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="profileViewsStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = payload[0].payload
                    return (
                      <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl px-4 py-2.5 shadow-2xl backdrop-blur-md">
                        <p className="text-xs font-semibold text-slate-300">{dataPoint.fullDate}</p>
                        <p className="text-base font-extrabold text-white mt-1 flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 inline-block" />
                          {dataPoint.views} {dataPoint.views === 1 ? 'view' : 'views'}
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                type="monotone"
                dataKey="views"
                stroke="url(#profileViewsStroke)"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#profileViewsGradient)"
                activeDot={{ r: 6, fill: '#818cf8', stroke: '#0f172a', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full border border-dashed border-slate-800 rounded-xl">
            <Eye className="h-8 w-8 text-slate-700 mb-2" />
            <p className="text-slate-500 text-xs italic">No profile views recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
