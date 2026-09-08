import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import KnotsLogo from "../components/common/KnotsLogo";
import {
  ArrowRight,
  Sparkles,
  Users,
  Briefcase,
  X,
  Eye,
  EyeOff,
  Lock,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { apiRequest, ApiError } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // Controls whether the Sign In card is open over the blurred intro background
  const [isSignInOpen, setIsSignInOpen] = useState(
    location.hash === "#signin" || location.search.includes("modal=signin"),
  );

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetCountdown, setResetCountdown] = useState(0);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [resetDemoOtp, setResetDemoOtp] = useState<string | null>(null);

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [sendingResetOtp, setSendingResetOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  // Reset Countdown Timer
  useEffect(() => {
    let timer: any;
    if (resetCountdown > 0) {
      timer = setTimeout(() => setResetCountdown(resetCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resetCountdown]);

  const isCollegeDomain = (emailStr: string) => {
    return emailStr.trim().toLowerCase().endsWith("@sbjit.edu.in");
  };

  // Submit Direct Email + Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Email address is required.");
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
      navigate("/");
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

  // Send OTP for Forgot Password
  const handleSendResetOtp = async () => {
    setResetError(null);
    const trimmedEmail = resetEmail.trim();

    if (!trimmedEmail) {
      setResetError("Please enter your registered college email address.");
      return;
    }

    if (!isCollegeDomain(trimmedEmail)) {
      setResetError("Email must end with @sbjit.edu.in");
      return;
    }

    setSendingResetOtp(true);
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
      setResetCountdown(60);
      if (res.demo_otp) {
        setResetDemoOtp(res.demo_otp);
        setResetOtp(res.demo_otp);
      }
    } catch (err: any) {
      setResetError(err.message || "Failed to dispatch reset code.");
    } finally {
      setSendingResetOtp(false);
    }
  };

  // Submit Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    const trimmedEmail = resetEmail.trim();
    if (!trimmedEmail || !isCollegeDomain(trimmedEmail)) {
      setResetError("Please enter a valid @sbjit.edu.in email address.");
      return;
    }

    if (!resetOtp.trim() || resetOtp.trim().length < 6) {
      setResetError("Please enter the 6-digit OTP verification code.");
      return;
    }

    if (resetNewPassword.length < 6) {
      setResetError("New password must be at least 6 characters long.");
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

      setResetSuccessMessage("Password reset successfully! You can now sign in with your new password.");
      setTimeout(() => {
        setShowForgotPassword(false);
        setEmail(trimmedEmail);
        setPassword("");
        setResetSuccessMessage(null);
        setResetOtpSent(false);
      }, 2000);
    } catch (err: any) {
      setResetError(err.message || "Password reset failed. Please verify your OTP code.");
    } finally {
      setLoading(false);
    }
  };

  // Demo Quick-Fill Helper
  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="relative min-h-screen bg-[#F8F6FD] text-[#1E2746] overflow-x-hidden font-sans select-none">
      {/* ============================================================ */}
      {/* 1. INTRO / HERO SECTION (Blurs when isSignInOpen === true)  */}
      {/* ============================================================ */}
      <div
        className={`min-h-screen flex flex-col justify-between transition-all duration-500 ease-out ${
          isSignInOpen
            ? "filter blur-lg scale-[0.985] pointer-events-none opacity-60"
            : "filter blur-0 scale-100 opacity-100"
        }`}
      >
        {/* Top Navigation Bar */}
        <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3 sm:gap-5">
            <KnotsLogo size="xl" />
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-[#1E2746]">
                  KNOTS
                </span>
                <span className="hidden sm:inline-block text-xs font-bold text-[#4B63D2] bg-[#4B63D2]/10 px-3 py-1 rounded-full border border-[#4B63D2]/20">
                  SBJIT Campus Hub
                </span>
              </div>
              <p className="text-xs text-[#5851A4] font-semibold tracking-wide hidden sm:block mt-0.5">
                Connect • Collaborate • Climb
              </p>
            </div>
          </div>





          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/register"
              className="text-xs sm:text-sm font-bold text-[#5851A4] hover:text-[#1E2746] transition-colors px-3 py-2"
            >
              Create Account
            </Link>
            <button
              onClick={() => {
                setError(null);
                setIsSignInOpen(true);
              }}
              className="bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-md shadow-[#4B63D2]/25 hover:shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4 text-[#FFD21A]" />
            </button>
          </div>
        </header>

        {/* Main Intro Body Grid */}
        <main className="flex-1 max-w-7xl mx-auto px-6 py-8 md:py-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* LEFT SIDE: Graphical Image of Students Communicating */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center relative order-2 lg:order-1">
            <div className="absolute -inset-4 bg-gradient-to-tr from-[#C8B6E2]/30 via-[#4B63D2]/15 to-[#FFD21A]/10 rounded-3xl blur-2xl pointer-events-none" />

            <div className="relative w-full max-w-lg rounded-3xl overflow-hidden bg-white border border-[#EAE4F7] shadow-xl shadow-[#5851A4]/10 p-3 sm:p-4 group">
              <div className="relative rounded-2xl overflow-hidden aspect-square bg-[#FAF9FD]">
                <img
                  src="/campus_collaboration.jpg"
                  alt="College students networking, collaborating and communicating on campus"
                  className="w-full h-full object-cover object-center transform group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                />
              </div>

              {/* Floating Badges */}
              <div className="absolute -bottom-4 left-6 sm:left-10 bg-white/95 backdrop-blur-md border border-[#EAE4F7] shadow-lg rounded-2xl px-4 py-2.5 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
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

              <div className="absolute -top-3 right-6 sm:right-8 bg-white/95 backdrop-blur-md border border-[#EAE4F7] shadow-lg rounded-2xl px-3.5 py-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-500">
                <Sparkles className="w-4 h-4 text-[#FFD21A]" />
                <span className="text-xs font-bold text-[#1E2746]">
                  Authorized SBJIT Portal
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Headline & Sign In Call To Action */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6 order-1 lg:order-2 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFD21A]/20 border border-[#FFD21A]/60 text-[#1E2746] text-xs font-black w-fit shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#5851A4]" />
              <span>COLLEGE NETWORKING & CAREER PLATFORM</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1E2746] tracking-tight leading-[1.15]">
              Where the campus{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4B63D2] via-[#5851A4] to-[#4B63D2]">
                connects, collaborates
              </span>{" "}
              and{" "}
              <span className="text-[#5851A4] underline decoration-[#FFD21A] decoration-wavy decoration-2">
                climbs
              </span>
              .
            </h1>

            <p className="text-[#5851A4] text-sm sm:text-base leading-relaxed font-medium max-w-xl">
              Bridge the gap between classrooms and careers. Connect with senior
              alumni, discover internships, participate in campus discussions,
              and unlock AI-powered career recommendations.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 bg-white border border-[#EAE4F7] rounded-xl p-3 shadow-sm">
                <div className="h-7 w-7 rounded-lg bg-[#4B63D2]/10 flex items-center justify-center text-[#4B63D2] shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[#1E2746]">
                  Verified Student & Alumni Network
                </span>
              </div>
              <div className="flex items-center gap-2.5 bg-white border border-[#EAE4F7] rounded-xl p-3 shadow-sm">
                <div className="h-7 w-7 rounded-lg bg-[#5851A4]/10 flex items-center justify-center text-[#5851A4] shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[#1E2746]">
                  Exclusive Job & Referral Hub
                </span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={() => {
                  setError(null);
                  setIsSignInOpen(true);
                }}
                className="bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white text-base font-black px-8 py-4 rounded-2xl shadow-lg shadow-[#4B63D2]/30 hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
              >
                <span>Sign In to Your Account</span>
                <ArrowRight className="w-5 h-5 text-[#FFD21A]" />
              </button>

              <Link
                to="/register"
                className="bg-white hover:bg-[#FAF9FD] border border-[#EAE4F7] hover:border-[#C8B6E2] text-[#1E2746] text-sm font-bold px-6 py-4 rounded-2xl transition-all flex items-center justify-center shadow-sm"
              >
                Create New Account
              </Link>
            </div>

            <p className="text-xs text-[#9188BE] font-medium pt-1">
              ✨ Sign in with your registered @sbjit.edu.in email and password.
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-[#EAE4F7] text-center sm:flex sm:justify-between text-xs text-[#5851A4] font-medium">
          <p>© 2026 KNOTS — SBJIT College Networking & Opportunity Platform.</p>
          <p className="mt-2 sm:mt-0">Authorized institutional access only.</p>
        </footer>
      </div>

      {/* ============================================================ */}
      {/* 2. BLURRED MODAL: SIGN IN / LOGIN VIEW                       */}
      {/* ============================================================ */}
      {isSignInOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2746]/50 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          {/* Backdrop dismiss */}
          <div
            className="fixed inset-0"
            onClick={() => setIsSignInOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative z-10 max-w-md w-full bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-[#1E2746]/20 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 my-8">
            {/* Close Button */}
            <button
              onClick={() => setIsSignInOpen(false)}
              className="absolute top-5 right-5 p-2 text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD] rounded-full transition-colors cursor-pointer"
              title="Close Sign In"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <KnotsLogo size="md" className="mb-2" />
              <h2 className="text-2xl font-black text-[#1E2746] tracking-tight">
                Sign In to KNOTS
              </h2>
              <p className="text-[#5851A4] text-xs mt-1 font-medium">
                Enter your registered college email and password
              </p>
            </div>




            {/* Error Banner */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-3 text-xs mb-4 font-medium flex items-start gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              {/* Email Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#1E2746] uppercase tracking-wider">
                    Registered College Email
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
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@sbjit.edu.in"
                    className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20 transition-all text-xs font-medium"
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>
                {email && !isCollegeDomain(email) && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">
                    ⚠️ Email must end with @sbjit.edu.in
                  </p>
                )}
              </div>

              {/* Password Input with Hide & See Eye Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#1E2746] uppercase tracking-wider">
                    Password
                  </label>
                  {/* Forgot Password Link */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setResetEmail(email || "");
                      setResetError(null);
                      setResetOtpSent(false);
                    }}
                    className="text-[11px] font-bold text-[#4B63D2] hover:text-[#3E53BE] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-10 pr-10 py-2.5 text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20 transition-all text-xs font-medium"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9188BE] hover:text-[#1E2746] transition-colors p-1 cursor-pointer"
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-3.5 font-bold text-xs transition-all duration-200 flex items-center justify-center gap-2 mt-2 shadow-md shadow-[#4B63D2]/25 cursor-pointer active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4 text-[#FFD21A]" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Fill Demo Pills */}
            <div className="pt-4 border-t border-[#EAE4F7] mt-4">
              <p className="text-[11px] font-bold text-[#5851A4] mb-2 flex items-center justify-between">
                <span>Quick Fill Demo Logins:</span>
                <span className="text-[10px] text-[#9188BE] font-medium">Click to test</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickFill("student@sbjit.edu.in", "password123")}
                  className="px-2 py-1.5 rounded-xl bg-[#FAF9FD] hover:bg-white border border-[#EAE4F7] text-[10px] font-bold text-[#5851A4] hover:text-[#1E2746] transition-all text-center cursor-pointer"
                >
                  🎓 Student
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("faculty@sbjit.edu.in", "password123")}
                  className="px-2 py-1.5 rounded-xl bg-[#FAF9FD] hover:bg-white border border-[#EAE4F7] text-[10px] font-bold text-[#5851A4] hover:text-[#1E2746] transition-all text-center cursor-pointer"
                >
                  👨‍🏫 Faculty
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("admin@sbjit.edu.in", "password123")}
                  className="px-2 py-1.5 rounded-xl bg-[#FAF9FD] hover:bg-white border border-[#EAE4F7] text-[10px] font-bold text-[#5851A4] hover:text-[#1E2746] transition-all text-center cursor-pointer"
                >
                  🏛️ Management
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("alumni@sbjit.edu.in", "password123")}
                  className="px-2 py-1.5 rounded-xl bg-[#FAF9FD] hover:bg-white border border-[#EAE4F7] text-[10px] font-bold text-[#5851A4] hover:text-[#1E2746] transition-all text-center cursor-pointer"
                >
                  💼 Alumni
                </button>
              </div>
            </div>

            {/* Create Account Option Below */}
            <div className="mt-5 pt-3 border-t border-[#EAE4F7] flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
              <span className="text-[#5851A4] font-medium">
                Don't have an account?
              </span>
              <Link
                to="/register"
                className="text-[#4B63D2] font-black hover:text-[#3E53BE] hover:underline flex items-center gap-1"
              >
                <span>Create a new account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. FORGOT PASSWORD MODAL WITH OTP VERIFICATION               */}
      {/* ============================================================ */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2746]/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#EAE4F7] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#4B63D2]/10 text-[#4B63D2]">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1E2746]">
                    Reset Account Password
                  </h3>
                  <p className="text-[11px] text-[#5851A4] font-medium">
                    Verify with your college @sbjit.edu.in email
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="text-[#9188BE] hover:text-[#1E2746] p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccessMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{resetSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1E2746] uppercase tracking-wider mb-1">
                  College Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE]" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="user@sbjit.edu.in"
                    className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-10 pr-24 py-2.5 text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] text-xs font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleSendResetOtp}
                    disabled={sendingResetOtp || resetCountdown > 0 || !resetEmail.trim()}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-[#4B63D2] hover:bg-[#3E53BE] disabled:bg-slate-200 disabled:text-slate-500 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    {sendingResetOtp ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : resetCountdown > 0 ? (
                      <span>{resetCountdown}s</span>
                    ) : (
                      <span>{resetOtpSent ? "Resend" : "Send OTP"}</span>
                    )}
                  </button>
                </div>
              </div>

              {resetOtpSent && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#1E2746] uppercase tracking-wider mb-1">
                      Enter 6-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl px-4 py-2.5 text-[#1E2746] text-center font-mono font-bold tracking-widest text-xs focus:outline-none focus:border-[#4B63D2]"
                      required
                    />
                    {resetDemoOtp && (
                      <p className="text-[10px] text-emerald-700 font-bold mt-1">
                        Demo OTP Code: {resetDemoOtp}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E2746] uppercase tracking-wider mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE]" />
                      <input
                        type={showResetPassword ? "text" : "password"}
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-10 pr-10 py-2.5 text-[#1E2746] text-xs font-medium focus:outline-none focus:border-[#4B63D2]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9188BE] hover:text-[#1E2746]"
                        tabIndex={-1}
                      >
                        {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EAE4F7]">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="px-4 py-2 rounded-xl bg-[#FAF9FD] hover:bg-white border border-[#D5CBEE] text-[#5851A4] text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !resetOtpSent || resetOtp.length < 6 || resetNewPassword.length < 6}
                  className="px-5 py-2 rounded-xl bg-[#4B63D2] hover:bg-[#3E53BE] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
