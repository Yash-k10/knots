
export default function Profile() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 flex flex-col md:flex-row gap-6 items-center">
        <div className="h-24 w-24 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
          JD
        </div>
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-2xl font-bold text-white">John Doe</h2>
          <p className="text-indigo-400 text-sm font-medium">Computer Science & Engineering Student (2027)</p>
          <p className="text-slate-500 text-xs">Bio: Full-stack builder passionate about system design and career platforms.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {['React', 'TypeScript', 'Tailwind CSS', 'FastAPI', 'PostgreSQL', 'Docker'].map((skill) => (
              <span key={skill} className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs text-slate-300 font-medium">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Employment History</h3>
          <p className="text-slate-500 text-sm">No professional work history added yet.</p>
        </div>
      </div>
    </div>
  )
}
