import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ThemeToggle from "../components/common/ThemeToggle";
import InfoModal, { ModalType } from "../components/common/InfoModal";
import KnotsLogo from "../components/common/KnotsLogo";
import {
  Sparkles,
  LineChart,
  Briefcase,
  Users,
  GraduationCap,
  Award,
  FileDown,
  FileCheck2,
  Building,
  Target,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const isAuthenticated = Boolean(localStorage.getItem("knots_token"));

  // Newsletter Subscription State
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState<string | null>(null);

  const handleNewsletterSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail.trim())) {
      setNewsletterMessage("Please enter a valid college email address.");
      setTimeout(() => setNewsletterMessage(null), 3000);
      return;
    }
    setNewsletterMessage("Subscribed to campus alerts!");
    setNewsletterEmail("");
    setTimeout(() => setNewsletterMessage(null), 3500);
  };

  return (
    <div className="relative min-h-screen bg-[#FAF9FD] dark:bg-[#0B0F19] text-[#1E2746] dark:text-[#F1F5F9] font-sans antialiased overflow-x-hidden selection:bg-[#4B63D2]/20 selection:text-[#4B63D2]">
      {/* Background Graphic with Soft Overlays */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src="/landing_bg.png"
          alt="KNOTS Academic Canvas"
          className="w-full h-full object-cover object-center opacity-90 dark:opacity-40 transform scale-100 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-white/25 dark:bg-[#0B0F19]/60" />
      </div>

      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-[#0B0F19]/85 border-b border-[#EAE4F7]/80 dark:border-[#1E293B]/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group focus:outline-none flex-shrink-0"
          >
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-white dark:bg-[#1E293B] flex items-center justify-center p-1.5 shadow-sm border border-[#EAE4F7] dark:border-[#334155] group-hover:shadow-md group-hover:scale-105 transition-all flex-shrink-0">
              <img
                src="/knots_logo.png"
                alt="KNOTS Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-shrink-0">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[#1E2746] dark:text-white flex items-center gap-1.5">
                KNOTS
                <span className="text-[10px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded-full bg-[#4B63D2]/10 dark:bg-[#4B63D2]/30 text-[#4B63D2] dark:text-[#818cf8] border border-[#4B63D2]/20">
                  SBJIT
                </span>
              </span>
              <p className="text-[10px] font-semibold text-[#5851A4] dark:text-[#94A3B8] tracking-wide -mt-0.5">
                Academic & Career Network
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-xs font-bold text-[#5851A4] dark:text-[#94A3B8] flex-shrink-0">
            <a
              href="#career-path"
              className="hover:text-[#4B63D2] dark:hover:text-white transition-colors whitespace-nowrap"
            >
              Career Path
            </a>
            <a
              href="#campus-connections"
              className="hover:text-[#4B63D2] dark:hover:text-white transition-colors whitespace-nowrap"
            >
              Campus Network
            </a>
            <a
              href="#resume-builder"
              className="hover:text-[#4B63D2] dark:hover:text-white transition-colors whitespace-nowrap"
            >
              Instant Resume
            </a>
            <a
              href="#college-opportunities"
              className="hover:text-[#4B63D2] dark:hover:text-white transition-colors whitespace-nowrap"
            >
              Opportunities
            </a>
          </nav>

          {/* Action CTAs & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <ThemeToggle />
            {isAuthenticated ? (
              <Link
                to="/feed"
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#3f53b5] hover:to-[#4a448d] text-white text-xs font-bold shadow-md shadow-[#4B63D2]/25 transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0"
              >
                <span>Go to Portal</span>
                <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
              </Link>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
                <Link
                  to="/login"
                  className="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-[#4B63D2] dark:text-[#A5B4FC] hover:bg-[#EEF2FF] dark:hover:bg-[#1E293B] border border-transparent hover:border-[#EAE4F7] dark:hover:border-[#334155] transition-all whitespace-nowrap flex-shrink-0"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 sm:px-4.5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#3f53b5] hover:to-[#4a448d] text-white text-xs font-bold shadow-md shadow-[#4B63D2]/25 transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0"
                >
                  <span>Join Network</span>
                  <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          {/* Institutional Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 dark:bg-[#1E293B]/90 border border-[#EAE4F7] dark:border-[#334155] shadow-sm mb-6 animate-fade-in">
            <ShieldCheck className="w-4 h-4 text-[#4B63D2] dark:text-[#818CF8]" />
            <span className="text-xs font-bold text-[#1E2746] dark:text-[#E2E8F0]">
              Authorized S.B. Jain Institute Academic Platform
            </span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#1E2746] dark:text-white max-w-4xl mx-auto leading-[1.15]">
            Where Academic Excellence Meets{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4B63D2] via-[#5851A4] to-[#7C3AED]">
              Institutional Career Power
            </span>
          </h1>

          {/* Hero Subtitle */}
          <p className="mt-6 text-sm sm:text-lg text-[#5851A4] dark:text-[#94A3B8] max-w-2xl mx-auto font-medium leading-relaxed">
            KNOTS connects students, faculty, alumni, and institutional leaders
            into a single AI-powered ecosystem for career discovery, verified
            mentorship, instant resumes, and exclusive campus placements.
          </p>

          {/* Hero Action Buttons */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#3f53b5] hover:to-[#4a448d] text-white text-sm font-bold shadow-lg shadow-[#4B63D2]/30 hover:shadow-xl hover:shadow-[#4B63D2]/40 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Get Started with College ID</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#career-path"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/90 dark:bg-[#1E293B]/90 hover:bg-white dark:hover:bg-[#1E293B] text-[#1E2746] dark:text-white border border-[#EAE4F7] dark:border-[#334155] text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Explore Platform Features</span>
              <ChevronRight className="w-4 h-4 text-[#5851A4] dark:text-[#94A3B8]" />
            </a>
          </div>

          {/* Hero Floating Quick Highlights */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto text-left">
            {[
              {
                icon: ShieldCheck,
                title: "100% Verified",
                desc: "Official institutional credentials",
                color: "text-blue-500",
                bg: "bg-blue-500/10",
              },
              {
                icon: Sparkles,
                title: "AI Career Engine",
                desc: "Personalized roadmaps & gap analysis",
                color: "text-indigo-500",
                bg: "bg-indigo-500/10",
              },
              {
                icon: Users,
                title: "Alumni Network",
                desc: "Direct guidance from graduates",
                color: "text-purple-500",
                bg: "bg-purple-500/10",
              },
              {
                icon: FileCheck2,
                title: "Instant Resume",
                desc: "1-Click ATS profile export",
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
              },
            ].map((card, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md border border-[#EAE4F7] dark:border-[#1F2937] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div
                  className={`w-9 h-9 rounded-xl ${card.bg} ${card.color} flex items-center justify-center mb-3`}
                >
                  <card.icon className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-black text-[#1E2746] dark:text-white">
                  {card.title}
                </h4>
                <p className="text-[11px] text-[#5851A4] dark:text-[#94A3B8] font-medium mt-0.5">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 1: Discover Your Ideal Career Path */}
        <section
          id="career-path"
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20"
        >
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-[#1E2746] dark:text-white">
              Discover Your Ideal Career Path
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#5851A4] dark:text-[#94A3B8] font-medium">
              Harness AI-driven diagnostics and goal-oriented roadmaps tailored
              specifically to your academic performance and aspirations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Sparkles,
                title: "AI-powered career guidance",
                desc: "Intelligent career trajectory matching based on your coursework, strengths, and technological interest areas.",
              },
              {
                icon: LineChart,
                title: "Personalized skill-gap analysis",
                desc: "Real-time benchmarking of your current technical & soft skills against current high-demand industry job standards.",
              },
              {
                icon: Target,
                title: "Goal-based career roadmaps",
                desc: "Structured semester-by-semester milestone blueprints for software engineering, core engineering, and competitive exams.",
              },
              {
                icon: Briefcase,
                title: "Internship and career guidance",
                desc: "Proactive internship alerts, domain training suggestions, and authorized faculty mentorship checkpoints.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="group relative p-6 rounded-3xl bg-white/85 dark:bg-[#111827]/85 backdrop-blur-md border border-[#EAE4F7] dark:border-[#1F2937] hover:border-[#4B63D2]/40 dark:hover:border-[#4B63D2]/40 shadow-sm hover:shadow-xl hover:shadow-[#4B63D2]/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4B63D2]/10 to-[#5851A4]/20 text-[#4B63D2] dark:text-[#818CF8] flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-[#1E2746] dark:text-white tracking-tight group-hover:text-[#4B63D2] transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs text-[#5851A4] dark:text-[#94A3B8] leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-[#EAE4F7]/60 dark:border-[#1F2937] flex items-center text-xs font-bold text-[#4B63D2] dark:text-[#818CF8]">
                  <span>Learn more</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2: Build Connections Across Your Campus (Interconnected Flow Layout) */}
        <section
          id="campus-connections"
          className="relative py-16 md:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20 overflow-hidden"
        >
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#4B63D2]/10 dark:bg-[#4B63D2]/20 border border-[#4B63D2]/20 text-xs font-bold text-[#4B63D2] dark:text-[#818CF8] mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>How Knots Works</span>
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#1E2746] dark:text-white">
              Build Connections Across Your Campus
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#5851A4] dark:text-[#94A3B8] font-medium max-w-2xl mx-auto leading-relaxed">
              Eliminate departmental silos and establish verified connections with all key stakeholders of our academic institution.
            </p>
          </div>

          {/* Interconnected Workflow Container */}
          <div className="relative max-w-5xl mx-auto">
            
            {/* Desktop SVG Connector Paths (Hidden on Mobile) */}
            <svg
              className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none z-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 1000 850"
            >
              <defs>
                <marker
                  id="arrow-knots"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#9188BE" />
                </marker>
                <linearGradient id="curve-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4B63D2" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#818CF8" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#5851A4" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              {/* Path 1 -> 2 (Top Left to Top Right with smooth loop) */}
              <path
                d="M 420 100 C 470 30, 520 180, 570 100"
                stroke="url(#curve-gradient)"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                markerEnd="url(#arrow-knots)"
              />

              {/* Path 2 -> 3 (Top Right looping down to Middle Left) */}
              <path
                d="M 800 190 C 850 310, 350 240, 260 360"
                stroke="url(#curve-gradient)"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                markerEnd="url(#arrow-knots)"
              />

              {/* Path 3 -> 4 (Middle Left across to Middle Right) */}
              <path
                d="M 450 440 C 510 370, 550 510, 600 440"
                stroke="url(#curve-gradient)"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                markerEnd="url(#arrow-knots)"
              />

              {/* Path 4 -> 5 (Middle Right down to Bottom Center) */}
              <path
                d="M 760 530 C 780 630, 630 680, 530 680"
                stroke="url(#curve-gradient)"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                markerEnd="url(#arrow-knots)"
              />
            </svg>

            {/* STAGE 1: Top Row (Students & Faculty) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative z-10 mb-10 sm:mb-16">
              
              {/* Card 1: Students across departments and batches */}
              <div className="lg:col-span-6 flex justify-start">
                <div className="w-full max-w-md p-6 sm:p-7 rounded-3xl bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border border-[#EAE4F7] dark:border-[#1F2937] hover:border-[#4B63D2]/40 dark:hover:border-[#4B63D2]/40 shadow-lg shadow-[#5851A4]/5 hover:shadow-xl hover:shadow-[#4B63D2]/10 hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-sm border border-blue-500/20">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <h3 className="text-base sm:text-lg font-black text-[#1E2746] dark:text-white tracking-tight">
                        Students across departments and batches
                      </h3>
                      <p className="text-xs sm:text-sm text-[#5851A4] dark:text-[#94A3B8] font-medium leading-relaxed">
                        Collaborate on multidisciplinary capstones, competitive hackathons, research publications, and peer study groups.
                      </p>
                      <div className="pt-2 flex items-center justify-between">
                        <Link
                          to="/register"
                          className="text-xs font-bold text-[#4B63D2] dark:text-[#818CF8] hover:underline inline-flex items-center gap-1"
                        >
                          <span>Connect with peers</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified Identity</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Faculty and mentors */}
              <div className="lg:col-span-6 flex justify-end">
                <div className="w-full max-w-md p-6 sm:p-7 rounded-3xl bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border border-[#EAE4F7] dark:border-[#1F2937] hover:border-[#4B63D2]/40 dark:hover:border-[#4B63D2]/40 shadow-lg shadow-[#5851A4]/5 hover:shadow-xl hover:shadow-[#4B63D2]/10 hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-sm border border-indigo-500/20">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <h3 className="text-base sm:text-lg font-black text-[#1E2746] dark:text-white tracking-tight">
                        Faculty and mentors
                      </h3>
                      <p className="text-xs sm:text-sm text-[#5851A4] dark:text-[#94A3B8] font-medium leading-relaxed">
                        Direct communication with course professors, lab directors, research guides, and project review committees.
                      </p>
                      <div className="pt-2 flex items-center justify-between">
                        <Link
                          to="/register"
                          className="text-xs font-bold text-[#4B63D2] dark:text-[#818CF8] hover:underline inline-flex items-center gap-1"
                        >
                          <span>Reach faculty guides</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified Identity</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STAGE 2: Middle Row (Alumni & Department Authorities) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative z-10 mb-10 sm:mb-16">
              
              {/* Card 3: Alumni and industry professionals */}
              <div className="lg:col-span-6 flex justify-start">
                <div className="w-full max-w-md p-6 sm:p-7 rounded-3xl bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border border-[#EAE4F7] dark:border-[#1F2937] hover:border-[#4B63D2]/40 dark:hover:border-[#4B63D2]/40 shadow-lg shadow-[#5851A4]/5 hover:shadow-xl hover:shadow-[#4B63D2]/10 hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-sm border border-purple-500/20">
                      <Award className="w-6 h-6" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <h3 className="text-base sm:text-lg font-black text-[#1E2746] dark:text-white tracking-tight">
                        Alumni and industry professionals
                      </h3>
                      <p className="text-xs sm:text-sm text-[#5851A4] dark:text-[#94A3B8] font-medium leading-relaxed">
                        Connect directly with verified graduates working across premier technology, consulting, and core enterprises.
                      </p>
                      <div className="pt-2 flex items-center justify-between">
                        <Link
                          to="/register"
                          className="text-xs font-bold text-[#4B63D2] dark:text-[#818CF8] hover:underline inline-flex items-center gap-1"
                        >
                          <span>Explore alumni network</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified Identity</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: HODs and department authorities */}
              <div className="lg:col-span-6 flex justify-end">
                <div className="w-full max-w-md p-6 sm:p-7 rounded-3xl bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border border-[#EAE4F7] dark:border-[#1F2937] hover:border-[#4B63D2]/40 dark:hover:border-[#4B63D2]/40 shadow-lg shadow-[#5851A4]/5 hover:shadow-xl hover:shadow-[#4B63D2]/10 hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-sm border border-amber-500/20">
                      <Building className="w-6 h-6" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <h3 className="text-base sm:text-lg font-black text-[#1E2746] dark:text-white tracking-tight">
                        HODs and department authorities
                      </h3>
                      <p className="text-xs sm:text-sm text-[#5851A4] dark:text-[#94A3B8] font-medium leading-relaxed">
                        Receive authoritative department notices, internship approvals, academic letters, and event accreditations.
                      </p>
                      <div className="pt-2 flex items-center justify-between">
                        <Link
                          to="/register"
                          className="text-xs font-bold text-[#4B63D2] dark:text-[#818CF8] hover:underline inline-flex items-center gap-1"
                        >
                          <span>Department notices</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified Identity</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STAGE 3: Bottom Row (College management and institutional leadership & Hand-drawn badge) */}
            <div className="relative z-10 flex flex-col items-center">
              
              {/* Card 5: College management and institutional leadership */}
              <div className="w-full max-w-xl p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-white/95 via-white/98 to-white/95 dark:from-[#111827]/95 dark:via-[#131D31]/98 dark:to-[#111827]/95 backdrop-blur-md border border-[#EAE4F7] dark:border-[#1F2937] hover:border-emerald-500/40 shadow-xl shadow-[#5851A4]/8 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm border border-emerald-500/20">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-xl font-black text-[#1E2746] dark:text-white tracking-tight">
                        College management and institutional leadership
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-[#5851A4] dark:text-[#94A3B8] font-medium leading-relaxed">
                      Institutional governance, high-level policies, infrastructure updates, and campus-wide strategic initiatives.
                    </p>
                    <div className="pt-2 flex items-center justify-between">
                      <Link
                        to="/register"
                        className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                      >
                        <span>Institutional gateway</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified Identity</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Playful Tagline Badge (Inspired by Meetup's "Friends. But make it easy") */}
              <div className="mt-8 inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-amber-700 dark:text-amber-300 shadow-sm">
                <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider font-mono">
                  One Campus Network • Zero Department Silos
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 3: Create and Download Your Resume Instantly */}
        <section
          id="resume-builder"
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20"
        >
          <div className="rounded-3xl bg-gradient-to-br from-white/90 via-[#FAF9FD]/95 to-white/90 dark:from-[#111827]/90 dark:via-[#131C2E]/95 dark:to-[#111827]/90 backdrop-blur-xl border border-[#EAE4F7] dark:border-[#1F2937] p-8 sm:p-12 lg:p-16 shadow-xl shadow-[#4B63D2]/5 dark:shadow-black/40">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column Text & Feature Checklist */}
              <div className="lg:col-span-7 space-y-6">
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-[#1E2746] dark:text-white">
                  Create and Download Your Resume Instantly
                </h2>
                <p className="text-sm sm:text-base text-[#5851A4] dark:text-[#94A3B8] font-medium leading-relaxed">
                  Eliminate formatting headaches. KNOTS compiles your verified
                  academic journey, achievements, and projects into a
                  recruiter-ready, ATS-compliant professional resume in seconds.
                </p>

                <div className="space-y-4 pt-2">
                  {[
                    {
                      title: "Build a resume from the KNOTS profile",
                      desc: "One-click auto-population pulling your verified branch, CGPA, coursework, and contact credentials directly.",
                    },
                    {
                      title:
                        "Include skills, projects, certifications and achievements",
                      desc: "Dynamic categorization of technical frameworks, hackathon accolades, capstone GitHub repos, and certificates.",
                    },
                    {
                      title: "Generate a professional structured resume",
                      desc: "Engineered with strict ATS industry typography standards to breeze past enterprise applicant tracking filters.",
                    },
                    {
                      title: "Download with one click",
                      desc: "Instant export to clean, print-ready PDF format tailored for campus drives and off-campus opportunities.",
                    },
                  ].map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-3.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-[#1E2746] dark:text-white">
                          {feat.title}
                        </h4>
                        <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] font-medium mt-0.5">
                          {feat.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex flex-wrap items-center gap-4">
                  <Link
                    to="/register"
                    className="px-6 py-3 rounded-2xl bg-[#4B63D2] hover:bg-[#3f53b5] text-white text-xs font-bold shadow-md shadow-[#4B63D2]/25 transition-all flex items-center gap-2"
                  >
                    <span>Build My Resume Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <span className="text-xs font-semibold text-[#5851A4] dark:text-[#94A3B8]">
                    No external software required
                  </span>
                </div>
              </div>

              {/* Right Column Interactive Resume Card Preview */}
              <div className="lg:col-span-5">
                <div className="relative p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] shadow-2xl shadow-[#4B63D2]/10 space-y-4">
                  {/* Decorative Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#EAE4F7] dark:border-[#334155]">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-[10px] font-extrabold text-[#4B63D2] dark:text-[#818CF8] uppercase tracking-wider bg-[#EEF2FF] dark:bg-[#312E81] px-2.5 py-0.5 rounded-full">
                      ATS Verified Resume
                    </span>
                  </div>

                  {/* Mock Resume Header */}
                  <div>
                    <h3 className="text-base font-black text-[#1E2746] dark:text-white">
                      Aditya Sharma
                    </h3>
                    <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] font-medium">
                      B.Tech Computer Science & Engineering | CGPA: 9.12
                    </p>
                    <p className="text-[11px] text-[#5851A4] dark:text-[#64748B] mt-0.5">
                      aditya.sharma@sbjit.edu.in • Nagpur, India
                    </p>
                  </div>

                  {/* Mock Skills Section */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-[#4B63D2] dark:text-[#818CF8] tracking-wider">
                      Technical Competencies
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        "React.js",
                        "TypeScript",
                        "Python / FastAPI",
                        "PostgreSQL",
                        "Docker",
                        "Machine Learning",
                      ].map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF9FD] dark:bg-[#0B0F19] text-[#1E2746] dark:text-[#E2E8F0] border border-[#EAE4F7] dark:border-[#334155]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Mock Projects Section */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-[#4B63D2] dark:text-[#818CF8] tracking-wider">
                      Academic Capstone
                    </span>
                    <div className="p-2.5 rounded-xl bg-[#FAF9FD] dark:bg-[#0B0F19] border border-[#EAE4F7] dark:border-[#334155]">
                      <h4 className="text-xs font-bold text-[#1E2746] dark:text-white">
                        KNOTS: Campus Academic & Career Network
                      </h4>
                      <p className="text-[10px] text-[#5851A4] dark:text-[#94A3B8] mt-0.5">
                        Built high-throughput FastAPI & React infrastructure with
                        real-time WebSockets and multi-role RBAC.
                      </p>
                    </div>
                  </div>

                  {/* Download Action Bar */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => navigate("/register")}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FileDown className="w-4 h-4" />
                      <span>Download ATS Formatted PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: Discover Opportunities Through Your College Network */}
        <section
          id="college-opportunities"
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20"
        >
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-[#1E2746] dark:text-white">
              Discover Opportunities Through Your College Network
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#5851A4] dark:text-[#94A3B8] font-medium">
              Direct access to authenticated placements, summer internships, and
              exclusive opportunities directly vetted by campus authorities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Building,
                title: "Opportunities from TPOs and authorized college authorities",
                desc: "Official campus placement drives, pool recruitment schedules, pre-placement talks, and campus walk-in drives with zero middlemen.",
              },
              {
                icon: Award,
                title: "Opportunities shared by alumni",
                desc: "Exclusive internal referral pathways, startup openings, and direct vacancy postings shared by our working alumni across global firms.",
              },
              {
                icon: Sparkles,
                title: "Personalized opportunities",
                desc: "Automated opportunity matching based on your branch, CGPA eligibility criteria, live backlog checks, and domain skill sets.",
              },
              {
                icon: LineChart,
                title: "Application and progress tracking",
                desc: "Full lifecycle tracking from resume submission, online assessment notifications, technical rounds, to final offer issuance.",
              },
            ].map((opp, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white/85 dark:bg-[#111827]/85 backdrop-blur-md border border-[#EAE4F7] dark:border-[#1F2937] hover:border-amber-500/40 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
                    <opp.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-[#1E2746] dark:text-white tracking-tight">
                    {opp.title}
                  </h3>
                  <p className="mt-2 text-xs text-[#5851A4] dark:text-[#94A3B8] leading-relaxed font-medium">
                    {opp.desc}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-[#EAE4F7]/60 dark:border-[#1F2937] flex items-center justify-between text-xs font-bold text-[#4B63D2] dark:text-[#818CF8]">
                  <span>View drive status</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 3. MULTI-COLUMN KNOTS FOOTER */}
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
                    onClick={() => setActiveModal("about")}
                    className="hover:text-[#4B63D2] transition-colors cursor-pointer text-left"
                  >
                    About Knots
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal("community")}
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
                    onClick={() => setActiveModal("resources")}
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
                    onClick={() => setActiveModal("help")}
                    className="hover:text-[#4B63D2] transition-colors cursor-pointer text-left"
                  >
                    Help Center
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal("contact")}
                    className="hover:text-[#4B63D2] transition-colors cursor-pointer text-left"
                  >
                    Contact Team
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal("privacy")}
                    className="hover:text-[#4B63D2] transition-colors cursor-pointer text-left"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal("terms")}
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
                  onClick={() => setActiveModal("privacy")}
                  className="hover:text-[#4B63D2] transition-colors cursor-pointer"
                >
                  Privacy
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveModal("terms")}
                  className="hover:text-[#4B63D2] transition-colors cursor-pointer"
                >
                  Terms
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveModal("resources")}
                  className="hover:text-[#4B63D2] transition-colors cursor-pointer"
                >
                  Resources
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveModal("help")}
                  className="hover:text-[#4B63D2] transition-colors cursor-pointer"
                >
                  Support
                </button>
              </li>
            </ul>
          </div>
        </div>
      </footer>


      {/* Global Info Modal */}
      <InfoModal type={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
}
