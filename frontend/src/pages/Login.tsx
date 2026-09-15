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

  // Newsletter Subscription State
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState<string | null>(null);

  const handleNewsletterSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !isValidEmail(newsletterEmail)) {
      setNewsletterMessage("Please enter a valid college email address.");
      setTimeout(() => setNewsletterMessage(null), 3000);
      return;
    }
    setNewsletterMessage("Subscribed to campus alerts!");
    setNewsletterEmail("");
    setTimeout(() => setNewsletterMessage(null), 3500);
  };

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
                    className="h-10 px-4 w-full sm:w-auto bg-white dark:bg-[#1E293B] hover:bg-[#FAF9FD] dark:hover:bg-[#334155] border border-[#EAE4F7] dark:border-[#334155] hover:border-[#C8B6E2] rounded-full text-xs font-bold text-[#1E2746] dark:text-[#F1F5F9] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs flex-shrink-0"
                  >
                    <Building2 className="w-4 h-4 text-[#4B63D2]" />
                    <span>Campus SSO</span>
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

      {/* ============================================================ */}
      {/* 3. MULTI-COLUMN KNOTS FOOTER                                 */}
      {/* ============================================================ */}
      <footer className="relative z-10 w-full bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-t border-[#EAE4F7] dark:border-[#1F2937] mt-auto">
        <div className="max-w-7xl mx-auto pt-12 pb-6 px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Brand column */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <KnotsLogo size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-[#1E2746] dark:text-[#F1F5F9] tracking-tight">KNOTS</span>
                    <span className="text-[10px] font-bold text-[#4B63D2] bg-[#4B63D2]/10 dark:bg-[#4B63D2]/20 px-2 py-0.5 rounded-full border border-[#4B63D2]/20">
                      SBJIT Hub
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5851A4] dark:text-[#94A3B8] font-semibold">Connect • Collaborate • Climb</p>
                </div>
              </div>

              <p className="text-sm text-[#5851A4] dark:text-[#94A3B8] leading-relaxed">
                Knots is the dedicated institutional networking ecosystem for S.B. Jain Institute of Technology. Connecting students, faculty, departments, and alumni for career growth, capstones, and collaboration.
              </p>

              {/* Social Icons */}
              <div className="flex items-center gap-3 pt-1">
                {/* LinkedIn */}
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="w-8 h-8 rounded-xl bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] hover:border-[#4B63D2] hover:bg-[#4B63D2] text-[#5851A4] dark:text-[#94A3B8] hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-xs"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M4.98 3.5C3.88 3.5 3 4.38 3 5.48c0 1.1.88 1.98 1.98 1.98h.02c1.1 0 1.98-.88 1.98-1.98C6.98 4.38 6.1 3.5 4.98 3.5zM3 8.75h3.96V21H3V8.75zm6.25 0h3.8v1.68h.05c.53-.98 1.82-2.02 3.75-2.02 4.01 0 4.75 2.64 4.75 6.07V21H17v-5.63c0-1.34-.03-3.07-1.88-3.07-1.88 0-2.17 1.47-2.17 2.98V21H9.25V8.75z" />
                  </svg>
                </a>

                {/* GitHub */}
                <a
                  href="https://github.com/Yash-k10/knots"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="w-8 h-8 rounded-xl bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] hover:border-[#4B63D2] hover:bg-[#4B63D2] text-[#5851A4] dark:text-[#94A3B8] hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-xs"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </a>

                {/* Twitter / X */}
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter / X"
                  className="w-8 h-8 rounded-xl bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] hover:border-[#4B63D2] hover:bg-[#4B63D2] text-[#5851A4] dark:text-[#94A3B8] hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-xs"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M22 5.92a8.2 8.2 0 01-2.36.65A4.1 4.1 0 0021.4 4a8.27 8.27 0 01-2.6 1A4.14 4.14 0 0016 4a4.15 4.15 0 00-4.15 4.15c0 .32.04.64.1.94a11.75 11.75 0 01-8.52-4.32 4.14 4.14 0 001.29 5.54A4.1 4.1 0 013 10v.05a4.15 4.15 0 003.33 4.07 4.12 4.12 0 01-1.87.07 4.16 4.16 0 003.88 2.89A8.33 8.33 0 012 19.56a11.72 11.72 0 006.29 1.84c7.55 0 11.68-6.25 11.68-11.67 0-.18 0-.35-.01-.53A8.18 8.18 0 0022 5.92z" />
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-8 h-8 rounded-xl bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] hover:border-[#4B63D2] hover:bg-[#4B63D2] text-[#5851A4] dark:text-[#94A3B8] hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-xs"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M7.75 2A5.75 5.75 0 002 7.75v8.5A5.75 5.75 0 007.75 22h8.5A5.75 5.75 0 0022 16.25v-8.5A5.75 5.75 0 0016.25 2h-8.5zM4.5 7.75A3.25 3.25 0 017.75 4.5h8.5a3.25 3.25 0 013.25 3.25v8.5a3.25 3.25 0 01-3.25 3.25h-8.5a3.25 3.25 0 01-3.25-3.25v-8.5zm9.5 1a4 4 0 11-4 4 4 4 0 014-4zm0 1.5a2.5 2.5 0 102.5 2.5 2.5 2.5 0 00-2.5-2.5zm3.5-.75a.75.75 0 11.75-.75.75.75 0 01-.75.75z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Column 2: ECOSYSTEM */}
            <div className="lg:col-span-2 space-y-3">
              <p className="text-xs font-black tracking-wider text-[#1E2746] dark:text-[#F1F5F9] uppercase">Ecosystem</p>
              <ul className="space-y-2.5 text-sm text-[#5851A4] dark:text-[#94A3B8]">
                <li>
                  <button
                    onClick={() => setActiveInfoModal("about")}
                    className="hover:text-[#4B63D2] transition-colors cursor-pointer text-left"
                  >
                    About Knots
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveInfoModal("community")}
                    className="hover:text-[#4B63D2] transition-colors cursor-pointer text-left"
                  >
                    Campus Community
                  </button>
                </li>
                <li>
                  <Link to="/register" className="hover:text-[#4B63D2] transition-colors">
                    Join Network
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => setActiveInfoModal("resources")}
                    className="hover:text-[#4B63D2] transition-colors cursor-pointer text-left"
                  >
                    Career Resources
                  </button>
                </li>
                <li>
                  <span className="text-[#5851A4]/60 dark:text-[#94A3B8]/60 text-xs">Clubs & Capstones</span>
                </li>
              </ul>
            </div>

            {/* Column 3: SUPPORT & LEGAL */}
            <div className="lg:col-span-2 space-y-3">
              <p className="text-xs font-black tracking-wider text-[#1E2746] dark:text-[#F1F5F9] uppercase">Support</p>
              <ul className="space-y-2.5 text-sm text-[#5851A4] dark:text-[#94A3B8]">
                <li>
                  <button
                    onClick={() => setActiveInfoModal("help")}
                    className="hover:text-[#4B63D2] transition-colors cursor-pointer text-left"
                  >
                    Help Center
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveInfoModal("contact")}
                    className="hover:text-[#4B63D2] transition-colors cursor-pointer text-left"
                  >
                    Contact Team
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveInfoModal("privacy")}
                    className="hover:text-[#4B63D2] transition-colors cursor-pointer text-left"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveInfoModal("terms")}
                    className="hover:text-[#4B63D2] transition-colors cursor-pointer text-left"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <span className="text-[#5851A4]/60 dark:text-[#94A3B8]/60 text-xs">Accessibility</span>
                </li>
              </ul>
            </div>

            {/* Column 4: STAY UPDATED */}
            <div className="lg:col-span-4 space-y-3">
              <p className="text-xs font-black tracking-wider text-[#1E2746] dark:text-[#F1F5F9] uppercase">Stay Updated</p>
              <p className="text-sm text-[#5851A4] dark:text-[#94A3B8] leading-relaxed">
                Subscribe to campus placement circulars, hackathon alerts, and department announcements.
              </p>
              <form onSubmit={handleNewsletterSubscribe} className="space-y-2">
                <div className="flex items-center max-w-sm">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="student@sbjit.edu.in"
                    className="bg-[#FAF9FD] dark:bg-[#1E293B] rounded-l-xl border border-[#EAE4F7] dark:border-[#334155] h-10 px-3.5 text-xs sm:text-sm text-[#1E2746] dark:text-[#F1F5F9] placeholder:text-[#5851A4]/50 dark:placeholder:text-[#64748B] outline-none focus:border-[#4B63D2] focus:bg-white dark:focus:bg-[#0F172A] w-full transition-all"
                  />
                  <button
                    type="submit"
                    aria-label="Subscribe to newsletter"
                    className="flex items-center justify-center bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] h-10 w-11 aspect-square rounded-r-xl text-white transition-all shadow-xs cursor-pointer flex-shrink-0"
                  >
                    <svg className="w-4 h-4 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m14 0-4 4m4-4-4-4" />
                    </svg>
                  </button>
                </div>
                {newsletterMessage && (
                  <p className="text-xs font-bold text-[#4B63D2] animate-in fade-in duration-200">
                    {newsletterMessage}
                  </p>
                )}
              </form>
            </div>
          </div>

          <hr className="border-[#EAE4F7] dark:border-[#1F2937] mt-10" />

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between py-5 text-xs text-[#5851A4] dark:text-[#94A3B8]">
            <p className="font-medium">
              © {new Date().getFullYear()} <span className="font-bold text-[#1E2746] dark:text-[#F1F5F9]">KNOTS Campus Hub</span> (SBJIT). All rights reserved.
            </p>
            <ul className="flex items-center gap-5 font-bold">
              <li>
                <button
                  onClick={() => setActiveInfoModal("privacy")}
                  className="hover:text-[#4B63D2] transition-colors cursor-pointer"
                >
                  Privacy
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveInfoModal("terms")}
                  className="hover:text-[#4B63D2] transition-colors cursor-pointer"
                >
                  Terms
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveInfoModal("resources")}
                  className="hover:text-[#4B63D2] transition-colors cursor-pointer"
                >
                  Resources
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveInfoModal("help")}
                  className="hover:text-[#4B63D2] transition-colors cursor-pointer"
                >
                  Support
                </button>
              </li>
            </ul>
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
