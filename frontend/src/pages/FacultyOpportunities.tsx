import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Briefcase,
  GraduationCap,
  Users,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  IndianRupee,
  BookOpen,
  Award,
  Trash2,
  Loader2,
  Building,
  FlaskConical,
  MessageSquare,
  ExternalLink,
  RotateCcw,
  Tag,
  LayoutDashboard,
} from "lucide-react";
import {
  fetchOpportunities,
  createOpportunity,
  fetchMyPostings,
  fetchOpportunityApplications,
  updateOpportunityApplicationStatus,
  updateOpportunity,
  deleteOpportunity,
  searchStudents,
  Opportunity,
  OpportunityApplication,
  OpportunityType,
  OpportunityApplicationStatus,
  StudentSearchResult,
} from "../services/opportunities";
import { apiRequest } from "../services/api";

// ── Type badge helper ───────────────────────────────────────────────────────
const TYPE_CONFIG: Record<
  OpportunityType,
  { label: string; icon: typeof Briefcase; color: string; bg: string; border: string }
> = {
  JOB: {
    label: "Job Posting",
    icon: Briefcase,
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
  },
  INTERNSHIP: {
    label: "Internship Posting",
    icon: GraduationCap,
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  RESEARCH: {
    label: "Research Collaboration",
    icon: FlaskConical,
    color: "text-indigo-700 dark:text-indigo-300",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    border: "border-indigo-200 dark:border-indigo-800",
  },
  MENTORSHIP: {
    label: "Mentorship",
    icon: BookOpen,
    color: "text-purple-700 dark:text-purple-300",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    border: "border-purple-200 dark:border-purple-800",
  },
};

const POPULAR_SKILLS = [
  "Python",
  "Machine Learning",
  "React",
  "Data Science",
  "Deep Learning",
  "Artificial Intelligence",
  "Java",
  "Cloud Computing",
  "NLP",
  "Computer Vision",
  "Research Methodology",
  "SQL",
  "Node.js",
  "Embedded Systems",
  "Cybersecurity",
];

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Information Technology",
  "Artificial Intelligence & Data Science",
  "Electronics & Telecommunication",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
];

const BATCHES = [2024, 2025, 2026, 2027, 2028, 2029];

const STATUS_COLORS: Record<string, string> = {
  APPLIED: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
  PENDING: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  SHORTLISTED: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  ACCEPTED: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  REJECTED: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
};


function formatTimeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function FacultyOpportunities() {
  const [activeTab, setActiveTab] = useState<
    "create-opportunity" | "faculty-research" | "my-postings" | "find-students"
  >("create-opportunity");

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [myPostings, setMyPostings] = useState<Opportunity[]>([]);
  const [students, setStudents] = useState<StudentSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Current user
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    email: string;
    role_id?: number;
    role?: { id: number; name: string };
    department?: string;
    profile?: { first_name?: string; last_name?: string; department?: string };
  } | null>(null);

  // Create Job / Internship Form
  const [oppType, setOppType] = useState<"JOB" | "INTERNSHIP">("JOB");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSkills, setFormSkills] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formStipend, setFormStipend] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formMaxApplicants, setFormMaxApplicants] = useState("");
  const [formDeadline, setFormDeadline] = useState("");
  const [formLink, setFormLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Faculty Research Form states
  const [researchTitle, setResearchTitle] = useState("");
  const [researchDomain, setResearchDomain] = useState("");
  const [researchDescription, setResearchDescription] = useState("");
  const [researchDepartment, setResearchDepartment] = useState("");
  const [researchSkills, setResearchSkills] = useState("");
  const [researchPositions, setResearchPositions] = useState("");
  const [researchDuration, setResearchDuration] = useState("");
  const [researchPerks, setResearchPerks] = useState("");
  const [researchFormLink, setResearchFormLink] = useState("");
  const [researchDeadline, setResearchDeadline] = useState("");
  const [submittingResearch, setSubmittingResearch] = useState(false);
  const [showResearchForm, setShowResearchForm] = useState(false);

  // Detail / expand applications for postings
  const [expandedOpp, setExpandedOpp] = useState<number | null>(null);
  const [oppApplications, setOppApplications] = useState<Record<number, OpportunityApplication[]>>({});
  const [loadingApps, setLoadingApps] = useState<number | null>(null);

  // Student search states (Filter by Skills & Batch)
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [studentSkillsFilter, setStudentSkillsFilter] = useState("");
  const [studentBatchFilter, setStudentBatchFilter] = useState("");
  const [studentDeptFilter, setStudentDeptFilter] = useState("");
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [hasSearchedStudents, setHasSearchedStudents] = useState(false);

  // ── Load user & initial data ─────────────────────────────────────────────

  const userRole = (currentUser?.role?.name || "").toLowerCase().trim();
  const isHod = userRole.includes("hod") || currentUser?.role_id === 10;
  const hodDept = currentUser?.profile?.department || currentUser?.department || "";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await apiRequest<any>("/users/me");
        setCurrentUser(user);
        const roleLower = (user.role?.name || "").toLowerCase().trim();
        const userIsHod = roleLower.includes("hod") || user.role_id === 10;
        if (userIsHod) {
          setActiveTab("my-postings");
          if (user.profile?.department) {
            setStudentDeptFilter(user.profile.department);
          }
        }
        if (user.profile?.department && !formDepartment) {
          setFormDepartment(user.profile.department);
        }
      } catch {
        // ignore
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (isHod && activeTab === "create-opportunity") {
      setActiveTab("my-postings");
    }
  }, [isHod, activeTab]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    const handleFocus = () => {
      // User returned to window - refresh applications & postings
      if (activeTab === "faculty-research" || activeTab === "my-postings") {
        fetchMyPostings()
          .then((p) => setMyPostings(p))
          .catch(() => {});
        fetchOpportunities({ opportunity_type: "RESEARCH" })
          .then((opps) => setOpportunities(opps))
          .catch(() => {});
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "faculty-research" || activeTab === "my-postings") {
        const [postings, researchOpps] = await Promise.all([
          fetchMyPostings().catch(() => []),
          fetchOpportunities({ opportunity_type: "RESEARCH" }).catch(() => []),
        ]);
        setMyPostings(postings);
        setOpportunities(researchOpps);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // ── Create Job / Internship ──────────────────────────────────────────────

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const skillsArray = formSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await createOpportunity({
        title: formTitle.trim(),
        description: formDescription.trim(),
        opportunity_type: oppType,
        required_skills: skillsArray.length > 0 ? skillsArray : undefined,
        department: (formDepartment || currentUser?.profile?.department || "").trim() || undefined,
        location: formLocation.trim() || undefined,
        stipend_or_salary: formStipend.trim() || undefined,
        duration: formDuration.trim() || undefined,
        max_applicants: formMaxApplicants ? parseInt(formMaxApplicants) : undefined,
        application_deadline: formDeadline ? new Date(formDeadline).toISOString() : undefined,
        form_link: formLink.trim() || undefined,
      });

      setSuccessMsg(
        `${oppType === "JOB" ? "Job" : "Internship"} opportunity created and published successfully!`
      );
      // Reset form
      setFormTitle("");
      setFormDescription("");
      setFormSkills("");
      setFormLocation("");
      setFormStipend("");
      setFormDuration("");
      setFormMaxApplicants("");
      setFormDeadline("");
      setFormLink("");

      setTimeout(() => {
        setSuccessMsg(null);
        setActiveTab("my-postings");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to create opportunity");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Create Faculty Research ─────────────────────────────────────────────

  const handleCreateResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!researchTitle.trim() || !researchDescription.trim()) {
      setError("Please fill in the Research Project Title and Abstract / Description.");
      return;
    }
    setSubmittingResearch(true);
    setError(null);
    try {
      const skillsArray = researchSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        title: researchTitle.trim(),
        description: researchDescription.trim(),
        opportunity_type: "RESEARCH" as const,
        required_skills: skillsArray.length > 0 ? skillsArray : undefined,
        department: (researchDepartment || currentUser?.profile?.department || currentUser?.department || "").trim() || undefined,
        location: researchDomain.trim() ? `Research Domain: ${researchDomain.trim()}` : "Research Lab",
        stipend_or_salary: researchPerks.trim() || undefined,
        duration: researchDuration.trim() || undefined,
        max_applicants: researchPositions ? parseInt(researchPositions) : undefined,
        application_deadline: researchDeadline ? new Date(researchDeadline).toISOString() : undefined,
        form_link: researchFormLink.trim() || undefined,
      };

      await createOpportunity(payload);
      setSuccessMsg(`Research Project "${researchTitle.trim()}" published successfully! Students can now view it in their Faculty Research tab and request to join.`);
      // Reset form
      setResearchTitle("");
      setResearchDomain("");
      setResearchDescription("");
      setResearchSkills("");
      setResearchPositions("");
      setResearchDuration("");
      setResearchPerks("");
      setResearchFormLink("");
      setResearchDeadline("");
      setShowResearchForm(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to publish research project");
    } finally {
      setSubmittingResearch(false);
    }
  };

  // ── Candidate Application ────────────────────────────────────────────────

  // ── Applications for my postings ─────────────────────────────────────────

  const loadApplications = async (oppId: number) => {
    if (expandedOpp === oppId) {
      setExpandedOpp(null);
      return;
    }
    setLoadingApps(oppId);
    try {
      const apps = await fetchOpportunityApplications(oppId);
      setOppApplications((prev) => ({ ...prev, [oppId]: apps }));
      setExpandedOpp(oppId);
    } catch (err: any) {
      setError(err.message || "Failed to load applicants");
    } finally {
      setLoadingApps(null);
    }
  };

  const handleUpdateAppStatus = async (
    appId: number,
    oppId: number,
    newStatus: OpportunityApplicationStatus
  ) => {
    try {
      const updated = await updateOpportunityApplicationStatus(appId, newStatus);
      setOppApplications((prev) => ({
        ...prev,
        [oppId]: (prev[oppId] || []).map((a) => (a.id === appId ? updated : a)),
      }));
      setSuccessMsg(`Application status updated to ${newStatus}`);
      setTimeout(() => setSuccessMsg(null), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    }
  };

  const handleCloseOpportunity = async (oppId: number) => {
    try {
      await updateOpportunity(oppId, { status: "CLOSED" });
      setSuccessMsg("Opportunity marked as closed");
      setTimeout(() => setSuccessMsg(null), 2000);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to close opportunity");
    }
  };

  const handleDeleteOpportunity = async (oppId: number) => {
    if (!confirm("Are you sure you want to delete this opportunity?")) return;
    try {
      await deleteOpportunity(oppId);
      setSuccessMsg("Opportunity deleted");
      setTimeout(() => setSuccessMsg(null), 2000);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to delete opportunity");
    }
  };

  // ── Student search (Filter by Skills & Batch) ─────────────────────────────

  const handleStudentSearch = async () => {
    setSearchingStudents(true);
    setError(null);
    setHasSearchedStudents(true);
    try {
      const results = await searchStudents({
        search: studentSearchQuery.trim() || undefined,
        skills: studentSkillsFilter.trim() || undefined,
        department: studentDeptFilter.trim() || undefined,
        graduation_year: studentBatchFilter ? parseInt(studentBatchFilter) : undefined,
      });
      setStudents(results);
    } catch (err: any) {
      setError(err.message || "Failed to search students");
    } finally {
      setSearchingStudents(false);
    }
  };

  const handleClearStudentFilters = () => {
    setStudentSearchQuery("");
    setStudentSkillsFilter("");
    setStudentBatchFilter("");
    if (!isHod) {
      setStudentDeptFilter("");
    }
    setStudents([]);
    setHasSearchedStudents(false);
  };

  const handleToggleSkill = (skill: string) => {
    const current = studentSkillsFilter
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const exists = current.some((s) => s.toLowerCase() === skill.toLowerCase());
    let next: string[];
    if (exists) {
      next = current.filter((s) => s.toLowerCase() !== skill.toLowerCase());
    } else {
      next = [...current, skill];
    }
    setStudentSkillsFilter(next.join(", "));
  };

  // ── Auto-clear error ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

  // ── Navigation Tabs ───────────────────────────────────────────────────────
  const tabs = [
    {
      id: "create-opportunity" as const,
      label: "Create Opportunities",
      subtitle: "Job & Internship Posting",
      icon: PlusCircle,
    },
    {
      id: "faculty-research" as const,
      label: "Faculty Research",
      subtitle: "Post Research & Accept Requests",
      icon: FlaskConical,
    },
    {
      id: "my-postings" as const,
      label: isHod ? "Department Postings & Applicants" : "My Postings & Applicants",
      subtitle: isHod ? "Department Student Participation" : "Manage All Listings",
      icon: Eye,
    },
    {
      id: "find-students" as const,
      label: isHod ? "Department Students" : "Find Students",
      subtitle: isHod ? "Directory & Skill Search" : "Filter by Skills & Batch",
      icon: Search,
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-16">
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-white via-[#FAF9FD] to-white dark:from-[#111827] dark:via-[#161F30] dark:to-[#111827] border border-[#EAE4F7] dark:border-[#1F2937] rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#4B63D2]/10 text-[#4B63D2] dark:bg-[#4B63D2]/20 dark:text-[#818CF8] border border-[#4B63D2]/20">
                {isHod ? <Building className="w-3.5 h-3.5" /> : <Award className="w-3.5 h-3.5" />}
                {isHod ? `HOD Department Portal • ${hodDept || "Department"}` : "Faculty Portal"}
              </span>
              {isHod && (
                <Link
                  to="/hod"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-all"
                >
                  <LayoutDashboard className="w-3 h-3" />
                  HOD Dashboard
                </Link>
              )}
              <span className="text-xs font-semibold text-[#5851A4] dark:text-[#94A3B8]">
                {currentUser?.email}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1E2746] dark:text-[#F1F5F9] tracking-tight">
              {isHod ? "Department Opportunities & Participation Tracker" : "Opportunities & Recruitment Console"}
            </h1>
            <p className="text-sm text-[#5851A4] dark:text-[#94A3B8] mt-1 font-medium max-w-2xl">
              {isHod
                ? `Track active campus opportunities, inspect which students from ${hodDept || "your department"} have taken part, and review student applicants.`
                : "Post job & internship openings, discover talented student candidates filtered by technical skills and graduation batch, and manage your active listings and student applicants."}
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-2xl p-3 shadow-xs shrink-0">
            <div className="text-center px-2">
              <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] font-bold">
                {isHod ? "Dept Listings" : "Total Postings"}
              </p>
              <p className="text-xl font-black text-[#4B63D2]">{myPostings.length}</p>
            </div>
            <div className="h-8 w-px bg-[#EAE4F7] dark:bg-[#334155]" />
            <div className="text-center px-2">
              <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] font-bold">
                {isHod ? "Dept Applicants" : "Active Listings"}
              </p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {isHod
                  ? myPostings.reduce((sum, p) => sum + (p.applications_count || 0), 0)
                  : myPostings.filter((p) => p.status === "OPEN").length}
              </p>
            </div>
          </div>
        </div>

        {/* ── Tabs Navigation ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-[#EAE4F7] dark:border-[#1F2937]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-start p-3 rounded-2xl text-left transition-all cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-tr from-[#4B63D2] to-[#5851A4] text-white shadow-lg shadow-[#4B63D2]/30 scale-[1.02]"
                    : "bg-white dark:bg-[#1E293B] text-[#5851A4] dark:text-[#94A3B8] border border-[#EAE4F7] dark:border-[#334155] hover:border-[#4B63D2]/40 hover:bg-[#FAF9FD] dark:hover:bg-[#161F30]"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#FFD21A]" : "text-[#4B63D2]"}`} />
                  <span className="text-xs font-black leading-none">{tab.label}</span>
                </div>
                <span
                  className={`text-[10px] leading-tight font-medium ${
                    isActive ? "text-white/80" : "text-[#5851A4]/80 dark:text-[#94A3B8]/80"
                  }`}
                >
                  {tab.subtitle}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Global Alert Notifications ────────────────────────────────────── */}
      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-800 dark:text-rose-200 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* FEATURE 1: CREATE OPPORTUNITIES (JOB & INTERNSHIP POSTINGS)         */}
      {/* ==================================================================== */}
      {!isHod && activeTab === "create-opportunity" && (
        <div className="bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#EAE4F7] dark:border-[#334155] pb-5">
            <div>
              <h2 className="text-xl font-black text-[#1E2746] dark:text-[#F1F5F9] flex items-center gap-2.5">
                <Briefcase className="w-6 h-6 text-[#4B63D2]" />
                Create New Opportunity
              </h2>
              <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] mt-1 font-medium">
                Publish verified Job openings or Internship postings to SBJIT students and alumni.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateOpportunity} className="space-y-6">
            {/* Opportunity Type Toggle */}
            <div>
              <label className="text-xs font-black text-[#1E2746] dark:text-[#F1F5F9] mb-2 block uppercase tracking-wider">
                Select Opportunity Category *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => setOppType("JOB")}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                    oppType === "JOB"
                      ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 shadow-sm ring-2 ring-blue-500/20"
                      : "bg-[#FAF9FD] dark:bg-[#0F172A] text-[#5851A4] dark:text-[#94A3B8] border-[#EAE4F7] dark:border-[#334155] hover:border-blue-300"
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span>Job Opportunity</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOppType("INTERNSHIP")}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                    oppType === "INTERNSHIP"
                      ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 shadow-sm ring-2 ring-emerald-500/20"
                      : "bg-[#FAF9FD] dark:bg-[#0F172A] text-[#5851A4] dark:text-[#94A3B8] border-[#EAE4F7] dark:border-[#334155] hover:border-emerald-300"
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  <span>Internship Opportunity</span>
                </button>
              </div>
            </div>

            {/* Title & Department */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1.5 block">
                  {oppType === "JOB" ? "Job Title *" : "Internship Role Title *"}
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  placeholder={
                    oppType === "JOB"
                      ? "e.g. Junior Cloud Engineer / Software Developer"
                      : "e.g. AI/ML Research Intern - Summer 2026"
                  }
                  className="w-full px-4 py-2.5 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4B63D2]/30 focus:border-[#4B63D2]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#5851A4] dark:text-[#94A3B8]">
                    Target Department
                  </label>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                    🔒 Locked to Your Department
                  </span>
                </div>
                <div className="w-full px-4 py-2.5 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-sm font-semibold text-[#1E2746] dark:text-white flex items-center justify-between">
                  <span>{formDepartment || currentUser?.profile?.department || "Department Specific"}</span>
                  <span className="text-xs text-[#5851A4] font-normal">Coordinator Dept</span>
                </div>
              </div>
            </div>

            {/* Location & Compensation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1.5 block">
                  Workplace Location
                </label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="e.g. On-Campus, Remote, or Nagpur"
                  className="w-full px-4 py-2.5 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4B63D2]/30 focus:border-[#4B63D2]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1.5 block">
                  Stipend / Salary Range
                </label>
                <input
                  type="text"
                  value={formStipend}
                  onChange={(e) => setFormStipend(e.target.value)}
                  placeholder="e.g. ₹15,000/month or 4.5 LPA"
                  className="w-full px-4 py-2.5 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4B63D2]/30 focus:border-[#4B63D2]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1.5 block">
                  Duration
                </label>
                <input
                  type="text"
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value)}
                  placeholder="e.g. 3 Months, 6 Months, Full-time"
                  className="w-full px-4 py-2.5 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4B63D2]/30 focus:border-[#4B63D2]"
                />
              </div>
            </div>

            {/* Skills required */}
            <div>
              <label className="text-xs font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1.5 block">
                Required Technical Skills (comma-separated or click to add)
              </label>
              <input
                type="text"
                value={formSkills}
                onChange={(e) => setFormSkills(e.target.value)}
                placeholder="e.g. Python, Machine Learning, React, SQL"
                className="w-full px-4 py-2.5 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4B63D2]/30 focus:border-[#4B63D2]"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {POPULAR_SKILLS.slice(0, 10).map((skill) => {
                  const isSelected = formSkills
                    .toLowerCase()
                    .includes(skill.toLowerCase());
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => {
                        const parts = formSkills
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean);
                        if (isSelected) {
                          setFormSkills(
                            parts.filter((p) => p.toLowerCase() !== skill.toLowerCase()).join(", ")
                          );
                        } else {
                          setFormSkills([...parts, skill].join(", "));
                        }
                      }}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#4B63D2] text-white border-[#4B63D2]"
                          : "bg-[#FAF9FD] dark:bg-[#0F172A] text-[#5851A4] dark:text-[#94A3B8] border-[#EAE4F7] dark:border-[#334155] hover:border-[#4B63D2]/40"
                      }`}
                    >
                      + {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1.5 block">
                Opportunity Description & Requirements *
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                required
                rows={4}
                placeholder="Detail the opportunity responsibilities, eligibility criteria, student tasks, and selection process..."
                className="w-full px-4 py-2.5 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4B63D2]/30 focus:border-[#4B63D2] resize-none"
              />
            </div>

            {/* Application Deadline & Max Applicants */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1.5 block">
                  Application Deadline
                </label>
                <input
                  type="date"
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4B63D2]/30 focus:border-[#4B63D2]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1.5 block">
                  Maximum Applicants (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formMaxApplicants}
                  onChange={(e) => setFormMaxApplicants(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full px-4 py-2.5 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4B63D2]/30 focus:border-[#4B63D2]"
                />
              </div>
            </div>

            {/* Application Form Link (External Form) */}
            <div>
              <label className="text-xs font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold text-[#1E2746] dark:text-[#F1F5F9]">
                  <ExternalLink className="w-4 h-4 text-[#4B63D2]" />
                  Application Form Link (Optional)
                </span>
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                  Google Form / MS Form / External Link
                </span>
              </label>
              <input
                type="url"
                value={formLink}
                onChange={(e) => setFormLink(e.target.value)}
                placeholder="https://forms.google.com/... or https://forms.office.com/..."
                className="w-full px-4 py-2.5 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4B63D2]/30 focus:border-[#4B63D2]"
              />
              <p className="text-[11px] text-[#5851A4] dark:text-[#94A3B8] mt-1 font-medium">
                When candidates click <strong>Apply</strong>, this form link will automatically open in a new tab. When they complete or return, their status in Knots will become <strong>Applied</strong> and the applicant count will increase.
              </p>
            </div>

            {/* Action button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#4B63D2]/30 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Publishing Opportunity...
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4 text-[#FFD21A]" />
                    Publish {oppType === "JOB" ? "Job" : "Internship"} Opportunity
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* FEATURE 2: FIND STUDENTS (FILTER BY SKILLS AND BATCH)               */}
      {/* ==================================================================== */}
      {activeTab === "find-students" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Search className="w-5 h-5 text-[#4B63D2]" />
                <h2 className="text-xl font-black text-[#1E2746] dark:text-[#F1F5F9]">
                  Find Students by Skills & Batch
                </h2>
              </div>
              <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] font-medium max-w-2xl">
                Filter SBJIT students by graduation batch and specialized technical skills to recruit candidates for research papers, job roles, or project positions.
              </p>
            </div>

            {/* Filter Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Batch Filter */}
              <div>
                <label className="text-xs font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1.5 block flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#4B63D2]" />
                  Graduation Batch
                </label>
                <select
                  value={studentBatchFilter}
                  onChange={(e) => setStudentBatchFilter(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4B63D2]/30 focus:border-[#4B63D2]"
                >
                  <option value="">All Batches</option>
                  {BATCHES.map((b) => (
                    <option key={b} value={b}>
                      Batch of {b} ({b - 4}–{b})
                    </option>
                  ))}
                </select>
              </div>

              {/* Skills Filter Input */}
              <div>
                <label className="text-xs font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1.5 block flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#4B63D2]" />
                  Technical Skills
                </label>
                <input
                  type="text"
                  value={studentSkillsFilter}
                  onChange={(e) => setStudentSkillsFilter(e.target.value)}
                  placeholder="e.g. Python, ML, React"
                  onKeyDown={(e) => e.key === "Enter" && handleStudentSearch()}
                  className="w-full px-4 py-2.5 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4B63D2]/30 focus:border-[#4B63D2]"
                />
              </div>

              {/* Department Filter */}
              <div>
                <label className="text-xs font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1.5 block flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[#4B63D2]" />
                  Department {isHod && "(Locked to your department)"}
                </label>
                <select
                  value={isHod ? (hodDept || studentDeptFilter) : studentDeptFilter}
                  disabled={isHod}
                  onChange={(e) => setStudentDeptFilter(e.target.value)}
                  className={`w-full px-4 py-2.5 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4B63D2]/30 focus:border-[#4B63D2] ${
                    isHod ? "opacity-80 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300" : ""
                  }`}
                >
                  {!isHod && <option value="">All Departments</option>}
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name or Keyword */}
              <div>
                <label className="text-xs font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1.5 block flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-[#4B63D2]" />
                  Student Name / Email
                </label>
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  placeholder="Search by name..."
                  onKeyDown={(e) => e.key === "Enter" && handleStudentSearch()}
                  className="w-full px-4 py-2.5 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4B63D2]/30 focus:border-[#4B63D2]"
                />
              </div>
            </div>

            {/* Quick Skill Selector Chips */}
            <div>
              <span className="text-[11px] font-bold text-[#5851A4] dark:text-[#94A3B8] block mb-2">
                Quick-Filter by Key Skills:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_SKILLS.map((skill) => {
                  const isSelected = studentSkillsFilter
                    .split(",")
                    .map((s) => s.trim().toLowerCase())
                    .includes(skill.toLowerCase());
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleToggleSkill(skill)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white border-[#4B63D2] shadow-sm scale-105"
                          : "bg-[#FAF9FD] dark:bg-[#0F172A] text-[#5851A4] dark:text-[#94A3B8] border-[#EAE4F7] dark:border-[#334155] hover:border-[#4B63D2]/50 hover:bg-white"
                      }`}
                    >
                      {skill} {isSelected ? "✓" : "+"}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleStudentSearch}
                disabled={searchingStudents}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white rounded-2xl text-xs font-bold shadow-md shadow-[#4B63D2]/25 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {searchingStudents ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Searching Students...
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5 text-[#FFD21A]" />
                    Filter Students
                  </>
                )}
              </button>

              {(studentSearchQuery ||
                studentSkillsFilter ||
                studentBatchFilter ||
                studentDeptFilter ||
                hasSearchedStudents) && (
                <button
                  type="button"
                  onClick={handleClearStudentFilters}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#FAF9FD] dark:bg-[#0F172A] text-[#5851A4] dark:text-[#94A3B8] border border-[#EAE4F7] dark:border-[#334155] rounded-2xl text-xs font-bold hover:bg-white transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Student Results List */}
          {searchingStudents ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 className="w-8 h-8 text-[#4B63D2] animate-spin" />
              <p className="text-xs font-bold text-[#5851A4] dark:text-[#94A3B8]">
                Scanning student profiles and batches...
              </p>
            </div>
          ) : hasSearchedStudents && students.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-3xl p-8 space-y-3">
              <Users className="w-12 h-12 text-[#5851A4]/30 mx-auto" />
              <h3 className="text-base font-bold text-[#1E2746] dark:text-[#F1F5F9]">
                No Students Found Matching Filters
              </h3>
              <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] max-w-md mx-auto">
                Try loosening your filters, selecting fewer skills, or choosing "All Batches" to discover more candidates.
              </p>
            </div>
          ) : students.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-black text-[#1E2746] dark:text-[#F1F5F9] uppercase tracking-wider">
                  Discovered {students.length} Student Candidate{students.length !== 1 ? "s" : ""}
                </p>
                <span className="text-xs text-[#5851A4] dark:text-[#94A3B8]">
                  Sorted by skillset relevance
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {students.map((student) => {
                  const studentName =
                    `${student.first_name || ""} ${student.last_name || ""}`.trim() ||
                    student.email;
                  const studentAvatar = student.profile_picture;
                  const studentSkillsList: string[] = Array.isArray(student.skills)
                    ? student.skills
                    : typeof student.skills === "object" && student.skills
                    ? Object.values(student.skills).flat()
                    : [];

                  return (
                    <div
                      key={student.id}
                      className="bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-2xl p-5 hover:shadow-lg hover:shadow-[#4B63D2]/5 hover:border-[#4B63D2]/30 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="flex items-start gap-3.5">
                        {studentAvatar ? (
                          <img
                            src={studentAvatar}
                            alt=""
                            className="w-12 h-12 rounded-full object-cover border-2 border-[#EAE4F7] dark:border-[#334155] shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#4B63D2] to-[#5851A4] flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm">
                            {studentName.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-black text-[#1E2746] dark:text-[#F1F5F9] truncate">
                              {studentName}
                            </h4>
                            {student.graduation_year && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                <GraduationCap className="w-3 h-3" />
                                Batch {student.graduation_year}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] font-medium truncate mt-0.5">
                            {student.department || "SBJIT Student"} • {student.email}
                          </p>

                          {/* Skills Chips */}
                          {studentSkillsList.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                              {studentSkillsList.map((skill: string, idx: number) => {
                                const isMatched =
                                  studentSkillsFilter &&
                                  studentSkillsFilter
                                    .toLowerCase()
                                    .includes(skill.toLowerCase());
                                return (
                                  <span
                                    key={idx}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                      isMatched
                                        ? "bg-[#4B63D2]/15 text-[#4B63D2] dark:text-[#818CF8] border-[#4B63D2]/30 font-black"
                                        : "bg-[#FAF9FD] dark:bg-[#0F172A] text-[#5851A4] dark:text-[#94A3B8] border-[#EAE4F7] dark:border-[#334155]"
                                    }`}
                                  >
                                    {skill}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAE4F7] dark:border-[#334155]">
                      <Link
                        to={`/profile/${student.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF9FD] dark:bg-[#0F172A] text-[#5851A4] dark:text-[#94A3B8] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-xs font-bold hover:text-[#1E2746] dark:hover:text-white transition-all"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Profile
                      </Link>

                      <Link
                        to={`/messaging?userId=${student.id}`}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white rounded-xl text-xs font-bold shadow-sm hover:scale-105 transition-all"
                      >
                        <MessageSquare className="w-3 h-3 text-[#FFD21A]" />
                        Message Candidate
                      </Link>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-3xl p-8">
              <Sparkles className="w-10 h-10 text-[#4B63D2]/40 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-[#1E2746] dark:text-[#F1F5F9]">
                Ready to Find Students
              </h3>
              <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] mt-1 max-w-sm mx-auto">
                Select your preferred technical skills or graduation batch above and click "Filter Students" to view candidate profiles.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* FEATURE 3: MY POSTINGS & APPLICANTS (ALL OPPORTUNITIES)              */}
      {/* ==================================================================== */}
      {activeTab === "my-postings" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-black text-[#1E2746] dark:text-[#F1F5F9] flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#4B63D2]" />
              {isHod
                ? `Department Opportunities & Student Participation (${myPostings.length})`
                : `All Faculty Postings (${myPostings.length})`}
            </h3>
            {isHod ? (
              <button
                onClick={() => setActiveTab("faculty-research")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4B63D2] hover:underline cursor-pointer"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                Faculty Research
              </button>
            ) : (
              <button
                onClick={() => setActiveTab("create-opportunity")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4B63D2] hover:underline cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                + Create Another Opportunity
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#4B63D2] animate-spin" />
            </div>
          ) : myPostings.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-3xl p-8 space-y-3">
              <Award className="w-12 h-12 text-[#5851A4]/30 mx-auto" />
              <h4 className="text-base font-bold text-[#1E2746] dark:text-[#F1F5F9]">
                {isHod
                  ? `No Opportunities Found for ${hodDept || "Department"}`
                  : "No Opportunities Posted Yet"}
              </h4>
              <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] max-w-sm mx-auto">
                {isHod
                  ? `No active opportunities currently have student applicants from ${hodDept || "your department"}. Check back once students take part or view faculty research.`
                  : "Start by creating a job, internship, or research collaboration posting for SBJIT students."}
              </p>
              {isHod ? (
                <button
                  onClick={() => setActiveTab("faculty-research")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4B63D2] text-white rounded-xl text-xs font-bold hover:scale-105 transition-all cursor-pointer"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  Faculty Research
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab("create-opportunity")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4B63D2] text-white rounded-xl text-xs font-bold hover:scale-105 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Create First Opportunity
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {myPostings.map((opp) => {
                const cfg = TYPE_CONFIG[opp.opportunity_type];
                const TypeIcon = cfg.icon;
                const isExpanded = expandedOpp === opp.id;
                const apps = oppApplications[opp.id] || [];
                return (
                  <div
                    key={opp.id}
                    className="bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-3xl overflow-hidden shadow-sm transition-all"
                  >
                    <div className="p-6 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color} ${cfg.bg} ${cfg.border}`}
                            >
                              <TypeIcon className="w-3 h-3" />
                              {cfg.label}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                opp.status === "OPEN"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                  : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              {opp.status}
                            </span>
                          </div>

                          <h4 className="text-base font-black text-[#1E2746] dark:text-[#F1F5F9]">
                            {opp.title}
                          </h4>
                        </div>

                        {!isHod && (
                          <div className="flex items-center gap-2 shrink-0">
                            {opp.status === "OPEN" && (
                              <button
                                onClick={() => handleCloseOpportunity(opp.id)}
                                className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold hover:scale-105 transition-all cursor-pointer"
                              >
                                Close
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteOpportunity(opp.id)}
                              className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-[#5851A4] dark:text-[#94A3B8] line-clamp-2">
                        {opp.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#5851A4] dark:text-[#94A3B8]">
                        {opp.department && (
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {opp.department}
                          </span>
                        )}
                        {opp.stipend_or_salary && (
                          <span className="flex items-center gap-1">
                            <IndianRupee className="w-3 h-3" />
                            {opp.stipend_or_salary}
                          </span>
                        )}
                        <span>{formatTimeAgo(opp.created_at)}</span>
                      </div>

                      {/* Applicants Toggle */}
                      <div className="pt-2 border-t border-[#EAE4F7] dark:border-[#334155]">
                        <button
                          onClick={() => loadApplications(opp.id)}
                          className="inline-flex items-center gap-2 text-xs font-black text-[#4B63D2] hover:text-[#5851A4] cursor-pointer"
                        >
                          <Users className="w-4 h-4" />
                          <span>
                            {opp.applications_count} {isHod ? "Department Student" : "Applicant"}
                            {opp.applications_count !== 1 ? "s" : ""} Participated
                          </span>
                          {loadingApps === opp.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Applicants Panel */}
                    {isExpanded && (
                      <div className="border-t border-[#EAE4F7] dark:border-[#334155] bg-[#FAF9FD] dark:bg-[#0F172A] p-5 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-[#EAE4F7] dark:border-[#334155]">
                          <span className="text-xs font-black text-[#1E2746] dark:text-[#F1F5F9]">
                            {isHod
                              ? `Students from ${hodDept || "Department"} Who Applied (${apps.length})`
                              : `Student Applicants (${apps.length})`}
                          </span>
                          <span className="text-[11px] text-[#5851A4] dark:text-[#94A3B8]">
                            {isHod ? "Department-isolated participation view" : "Student submissions"}
                          </span>
                        </div>
                        {apps.length === 0 ? (
                          <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] text-center py-4 font-medium">
                            {isHod
                              ? `No students from ${hodDept || "your department"} have applied to this opportunity yet.`
                              : "No student applications yet for this opportunity."}
                          </p>
                        ) : (
                          apps.map((app) => (
                            <div
                              key={app.id}
                              className="bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                {app.applicant_avatar ? (
                                  <img
                                    src={app.applicant_avatar}
                                    alt=""
                                    className="w-10 h-10 rounded-full object-cover border border-[#EAE4F7] shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#5851A4] to-[#4B63D2] flex items-center justify-center text-white text-xs font-black shrink-0">
                                    {(app.applicant_name || "?")[0].toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold text-[#1E2746] dark:text-[#F1F5F9] truncate">
                                      {app.applicant_name || app.applicant_email}
                                    </p>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                        STATUS_COLORS[app.status] || STATUS_COLORS.PENDING
                                      }`}
                                    >
                                      {app.status}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] truncate">
                                    {app.applicant_department || "Student"} • {app.applicant_email}
                                  </p>
                                  {app.message && (
                                    <p className="text-xs text-[#1E2746] dark:text-[#F1F5F9] italic mt-1 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-[#EAE4F7] dark:border-[#334155]">
                                      "{app.message}"
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {app.applicant_id && (
                                  <Link
                                    to={`/messaging?userId=${app.applicant_id}`}
                                    className="p-2 text-[#4B63D2] hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl transition-all"
                                    title="Message Student"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                  </Link>
                                )}
                                {app.status === "PENDING" && (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleUpdateAppStatus(app.id, opp.id, "SHORTLISTED")
                                      }
                                      className="px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-[11px] font-bold cursor-pointer hover:scale-105 transition-all"
                                    >
                                      Shortlist
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleUpdateAppStatus(app.id, opp.id, "REJECTED")
                                      }
                                      className="px-2.5 py-1 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-[11px] font-bold cursor-pointer hover:scale-105 transition-all"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                                {app.status === "SHORTLISTED" && (
                                  <button
                                    onClick={() =>
                                      handleUpdateAppStatus(app.id, opp.id, "ACCEPTED")
                                    }
                                    className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-[11px] font-bold cursor-pointer hover:scale-105 transition-all shadow-sm"
                                  >
                                    Accept
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* FEATURE 4: FACULTY RESEARCH HUB (POST RESEARCH & ACCEPT REQUESTS)    */}
      {/* ==================================================================== */}
      {activeTab === "faculty-research" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-white/20 text-white backdrop-blur-md">
                  <FlaskConical className="w-3.5 h-3.5 text-[#FFD21A]" />
                  Faculty Research Nexus
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Faculty Research Projects & Collaborations
                </h2>
                <p className="text-indigo-100 text-xs sm:text-sm font-medium leading-relaxed">
                  Publish your ongoing scientific research work, lab studies, and conference papers. Review student join requests and accept student researchers to collaborate on your projects.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowResearchForm(!showResearchForm)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#FFD21A] to-amber-400 hover:from-amber-400 hover:to-[#FFD21A] text-[#1E2746] font-extrabold text-xs transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer shrink-0"
              >
                <PlusCircle className="w-4 h-4 text-[#1E2746]" />
                <span>{showResearchForm ? "Hide Research Form" : "+ Post Research Work"}</span>
              </button>
            </div>
          </div>

          {/* Research Posting Form */}
          {showResearchForm && (
            <div className="bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-[#EAE4F7] dark:border-[#334155] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#1E2746] dark:text-[#F1F5F9]">
                      Publish Ongoing Research Work
                    </h3>
                    <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] font-medium">
                      Visible to all students in their Faculty Research tab where they can request to join.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreateResearch} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-[#1E2746] dark:text-[#F1F5F9] mb-1 block">
                      Research Paper / Project Title *
                    </label>
                    <input
                      type="text"
                      value={researchTitle}
                      onChange={(e) => setResearchTitle(e.target.value)}
                      required
                      placeholder="e.g. Autonomous Drone Navigation using Deep Reinforcement Learning"
                      className="w-full px-4 py-2.5 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-xs font-medium text-[#1E2746] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>

                  {/* Research Domain */}
                  <div>
                    <label className="text-xs font-bold text-[#1E2746] dark:text-[#F1F5F9] mb-1 block">
                      Research Field / Domain *
                    </label>
                    <input
                      type="text"
                      value={researchDomain}
                      onChange={(e) => setResearchDomain(e.target.value)}
                      placeholder="e.g. Artificial Intelligence, Robotics, IoT, VLSI, Cybersecurity"
                      className="w-full px-4 py-2.5 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-xs font-medium text-[#1E2746] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label className="text-xs font-bold text-[#1E2746] dark:text-[#F1F5F9] mb-1 block">
                      Host Department
                    </label>
                    <select
                      value={researchDepartment}
                      onChange={(e) => setResearchDepartment(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-xs font-medium text-[#1E2746] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
                    >
                      <option value="">{currentUser?.profile?.department || "General / Interdisciplinary"}</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Abstract & Scope */}
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-[#1E2746] dark:text-[#F1F5F9] mb-1 block">
                      Research Abstract, Objectives & Student Scope *
                    </label>
                    <textarea
                      value={researchDescription}
                      onChange={(e) => setResearchDescription(e.target.value)}
                      required
                      rows={4}
                      placeholder="Describe the research problem, methodology, current progress, and what responsibilities the student collaborators will undertake..."
                      className="w-full px-4 py-2.5 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-xs font-medium text-[#1E2746] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none leading-relaxed"
                    />
                  </div>

                  {/* Prerequisites & Required Skills */}
                  <div>
                    <label className="text-xs font-bold text-[#1E2746] dark:text-[#F1F5F9] mb-1 block">
                      Required Skills & Prerequisites (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={researchSkills}
                      onChange={(e) => setResearchSkills(e.target.value)}
                      placeholder="e.g. Python, PyTorch, ROS, Linear Algebra, OpenCV"
                      className="w-full px-4 py-2.5 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-xs font-medium text-[#1E2746] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="text-xs font-bold text-[#1E2746] dark:text-[#F1F5F9] mb-1 block">
                      Expected Duration
                    </label>
                    <input
                      type="text"
                      value={researchDuration}
                      onChange={(e) => setResearchDuration(e.target.value)}
                      placeholder="e.g. 6 Months, 1 Semester, Ongoing"
                      className="w-full px-4 py-2.5 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-xs font-medium text-[#1E2746] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>

                  {/* Perks / Co-Authorship / Stipend */}
                  <div>
                    <label className="text-xs font-bold text-[#1E2746] dark:text-[#F1F5F9] mb-1 block">
                      Student Perks / Co-Authorship / Stipend
                    </label>
                    <input
                      type="text"
                      value={researchPerks}
                      onChange={(e) => setResearchPerks(e.target.value)}
                      placeholder="e.g. IEEE Paper Co-Authorship, ₹8,000/mo Grant, Certificate"
                      className="w-full px-4 py-2.5 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-xs font-medium text-[#1E2746] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>

                  {/* Student Positions Available */}
                  <div>
                    <label className="text-xs font-bold text-[#1E2746] dark:text-[#F1F5F9] mb-1 block">
                      Student Openings / Max Collaborators
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={researchPositions}
                      onChange={(e) => setResearchPositions(e.target.value)}
                      placeholder="e.g. 2"
                      className="w-full px-4 py-2.5 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-xs font-medium text-[#1E2746] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>

                  {/* Form Link (Optional) */}
                  <div>
                    <label className="text-xs font-bold text-[#1E2746] dark:text-[#F1F5F9] mb-1 block">
                      Research Form / Repository Link (Optional)
                    </label>
                    <input
                      type="url"
                      value={researchFormLink}
                      onChange={(e) => setResearchFormLink(e.target.value)}
                      placeholder="https://forms.gle/... or https://github.com/..."
                      className="w-full px-4 py-2.5 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-xs font-medium text-[#1E2746] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>

                  {/* Deadline (Optional) */}
                  <div>
                    <label className="text-xs font-bold text-[#1E2746] dark:text-[#F1F5F9] mb-1 block">
                      Application Deadline (Optional)
                    </label>
                    <input
                      type="date"
                      value={researchDeadline}
                      onChange={(e) => setResearchDeadline(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-xs font-medium text-[#1E2746] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAE4F7] dark:border-[#334155]">
                  <button
                    type="button"
                    onClick={() => setShowResearchForm(false)}
                    className="px-5 py-2.5 rounded-xl border border-[#EAE4F7] dark:border-[#334155] text-xs font-bold text-[#5851A4] dark:text-[#94A3B8] hover:bg-[#FAF9FD] dark:hover:bg-[#0F172A] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingResearch}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submittingResearch ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Publishing Research...</span>
                      </>
                    ) : (
                      <>
                        <FlaskConical className="w-4 h-4 text-[#FFD21A]" />
                        <span>Publish Research Project</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Section: My Research Projects & Student Requests */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-[#1E2746] dark:text-[#F1F5F9] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  My Research Projects & Student Join Requests
                </h3>
                <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] font-medium">
                  Review student requests to join your research. Click "Accept to Research" to confirm their participation.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {myPostings.filter((p) => p.opportunity_type === "RESEARCH").length} Projects
              </span>
            </div>

            {myPostings.filter((p) => p.opportunity_type === "RESEARCH").length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-3xl p-8 space-y-4">
                <FlaskConical className="w-12 h-12 text-indigo-400/40 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-[#1E2746] dark:text-[#F1F5F9]">
                    No Research Projects Posted Yet
                  </h4>
                  <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] max-w-md mx-auto font-medium">
                    Publish your first research project using the form above. Students will be able to browse it in their Faculty Research tab and request to join.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResearchForm(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-[#FFD21A]" />
                  <span>Post Research Work Now</span>
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {myPostings
                  .filter((p) => p.opportunity_type === "RESEARCH")
                  .map((project) => {
                    const isExpanded = expandedOpp === project.id;
                    const apps = oppApplications[project.id] || [];
                    const pendingCount = apps.filter((a) => a.status === "PENDING" || a.status === "APPLIED").length;
                    const acceptedCount = apps.filter((a) => a.status === "ACCEPTED").length;

                    return (
                      <div
                        key={project.id}
                        className="bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4"
                      >
                        {/* Project Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800">
                                <FlaskConical className="w-3 h-3" />
                                Research Collaboration
                              </span>
                              {project.location && (
                                <span className="text-xs font-semibold text-[#4B63D2]">
                                  {project.location}
                                </span>
                              )}
                              {project.department && (
                                <span className="text-xs text-[#5851A4] dark:text-[#94A3B8]">
                                  • {project.department}
                                </span>
                              )}
                            </div>

                            <h4 className="text-lg font-black text-[#1E2746] dark:text-[#F1F5F9]">
                              {project.title}
                            </h4>
                          </div>

                          {/* Student requests button */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => loadApplications(project.id)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isExpanded
                                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                                  : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
                              }`}
                            >
                              <Users className="w-4 h-4" />
                              <span>
                                {isExpanded ? "Hide Requests" : `View Student Requests (${project.applications_count || 0})`}
                              </span>
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Project Description */}
                        <p className="text-xs sm:text-sm text-[#5851A4] dark:text-[#94A3B8] leading-relaxed whitespace-pre-line">
                          {project.description}
                        </p>

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#5851A4] dark:text-[#94A3B8] pt-1">
                          {project.stipend_or_salary && (
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              🏆 {project.stipend_or_salary}
                            </span>
                          )}
                          {project.duration && (
                            <span className="flex items-center gap-1">
                              Duration: <strong className="text-[#1E2746] dark:text-[#F1F5F9]">{project.duration}</strong>
                            </span>
                          )}
                          {project.max_applicants && (
                            <span className="flex items-center gap-1">
                              Openings: <strong className="text-[#1E2746] dark:text-[#F1F5F9]">{project.max_applicants} slots</strong>
                            </span>
                          )}
                          <span>Published {formatTimeAgo(project.created_at)}</span>
                        </div>

                        {/* Required skills */}
                        {project.required_skills && project.required_skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {project.required_skills.map((skill, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] rounded-lg text-[10px] font-bold text-[#5851A4] dark:text-[#94A3B8]"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Expanded Student Requests Section */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-[#EAE4F7] dark:border-[#334155] space-y-3 bg-[#FAF9FD] dark:bg-[#0F172A] -mx-6 -mb-6 p-6 rounded-b-3xl">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-xs font-black uppercase tracking-wider text-[#1E2746] dark:text-[#F1F5F9] flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-600" />
                                Student Join Requests for this Research
                              </h5>
                              <div className="flex items-center gap-2">
                                {acceptedCount > 0 && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    {acceptedCount} Accepted
                                  </span>
                                )}
                                {pendingCount > 0 && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                                    {pendingCount} Pending Review
                                  </span>
                                )}
                              </div>
                            </div>

                            {loadingApps === project.id ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                              </div>
                            ) : apps.length === 0 ? (
                              <div className="text-center py-8 bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-2xl p-4">
                                <p className="text-xs font-medium text-[#5851A4] dark:text-[#94A3B8]">
                                  No student join requests received yet for this project.
                                </p>
                              </div>
                            ) : (
                              <div className="grid gap-3">
                                {apps.map((app) => (
                                  <div
                                    key={app.id}
                                    className="bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-2xl p-4 space-y-3 shadow-xs"
                                  >
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                      <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <h6 className="text-sm font-black text-[#1E2746] dark:text-[#F1F5F9]">
                                            {app.applicant_name || app.applicant_email}
                                          </h6>
                                          <span
                                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                              STATUS_COLORS[app.status] || "bg-slate-100 text-slate-700"
                                            }`}
                                          >
                                            {app.status === "ACCEPTED" ? "✓ Accepted to Research" : app.status}
                                          </span>
                                        </div>
                                        <div className="text-[11px] text-[#5851A4] dark:text-[#94A3B8] flex items-center gap-2 flex-wrap mt-0.5">
                                          <span>✉️ {app.applicant_email}</span>
                                          {app.applicant_department && (
                                            <span>• 🎓 {app.applicant_department}</span>
                                          )}
                                          {app.applied_at && (
                                            <span>• Applied {formatTimeAgo(app.applied_at)}</span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Accept / Reject Actions */}
                                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                                        {app.status !== "ACCEPTED" && (
                                          <button
                                            type="button"
                                            onClick={() => handleUpdateAppStatus(app.id, project.id, "ACCEPTED")}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                                            title="Accept student to join research"
                                          >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>Accept to Research</span>
                                          </button>
                                        )}
                                        {app.status !== "SHORTLISTED" && app.status !== "ACCEPTED" && (
                                          <button
                                            type="button"
                                            onClick={() => handleUpdateAppStatus(app.id, project.id, "SHORTLISTED")}
                                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                          >
                                            Shortlist
                                          </button>
                                        )}
                                        {app.status !== "REJECTED" && (
                                          <button
                                            type="button"
                                            onClick={() => handleUpdateAppStatus(app.id, project.id, "REJECTED")}
                                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                          >
                                            Decline
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Student's statement */}
                                    {app.message && (
                                      <div className="bg-[#FAF9FD] dark:bg-[#0F172A] border border-[#EAE4F7] dark:border-[#334155] p-3 rounded-xl">
                                        <p className="text-[11px] font-bold text-[#4B63D2] uppercase tracking-wider mb-0.5">
                                          Statement of Interest & Prerequisites
                                        </p>
                                        <p className="text-xs text-[#1E2746] dark:text-[#F1F5F9] whitespace-pre-line leading-relaxed">
                                          {app.message}
                                        </p>
                                      </div>
                                    )}

                                    {/* Resume URL */}
                                    {app.resume_url && (
                                      <div className="flex items-center gap-2">
                                        <a
                                          href={app.resume_url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                          View Student Resume / Portfolio
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Campus Colleague Research Projects */}
            {opportunities.filter((o) => o.opportunity_type === "RESEARCH" && o.posted_by_id !== currentUser?.id).length > 0 && (
              <div className="space-y-4 pt-6 border-t border-[#EAE4F7] dark:border-[#334155]">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-[#1E2746] dark:text-[#F1F5F9] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      Other Campus Research Initiatives
                    </h3>
                    <p className="text-xs text-[#5851A4] dark:text-[#94A3B8]">
                      Active research projects led by other faculty across university departments
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {opportunities.filter((o) => o.opportunity_type === "RESEARCH" && o.posted_by_id !== currentUser?.id).length} Projects
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {opportunities
                    .filter((o) => o.opportunity_type === "RESEARCH" && o.posted_by_id !== currentUser?.id)
                    .map((colleagueProject) => (
                      <div
                        key={colleagueProject.id}
                        className="bg-white dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                              <FlaskConical className="w-3 h-3" />
                              {colleagueProject.department || "Research Project"}
                            </span>
                            <h4 className="text-sm font-black text-[#1E2746] dark:text-[#F1F5F9]">
                              {colleagueProject.title}
                            </h4>
                          </div>
                          {colleagueProject.form_link && (
                            <a
                              href={colleagueProject.form_link}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                              title="External Project Form / Link"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] line-clamp-3 leading-relaxed">
                          {colleagueProject.description}
                        </p>
                        <div className="pt-2 border-t border-[#EAE4F7] dark:border-[#334155] flex items-center justify-between text-[11px] text-[#5851A4] dark:text-[#94A3B8]">
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            👨‍🏫 {colleagueProject.posted_by_name || "Faculty Lead"}
                          </span>
                          <span>{formatTimeAgo(colleagueProject.created_at)}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
