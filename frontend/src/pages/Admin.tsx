
export default function Admin() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-2">Admin Dashboard</h2>
        <p className="text-slate-400 text-sm">System oversight, user management, and compliance audit logs.</p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
        <h3 className="text-base font-semibold text-white mb-4">Security Audit Logs</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Actor ID</th>
                <th className="pb-3">Action</th>
                <th className="pb-3">Target</th>
                <th className="pb-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-900 text-slate-300">
              {[1, 2].map((num) => (
                <tr key={num} className="hover:bg-slate-900/30">
                  <td className="py-3.5">2026-07-10 15:00:1{num}</td>
                  <td>User #{num}</td>
                  <td><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">LOGIN</span></td>
                  <td>Auth API Gateway</td>
                  <td>127.0.0.{num}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
