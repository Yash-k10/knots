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
} from "lucide-react";
import { apiRequest, ApiError } from "../services/api";

type RoleOption = "Student" | "Faculty" | "Management" | "Alumni";

export default function Register() {
  const navigate = useNavigate();

  // Role Selection
  const [selectedRole, setSelectedRole] = useState<RoleOption>("Student");
  const [roleId, setRoleId] = useState<number>(2); // Default to Student (2)

  // Primary Form Fields
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 1. Contact & Coding Profile Details
  const [phoneNumber, setPhoneNumber] = useState("");
  const [githubProfile, setGithubProfile] = useState("");
  const [linkedinProfile, setLinkedinProfile] = useState("");
  const [leetcodeProfile, setLeetcodeProfile] = useState("");
  const [hackerrankProfile, setHackerrankProfile] = useState("");

  // 2. Educational Qualifications
  const [tenthPercentage, setTenthPercentage] = useState("");
  const [qualificationType, setQualificationType] = useState<"12th" | "diploma">("12th");
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

  const handleRoleSelect = (role: RoleOption) => {
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
      setError("Only authorized college email addresses ending with @sbjit.edu.in are permitted.");
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

  // Step 2: Register Account with Verified OTP, Password, Contact & Education Details
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
      setError("Only authorized college email addresses (@sbjit.edu.in) are allowed to register.");
      return;
    }
    if (!otpSent || !otp.trim() || otp.trim().length < 6) {
      setError("Please send and enter the 6-digit OTP verification code sent to your email.");
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

    setLoading(true);
    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: trimmedEmail,
          password: password,
          role_id: roleId,
          otp: otp.trim(),
          // 1. Contact Details
          phone_number: phoneNumber.trim() || null,
          github_profile: githubProfile.trim() || null,
          linkedin_profile: linkedinProfile.trim() || null,
          leetcode_profile: leetcodeProfile.trim() || null,
          hackerrank_profile: hackerrankProfile.trim() || null,
          // 2. Educational Qualifications
          tenth_percentage: tenthPercentage ? parseFloat(tenthPercentage) : null,
          twelfth_or_diploma_percentage: twelfthOrDiplomaScore ? parseFloat(twelfthOrDiplomaScore) : null,
          gpa: collegeGpa ? parseFloat(collegeGpa) : null,
        }),
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
              Registration & Verification Successful!
            </h2>
            <p className="text-[#5851A4] text-xs sm:text-sm font-medium">
              Your verified profile for <strong className="text-[#1E2746]">{email}</strong> has been saved with your contact & academic details as <strong className="text-[#1E2746]">{selectedRole}</strong>.
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
                { key: "Management", label: "Management", icon: Building },
                { key: "Alumni", label: "Alumni", icon: Award },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = selectedRole === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleRoleSelect(item.key as RoleOption)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#4B63D2] border-[#4B63D2] text-white shadow-sm shadow-[#4B63D2]/30 scale-[1.02]"
                        : "bg-[#FAF9FD] border-[#EAE4F7] text-[#5851A4] hover:bg-white hover:border-[#C8B6E2] hover:text-[#1E2746]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1.5 ${isSelected ? "text-[#FFD21A]" : "text-[#5851A4]"}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

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
                    <span>Demo OTP Code: <strong className="font-mono font-bold text-emerald-950">{demoOtpNotice}</strong></span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100/60 px-1.5 py-0.5 rounded">Auto-filled</span>
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
                  {showPassword ? <EyeOff className="w-4 h-4 text-[#4B63D2]" /> : <Eye className="w-4 h-4" />}
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
                  {showConfirmPassword ? <EyeOff className="w-4 h-4 text-[#4B63D2]" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 4: CONTACT & PROFESSIONAL CODING PROFILES                         */}
          {/* ========================================================================= */}
          <div className="space-y-3 bg-white p-4 rounded-2xl border border-[#EAE4F7] shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#EAE4F7] pb-2">
              <Phone className="w-4 h-4 text-[#4B63D2]" />
              <label className="text-xs font-bold text-[#1E2746] uppercase tracking-wider">
                3. Contact Details & Coding Profiles
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

              {/* GitHub Link */}
              <div>
                <label className="block text-[11px] font-bold text-[#5851A4] mb-1">
                  GitHub Profile Link
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
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 5: EDUCATIONAL QUALIFICATIONS                                     */}
          {/* ========================================================================= */}
          <div className="space-y-3 bg-white p-4 rounded-2xl border border-[#EAE4F7] shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#EAE4F7] pb-2">
              <Percent className="w-4 h-4 text-[#4B63D2]" />
              <label className="text-xs font-bold text-[#1E2746] uppercase tracking-wider">
                4. Educational Qualifications
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
                    {qualificationType === "12th" ? "12th Standard %" : "Diploma % / GPA"}
                  </label>
                  <button
                    type="button"
                    onClick={() => setQualificationType(qualificationType === "12th" ? "diploma" : "12th")}
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
                    placeholder={qualificationType === "12th" ? "e.g. 85.2" : "e.g. 8.9 / 89%"}
                    className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-9 pr-3 py-2 text-[#1E2746] placeholder-[#9188BE] text-xs font-medium focus:outline-none focus:border-[#4B63D2]"
                  />
                </div>
              </div>

              {/* Current College GPA (Optional) */}
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
                <span>Complete Registration as {selectedRole}</span>
                <ArrowRight className="h-4 w-4 text-[#FFD21A]" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[#5851A4] text-xs mt-6 font-medium border-t border-[#EAE4F7] pt-4">
          Already registered and verified?{" "}
          <Link to="/login#signin" className="text-[#4B63D2] font-black hover:text-[#3E53BE] hover:underline">
            Sign In with Password
          </Link>
        </p>
      </div>
    </div>
  );
}
