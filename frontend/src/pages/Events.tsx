
export default function Events() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-2">Campus Events</h2>
        <p className="text-slate-400 text-sm">Attend upcoming talks, tech meetups, hackathons, and placement workshops.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((ev) => (
          <div key={ev} className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
            <span className="text-xs px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 font-semibold uppercase tracking-wider">
              Seminar
            </span>
            <h4 className="text-lg font-bold text-white mt-2">Alumni Career Guidance Session {ev}</h4>
            <p className="text-slate-400 text-sm">Date: 25th July 2026 at 4:00 PM</p>
            <p className="text-slate-500 text-xs">Location: Seminar Hall 1 or Zoom Link</p>
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 py-2.5 rounded-lg text-xs font-semibold text-white transition-all">
              RSVP
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
