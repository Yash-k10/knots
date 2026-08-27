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
  const [roleId, setRoleId] = useState<number>(2); // Default to Student (2)

  // Subtype Selections
  const [facultyType, setFacultyType] = useState<FacultyType>("Normal faculty");
  const [managementRole, setManagementRole] =
    useState<ManagementRole>("Controller");
  const [department, setDepartment] = useState<string>(COLLEGE_DEPARTMENTS[0]);
  const [accessKey, setAccessKey] = useState("");

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
  const [demoOtpNotice, setDemoOtpNotice] = useState<string | null>(null);

  // Status States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  const handleRoleSelect = (role: MainRole) => {
    setSelectedRole(role);
    switch (role) {
      case "Student":
        setRoleId(2);
        break;
      case "Alumni":
        setRoleId(3);
        break;
      case "Faculty":
        setRoleId(5);
        break;
      case "Management":
        setRoleId(1);
        break;
      default:
        setRoleId(2);
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
      setError(
        "Only authorized college email addresses ending with @sbjit.edu.in are permitted."
      );
      return;
    }

    setSendingOtp(true);
    try {
      const res = await apiRequest<{
        message: string;
        email: string;
        demo_otp?: string;
      }>("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({
          email: trimmedEmail,
          purpose: "register",
        }),
      });

      setOtpSent(true);
      setOtpCountdown(60);
      if (res.demo_otp) {
        setDemoOtpNotice(res.demo_otp);
        setOtp(res.demo_otp); // Pre-fill in dev mode
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to dispatch verification OTP. Please try again.");
      }
    } finally {
      setSendingOtp(false);
    }
  };

  // Step 2: Register Account with role-specific payload
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();

    // Frontend Validations
    if (!trimmedEmail) {
      setError("Email address is required.");
      return;
    }
    if (!isCollegeDomain(trimmedEmail)) {
      setError(
        "Only authorized college email addresses (@sbjit.edu.in) are allowed to register."
      );
      return;
    }
    if (!otpSent || !otp.trim() || otp.trim().length < 6) {
      setError(
        "Please send and enter the 6-digit OTP verification code sent to your email."
      );
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Role-specific validation
    if (selectedRole === "Alumni" && !currentCompany.trim()) {
      setError("Please specify your current working company or organization.");
      return;
    }

    if (selectedRole === "Faculty" && !department) {
      setError("Please select your department.");
      return;
    }

    if (
      selectedRole === "Management" &&
      managementRole === "Controller"
    ) {
      if (!department) {
        setError(
          "Please select the department for which you are registering as Controller."
        );
        return;
      }
      if (!accessKey.trim()) {
        setError(
          `Please enter the Department Controller Security Key for ${department}.`
        );
        return;
      }
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
      <div className="max-w-2xl w-full bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#5851A4]/5">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center mb-3 shadow-md shadow-[#4B63D2]/15 border border-[#EAE4F7] overflow-hidden p-1.5">
            <img
              src="/knots_logo.png"
              alt="KNOTS Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-2xl font-black text-[#1E2746] tracking-tight">
            Create SBJIT Account
          </h2>
          <p className="text-[#5851A4] text-xs mt-1 font-medium">
            Join the authorized campus collaboration & career network
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-3 text-xs mb-4 flex items-start gap-2 animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          {/* ========================================================================= */}
          {/* SECTION 1: ROLE SELECTION                                                 */}
          {/* ========================================================================= */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5851A4] mb-2">
              1. Choose Your Campus Role
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: "Student", label: "Student", icon: GraduationCap },
                { key: "Faculty", label: "Faculty", icon: BookOpen },
                { key: "Alumni", label: "Alumni", icon: Award },
                { key: "Management", label: "Management", icon: Building },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = selectedRole === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleRoleSelect(item.key as MainRole)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#4B63D2] border-[#4B63D2] text-white shadow-sm shadow-[#4B63D2]/30 scale-[1.02]"
                        : "bg-[#FAF9FD] border-[#EAE4F7] text-[#5851A4] hover:bg-white hover:border-[#C8B6E2] hover:text-[#1E2746]"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 mb-1.5 ${
                        isSelected ? "text-[#FFD21A]" : "text-[#5851A4]"
                      }`}
                    />
                    <span>{item.label}</span>
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
            <div className="space-y-3 bg-[#FAF9FD] p-4 rounded-2xl border border-[#D5CBEE] animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#4B63D2]" />
                  <label className="text-xs font-bold text-[#1E2746] uppercase tracking-wider">
                    Student Department / Branch <span className="text-rose-500">*</span>
                  </label>
                </div>
                <span className="text-[10px] font-bold text-[#4B63D2] bg-[#4B63D2]/10 px-2 py-0.5 rounded-full border border-[#4B63D2]/20">
                  Academic Branch
                </span>
              </div>

              <div className="relative">
                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE]" />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-white border border-[#D5CBEE] rounded-xl pl-10 pr-4 py-2.5 text-[#1E2746] text-xs font-semibold focus:outline-none focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20 cursor-pointer"
                  required
                >
                  {COLLEGE_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* FACULTY SUBTYPE & DEPARTMENT */}
          {selectedRole === "Faculty" && (
            <div className="space-y-3 bg-[#FAF9FD] p-4 rounded-2xl border border-[#D5CBEE] animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#4B63D2]" />
                <label className="text-xs font-bold text-[#1E2746] uppercase tracking-wider">
                  Faculty Designation & Department
                </label>
              </div>

              {/* Faculty Subtypes: HOD vs Normal Faculty */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {(["HOD", "Normal faculty"] as FacultyType[]).map((type) => {
                  const isChecked = facultyType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFacultyType(type)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isChecked
                          ? "bg-[#4B63D2] text-white border-[#4B63D2] shadow-sm shadow-[#4B63D2]/20"
                          : "bg-white text-[#5851A4] border-[#D5CBEE] hover:border-[#4B63D2]"
                      }`}
                    >
                      {isChecked ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#FFD21A]" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5 text-[#9188BE]" />
                      )}
                      <span>
                        {type === "HOD"
                          ? "HOD (Head of Dept)"
                          : "Normal Faculty"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Department Dropdown */}
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-[#5851A4] mb-1">
                  Assigned Academic Department{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE]" />
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-white border border-[#D5CBEE] rounded-xl pl-10 pr-4 py-2.5 text-[#1E2746] text-xs font-semibold focus:outline-none focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20 cursor-pointer"
                  >
                    {COLLEGE_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ALUMNI CURRENT COMPANY & DESIGNATION */}
          {selectedRole === "Alumni" && (
            <div className="space-y-3 bg-[#FAF9FD] p-4 rounded-2xl border border-[#D5CBEE] animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#4B63D2]" />
                <label className="text-xs font-bold text-[#1E2746] uppercase tracking-wider">
                  Current Professional Employment
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Current Working Company */}
                <div>
                  <label className="block text-[11px] font-bold text-[#5851A4] mb-1">
                    Current Working Company{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE]" />
                    <input
                      type="text"
                      value={currentCompany}
                      onChange={(e) => setCurrentCompany(e.target.value)}
                      placeholder="e.g. Google, Microsoft, TCS, Infosys, Startup"
                      className="w-full bg-white border border-[#D5CBEE] rounded-xl pl-10 pr-3 py-2 text-[#1E2746] placeholder-[#9188BE] text-xs font-medium focus:outline-none focus:border-[#4B63D2]"
                      required
                    />
                  </div>
                </div>

                {/* Job Title / Role */}
                <div>
                  <label className="block text-[11px] font-bold text-[#5851A4] mb-1">
                    Job Title / Designation
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE]" />
                    <input
                      type="text"
                      value={currentDesignation}
                      onChange={(e) => setCurrentDesignation(e.target.value)}
                      placeholder="e.g. Senior Software Engineer"
                      className="w-full bg-white border border-[#D5CBEE] rounded-xl pl-10 pr-3 py-2 text-[#1E2746] placeholder-[#9188BE] text-xs font-medium focus:outline-none focus:border-[#4B63D2]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MANAGEMENT ROLE OPTIONS & DEPARTMENT CONTROLLER */}
          {selectedRole === "Management" && (
            <div className="space-y-3 bg-[#FAF9FD] p-4 rounded-2xl border border-[#D5CBEE] animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#4B63D2]" />
                <label className="text-xs font-bold text-[#1E2746] uppercase tracking-wider">
                  Select Management Role
                </label>
              </div>

              {/* Management Role Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
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
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isChecked
                          ? "bg-[#4B63D2] text-white border-[#4B63D2] shadow-sm shadow-[#4B63D2]/20"
                          : "bg-white text-[#5851A4] border-[#D5CBEE] hover:border-[#4B63D2]"
                      }`}
                    >
                      {isChecked && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#FFD21A]" />
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
                    <span className="text-[10px] font-extrabold text-[#4B63D2] bg-[#4B63D2]/10 px-2 py-0.5 rounded-full border border-[#4B63D2]/20">
                      Department-Wise Controller
                    </span>
                  </div>

                  <div className="relative">
                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE]" />
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-white border border-[#D5CBEE] rounded-xl pl-10 pr-4 py-2.5 text-[#1E2746] text-xs font-semibold focus:outline-none focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20 cursor-pointer"
                    >
                      {COLLEGE_DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Controller Security Key Input */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-[#5851A4]">
                        Department Controller Security Key / Access ID <span className="text-rose-500">*</span>
                      </label>
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9188BE]" />
                      <input
                        type="text"
                        value={accessKey}
                        onChange={(e) => setAccessKey(e.target.value)}
                        placeholder={`e.g. SBJIT-CTRL-${department.includes("(") ? department.split("(")[1].replace(")", "") : "DEPT"}-8F3A-7E2D-9B4C-1A05`}
                        className="w-full bg-white border border-[#D5CBEE] rounded-xl pl-9 pr-3 py-2 text-[#1E2746] placeholder-[#9188BE] text-xs font-mono font-bold focus:outline-none focus:border-[#4B63D2]"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-[#4B63D2]/5 border border-[#4B63D2]/20 rounded-xl p-2.5 flex items-start gap-2 text-[11px] text-[#5851A4] font-medium">
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
                <div className="pt-3 border-t border-[#EAE4F7] space-y-2 animate-in fade-in duration-200">
                  <label className="block text-[11px] font-bold text-[#1E2746]">
                    Central Admin Master Security Key <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9188BE]" />
                    <input
                      type="text"
                      value={accessKey}
                      onChange={(e) => setAccessKey(e.target.value)}
                      placeholder="e.g. SBJIT-SUPER-ADMIN-9X8K-4M2P-7Q1W-5V3Z-9842"
                      className="w-full bg-white border border-[#D5CBEE] rounded-xl pl-9 pr-3 py-2 text-[#1E2746] placeholder-[#9188BE] text-xs font-mono font-bold focus:outline-none focus:border-[#4B63D2]"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-[#5851A4]">
                    Requires authorized SBJIT administrative master key for registration.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 2: COLLEGE EMAIL & OTP VERIFICATION                               */}
          {/* ========================================================================= */}
          <div className="space-y-3 bg-[#FAF9FD] p-4 rounded-2xl border border-[#EAE4F7]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1E2746] uppercase tracking-wider">
                2. Authorized College Email
              </label>
              <span className="text-[10px] font-bold text-[#4B63D2] bg-[#4B63D2]/10 px-2 py-0.5 rounded-full border border-[#4B63D2]/20">
                @sbjit.edu.in
              </span>
            </div>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE]" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setOtpSent(false);
                  setDemoOtpNotice(null);
                }}
                placeholder="yourname@sbjit.edu.in"
                className="w-full bg-white border border-[#D5CBEE] rounded-xl pl-10 pr-24 py-2.5 text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20 transition-all text-xs font-medium disabled:opacity-50"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp || otpCountdown > 0 || !email.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#4B63D2] hover:bg-[#3E53BE] disabled:bg-slate-200 disabled:text-slate-500 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
              >
                {sendingOtp ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : otpCountdown > 0 ? (
                  <span>{otpCountdown}s</span>
                ) : (
                  <span>{otpSent ? "Resend" : "Send OTP"}</span>
                )}
              </button>
            </div>
            {email && !isCollegeDomain(email) && (
              <p className="text-[11px] text-rose-600 font-semibold">
                ⚠️ Email must end with @sbjit.edu.in
              </p>
            )}

            {/* OTP Code Input */}
            {otpSent && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-2 pt-2 border-t border-[#EAE4F7]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#1E2746] uppercase tracking-wider">
                    Enter 6-Digit Email Verification Code
                  </label>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Code Dispatched
                  </span>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE]" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full bg-white border border-[#D5CBEE] rounded-xl pl-10 pr-4 py-2 text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] text-sm font-mono font-bold tracking-widest text-center"
                    required
                  />
                </div>

                {demoOtpNotice && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 text-[11px] text-emerald-800 flex items-center justify-between font-medium">
                    <span>
                      Demo OTP Code:{" "}
                      <strong className="font-mono font-bold text-emerald-950">
                        {demoOtpNotice}
                      </strong>
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100/60 px-1.5 py-0.5 rounded">
                      Auto-filled
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: ACCOUNT PASSWORD                                               */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1E2746] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] rounded-xl pl-10 pr-10 py-2.5 text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:bg-white focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20 transition-all text-xs font-medium disabled:opacity-50"
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
              <label className="block text-xs font-bold text-[#1E2746] uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE]" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] rounded-xl pl-10 pr-10 py-2.5 text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:bg-white focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20 transition-all text-xs font-medium disabled:opacity-50"
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
          <div className="space-y-3 bg-white p-4 rounded-2xl border border-[#EAE4F7] shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#EAE4F7] pb-2">
              <Phone className="w-4 h-4 text-[#4B63D2]" />
              <label className="text-xs font-bold text-[#1E2746] uppercase tracking-wider">
                3. Contact Information & Professional Links
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Phone Number */}
              <div>
                <label className="block text-[11px] font-bold text-[#5851A4] mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9188BE]" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-9 pr-3 py-2 text-[#1E2746] placeholder-[#9188BE] text-xs font-medium focus:outline-none focus:border-[#4B63D2]"
                  />
                </div>
              </div>

              {/* LinkedIn Link */}
              <div>
                <label className="block text-[11px] font-bold text-[#5851A4] mb-1">
                  LinkedIn Profile Link
                </label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9188BE]" />
                  <input
                    type="url"
                    value={linkedinProfile}
                    onChange={(e) => setLinkedinProfile(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-9 pr-3 py-2 text-[#1E2746] placeholder-[#9188BE] text-xs font-medium focus:outline-none focus:border-[#4B63D2]"
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
                  <label className="block text-[11px] font-bold text-[#5851A4] mb-1">
                    {selectedRole === "Faculty"
                      ? "Research / GitHub Profile Link"
                      : "GitHub Profile Link"}
                  </label>
                  <div className="relative">
                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9188BE]" />
                    <input
                      type="url"
                      value={githubProfile}
                      onChange={(e) => setGithubProfile(e.target.value)}
                      placeholder="https://github.com/username"
                      className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-9 pr-3 py-2 text-[#1E2746] placeholder-[#9188BE] text-xs font-medium focus:outline-none focus:border-[#4B63D2]"
                    />
                  </div>
                </div>
              )}

              {/* Coding Profiles ONLY for Students */}
              {selectedRole === "Student" && (
                <>
                  {/* LeetCode Link */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#5851A4] mb-1">
                      LeetCode Profile Link
                    </label>
                    <div className="relative">
                      <Code2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9188BE]" />
                      <input
                        type="url"
                        value={leetcodeProfile}
                        onChange={(e) => setLeetcodeProfile(e.target.value)}
                        placeholder="https://leetcode.com/u/username"
                        className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-9 pr-3 py-2 text-[#1E2746] placeholder-[#9188BE] text-xs font-medium focus:outline-none focus:border-[#4B63D2]"
                      />
                    </div>
                  </div>

                  {/* HackerRank Link */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#5851A4] mb-1">
                      HackerRank Profile Link
                    </label>
                    <div className="relative">
                      <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9188BE]" />
                      <input
                        type="url"
                        value={hackerrankProfile}
                        onChange={(e) => setHackerrankProfile(e.target.value)}
                        placeholder="https://hackerrank.com/profile/username"
                        className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-9 pr-3 py-2 text-[#1E2746] placeholder-[#9188BE] text-xs font-medium focus:outline-none focus:border-[#4B63D2]"
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
            <div className="space-y-3 bg-white p-4 rounded-2xl border border-[#EAE4F7] shadow-sm animate-in fade-in duration-200">
              <div className="flex items-center gap-2 border-b border-[#EAE4F7] pb-2">
                <Percent className="w-4 h-4 text-[#4B63D2]" />
                <label className="text-xs font-bold text-[#1E2746] uppercase tracking-wider">
                  4. Academic Marks & Qualifications
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* 10th Percentage */}
                <div>
                  <label className="block text-[11px] font-bold text-[#5851A4] mb-1">
                    10th Standard %
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9188BE]" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={tenthPercentage}
                      onChange={(e) => setTenthPercentage(e.target.value)}
                      placeholder="e.g. 88.5"
                      className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-9 pr-3 py-2 text-[#1E2746] placeholder-[#9188BE] text-xs font-medium focus:outline-none focus:border-[#4B63D2]"
                    />
                  </div>
                </div>

                {/* 12th or Diploma Score */}
                <div>
                  <div className="flex items-center justify-between mb-1">
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
                    <Calculator className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9188BE]" />
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
                      className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-9 pr-3 py-2 text-[#1E2746] placeholder-[#9188BE] text-xs font-medium focus:outline-none focus:border-[#4B63D2]"
                    />
                  </div>
                </div>

                {/* Current College GPA */}
                <div>
                  <label className="block text-[11px] font-bold text-[#5851A4] mb-1">
                    Current College CGPA
                  </label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9188BE]" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={collegeGpa}
                      onChange={(e) => setCollegeGpa(e.target.value)}
                      placeholder="e.g. 8.75"
                      className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-9 pr-3 py-2 text-[#1E2746] placeholder-[#9188BE] text-xs font-medium focus:outline-none focus:border-[#4B63D2]"
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
            className="w-full bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-3.5 font-bold text-xs transition-all flex items-center justify-center gap-2 mt-5 shadow-md shadow-[#4B63D2]/25 cursor-pointer active:scale-[0.99]"
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

