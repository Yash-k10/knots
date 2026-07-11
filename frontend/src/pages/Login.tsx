import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GraduationCap, ArrowRight } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulated token login
    localStorage.setItem('knots_token', 'mock_jwt_token')
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center mb-3">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Welcome back to KNOTS</h2>
          <p className="text-slate-400 text-sm mt-1">College Networking & Opportunity Platform</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@college.edu"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-3 font-semibold text-sm transition-all flex items-center justify-center gap-2 mt-6"
          >
            Sign In <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="text-center text-slate-500 text-xs mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-400 hover:underline">
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  )
}
