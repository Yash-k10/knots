import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import { profileService, ProfileResponse } from '../services/profile'
import ProfileHeader from '../components/profile/ProfileHeader'
import SkillsSection from '../components/profile/SkillsSection'
import EducationSection from '../components/profile/EducationSection'
import ExperienceSection from '../components/profile/ExperienceSection'

export default function Profile() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const fetchProfile = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await profileService.getOwnProfile()
      setProfile(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleUpdate = (updatedProfile: ProfileResponse) => {
    setProfile(updatedProfile)
    showSuccess('Profile updated successfully!')
  }

  const handleError = (message: string) => {
    setError(message)
    // Auto-dismiss errors after 6 seconds
    setTimeout(() => {
      setError((prev) => (prev === message ? null : prev))
    }, 6000)
  }

  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    // Auto-dismiss success alerts after 4 seconds
    setTimeout(() => {
      setSuccessMessage((prev) => (prev === message ? null : prev))
    }, 4000)
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 flex flex-col md:flex-row gap-6 items-center">
          <div className="h-28 w-28 rounded-full bg-slate-900 border border-slate-800" />
          <div className="flex-1 space-y-4 w-full text-center md:text-left">
            <div className="h-8 bg-slate-900 rounded-lg w-1/3 mx-auto md:mx-0" />
            <div className="h-4 bg-slate-900 rounded-lg w-1/4 mx-auto md:mx-0" />
            <div className="h-12 bg-slate-900 rounded-lg w-3/4 mx-auto md:mx-0" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 h-48" />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 h-64" />
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 h-64" />
          </div>
        </div>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto my-8 shadow-2xl">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Failed to Load Profile</h3>
        <p className="text-slate-400 text-sm mb-6">{error}</p>
        <button
          onClick={fetchProfile}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition"
        >
          <RefreshCw className="h-4 w-4" />
          Retry Connection
        </button>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto my-8 shadow-2xl">
        <Loader2 className="h-10 w-10 text-indigo-400 animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Setting up your profile...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-md w-full px-4 sm:px-0">
        {error && (
          <div className="bg-red-950/90 border border-red-800/80 text-red-200 rounded-xl p-4 shadow-2xl flex gap-3 backdrop-blur items-start animate-in fade-in slide-in-from-bottom-4 duration-300">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h5 className="font-semibold text-sm text-white">Error Encountered</h5>
              <p className="text-xs text-red-300 mt-1">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-xs text-red-400 hover:text-red-300 font-semibold uppercase tracking-wider select-none">
              Dismiss
            </button>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-950/90 border border-emerald-800/80 text-emerald-200 rounded-xl p-4 shadow-2xl flex gap-3 backdrop-blur items-start animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h5 className="font-semibold text-sm text-white">Success</h5>
              <p className="text-xs text-emerald-300 mt-1">{successMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Profile Header */}
      <ProfileHeader
        profile={profile}
        onUpdate={handleUpdate}
        onError={handleError}
      />

      {/* Main Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Skills */}
        <div className="lg:col-span-1 space-y-6">
          <SkillsSection
            profile={profile}
            onUpdate={handleUpdate}
            onError={handleError}
          />
        </div>

        {/* Right Side: Education & Experience */}
        <div className="lg:col-span-2 space-y-6">
          <EducationSection
            profile={profile}
            onUpdate={handleUpdate}
            onError={handleError}
          />
          <ExperienceSection
            profile={profile}
            onUpdate={handleUpdate}
            onError={handleError}
          />
        </div>
      </div>
    </div>
  )
}
