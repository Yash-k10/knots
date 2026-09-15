import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ThemeToggle from "../components/common/ThemeToggle";
import InfoModal, { ModalType } from "../components/common/InfoModal";
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

  return (
    <div className="relative min-h-screen bg-[#FAF9FD] dark:bg-[#0B0F19] text-[#1E2746] dark:text-[#F1F5F9] font-sans antialiased overflow-x-hidden selection:bg-[#4B63D2]/20 selection:text-[#4B63D2]">
      {/* Background Graphic with Soft Overlays */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src="/landing_bg.png"
          alt="KNOTS Academic Canvas"
          className="w-full h-full object-cover object-top opacity-70 dark:opacity-35 transform scale-100 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF9FD]/30 via-[#FAF9FD]/70 to-[#FAF9FD] dark:from-[#0B0F19]/50 dark:via-[#0B0F19]/80 dark:to-[#0B0F19]" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#4B63D2]/10 dark:bg-[#4B63D2]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 left-10 w-96 h-96 bg-[#5851A4]/10 dark:bg-[#5851A4]/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/75 dark:bg-[#0B0F19]/80 border-b border-[#EAE4F7]/80 dark:border-[#1E293B]/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-3.5 group focus:outline-none"
          >
            <div className="h-11 w-11 rounded-2xl bg-white dark:bg-[#1E293B] flex items-center justify-center p-1.5 shadow-sm border border-[#EAE4F7] dark:border-[#334155] group-hover:shadow-md group-hover:scale-105 transition-all">
              <img
                src="/knots_logo.png"
                alt="KNOTS Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-[#1E2746] dark:text-white flex items-center gap-1.5">
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
          <nav className="hidden lg:flex items-center gap-7 text-xs font-bold text-[#5851A4] dark:text-[#94A3B8]">
            <a
              href="#career-path"
              className="hover:text-[#4B63D2] dark:hover:text-white transition-colors"
            >
              Career Path
            </a>
            <a
              href="#campus-connections"
              className="hover:text-[#4B63D2] dark:hover:text-white transition-colors"
            >
              Campus Network
            </a>
            <a
              href="#resume-builder"
              className="hover:text-[#4B63D2] dark:hover:text-white transition-colors"
            >
              Instant Resume
            </a>
            <a
              href="#college-opportunities"
              className="hover:text-[#4B63D2] dark:hover:text-white transition-colors"
            >
              Opportunities
            </a>
          </nav>

          {/* Action CTAs & Theme Toggle */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <Link
                to="/feed"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#3f53b5] hover:to-[#4a448d] text-white text-xs font-bold shadow-md shadow-[#4B63D2]/25 transition-all flex items-center gap-2"
              >
                <span>Go to Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#4B63D2] dark:text-[#A5B4FC] hover:bg-[#EEF2FF] dark:hover:bg-[#1E293B] border border-transparent hover:border-[#EAE4F7] dark:hover:border-[#334155] transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#3f53b5] hover:to-[#4a448d] text-white text-xs font-bold shadow-md shadow-[#4B63D2]/25 transition-all flex items-center gap-1.5"
                >
                  <span>Join Network</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </>
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

        {/* SECTION 2: Build Connections Across Your Campus */}
        <section
          id="campus-connections"
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20"
        >
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-[#1E2746] dark:text-white">
              Build Connections Across Your Campus
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#5851A4] dark:text-[#94A3B8] font-medium">
              Eliminate departmental silos and establish verified connections
              with all key stakeholders of our academic institution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {[
              {
                icon: Users,
                title: "Students across departments and batches",
                desc: "Collaborate on multidisciplinary capstones, competitive hackathons, research publications, and peer study groups.",
                accent: "from-blue-500/20 to-indigo-500/10",
                iconColor: "text-blue-500",
              },
              {
                icon: GraduationCap,
                title: "Faculty and mentors",
                desc: "Direct communication with course professors, lab directors, research guides, and project review committees.",
                accent: "from-indigo-500/20 to-purple-500/10",
                iconColor: "text-indigo-500",
              },
              {
                icon: Award,
                title: "Alumni and industry professionals",
                desc: "Connect directly with verified graduates working across premier technology, consulting, and core enterprises.",
                accent: "from-purple-500/20 to-pink-500/10",
                iconColor: "text-purple-500",
              },
              {
                icon: Building,
                title: "HODs and department authorities",
                desc: "Receive authoritative department notices, internship approvals, academic letters, and event accreditations.",
                accent: "from-amber-500/20 to-orange-500/10",
                iconColor: "text-amber-500",
              },
              {
                icon: ShieldCheck,
                title: "College management and institutional leadership",
                desc: "Institutional governance, high-level policies, infrastructure updates, and campus-wide strategic initiatives.",
                accent: "from-emerald-500/20 to-teal-500/10",
                iconColor: "text-emerald-500",
              },
            ].map((pillar, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white/85 dark:bg-[#111827]/85 backdrop-blur-md border border-[#EAE4F7] dark:border-[#1F2937] hover:border-[#5851A4]/40 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${pillar.accent} ${pillar.iconColor} flex items-center justify-center mb-4`}
                  >
                    <pillar.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-black text-[#1E2746] dark:text-white tracking-tight">
                    {pillar.title}
                  </h3>
                  <p className="mt-2.5 text-xs text-[#5851A4] dark:text-[#94A3B8] leading-relaxed font-medium">
                    {pillar.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#EAE4F7]/60 dark:border-[#1F2937] flex items-center gap-1.5 text-[11px] font-bold text-[#5851A4] dark:text-[#A5B4FC]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Verified Identity</span>
                </div>
              </div>
            ))}
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

      {/* Footer */}
      <footer className="relative z-10 bg-white/90 dark:bg-[#0B0F19]/90 border-t border-[#EAE4F7] dark:border-[#1E293B] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white dark:bg-[#1E293B] flex items-center justify-center p-1 border border-[#EAE4F7] dark:border-[#334155]">
              <img
                src="/knots_logo.png"
                alt="KNOTS"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-sm font-black text-[#1E2746] dark:text-white">
                KNOTS Platform
              </span>
              <p className="text-[11px] text-[#5851A4] dark:text-[#94A3B8]">
                © {new Date().getFullYear()} S.B. Jain Institute of Technology,
                Management & Research. All rights reserved.
              </p>
            </div>
          </div>

          {/* Quick Links / Modal Triggers */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-[#5851A4] dark:text-[#94A3B8]">
            <button
              onClick={() => setActiveModal("about")}
              className="hover:text-[#4B63D2] dark:hover:text-white transition-colors cursor-pointer"
            >
              About
            </button>
            <button
              onClick={() => setActiveModal("community")}
              className="hover:text-[#4B63D2] dark:hover:text-white transition-colors cursor-pointer"
            >
              Community
            </button>
            <button
              onClick={() => setActiveModal("resources")}
              className="hover:text-[#4B63D2] dark:hover:text-white transition-colors cursor-pointer"
            >
              Resources
            </button>
            <button
              onClick={() => setActiveModal("privacy")}
              className="hover:text-[#4B63D2] dark:hover:text-white transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setActiveModal("terms")}
              className="hover:text-[#4B63D2] dark:hover:text-white transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              onClick={() => setActiveModal("contact")}
              className="hover:text-[#4B63D2] dark:hover:text-white transition-colors cursor-pointer"
            >
              Help & Support
            </button>
          </div>
        </div>
      </footer>

      {/* Global Info Modal */}
      <InfoModal type={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
}
