
export default function Jobs() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-2">Job Board</h2>
        <p className="text-slate-400 text-sm">Discover internship opportunities and request referrals from alumni mentors.</p>
      </div>

      <div className="space-y-4">
        {[1, 2].map((job) => (
          <div key={job} className="bg-slate-950 border border-slate-800 rounded-xl p-6 flex justify-between items-center">
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-white">Software Engineer Intern (Job #{job})</h4>
              <p className="text-sm text-indigo-400">Google • Mountain View (Remote)</p>
              <p className="text-xs text-slate-500">Posted on: 10th July 2026</p>
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all">
              Request Referral
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
