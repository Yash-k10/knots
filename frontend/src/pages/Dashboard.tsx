import { Users, Briefcase, Calendar, MessageSquare, ArrowUpRight } from 'lucide-react'

export default function Dashboard() {
  const cards = [
    { title: 'Total Members', value: '1,248', desc: '+12% this month', icon: Users, color: 'text-indigo-400 bg-indigo-500/10' },
    { title: 'Jobs Posted', value: '84', desc: '12 active referrals', icon: Briefcase, color: 'text-emerald-400 bg-emerald-500/10' },
    { title: 'Upcoming Events', value: '6', desc: 'Next: Alumni Meetup', icon: Calendar, color: 'text-amber-400 bg-amber-500/10' },
    { title: 'Active Discussions', value: '189', desc: '42 new posts today', icon: MessageSquare, color: 'text-pink-400 bg-pink-500/10' },
  ]

  return (
    <div className="space-y-8">
      {/* Intro Panel */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome to KNOTS Platform</h2>
          <p className="text-indigo-200 max-w-xl">
            Knowledge Networking & Opportunity Tracking. Connect with alumni, get referred to job openings, and discover student clubs.
          </p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 self-start md:self-auto text-white">
          Explore Feed <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.title} className="bg-slate-950 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-slate-400 text-sm font-medium">{card.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <p className="text-xs text-slate-500">{card.desc}</p>
            </div>
          )
        })}
      </div>

      {/* Placeholder Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Platform Overview</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            This workspace acts as the college platform interface. The navigation sidebar lists all available modules designed for students, alumni, and administrators.
          </p>
          <div className="space-y-2 font-mono text-xs text-indigo-300 bg-slate-900 p-4 rounded border border-slate-800">
            <div>[API] Endpoint: /api/v1/analytics/stats</div>
            <div>[AI] Resume Service Sandbox: active</div>
            <div>[Auth] JWT State: authenticated</div>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Development Milestones</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            Scaffolding is fully functional. Team members can start developing domain services following the Clean Architecture guidelines.
          </p>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              Milestone 1: Project Setup completed
            </li>
            <li className="flex items-center gap-2 text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-700"></span>
              Milestone 2: Authentication (Ready for integration)
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
