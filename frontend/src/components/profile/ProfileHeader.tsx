import React, { useState, useEffect } from "react";
import {
  Building2,
  GraduationCap,
  Users,
  Edit2,
  Save,
  X,
  Sparkles,
  Loader2,
} from "lucide-react";
import { ProfileResponse } from "../../services/profile";
import { profileService } from "../../services/profile";
import ProfilePictureUploader from "./ProfilePictureUploader";

interface ProfileHeaderProps {
  profile: ProfileResponse;
  onUpdate: (updatedProfile: ProfileResponse) => void;
  onError: (errorMessage: string) => void;
  isOwnProfile: boolean;
}

export const DEPARTMENTS = [
  "First Year",
  "CSE",
  "CSE(AIML)",
  "CSE(AIDS)",
  "ETC",
  "EE",
  "ME",
  "BCA",
  "MCA",
  "MBA",
];

export default function ProfileHeader({
  profile,
  onUpdate,
  onError,
  isOwnProfile,
}: ProfileHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadingResume, setIsDownloadingResume] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState(profile.first_name || "");
  const [lastName, setLastName] = useState(profile.last_name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [department, setDepartment] = useState(profile.department || "");
  const [graduationYear, setGraduationYear] = useState<number | string>(
    profile.graduation_year || "",
  );
  const [email, setEmail] = useState(profile.email || "");
  const [phoneNumber, setPhoneNumber] = useState(profile.phone_number || "");
  const [githubUrl, setGithubUrl] = useState(profile.github_url || "");
  const [leetcodeUrl, setLeetcodeUrl] = useState(profile.leetcode_url || "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url || "");
  const [tenthPercentage, setTenthPercentage] = useState(
    profile.tenth_percentage?.toString() || ""
  );
  const [twelfthDiplomaPercentage, setTwelfthDiplomaPercentage] = useState(
    profile.twelfth_diploma_percentage?.toString() || ""
  );

  useEffect(() => {
    setFirstName(profile.first_name || "");
    setLastName(profile.last_name || "");
    setBio(profile.bio || "");
    setDepartment(profile.department || "");
    setGraduationYear(profile.graduation_year || "");
    setEmail(profile.email || "");
    setPhoneNumber(profile.phone_number || "");
    setGithubUrl(profile.github_url || "");
    setLeetcodeUrl(profile.leetcode_url || "");
    setLinkedinUrl(profile.linkedin_url || "");
    setTenthPercentage(profile.tenth_percentage?.toString() || "");
    setTwelfthDiplomaPercentage(profile.twelfth_diploma_percentage?.toString() || "");
  }, [profile]);

  const handleGenerateResume = async () => {
    setIsDownloadingResume(true);
    try {
      await profileService.downloadResume(isOwnProfile ? undefined : profile.user_id);
    } catch (err: any) {
      onError(err.message || "Failed to generate resume. Please try again.");
    } finally {
      setIsDownloadingResume(false);
    }
  };

  const handleCancel = () => {
    setFirstName(profile.first_name || "");
    setLastName(profile.last_name || "");
    setBio(profile.bio || "");
    setDepartment(profile.department || "");
    setGraduationYear(profile.graduation_year || "");
    setEmail(profile.email || "");
    setPhoneNumber(profile.phone_number || "");
    setGithubUrl(profile.github_url || "");
    setLeetcodeUrl(profile.leetcode_url || "");
    setLinkedinUrl(profile.linkedin_url || "");
    setTenthPercentage(profile.tenth_percentage?.toString() || "");
    setTwelfthDiplomaPercentage(profile.twelfth_diploma_percentage?.toString() || "");
    setIsEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      onError("First Name is required.");
      return;
    }
    if (!lastName.trim()) {
      onError("Last Name is required.");
      return;
    }

    const gradYearNum = graduationYear ? parseInt(graduationYear.toString(), 10) : null;
    if (graduationYear && isNaN(gradYearNum || 0)) {
      onError("Graduation Year must be a valid number.");
      return;
    }

    const tenthPctNum = tenthPercentage ? parseFloat(tenthPercentage) : null;
    const twelfthPctNum = twelfthDiplomaPercentage ? parseFloat(twelfthDiplomaPercentage) : null;

    setIsSaving(true);
    try {
      const updated = await profileService.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        bio: bio.trim() || null,
        department: department.trim() || null,
        graduation_year: gradYearNum,
        email: email.trim() || null,
        phone_number: phoneNumber.trim() || null,
        github_url: githubUrl.trim() || null,
        leetcode_url: leetcodeUrl.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        tenth_percentage: tenthPctNum,
        twelfth_diploma_percentage: twelfthPctNum,
      });
      onUpdate(updated);
      setIsEditing(false);
    } catch (err: any) {
      onError(err.message || "Failed to update profile details.");
    } finally {
      setIsSaving(false);
    }
  };

  // Derive initials
  const initials =
    `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "U";

  const isAlumni = profile.role_name?.toLowerCase() === "alumni";
  const yearBadgeLabel = isAlumni ? "Batch" : "Class of";
  const displayYear = isAlumni && profile.graduation_year ? profile.graduation_year - 4 : profile.graduation_year;

  return (
    <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 md:p-8 shadow-sm">
      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <ProfilePictureUploader
              currentImageUrl={profile.profile_picture}
              initials={initials}
              onUploadSuccess={onUpdate}
              onUploadError={onError}
              isOwnProfile={isOwnProfile}
            />
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1E2746] uppercase tracking-wider mb-2">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-4 py-2.5 text-[#1E2746] placeholder-[#9188BE] focus:outline-none transition font-medium text-sm"
                  placeholder="e.g. Yash"
                  maxLength={50}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1E2746] uppercase tracking-wider mb-2">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-4 py-2.5 text-[#1E2746] placeholder-[#9188BE] focus:outline-none transition font-medium text-sm"
                  placeholder="e.g. Kumar"
                  maxLength={50}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1E2746] uppercase tracking-wider mb-2">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-4 py-2.5 text-[#1E2746] focus:outline-none transition font-medium text-sm cursor-pointer"
                >
                  <option value="">Select Department</option>
                  {department && !DEPARTMENTS.includes(department) && (
                    <option value={department}>{department}</option>
                  )}
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1E2746] uppercase tracking-wider mb-2">
                  {isAlumni ? "Enrollment / Batch Year" : "Graduation Year"}
                </label>
                <input
                  type="number"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-4 py-2.5 text-[#1E2746] placeholder-[#9188BE] focus:outline-none transition font-medium text-sm"
                  placeholder="e.g. 2023"
                  min={1990}
                  max={2035}
                />
              </div>

              {/* Editable Contact & Personal Links */}
              <div>
                <label className="block text-xs font-bold text-[#1E2746] uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-4 py-2.5 text-[#1E2746] placeholder-[#9188BE] focus:outline-none transition font-medium text-sm"
                  placeholder="e.g. candidate@domain.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1E2746] uppercase tracking-wider mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-4 py-2.5 text-[#1E2746] placeholder-[#9188BE] focus:outline-none transition font-medium text-sm"
                  placeholder="e.g. +91 9876543210"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1E2746] uppercase tracking-wider mb-2">
                  GitHub Profile URL
                </label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-4 py-2.5 text-[#1E2746] placeholder-[#9188BE] focus:outline-none transition font-medium text-sm"
                  placeholder="https://github.com/username"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1E2746] uppercase tracking-wider mb-2">
                  LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-4 py-2.5 text-[#1E2746] placeholder-[#9188BE] focus:outline-none transition font-medium text-sm"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#1E2746] uppercase tracking-wider mb-2">
                  LeetCode Profile URL
                </label>
                <input
                  type="url"
                  value={leetcodeUrl}
                  onChange={(e) => setLeetcodeUrl(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-4 py-2.5 text-[#1E2746] placeholder-[#9188BE] focus:outline-none transition font-medium text-sm"
                  placeholder="https://leetcode.com/u/username"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1E2746] uppercase tracking-wider mb-2">
                  10th Percentage <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={tenthPercentage}
                  onChange={(e) => setTenthPercentage(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-4 py-2.5 text-[#1E2746] placeholder-[#9188BE] focus:outline-none transition font-medium text-sm"
                  placeholder="e.g. 88.5"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1E2746] uppercase tracking-wider mb-2">
                  12th / Diploma Percentage <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={twelfthDiplomaPercentage}
                  onChange={(e) => setTwelfthDiplomaPercentage(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-4 py-2.5 text-[#1E2746] placeholder-[#9188BE] focus:outline-none transition font-medium text-sm"
                  placeholder="e.g. 85.0"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1E2746] uppercase tracking-wider mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-4 py-2.5 text-[#1E2746] placeholder-[#9188BE] focus:outline-none transition h-24 resize-none font-medium text-sm"
              placeholder="Tell other students and alumni about yourself..."
              maxLength={300}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#EAE4F7] text-[#5851A4] hover:bg-[#FAF9FD] hover:text-[#1E2746] transition font-bold text-sm cursor-pointer"
              disabled={isSaving}
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white font-bold text-sm transition shadow-md shadow-[#4B63D2]/25 cursor-pointer"
              disabled={isSaving}
            >
              <Save className="h-4 w-4 text-[#FFD21A]" />
              {isSaving ? "Saving..." : "Save Profile"}
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
              isOwnProfile={isOwnProfile}
            />
            <div className="space-y-3">
              <h2 className="text-3xl font-black text-[#1E2746] tracking-tight flex items-center justify-center md:justify-start gap-2">
                <span>
                  {profile.first_name || profile.last_name
                    ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
                    : "Add Your Name"}
                </span>
                <img
                  src="/infinity-badge.png"
                  className="h-6 w-6 object-contain inline-block drop-shadow-sm"
                  alt="Infinity Badge"
                  title="Verified Campus Distinction / Leadership Position"
                />
              </h2>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-[#5851A4] text-sm">
                {profile.department && (
                  <span className="flex items-center gap-1.5 font-bold">
                    <Building2 className="h-4 w-4 text-[#4B63D2]" />
                    {profile.department}
                  </span>
                )}
                {displayYear && (
                  <span className="flex items-center gap-1.5 font-bold">
                    <GraduationCap className="h-4 w-4 text-[#4B63D2]" />
                    {yearBadgeLabel} {displayYear}
                  </span>
                )}
                {profile.connection_count !== undefined && (
                  <span className="flex items-center gap-1.5 font-bold bg-[#C8B6E2]/25 border border-[#C8B6E2] text-[#5851A4] text-xs px-3 py-1 rounded-full">
                    <Users className="h-3.5 w-3.5 text-[#4B63D2]" />
                    {profile.connection_count}{" "}
                    {profile.connection_count === 1
                      ? "Connection"
                      : "Connections"}
                  </span>
                )}
                {!profile.department && !profile.graduation_year && (
                  <span className="text-[#9188BE] italic font-medium">
                    No department or batch year specified
                  </span>
                )}
              </div>

              {/* Display Social / Contact Info Chips if available */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1 text-xs">
                {profile.email && (
                  <span className="px-2.5 py-1 bg-[#FAF9FD] border border-[#EAE4F7] rounded-lg text-[#1E2746] font-medium">
                    📧 {profile.email}
                  </span>
                )}
                {profile.github_url && (
                  <a
                    href={profile.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-[#FAF9FD] border border-[#EAE4F7] hover:border-[#4B63D2] rounded-lg text-[#4B63D2] font-bold transition"
                  >
                    GitHub ↗
                  </a>
                )}
                {profile.linkedin_url && (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-[#FAF9FD] border border-[#EAE4F7] hover:border-[#4B63D2] rounded-lg text-[#4B63D2] font-bold transition"
                  >
                    LinkedIn ↗
                  </a>
                )}
                {profile.leetcode_url && (
                  <a
                    href={profile.leetcode_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-[#FAF9FD] border border-[#EAE4F7] hover:border-[#4B63D2] rounded-lg text-[#4B63D2] font-bold transition"
                  >
                    LeetCode ↗
                  </a>
                )}
              </div>

              <p className="text-[#1E2746] text-sm max-w-xl leading-relaxed font-medium">
                {profile.bio || (
                  <span className="text-[#9188BE] italic">
                    No bio added yet. Tell people about your interests and
                    goals!
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-center md:self-start mt-4 md:mt-0">
            <button
              onClick={handleGenerateResume}
              disabled={isDownloadingResume}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white font-bold text-sm transition shadow-md shadow-[#4B63D2]/25 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed group relative overflow-hidden"
              title="Generate and download personalized ATS-friendly Word DOCX resume"
            >
              {isDownloadingResume ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#FFD21A]" />
                  <span>Generating DOCX...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-[#FFD21A] group-hover:rotate-12 transition-transform" />
                  <span>Generate Resume</span>
                  <span className="text-[10px] uppercase font-black tracking-wider bg-white/20 px-1.5 py-0.5 rounded text-white ml-0.5">
                    DOCX
                  </span>
                </>
              )}
            </button>

            {isOwnProfile && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#EAE4F7] text-[#5851A4] hover:text-[#1E2746] hover:border-[#C8B6E2] hover:bg-[#FAF9FD] transition text-sm font-bold shadow-sm cursor-pointer"
              >
                <Edit2 className="h-4 w-4 text-[#4B63D2]" />
                Edit Info
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
