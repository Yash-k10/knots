import React, { useState } from 'react'
import { Plus, Trash2, Edit2, Calendar, Briefcase, MapPin, X, Save } from 'lucide-react'
import { profileService, EmploymentHistoryResponse, ProfileResponse } from '../../services/profile'

interface ExperienceSectionProps {
  profile: ProfileResponse
  onUpdate: (updatedProfile: ProfileResponse) => void
  onError: (errorMessage: string) => void
}

export default function ExperienceSection({ profile, onUpdate, onError }: ExperienceSectionProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [companyName, setCompanyName] = useState('')
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')

  const resetForm = () => {
    setCompanyName('')
    setTitle('')
    setLocation('')
    setStartDate('')
    setEndDate('')
    setDescription('')
    setIsAdding(false)
    setEditingId(null)
  }

  const startEdit = (exp: EmploymentHistoryResponse) => {
    setEditingId(exp.id)
    setCompanyName(exp.company_name)
    setTitle(exp.title)
    setLocation(exp.location || '')
    setStartDate(exp.start_date)
    setEndDate(exp.end_date || '')
    setDescription(exp.description || '')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!companyName.trim()) {
      onError('Company Name is required.')
      return
    }
    if (!title.trim()) {
      onError('Title is required.')
      return
    }
    if (!startDate) {
      onError('Start Date is required.')
      return
    }
    if (endDate && new Date(endDate) < new Date(startDate)) {
      onError('End Date cannot be earlier than Start Date.')
      return
    }

    const payload = {
      company_name: companyName.trim(),
      title: title.trim(),
      location: location.trim() || null,
      start_date: startDate,
      end_date: endDate || null,
      description: description.trim() || null,
    }

    setIsSubmitting(true)
    try {
      if (editingId !== null) {
        // Update
        await profileService.updateExperience(editingId, payload)
      } else {
        // Create
        await profileService.addExperience(payload)
      }

      // Fetch latest profile to update state
      const updatedProfile = await profileService.getOwnProfile()
      onUpdate(updatedProfile)
      resetForm()
    } catch (err: any) {
      onError(err.message || 'Failed to save experience entry.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (expId: number) => {
    if (!window.confirm('Are you sure you want to delete this experience entry?')) {
      return
    }

    try {
      await profileService.deleteExperience(expId)
      const updatedProfile = await profileService.getOwnProfile()
      onUpdate(updatedProfile)
    } catch (err: any) {
      onError(err.message || 'Failed to delete experience entry.')
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', timeZone: 'UTC' })
  }

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-indigo-400" />
          Experience & Internships
        </h3>
        {!isAdding && editingId === null && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:bg-slate-900 transition"
          >
            <Plus className="h-4 w-4" />
            Add Experience
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {(isAdding || editingId !== null) && (
        <form onSubmit={handleSave} className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            {editingId !== null ? 'Edit Experience Entry' : 'Add New Experience'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-700 focus:outline-none transition text-sm"
                placeholder="e.g. Google India"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-700 focus:outline-none transition text-sm"
                placeholder="e.g. Software Engineering Intern"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-700 focus:outline-none transition text-sm"
                placeholder="e.g. Bangalore, KA"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-white focus:outline-none transition text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-white focus:outline-none transition text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Description / Responsibilities
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-700 focus:outline-none transition text-sm h-20 resize-none"
              placeholder="Detail your contributions, projects, and tech stack used..."
              maxLength={300}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-950 hover:text-white transition text-xs font-medium"
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 font-medium text-xs transition shadow-lg"
              disabled={isSubmitting}
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </form>
      )}

      {/* Experience List */}
      <div className="space-y-6">
        {profile.employment_history && profile.employment_history.length > 0 ? (
          profile.employment_history
            .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
            .map((exp) => (
              <div
                key={exp.id}
                className="group flex gap-4 items-start bg-slate-900/10 border border-transparent hover:border-slate-800/60 rounded-xl p-3 transition"
              >
                <div className="mt-1 bg-slate-900 border border-slate-800 p-2 rounded-lg text-indigo-400">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-white text-base leading-tight">
                        {exp.title}
                      </h4>
                      <p className="text-slate-300 text-sm">
                        {exp.company_name}
                        {exp.location && ` • ${exp.location}`}
                      </p>
                    </div>

                    {/* Action buttons (only show when not editing something else) */}
                    {!isAdding && editingId === null && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                          onClick={() => startEdit(exp)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(exp.start_date)} – {exp.end_date ? formatDate(exp.end_date) : 'Present'}
                    </span>
                    {exp.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {exp.location}
                      </span>
                    )}
                  </div>

                  {exp.description && (
                    <p className="text-slate-400 text-xs mt-2 leading-relaxed bg-slate-900/20 p-2 border border-slate-800/40 rounded-lg max-w-2xl">
                      {exp.description}
                    </p>
                  )}
                </div>
              </div>
            ))
        ) : (
          <div className="text-center py-6">
            <Briefcase className="h-10 w-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No work or internship history added yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
