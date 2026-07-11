
export default function Settings() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-2">User Settings</h2>
        <p className="text-slate-400 text-sm">Configure system preferences, password security, and alerts.</p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-slate-900">
          <div>
            <h4 className="text-sm font-semibold text-white font-medium">Email Alerts</h4>
            <p className="text-xs text-slate-500">Receive notifications when matching jobs are found</p>
          </div>
          <input type="checkbox" defaultChecked className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded bg-slate-900 border-slate-800" />
        </div>

        <div className="flex justify-between items-center pb-4 border-b border-slate-900">
          <div>
            <h4 className="text-sm font-semibold text-white font-medium">Real-time Chat Status</h4>
            <p className="text-xs text-slate-500">Show online status badge to peers</p>
          </div>
          <input type="checkbox" defaultChecked className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded bg-slate-900 border-slate-800" />
        </div>

        <button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 font-semibold text-xs transition-all">
          Save Settings
        </button>
      </div>
    </div>
  )
}
