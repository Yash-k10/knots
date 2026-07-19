import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Code, X, Save, ArrowUp, ArrowDown, FolderGit } from 'lucide-react'
import { profileService, Project, ProfileResponse } from '../../services/profile'

interface ProjectsSectionProps {
  profile: ProfileResponse
  onUpdate: (updatedProfile: ProfileResponse) => void
  onError: (errorMessage: string) => void
}

export default function ProjectsSection({ profile, onUpdate, onError }: ProjectsSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Local State representing the projects array
  const [projects, setProjects] = useState<Project[]>([])

  // Single Entry Form State
  const [title, setTitle] = useState('')
  const [highlights, setHighlights] = useState<string[]>([])
  const [techStack, setTechStack] = useState<string[]>([])

  // Temp inputs for list items
  const [newHighlightText, setNewHighlightText] = useState('')
  const [editingHighlightIndex, setEditingHighlightIndex] = useState<number | null>(null)
  const [editingHighlightText, setEditingHighlightText] = useState('')

  const [newTechTagText, setNewTechTagText] = useState('')

  // Form index for editing an existing item in the array
  const [editIndex, setEditIndex] = useState<number | null>(null)

  // Validation Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Initialize from profile
  useEffect(() => {
    setProjects(profile.projects || [])
    resetForm()
  }, [profile, isEditing])

  const handleEditToggle = () => {
    setIsEditing(!isEditing)
  }

  const resetForm = () => {
    setTitle('')
    setHighlights([])
    setTechStack([])
    setNewHighlightText('')
    setEditingHighlightIndex(null)
    setEditingHighlightText('')
    setNewTechTagText('')
    setEditIndex(null)
    setFormErrors({})
  }

  const startEditEntry = (index: number) => {
    setFormErrors({})
    const proj = projects[index]
    setTitle(proj.title)
    setHighlights(proj.highlights || [])
    setTechStack(proj.tech_stack || [])
    setEditIndex(index)
  }

  // Highlight bullet actions
  const handleAddHighlight = (e: React.MouseEvent) => {
    e.preventDefault()
    const text = newHighlightText.trim()
    if (!text) return

    if (text.length > 200) {
      setFormErrors((prev) => ({ ...prev, highlights: 'Project highlight cannot exceed 200 characters.' }))
      return
    }

    setHighlights([...highlights, text])
    setNewHighlightText('')
    setFormErrors((prev) => {
      const copy = { ...prev }
      delete copy.highlights
      return copy
    })
  }

  const handleRemoveHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index))
  }

  const handleStartEditHighlight = (index: number, text: string) => {
    setEditingHighlightIndex(index)
    setEditingHighlightText(text)
  }

  const handleSaveHighlightEdit = (index: number) => {
    const text = editingHighlightText.trim()
    if (!text) {
      handleRemoveHighlight(index)
      setEditingHighlightIndex(null)
      return
    }

    if (text.length > 200) {
      setFormErrors((prev) => ({ ...prev, highlights: 'Project highlight cannot exceed 200 characters.' }))
      return
    }

    const updated = [...highlights]
    updated[index] = text
    setHighlights(updated)
    setEditingHighlightIndex(null)
    setEditingHighlightText('')
    setFormErrors((prev) => {
      const copy = { ...prev }
      delete copy.highlights
      return copy
    })
  }

  const handleMoveHighlight = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === highlights.length - 1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    const updated = [...highlights]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    setHighlights(updated)
  }

  // Tech tags actions
  const handleAddTechTag = (e: React.FormEvent) => {
    e.preventDefault()
    const tag = newTechTagText.trim()
    if (!tag) return

    if (techStack.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setFormErrors((prev) => ({ ...prev, tech: `Tech tag "${tag}" already added.` }))
      return
    }

    setTechStack([...techStack, tag])
    setNewTechTagText('')
    setFormErrors((prev) => {
      const copy = { ...prev }
      delete copy.tech
      return copy
    })
  }

  const handleRemoveTechTag = (tagToRemove: string) => {
    setTechStack(techStack.filter((t) => t !== tagToRemove))
  }

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!title.trim()) {
      errors.title = 'Project Title is required.'
    }
    if (highlights.length === 0) {
      errors.highlights = 'At least one project highlight bullet is required.'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Add/Update in local array
  const handleAddOrUpdateEntry = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const newEntry: Project = {
      title: title.trim(),
      highlights: highlights,
      tech_stack: techStack.length > 0 ? techStack : undefined,
    }

    if (editIndex !== null) {
      const updated = [...projects]
      updated[editIndex] = newEntry
      setProjects(updated)
    } else {
      setProjects([...projects, newEntry])
    }
    resetForm()
  }

  // Remove entry from local list
  const handleRemoveEntry = (index: number) => {
    setProjects(projects.filter((_, idx) => idx !== index))
    if (editIndex === index) {
      resetForm()
    }
  }

  // Save array to backend
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updated = await profileService.updateProfile({
        projects: projects,
      })
      onUpdate(updated)
      setIsEditing(false)
    } catch (err: any) {
      onError(err.message || 'Failed to save projects.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <FolderGit className="h-5 w-5 text-indigo-400" />
          Projects
        </h3>
        {!isEditing && (
          <button
            onClick={handleEditToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:bg-slate-900 transition"
          >
            <Edit2 className="h-4 w-4" />
            Edit Projects
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Add / Edit Project Form */}
          <form onSubmit={handleAddOrUpdateEntry} className="bg-slate-900/40 border border-slate-900 rounded-xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              {editIndex !== null ? 'Edit Project details' : 'Add New Project'}
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Project Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Automated Attendance Tracker"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-700 focus:outline-none transition"
                required
              />
              {formErrors.title && (
                <p className="text-red-500 text-[10px] mt-1">{formErrors.title}</p>
              )}
            </div>

            {/* Bullet points editor for project highlights */}
            <div className="space-y-2 border-t border-slate-900 pt-3">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Project Highlights / Accomplishments <span className="text-red-500">*</span>
              </label>
              
              <div className="space-y-2">
                {highlights.map((highlight, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex-1 text-xs text-slate-300">
                      {editingHighlightIndex === idx ? (
                        <input
                          type="text"
                          value={editingHighlightText}
                          onChange={(e) => setEditingHighlightText(e.target.value)}
                          onBlur={() => handleSaveHighlightEdit(idx)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveHighlightEdit(idx)
                          }}
                          autoFocus
                          className="w-full bg-slate-900 border border-slate-800 px-2 py-1 text-xs text-white rounded focus:outline-none focus:border-indigo-500"
                        />
                      ) : (
                        <span className="cursor-pointer" onClick={() => handleStartEditHighlight(idx, highlight)}>
                          • {highlight}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveHighlight(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-indigo-400 disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveHighlight(idx, 'down')}
                        disabled={idx === highlights.length - 1}
                        className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-indigo-400 disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveHighlight(idx)}
                        className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-red-400"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add highlight input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newHighlightText}
                  onChange={(e) => setNewHighlightText(e.target.value)}
                  placeholder="Add bullet highlight (e.g. Achieved 95% model accuracy)..."
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-700 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddHighlight}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition"
                >
                  Add Bullet
                </button>
              </div>
              {formErrors.highlights && (
                <p className="text-red-500 text-[10px]">{formErrors.highlights}</p>
              )}
            </div>

            {/* Tech stack tag editor */}
            <div className="space-y-2 border-t border-slate-900 pt-3">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Tech Stack tags (Optional)
              </label>

              {/* Added tech tags */}
              <div className="flex flex-wrap gap-2 mb-2">
                {techStack.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-full text-[10px] font-bold text-indigo-300"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTechTag(tag)}
                      className="p-0.5 rounded-full hover:bg-slate-800 text-slate-500 hover:text-red-400 transition"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTechTagText}
                  onChange={(e) => setNewTechTagText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTechTag(e)
                    }
                  }}
                  placeholder="Add tech (e.g. React, FastApi, PostgreSQL) and press Enter..."
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-700 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddTechTag}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition"
                >
                  Add Tag
                </button>
              </div>
              {formErrors.tech && (
                <p className="text-red-500 text-[10px]">{formErrors.tech}</p>
              )}
            </div>

            <div className="flex gap-2 justify-end border-t border-slate-900 pt-3">
              {editIndex !== null && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 border border-slate-800 rounded-xl text-slate-400 hover:bg-slate-900 transition text-xs font-medium"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 text-xs font-semibold transition"
              >
                <Plus className="h-3.5 w-3.5" />
                {editIndex !== null ? 'Update Project' : 'Add to Projects List'}
              </button>
            </div>
          </form>

          {/* Local List Preview */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {projects.length > 0 ? (
              projects.map((proj, idx) => (
                <div key={idx} className="bg-slate-900/20 border border-slate-800 rounded-xl p-4 text-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <h5 className="font-bold text-white text-sm leading-snug">{proj.title}</h5>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => startEditEntry(idx)}
                        className="p-1 text-slate-400 hover:text-white transition"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveEntry(idx)}
                        className="p-1 text-slate-400 hover:text-red-400 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
                    {proj.highlights.map((bullet, bIdx) => (
                      <li key={bIdx}>{bullet}</li>
                    ))}
                  </ul>

                  {proj.tech_stack && proj.tech_stack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {proj.tech_stack.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-slate-950 border border-slate-900 rounded text-[9px] font-bold text-indigo-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-slate-650 text-xs italic text-center py-6">No projects added yet. Create one above!</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 border-t border-slate-800 pt-3">
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
              {isSaving ? 'Saving...' : 'Save Projects'}
            </button>
          </div>
        </div>
      ) : (
        /* View Mode */
        <div className="space-y-6">
          {projects.length > 0 ? (
            projects.map((proj, idx) => (
              <div key={idx} className="group flex gap-4 items-start bg-slate-900/10 border border-transparent hover:border-slate-800/60 rounded-xl p-3 transition animate-in fade-in duration-200">
                <div className="mt-1 bg-slate-900 border border-slate-800 p-2 rounded-lg text-indigo-400">
                  <Code className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold text-white text-base leading-tight">{proj.title}</h4>

                  <ul className="list-disc pl-4 space-y-1">
                    {proj.highlights.map((bullet, bIdx) => (
                      <li key={bIdx} className="text-slate-300 text-xs leading-relaxed">
                        {bullet}
                      </li>
                    ))}
                  </ul>

                  {proj.tech_stack && proj.tech_stack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {proj.tech_stack.map((tag) => (
                        <span key={tag} className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-indigo-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 w-full">
              <FolderGit className="h-10 w-10 text-slate-650 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No projects added yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
