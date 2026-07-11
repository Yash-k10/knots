
export default function Feed() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-2">Campus Discussions Feed</h2>
        <p className="text-slate-400 text-sm">Read posts and updates from students, alumni, and faculty members.</p>
      </div>

      <div className="space-y-4">
        {[1, 2].map((post) => (
          <div key={post} className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                U{post}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Alumni User {post}</h4>
                <p className="text-xs text-slate-500">2 hours ago</p>
              </div>
            </div>
            <p className="text-slate-300 text-sm">
              Excited to share that we are hiring software engineering interns at our company! Drop a message if you want a referral.
            </p>
            <div className="flex gap-4 border-t border-slate-900 pt-4 text-sm text-slate-400">
              <button className="hover:text-indigo-400">Like</button>
              <button className="hover:text-indigo-400">Comment</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
