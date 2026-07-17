import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GraduationCap, ArrowRight, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { apiRequest, ApiError } from '../services/api'

export default function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [roleId, setRoleId] = useState<number>(2) // Default to Student (2)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedEmail = email.trim()

    // Frontend Validations
    if (!trimmedEmail) {
      setError('Email address is required.')
      return
    }
    if (!trimmedEmail.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }
    if (!trimmedEmail.endsWith('@sbjit.edu.in')) {
      setError('Only college email addresses (@sbjit.edu.in) are allowed to register.')
      return
    }
    if (!password) {
      setError('Password is required.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: trimmedEmail,
          password: password,
          role_id: roleId,
        }),
      })

      setSuccess(true)
      // Auto-navigate to login page after 3.5 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3500)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected network error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle className="h-10 w-10 text-emerald-400" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Registration Successful!</h2>
            <p className="text-slate-400 text-sm">
              Your account has been created. A verification link has been generated.
            </p>
            <p className="text-slate-500 text-xs mt-2">
              Redirecting you to the login page in a few seconds...
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-3 font-semibold text-sm transition-all flex items-center justify-center gap-2 mt-4"
          >
            Go to Login <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center mb-3">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Join KNOTS</h2>
          <p className="text-slate-400 text-sm mt-1">Connect with your campus community</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 text-xs mb-4 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              I am registering as a
            </label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(Number(e.target.value))}
              disabled={loading}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 text-sm disabled:opacity-50"
            >
              <option value={2}>Student</option>
              <option value={3}>Alumni</option>
              <option value={5}>Faculty</option>
              <option value={4}>Recruiter</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              College Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@sbjit.edu.in"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm disabled:opacity-50"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm disabled:opacity-50"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm disabled:opacity-50"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg py-3 font-semibold text-sm transition-all flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Creating Account...
              </>
            ) : (
              <>
                Create Account <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-slate-500 text-xs mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
