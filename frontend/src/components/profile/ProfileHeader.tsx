import React, { useState } from 'react'
import { Edit2, Save, X, GraduationCap, Building2 } from 'lucide-react'
import { profileService, ProfileResponse } from '../../services/profile'
import ProfilePictureUploader from './ProfilePictureUploader'

interface ProfileHeaderProps {
  profile: ProfileResponse
  onUpdate: (updatedProfile: ProfileResponse) => void
  onError: (errorMessage: string) => void
}

export default function ProfileHeader({ profile, onUpdate, onError }: ProfileHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form State
  const [firstName, setFirstName] = useState(profile.first_name || '')
  const [lastName, setLastName] = useState(profile.last_name || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [department, setDepartment] = useState(profile.department || '')
  const [graduationYear, setGraduationYear] = useState(profile.graduation_year?.toString() || '')

  // Reset form to current profile state
  const handleCancel = () => {
    setFirstName(profile.first_name || '')
    setLastName(profile.last_name || '')
    setBio(profile.bio || '')
    setDepartment(profile.department || '')
    setGraduationYear(profile.graduation_year?.toString() || '')
    setIsEditing(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    // Client-side validation: First and Last names are required
    if (!firstName.trim()) {
      onError('First Name is required.')
      return
    }
    if (!lastName.trim()) {
      onError('Last Name is required.')
      return
    }

    const gradYearNum = graduationYear ? parseInt(graduationYear, 10) : null
    if (graduationYear && isNaN(gradYearNum || 0)) {
      onError('Graduation Year must be a valid number.')
      return
    }

    setIsSaving(true)
    try {
      const updated = await profileService.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        bio: bio.trim() || null,
        department: department.trim() || null,
        graduation_year: gradYearNum,
      })
      onUpdate(updated)
      setIsEditing(false)
    } catch (err: any) {
      onError(err.message || 'Failed to update profile details.')
    } finally {
      setIsSaving(false)
    }
  }

  // Derive initials
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'U'

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <ProfilePictureUploader
              currentImageUrl={profile.profile_picture}
              initials={initials}
              onUploadSuccess={onUpdate}
              onUploadError={onError}
            />
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none transition"
                  placeholder="e.g. Yash"
                  maxLength={50}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none transition"
                  placeholder="e.g. Kumar"
                  maxLength={50}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none transition"
                  placeholder="e.g. Computer Science"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Graduation Year
                </label>
                <input
                  type="number"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none transition"
                  placeholder="e.g. 2027"
                  min={1990}
                  max={2035}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none transition h-24 resize-none"
              placeholder="Tell other students and alumni about yourself..."
              maxLength={300}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white transition font-medium text-sm"
              disabled={isSaving}
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 font-medium text-sm transition shadow-lg shadow-indigo-500/20"
              disabled={isSaving}
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-6 items-center text-center md:text-left">
            <ProfilePictureUploader
              currentImageUrl={profile.profile_picture}
              initials={initials}
              onUploadSuccess={onUpdate}
              onUploadError={onError}
            />
            <div className="space-y-3">
              <h2 className="text-3xl font-extrabold text-white">
                {profile.first_name || profile.last_name
                  ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                  : 'Add Your Name'}
              </h2>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-slate-400 text-sm">
                {profile.department && (
                  <span className="flex items-center gap-1.5 font-medium">
                    <Building2 className="h-4 w-4 text-indigo-400" />
                    {profile.department}
                  </span>
                )}
                {profile.graduation_year && (
                  <span className="flex items-center gap-1.5 font-medium">
                    <GraduationCap className="h-4 w-4 text-indigo-400" />
                    Class of {profile.graduation_year}
                  </span>
                )}
                {!profile.department && !profile.graduation_year && (
                  <span className="text-slate-500 italic">No department or grad year specified</span>
                )}
              </div>

              <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
                {profile.bio || (
                  <span className="text-slate-500 italic">No bio added yet. Tell people about your interests and goals!</span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900 transition text-sm font-medium self-center md:self-start mt-4 md:mt-0"
          >
            <Edit2 className="h-4 w-4" />
            Edit Info
          </button>
        </div>
      )}
    </div>
  )
}
