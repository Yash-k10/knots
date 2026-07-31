import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Calendar,
  GraduationCap,
  X,
  Save,
} from "lucide-react";
import {
  profileService,
  EducationResponse,
  ProfileResponse,
} from "../../services/profile";

interface EducationSectionProps {
  profile: ProfileResponse;
  onUpdate: (updatedProfile: ProfileResponse) => void;
  onError: (errorMessage: string) => void;
  isOwnProfile?: boolean;
}

export default function EducationSection({
  profile,
  onUpdate,
  onError,
  isOwnProfile = true,
}: EducationSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [institutionName, setInstitutionName] = useState("");
  const [degree, setDegree] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [gpa, setGpa] = useState("");
  const [description, setDescription] = useState("");

  // Inline Form Validation Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Reset form to clear state
  const resetForm = () => {
    setInstitutionName("");
    setDegree("");
    setFieldOfStudy("");
    setStartDate("");
    setEndDate("");
    setGpa("");
    setDescription("");
    setFormErrors({});
    setIsAdding(false);
    setEditingId(null);
  };

  const startEdit = (edu: EducationResponse) => {
    setFormErrors({});
    setEditingId(edu.id);
    setInstitutionName(edu.institution_name);
    setDegree(edu.degree);
    setFieldOfStudy(edu.field_of_study || "");
    setStartDate(edu.start_date);
    setEndDate(edu.end_date || "");
    setGpa(edu.gpa !== null && edu.gpa !== undefined ? edu.gpa.toString() : "");
    setDescription(edu.description || "");
  };

  // Handle local validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!institutionName.trim()) {
      errors.institutionName = "Institution Name is required.";
    }
    if (!degree.trim()) {
      errors.degree = "Degree is required.";
    }
    if (!startDate) {
      errors.startDate = "Start Date is required.";
    }

    if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
      errors.endDate = "End Date cannot be earlier than Start Date.";
    }

    if (gpa.trim() !== "") {
      const gpaVal = parseFloat(gpa);
      if (isNaN(gpaVal) || gpaVal < 0 || gpaVal > 4.0) {
        errors.gpa = "GPA must be a valid number between 0.0 and 4.0.";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload = {
      institution_name: institutionName.trim(),
      degree: degree.trim(),
      field_of_study: fieldOfStudy.trim() || null,
      start_date: startDate,
      end_date: endDate || null,
      gpa: gpa.trim() !== "" ? parseFloat(gpa) : null,
      description: description.trim() || null,
    };

    setIsSubmitting(true);
    try {
      if (editingId !== null) {
        // Update
        await profileService.updateEducation(editingId, payload);
      } else {
        // Create
        await profileService.addEducation(payload);
      }

      // Fetch latest profile to update state
      const updatedProfile = await profileService.getOwnProfile();
      onUpdate(updatedProfile);
      resetForm();
    } catch (err: any) {
      onError(err.message || "Failed to save education entry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (eduId: number) => {
    if (
      !window.confirm("Are you sure you want to delete this education entry?")
    ) {
      return;
    }

    try {
      await profileService.deleteEducation(eduId);
      const updatedProfile = await profileService.getOwnProfile();
      onUpdate(updatedProfile);
    } catch (err: any) {
      onError(err.message || "Failed to delete education entry.");
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-indigo-400" />
          Education
        </h3>
        {!isAdding && editingId === null && isOwnProfile && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:bg-slate-900 transition"
          >
            <Plus className="h-4 w-4" />
            Add Education
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {(isAdding || editingId !== null) && (
        <form
          onSubmit={handleSave}
          className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-5 space-y-4 animate-in fade-in duration-200"
        >
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            {editingId !== null ? "Edit Education Entry" : "Add New Education"}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Institution Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-700 focus:outline-none transition text-sm"
                placeholder="e.g. Stanford University"
                required
              />
              {formErrors.institutionName && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.institutionName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Degree <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-700 focus:outline-none transition text-sm"
                placeholder="e.g. Bachelor of Science"
                required
              />
              {formErrors.degree && (
                <p className="text-red-500 text-xs mt-1">{formErrors.degree}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Field of Study
              </label>
              <input
                type="text"
                value={fieldOfStudy}
                onChange={(e) => setFieldOfStudy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-700 focus:outline-none transition text-sm"
                placeholder="e.g. Computer Science"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                GPA (Optional, Out of 4.0)
              </label>
              <input
                type="text"
                value={gpa}
                onChange={(e) => setGpa(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-700 focus:outline-none transition text-sm"
                placeholder="e.g. 3.85"
              />
              {formErrors.gpa && (
                <p className="text-red-500 text-xs mt-1">{formErrors.gpa}</p>
              )}
            </div>

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
              {formErrors.startDate && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.startDate}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                End Date (or Expected)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-white focus:outline-none transition text-sm"
              />
              {formErrors.endDate && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.endDate}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-700 focus:outline-none transition text-sm h-20 resize-none"
              placeholder="Detail your coursework, achievements, or activities..."
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
              {isSubmitting ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </form>
      )}

      {/* Education List */}
      <div className="space-y-6">
        {profile.education && profile.education.length > 0 ? (
          profile.education
            .sort(
              (a, b) =>
                new Date(b.start_date).getTime() -
                new Date(a.start_date).getTime(),
            )
            .map((edu) => (
              <div
                key={edu.id}
                className="group flex gap-4 items-start bg-slate-900/10 border border-transparent hover:border-slate-800/60 rounded-xl p-3 transition animate-in fade-in duration-300"
              >
                <div className="mt-1 bg-slate-900 border border-slate-800 p-2 rounded-lg text-indigo-400">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-white text-base leading-tight">
                        {edu.institution_name}
                      </h4>
                      <p className="text-slate-300 text-sm">
                        {edu.degree}
                        {edu.field_of_study && ` in ${edu.field_of_study}`}
                      </p>
                    </div>

                    {/* Action buttons */}
                    {!isAdding && editingId === null && isOwnProfile && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                          onClick={() => startEdit(edu)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(edu.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(edu.start_date)}</span>
                      <span>–</span>
                      <span>
                        {edu.end_date ? formatDate(edu.end_date) : "Present"}
                      </span>
                    </div>
                    {edu.gpa !== null && edu.gpa !== undefined && (
                      <>
                        <span className="text-slate-700">•</span>
                        <span className="bg-indigo-950/40 text-indigo-300 px-2 py-0.5 rounded border border-indigo-900/50">
                          GPA: {edu.gpa.toFixed(2)} / 4.00
                        </span>
                      </>
                    )}
                  </div>

                  {edu.description && (
                    <p className="text-slate-400 text-xs mt-2 leading-relaxed bg-slate-900/20 p-2 border border-slate-800/40 rounded-lg max-w-2xl">
                      {edu.description}
                    </p>
                  )}
                </div>
              </div>
            ))
        ) : (
          <div className="text-center py-6">
            <GraduationCap className="h-10 w-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">
              No education entries added yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
