import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import KnotsLogo from "../components/common/KnotsLogo";
import InfoModal, { ModalType } from "../components/common/InfoModal";
import ThemeToggle from "../components/common/ThemeToggle";
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
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
      await apiRequest<{
        message: string;
        email: string;
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
      await apiRequest<{
        message: string;
        email: string;
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

  const emailError = getEmailError();
  const passwordError = getPasswordError();

  return (
    <div className="relative min-h-screen bg-[#FAF9FD] dark:bg-[#0B0F19] text-[#1E2746] dark:text-[#F1F5F9] flex flex-col font-sans select-none antialiased transition-colors duration-200 overflow-x-hidden">
      {/* Background Graphic with Soft Overlays */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src="/landing_bg.png"
          alt="KNOTS Academic Canvas"
          className="w-full h-full object-cover object-center opacity-90 dark:opacity-40 transform scale-100 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-white/25 dark:bg-[#0B0F19]/60" />
      </div>

      {/* ============================================================ */}
      {/* 1. TOP NAVBAR                                                */}
      {/* ============================================================ */}
      <header className="relative z-40 sticky top-0 w-full bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-[#EAE4F7] dark:border-[#1F2937] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Brand Logo & Tagline */}
          <Link to="/login" className="flex items-center gap-3 sm:gap-4 group">
            <KnotsLogo size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#1E2746] dark:text-[#F1F5F9] group-hover:text-[#4B63D2] transition-colors">
                  KNOTS
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-[#4B63D2] bg-[#4B63D2]/10 dark:bg-[#4B63D2]/20 px-2.5 py-0.5 rounded-full border border-[#4B63D2]/20">
                  SBJIT Campus Hub
                </span>
              </div>
              <p className="text-[11px] text-[#5851A4] dark:text-[#94A3B8] font-semibold tracking-wide hidden sm:block">
                Connect • Collaborate • Climb
              </p>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => setActiveInfoModal("about")}
              className="text-xs sm:text-sm font-bold text-[#5851A4] dark:text-[#94A3B8] hover:text-[#1E2746] dark:hover:text-[#F1F5F9] transition-colors cursor-pointer"
            >
              About
            </button>
            <button
              onClick={() => setActiveInfoModal("community")}
              className="text-xs sm:text-sm font-bold text-[#5851A4] dark:text-[#94A3B8] hover:text-[#1E2746] dark:hover:text-[#F1F5F9] transition-colors cursor-pointer"
            >
              Community
            </button>
            <button
              onClick={() => setActiveInfoModal("resources")}
              className="text-xs sm:text-sm font-bold text-[#5851A4] dark:text-[#94A3B8] hover:text-[#1E2746] dark:hover:text-[#F1F5F9] transition-colors cursor-pointer"
            >
              Resources
            </button>
          </nav>

          {/* Right Action */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            <span className="text-xs text-[#5851A4] dark:text-[#94A3B8] hidden sm:inline-block font-semibold">
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
      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        
        {/* LEFT SIDE: Knots Brand Narrative & Campus Community Highlights */}
        <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 order-2 lg:order-1">
          {/* Header Message */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4B63D2]/10 text-[#4B63D2] border border-[#4B63D2]/20 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Official Institutional Gateway</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1E2746] dark:text-[#F1F5F9] tracking-tight leading-tight">
              Welcome back to <span className="text-[#4B63D2]">Knots</span>.
            </h1>
            <p className="text-sm sm:text-base text-[#5851A4] dark:text-[#94A3B8] font-medium leading-relaxed max-w-lg">
              Reconnect with people, ideas and opportunities that matter to you across the SBJIT campus ecosystem.
            </p>
          </div>

          {/* Campus Students Banner Image */}
          <div className="w-full max-w-md sm:max-w-lg overflow-hidden rounded-2xl sm:rounded-3xl border border-[#EAE4F7] dark:border-[#1F2937] shadow-lg shadow-[#5851A4]/10 dark:shadow-black/30 group">
            <img
              src="/knots_campus_banner.jpg"
              alt="Knots Campus Community Collaboration"
              className="w-full h-auto object-cover transform group-hover:scale-[1.02] transition-transform duration-500"
              loading="eager"
            />
          </div>

          {/* Institutional Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md sm:max-w-lg">
            {[
              {
                icon: ShieldCheck,
                title: "100% Verified Members",
                desc: "Official SBJIT student & faculty network",
              },
              {
                icon: Building2,
                title: "Department Direct Connect",
                desc: "Access notices, HODs, and campus drives",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md border border-[#EAE4F7] dark:border-[#1F2937] shadow-sm text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-[#4B63D2]/10 text-[#4B63D2] dark:text-[#818CF8] flex items-center justify-center mb-2">
                  <item.icon className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-black text-[#1E2746] dark:text-white">
                  {item.title}
                </h4>
                <p className="text-[11px] text-[#5851A4] dark:text-[#94A3B8] font-medium mt-0.5">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE: Knots Clean Structured Login Card */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end order-1 lg:order-2">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] border border-[#EAE4F7] dark:border-[#1F2937] rounded-3xl shadow-xl shadow-[#5851A4]/10 dark:shadow-black/40 p-6 sm:p-8 lg:p-10">
            
            {/* Card Header */}
            <div className="mb-6 space-y-1 text-left">
              {authMode === "forgot" ? (
                <>
                  <h2 className="text-2xl font-black text-[#1E2746] dark:text-[#F1F5F9] tracking-tight">
                    Reset your password
                  </h2>
                  <p className="text-xs sm:text-sm text-[#5851A4] dark:text-[#94A3B8] font-semibold">
                    Enter your email to receive an authorized 6-digit OTP code.
                  </p>
                </>
              ) : authMode === "otp" ? (
                <>
                  <h2 className="text-2xl font-black text-[#1E2746] dark:text-[#F1F5F9] tracking-tight">
                    Sign in with Code
                  </h2>
                  <p className="text-xs sm:text-sm text-[#5851A4] dark:text-[#94A3B8] font-semibold">
                    Instant access using verified college email OTP.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-black text-[#1E2746] dark:text-[#F1F5F9] tracking-tight">
                    Welcome back
                  </h2>
                  <p className="text-xs sm:text-sm text-[#5851A4] dark:text-[#94A3B8] font-semibold">
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


            {/* ==================================================== */}
            {/* VIEW 1: Standard Password Login Form                 */}
            {/* ==================================================== */}
            {authMode === "password" && (
              <form onSubmit={handlePasswordLogin} className="space-y-4" noValidate>
                {/* Email Field */}
                <div className="space-y-1.5 text-left">
                  <label
                    htmlFor="knots-email"
                    className="block text-xs font-bold text-[#1E2746] dark:text-[#F1F5F9]"
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
                    className={`w-full h-12 px-4 rounded-xl text-sm text-[#1E2746] dark:text-[#F1F5F9] bg-white dark:bg-[#1E293B] border transition-all focus:outline-none focus:ring-2 ${
                      emailError
                        ? "border-rose-300 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-200 dark:focus:ring-rose-900/30"
                        : "border-[#EAE4F7] dark:border-[#334155] focus:border-[#4B63D2] focus:ring-[#4B63D2]/20"
                    }`}
                  />
                  {emailError && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1">
                      {emailError}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="knots-password"
                      className="block text-xs font-bold text-[#1E2746] dark:text-[#F1F5F9]"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setAuthMode("forgot");
                      }}
                      className="text-xs font-bold text-[#4B63D2] hover:text-[#5851A4] dark:hover:text-[#A5B4FC] hover:underline transition-colors cursor-pointer"
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
                      className={`w-full h-12 pl-4 pr-11 rounded-xl text-sm text-[#1E2746] dark:text-[#F1F5F9] bg-white dark:bg-[#1E293B] border transition-all focus:outline-none focus:ring-2 ${
                        passwordError
                          ? "border-rose-300 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-200 dark:focus:ring-rose-900/30"
                          : "border-[#EAE4F7] dark:border-[#334155] focus:border-[#4B63D2] focus:ring-[#4B63D2]/20"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5851A4] dark:text-[#94A3B8] hover:text-[#1E2746] dark:hover:text-[#F1F5F9] transition-colors p-1 rounded-lg"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1">
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
                      className="w-4 h-4 rounded text-[#4B63D2] border-[#EAE4F7] dark:border-[#334155] focus:ring-[#4B63D2]/20 accent-[#4B63D2]"
                    />
                    <span className="text-xs text-[#5851A4] dark:text-[#94A3B8] font-semibold">
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
                  <label htmlFor="otp-email-input" className="block text-xs font-bold text-[#1E2746] dark:text-[#F1F5F9]">
                    College Email Address
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="otp-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@sbjit.edu.in"
                      className="flex-1 h-12 px-4 rounded-xl text-sm text-[#1E2746] dark:text-[#F1F5F9] bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSendLoginOtp}
                      disabled={sendingOtp || loginOtpCountdown > 0}
                      className="px-3.5 h-12 bg-[#FAF9FD] dark:bg-[#1E293B] hover:bg-[#EAE4F7] dark:hover:bg-[#334155] text-[#4B63D2] text-xs font-bold rounded-xl border border-[#EAE4F7] dark:border-[#334155] transition-colors disabled:opacity-60 cursor-pointer flex-shrink-0"
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
                    <label htmlFor="login-otp-code" className="block text-xs font-bold text-[#1E2746] dark:text-[#F1F5F9]">
                      6-Digit Verification Code
                    </label>
                    <input
                      id="login-otp-code"
                      type="text"
                      maxLength={6}
                      value={loginOtp}
                      onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="Enter 6-digit code"
                      className="w-full h-12 px-4 rounded-xl text-base tracking-widest text-[#1E2746] dark:text-[#F1F5F9] bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20 focus:outline-none font-mono text-center font-bold"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !loginOtpSent || loginOtp.length < 6}
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
                    className="text-xs font-bold text-[#5851A4] dark:text-[#94A3B8] hover:text-[#1E2746] dark:hover:text-[#F1F5F9] flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
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
                  <label htmlFor="reset-email-input" className="block text-xs font-bold text-[#1E2746] dark:text-[#F1F5F9]">
                    Registered College Email
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="reset-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@sbjit.edu.in"
                      className="flex-1 h-12 px-4 rounded-xl text-sm text-[#1E2746] dark:text-[#F1F5F9] bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSendResetOtp}
                      disabled={sendingOtp || resetOtpCountdown > 0}
                      className="px-3.5 h-12 bg-[#FAF9FD] dark:bg-[#1E293B] hover:bg-[#EAE4F7] dark:hover:bg-[#334155] text-[#4B63D2] text-xs font-bold rounded-xl border border-[#EAE4F7] dark:border-[#334155] transition-colors disabled:opacity-60 cursor-pointer flex-shrink-0"
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
                      <label htmlFor="reset-otp-input" className="block text-xs font-bold text-[#1E2746] dark:text-[#F1F5F9]">
                        6-Digit Verification OTP
                      </label>
                      <input
                        id="reset-otp-input"
                        type="text"
                        maxLength={6}
                        value={resetOtp}
                        onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="Enter 6-digit code"
                        className="w-full h-12 px-4 rounded-xl text-base tracking-widest text-[#1E2746] dark:text-[#F1F5F9] bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20 focus:outline-none font-mono text-center font-bold"
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label htmlFor="reset-new-password" className="block text-xs font-bold text-[#1E2746] dark:text-[#F1F5F9]">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          id="reset-new-password"
                          type={showResetPassword ? "text" : "password"}
                          value={resetNewPassword}
                          onChange={(e) => setResetNewPassword(e.target.value)}
                          placeholder="Minimum 6 characters"
                          className="w-full h-12 pl-4 pr-11 rounded-xl text-sm text-[#1E2746] dark:text-[#F1F5F9] bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetPassword(!showResetPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5851A4] dark:text-[#94A3B8] hover:text-[#1E2746] dark:hover:text-[#F1F5F9] transition-colors p-1"
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
                    className="text-xs font-bold text-[#5851A4] dark:text-[#94A3B8] hover:text-[#1E2746] dark:hover:text-[#F1F5F9] flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to sign in
                  </button>
                </div>
              </form>
            )}

            {/* Divider & Social Login Options */}
            {authMode === "password" && (
              <div className="mt-6 pt-6 border-t border-[#EAE4F7] dark:border-[#1F2937] space-y-4">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#EAE4F7] dark:border-[#1F2937]" />
                  </div>
                  <span className="relative bg-white dark:bg-[#111827] px-3 text-[11px] font-bold uppercase tracking-wider text-[#5851A4] dark:text-[#94A3B8]">
                    or continue with
                  </span>
                </div>

                <div className="flex flex-col gap-2.5 w-full">
                  {/* Real Google OAuth Button */}
                  <div className="w-full flex justify-center [&>div]:!w-full [&>div>div]:!w-full [&_iframe]:!w-full [&_iframe]:!mx-auto">
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
                    className="w-full h-10 px-4 bg-white dark:bg-[#1E293B] hover:bg-[#FAF9FD] dark:hover:bg-[#334155] border border-[#EAE4F7] dark:border-[#334155] hover:border-[#C8B6E2] rounded-full text-xs font-bold text-[#1E2746] dark:text-[#F1F5F9] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Building2 className="w-4 h-4 text-[#4B63D2]" />
                    <span>Campus SSO (Institutional Gateway)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Create Account Link */}
            <div className="mt-6 pt-5 border-t border-[#EAE4F7] dark:border-[#1F2937] text-center">
              <p className="text-xs sm:text-sm text-[#5851A4] dark:text-[#94A3B8] font-medium">
                New to Knots?{" "}
                <Link
                  to="/register"
                  className="font-bold text-[#4B63D2] hover:text-[#5851A4] dark:hover:text-[#A5B4FC] hover:underline transition-colors"
                >
                  Create an account
                </Link>
              </p>
            </div>

          </div>
        </div>

      </main>

      {/* Information Dialog Modals */}
      <InfoModal
        type={activeInfoModal}
        onClose={() => setActiveInfoModal(null)}
      />
    </div>
  );
}

