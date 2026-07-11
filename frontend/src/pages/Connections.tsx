
export default function Connections() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-2">My Network</h2>
        <p className="text-slate-400 text-sm">Build relationships with alumni and campus colleagues.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((num) => (
          <div key={num} className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 mx-auto text-xl">
              C{num}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Network Peer {num}</h4>
              <p className="text-xs text-indigo-400">Class of 2024 (Alumni)</p>
            </div>
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 py-2 rounded-lg text-xs font-semibold text-white transition-all">
              Send Message
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
