
export default function Messaging() {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex h-[600px]">
      {/* Sidebar List */}
      <div className="w-80 border-r border-slate-800 bg-slate-950 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-900">
          {[1, 2].map((chat) => (
            <div key={chat} className="p-4 flex gap-3 hover:bg-slate-900 cursor-pointer transition-all">
              <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                U{chat}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className="text-xs font-semibold text-white truncate">Mentor Name {chat}</h4>
                  <span className="text-[10px] text-slate-500">10:45 AM</span>
                </div>
                <p className="text-xs text-slate-400 truncate">Sure! Send me your resume and I'll referral you.</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="flex-1 flex flex-col bg-slate-950">
        <div className="h-14 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-950">
          <h4 className="text-sm font-semibold text-white">Mentor Name 1</h4>
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
        </div>

        <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-slate-900/50">
          <div className="flex gap-3 justify-end">
            <div className="bg-indigo-600 rounded-2xl rounded-tr-none p-3 max-w-sm">
              <p className="text-xs text-white">Hello, could you please look at my resume for the Software Engineer role?</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
              M1
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none p-3 max-w-sm">
              <p className="text-xs text-slate-300">Sure! Send me your resume and I'll referral you.</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 flex gap-3 items-center">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all">
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
