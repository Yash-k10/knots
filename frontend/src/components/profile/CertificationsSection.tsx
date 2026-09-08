import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Award, X, Save } from "lucide-react";
import {
  profileService,
  Certification,
  ProfileResponse,
} from "../../services/profile";

interface CertificationsSectionProps {
  profile: ProfileResponse;
  onUpdate: (updatedProfile: ProfileResponse) => void;
  onError: (errorMessage: string) => void;
  isOwnProfile?: boolean;
}

export default function CertificationsSection({
  profile,
  onUpdate,
  onError,
  isOwnProfile = true,
}: CertificationsSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Local State representing the certifications array
  const [certifications, setCertifications] = useState<Certification[]>([]);

  // Single Entry Form State
  const [name, setName] = useState("");
  const [issuer, setIssuer] = useState("");

  // Form index for editing an existing item in the array (-1 for adding new)
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // Validation Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Initialize certifications from profile
  useEffect(() => {
    setCertifications(profile.certifications || []);
    resetForm();
  }, [profile, isEditing]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const resetForm = () => {
    setName("");
    setIssuer("");
    setEditIndex(null);
    setFormErrors({});
  };

  const startEditEntry = (index: number) => {
    setFormErrors({});
    const cert = certifications[index];
    setName(cert.name);
    setIssuer(cert.issuer);
    setEditIndex(index);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!name.trim()) {
      errors.name = "Certification Name is required.";
    }
    if (!issuer.trim()) {
      errors.issuer = "Issuing Organization is required.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add or Update local array entry
  const handleAddOrUpdateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const newEntry: Certification = {
      name: name.trim(),
      issuer: issuer.trim(),
    };

    if (editIndex !== null) {
      // Edit
      const updated = [...certifications];
      updated[editIndex] = newEntry;
      setCertifications(updated);
    } else {
      // Add
      setCertifications([...certifications, newEntry]);
    }
    resetForm();
  };

  // Remove local array entry
  const handleRemoveEntry = (index: number) => {
    setCertifications(certifications.filter((_, idx) => idx !== index));
    if (editIndex === index) {
      resetForm();
    }
  };

  // Save full array to backend
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await profileService.updateProfile({
        certifications: certifications,
      });
      onUpdate(updated);
      setIsEditing(false);
    } catch (err: any) {
      onError(err.message || "Failed to save certifications.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-[#EAE4F7] pb-4">
        <h3 className="text-xl font-black text-[#1E2746] flex items-center gap-2">
          <Award className="h-5 w-5 text-[#4B63D2]" />
          Certifications
        </h3>
        {!isEditing && isOwnProfile && (
          <button
            onClick={handleEditToggle}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#EAE4F7] text-xs font-bold text-[#5851A4] hover:text-[#1E2746] hover:border-[#C8B6E2] hover:bg-[#FAF9FD] transition shadow-sm cursor-pointer"
          >
            <Edit2 className="h-4 w-4 text-[#4B63D2]" />
            Edit Certifications
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Add / Edit Certification Entry Form */}
          <form
            onSubmit={handleAddOrUpdateEntry}
            className="bg-[#FAF9FD] border border-[#EAE4F7] rounded-2xl p-4 space-y-4"
          >
            <h4 className="text-xs font-bold text-[#1E2746] uppercase tracking-wider">
              {editIndex !== null
                ? "Edit Certification"
                : "Add New Certification"}
            </h4>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#1E2746] uppercase tracking-wider mb-2">
                  Certification Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. AWS Certified Solutions Architect"
                  className="w-full bg-white border border-[#D5CBEE] focus:border-[#4B63D2] rounded-xl px-4 py-2 text-xs text-[#1E2746] placeholder-[#9188BE] focus:outline-none transition font-medium"
                  required
                />
                {formErrors.name && (
                  <p className="text-rose-600 text-[10px] mt-1 font-bold">
                    {formErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2746] uppercase tracking-wider mb-2">
                  Issuing Organization <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  placeholder="e.g. Amazon Web Services"
                  className="w-full bg-white border border-[#D5CBEE] focus:border-[#4B63D2] rounded-xl px-4 py-2 text-xs text-[#1E2746] placeholder-[#9188BE] focus:outline-none transition font-medium"
                  required
                />
                {formErrors.issuer && (
                  <p className="text-rose-600 text-[10px] mt-1 font-bold">
                    {formErrors.issuer}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              {editIndex !== null && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 border border-[#EAE4F7] rounded-xl text-[#5851A4] hover:bg-white transition text-xs font-bold"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                className="flex items-center gap-1 px-3 py-1.5 bg-[#4B63D2] hover:bg-[#3E53BE] rounded-xl text-white text-xs font-bold transition shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                {editIndex !== null ? "Update" : "Add to List"}
              </button>
            </div>
          </form>

          {/* Local List Preview */}
          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {certifications.length > 0 ? (
              certifications.map((cert, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-white border border-[#EAE4F7] rounded-xl p-3 text-xs shadow-sm"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-[#1E2746] leading-snug">
                      {cert.name}
                    </p>
                    <p className="text-[#5851A4] text-[11px] font-medium">{cert.issuer}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => startEditEntry(idx)}
                      className="p-1 text-[#9188BE] hover:text-[#1E2746] transition"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveEntry(idx)}
                      className="p-1 text-[#9188BE] hover:text-rose-500 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[#9188BE] text-xs italic text-center py-4">
                No certifications added. Add one above!
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 border-t border-[#EAE4F7] pt-3">
            <button
              onClick={handleEditToggle}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#EAE4F7] text-[#5851A4] hover:bg-[#FAF9FD] hover:text-[#1E2746] transition text-xs font-bold cursor-pointer"
              disabled={isSaving}
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white hover:opacity-90 font-bold text-xs transition shadow-md shadow-[#4B63D2]/25 cursor-pointer"
              disabled={isSaving}
            >
              <Save className="h-4 w-4 text-[#FFD21A]" />
              {isSaving ? "Saving..." : "Save Certifications"}
            </button>
          </div>
        </div>
      ) : (
        /* View Mode */
        <div className="space-y-4">
          {certifications.length > 0 ? (
            certifications.map((cert, idx) => (
              <div
                key={idx}
                className="flex gap-3 items-start bg-[#FAF9FD] border border-[#EAE4F7] hover:border-[#C8B6E2] rounded-2xl p-4 animate-in fade-in duration-200 shadow-sm"
              >
                <div className="mt-0.5 bg-white border border-[#EAE4F7] p-2 rounded-xl text-[#4B63D2] shadow-sm">
                  <Award className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-[#1E2746] text-sm leading-tight">
                    {cert.name}
                  </h4>
                  <p className="text-[#5851A4] text-xs font-semibold">{cert.issuer}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 w-full">
              <Award className="h-8 w-8 text-[#B9B1D9] mx-auto mb-2" />
              <p className="text-[#5851A4] text-xs font-medium">
                No certifications added yet.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
