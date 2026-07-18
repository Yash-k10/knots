import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Award, X, Save } from 'lucide-react'
import { profileService, Certification, ProfileResponse } from '../../services/profile'

interface CertificationsSectionProps {
  profile: ProfileResponse
  onUpdate: (updatedProfile: ProfileResponse) => void
  onError: (errorMessage: string) => void
}

export default function CertificationsSection({ profile, onUpdate, onError }: CertificationsSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Local State representing the certifications array
  const [certifications, setCertifications] = useState<Certification[]>([])
  
  // Single Entry Form State
  const [name, setName] = useState('')
  const [issuer, setIssuer] = useState('')
  
  // Form index for editing an existing item in the array (-1 for adding new)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  
  // Validation Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Initialize certifications from profile
  useEffect(() => {
    setCertifications(profile.certifications || [])
    resetForm()
  }, [profile, isEditing])

  const handleEditToggle = () => {
    setIsEditing(!isEditing)
  }

  const resetForm = () => {
    setName('')
    setIssuer('')
    setEditIndex(null)
    setFormErrors({})
  }

  const startEditEntry = (index: number) => {
    setFormErrors({})
    const cert = certifications[index]
    setName(cert.name)
    setIssuer(cert.issuer)
    setEditIndex(index)
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!name.trim()) {
      errors.name = 'Certification Name is required.'
    }
    if (!issuer.trim()) {
      errors.issuer = 'Issuing Organization is required.'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Add or Update local array entry
  const handleAddOrUpdateEntry = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const newEntry: Certification = {
      name: name.trim(),
      issuer: issuer.trim(),
    }

    if (editIndex !== null) {
      // Edit
      const updated = [...certifications]
      updated[editIndex] = newEntry
      setCertifications(updated)
    } else {
      // Add
      setCertifications([...certifications, newEntry])
    }
    resetForm()
  }

  // Remove local array entry
  const handleRemoveEntry = (index: number) => {
    setCertifications(certifications.filter((_, idx) => idx !== index))
    if (editIndex === index) {
      resetForm()
    }
  }

  // Save full array to backend
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updated = await profileService.updateProfile({
        certifications: certifications,
      })
      onUpdate(updated)
      setIsEditing(false)
    } catch (err: any) {
      onError(err.message || 'Failed to save certifications.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Award className="h-5 w-5 text-indigo-400" />
          Certifications
        </h3>
        {!isEditing && (
          <button
            onClick={handleEditToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:bg-slate-900 transition"
          >
            <Edit2 className="h-4 w-4" />
            Edit Certifications
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Add / Edit Certification Entry Form */}
          <form onSubmit={handleAddOrUpdateEntry} className="bg-slate-900/40 border border-slate-900 rounded-xl p-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {editIndex !== null ? 'Edit Certification' : 'Add New Certification'}
            </h4>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Certification Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. AWS Certified Solutions Architect"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-700 focus:outline-none transition animate-none"
                  required
                />
                {formErrors.name && (
                  <p className="text-red-500 text-[10px] mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Issuing Organization <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  placeholder="e.g. Amazon Web Services"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-700 focus:outline-none transition"
                  required
                />
                {formErrors.issuer && (
                  <p className="text-red-500 text-[10px] mt-1">{formErrors.issuer}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
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
                {editIndex !== null ? 'Update' : 'Add to List'}
              </button>
            </div>
          </form>

          {/* Local List Preview */}
          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {certifications.length > 0 ? (
              certifications.map((cert, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-900/20 border border-slate-800 rounded-xl p-3 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-white leading-snug">{cert.name}</p>
                    <p className="text-slate-400 text-[11px]">{cert.issuer}</p>
                  </div>
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
                      className="p-1 text-slate-400 hover:text-red-450 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-650 text-xs italic text-center py-4">No certifications added. Add one above!</p>
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
              {isSaving ? 'Saving...' : 'Save Certifications'}
            </button>
          </div>
        </div>
      ) : (
        /* View Mode */
        <div className="space-y-4">
          {certifications.length > 0 ? (
            certifications.map((cert, idx) => (
              <div key={idx} className="flex gap-3 items-start bg-slate-900/10 border border-slate-900/40 rounded-xl p-3 animate-in fade-in duration-200">
                <div className="mt-0.5 bg-slate-900 border border-slate-800 p-1.5 rounded-lg text-indigo-400">
                  <Award className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-semibold text-white text-sm leading-tight">{cert.name}</h4>
                  <p className="text-slate-400 text-xs">{cert.issuer}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 w-full">
              <Award className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-xs">No certifications added yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
