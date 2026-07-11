import { Bell, Briefcase, Users } from 'lucide-react'

export default function Notifications() {
  const list = [
    { title: 'New Job Matching Your Profile', desc: 'Google posted Software Engineer Intern matching Python & React skills.', icon: Briefcase, color: 'text-emerald-400 bg-emerald-500/10' },
    { title: 'Connection Request Accepted', desc: 'Alumni Jane Smith accepted your networking connection request.', icon: Users, color: 'text-indigo-400 bg-indigo-500/10' },
    { title: 'Upcoming RSVP Event Alert', desc: 'Guidance talk is starting in 30 minutes. Join the Zoom link.', icon: Bell, color: 'text-amber-400 bg-amber-500/10' },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-2">Notifications Center</h2>
        <p className="text-slate-400 text-sm">Keep track of your job referral statuses, networking actions, and alerts.</p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-900 overflow-hidden">
        {list.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.title} className="p-6 flex gap-4 hover:bg-slate-900/50 transition-all">
              <div className={`p-3 rounded-lg self-start ${item.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                <p className="text-xs text-slate-400">{item.desc}</p>
                <p className="text-[10px] text-slate-500">10 mins ago</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
