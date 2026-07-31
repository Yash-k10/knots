import React, { useState, useEffect } from "react";
import {
  Edit2,
  Plus,
  X,
  Save,
  Settings,
  Hash,
  Trash2,
  ThumbsUp,
} from "lucide-react";
import { profileService, ProfileResponse } from "../../services/profile";

interface SkillsSectionProps {
  profile: ProfileResponse;
  onUpdate: (updatedProfile: ProfileResponse) => void;
  onError: (errorMessage: string) => void;
  isOwnProfile: boolean;
  currentUserId?: number;
}

export default function SkillsSection({
  profile,
  onUpdate,
  onError,
  isOwnProfile,
  currentUserId,
}: SkillsSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Helper to parse skills from backend (gracefully handle flat list vs grouped object)
  const parseSkills = (rawSkills: any): Record<string, string[]> => {
    if (!rawSkills) return {};
    if (Array.isArray(rawSkills)) {
      return { General: rawSkills };
    }
    if (typeof rawSkills === "object" && rawSkills !== null) {
      return rawSkills as Record<string, string[]>;
    }
    return {};
  };

  // Local State
  const [skills, setSkills] = useState<Record<string, string[]>>({});
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSkillInputs, setNewSkillInputs] = useState<Record<string, string>>(
    {},
  );
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Sync state with profile whenever profile changes or editing toggled
  useEffect(() => {
    setSkills(parseSkills(profile.skills));
    setNewCategoryName("");
    setNewSkillInputs({});
    setValidationErrors({});
  }, [profile, isEditing]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  // Add Category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const category = newCategoryName.trim();
    setValidationErrors({});

    if (!category) {
      setValidationErrors((prev) => ({
        ...prev,
        category: "Category name cannot be empty.",
      }));
      return;
    }

    if (skills[category]) {
      setValidationErrors((prev) => ({
        ...prev,
        category: `Category "${category}" already exists.`,
      }));
      return;
    }

    setSkills({
      ...skills,
      [category]: [],
    });
    setNewCategoryName("");
  };

  // Remove Category
  const handleRemoveCategory = (categoryToRemove: string) => {
    const updated = { ...skills };
    delete updated[categoryToRemove];
    setSkills(updated);

    // Clean up inputs and errors
    const updatedInputs = { ...newSkillInputs };
    delete updatedInputs[categoryToRemove];
    setNewSkillInputs(updatedInputs);

    const updatedErrors = { ...validationErrors };
    delete updatedErrors[categoryToRemove];
    setValidationErrors(updatedErrors);
  };

  // Add Skill to Category
  const handleAddSkill = (e: React.FormEvent, category: string) => {
    e.preventDefault();
    const rawSkill = newSkillInputs[category] || "";
    const skill = rawSkill.trim();

    // Clear error for this category
    setValidationErrors((prev) => {
      const copy = { ...prev };
      delete copy[category];
      return copy;
    });

    if (!skill) {
      setValidationErrors((prev) => ({
        ...prev,
        [category]: "Skill name cannot be empty.",
      }));
      return;
    }

    if (skill.length > 30) {
      setValidationErrors((prev) => ({
        ...prev,
        [category]: "Skill name cannot exceed 30 characters.",
      }));
      return;
    }

    const currentSkills = skills[category] || [];
    if (currentSkills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
      setValidationErrors((prev) => ({
        ...prev,
        [category]: `Skill "${skill}" already exists in this category.`,
      }));
      return;
    }

    setSkills({
      ...skills,
      [category]: [...currentSkills, skill],
    });

    setNewSkillInputs({
      ...newSkillInputs,
      [category]: "",
    });
  };

  // Remove Skill from Category
  const handleRemoveSkill = (category: string, skillToRemove: string) => {
    const currentSkills = skills[category] || [];
    setSkills({
      ...skills,
      [category]: currentSkills.filter((s) => s !== skillToRemove),
    });
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    setValidationErrors({});

    // Filter out categories that are empty (optional, but keeps database clean)
    const filteredSkills: Record<string, string[]> = {};
    Object.entries(skills).forEach(([cat, list]) => {
      if (list.length > 0 || cat.trim() !== "") {
        filteredSkills[cat] = list;
      }
    });

    try {
      const updated = await profileService.updateProfile({
        skills: filteredSkills,
      });
      onUpdate(updated);
      setIsEditing(false);
    } catch (err: any) {
      onError(err.message || "Failed to update skills list.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEndorsement = async (skillName: string) => {
    const skillEndorsements =
      profile.endorsements?.filter((e) => e.skill_name === skillName) || [];
    const hasEndorsed = skillEndorsements.some(
      (e) => e.endorser_id === currentUserId,
    );

    try {
      let updated;
      if (hasEndorsed) {
        updated = await profileService.unendorseSkill(
          profile.user_id,
          skillName,
        );
      } else {
        updated = await profileService.endorseSkill(profile.user_id, skillName);
      }
      onUpdate(updated);
    } catch (err: any) {
      onError(err.message || "Failed to toggle skill endorsement.");
    }
  };

  const categoryEntries = Object.entries(skills);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Hash className="h-5 w-5 text-indigo-400" />
          Skills
        </h3>
        {!isEditing && isOwnProfile && (
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
        <div className="space-y-6">
          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Create New Category
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-700 focus:outline-none transition text-sm"
                placeholder="e.g. Frontend, Backend, Devops..."
                maxLength={40}
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium text-sm transition"
              >
                <Plus className="h-4 w-4" />
                Add Category
              </button>
            </div>
            {validationErrors.category && (
              <p className="text-red-500 text-xs mt-1">
                {validationErrors.category}
              </p>
            )}
          </form>

          {/* Categories and Skill Editor */}
          <div className="space-y-6 max-h-[400px] overflow-y-auto pr-1">
            {categoryEntries.length > 0 ? (
              categoryEntries.map(([category, items]) => (
                <div
                  key={category}
                  className="bg-slate-900/30 border border-slate-900 rounded-xl p-4 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-sm font-bold text-white uppercase tracking-wider">
                      {category}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(category)}
                      className="text-slate-500 hover:text-red-400 transition"
                      title={`Delete entire category ${category}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Add Skill to this Category Form */}
                  <form
                    onSubmit={(e) => handleAddSkill(e, category)}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={newSkillInputs[category] || ""}
                      onChange={(e) =>
                        setNewSkillInputs({
                          ...newSkillInputs,
                          [category]: e.target.value,
                        })
                      }
                      className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-white placeholder-slate-700 focus:outline-none transition text-xs"
                      placeholder={`Add skill in ${category}...`}
                      maxLength={30}
                    />
                    <button
                      type="submit"
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 text-xs font-semibold transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </button>
                  </form>
                  {validationErrors[category] && (
                    <p className="text-red-500 text-xs mt-1">
                      {validationErrors[category]}
                    </p>
                  )}

                  {/* Tag List */}
                  <div className="flex flex-wrap gap-2">
                    {items.length > 0 ? (
                      items.map((skill) => (
                        <span
                          key={skill}
                          className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-xs font-medium text-slate-300"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(category, skill)}
                            className="p-0.5 rounded-full hover:bg-slate-800 text-slate-500 hover:text-red-400 transition"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-600 text-xs italic">
                        No skills in this category yet.
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl">
                <p className="text-slate-500 text-sm">
                  Create a category above to start adding skills.
                </p>
              </div>
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
              {isSaving ? "Saving..." : "Save Skills"}
            </button>
          </div>
        </div>
      ) : (
        /* View Mode */
        <div className="space-y-6">
          {categoryEntries.length > 0 ? (
            categoryEntries.map(([category, items]) => (
              <div
                key={category}
                className="space-y-2 border-b border-slate-900 pb-4 last:border-none last:pb-0"
              >
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {category}
                </span>
                <div className="flex flex-wrap gap-2">
                  {items.length > 0 ? (
                    items.map((skill) => {
                      const skillEndorsements =
                        profile.endorsements?.filter(
                          (e) => e.skill_name === skill,
                        ) || [];
                      const endorsedCount = skillEndorsements.length;
                      const hasEndorsed = skillEndorsements.some(
                        (e) => e.endorser_id === currentUserId,
                      );

                      return (
                        <div
                          key={skill}
                          className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-xs font-medium text-slate-300 hover:border-slate-700 transition"
                        >
                          <span>{skill}</span>
                          {/* Endorsement badge/button */}
                          {isOwnProfile ? (
                            endorsedCount > 0 && (
                              <span
                                className="flex items-center gap-1 bg-indigo-950/60 border border-indigo-800/40 text-indigo-300 text-[10px] px-2 py-0.5 rounded-full font-semibold"
                                title={`Endorsed by: ${skillEndorsements.map((e) => e.endorser_name).join(", ")}`}
                              >
                                <ThumbsUp className="h-2.5 w-2.5" />
                                {endorsedCount}
                              </span>
                            )
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleEndorsement(skill)}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border transition ${
                                hasEndorsed
                                  ? "bg-emerald-950/40 border-emerald-800/40 text-emerald-400 font-bold shadow-sm"
                                  : "bg-slate-950/40 border-slate-800/40 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                              }`}
                              title={
                                endorsedCount > 0
                                  ? `Endorsed by: ${skillEndorsements.map((e) => e.endorser_name).join(", ")}`
                                  : "Endorse this skill"
                              }
                            >
                              <ThumbsUp className="h-2.5 w-2.5" />
                              {endorsedCount}
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-slate-600 text-xs italic">
                      No skills added.
                    </span>
                  )}
                </div>
              </div>
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
  );
}
