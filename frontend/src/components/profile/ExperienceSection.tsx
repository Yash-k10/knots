import React, { useState } from 'react'
import { Plus, Trash2, Edit2, Calendar, Briefcase, MapPin, X, Save, ArrowUp, ArrowDown } from 'lucide-react'
import { profileService, EmploymentHistoryResponse, ProfileResponse } from '../../services/profile'

interface ExperienceSectionProps {
  profile: ProfileResponse
  onUpdate: (updatedProfile: ProfileResponse) => void
  onError: (errorMessage: string) => void
  isOwnProfile?: boolean
}

export default function ExperienceSection({ profile, onUpdate, onError, isOwnProfile = true }: ExperienceSectionProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [companyName, setCompanyName] = useState('')
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isCurrent, setIsCurrent] = useState(false)

  // Bullet Point Editor State
  const [bullets, setSkillsBullets] = useState<string[]>([])
  const [newBulletText, setNewBulletText] = useState('')
  const [editingBulletIndex, setEditingBulletIndex] = useState<number | null>(null)
  const [editingBulletText, setEditingBulletText] = useState('')

  // Inline Validation Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Safe bullet parsing helper
  const parseBullets = (descStr: string | null): string[] => {
    if (!descStr) return []
    try {
      const parsed = JSON.parse(descStr)
      if (Array.isArray(parsed)) {
        return parsed
      }
    } catch (e) {
      // Not JSON: fall back to splitting by newline
      return descStr.split('\n').map((b) => b.trim()).filter(Boolean)
    }
    return [descStr]
  }

  // Reset form
  const resetForm = () => {
    setCompanyName('')
    setTitle('')
    setLocation('')
    setStartDate('')
    setEndDate('')
    setIsCurrent(false)
    setSkillsBullets([])
    setNewBulletText('')
    setEditingBulletIndex(null)
    setEditingBulletText('')
    setFormErrors({})
    setIsAdding(false)
    setEditingId(null)
  }

  const startEdit = (exp: EmploymentHistoryResponse) => {
    setFormErrors({})
    setEditingId(exp.id)
    setCompanyName(exp.company_name)
    setTitle(exp.title)
    setLocation(exp.location || '')
    setStartDate(exp.start_date)
    setIsCurrent(!exp.end_date)
    setEndDate(exp.end_date || '')
    setSkillsBullets(parseBullets(exp.description))
  }

  // Bullet actions
  const handleAddBullet = (e: React.MouseEvent) => {
    e.preventDefault()
    const text = newBulletText.trim()
    if (!text) return

    if (text.length > 200) {
      setFormErrors((prev) => ({ ...prev, bullets: 'Achievement bullet cannot exceed 200 characters.' }))
      return
    }

    setSkillsBullets([...bullets, text])
    setNewBulletText('')
    setFormErrors((prev) => {
      const copy = { ...prev }
      delete copy.bullets
      return copy
    })
  }

  const handleRemoveBullet = (index: number) => {
    setSkillsBullets(bullets.filter((_, i) => i !== index))
  }

  const handleStartEditBullet = (index: number, text: string) => {
    setEditingBulletIndex(index)
    setEditingBulletText(text)
  }

  const handleSaveBulletEdit = (index: number) => {
    const text = editingBulletText.trim()
    if (!text) {
      handleRemoveBullet(index)
      setEditingBulletIndex(null)
      return
    }

    if (text.length > 200) {
      setFormErrors((prev) => ({ ...prev, bullets: 'Achievement bullet cannot exceed 200 characters.' }))
      return
    }

    const updated = [...bullets]
    updated[index] = text
    setSkillsBullets(updated)
    setEditingBulletIndex(null)
    setEditingBulletText('')
    setFormErrors((prev) => {
      const copy = { ...prev }
      delete copy.bullets
      return copy
    })
  }

  const handleMoveBullet = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === bullets.length - 1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    const updated = [...bullets]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    setSkillsBullets(updated)
  }

  // Local form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!companyName.trim()) {
      errors.companyName = 'Company Name is required.'
    }
    if (!title.trim()) {
      errors.title = 'Job Title is required.'
    }
    if (!startDate) {
      errors.startDate = 'Start Date is required.'
    }

    if (!isCurrent && !endDate) {
      errors.endDate = 'End Date is required unless you are currently working here.'
    }

    if (!isCurrent && endDate && startDate && new Date(endDate) < new Date(startDate)) {
      errors.endDate = 'End Date cannot be earlier than Start Date.'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Save description as serialized JSON list of bullets
    const payload = {
      company_name: companyName.trim(),
      title: title.trim(),
      location: location.trim() || null,
      start_date: startDate,
      end_date: isCurrent ? null : endDate,
      description: bullets.length > 0 ? JSON.stringify(bullets) : null,
    }

    setIsSubmitting(true)
    try {
      if (editingId !== null) {
        await profileService.updateExperience(editingId, payload)
      } else {
        await profileService.addExperience(payload)
      }

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
        {!isAdding && editingId === null && isOwnProfile && (
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
        <form onSubmit={handleSave} className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-5 space-y-5 animate-in fade-in duration-200">
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
              {formErrors.companyName && (
                <p className="text-red-500 text-xs mt-1">{formErrors.companyName}</p>
              )}
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
              {formErrors.title && (
                <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>
              )}
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

            <div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2 text-white focus:outline-none transition text-sm"
                    required
                  />
                  {formErrors.startDate && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.startDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={isCurrent}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2 text-white focus:outline-none transition text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                  {formErrors.endDate && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.endDate}</p>
                  )}
                </div>
              </div>

              {/* Currently Working Checkbox */}
              <div className="flex items-center gap-2 mt-3">
                <input
                  type="checkbox"
                  id="current-experience-toggle"
                  checked={isCurrent}
                  onChange={(e) => {
                    setIsCurrent(e.target.checked)
                    if (e.target.checked) setEndDate('')
                  }}
                  className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950 h-4 w-4"
                />
                <label htmlFor="current-experience-toggle" className="text-xs text-slate-400 font-medium">
                  I currently work here
                </label>
              </div>
            </div>
          </div>

          {/* Bullet Points Editor */}
          <div className="space-y-3 border-t border-slate-800 pt-4">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Achievements / Responsibilities (List)
            </label>

            {/* Existing bullets list */}
            <div className="space-y-2">
              {bullets.map((bullet, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex-1 text-xs text-slate-300">
                    {editingBulletIndex === idx ? (
                      <input
                        type="text"
                        value={editingBulletText}
                        onChange={(e) => setEditingBulletText(e.target.value)}
                        onBlur={() => handleSaveBulletEdit(idx)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveBulletEdit(idx)
                        }}
                        autoFocus
                        className="w-full bg-slate-900 border border-slate-800 px-2 py-1 text-xs text-white rounded focus:outline-none focus:border-indigo-500"
                      />
                    ) : (
                      <span className="cursor-pointer" onClick={() => handleStartEditBullet(idx, bullet)}>
                        • {bullet}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveBullet(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-indigo-400 disabled:opacity-30"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveBullet(idx, 'down')}
                      disabled={idx === bullets.length - 1}
                      className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-indigo-400 disabled:opacity-30"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveBullet(idx)}
                      className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-red-400"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Input field to add bullet */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newBulletText}
                onChange={(e) => setNewBulletText(e.target.value)}
                placeholder="Add bullet (e.g. Led redesign of core backend architecture, saving 30% latency)..."
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-700 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddBullet}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition"
              >
                Add Bullet
              </button>
            </div>
            {formErrors.bullets && (
              <p className="text-red-500 text-xs">{formErrors.bullets}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
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
                className="group flex gap-4 items-start bg-slate-900/10 border border-transparent hover:border-slate-800/60 rounded-xl p-3 transition animate-in fade-in duration-300"
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
                      </p>
                    </div>

                    {/* Action buttons */}
                    {!isAdding && editingId === null && isOwnProfile && (
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

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
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
                    <div className="mt-3 bg-slate-900/20 p-3 border border-slate-800/40 rounded-lg max-w-2xl">
                      <ul className="list-disc pl-4 space-y-1">
                        {parseBullets(exp.description).map((bullet, index) => (
                          <li key={index} className="text-slate-300 text-xs leading-relaxed">
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
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
