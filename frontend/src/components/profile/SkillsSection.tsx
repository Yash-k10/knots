import React, { useState } from 'react'
import { Edit2, Plus, X, Save, Settings, Hash } from 'lucide-react'
import { profileService, ProfileResponse } from '../../services/profile'

interface SkillsSectionProps {
  profile: ProfileResponse
  onUpdate: (updatedProfile: ProfileResponse) => void
  onError: (errorMessage: string) => void
}

export default function SkillsSection({ profile, onUpdate, onError }: SkillsSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [skills, setSkills] = useState<string[]>(profile.skills || [])
  const [newSkill, setNewSkill] = useState('')

  const handleEditToggle = () => {
    setSkills(profile.skills || [])
    setNewSkill('')
    setIsEditing(!isEditing)
  }

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newSkill.trim()
    if (!trimmed) return

    // Client-side Validation: Duplicate Check
    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      onError(`Skill "${trimmed}" has already been added.`)
      return
    }

    // Add to local state
    setSkills([...skills, trimmed])
    setNewSkill('')
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updated = await profileService.updateProfile({
        skills: skills,
      })
      onUpdate(updated)
      setIsEditing(false)
    } catch (err: any) {
      onError(err.message || 'Failed to update skills list.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Hash className="h-5 w-5 text-indigo-400" />
          Skills
        </h3>
        {!isEditing && (
          <button
            onClick={handleEditToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:bg-slate-900 transition"
          >
            <Edit2 className="h-4 w-4" />
            Edit Skills
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-5">
          {/* Add Skill Input Form */}
          <form onSubmit={handleAddSkill} className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-700 focus:outline-none transition text-sm"
              placeholder="Add skill (e.g. Python, Figma, React)..."
              maxLength={30}
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium text-sm transition"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </form>

          {/* Current Skills list with removal option */}
          <div className="flex flex-wrap gap-2 min-h-12 p-3 bg-slate-900/30 rounded-xl border border-slate-800/40">
            {skills.length > 0 ? (
              skills.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-red-800/60 rounded-full text-xs font-medium text-slate-300 transition"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="p-0.5 rounded-full hover:bg-slate-800 text-slate-500 hover:text-red-400 transition"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-slate-600 text-xs italic self-center">No skills added yet. Add some above!</span>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleEditToggle}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white transition text-xs font-medium"
              disabled={isSaving}
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 font-medium text-xs transition shadow-lg"
              disabled={isSaving}
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Skills'}
            </button>
          </div>
        </div>
      ) : (
        /* View Mode */
        <div className="flex flex-wrap gap-2">
          {profile.skills && profile.skills.length > 0 ? (
            profile.skills.map((skill) => (
              <span
                key={skill}
                className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-xs font-medium text-slate-300"
              >
                {skill}
              </span>
            ))
          ) : (
            <div className="text-center py-6 w-full">
              <Settings className="h-10 w-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No skills added yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
