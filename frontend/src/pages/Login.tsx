import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import KnotsLogo from "../components/common/KnotsLogo";
import InfoModal, { ModalType } from "../components/common/InfoModal";
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Users,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Building2,
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { apiRequest, ApiError } from "../services/api";

type AuthMode = "password" | "otp" | "forgot";

export default function Login() {
  const navigate = useNavigate();

  // Mode: password login, otp login, or forgot password
  const [authMode, setAuthMode] = useState<AuthMode>("password");
  const [activeInfoModal, setActiveInfoModal] = useState<ModalType>(null);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // OTP Login & Forgot Password States
  const [loginOtp, setLoginOtp] = useState("");
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginOtpCountdown, setLoginOtpCountdown] = useState(0);

  const [resetOtp, setResetOtp] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetOtpCountdown, setResetOtpCountdown] = useState(0);

  // Status & Feedback States
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [demoCodeNotice, setDemoCodeNotice] = useState<string | null>(null);

  // Field validation flags
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);

  // Countdown timers
  useEffect(() => {
    let timer: any;
    if (loginOtpCountdown > 0) {
      timer = setTimeout(() => setLoginOtpCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [loginOtpCountdown]);

  useEffect(() => {
    let timer: any;
    if (resetOtpCountdown > 0) {
      timer = setTimeout(() => setResetOtpCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resetOtpCountdown]);

  // Validation helpers
  const isValidEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim());
  };

  const isCollegeDomain = (emailStr: string) => {
    return emailStr.trim().toLowerCase().endsWith("@sbjit.edu.in");
  };

  const getEmailError = () => {
    if (!emailTouched || !email) return null;
    if (!isValidEmail(email)) return "Please enter a valid email address.";
    if (!isCollegeDomain(email)) {
      return "Only authorized college email addresses (@sbjit.edu.in) are permitted.";
    }
    return null;
  };

  const getPasswordError = () => {
    if (!passwordTouched || !password) return null;
    if (password.length < 6) return "Password must be at least 6 characters.";
    return null;
  };

  // Submit Direct Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setEmailTouched(true);
    setPasswordTouched(true);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Email address is required.");
      emailInputRef.current?.focus();
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError("Please enter a valid college email address.");
      return;
    }

    if (!isCollegeDomain(trimmedEmail)) {
      setError("Only authorized college email addresses (@sbjit.edu.in) are permitted.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest<{
        access_token: string;
        refresh_token: string;
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: trimmedEmail,
          password: password,
        }),
      });

      localStorage.setItem("knots_token", data.access_token);
      localStorage.setItem("knots_refresh_token", data.refresh_token);
      setSuccess("Login successful! Entering your Knots workspace...");
      setTimeout(() => {
        navigate("/");
      }, 700);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Invalid email or password. Please verify your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Dispatch OTP for Login
  const handleSendLoginOtp = async () => {
    setError(null);
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email address first.");
      return;
    }

    if (!isCollegeDomain(trimmedEmail)) {
      setError("Verification code can only be dispatched to @sbjit.edu.in accounts.");
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
          purpose: "login",
        }),
      });

      setLoginOtpSent(true);
      setLoginOtpCountdown(60);
      setSuccess("Verification code dispatched to your college inbox.");
      if (res.demo_otp) {
        setDemoCodeNotice(res.demo_otp);
        setLoginOtp(res.demo_otp);
      }
    } catch (err: any) {
      setError(err.message || "Failed to dispatch verification code.");
    } finally {
      setSendingOtp(false);
    }
  };

  // Submit OTP Login
  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !loginOtp.trim()) {
      setError("Please enter your email and 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest<{
        access_token: string;
        refresh_token: string;
      }>("/auth/login-otp", {
        method: "POST",
        body: JSON.stringify({
          email: trimmedEmail,
          otp: loginOtp.trim(),
        }),
      });

      localStorage.setItem("knots_token", data.access_token);
      localStorage.setItem("knots_refresh_token", data.refresh_token);
      setSuccess("Verification successful! Opening your Knots dashboard...");
      setTimeout(() => {
        navigate("/");
      }, 700);
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  // Dispatch OTP for Reset Password
  const handleSendResetOtp = async () => {
    setError(null);
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !isValidEmail(trimmedEmail) || !isCollegeDomain(trimmedEmail)) {
      setError("Please enter your registered @sbjit.edu.in college email.");
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
          purpose: "reset",
        }),
      });

      setResetOtpSent(true);
      setResetOtpCountdown(60);
      setSuccess("Password reset OTP code dispatched to your inbox.");
      if (res.demo_otp) {
        setDemoCodeNotice(res.demo_otp);
        setResetOtp(res.demo_otp);
      }
    } catch (err: any) {
      setError(err.message || "Failed to dispatch reset code.");
    } finally {
      setSendingOtp(false);
    }
  };

  // Submit Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !isCollegeDomain(trimmedEmail)) {
      setError("Please enter a valid @sbjit.edu.in email address.");
      return;
    }

    if (!resetOtp.trim() || resetOtp.trim().length < 6) {
      setError("Please enter the 6-digit OTP verification code.");
      return;
    }

    if (resetNewPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email: trimmedEmail,
          otp: resetOtp.trim(),
          new_password: resetNewPassword,
        }),
      });

      setSuccess("Password updated successfully! You can now sign in.");
      setTimeout(() => {
        setAuthMode("password");
        setPassword("");
        setSuccess(null);
        setResetOtpSent(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Password reset failed. Please verify your OTP code.");
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In Success Handler
  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse?.credential) {
      setError("Failed to retrieve Google credentials.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await apiRequest<{
        access_token: string;
        refresh_token: string;
      }>("/auth/google", {
        method: "POST",
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      localStorage.setItem("knots_token", data.access_token);
      localStorage.setItem("knots_refresh_token", data.refresh_token);
      setSuccess("Google account verified! Entering your Knots workspace...");
      setTimeout(() => {
        navigate("/");
      }, 700);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Only official college email accounts (@sbjit.edu.in) are permitted.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Mock SSO handler
  const handleSocialLogin = (provider: string) => {
    setError(null);
    setSuccess(`${provider} authentication initiated. Connecting to campus SSO...`);
    setTimeout(() => {
      setSuccess(null);
      setEmail("student@sbjit.edu.in");
      setPassword("password123");
    }, 1000);
  };

  // Quick Demo account auto-filler
  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setEmailTouched(true);
    setPasswordTouched(true);
    setError(null);
    setAuthMode("password");
  };

  const emailError = getEmailError();
  const passwordError = getPasswordError();

  return (
    <div className="min-h-screen bg-[#F8F6FD] text-[#1E2746] flex flex-col font-sans select-none antialiased">
      {/* ============================================================ */}
      {/* 1. TOP NAVBAR                                                */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#EAE4F7] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Brand Logo & Tagline */}
          <Link to="/login" className="flex items-center gap-3 sm:gap-4 group">
            <KnotsLogo size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#1E2746] group-hover:text-[#4B63D2] transition-colors">
                  KNOTS
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-[#4B63D2] bg-[#4B63D2]/10 px-2.5 py-0.5 rounded-full border border-[#4B63D2]/20">
                  SBJIT Campus Hub
                </span>
              </div>
              <p className="text-[11px] text-[#5851A4] font-semibold tracking-wide hidden sm:block">
                Connect • Collaborate • Climb
              </p>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => setActiveInfoModal("about")}
              className="text-xs sm:text-sm font-bold text-[#5851A4] hover:text-[#1E2746] transition-colors cursor-pointer"
            >
              About
            </button>
            <button
              onClick={() => setActiveInfoModal("community")}
              className="text-xs sm:text-sm font-bold text-[#5851A4] hover:text-[#1E2746] transition-colors cursor-pointer"
            >
              Community
            </button>
            <button
              onClick={() => setActiveInfoModal("resources")}
              className="text-xs sm:text-sm font-bold text-[#5851A4] hover:text-[#1E2746] transition-colors cursor-pointer"
            >
              Resources
            </button>
          </nav>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#5851A4] hidden sm:inline-block font-semibold">
              Don't have an account?
            </span>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-[#4B63D2]/25 hover:shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <span>Join Knots</span>
              <ArrowRight className="w-4 h-4 text-[#FFD21A]" />
            </Link>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. MAIN LOGIN AREA (Two-part Desktop Composition)            */}
      {/* ============================================================ */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        
        {/* LEFT SIDE: Knots Brand Narrative & Campus Community Visual */}
        <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 order-2 lg:order-1">
          {/* Header Message */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4B63D2]/10 text-[#4B63D2] border border-[#4B63D2]/20 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Official Institutional Gateway</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1E2746] tracking-tight leading-tight">
              Welcome back to <span className="text-[#4B63D2]">Knots</span>.
            </h1>
            <p className="text-sm sm:text-base text-[#5851A4] font-medium leading-relaxed max-w-lg">
              Reconnect with people, ideas and opportunities that matter to you across the SBJIT campus ecosystem.
            </p>
          </div>

          {/* Campus Community Image Showcase with Knots Badges */}
          <div className="relative w-full max-w-md sm:max-w-lg rounded-3xl overflow-hidden bg-white border border-[#EAE4F7] shadow-xl shadow-[#5851A4]/10 p-3 sm:p-4 group">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-[#FAF9FD]">
              <img
                src="/campus_collaboration.jpg"
                alt="College students networking, collaborating and communicating on campus"
                className="w-full h-full object-cover object-center transform group-hover:scale-[1.02] transition-transform duration-700 ease-out"
              />
            </div>

            {/* Knots Campus Community Badge */}
            <div className="absolute -bottom-3 left-6 sm:left-8 bg-white/95 backdrop-blur-md border border-[#EAE4F7] shadow-lg rounded-2xl px-4 py-2.5 flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-[#4B63D2]/10 flex items-center justify-center text-[#4B63D2]">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-[#1E2746]">
                  Campus Community
                </p>
                <p className="text-[10px] font-semibold text-[#5851A4]">
                  Students • Faculty • Management • Alumni
                </p>
              </div>
            </div>

            {/* Knots Verified Badge */}
            <div className="absolute -top-3 right-6 sm:right-8 bg-white/95 backdrop-blur-md border border-[#EAE4F7] shadow-lg rounded-2xl px-3.5 py-1.5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FFD21A]" />
              <span className="text-xs font-bold text-[#1E2746]">
                Authorized SBJIT Portal
              </span>
            </div>
          </div>

          {/* Fast Stats Row */}
          <div className="w-full max-w-lg grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-white rounded-2xl border border-[#EAE4F7] text-center shadow-xs">
              <span className="text-lg font-black text-[#4B63D2]">12.4k+</span>
              <p className="text-[10px] font-bold text-[#5851A4] mt-0.5">Active Ties</p>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-[#EAE4F7] text-center shadow-xs">
              <span className="text-lg font-black text-[#5851A4]">340+</span>
              <p className="text-[10px] font-bold text-[#5851A4] mt-0.5">Placements</p>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-[#EAE4F7] text-center shadow-xs">
              <span className="text-lg font-black text-[#4B63D2]">52+</span>
              <p className="text-[10px] font-bold text-[#5851A4] mt-0.5">Clubs & Orgs</p>
            </div>
          </div>

          {/* Quick Demo Role Selector for Testing */}
          <div className="w-full max-w-lg pt-4 border-t border-[#EAE4F7] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#5851A4]">
              <span className="flex items-center gap-1.5 text-[#1E2746]">
                <UserCheck className="w-3.5 h-3.5 text-[#4B63D2]" />
                Demo Credentials Quick-Fill:
              </span>
              <span className="text-[11px] font-medium text-[#5851A4]">1-click auto-fill</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Student", email: "student@sbjit.edu.in", pass: "password123" },
                { label: "Alumni", email: "alumni@sbjit.edu.in", pass: "password123" },
                { label: "Faculty", email: "faculty@sbjit.edu.in", pass: "password123" },
                { label: "Admin", email: "admin@sbjit.edu.in", pass: "password123" },
                { label: "Controller", email: "controller@sbjit.edu.in", pass: "password123" },
              ].map((role) => (
                <button
                  key={role.label}
                  type="button"
                  onClick={() => handleQuickFill(role.email, role.pass)}
                  className="px-3 py-1.5 bg-white hover:bg-[#FAF9FD] text-[#1E2746] hover:text-[#4B63D2] border border-[#EAE4F7] hover:border-[#4B63D2] rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Knots Clean Structured Login Card */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end order-1 lg:order-2">
          <div className="w-full max-w-md bg-white border border-[#EAE4F7] rounded-3xl shadow-xl shadow-[#5851A4]/10 p-6 sm:p-8 lg:p-10">
            
            {/* Card Header */}
            <div className="mb-6 space-y-1 text-left">
              {authMode === "forgot" ? (
                <>
                  <h2 className="text-2xl font-black text-[#1E2746] tracking-tight">
                    Reset your password
                  </h2>
                  <p className="text-xs sm:text-sm text-[#5851A4] font-semibold">
                    Enter your email to receive an authorized 6-digit OTP code.
                  </p>
                </>
              ) : authMode === "otp" ? (
                <>
                  <h2 className="text-2xl font-black text-[#1E2746] tracking-tight">
                    Sign in with Code
                  </h2>
                  <p className="text-xs sm:text-sm text-[#5851A4] font-semibold">
                    Instant access using verified college email OTP.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-black text-[#1E2746] tracking-tight">
                    Welcome back
                  </h2>
                  <p className="text-xs sm:text-sm text-[#5851A4] font-semibold">
                    Sign in to continue to Knots.
                  </p>
                </>
              )}
            </div>

            {/* Error & Success Feedback Alerts */}
            {error && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span className="leading-snug font-medium">{error}</span>
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="leading-snug font-medium">{success}</span>
              </div>
            )}

            {demoCodeNotice && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-center justify-between">
                <span>Demo OTP Code: <strong>{demoCodeNotice}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    if (authMode === "otp") setLoginOtp(demoCodeNotice);
                    if (authMode === "forgot") setResetOtp(demoCodeNotice);
                  }}
                  className="font-bold underline text-amber-900 cursor-pointer"
                >
                  Auto-Fill
                </button>
              </div>
            )}

            {/* ==================================================== */}
            {/* VIEW 1: Standard Password Login Form                 */}
            {/* ==================================================== */}
            {authMode === "password" && (
              <form onSubmit={handlePasswordLogin} className="space-y-4" noValidate>
                {/* Email Field */}
                <div className="space-y-1.5 text-left">
                  <label
                    htmlFor="knots-email"
                    className="block text-xs font-bold text-[#1E2746]"
                  >
                    College Email Address
                  </label>
                  <input
                    id="knots-email"
                    ref={emailInputRef}
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    placeholder="name@sbjit.edu.in"
                    className={`w-full h-12 px-4 rounded-xl text-sm text-[#1E2746] bg-white border transition-all focus:outline-none focus:ring-2 ${
                      emailError
                        ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
                        : "border-[#EAE4F7] focus:border-[#4B63D2] focus:ring-[#4B63D2]/20"
                    }`}
                  />
                  {emailError && (
                    <p className="text-xs text-rose-600 font-semibold mt-1">
                      {emailError}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="knots-password"
                      className="block text-xs font-bold text-[#1E2746]"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setAuthMode("forgot");
                      }}
                      className="text-xs font-bold text-[#4B63D2] hover:text-[#5851A4] hover:underline transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="knots-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => setPasswordTouched(true)}
                      placeholder="Enter your password"
                      className={`w-full h-12 pl-4 pr-11 rounded-xl text-sm text-[#1E2746] bg-white border transition-all focus:outline-none focus:ring-2 ${
                        passwordError
                          ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
                          : "border-[#EAE4F7] focus:border-[#4B63D2] focus:ring-[#4B63D2]/20"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5851A4] hover:text-[#1E2746] transition-colors p-1 rounded-lg"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-xs text-rose-600 font-semibold mt-1">
                      {passwordError}
                    </p>
                  )}
                </div>

                {/* Remember Me & Secondary OTP Mode */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-[#4B63D2] border-[#EAE4F7] focus:ring-[#4B63D2]/20 accent-[#4B63D2]"
                    />
                    <span className="text-xs text-[#5851A4] font-semibold">
                      Remember this device
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setAuthMode("otp");
                    }}
                    className="text-xs font-bold text-[#4B63D2] hover:underline cursor-pointer"
                  >
                    Sign in with OTP
                  </button>
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white text-sm font-bold rounded-xl shadow-md shadow-[#4B63D2]/25 hover:shadow-lg transition-all transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4 text-[#FFD21A]" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ==================================================== */}
            {/* VIEW 2: OTP / Passwordless Sign In Form              */}
            {/* ==================================================== */}
            {authMode === "otp" && (
              <form onSubmit={handleOtpLogin} className="space-y-4" noValidate>
                <div className="space-y-1.5 text-left">
                  <label htmlFor="otp-email-input" className="block text-xs font-bold text-[#1E2746]">
                    College Email Address
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="otp-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@sbjit.edu.in"
                      className="flex-1 h-12 px-4 rounded-xl text-sm text-[#1E2746] bg-white border border-[#EAE4F7] focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSendLoginOtp}
                      disabled={sendingOtp || loginOtpCountdown > 0}
                      className="px-3.5 h-12 bg-[#FAF9FD] hover:bg-[#EAE4F7] text-[#4B63D2] text-xs font-bold rounded-xl border border-[#EAE4F7] transition-colors disabled:opacity-60 cursor-pointer flex-shrink-0"
                    >
                      {sendingOtp ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : loginOtpCountdown > 0 ? (
                        `${loginOtpCountdown}s`
                      ) : loginOtpSent ? (
                        "Resend"
                      ) : (
                        "Send Code"
                      )}
                    </button>
                  </div>
                </div>

                {loginOtpSent && (
                  <div className="space-y-1.5 text-left animate-in fade-in duration-200">
                    <label htmlFor="login-otp-code" className="block text-xs font-bold text-[#1E2746]">
                      6-Digit Verification Code
                    </label>
                    <input
                      id="login-otp-code"
                      type="text"
                      maxLength={6}
                      value={loginOtp}
                      onChange={(e) => setLoginOtp(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="w-full h-12 px-4 rounded-xl text-base tracking-widest text-[#1E2746] bg-white border border-[#EAE4F7] focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20 focus:outline-none font-mono text-center font-bold"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !loginOtpSent}
                  className="w-full h-12 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white text-sm font-bold rounded-xl shadow-md shadow-[#4B63D2]/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify & Enter</span>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setAuthMode("password");
                    }}
                    className="text-xs font-bold text-[#5851A4] hover:text-[#1E2746] flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to password login
                  </button>
                </div>
              </form>
            )}

            {/* ==================================================== */}
            {/* VIEW 3: Forgot Password Reset Flow                   */}
            {/* ==================================================== */}
            {authMode === "forgot" && (
              <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
                <div className="space-y-1.5 text-left">
                  <label htmlFor="reset-email-input" className="block text-xs font-bold text-[#1E2746]">
                    Registered College Email
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="reset-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@sbjit.edu.in"
                      className="flex-1 h-12 px-4 rounded-xl text-sm text-[#1E2746] bg-white border border-[#EAE4F7] focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSendResetOtp}
                      disabled={sendingOtp || resetOtpCountdown > 0}
                      className="px-3.5 h-12 bg-[#FAF9FD] hover:bg-[#EAE4F7] text-[#4B63D2] text-xs font-bold rounded-xl border border-[#EAE4F7] transition-colors disabled:opacity-60 cursor-pointer flex-shrink-0"
                    >
                      {sendingOtp ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : resetOtpCountdown > 0 ? (
                        `${resetOtpCountdown}s`
                      ) : resetOtpSent ? (
                        "Resend"
                      ) : (
                        "Send OTP"
                      )}
                    </button>
                  </div>
                </div>

                {resetOtpSent && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-1.5 text-left">
                      <label htmlFor="reset-otp-input" className="block text-xs font-bold text-[#1E2746]">
                        6-Digit Verification OTP
                      </label>
                      <input
                        id="reset-otp-input"
                        type="text"
                        maxLength={6}
                        value={resetOtp}
                        onChange={(e) => setResetOtp(e.target.value)}
                        placeholder="Enter 6-digit code"
                        className="w-full h-12 px-4 rounded-xl text-base tracking-widest text-[#1E2746] bg-white border border-[#EAE4F7] focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20 focus:outline-none font-mono text-center font-bold"
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label htmlFor="reset-new-password" className="block text-xs font-bold text-[#1E2746]">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          id="reset-new-password"
                          type={showResetPassword ? "text" : "password"}
                          value={resetNewPassword}
                          onChange={(e) => setResetNewPassword(e.target.value)}
                          placeholder="Minimum 6 characters"
                          className="w-full h-12 pl-4 pr-11 rounded-xl text-sm text-[#1E2746] bg-white border border-[#EAE4F7] focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetPassword(!showResetPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5851A4] hover:text-[#1E2746] transition-colors p-1"
                        >
                          {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white text-sm font-bold rounded-xl shadow-md shadow-[#4B63D2]/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Updating password...</span>
                        </>
                      ) : (
                        <span>Update Password & Sign In</span>
                      )}
                    </button>
                  </div>
                )}

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setAuthMode("password");
                    }}
                    className="text-xs font-bold text-[#5851A4] hover:text-[#1E2746] flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to sign in
                  </button>
                </div>
              </form>
            )}

            {/* Divider & Social Login Options */}
            {authMode === "password" && (
              <div className="mt-6 pt-6 border-t border-[#EAE4F7] space-y-4">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#EAE4F7]" />
                  </div>
                  <span className="relative bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-[#5851A4]">
                    or continue with
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                  {/* Real Google OAuth Button */}
                  <div className="flex-1 w-full flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => {
                        setError("Google Sign-In was cancelled or failed.");
                      }}
                      text="continue_with"
                      shape="pill"
                      theme="outline"
                      size="large"
                      width="100%"
                    />
                  </div>

                  {/* Campus SSO Button */}
                  <button
                    type="button"
                    onClick={() => handleSocialLogin("Campus SSO")}
                    className="h-10 px-4 w-full sm:w-auto bg-white hover:bg-[#FAF9FD] border border-[#EAE4F7] hover:border-[#C8B6E2] rounded-full text-xs font-bold text-[#1E2746] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs flex-shrink-0"
                  >
                    <Building2 className="w-4 h-4 text-[#4B63D2]" />
                    <span>Campus SSO</span>
                  </button>
                </div>
              </div>
            )}

            {/* Create Account Link */}
            <div className="mt-6 pt-5 border-t border-[#EAE4F7] text-center">
              <p className="text-xs sm:text-sm text-[#5851A4] font-medium">
                New to Knots?{" "}
                <Link
                  to="/register"
                  className="font-bold text-[#4B63D2] hover:text-[#5851A4] hover:underline transition-colors"
                >
                  Create an account
                </Link>
              </p>
            </div>

          </div>
        </div>

      </main>

      {/* ============================================================ */}
      {/* 3. FOOTER                                                    */}
      {/* ============================================================ */}
      <footer className="w-full bg-white border-t border-[#EAE4F7] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <KnotsLogo size="sm" />
            <span className="text-sm font-black text-[#1E2746]">KNOTS</span>
            <span className="text-[#C8B6E2]">|</span>
            <p className="text-xs text-[#5851A4] font-medium">
              Connecting people, ideas and opportunities.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-bold text-[#5851A4]">
            <button
              onClick={() => setActiveInfoModal("about")}
              className="hover:text-[#1E2746] transition-colors cursor-pointer"
            >
              About
            </button>
            <button
              onClick={() => setActiveInfoModal("help")}
              className="hover:text-[#1E2746] transition-colors cursor-pointer"
            >
              Help & Support
            </button>
            <button
              onClick={() => setActiveInfoModal("privacy")}
              className="hover:text-[#1E2746] transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setActiveInfoModal("terms")}
              className="hover:text-[#1E2746] transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              onClick={() => setActiveInfoModal("contact")}
              className="hover:text-[#1E2746] transition-colors cursor-pointer"
            >
              Contact
            </button>
            <span className="text-[#5851A4]/60 font-normal">
              © {new Date().getFullYear()} Knots. All rights reserved.
            </span>
          </div>
        </div>
      </footer>

      {/* Information Dialog Modals */}
      <InfoModal
        type={activeInfoModal}
        onClose={() => setActiveInfoModal(null)}
      />
    </div>
  );
}
