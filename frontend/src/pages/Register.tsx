import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  GraduationCap,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  BookOpen,
  Building,
  Award,
  Lock,
  Mail,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  Phone,
  Github,
  Linkedin,
  Code2,
  Terminal,
  Percent,
  Calculator,
  Briefcase,
  Layers,
  ShieldCheck,
  UserCheck,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { apiRequest, ApiError } from "../services/api";

type MainRole = "Student" | "Faculty" | "Alumni" | "Management";
type FacultyType = "HOD" | "Normal faculty";
type ManagementRole =
  | "Controller"
  | "Central Admin"
  | "TPO"
  | "DEAN"
  | "CEO"
  | "Principal";

export const COLLEGE_DEPARTMENTS = [
  "First Year",
  "CSE",
  "CSE(AIML)",
  "CSE(AIDS)",
  "IT",
  "ETC",
  "EE",
  "ME",
  "BCA",
  "MCA",
  "MBA",
];

export default function Register() {
  const navigate = useNavigate();

  // Role Selection
  const [selectedRole, setSelectedRole] = useState<MainRole>("Student");
  const [roleId, setRoleId] = useState<number>(3); // Default to Student (3)

  // Subtype Selections
  const [facultyType, setFacultyType] = useState<FacultyType>("Normal faculty");
  const [managementRole, setManagementRole] =
    useState<ManagementRole>("Controller");
  const [department, setDepartment] = useState<string>(COLLEGE_DEPARTMENTS[0]);
  const [accessKey, setAccessKey] = useState("");
  const [autoDetectedDept, setAutoDetectedDept] = useState<string | null>(null);

  // Alumni Specific Fields
  const [currentCompany, setCurrentCompany] = useState("");
  const [currentDesignation, setCurrentDesignation] = useState("");

  // Primary Auth Fields
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Contact & Social Links
  const [phoneNumber, setPhoneNumber] = useState("");
  const [githubProfile, setGithubProfile] = useState("");
  const [linkedinProfile, setLinkedinProfile] = useState("");
  const [leetcodeProfile, setLeetcodeProfile] = useState("");
  const [hackerrankProfile, setHackerrankProfile] = useState("");

  // Student Educational Qualifications
  const [tenthPercentage, setTenthPercentage] = useState("");
  const [qualificationType, setQualificationType] = useState<"12th" | "diploma">(
    "12th"
  );
  const [twelfthOrDiplomaScore, setTwelfthOrDiplomaScore] = useState("");
  const [collegeGpa, setCollegeGpa] = useState("");

  // OTP Verification States
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Status States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // OTP Countdown Timer
  useEffect(() => {
    let timer: any;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  const isCollegeDomain = (emailStr: string) => {
    return emailStr.trim().toLowerCase().endsWith("@sbjit.edu.in");
  };

  // Smart department auto-detection from student email
  const handleEmailChange = (val: string) => {
    setEmail(val);
    setOtpSent(false);

    if (selectedRole === "Student") {
      const lower = val.toLowerCase();
      let matchedDept: string | null = null;
      if (lower.includes("aiml")) matchedDept = "CSE(AIML)";
      else if (lower.includes("aids") || lower.includes("ds")) matchedDept = "CSE(AIDS)";
      else if (lower.includes("cse") || lower.includes("cs")) matchedDept = "CSE";
      else if (lower.includes("it")) matchedDept = "IT";
      else if (lower.includes("etc")) matchedDept = "ETC";
      else if (lower.includes("ee") || lower.includes("electrical")) matchedDept = "EE";
      else if (lower.includes("me") || lower.includes("mech")) matchedDept = "ME";
      else if (lower.includes("bca")) matchedDept = "BCA";
      else if (lower.includes("mca")) matchedDept = "MCA";
      else if (lower.includes("mba")) matchedDept = "MBA";

      if (matchedDept && COLLEGE_DEPARTMENTS.includes(matchedDept)) {
        setDepartment(matchedDept);
        setAutoDetectedDept(matchedDept);
      } else {
        setAutoDetectedDept(null);
      }
    }
  };

  const handleRoleSelect = (role: MainRole) => {
    setSelectedRole(role);
    switch (role) {
      case "Student":
        setRoleId(3);
        break;
      case "Alumni":
        setRoleId(4);
        break;
      case "Faculty":
        setRoleId(6);
        break;
      case "Management":
        setRoleId(7);
        break;
      default:
        setRoleId(3);
    }
  };

  // Step 1: Send OTP to College Email
  const handleSendOtp = async () => {
    setError(null);
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Please enter your college email address.");
      return;
    }

    if (!isCollegeDomain(trimmedEmail)) {
      setError("Only authorized @sbjit.edu.in college email addresses are permitted.");
      return;
    }

    setSendingOtp(true);
    try {
      await apiRequest("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ email: trimmedEmail }),
      });

      setOtpSent(true);
      setOtpCountdown(60);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to dispatch OTP. Please verify email and try again.");
      }
    } finally {
      setSendingOtp(false);
    }
  };

  // Step 2: Full Profile Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    setError(null);

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Please provide your authorized SBJIT email address.");
      return;
    }

    if (!isCollegeDomain(trimmedEmail)) {
      setError("Registration is restricted to verified @sbjit.edu.in college email accounts.");
      return;
    }

    if (!otpSent) {
      setError("Please click 'Send OTP' to receive your verification code.");
      return;
    }

    if (!otp.trim() || otp.trim().length < 6) {
      setError("Please enter the 6-digit verification code dispatched to your college email.");
      return;
    }

    if (!password) {
      setError("Please establish a secure password for your account.");
      return;
    }

    if (password.length < 6) {
      setError("Your account password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The confirmed password does not match the password entered above.");
      return;
    }

    if (
      selectedRole === "Management" &&
      managementRole === "Controller" &&
      !accessKey.trim()
    ) {
      setError(`Please enter the Department Controller Security Key for ${department}.`);
      return;
    }

    if (
      selectedRole === "Management" &&
      managementRole === "Central Admin" &&
      !accessKey.trim()
    ) {
      setError("Please enter the Central Admin Master Security Key.");
      return;
    }

    setLoading(true);

    // Build payload according to role
    const payload: Record<string, any> = {
      email: trimmedEmail,
      password: password,
      role_id: roleId,
      otp: otp.trim(),
      phone_number: phoneNumber.trim() || null,
      linkedin_profile: linkedinProfile.trim() || null,
      github_profile: githubProfile.trim() || null,
    };

    if (selectedRole === "Student") {
      payload.department = department;
      payload.leetcode_profile = leetcodeProfile.trim() || null;
      payload.hackerrank_profile = hackerrankProfile.trim() || null;
      payload.tenth_percentage = tenthPercentage
        ? parseFloat(tenthPercentage)
        : null;
      payload.twelfth_or_diploma_percentage = twelfthOrDiplomaScore
        ? parseFloat(twelfthOrDiplomaScore)
        : null;
      payload.gpa = collegeGpa ? parseFloat(collegeGpa) : null;
    } else if (selectedRole === "Faculty") {
      payload.department = department;
      payload.faculty_type = facultyType;
      payload.designation = `${facultyType} - ${department}`;
    } else if (selectedRole === "Alumni") {
      payload.current_company = currentCompany.trim();
      payload.designation = currentDesignation.trim() || "Alumni Professional";
    } else if (selectedRole === "Management") {
      payload.management_role = managementRole;
      if (managementRole === "Controller") {
        payload.department = department;
        payload.access_key = accessKey.trim();
        payload.designation = `Department Controller (${department})`;
      } else if (managementRole === "Central Admin") {
        payload.department = "Central Administration";
        payload.access_key = accessKey.trim();
        payload.designation = "Central Admin";
      } else {
        payload.department = "Central Administration";
        payload.designation = managementRole;
      }
    }

    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/login#signin");
      }, 3500);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected network error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6FD] px-4 py-8 select-none">
        <div className="max-w-md w-full bg-white border border-[#EAE4F7] rounded-3xl p-8 shadow-xl shadow-[#5851A4]/5 text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#1E2746]">
              Registration Successful!
            </h2>
            <p className="text-[#5851A4] text-xs sm:text-sm font-medium">
              Your verified profile for{" "}
              <strong className="text-[#1E2746]">{email}</strong> has been
              registered as{" "}
              <strong className="text-[#1E2746]">
                {selectedRole === "Faculty"
                  ? `${facultyType} (${department})`
                  : selectedRole === "Management"
                  ? `${managementRole}${
                      managementRole === "Controller" ? ` - ${department}` : ""
                    }`
                  : selectedRole === "Alumni"
                  ? `Alumni (${currentCompany || "Industry"})`
                  : "Student"}
              </strong>
              .
            </p>
            <p className="text-[#9188BE] text-xs mt-2 font-semibold">
              Redirecting you to the sign in page in a moment...
            </p>
          </div>
          <button
            onClick={() => navigate("/login#signin")}
            className="w-full bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white rounded-xl py-3.5 font-bold text-sm transition-all flex items-center justify-center gap-2 mt-4 shadow-md shadow-[#4B63D2]/25 cursor-pointer"
          >
            Sign In Now <ArrowRight className="h-4 w-4 text-[#FFD21A]" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F6FD] px-4 py-10 select-none">
      <div className="max-w-2xl w-full bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-9 shadow-xl shadow-[#5851A4]/5 transition-all">
        {/* Header with Logo */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center mb-3.5 shadow-md shadow-[#4B63D2]/15 border border-[#EAE4F7] overflow-hidden p-2">
            <img
              src="/knots_logo.png"
              alt="KNOTS Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#1E2746] tracking-tight">
            Create SBJIT Account
          </h2>
          <p className="text-[#5851A4] text-xs sm:text-sm mt-1.5 font-medium max-w-md">
            Join the authorized campus collaboration & career network
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-3.5 text-xs mb-5 flex items-start gap-2.5 animate-in fade-in duration-200 shadow-sm">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          {/* ========================================================================= */}
          {/* SECTION 1: ROLE SELECTION                                                 */}
          {/* ========================================================================= */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-[#1E2746] flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#4B63D2]/10 text-[#4B63D2] flex items-center justify-center text-[10px] font-black">
                  1
                </span>
                <span>Choose Your Campus Role</span>
              </label>
              <span className="text-[11px] font-bold text-[#5851A4]">
                Role: <strong className="text-[#4B63D2]">{selectedRole}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {[
                {
                  key: "Student",
                  label: "Student",
                  desc: "Academics & Career",
                  icon: GraduationCap,
                },
                {
                  key: "Faculty",
                  label: "Faculty",
                  desc: "Teachers & Mentors",
                  icon: BookOpen,
                },
                {
                  key: "Alumni",
                  label: "Alumni",
                  desc: "Graduates & Pros",
                  icon: Award,
                },
                {
                  key: "Management",
                  label: "Management",
                  desc: "Admin & Leadership",
                  icon: Building,
                },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = selectedRole === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleRoleSelect(item.key as MainRole)}
                    className={`relative flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#4B63D2] border-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/25 scale-[1.02]"
                        : "bg-[#FAF9FD] border-[#EAE4F7] text-[#5851A4] hover:bg-white hover:border-[#D5CBEE] hover:text-[#1E2746]"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mb-1.5 transition-colors ${
                        isSelected ? "text-[#FFD21A]" : "text-[#5851A4]"
                      }`}
                    />
                    <span className="text-xs font-bold">{item.label}</span>
                    <span
                      className={`text-[9px] mt-0.5 font-medium ${
                        isSelected ? "text-white/80" : "text-[#9188BE]"
                      }`}
                    >
                      {item.desc}
                    </span>
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FFD21A] rounded-full ring-2 ring-white"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 1B: ROLE-SPECIFIC SUB-OPTIONS                                    */}
          {/* ========================================================================= */}

          {/* STUDENT DEPARTMENT SELECTION */}
          {selectedRole === "Student" && (
            <div className="space-y-3 bg-[#FAF9FD] p-4 sm:p-5 rounded-2xl border border-[#D5CBEE] animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#4B63D2]" />
                  <label className="text-xs font-bold text-[#1E2746] uppercase tracking-wider">
                    Student Department / Branch <span className="text-rose-500">*</span>
                  </label>
                </div>
                {autoDetectedDept ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 animate-pulse">
                    ✨ Auto-detected: {autoDetectedDept}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-[#4B63D2] bg-[#4B63D2]/10 px-2.5 py-0.5 rounded-full border border-[#4B63D2]/20">
                    Academic Branch
                  </span>
                )}
              </div>

              <div className="relative">
                <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE] pointer-events-none" />
                <select
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value);
                    setAutoDetectedDept(null);
                  }}
                  className="w-full bg-white border border-[#D5CBEE] rounded-xl pl-10 pr-10 py-2.5 text-[#1E2746] text-xs font-bold focus:outline-none focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20 cursor-pointer shadow-sm appearance-none"
                  required
                >
                  {COLLEGE_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE] pointer-events-none" />
              </div>
            </div>
          )}

          {/* FACULTY SUBTYPE & DEPARTMENT */}
          {selectedRole === "Faculty" && (
            <div className="space-y-3.5 bg-[#FAF9FD] p-4 sm:p-5 rounded-2xl border border-[#D5CBEE] animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#4B63D2]" />
                <label className="text-xs font-bold text-[#1E2746] uppercase tracking-wider">
                  Faculty Designation & Department
                </label>
              </div>

              {/* Faculty Subtypes: HOD vs Normal Faculty */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {(["HOD", "Normal faculty"] as FacultyType[]).map((type) => {
                  const isChecked = facultyType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFacultyType(type)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isChecked
                          ? "bg-[#4B63D2] text-white border-[#4B63D2] shadow-sm shadow-[#4B63D2]/20"
                          : "bg-white text-[#5851A4] border-[#D5CBEE] hover:border-[#4B63D2]"
                      }`}
                    >
                      {isChecked ? (
                        <CheckCircle2 className="w-4 h-4 text-[#FFD21A]" />
                      ) : (
                        <UserCheck className="w-4 h-4 text-[#9188BE]" />
                      )}
                      <span>
                        {type === "HOD" ? "HOD (Head of Dept)" : "Faculty Member"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Department Dropdown */}
              <div className="pt-1">
                <label className="block text-[11px] font-bold text-[#5851A4] mb-1.5">
                  Assigned Academic Department <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE] pointer-events-none" />
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-white border border-[#D5CBEE] rounded-xl pl-10 pr-10 py-2.5 text-[#1E2746] text-xs font-bold focus:outline-none focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20 cursor-pointer shadow-sm appearance-none"
                  >
                    {COLLEGE_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE] pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {/* ALUMNI CURRENT COMPANY & DESIGNATION */}
          {selectedRole === "Alumni" && (
            <div className="space-y-3.5 bg-[#FAF9FD] p-4 sm:p-5 rounded-2xl border border-[#D5CBEE] animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#4B63D2]" />
                <label className="text-xs font-bold text-[#1E2746] uppercase tracking-wider">
                  Current Professional Employment
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Current Working Company */}
                <div>
                  <label className="block text-[11px] font-bold text-[#5851A4] mb-1.5">
                    Current Working Company <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE]" />
                    <input
                      type="text"
                      value={currentCompany}
                      onChange={(e) => setCurrentCompany(e.target.value)}
                      placeholder="e.g. Google, Microsoft, TCS, Infosys, Startup"
                      className="w-full bg-white border border-[#D5CBEE] rounded-xl pl-10 pr-3.5 py-2.5 text-[#1E2746] placeholder-[#9188BE] text-xs font-medium focus:outline-none focus:border-[#4B63D2] shadow-sm"
                      required
                    />
                  </div>
                </div>

                {/* Job Title / Role */}
                <div>
                  <label className="block text-[11px] font-bold text-[#5851A4] mb-1.5">
                    Job Title / Designation
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE]" />
                    <input
                      type="text"
                      value={currentDesignation}
                      onChange={(e) => setCurrentDesignation(e.target.value)}
                      placeholder="e.g. Senior Software Engineer"
                      className="w-full bg-white border border-[#D5CBEE] rounded-xl pl-10 pr-3.5 py-2.5 text-[#1E2746] placeholder-[#9188BE] text-xs font-medium focus:outline-none focus:border-[#4B63D2] shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MANAGEMENT ROLE OPTIONS & DEPARTMENT CONTROLLER */}
          {selectedRole === "Management" && (
            <div className="space-y-4 bg-[#FAF9FD] p-4 sm:p-5 rounded-2xl border border-[#D5CBEE] animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#4B63D2]" />
                  <label className="text-xs font-bold text-[#1E2746] uppercase tracking-wider">
                    Select Management Role
                  </label>
                </div>
                <span className="text-[10px] font-bold text-[#4B63D2] bg-[#4B63D2]/10 px-2.5 py-0.5 rounded-full border border-[#4B63D2]/20">
                  {managementRole}
                </span>
              </div>

              {/* Management Role Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {(
                  [
                    "Controller",
                    "Central Admin",
                    "TPO",
                    "DEAN",
                    "CEO",
                    "Principal",
                  ] as ManagementRole[]
                ).map((role) => {
                  const isChecked = managementRole === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setManagementRole(role)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isChecked
                          ? "bg-[#4B63D2] text-white border-[#4B63D2] shadow-sm shadow-[#4B63D2]/20"
                          : "bg-white text-[#5851A4] border-[#D5CBEE] hover:border-[#4B63D2]"
                      }`}
                    >
                      {isChecked ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#FFD21A]" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5 text-[#9188BE]" />
                      )}
                      <span>{role}</span>
                    </button>
                  );
                })}
              </div>

              {/* If Controller is selected -> Ask for Department & Controller Key */}
              {managementRole === "Controller" && (
                <div className="pt-3 border-t border-[#EAE4F7] space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-[#1E2746]">
                      Assigned Department for Controller{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-extrabold text-[#4B63D2] bg-[#4B63D2]/10 px-2.5 py-0.5 rounded-full border border-[#4B63D2]/20">
                      Department-Wise Controller
                    </span>
                  </div>

                  <div className="relative">
                    <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE] pointer-events-none" />
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-white border border-[#D5CBEE] rounded-xl pl-10 pr-10 py-2.5 text-[#1E2746] text-xs font-bold focus:outline-none focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20 cursor-pointer shadow-sm appearance-none"
                    >
                      {COLLEGE_DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE] pointer-events-none" />
                  </div>

                  {/* Controller Security Key Input */}
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-[11px] font-bold text-[#5851A4]">
                      Department Controller Security Key / Access ID{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE]" />
                      <input
                        type="text"
                        value={accessKey}
                        onChange={(e) => setAccessKey(e.target.value)}
                        placeholder={`e.g. SBJIT-CTRL-${department.includes("(") ? department.split("(")[1].replace(")", "") : "DEPT"}-8F3A-7E2D-9B4C-1A05`}
                        className="w-full bg-white border border-[#D5CBEE] rounded-xl pl-10 pr-3.5 py-2.5 text-[#1E2746] placeholder-[#9188BE] text-xs font-mono font-bold focus:outline-none focus:border-[#4B63D2] shadow-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-[#4B63D2]/5 border border-[#4B63D2]/20 rounded-xl p-3 flex items-start gap-2 text-[11px] text-[#5851A4] font-medium">
                    <Sparkles className="w-4 h-4 text-[#4B63D2] shrink-0 mt-0.5" />
                    <span>
                      As the <strong>{department}</strong> Controller, you will
                      be authorized to post, coordinate, and moderate all
                      departmental events, clubs, and student activities.
                    </span>
                  </div>
                </div>
              )}

              {/* If Central Admin is selected -> Ask for Central Admin Master Key */}
              {managementRole === "Central Admin" && (
                <div className="pt-3 border-t border-[#EAE4F7] space-y-2.5 animate-in fade-in duration-200">
                  <label className="block text-[11px] font-bold text-[#1E2746]">
                    Central Admin Master Security Key <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE]" />
                    <input
                      type="text"
                      value={accessKey}
                      onChange={(e) => setAccessKey(e.target.value)}
                      placeholder="e.g. SBJIT-SUPER-ADMIN-9X8K-4M2P-7Q1W-5V3Z-9842"
                      className="w-full bg-white border border-[#D5CBEE] rounded-xl pl-10 pr-3.5 py-2.5 text-[#1E2746] placeholder-[#9188BE] text-xs font-mono font-bold focus:outline-none focus:border-[#4B63D2] shadow-sm"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-[#5851A4] font-medium">
                    Requires authorized SBJIT administrative master key for registration.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 2: COLLEGE EMAIL & OTP VERIFICATION                               */}
          {/* ========================================================================= */}
          <div className="space-y-3.5 bg-[#FAF9FD] p-4 sm:p-5 rounded-2xl border border-[#EAE4F7] shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-[#1E2746] flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#4B63D2]/10 text-[#4B63D2] flex items-center justify-center text-[10px] font-black">
                  2
                </span>
                <span>Authorized College Email</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>
              <span className="text-[10px] font-bold text-[#4B63D2] bg-[#4B63D2]/10 px-2.5 py-0.5 rounded-full border border-[#4B63D2]/20">
                @sbjit.edu.in
              </span>
            </div>

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE]" />
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="yourname@sbjit.edu.in"
                className={`w-full rounded-xl pl-10 pr-28 py-2.5 text-[#1E2746] placeholder-[#9188BE] focus:outline-none transition-all text-xs font-medium disabled:opacity-50 ${
                  hasSubmitted && !email.trim()
                    ? "bg-rose-50/30 border-2 border-rose-500 ring-2 ring-rose-500/20"
                    : "bg-white border border-[#D5CBEE] focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20"
                }`}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp || otpCountdown > 0 || !email.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-[#4B63D2] hover:bg-[#3E53BE] disabled:bg-slate-200 disabled:text-slate-500 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                {sendingOtp ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : otpCountdown > 0 ? (
                  <span>Resend in {otpCountdown}s</span>
                ) : (
                  <span>{otpSent ? "Resend OTP" : "Send OTP"}</span>
                )}
              </button>
            </div>

            {email && !isCollegeDomain(email) && (
              <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Only authorized college email addresses (@sbjit.edu.in) are permitted.</span>
              </p>
            )}

            {/* OTP Code Input */}
            {otpSent && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-2 pt-3 border-t border-[#EAE4F7]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#1E2746] uppercase tracking-wider">
                    Enter 6-Digit Email Verification Code <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Code Dispatched
                  </span>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE]" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 6-digit OTP code"
                    className="w-full bg-white border-2 border-[#4B63D2]/40 rounded-xl pl-10 pr-4 py-2.5 text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20 text-sm font-mono font-bold tracking-widest text-center shadow-sm"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: ACCOUNT PASSWORD                                               */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1E2746] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <span>Password</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={`w-full rounded-xl pl-10 pr-10 py-2.5 text-[#1E2746] placeholder-[#9188BE] focus:outline-none transition-all text-xs font-medium disabled:opacity-50 ${
                    hasSubmitted && (!password || password.length < 6)
                      ? "bg-rose-50/30 border-2 border-rose-500 ring-2 ring-rose-500/20"
                      : "bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20 shadow-sm"
                  }`}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9188BE] hover:text-[#1E2746] p-1 cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-[#4B63D2]" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E2746] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <span>Confirm Password</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE]" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className={`w-full rounded-xl pl-10 pr-10 py-2.5 text-[#1E2746] placeholder-[#9188BE] focus:outline-none transition-all text-xs font-medium disabled:opacity-50 ${
                    hasSubmitted && (!confirmPassword || confirmPassword !== password)
                      ? "bg-rose-50/30 border-2 border-rose-500 ring-2 ring-rose-500/20"
                      : "bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20 shadow-sm"
                  }`}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9188BE] hover:text-[#1E2746] p-1 cursor-pointer"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4 text-[#4B63D2]" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 4: CONTACT DETAILS & PROFILES (TAILORED PER ROLE)                  */}
          {/* ========================================================================= */}
          <div className="space-y-3.5 bg-white p-4 sm:p-5 rounded-2xl border border-[#EAE4F7] shadow-sm">
            <div className="flex items-center justify-between border-b border-[#EAE4F7] pb-2.5">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#4B63D2]" />
                <label className="text-xs font-black text-[#1E2746] uppercase tracking-wider">
                  3. Contact Information & Profiles
                </label>
              </div>
              <span className="text-[10px] font-semibold text-[#9188BE]">
                Optional / Can update later
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {/* Phone Number */}
              <div>
                <label className="block text-[11px] font-bold text-[#5851A4] mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9188BE]" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-9 pr-3.5 py-2.5 text-[#1E2746] placeholder-[#9188BE] text-xs font-medium focus:outline-none focus:border-[#4B63D2] shadow-sm"
                  />
                </div>
              </div>

              {/* LinkedIn Link */}
              <div>
                <label className="block text-[11px] font-bold text-[#5851A4] mb-1.5">
                  LinkedIn Profile Link
                </label>
                <div className="relative">
                  <Linkedin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9188BE]" />
                  <input
                    type="url"
                    value={linkedinProfile}
                    onChange={(e) => setLinkedinProfile(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-9 pr-3.5 py-2.5 text-[#1E2746] placeholder-[#9188BE] text-xs font-medium focus:outline-none focus:border-[#4B63D2] shadow-sm"
                  />
                </div>
              </div>

              {/* GitHub Link (For Students, Alumni, Faculty) */}
              {(selectedRole === "Student" ||
                selectedRole === "Alumni" ||
                selectedRole === "Faculty") && (
                <div
                  className={
                    selectedRole === "Student" ? "" : "sm:col-span-2"
                  }
                >
                  <label className="block text-[11px] font-bold text-[#5851A4] mb-1.5">
                    {selectedRole === "Faculty"
                      ? "Research / GitHub Profile Link"
                      : "GitHub Profile Link"}
                  </label>
                  <div className="relative">
                    <Github className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9188BE]" />
                    <input
                      type="url"
                      value={githubProfile}
                      onChange={(e) => setGithubProfile(e.target.value)}
                      placeholder="https://github.com/username"
                      className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-9 pr-3.5 py-2.5 text-[#1E2746] placeholder-[#9188BE] text-xs font-medium focus:outline-none focus:border-[#4B63D2] shadow-sm"
                    />
                  </div>
                </div>
              )}

              {/* Coding Profiles ONLY for Students */}
              {selectedRole === "Student" && (
                <>
                  {/* LeetCode Link */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#5851A4] mb-1.5">
                      LeetCode Profile Link
                    </label>
                    <div className="relative">
                      <Code2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9188BE]" />
                      <input
                        type="url"
                        value={leetcodeProfile}
                        onChange={(e) => setLeetcodeProfile(e.target.value)}
                        placeholder="https://leetcode.com/u/username"
                        className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-9 pr-3.5 py-2.5 text-[#1E2746] placeholder-[#9188BE] text-xs font-medium focus:outline-none focus:border-[#4B63D2] shadow-sm"
                      />
                    </div>
                  </div>

                  {/* HackerRank Link */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#5851A4] mb-1.5">
                      HackerRank Profile Link
                    </label>
                    <div className="relative">
                      <Terminal className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9188BE]" />
                      <input
                        type="url"
                        value={hackerrankProfile}
                        onChange={(e) => setHackerrankProfile(e.target.value)}
                        placeholder="https://hackerrank.com/profile/username"
                        className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-9 pr-3.5 py-2.5 text-[#1E2746] placeholder-[#9188BE] text-xs font-medium focus:outline-none focus:border-[#4B63D2] shadow-sm"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 5: EDUCATIONAL MARKS & PERCENTAGES (STUDENTS ONLY)                 */}
          {/* ========================================================================= */}
          {selectedRole === "Student" && (
            <div className="space-y-3.5 bg-white p-4 sm:p-5 rounded-2xl border border-[#EAE4F7] shadow-sm animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-[#EAE4F7] pb-2.5">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-[#4B63D2]" />
                  <label className="text-xs font-black text-[#1E2746] uppercase tracking-wider">
                    4. Academic Marks & Qualifications
                  </label>
                </div>
                <span className="text-[10px] font-semibold text-[#9188BE]">
                  For Placement Filtering
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                {/* 10th Percentage */}
                <div>
                  <label className="block text-[11px] font-bold text-[#5851A4] mb-1.5">
                    10th Standard %
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9188BE]" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={tenthPercentage}
                      onChange={(e) => setTenthPercentage(e.target.value)}
                      placeholder="e.g. 88.5"
                      className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-9 pr-3.5 py-2.5 text-[#1E2746] placeholder-[#9188BE] text-xs font-medium focus:outline-none focus:border-[#4B63D2] shadow-sm"
                    />
                  </div>
                </div>

                {/* 12th or Diploma Score */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-[#5851A4]">
                      {qualificationType === "12th"
                        ? "12th Standard %"
                        : "Diploma % / GPA"}
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setQualificationType(
                          qualificationType === "12th" ? "diploma" : "12th"
                        )
                      }
                      className="text-[10px] text-[#4B63D2] font-bold hover:underline cursor-pointer"
                    >
                      Switch to {qualificationType === "12th" ? "Diploma" : "12th"}
                    </button>
                  </div>
                  <div className="relative">
                    <Calculator className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9188BE]" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={twelfthOrDiplomaScore}
                      onChange={(e) => setTwelfthOrDiplomaScore(e.target.value)}
                      placeholder={
                        qualificationType === "12th"
                          ? "e.g. 85.2"
                          : "e.g. 8.9 / 89%"
                      }
                      className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-9 pr-3.5 py-2.5 text-[#1E2746] placeholder-[#9188BE] text-xs font-medium focus:outline-none focus:border-[#4B63D2] shadow-sm"
                    />
                  </div>
                </div>

                {/* Current College GPA */}
                <div>
                  <label className="block text-[11px] font-bold text-[#5851A4] mb-1.5">
                    Current College CGPA
                  </label>
                  <div className="relative">
                    <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9188BE]" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={collegeGpa}
                      onChange={(e) => setCollegeGpa(e.target.value)}
                      placeholder="e.g. 8.75"
                      className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-9 pr-3.5 py-2.5 text-[#1E2746] placeholder-[#9188BE] text-xs font-medium focus:outline-none focus:border-[#4B63D2] shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !otpSent || otp.length < 6}
            className="w-full bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl py-4 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 mt-6 shadow-md shadow-[#4B63D2]/25 cursor-pointer active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[#FFD21A]" />
                <span>Verifying OTP & Registering Account...</span>
              </>
            ) : (
              <>
                <span>
                  Complete Registration as{" "}
                  {selectedRole === "Faculty"
                    ? `${facultyType} (${department.split(" ")[0]})`
                    : selectedRole === "Management"
                    ? `${managementRole}${
                        managementRole === "Controller"
                          ? ` - ${department.split(" ")[0]}`
                          : ""
                      }`
                    : selectedRole}
                </span>
                <ArrowRight className="h-4 w-4 text-[#FFD21A]" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[#5851A4] text-xs mt-6 font-medium border-t border-[#EAE4F7] pt-4">
          Already registered and verified?{" "}
          <Link
            to="/login#signin"
            className="text-[#4B63D2] font-black hover:text-[#3E53BE] hover:underline"
          >
            Sign In with Password
          </Link>
        </p>
      </div>
    </div>
  );
}
