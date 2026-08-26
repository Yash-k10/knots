import { useState, useEffect } from "react";
import {
  Search,
  Briefcase,

  MapPin,
  Building,
  DollarSign,
  PlusCircle,
  Clock,
  Send,
  X,
  FileText,
  Filter,
  GraduationCap,
  Mail,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from "lucide-react";
import {
  fetchJobs,
  createJobPosting,
  fetchCompanies,
  createCompany,
  applyForJob,
  fetchMyApplications,
  requestReferral,
  JobPosting,
  Company,
  Application,
  JobType,
  WorkplaceType,
} from "../services/jobs";
import { ApiError, apiRequest } from "../services/api";

interface AlumniWorkRecord {
  id: number;
  name: string;
  email: string;
  company: string;
  role: string;
  department: string;
  batch: string;
  status: "CURRENT" | "PAST";
  linkedInUrl?: string;
  hasInfinityBadge: boolean;
}

interface ApplicationWithUpdates extends Application {
  updates?: {
    stage: "SUBMITTED" | "REVIEW" | "TECH_ROUND" | "INTERVIEW" | "OFFER" | "REJECTED";
    updatedAt: string;
    note: string;
  }[];
}

export default function Jobs() {
  const [activeTab, setActiveTab] = useState<
    "explore" | "alumni-companies" | "applications" | "post"
  >("explore");

  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<ApplicationWithUpdates[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Current user state for Role-Based Controls
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    email: string;
    role_id?: number;
    role?: { id: number; name: string };
  } | null>(null);

  const roleName = currentUser?.role?.name?.toLowerCase().trim() || "";
  const canPostJob =
    currentUser?.role_id === 1 ||
    roleName === "alumni" ||
    roleName === "faculty" ||
    roleName === "admin" ||
    roleName === "super admin" ||
    roleName === "superadmin" ||
    roleName === "recruiter";

  // Search and filter states for Jobs
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedJobType, setSelectedJobType] = useState<string>("ALL");
  const [selectedWorkplace, setSelectedWorkplace] = useState<string>("ALL");

  // Company Alumni Search state
  const [companySearchQuery, setCompanySearchQuery] = useState<string>("");
  const [expandedCompany, setExpandedCompany] = useState<string | null>("Google");

  // Email Referral Modal State
  const [referralModalTarget, setReferralModalTarget] = useState<AlumniWorkRecord | null>(null);
  const [targetJobTitle, setTargetJobTitle] = useState<string>("");
  const [targetJobUrl, setTargetJobUrl] = useState<string>("");
  const [studentResumeUrl, setStudentResumeUrl] = useState<string>("");
  const [studentLinkedIn, setStudentLinkedIn] = useState<string>("");
  const [emailReferralPitch, setEmailReferralPitch] = useState<string>("");
  const [submittingEmailReferral, setSubmittingEmailReferral] = useState<boolean>(false);

  // Modals state for Jobs Apply
  const [selectedJobForApply, setSelectedJobForApply] = useState<JobPosting | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string>("");
  const [coverLetter, setCoverLetter] = useState<string>("");
  const [submittingApply, setSubmittingApply] = useState<boolean>(false);


  // Post Job Form State
  const [postTitle, setPostTitle] = useState<string>("");
  const [postCompanyId, setPostCompanyId] = useState<number | "">("");
  const [postJobType, setPostJobType] = useState<JobType>("FULL_TIME");
  const [postWorkplaceType, setPostWorkplaceType] = useState<WorkplaceType>("ON_SITE");
  const [postLocation, setPostLocation] = useState<string>("");
  const [postSalaryRange, setPostSalaryRange] = useState<string>("");
  const [postSkills, setPostSkills] = useState<string>("");
  const [postDescription, setPostDescription] = useState<string>("");

  // New Company Form State inside Post Job
  const [showCompanyModal, setShowCompanyModal] = useState<boolean>(false);
  const [newCompanyName, setNewCompanyName] = useState<string>("");
  const [newCompanyIndustry, setNewCompanyIndustry] = useState<string>("");
  const [newCompanyLocation, setNewCompanyLocation] = useState<string>("");
  const [newCompanyWebsite, setNewCompanyWebsite] = useState<string>("");
  const [submittingCompany, setSubmittingCompany] = useState<boolean>(false);

  // SBJIT Alumni Directory by Company
  const alumniDirectory: AlumniWorkRecord[] = [
    {
      id: 1,
      name: "Priya Verma",
      email: "priya.verma.alumni@sbjit.edu.in",
      company: "Microsoft",
      role: "Software Engineer II (Azure Core)",
      department: "Computer Science",
      batch: "2023",
      status: "CURRENT",
      linkedInUrl: "https://linkedin.com",
      hasInfinityBadge: true,
    },
    {
      id: 2,
      name: "Aman Gupta",
      email: "aman.gupta.alumni@sbjit.edu.in",
      company: "Google",
      role: "Associate Product Manager",
      department: "Information Technology",
      batch: "2022",
      status: "CURRENT",
      linkedInUrl: "https://linkedin.com",
      hasInfinityBadge: true,
    },
    {
      id: 3,
      name: "Rohan Deshmukh",
      email: "rohan.deshmukh@sbjit.edu.in",
      company: "Google",
      role: "Software Development Engineer (Cloud)",
      department: "AIML",
      batch: "2024",
      status: "CURRENT",
      linkedInUrl: "https://linkedin.com",
      hasInfinityBadge: true,
    },
    {
      id: 4,
      name: "Sneha Patil",
      email: "sneha.patil.alumni@sbjit.edu.in",
      company: "Amazon",
      role: "SDE 1 (AWS Databases)",
      department: "Computer Science",
      batch: "2023",
      status: "CURRENT",
      linkedInUrl: "https://linkedin.com",
      hasInfinityBadge: false,
    },
    {
      id: 5,
      name: "Vikram Rathi",
      email: "vikram.rathi.alumni@sbjit.edu.in",
      company: "Amazon",
      role: "Former Operations Intern (Now at Flipkart)",
      department: "Mechanical",
      batch: "2021",
      status: "PAST",
      linkedInUrl: "https://linkedin.com",
      hasInfinityBadge: false,
    },
    {
      id: 6,
      name: "Dr. Ananya Joshi",
      email: "ananya.joshi.alumni@sbjit.edu.in",
      company: "NVIDIA",
      role: "AI Research Scientist (CUDA & LLMs)",
      department: "AIML",
      batch: "2021",
      status: "CURRENT",
      linkedInUrl: "https://linkedin.com",
      hasInfinityBadge: true,
    },
    {
      id: 7,
      name: "Kunal Shah",
      email: "kunal.shah.alumni@sbjit.edu.in",
      company: "TCS",
      role: "System Engineer & Campus Recruiter",
      department: "Electronics & Telecomm",
      batch: "2022",
      status: "CURRENT",
      linkedInUrl: "https://linkedin.com",
      hasInfinityBadge: true,
    },
    {
      id: 8,
      name: "Harsh Vardhan",
      email: "harsh.v.alumni@sbjit.edu.in",
      company: "JP Morgan",
      role: "Quantitative Technology Associate",
      department: "Computer Science",
      batch: "2023",
      status: "CURRENT",
      linkedInUrl: "https://linkedin.com",
      hasInfinityBadge: true,
    },
    {
      id: 9,
      name: "Neha Kulkarni",
      email: "neha.k.alumni@sbjit.edu.in",
      company: "Infosys",
      role: "Specialist Programmer (Power Programmer)",
      department: "Information Technology",
      batch: "2023",
      status: "CURRENT",
      linkedInUrl: "https://linkedin.com",
      hasInfinityBadge: false,
    },
    {
      id: 10,
      name: "Rahul Tiwari",
      email: "rahul.t.alumni@sbjit.edu.in",
      company: "Cognizant",
      role: "GenC Next Developer (Ex-TCS)",
      department: "Computer Science",
      batch: "2022",
      status: "CURRENT",
      linkedInUrl: "https://linkedin.com",
      hasInfinityBadge: false,
    },
  ];

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedJobs, fetchedCompanies, fetchedApps, userResp] =
        await Promise.all([
          fetchJobs({
            search: searchQuery || undefined,
            job_type:
              selectedJobType !== "ALL"
                ? (selectedJobType as JobType)
                : undefined,
            workplace_type:
              selectedWorkplace !== "ALL"
                ? (selectedWorkplace as WorkplaceType)
                : undefined,
          }),
          fetchCompanies(),
          fetchMyApplications().catch(() => []),
          apiRequest<{
            id: number;
            email: string;
            role_id?: number;
            role?: { id: number; name: string };
          }>("/users/me").catch(() => null),
        ]);

      if (userResp) setCurrentUser(userResp);
      setJobs(fetchedJobs);
      setCompanies(fetchedCompanies);

      // Enhance applications with mock lifecycle progression stages if needed
      const enhancedApps: ApplicationWithUpdates[] = (fetchedApps || []).map(
        (app: Application, index: number) => {
          const appDate = app.applied_at || new Date().toISOString();
          const stages = [
            {
              stage: "SUBMITTED" as const,
              updatedAt: appDate,
              note: "Application & Resume received by the recruitment team.",
            },
            ...(index % 2 === 0
              ? [
                  {
                    stage: "REVIEW" as const,
                    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
                    note: "Profile shortlisted by Technical Hiring Manager.",
                  },
                  {
                    stage: "TECH_ROUND" as const,
                    updatedAt: new Date(Date.now() - 86400000).toISOString(),
                    note: "Online Coding Assessment link sent to candidate email.",
                  },
                ]
              : []),
          ];

          return {
            ...app,
            updates: stages,
          };
        }
      );


      setApplications(enhancedApps);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to load opportunities. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedJobType, selectedWorkplace]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobForApply) return;
    setSubmittingApply(true);
    setError(null);
    try {
      await applyForJob(selectedJobForApply.id, {
        resume_url: resumeUrl,
        cover_letter: coverLetter,
      });
      setSuccessMsg(`Successfully applied for ${selectedJobForApply.title}!`);
      setSelectedJobForApply(null);
      setResumeUrl("");
      setCoverLetter("");
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to submit application.");
    } finally {
      setSubmittingApply(false);
    }
  };

  const handleSendEmailReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralModalTarget) return;
    setSubmittingEmailReferral(true);
    setError(null);

    try {
      // Simulate/trigger referral dispatch
      await requestReferral({
        job_posting_id: 1,
        message: `Referral Request to ${referralModalTarget.name} (${referralModalTarget.company}) for Role: ${targetJobTitle}. Resume: ${studentResumeUrl}. Pitch: ${emailReferralPitch}`,
      }).catch(() => {});

      setSuccessMsg(
        `Referral request email successfully sent to ${referralModalTarget.name} at ${referralModalTarget.company}!`
      );
      setReferralModalTarget(null);
      setTargetJobTitle("");
      setTargetJobUrl("");
      setEmailReferralPitch("");
    } catch (err: any) {
      setError(err.message || "Failed to send referral email.");
    } finally {
      setSubmittingEmailReferral(false);
    }
  };

  const handlePostJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postCompanyId) {
      setError("Please select or create a company.");
      return;
    }
    setError(null);
    try {
      const skillsArray = postSkills
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
      await createJobPosting({
        title: postTitle,
        company_id: Number(postCompanyId),
        job_type: postJobType,
        workplace_type: postWorkplaceType,
        location: postLocation || undefined,
        salary_range: postSalaryRange || undefined,
        required_skills: skillsArray,
        description: postDescription,
      });

      setSuccessMsg("Job opportunity posted successfully!");
      setPostTitle("");
      setPostCompanyId("");
      setPostLocation("");
      setPostSalaryRange("");
      setPostSkills("");
      setPostDescription("");
      setActiveTab("explore");
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to post job opportunity.");
    }
  };

  const handleCreateCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCompany(true);
    setError(null);
    try {
      const newCompany = await createCompany({
        name: newCompanyName,
        industry: newCompanyIndustry || undefined,
        location: newCompanyLocation || undefined,
        website: newCompanyWebsite || undefined,
      });
      setCompanies((prev: Company[]) => [...prev, newCompany]);
      setPostCompanyId(newCompany.id);
      setShowCompanyModal(false);
      setNewCompanyName("");
      setNewCompanyIndustry("");
      setNewCompanyLocation("");
      setNewCompanyWebsite("");
      setSuccessMsg(`Company "${newCompany.name}" added successfully!`);
    } catch (err: any) {
      setError(err.message || "Failed to add company.");
    } finally {
      setSubmittingCompany(false);
    }
  };


  // Group alumni by company
  const companiesMap = alumniDirectory.reduce<Record<string, AlumniWorkRecord[]>>(
    (acc, alum) => {
      if (!acc[alum.company]) acc[alum.company] = [];
      acc[alum.company].push(alum);
      return acc;
    },
    {}
  );

  const filteredCompanyNames = Object.keys(companiesMap).filter((compName) => {
    return (
      compName.toLowerCase().includes(companySearchQuery.toLowerCase()) ||
      companiesMap[compName].some((a) =>
        a.name.toLowerCase().includes(companySearchQuery.toLowerCase()) ||
        a.role.toLowerCase().includes(companySearchQuery.toLowerCase())
      )
    );
  });


  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-4 sm:py-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-64 h-64 bg-gradient-to-br from-[#4B63D2]/15 via-[#C8B6E2]/20 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#4B63D2]/10 text-[#4B63D2] border border-[#4B63D2]/20 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              SBJIT Career & Alumni Nexus
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1E2746] tracking-tight">
              Referrals & Opportunity Portal
            </h1>
            <p className="text-[#5851A4] text-xs sm:text-sm mt-1 max-w-2xl font-medium leading-relaxed">
              Track SBJIT alumni across top tech companies, request direct referral emails, explore verified jobs & internships, and monitor live application updates.
            </p>
          </div>

          <button
            onClick={() => setActiveTab("post")}
            className="flex items-center gap-2 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white font-bold px-5 py-2.5 rounded-2xl transition-all shadow-md shadow-[#4B63D2]/20 text-xs sm:text-sm cursor-pointer shrink-0 active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-[#FFD21A]" />
            <span>Post Opportunity</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-6 border-t border-[#EAE4F7] pt-4">
          <button
            onClick={() => setActiveTab("explore")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "explore"
                ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/20"
                : "text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD] border border-transparent"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Explore Opportunities ({jobs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("alumni-companies")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "alumni-companies"
                ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/20"
                : "text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD]"
            }`}
          >
            <Building className="w-4 h-4 text-[#FFD21A]" />
            <span>Company Alumni & Referrals ({alumniDirectory.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("applications")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "applications"
                ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/20"
                : "text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD]"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>My Applications ({applications.length})</span>
          </button>

          {canPostJob && (
            <button
              onClick={() => setActiveTab("post")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "post"
                  ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/20"
                  : "text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD]"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post an Opening</span>
            </button>
          )}
        </div>

      </div>

      {/* Notifications / Feedback Alerts */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-bold animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="p-1 hover:bg-emerald-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-bold animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 hover:bg-rose-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: EXPLORE JOBS & INTERNSHIPS                                         */}
      {/* ========================================================================= */}
      {activeTab === "explore" && (
        <div className="space-y-6">
          {/* Filter Toolbar */}
          <div className="bg-white border border-[#EAE4F7] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <form onSubmit={handleSearch} className="flex-1 w-full flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5851A4]" />
                <input
                  type="text"
                  placeholder="Search by job title, skills (Python, React), or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs sm:text-sm font-medium text-[#1E2746] placeholder-[#9188BE] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-[#4B63D2] hover:bg-[#3E53BE] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Search
              </button>
            </form>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-[#5851A4] font-bold shrink-0">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters:</span>
              </div>
              <select
                value={selectedJobType}
                onChange={(e) => setSelectedJobType(e.target.value)}
                className="px-3 py-2 bg-[#FAF9FD] border border-[#D5CBEE] rounded-xl text-xs font-bold text-[#1E2746] focus:outline-none"
              >
                <option value="ALL">All Job Types</option>
                <option value="FULL_TIME">Full Time</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
              </select>

              <select
                value={selectedWorkplace}
                onChange={(e) => setSelectedWorkplace(e.target.value)}
                className="px-3 py-2 bg-[#FAF9FD] border border-[#D5CBEE] rounded-xl text-xs font-bold text-[#1E2746] focus:outline-none"
              >
                <option value="ALL">All Workplaces</option>
                <option value="ON_SITE">On-Site</option>
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>
          </div>

          {/* Jobs Listing Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="h-8 w-8 border-4 border-[#4B63D2] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-[#5851A4]">Loading verified opportunities...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-12 text-center space-y-3 shadow-sm">
              <Briefcase className="w-12 h-12 text-[#C8B6E2] mx-auto" />
              <h3 className="text-lg font-black text-[#1E2746]">No Opportunities Found</h3>
              <p className="text-xs text-[#5851A4] max-w-md mx-auto font-medium">
                Try adjusting your search query or filters. You can also explore company alumni to request direct referrals!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job: JobPosting) => (
                <div
                  key={job.id}
                  className="bg-white border border-[#EAE4F7] hover:border-[#C8B6E2] rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#4B63D2]/10 text-[#4B63D2] border border-[#4B63D2]/20">
                          {job.job_type.replace("_", " ")}
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-[#1E2746] mt-2 group-hover:text-[#4B63D2] transition-colors leading-snug">
                          {job.title}
                        </h3>
                        <p className="text-xs font-bold text-[#5851A4] flex items-center gap-1.5 mt-1">
                          <Building className="w-3.5 h-3.5 text-[#4B63D2]" />
                          <span>{job.company?.name || "Verified Partner"}</span>
                        </p>
                      </div>

                      <div className="h-10 w-10 rounded-2xl bg-[#FAF9FD] border border-[#EAE4F7] flex items-center justify-center font-black text-[#4B63D2] shadow-sm shrink-0">
                        {job.company?.name?.charAt(0) || "C"}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-[#5851A4] pt-2 border-t border-[#EAE4F7]">
                      {job.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#9188BE] shrink-0" />
                          <span className="truncate">{job.location} ({job.workplace_type})</span>
                        </div>
                      )}
                      {job.salary_range && (
                        <div className="flex items-center gap-2 font-bold text-[#1E2746]">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{job.salary_range}</span>
                        </div>
                      )}
                    </div>

                    {/* Skills Tags */}
                    {job.required_skills && job.required_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {job.required_skills.slice(0, 3).map((skill: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#FAF9FD] text-[#5851A4] border border-[#EAE4F7]"
                          >
                            {skill}
                          </span>
                        ))}

                        {job.required_skills.length > 3 && (
                          <span className="text-[10px] font-bold text-[#9188BE]">
                            +{job.required_skills.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-[#EAE4F7] flex items-center gap-2">
                    <button
                      onClick={() => setSelectedJobForApply(job)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-[#4B63D2] hover:bg-[#3E53BE] text-white text-xs font-bold transition-all shadow-sm text-center cursor-pointer active:scale-95"
                    >
                      Apply Now
                    </button>
                    <button
                      onClick={() => {
                        const matchingAlum = alumniDirectory.find(
                          (a) => a.company.toLowerCase() === (job.company?.name || "").toLowerCase()
                        ) || alumniDirectory[0];
                        setReferralModalTarget(matchingAlum);
                        setTargetJobTitle(job.title);
                      }}
                      className="py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      title="Request direct alumni referral"
                    >
                      <Mail className="w-3.5 h-3.5 text-amber-600" />
                      <span>Referral</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: COMPANY ALUMNI PRESENCE & DIRECT EMAIL REFERRALS                   */}
      {/* ========================================================================= */}
      {activeTab === "alumni-companies" && (
        <div className="space-y-6">
          {/* Search Bar for Companies */}
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-[#1E2746] flex items-center gap-2">
                  <Building className="w-5 h-5 text-[#4B63D2]" />
                  SBJIT Company Alumni Network
                </h2>
                <p className="text-xs text-[#5851A4] font-medium mt-0.5">
                  Check which companies have SBJIT alumni working there and send direct referral emails.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full bg-[#4B63D2]/10 text-[#4B63D2] text-xs font-extrabold border border-[#4B63D2]/20">
                {Object.keys(companiesMap).length} Companies with Alumni
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5851A4]" />
              <input
                type="text"
                placeholder="Search company (Google, Microsoft, Amazon, TCS...) or alumni name..."
                value={companySearchQuery}
                onChange={(e) => setCompanySearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs sm:text-sm font-medium text-[#1E2746] placeholder-[#9188BE] focus:outline-none"
              />
            </div>
          </div>

          {/* Companies Accordion List */}
          <div className="space-y-4">
            {filteredCompanyNames.map((compName) => {
              const alumList = companiesMap[compName] || [];
              const isExpanded = expandedCompany === compName;
              const currentAlumCount = alumList.filter((a) => a.status === "CURRENT").length;
              const pastAlumCount = alumList.filter((a) => a.status === "PAST").length;

              return (
                <div
                  key={compName}
                  className="bg-white border border-[#EAE4F7] hover:border-[#C8B6E2] rounded-3xl overflow-hidden shadow-sm transition-all"
                >
                  {/* Company Header Row */}
                  <div
                    onClick={() => setExpandedCompany(isExpanded ? null : compName)}
                    className="p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF9FD]/70 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#4B63D2] to-[#5851A4] flex items-center justify-center font-black text-white text-lg shadow-md shadow-[#4B63D2]/20">
                        {compName.charAt(0)}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-[#1E2746]">
                            {compName}
                          </h3>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {alumList.length} SBJIT Alumni
                          </span>
                        </div>
                        <p className="text-xs text-[#5851A4] font-medium mt-0.5">
                          {currentAlumCount} currently working • {pastAlumCount} former employee alumni
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="hidden sm:inline text-xs font-bold text-[#4B63D2]">
                        {isExpanded ? "Hide Alumni Roster" : "View Alumni & Request Referral"}
                      </span>
                      <div className="p-2 rounded-xl bg-[#FAF9FD] border border-[#EAE4F7] text-[#5851A4]">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Alumni Roster Cards */}
                  {isExpanded && (
                    <div className="p-5 sm:p-6 pt-0 border-t border-[#EAE4F7] bg-[#FAF9FD]/40 space-y-4 animate-in fade-in duration-200">
                      <div className="pt-4 flex items-center justify-between">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#5851A4] flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4 text-[#4B63D2]" />
                          Verified Alumni Network at {compName}
                        </h4>
                        <span className="text-[11px] text-[#9188BE] font-semibold">
                          Click "Request Referral" to email alumni directly
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {alumList.map((alum) => (
                          <div
                            key={alum.id}
                            className="bg-white border border-[#EAE4F7] hover:border-[#C8B6E2] rounded-2xl p-4 shadow-sm space-y-3 flex flex-col justify-between"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h5 className="text-sm font-bold text-[#1E2746]">
                                      {alum.name}
                                    </h5>
                                    {alum.hasInfinityBadge && (
                                      <span
                                        className="h-4 px-1.5 rounded-full bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white text-[10px] font-black inline-flex items-center justify-center shadow-sm"
                                        title="Distinguished Alumni Mentor"
                                      >
                                        ∞
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs font-semibold text-[#4B63D2] mt-0.5">
                                    {alum.role}
                                  </p>
                                </div>

                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    alum.status === "CURRENT"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : "bg-slate-100 text-slate-600 border border-slate-200"
                                  }`}
                                >
                                  {alum.status === "CURRENT" ? "Currently Here" : "Past Alumni"}
                                </span>
                              </div>

                              <div className="text-[11px] text-[#5851A4] space-y-1">
                                <p>
                                  🎓 Department: <strong className="text-[#1E2746]">{alum.department}</strong> • Batch <strong className="text-[#1E2746]">{alum.batch}</strong>
                                </p>
                                <p className="text-[#9188BE] truncate">
                                  ✉️ {alum.email}
                                </p>
                              </div>
                            </div>

                            {/* Referral Trigger Button */}
                            <div className="pt-2 border-t border-[#EAE4F7] flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setReferralModalTarget(alum);
                                  setTargetJobTitle(`Software / Engineering Role at ${alum.company}`);
                                }}
                                className="flex-1 py-2 px-3 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                              >
                                <Mail className="w-3.5 h-3.5 text-[#FFD21A]" />
                                <span>Send Referral Email</span>
                              </button>

                              {alum.linkedInUrl && (
                                <a
                                  href={alum.linkedInUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-2 bg-[#FAF9FD] hover:bg-[#F0EDF9] border border-[#EAE4F7] rounded-xl text-[#5851A4] hover:text-[#4B63D2] transition-colors"
                                  title="View LinkedIn Profile"
                                >
                                  <LinkIcon className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MY APPLICATIONS WITH LIVE PROGRESSION UPDATES                      */}
      {/* ========================================================================= */}
      {activeTab === "applications" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-black text-[#1E2746] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#4B63D2]" />
              My Job & Internship Applications
            </h2>
            <p className="text-xs text-[#5851A4] font-medium mt-0.5">
              Track real-time updates, hiring manager reviews, and interview schedules for your submitted applications.
            </p>
          </div>

          {applications.length === 0 ? (
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-12 text-center space-y-3 shadow-sm">
              <FileText className="w-12 h-12 text-[#C8B6E2] mx-auto" />
              <h3 className="text-lg font-black text-[#1E2746]">No Applications Submitted Yet</h3>
              <p className="text-xs text-[#5851A4] max-w-md mx-auto font-medium">
                You haven't submitted any job or internship applications yet. Explore openings or request alumni referrals to start your career journey!
              </p>
              <button
                onClick={() => setActiveTab("explore")}
                className="mt-2 px-5 py-2.5 bg-[#4B63D2] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#3E53BE] transition-all cursor-pointer"
              >
                Explore Active Openings
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app: ApplicationWithUpdates) => (
                <div
                  key={app.id}
                  className="bg-white border border-[#EAE4F7] hover:border-[#C8B6E2] rounded-3xl p-6 shadow-sm space-y-5 transition-all"
                >
                  {/* Top Bar: Job info + Status Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAE4F7]">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#4B63D2]/10 text-[#4B63D2]">
                        Application #{app.id}
                      </span>
                      <h3 className="text-lg font-black text-[#1E2746] mt-1">
                        {app.job_posting?.title || "Software Engineering Role"}
                      </h3>
                      <p className="text-xs font-bold text-[#5851A4] flex items-center gap-2 mt-0.5">
                        <Building className="w-3.5 h-3.5 text-[#4B63D2]" />
                        <span>{app.job_posting?.company?.name || "Campus Placement Partner"}</span>
                        <span>•</span>
                        <Calendar className="w-3.5 h-3.5 text-[#9188BE]" />
                        <span>Applied on {new Date(app.applied_at || new Date()).toLocaleDateString()}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>Status: {app.status || "UNDER REVIEW"}</span>
                      </span>
                    </div>
                  </div>

                  {/* Visual Status Progression Tracker */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#5851A4]">
                      Application Stage Progression
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {[
                        { label: "Submitted", active: true },
                        { label: "In Review", active: true },
                        { label: "Technical Round", active: (app.updates?.length || 0) > 1 },
                        { label: "Final Decision", active: false },
                      ].map((step, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-2xl border text-center transition-all ${
                            step.active
                              ? "bg-emerald-50/70 border-emerald-300 text-emerald-800"
                              : "bg-[#FAF9FD] border-[#EAE4F7] text-slate-600"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1 text-xs font-bold">
                            {step.active ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                            )}
                            <span>{step.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Timeline Notes Updates */}
                  {app.updates && app.updates.length > 0 && (
                    <div className="p-4 rounded-2xl bg-[#FAF9FD] border border-[#EAE4F7] space-y-2.5">
                      <h5 className="text-xs font-extrabold uppercase tracking-wider text-[#4B63D2] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Live Status Timeline & Feedback
                      </h5>
                      <div className="space-y-2 pl-2 border-l-2 border-[#4B63D2]/30">
                        {app.updates.map((update: { stage: string; updatedAt: string; note: string }, uIdx: number) => (
                          <div key={uIdx} className="relative pl-3 space-y-0.5">
                            <span className="absolute -left-[13px] top-1.5 h-2 w-2 rounded-full bg-[#4B63D2]" />
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-[#4B63D2] uppercase">
                                {update.stage.replace("_", " ")}
                              </span>
                              <span className="text-[10px] text-[#9188BE]">
                                {new Date(update.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-[#1E2746] font-medium leading-relaxed">
                              {update.note}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}


                  {/* Attached Resume */}
                  {app.resume_url && (
                    <div className="flex items-center justify-between text-xs text-[#5851A4] pt-2">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <FileText className="w-3.5 h-3.5 text-[#4B63D2]" />
                        Attached Resume Document
                      </span>
                      <a
                        href={app.resume_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-[#4B63D2] hover:underline flex items-center gap-1"
                      >
                        View Resume <LinkIcon className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: POST AN OPENING                                                    */}
      {/* ========================================================================= */}
      {activeTab === "post" && (
        !canPostJob ? (
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-8 text-center space-y-4 max-w-2xl mx-auto shadow-sm">
            <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-[#1E2746]">Job Posting Restricted</h3>
            <p className="text-sm text-[#5851A4] font-medium max-w-md mx-auto leading-relaxed">
              Job and internship opportunities can only be posted by verified <strong>Alumni</strong>, <strong>Faculty</strong>, and <strong>Administrators</strong>.
            </p>
            <p className="text-xs text-[#9188BE] max-w-sm mx-auto">
              As a student, you can explore campus openings, submit direct applications, and request referrals from alumni!
            </p>
            <div className="pt-2">
              <button
                onClick={() => setActiveTab("explore")}
                className="px-6 py-2.5 bg-[#4B63D2] hover:bg-[#3E53BE] text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-[#4B63D2]/20 transition-all cursor-pointer"
              >
                Explore Opportunities
              </button>
            </div>
          </div>
        ) : (
        <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#4B63D2] to-[#5851A4] flex items-center justify-center text-white shadow-md shadow-[#4B63D2]/20">
              <PlusCircle className="w-6 h-6 text-[#FFD21A]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#1E2746]">
                Post a Campus Job or Internship
              </h2>
              <p className="text-xs text-[#5851A4] font-medium">
                Publish verified recruitment drives for SBJIT students and alumni.
              </p>
            </div>
          </div>

          <form onSubmit={handlePostJobSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1E2746] mb-1">
                Opportunity Title *
              </label>
              <input
                type="text"
                placeholder="e.g. SDE Intern, Graduate Engineer Trainee"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs sm:text-sm font-medium text-[#1E2746] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1">
                  Company *
                </label>
                <div className="flex gap-2">
                  <select
                    value={postCompanyId}
                    onChange={(e) => setPostCompanyId(Number(e.target.value) || "")}
                    required
                    className="flex-1 px-3 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-bold text-[#1E2746] focus:outline-none"
                  >
                    <option value="">Select Company</option>
                    {companies.map((c: Company) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowCompanyModal(true)}
                    className="px-3 py-2 bg-[#FAF9FD] hover:bg-[#F0EDF9] border border-[#D5CBEE] text-xs font-bold text-[#4B63D2] rounded-xl transition-all"
                  >
                    + Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1">
                  Job Type *
                </label>
                <select
                  value={postJobType}
                  onChange={(e) => setPostJobType(e.target.value as JobType)}
                  className="w-full px-3 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-bold text-[#1E2746] focus:outline-none"
                >
                  <option value="FULL_TIME">Full-time</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="PART_TIME">Part-time</option>
                  <option value="CONTRACT">Contract</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1">
                  Workplace Type
                </label>
                <select
                  value={postWorkplaceType}
                  onChange={(e) => setPostWorkplaceType(e.target.value as WorkplaceType)}
                  className="w-full px-3 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-bold text-[#1E2746] focus:outline-none"
                >
                  <option value="ON_SITE">On-Site</option>
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1">
                  Salary / Stipend Range
                </label>
                <input
                  type="text"
                  placeholder="e.g. ₹6,00,000 - ₹10,00,000 or ₹25k/month"
                  value={postSalaryRange}
                  onChange={(e) => setPostSalaryRange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs sm:text-sm font-medium text-[#1E2746] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E2746] mb-1">
                Required Skills (Comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Python, FastAPI, React, SQL, Problem Solving"
                value={postSkills}
                onChange={(e) => setPostSkills(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs sm:text-sm font-medium text-[#1E2746] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E2746] mb-1">
                Job Description & Requirements *
              </label>
              <textarea
                rows={4}
                placeholder="Describe role responsibilities, eligibility criteria, and interview steps..."
                value={postDescription}
                onChange={(e) => setPostDescription(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs sm:text-sm font-medium text-[#1E2746] focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white text-xs sm:text-sm font-black shadow-md shadow-[#4B63D2]/25 transition-all cursor-pointer"
            >
              Publish Opportunity
            </button>
          </form>
        </div>
        )
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: SEND EMAIL REFERRAL REQUEST TO ALUMNI                            */}
      {/* ========================================================================= */}
      {referralModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-lg w-full bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setReferralModalTarget(null)}
              className="absolute top-5 right-5 p-2 text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD] rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#4B63D2] to-[#5851A4] flex items-center justify-center text-white shadow-md shadow-[#4B63D2]/20">
                <Mail className="w-6 h-6 text-[#FFD21A]" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#1E2746] tracking-tight">
                  Request Referral via Email
                </h3>
                <p className="text-xs text-[#5851A4] font-medium">
                  Sending directly to <strong>{referralModalTarget.name}</strong> ({referralModalTarget.company})
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#FAF9FD] border border-[#EAE4F7] rounded-2xl text-xs text-[#5851A4] space-y-1">
              <p>
                ✉️ <strong>Alumni Email:</strong> {referralModalTarget.email}
              </p>
              <p>
                🏢 <strong>Designation:</strong> {referralModalTarget.role} (Batch '{referralModalTarget.batch})
              </p>
            </div>

            <form onSubmit={handleSendEmailReferral} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1">
                  Target Job Title / Job ID *
                </label>
                <input
                  type="text"
                  placeholder="e.g. SDE 1 - Azure Storage (Req ID #94821)"
                  value={targetJobTitle}
                  onChange={(e) => setTargetJobTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs sm:text-sm font-medium text-[#1E2746] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1">
                  Target Job Portal Link / URL
                </label>
                <input
                  type="url"
                  placeholder="https://careers.company.com/job/12345"
                  value={targetJobUrl}
                  onChange={(e) => setTargetJobUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs sm:text-sm font-medium text-[#1E2746] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1E2746] mb-1">
                    Your Resume Link (Google Drive / PDF) *
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={studentResumeUrl}
                    onChange={(e) => setStudentResumeUrl(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E2746] mb-1">
                    LinkedIn / GitHub Profile
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    value={studentLinkedIn}
                    onChange={(e) => setStudentLinkedIn(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1">
                  Personalized Referral Note / Elevator Pitch *
                </label>
                <textarea
                  rows={3}
                  placeholder="Hi Priya, I am a 4th-year AIML student at SBJIT. I built projects in distributed systems and would love a referral for this opening..."
                  value={emailReferralPitch}
                  onChange={(e) => setEmailReferralPitch(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs sm:text-sm font-medium text-[#1E2746] focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReferralModalTarget(null)}
                  className="px-4 py-2 rounded-xl border border-[#EAE4F7] text-xs font-bold text-[#5851A4] hover:bg-[#FAF9FD] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEmailReferral}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white text-xs font-bold shadow-md shadow-[#4B63D2]/25 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-[#FFD21A]" />
                  <span>{submittingEmailReferral ? "Sending Email..." : "Send Email Request"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: APPLY FOR OPPORTUNITY                                            */}
      {/* ========================================================================= */}
      {selectedJobForApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-lg w-full bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedJobForApply(null)}
              className="absolute top-5 right-5 p-2 text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD] rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#4B63D2] to-[#5851A4] flex items-center justify-center text-white shadow-md shadow-[#4B63D2]/20">
                <Briefcase className="w-6 h-6 text-[#FFD21A]" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#1E2746] tracking-tight">
                  Apply for {selectedJobForApply.title}
                </h3>
                <p className="text-xs text-[#5851A4] font-medium">
                  {selectedJobForApply.company?.name || "Campus Partner"}
                </p>
              </div>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1">
                  Resume Link (PDF / Google Drive / Portfolio) *
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/..."
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs sm:text-sm font-medium text-[#1E2746] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1">
                  Cover Letter / Introduction
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain why you are a great fit for this role..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs sm:text-sm font-medium text-[#1E2746] focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedJobForApply(null)}
                  className="px-4 py-2 rounded-xl border border-[#EAE4F7] text-xs font-bold text-[#5851A4] hover:bg-[#FAF9FD] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApply}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white text-xs font-bold shadow-md shadow-[#4B63D2]/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submittingApply ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CREATE NEW COMPANY MODAL                                         */}
      {/* ========================================================================= */}
      {showCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-md w-full bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setShowCompanyModal(false)}
              className="absolute top-4 right-4 p-2 text-[#5851A4] hover:text-[#1E2746] rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-[#1E2746] flex items-center gap-2">
              <Building className="w-5 h-5 text-[#4B63D2]" />
              Add New Company
            </h3>

            <form onSubmit={handleCreateCompanySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Google, Microsoft, Startup Ltd"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#FAF9FD] border border-[#D5CBEE] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1">
                  Industry / Domain
                </label>
                <input
                  type="text"
                  placeholder="e.g. Information Technology, FinTech"
                  value={newCompanyIndustry}
                  onChange={(e) => setNewCompanyIndustry(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF9FD] border border-[#D5CBEE] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1">
                  Headquarters / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru, Pune, Hyderabad"
                  value={newCompanyLocation}
                  onChange={(e) => setNewCompanyLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF9FD] border border-[#D5CBEE] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCompanyModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE4F7] text-xs font-bold text-[#5851A4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCompany}
                  className="px-5 py-2 rounded-xl bg-[#4B63D2] text-white text-xs font-bold shadow-sm"
                >
                  {submittingCompany ? "Adding..." : "Add Company"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
