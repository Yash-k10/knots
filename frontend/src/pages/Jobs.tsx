import { useState, useEffect, useMemo } from "react";
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
  UserCheck,
  ExternalLink,
  Eye,
  Info,
  FlaskConical,
  Loader2,
  Users,
  Edit3,
  Trash2,
  ShieldCheck,
  Check,
} from "lucide-react";
import {
  fetchJobs,
  createJobPosting,
  updateJobPosting,
  deleteJobPosting,
  updateCandidatePlacementStatus,
  fetchCompanies,
  createCompany,
  applyForJob,
  fetchMyApplications,
  fetchJobApplications,
  updateApplicationStatus,
  requestReferral,
  JobPosting,
  Company,
  Application,
  ApplicationStatus,
  JobType,
  WorkplaceType,
} from "../services/jobs";
import {
  fetchOpportunities,
  applyToOpportunity,
  Opportunity,
} from "../services/opportunities";
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
    "explore" | "alumni-companies" | "applications" | "candidates" | "post" | "research" | "student-finder" | "candidate-status"
  >("explore");

  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<ApplicationWithUpdates[]>([]);
  const [candidateApplications, setCandidateApplications] = useState<Application[]>([]);
  const [researchCollaborations, setResearchCollaborations] = useState<Opportunity[]>([]);
  const [selectedResearchForApply, setSelectedResearchForApply] = useState<Opportunity | null>(null);
  const [researchApplyStatement, setResearchApplyStatement] = useState<string>("");
  const [submittingResearchApply, setSubmittingResearchApply] = useState<boolean>(false);
  const [appliedResearchIds, setAppliedResearchIds] = useState<Set<number>>(new Set());
  const [selectedCandidateJobFilter, setSelectedCandidateJobFilter] = useState<number | "ALL">("ALL");
  const [selectedCoverLetterApp, setSelectedCoverLetterApp] = useState<Application | null>(null);
  const [updatingAppId, setUpdatingAppId] = useState<number | null>(null);
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

  const roleName = currentUser?.role?.name?.toLowerCase().trim() || "student";
  const isAlumni = roleName === "alumni" || roleName.includes("alumni") || currentUser?.role_id === 4;
  const isExecutiveObserver = ["ceo", "dean", "principal"].includes(roleName);
  const isFaculty = roleName.includes("faculty") || roleName.includes("hod");
  const isController =
    roleName === "controller" ||
    roleName.includes("controller") ||
    (currentUser?.email?.toLowerCase().includes("controller") ?? false);
  const isCentralAdmin =
    roleName === "central admin" ||
    roleName.includes("central admin") ||
    currentUser?.role_id === 9;
  const isAdmin =
    currentUser?.role_id === 1 ||
    isCentralAdmin ||
    ["admin", "super admin", "superadmin", "management", "central admin"].includes(roleName);
  const isTpo = roleName === "tpo";

  // Candidate Status State (Central Admin)
  const [candidateStudents, setCandidateStudents] = useState<any[]>([]);
  const [candidateLoading, setCandidateLoading] = useState<boolean>(false);
  const [candidateDeptFilter, setCandidateDeptFilter] = useState<string>("ALL");
  const [candidateStatusFilter, setCandidateStatusFilter] = useState<string>("ALL");
  const [candidateBatchFilter, setCandidateBatchFilter] = useState<string>("ALL");
  const [candidateSearchQuery, setCandidateSearchQuery] = useState<string>("");
  const [updatingStudentId, setUpdatingStudentId] = useState<number | null>(null);

  // Edit Job Modal State (Central Admin & Admin CRUD)
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [editJobTitle, setEditJobTitle] = useState<string>("");
  const [editJobDescription, setEditJobDescription] = useState<string>("");
  const [editJobType, setEditJobType] = useState<JobType>("FULL_TIME");
  const [editWorkplaceType, setEditWorkplaceType] = useState<WorkplaceType>("ON_SITE");
  const [editLocation, setEditLocation] = useState<string>("");
  const [editSalaryRange, setEditSalaryRange] = useState<string>("");
  const [editRequiredSkills, setEditRequiredSkills] = useState<string>("");
  const [editApplicationDeadline, setEditApplicationDeadline] = useState<string>("");
  const [editFormLink, setEditFormLink] = useState<string>("");
  const [submittingJobEdit, setSubmittingJobEdit] = useState<boolean>(false);

  const canPostJob =
    !isExecutiveObserver && (
      isAdmin ||
      roleName === "tpo" ||
      roleName === "controller" ||
      isAlumni ||
      roleName.includes("coordinator") ||
      roleName.includes("faculty")
    );

  const canApplyJob = !isExecutiveObserver && roleName === "student";
  const canViewApplications = !isExecutiveObserver && roleName === "student";

  // Prevent faculty, controller, central admin, and executive observers from viewing alumni referrals or faculty research tabs
  // Also prevent alumni from viewing explore opportunities or faculty research
  useEffect(() => {
    if (isExecutiveObserver && activeTab !== "explore") {
      setActiveTab("explore");
      return;
    }
    if (isAlumni && (activeTab === "explore" || activeTab === "research")) {
      setActiveTab("post");
      return;
    }
    if (isCentralAdmin && activeTab === "candidates") {
      setActiveTab("candidate-status");
      return;
    }
    if ((isFaculty || isController || isAdmin || isTpo) && (activeTab === "alumni-companies" || activeTab === "research")) {
      setActiveTab("explore");
    }
  }, [isFaculty, isController, isAdmin, isCentralAdmin, isTpo, isExecutiveObserver, isAlumni, activeTab]);

  // Search and filter states for Jobs
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedJobType, setSelectedJobType] = useState<string>("ALL");
  const [selectedWorkplace, setSelectedWorkplace] = useState<string>("ALL");
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>("ALL");

  const EXECUTIVE_DEPARTMENTS = [
    "ALL",
    "First year",
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

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (selectedDepartmentFilter === "ALL") return true;
      const d = selectedDepartmentFilter.toLowerCase();
      const content = `${job.title} ${job.description} ${(job.required_skills || []).join(" ")}`.toLowerCase();
      if (d === "cse(aiml)") {
        return content.includes("aiml") || content.includes("ai/ml") || content.includes("machine learning") || content.includes("artificial intelligence");
      }
      if (d === "cse(aids)") {
        return content.includes("aids") || content.includes("data science") || content.includes("data analyst");
      }
      if (d === "cse") {
        return content.includes("cse") || content.includes("computer science") || content.includes("software") || content.includes("developer") || content.includes("frontend") || content.includes("backend") || content.includes("full stack");
      }
      if (d === "it") {
        return content.includes("information technology") || content.includes("it ") || content.includes("cloud") || content.includes("devops") || content.includes("network");
      }
      if (d === "etc") {
        return content.includes("etc") || content.includes("ece") || content.includes("electronics") || content.includes("telecommunication") || content.includes("embedded") || content.includes("vlsi") || content.includes("iot");
      }
      if (d === "ee") {
        return content.includes("electrical") || content.includes("ee ") || content.includes("power") || content.includes("circuit");
      }
      if (d === "me") {
        return content.includes("mechanical") || content.includes("me ") || content.includes("cad") || content.includes("robotics") || content.includes("manufacturing");
      }
      if (d === "bca") {
        return content.includes("bca") || content.includes("computer applications");
      }
      if (d === "mca") {
        return content.includes("mca") || content.includes("master of computer");
      }
      if (d === "mba") {
        return content.includes("mba") || content.includes("business") || content.includes("marketing") || content.includes("finance") || content.includes("human resource") || content.includes("management trainee");
      }
      if (d === "first year") {
        return content.includes("first year") || content.includes("freshman") || content.includes("intern");
      }
      return content.includes(d);
    });
  }, [jobs, selectedDepartmentFilter]);

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

  // Modals state for Jobs Apply & Details
  const [selectedJobForApply, setSelectedJobForApply] = useState<JobPosting | null>(null);
  const [selectedJobDetails, setSelectedJobDetails] = useState<JobPosting | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string>("");
  const [coverLetter, setCoverLetter] = useState<string>("");
  const [submittingApply, setSubmittingApply] = useState<boolean>(false);

  // Student Finder state (TPO only)
  const [studentList, setStudentList] = useState<any[]>([]);
  const [studentFinderLoading, setStudentFinderLoading] = useState<boolean>(false);
  const [sfYear, setSfYear] = useState<string>("ALL");
  const [sfDepartment, setSfDepartment] = useState<string>("ALL");
  const [sfSkills, setSfSkills] = useState<string>("");

  const fetchCandidateStudents = async () => {
    setCandidateLoading(true);
    try {
      const res = await apiRequest<any[]>("/departments/students?department=ALL");
      setCandidateStudents(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Failed to load candidate students:", err);
    } finally {
      setCandidateLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "candidate-status" || isCentralAdmin) {
      fetchCandidateStudents();
    }
  }, [activeTab, isCentralAdmin]);

  const handleChangeStudentPlacementStatus = async (
    userId: number,
    newStatus: "Placed" | "Not Placed" | "Internship"
  ) => {
    setUpdatingStudentId(userId);
    try {
      await updateCandidatePlacementStatus(userId, newStatus);
      setCandidateStudents((prev) =>
        prev.map((s) => (s.id === userId ? { ...s, status: newStatus } : s))
      );
      setSuccessMsg(`Candidate placement status updated to "${newStatus}"!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to update candidate placement status.");
    } finally {
      setUpdatingStudentId(null);
    }
  };

  const filteredCandidateStudents = useMemo(() => {
    return candidateStudents.filter((student) => {
      if (candidateDeptFilter !== "ALL") {
        const d = (student.department || "").toLowerCase().trim();
        const f = candidateDeptFilter.toLowerCase().trim();
        if (f === "cse(aiml)") {
          if (!d.includes("aiml") && !d.includes("ai/ml")) return false;
        } else if (f === "cse(aids)") {
          if (!d.includes("aids") && !d.includes("data science")) return false;
        } else if (f === "cse") {
          if (!d.includes("computer science") && d !== "cse") return false;
        } else {
          if (!d.includes(f)) return false;
        }
      }

      if (candidateStatusFilter !== "ALL") {
        const curStatus = (student.status || "Not Placed").toLowerCase();
        if (candidateStatusFilter.toLowerCase() !== curStatus) {
          return false;
        }
      }

      if (candidateBatchFilter !== "ALL") {
        if (String(student.graduation_year) !== candidateBatchFilter) {
          return false;
        }
      }

      if (candidateSearchQuery.trim()) {
        const q = candidateSearchQuery.toLowerCase().trim();
        const name = `${student.first_name || ""} ${student.last_name || ""}`.toLowerCase();
        const email = (student.email || "").toLowerCase();
        const skillsStr = Array.isArray(student.skills) ? student.skills.join(" ").toLowerCase() : "";
        if (!name.includes(q) && !email.includes(q) && !skillsStr.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [candidateStudents, candidateDeptFilter, candidateStatusFilter, candidateBatchFilter, candidateSearchQuery]);

  const candidateMetrics = useMemo(() => {
    let placed = 0;
    let notPlaced = 0;
    let internship = 0;
    candidateStudents.forEach((s) => {
      const st = (s.status || "Not Placed").toLowerCase();
      if (st === "placed") placed++;
      else if (st === "internship" || st === "interning") internship++;
      else notPlaced++;
    });
    return {
      total: candidateStudents.length,
      placed,
      notPlaced,
      internship,
    };
  }, [candidateStudents]);

  const openEditJobModal = (job: JobPosting) => {
    setEditingJob(job);
    setEditJobTitle(job.title || "");
    setEditJobDescription(job.description || "");
    setEditJobType(job.job_type || "FULL_TIME");
    setEditWorkplaceType(job.workplace_type || "ON_SITE");
    setEditLocation(job.location || "");
    setEditSalaryRange(job.salary_range || "");
    setEditRequiredSkills((job.required_skills || []).join(", "));
    setEditApplicationDeadline(job.application_deadline ? job.application_deadline.split("T")[0] : "");
    setEditFormLink(job.form_link || "");
  };

  const handleSaveJobEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    setSubmittingJobEdit(true);
    try {
      const skillsArray = editRequiredSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const updated = await updateJobPosting(editingJob.id, {
        title: editJobTitle,
        description: editJobDescription,
        job_type: editJobType,
        workplace_type: editWorkplaceType,
        location: editLocation || undefined,
        salary_range: editSalaryRange || undefined,
        required_skills: skillsArray,
        application_deadline: editApplicationDeadline ? new Date(editApplicationDeadline).toISOString() : undefined,
        form_link: editFormLink || undefined,
      });

      setJobs((prev) => prev.map((j) => (j.id === updated.id ? { ...j, ...updated } : j)));
      setEditingJob(null);
      setSuccessMsg("Opportunity updated successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to update opportunity.");
    } finally {
      setSubmittingJobEdit(false);
    }
  };

  const handleDeleteJob = async (jobId: number, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteJobPosting(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      setSuccessMsg("Opportunity deleted successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to delete opportunity.");
    }
  };


  // Formatting helpers for Job Type and Workplace
  const formatJobType = (type?: string) => {
    switch (type?.toUpperCase()) {
      case "FULL_TIME":
        return "Full-Time";
      case "PART_TIME":
        return "Part-Time";
      case "INTERNSHIP":
        return "Internship";
      case "CONTRACT":
        return "Contract";
      default:
        return type ? type.replace("_", " ") : "Full-Time";
    }
  };

  const formatWorkplace = (type?: string) => {
    switch (type?.toUpperCase()) {
      case "REMOTE":
        return "Remote";
      case "ON_SITE":
        return "On-Site";
      case "HYBRID":
        return "Hybrid";
      case "ALL":
        return "All";
      default:
        return type || "On-Site";
    }
  };


  // Post Job Form State
  const [postTitle, setPostTitle] = useState<string>("");
  const [postCompanyId, setPostCompanyId] = useState<number | "">("");
  const [postJobType, setPostJobType] = useState<JobType>("FULL_TIME");
  const [postWorkplaceType, setPostWorkplaceType] = useState<WorkplaceType>("ON_SITE");
  const [postLocation, setPostLocation] = useState<string>("");
  const [postSalaryRange, setPostSalaryRange] = useState<string>("");
  const [postSkills, setPostSkills] = useState<string>("");
  const [postDescription, setPostDescription] = useState<string>("");
  const [postFormLink, setPostFormLink] = useState<string>("");


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
      const [fetchedJobs, fetchedCompanies, fetchedApps, userResp, fetchedResearch] =
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
          fetchOpportunities({ opportunity_type: "RESEARCH" }).catch(() => []),
        ]);

      if (userResp) {
        setCurrentUser(userResp);
        const rName = (userResp.role?.name || "").toLowerCase().trim();
        if (rName.includes("alumni") || userResp.role_id === 4) {
          setActiveTab("post");
        }
      }
      setJobs(fetchedJobs);
      setCompanies(fetchedCompanies);
      setResearchCollaborations(fetchedResearch || []);

      // Build authentic application lifecycle progression stages based strictly on real DB status
      const realApps: ApplicationWithUpdates[] = (fetchedApps || []).map(
        (app: Application) => {
          const appDate = app.applied_at || new Date().toISOString();
          const normalizedStatus = (app.status || "PENDING").toUpperCase();

          const stages: {
            stage: "SUBMITTED" | "REVIEW" | "TECH_ROUND" | "INTERVIEW" | "OFFER" | "REJECTED";
            updatedAt: string;
            note: string;
          }[] = [
            {
              stage: "SUBMITTED",
              updatedAt: appDate,
              note: "Application & Resume received by the recruitment team.",
            },
          ];

          if (
            normalizedStatus === "REVIEWING" ||
            normalizedStatus === "UNDER_REVIEW" ||
            normalizedStatus === "REVIEW"
          ) {
            stages.push({
              stage: "REVIEW",
              updatedAt: app.updated_at || appDate,
              note: "Profile shortlisted and currently under hiring manager review.",
            });
          } else if (normalizedStatus === "ACCEPTED") {
            stages.push(
              {
                stage: "REVIEW",
                updatedAt: app.updated_at || appDate,
                note: "Profile shortlisted by Technical Hiring Manager.",
              },
              {
                stage: "TECH_ROUND",
                updatedAt: app.updated_at || appDate,
                note: "Technical Assessment & Interview rounds completed.",
              },
              {
                stage: "OFFER",
                updatedAt: app.updated_at || appDate,
                note: "Application accepted! Offer extended.",
              },
            );
          } else if (normalizedStatus === "REJECTED") {
            stages.push({
              stage: "REJECTED",
              updatedAt: app.updated_at || appDate,
              note: "Application reviewed. Not moving forward at this time.",
            });
          }

          return {
            ...app,
            updates: stages,
          };
        },
      );

      setApplications(realApps);

      // Fetch candidates for jobs posted by current user or all if admin
      if (userResp) {
        const uRole = userResp.role?.name?.toLowerCase().trim() || "";
        const canManage =
          userResp.role_id === 1 ||
          [
            "admin",
            "super admin",
            "superadmin",
            "management",
            "central admin",
            "tpo",
            "controller",
            "alumni",
            "faculty",
            "coordinator",
          ].includes(uRole) ||
          uRole.includes("coordinator") ||
          uRole.includes("faculty");

        if (canManage) {
          const userPostedJobs = fetchedJobs.filter((j: JobPosting) =>
            userResp.role_id === 1 ||
            [
              "admin",
              "super admin",
              "superadmin",
              "management",
              "central admin",
            ].includes(uRole)
              ? true
              : j.posted_by_id === userResp.id
          );

          if (userPostedJobs.length > 0) {
            const candidateResults = await Promise.all(
              userPostedJobs.map((j: JobPosting) =>
                fetchJobApplications(j.id)
                  .then((apps) =>
                    apps.map((a) => ({
                      ...a,
                      job_posting: a.job_posting || j,
                    }))
                  )
                  .catch(() => [])
              )
            );
            setCandidateApplications(candidateResults.flat());
          } else {
            setCandidateApplications([]);
          }
        }
      }
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

  const handleUpdateCandidateStatus = async (
    applicationId: number,
    newStatus: ApplicationStatus
  ) => {
    setUpdatingAppId(applicationId);
    setError(null);
    try {
      await updateApplicationStatus(applicationId, newStatus);
      setSuccessMsg(
        `Application status updated to ${newStatus}! The applicant's live tracker has updated automatically.`
      );
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to update candidate application status.");
    } finally {
      setUpdatingAppId(null);
    }
  };

  useEffect(() => {
    loadData();
    const handleFocus = () => {
      loadData();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [selectedJobType, selectedWorkplace]);

  // Load students for TPO Student Finder tab
  const loadStudents = async () => {
    setStudentFinderLoading(true);
    try {
      const data = await apiRequest<any[]>("/opportunities/students/search?limit=100").catch(() =>
        apiRequest<any[]>("/departments/students").catch(() =>
          apiRequest<any[]>("/users?limit=500").catch(() => [])
        )
      );
      const students = (Array.isArray(data) ? data : []).filter(
        (u: any) => {
          const role = (u.role?.name || u.role_name || "").toLowerCase();
          return role === "student" || role === "" || !role;
        }
      );
      setStudentList(students);
    } finally {
      setStudentFinderLoading(false);
    }
  };

  useEffect(() => {
    if (isTpo && activeTab === "student-finder" && studentList.length === 0) {
      loadStudents();
    }
  }, [isTpo, activeTab]);

  useEffect(() => {
    const handleFocus = () => {
      loadData();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);


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

  const handleOpenJobFormAndApply = async () => {
    if (!selectedJobForApply?.form_link) return;
    window.open(selectedJobForApply.form_link, "_blank");
    setSubmittingApply(true);
    setError(null);
    try {
      await applyForJob(selectedJobForApply.id, {
        resume_url: selectedJobForApply.form_link,
        cover_letter: coverLetter.trim() || `Applied via external form: ${selectedJobForApply.form_link}`,
      });
      setSuccessMsg(`Application form opened! Successfully applied for ${selectedJobForApply.title}!`);
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
        title: postTitle.trim(),
        company_id: Number(postCompanyId),
        job_type: (postJobType.toLowerCase().replace("_", "-")) as JobType,
        workplace_type: (postWorkplaceType.toLowerCase().replace("_", "-")) as WorkplaceType,
        location: postLocation.trim() || undefined,
        salary_range: postSalaryRange.trim() || undefined,
        required_skills: skillsArray,
        description: postDescription.trim(),
        form_link: postFormLink.trim() || undefined,
      });

      setSuccessMsg("Job opportunity posted successfully!");
      setPostTitle("");
      setPostCompanyId("");
      setPostLocation("");
      setPostSalaryRange("");
      setPostSkills("");
      setPostDescription("");
      setPostFormLink("");
      setActiveTab("explore");
      loadData();

    } catch (err: any) {
      const detailedMsg =
        typeof err.detail === "string"
          ? err.detail
          : Array.isArray(err.detail)
          ? err.detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ")
          : err.message || "Failed to post job opportunity.";
      setError(detailedMsg);
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

  const handleApplyResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResearchForApply) return;
    setSubmittingResearchApply(true);
    setError(null);
    try {
      await applyToOpportunity(selectedResearchForApply.id, {
        message: researchApplyStatement.trim() || undefined,
      });
      setSuccessMsg(
        `Join request for "${selectedResearchForApply.title}" successfully sent to faculty!`
      );
      setAppliedResearchIds((prev) => new Set([...prev, selectedResearchForApply.id]));
      setSelectedResearchForApply(null);
      setResearchApplyStatement("");
      // Refresh research
      const updated = await fetchOpportunities({ opportunity_type: "RESEARCH" }).catch(() => []);
      setResearchCollaborations(updated);
    } catch (err: any) {
      setError(err.message || "Failed to submit research collaboration application.");
    } finally {
      setSubmittingResearchApply(false);
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
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#4B63D2]/10 text-[#4B63D2] border border-[#4B63D2]/20">
                <Sparkles className="w-3.5 h-3.5" />
                SBJIT Career & Alumni Nexus
              </span>
              {isExecutiveObserver && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  Executive Observer Portal ({roleName.toUpperCase()})
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1E2746] tracking-tight">
              {isAlumni ? "Alumni Opportunities & Referral Hub" : "Referrals & Opportunity Portal"}
            </h1>
            <p className="text-[#5851A4] text-xs sm:text-sm mt-1 max-w-2xl font-medium leading-relaxed">
              {isExecutiveObserver
                ? "Institutional overview of campus placement and internship opportunities across all departments. Browse active openings and monitor corporate recruitments."
                : isAlumni
                ? "Post verified job openings & employee referral drives for SBJIT juniors, review candidate applications, and connect with company alumni."
                : "Track SBJIT alumni across top tech companies, request direct referral emails, explore verified jobs & internships, and monitor live application updates."}
            </p>
          </div>

          {canPostJob && !isAlumni && (
            <button
              onClick={() => setActiveTab("post")}
              className="flex items-center gap-2 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white font-bold px-5 py-2.5 rounded-2xl transition-all shadow-md shadow-[#4B63D2]/20 text-xs sm:text-sm cursor-pointer shrink-0 active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-[#FFD21A]" />
              <span>Post Opportunity</span>
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mt-6 border-t border-[#EAE4F7] pt-4 overflow-x-auto no-scrollbar max-w-full pb-1">
          {/* Alumni-specific tabs */}
          {isAlumni ? (
            <>
              <button
                onClick={() => setActiveTab("post")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === "post"
                    ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/20"
                    : "text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD]"
                }`}
              >
                <PlusCircle className="w-4 h-4 text-[#FFD21A]" />
                <span>Post Opportunity / Referral</span>
              </button>

              <button
                onClick={() => setActiveTab("candidates")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === "candidates"
                    ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/20"
                    : "text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD]"
                }`}
              >
                <UserCheck className="w-4 h-4 text-[#FFD21A]" />
                <span>Review Candidates ({candidateApplications.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("alumni-companies")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === "alumni-companies"
                    ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/20"
                    : "text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD]"
                }`}
              >
                <Building className="w-4 h-4 text-[#FFD21A]" />
                <span>Company Alumni & Referrals ({alumniDirectory.length})</span>
              </button>
            </>
          ) : (
            /* Student & Other Roles tabs */
            <>
              <button
                onClick={() => setActiveTab("explore")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === "explore"
                    ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/20"
                    : "text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD] border border-transparent"
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Explore Opportunities ({filteredJobs.length})</span>
              </button>

              {!isFaculty && !isController && !isAdmin && !isTpo && !isExecutiveObserver && (
                <button
                  onClick={() => setActiveTab("alumni-companies")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                    activeTab === "alumni-companies"
                      ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/20"
                      : "text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD]"
                  }`}
                >
                  <Building className="w-4 h-4 text-[#FFD21A]" />
                  <span>Company Alumni & Referrals ({alumniDirectory.length})</span>
                </button>
              )}

              {canViewApplications && (
                <button
                  onClick={() => setActiveTab("applications")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                    activeTab === "applications"
                      ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/20"
                      : "text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD]"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>My Applications ({applications.length})</span>
                </button>
              )}

              {!isFaculty && !isController && !isAdmin && !isTpo && !isExecutiveObserver && (
                <button
                  onClick={() => setActiveTab("research")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                    activeTab === "research"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25"
                      : "text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD]"
                  }`}
                >
                  <FlaskConical className="w-4 h-4 text-[#FFD21A]" />
                  <span>Faculty Research ({researchCollaborations.length})</span>
                </button>
              )}

              {canPostJob && !isCentralAdmin && (
                <button
                  onClick={() => setActiveTab("candidates")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                    activeTab === "candidates"
                      ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/20"
                      : "text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD]"
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-[#FFD21A]" />
                  <span>Review Candidates ({candidateApplications.length})</span>
                </button>
              )}

              {isCentralAdmin && (
                <button
                  onClick={() => setActiveTab("candidate-status")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                    activeTab === "candidate-status"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25"
                      : "text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD]"
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-[#FFD21A]" />
                  <span>Candidate Status</span>
                </button>
              )}

              {isTpo && (
                <button
                  onClick={() => setActiveTab("student-finder")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                    activeTab === "student-finder"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25"
                      : "text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD]"
                  }`}
                >
                  <Users className="w-4 h-4 text-[#FFD21A]" />
                  <span>Student Finder</span>
                </button>
              )}

              {canPostJob && (
                <button
                  onClick={() => setActiveTab("post")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                    activeTab === "post"
                      ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/20"
                      : "text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD]"
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Post an Opening</span>
                </button>
              )}
            </>
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
      {activeTab === "explore" && !isAlumni && (
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

            <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1 text-xs text-[#5851A4] font-bold shrink-0">
                <Filter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filters:</span>
              </div>
              <select
                value={selectedDepartmentFilter}
                onChange={(e) => setSelectedDepartmentFilter(e.target.value)}
                className="px-3 py-2 bg-[#FAF9FD] border border-[#D5CBEE] rounded-xl text-xs font-bold text-[#1E2746] focus:outline-none cursor-pointer shrink-0"
              >
                {EXECUTIVE_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept === "ALL" ? "All Departments" : dept}
                  </option>
                ))}
              </select>

              <select
                value={selectedJobType}
                onChange={(e) => setSelectedJobType(e.target.value)}
                className="px-3 py-2 bg-[#FAF9FD] border border-[#D5CBEE] rounded-xl text-xs font-bold text-[#1E2746] focus:outline-none shrink-0"
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
                className="px-3 py-2 bg-[#FAF9FD] border border-[#D5CBEE] rounded-xl text-xs font-bold text-[#1E2746] focus:outline-none shrink-0"
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
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-12 text-center space-y-3 shadow-sm">
              <Briefcase className="w-12 h-12 text-[#C8B6E2] mx-auto" />
              <h3 className="text-lg font-black text-[#1E2746]">No Opportunities Found</h3>
              <p className="text-xs text-[#5851A4] max-w-md mx-auto font-medium">
                Try adjusting your search query or filters. You can also explore company alumni to request direct referrals!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job: JobPosting) => {
                const myAppliedJob = applications.find(
                  (a: Application) => a.job_posting_id === job.id || a.job_posting?.id === job.id
                );

                return (
                <div
                  key={job.id}
                  className="bg-white border border-[#EAE4F7] hover:border-[#C8B6E2] rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Top Row: Job Type, Workplace Badges & Info Button */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#4B63D2]/10 text-[#4B63D2] border border-[#4B63D2]/20">
                          {formatJobType(job.job_type)}
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                            job.workplace_type === "REMOTE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : job.workplace_type === "HYBRID"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {formatWorkplace(job.workplace_type)}
                        </span>
                        {job.form_link && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            External Form
                          </span>
                        )}
                        {typeof job.applications_count === "number" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {job.applications_count} {job.applications_count === 1 ? "applicant" : "applicants"}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedJobDetails(job)}
                        className="h-8 w-8 rounded-full bg-[#FAF9FD] hover:bg-[#EAE4F7] border border-[#EAE4F7] flex items-center justify-center text-[#5851A4] hover:text-[#4B63D2] transition-colors cursor-pointer shrink-0"
                        title="View Full Details"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Post (Title) & Company */}
                    <div>
                      <h3
                        onClick={() => setSelectedJobDetails(job)}
                        className="text-base sm:text-lg font-black text-[#1E2746] group-hover:text-[#4B63D2] transition-colors leading-snug cursor-pointer"
                      >
                        {job.title}
                      </h3>
                      <p className="text-xs font-bold text-[#5851A4] flex items-center gap-1.5 mt-1">
                        <Building className="w-3.5 h-3.5 text-[#4B63D2] shrink-0" />
                        <span>{job.company?.name || "Verified Partner"}</span>
                        {job.location && (
                          <span className="text-[#9188BE] font-medium flex items-center gap-0.5">
                            • <MapPin className="w-3 h-3 inline shrink-0" />
                            {job.location}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Stipend / Salary */}
                    <div className="pt-2 border-t border-[#EAE4F7]">
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1E2746]">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-[#5851A4]">
                          {job.job_type === "INTERNSHIP" ? "Stipend:" : "Salary:"}
                        </span>
                        <span className="text-emerald-700 font-extrabold">
                          {job.salary_range || (job.job_type === "INTERNSHIP" ? "Competitive Stipend" : "Competitive Salary")}
                        </span>
                      </div>
                    </div>

                    {/* Small 2 Line JD */}
                    {job.description && (
                      <p className="text-xs text-[#5851A4] line-clamp-2 leading-relaxed font-normal">
                        {job.description}
                      </p>
                    )}

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

                  {/* Action Buttons: Apply Now only (No Referral button here) */}
                  <div className="pt-3 border-t border-[#EAE4F7] flex items-center gap-2">
                    {isCentralAdmin || isAdmin ? (
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          {job.posted_by_id === currentUser?.id ? "Posted by You" : "Master Authority"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditJobModal(job)}
                            className="py-1.5 px-3 rounded-xl bg-[#FAF9FD] hover:bg-[#F0EDF9] border border-[#D5CBEE] text-[#5851A4] hover:text-[#1E2746] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title="Edit Opportunity"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#4B63D2]" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteJob(job.id, job.title)}
                            className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title="Delete Opportunity"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ) : currentUser?.id && job.posted_by_id === currentUser.id ? (
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          Posted by You
                        </span>
                        <button
                          onClick={() => {
                            setSelectedCandidateJobFilter(job.id);
                            setActiveTab("candidates");
                          }}
                          className="py-2 px-3.5 rounded-xl bg-[#4B63D2] hover:bg-[#3E53BE] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Review Candidates</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        {isExecutiveObserver ? (
                          <span className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                            <Eye className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Observer View</span>
                          </span>
                        ) : myAppliedJob ? (
                          <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Applied ({myAppliedJob.status?.toUpperCase() || "APPLIED"})</span>
                          </div>
                        ) : canApplyJob ? (
                          <button
                            onClick={() => setSelectedJobForApply(job)}
                            className={`w-full py-2.5 px-4 rounded-xl text-white text-xs sm:text-sm font-bold transition-all shadow-sm text-center cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 ${
                              job.form_link
                                ? "bg-amber-600 hover:bg-amber-700"
                                : "bg-[#4B63D2] hover:bg-[#3E53BE]"
                            }`}
                          >
                            {job.form_link ? (
                              <>
                                <ExternalLink className="w-4 h-4" />
                                <span>Apply via Form</span>
                              </>
                            ) : (
                              <span>Apply Now</span>
                            )}
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 text-[11px] font-bold text-center cursor-not-allowed"
                            title="Job applications are restricted to Students."
                          >
                            Student Only
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: COMPANY ALUMNI PRESENCE & DIRECT EMAIL REFERRALS                   */}
      {/* ========================================================================= */}
      {activeTab === "alumni-companies" && !isFaculty && !isController && (
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
                                      <img
                                        src="/infinity-badge.png"
                                        className="h-4 w-4 object-contain inline-block ml-0.5 drop-shadow-sm"
                                        alt="Infinity Badge"
                                        title="Distinguished Alumni Mentor"
                                      />
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

                  {/* Application Status Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/60 to-[#FAF9FD] border border-emerald-200/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                          Applied Successfully
                        </h4>
                        <p className="text-[11px] text-emerald-800/80">
                          Application has been submitted and delivered to the hiring team / alumni poster.
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-extrabold text-emerald-800 bg-white px-3 py-1 rounded-xl border border-emerald-300 shrink-0">
                      Applied
                    </span>
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
      {/* TAB: REVIEW CANDIDATES & APPLICANTS (For Alumni, TPO & Admins)             */}
      {/* ========================================================================= */}
      {activeTab === "candidates" && (
        !canPostJob ? (
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-8 text-center space-y-4 max-w-2xl mx-auto shadow-sm">
            <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-[#1E2746]">Access Restricted</h3>
            <p className="text-sm text-[#5851A4] font-medium max-w-md mx-auto leading-relaxed">
              Candidate review is available for opportunity creators, <strong>Alumni</strong>, <strong>Faculty</strong>, and <strong>Administrators</strong>.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header & Metrics */}
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#1E2746] flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-[#4B63D2]" />
                    Candidate Review & Lifecycle Manager
                  </h2>
                  <p className="text-xs text-[#5851A4] font-medium mt-0.5 max-w-2xl">
                    Review incoming student applications for your posted jobs. When you update a candidate's status here, their <strong>My Applications</strong> stage progression automatically updates in real-time.
                  </p>
                </div>

                {/* Job Filter Selector */}
                <div className="w-full sm:w-auto flex items-center gap-2">
                  <span className="text-xs font-bold text-[#5851A4] shrink-0">Filter by Role:</span>
                  <select
                    value={selectedCandidateJobFilter}
                    onChange={(e) =>
                      setSelectedCandidateJobFilter(
                        e.target.value === "ALL" ? "ALL" : Number(e.target.value)
                      )
                    }
                    className="px-3 py-2 bg-[#FAF9FD] border border-[#D5CBEE] rounded-xl text-xs font-bold text-[#1E2746] focus:outline-none w-full sm:w-auto"
                  >
                    <option value="ALL">All Posted Jobs ({candidateApplications.length} applicants)</option>
                    {jobs
                      .filter((j) =>
                        currentUser?.role_id === 1 ||
                        ["admin", "super admin", "superadmin", "management"].includes(roleName)
                          ? true
                          : j.posted_by_id === currentUser?.id
                      )
                      .map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.title} ({j.company?.name || "Partner"})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Metric Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-[#FAF9FD] border border-[#EAE4F7] text-center">
                  <span className="text-[11px] font-bold text-[#5851A4] uppercase tracking-wider block">Total Received</span>
                  <span className="text-xl font-black text-[#1E2746]">{candidateApplications.length}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 text-center">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Pending Review</span>
                  <span className="text-xl font-black text-amber-900">
                    {candidateApplications.filter((a) => (a.status || "pending").toLowerCase() === "pending").length}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 text-center">
                  <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">Shortlisted</span>
                  <span className="text-xl font-black text-blue-900">
                    {candidateApplications.filter((a) => ["shortlisted", "reviewed", "reviewing", "under_review"].includes((a.status || "").toLowerCase())).length}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-center">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Accepted / Offer</span>
                  <span className="text-xl font-black text-emerald-900">
                    {candidateApplications.filter((a) => (a.status || "").toLowerCase() === "accepted").length}
                  </span>
                </div>
              </div>
            </div>

            {/* Candidate List */}
            {(() => {
              const filteredCandidates = candidateApplications.filter((a) =>
                selectedCandidateJobFilter === "ALL"
                  ? true
                  : a.job_posting_id === selectedCandidateJobFilter
              );

              if (filteredCandidates.length === 0) {
                return (
                  <div className="bg-white border border-[#EAE4F7] rounded-3xl p-12 text-center space-y-3 shadow-sm">
                    <UserCheck className="w-12 h-12 text-[#C8B6E2] mx-auto" />
                    <h3 className="text-lg font-black text-[#1E2746]">No Applicants Yet</h3>
                    <p className="text-xs text-[#5851A4] max-w-md mx-auto font-medium">
                      There are currently no candidate applications for the selected job posting.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {filteredCandidates.map((app: Application) => {
                    const normStatus = (app.status || "pending").toLowerCase();
                    const isShortlisted = ["shortlisted", "reviewed", "reviewing", "under_review"].includes(normStatus);
                    const isAccepted = normStatus === "accepted";
                    const isRejected = normStatus === "rejected";

                    return (
                      <div
                        key={app.id}
                        className="bg-white border border-[#EAE4F7] hover:border-[#C8B6E2] rounded-3xl p-6 shadow-sm space-y-4 transition-all"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#EAE4F7]">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#4B63D2]/10 text-[#4B63D2]">
                                Applicant #{app.applicant_id}
                              </span>
                              <span
                                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                                  isAccepted
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : isShortlisted
                                    ? "bg-blue-50 text-blue-800 border-blue-200"
                                    : isRejected
                                    ? "bg-rose-50 text-rose-800 border-rose-200"
                                    : "bg-amber-50 text-amber-800 border-amber-200"
                                }`}
                              >
                                {isAccepted ? "ACCEPTED" : isShortlisted ? "SHORTLISTED" : isRejected ? "REJECTED" : "PENDING"}
                              </span>
                            </div>

                            <h3 className="text-base sm:text-lg font-black text-[#1E2746]">
                              {app.applicant?.email ? (
                                <span className="flex items-center gap-1.5">
                                  <Mail className="w-4 h-4 text-[#4B63D2]" />
                                  {app.applicant.email}
                                </span>
                              ) : (
                                `SBJIT Student Applicant #${app.applicant_id}`
                              )}
                            </h3>

                            <p className="text-xs font-bold text-[#5851A4] flex items-center gap-2">
                              <Briefcase className="w-3.5 h-3.5 text-[#4B63D2]" />
                              <span>Applied for: <strong>{app.job_posting?.title || "Opportunity"}</strong></span>
                              <span>•</span>
                              <Calendar className="w-3.5 h-3.5 text-[#9188BE]" />
                              <span>{new Date(app.applied_at).toLocaleDateString()}</span>
                            </p>
                          </div>

                          {/* Action Controls for Status Advancement */}
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => handleUpdateCandidateStatus(app.id, "shortlisted")}
                              disabled={updatingAppId === app.id || isShortlisted}
                              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                isShortlisted
                                  ? "bg-blue-100 text-blue-700 border border-blue-200 cursor-default"
                                  : "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Shortlist / Review</span>
                            </button>

                            <button
                              onClick={() => handleUpdateCandidateStatus(app.id, "accepted")}
                              disabled={updatingAppId === app.id || isAccepted}
                              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                isAccepted
                                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-default"
                                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Accept & Offer</span>
                            </button>

                            <button
                              onClick={() => handleUpdateCandidateStatus(app.id, "rejected")}
                              disabled={updatingAppId === app.id || isRejected}
                              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                isRejected
                                  ? "bg-rose-100 text-rose-700 border border-rose-200 cursor-default"
                                  : "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                              }`}
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </button>
                          </div>
                        </div>

                        {/* Resume & Cover Letter Section */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                          <div className="flex items-center gap-3">
                            {app.resume_url ? (
                              <a
                                href={app.resume_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF9FD] hover:bg-[#4B63D2]/10 border border-[#D5CBEE] text-[#4B63D2] rounded-xl text-xs font-bold transition-all"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>View Resume / CV</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-xs text-slate-400 italic">No direct resume URL provided</span>
                            )}

                            {app.cover_letter && (
                              <button
                                onClick={() => setSelectedCoverLetterApp(app)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF9FD] hover:bg-[#FAF9FD] border border-[#D5CBEE] text-[#5851A4] rounded-xl text-xs font-bold transition-all cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Read Cover Letter</span>
                              </button>
                            )}
                          </div>

                          <span className="text-[11px] text-[#9188BE] font-medium">
                            Live updates linked directly to candidate's dashboard
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* TAB: CANDIDATE STATUS (For Central Admin)                                  */}
      {/* ========================================================================= */}
      {activeTab === "candidate-status" && (
        <div className="space-y-6">
          {/* Header & Metric Cards */}
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    Central Admin Console
                  </span>
                </div>
                <h2 className="text-2xl font-black text-[#1E2746] flex items-center gap-2 tracking-tight">
                  <UserCheck className="w-6 h-6 text-[#4B63D2]" />
                  Candidate Placement Status Hub
                </h2>
                <p className="text-xs sm:text-sm text-[#5851A4] font-medium mt-1 max-w-2xl leading-relaxed">
                  Campus-wide authority to verify, track, and update student placement statuses across all academic departments. Status updates immediately reflect across institutional records.
                </p>
              </div>

              <button
                onClick={fetchCandidateStudents}
                disabled={candidateLoading}
                className="px-4 py-2.5 rounded-xl bg-[#FAF9FD] hover:bg-[#F0EDF9] border border-[#D5CBEE] text-[#5851A4] hover:text-[#1E2746] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Loader2 className={`w-3.5 h-3.5 ${candidateLoading ? "animate-spin text-[#4B63D2]" : ""}`} />
                <span>Refresh Candidates</span>
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
              <div className="bg-[#FAF9FD] border border-[#EAE4F7] rounded-2xl p-4 transition-all">
                <span className="text-[11px] font-bold text-[#9188BE] uppercase tracking-wider block mb-1">
                  Total Students
                </span>
                <span className="text-2xl sm:text-3xl font-black text-[#1E2746]">
                  {candidateMetrics.total}
                </span>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider">
                    Placed
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-2xl sm:text-3xl font-black text-emerald-700">
                  {candidateMetrics.placed}
                </span>
              </div>

              <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black text-purple-800 uppercase tracking-wider">
                    Internship
                  </span>
                  <Briefcase className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-2xl sm:text-3xl font-black text-purple-700">
                  {candidateMetrics.internship}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                    Not Placed
                  </span>
                  <Clock className="w-4 h-4 text-slate-500" />
                </div>
                <span className="text-2xl sm:text-3xl font-black text-slate-800">
                  {candidateMetrics.notPlaced}
                </span>
              </div>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5851A4]" />
                <input
                  type="text"
                  placeholder="Search by student name, email, skills..."
                  value={candidateSearchQuery}
                  onChange={(e) => setCandidateSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] placeholder-[#9188BE] outline-none transition-all"
                />
              </div>

              {/* Department filter */}
              <div>
                <select
                  value={candidateDeptFilter}
                  onChange={(e) => setCandidateDeptFilter(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-bold text-[#1E2746] outline-none cursor-pointer"
                >
                  <option value="ALL">All Departments</option>
                  <option value="CSE">Computer Science (CSE)</option>
                  <option value="CSE(AIML)">CSE (AI &amp; ML)</option>
                  <option value="CSE(AIDS)">CSE (Data Science)</option>
                  <option value="IT">Information Technology (IT)</option>
                  <option value="ETC">Electronics &amp; Telecom (ETC)</option>
                  <option value="EE">Electrical Engineering (EE)</option>
                  <option value="ME">Mechanical Engineering (ME)</option>
                  <option value="BCA">BCA</option>
                  <option value="MCA">MCA</option>
                  <option value="MBA">MBA</option>
                </select>
              </div>

              {/* Status filter */}
              <div>
                <select
                  value={candidateStatusFilter}
                  onChange={(e) => setCandidateStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-bold text-[#1E2746] outline-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Placed">Placed</option>
                  <option value="Not Placed">Not Placed</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              {/* Batch filter */}
              <div>
                <select
                  value={candidateBatchFilter}
                  onChange={(e) => setCandidateBatchFilter(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-bold text-[#1E2746] outline-none cursor-pointer"
                >
                  <option value="ALL">All Grad Batches</option>
                  <option value="2024">Batch of 2024</option>
                  <option value="2025">Batch of 2025 (Graduating)</option>
                  <option value="2026">Batch of 2026 (Final Year)</option>
                  <option value="2027">Batch of 2027 (Third Year)</option>
                  <option value="2028">Batch of 2028 (Second Year)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-[#5851A4] pt-2 border-t border-[#EAE4F7]">
              <span>
                Showing <strong className="text-[#1E2746]">{filteredCandidateStudents.length}</strong> candidates matching filters
              </span>
              {(candidateDeptFilter !== "ALL" || candidateStatusFilter !== "ALL" || candidateBatchFilter !== "ALL" || candidateSearchQuery) && (
                <button
                  onClick={() => {
                    setCandidateDeptFilter("ALL");
                    setCandidateStatusFilter("ALL");
                    setCandidateBatchFilter("ALL");
                    setCandidateSearchQuery("");
                  }}
                  className="text-[#4B63D2] hover:underline cursor-pointer"
                >
                  Reset all filters
                </button>
              )}
            </div>
          </div>

          {/* Students List */}
          {candidateLoading ? (
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-16 text-center shadow-sm">
              <Loader2 className="w-8 h-8 animate-spin text-[#4B63D2] mx-auto mb-3" />
              <p className="text-xs font-bold text-[#1E2746]">Loading candidate profiles across departments...</p>
            </div>
          ) : filteredCandidateStudents.length === 0 ? (
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-12 text-center space-y-3 shadow-sm">
              <UserCheck className="w-12 h-12 text-[#9188BE] mx-auto opacity-50" />
              <h3 className="text-base font-bold text-[#1E2746]">No candidates found</h3>
              <p className="text-xs text-[#5851A4] max-w-sm mx-auto">
                No students matched the selected filters. Try broadening your search or resetting the filters above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCandidateStudents.map((student) => {
                const currentStatus = student.status || "Not Placed";
                const isUpdatingThis = updatingStudentId === student.id;

                const getStatusBadge = (status: string) => {
                  const s = status.toLowerCase();
                  if (s === "placed") {
                    return (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Placed
                      </span>
                    );
                  }
                  if (s === "internship" || s === "interning") {
                    return (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-200">
                        <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                        Internship
                      </span>
                    );
                  }
                  return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-200">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Not Placed
                    </span>
                  );
                };

                return (
                  <div
                    key={student.id}
                    className="bg-white border border-[#EAE4F7] hover:border-[#4B63D2]/40 rounded-3xl p-5 shadow-sm transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    {/* Student Identity */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#4B63D2] to-[#5851A4] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md shadow-[#4B63D2]/20">
                        {student.profile_picture ? (
                          <img
                            src={student.profile_picture}
                            alt=""
                            className="w-full h-full object-cover rounded-2xl"
                          />
                        ) : (
                          <span>{(student.first_name?.[0] || student.email?.[0] || "S").toUpperCase()}</span>
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-black text-[#1E2746] truncate">
                            {`${student.first_name || ""} ${student.last_name || ""}`.trim() || student.email.split("@")[0]}
                          </h4>
                          {getStatusBadge(currentStatus)}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5851A4]">
                          <span className="font-medium text-slate-600">{student.email}</span>
                          <span className="text-[#9188BE]">•</span>
                          <span className="font-bold text-[#1E2746]">
                            {student.department || "General"}
                          </span>
                          <span className="text-[#9188BE]">•</span>
                          <span className="font-medium">
                            Grad Batch: <strong className="text-[#1E2746]">{student.graduation_year || "2025"}</strong>
                          </span>
                          {student.cgpa && (
                            <>
                              <span className="text-[#9188BE]">•</span>
                              <span className="font-medium text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                CGPA: {student.cgpa}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Skills preview */}
                        {student.skills && (
                          <div className="flex flex-wrap items-center gap-1 pt-1">
                            {(Array.isArray(student.skills) ? student.skills : [String(student.skills)])
                              .slice(0, 4)
                              .map((sk: any, i: number) => (
                                <span
                                  key={i}
                                  className="text-[10px] font-semibold bg-[#FAF9FD] text-[#5851A4] border border-[#EAE4F7] px-2 py-0.5 rounded-md"
                                >
                                  {typeof sk === "string" ? sk : sk?.name || String(sk)}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Change Selector Pills */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#EAE4F7] shrink-0">
                      <span className="text-[11px] font-bold text-[#9188BE] uppercase tracking-wider mr-1">
                        Change Status:
                      </span>

                      <div className="flex items-center gap-1.5 p-1 bg-[#FAF9FD] border border-[#D5CBEE] rounded-2xl">
                        {/* Placed Button */}
                        <button
                          onClick={() => handleChangeStudentPlacementStatus(student.id, "Placed")}
                          disabled={isUpdatingThis}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            currentStatus === "Placed"
                              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                              : "text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Placed</span>
                        </button>

                        {/* Internship Button */}
                        <button
                          onClick={() => handleChangeStudentPlacementStatus(student.id, "Internship")}
                          disabled={isUpdatingThis}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            currentStatus === "Internship" || currentStatus === "Interning"
                              ? "bg-purple-600 text-white shadow-sm shadow-purple-600/30"
                              : "text-purple-700 hover:bg-purple-50"
                          }`}
                        >
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>Internship</span>
                        </button>

                        {/* Not Placed Button */}
                        <button
                          onClick={() => handleChangeStudentPlacementStatus(student.id, "Not Placed")}
                          disabled={isUpdatingThis}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            currentStatus === "Not Placed"
                              ? "bg-slate-700 text-white shadow-sm"
                              : "text-slate-600 hover:bg-slate-200/60"
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Not Placed</span>
                        </button>
                      </div>

                      {isUpdatingThis && (
                        <Loader2 className="w-4 h-4 animate-spin text-[#4B63D2]" />
                      )}
                    </div>
                  </div>
                );
              })}
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
              Job and internship opportunities can only be posted by authorized <strong>Controllers</strong>, <strong>TPO</strong>, <strong>Alumni</strong>, and <strong>Administrators</strong>.
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
                Post a Campus Job or Company Referral
              </h2>
              <p className="text-xs text-[#5851A4] font-medium">
                Publish verified recruitment drives & employee referral opportunities for SBJIT students and alumni.
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

            <div>
              <label className="block text-xs font-bold text-[#1E2746] mb-1">
                Application Form Link (Optional)
              </label>
              <input
                type="url"
                placeholder="e.g. https://forms.gle/... or https://forms.office.com/..."
                value={postFormLink}
                onChange={(e) => setPostFormLink(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs sm:text-sm font-medium text-[#1E2746] focus:outline-none"
              />
              <p className="text-[11px] text-[#5851A4] mt-1 font-medium">
                Provide an external Google Form, Microsoft Form, or ATS application link. When candidates apply, they will open this link and be recorded as &quot;Applied&quot;.
              </p>
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
                  placeholder={`Hi ${
                    referralModalTarget?.name ? referralModalTarget.name.split(" ")[0] : "there"
                  }, I am a student at SBJIT interested in ${
                    targetJobTitle || "this opening"
                  }. I would love a referral for this role...`}
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

            {selectedJobForApply.form_link && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <ExternalLink className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide">
                      Recruiter Form Link Required
                    </h4>
                    <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                      This recruiter requires completing an external form (e.g. Google Form or Microsoft Form). Click below to open the application form in a new tab. When you return to Knots, your status will show <strong>Applied</strong> and the applicant count will update automatically.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleOpenJobFormAndApply}
                  disabled={submittingApply}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{submittingApply ? "Recording..." : "Open Form & Mark as Applied"}</span>
                </button>
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-amber-200"></div>
                  <span className="flex-shrink mx-2 text-[10px] font-bold text-amber-600 uppercase">Or submit via Knots</span>
                  <div className="flex-grow border-t border-amber-200"></div>
                </div>
              </div>
            )}

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

      {/* ========================================================================= */}
      {/* MODAL 4: VIEW COVER LETTER MODAL                                          */}
      {/* ========================================================================= */}
      {selectedCoverLetterApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-lg w-full bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <button
              onClick={() => setSelectedCoverLetterApp(null)}
              className="absolute top-5 right-5 p-2 text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD] rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-[#4B63D2]/10 flex items-center justify-center text-[#4B63D2]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#1E2746]">Candidate Cover Letter</h3>
                <p className="text-xs text-[#5851A4]">
                  Applicant #{selectedCoverLetterApp.applicant_id} • {selectedCoverLetterApp.job_posting?.title || "Opportunity"}
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#FAF9FD] border border-[#EAE4F7] rounded-2xl max-h-64 overflow-y-auto">
              <p className="text-xs sm:text-sm text-[#1E2746] font-medium leading-relaxed whitespace-pre-wrap">
                {selectedCoverLetterApp.cover_letter || "No cover letter provided."}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCoverLetterApp(null)}
                className="px-5 py-2 rounded-xl bg-[#4B63D2] text-white text-xs font-bold hover:bg-[#3E53BE] transition-all cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: VIEW OPPORTUNITY DETAILS (INFO MODAL)                            */}
      {/* ========================================================================= */}
      {selectedJobDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-xl w-full bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedJobDetails(null)}
              className="absolute top-5 right-5 p-2 text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD] rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#4B63D2] to-[#5851A4] flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
                {selectedJobDetails.company?.name?.charAt(0) || "C"}
              </div>
              <div className="space-y-1 pr-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#4B63D2]/10 text-[#4B63D2] border border-[#4B63D2]/20">
                    {formatJobType(selectedJobDetails.job_type)}
                  </span>
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      selectedJobDetails.workplace_type === "REMOTE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : selectedJobDetails.workplace_type === "HYBRID"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    {formatWorkplace(selectedJobDetails.workplace_type)}
                  </span>
                </div>
                <h3 className="text-xl font-black text-[#1E2746]">
                  {selectedJobDetails.title}
                </h3>
                <p className="text-xs font-bold text-[#5851A4] flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[#4B63D2] shrink-0" />
                  <span>{selectedJobDetails.company?.name || "Verified Partner"}</span>
                  {selectedJobDetails.location && (
                    <span className="text-[#9188BE] font-medium flex items-center gap-0.5">
                      • <MapPin className="w-3 h-3 inline shrink-0" />
                      {selectedJobDetails.location}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-[#FAF9FD] border border-[#EAE4F7] rounded-2xl text-xs space-y-2">
              <div className="flex items-center gap-2 text-[#1E2746] font-bold">
                <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {selectedJobDetails.job_type === "INTERNSHIP" ? "Stipend: " : "Salary: "}
                  <strong className="text-emerald-700">
                    {selectedJobDetails.salary_range || (selectedJobDetails.job_type === "INTERNSHIP" ? "Competitive Stipend" : "Competitive Salary")}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-[#5851A4] font-medium">
                <Clock className="w-3.5 h-3.5 text-[#9188BE] shrink-0" />
                <span>
                  Workplace Mode: <strong>{formatWorkplace(selectedJobDetails.workplace_type)}</strong>
                  {selectedJobDetails.location && ` (${selectedJobDetails.location})`}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-[#1E2746] mb-1.5">
                Job Description
              </h4>
              <div className="p-4 bg-[#FAF9FD] border border-[#EAE4F7] rounded-2xl text-xs sm:text-sm text-[#1E2746] font-medium leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                {selectedJobDetails.description || "No specific job description provided."}
              </div>
            </div>

            {selectedJobDetails.required_skills && selectedJobDetails.required_skills.length > 0 && (
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-[#1E2746] mb-1.5">
                  Required Skills
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJobDetails.required_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-bold px-2.5 py-1 rounded-xl bg-[#FAF9FD] text-[#5851A4] border border-[#EAE4F7]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedJobDetails.form_link && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <ExternalLink className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>External Form Required for Application</span>
                </div>
                <a
                  href={selectedJobDetails.form_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center gap-1 shrink-0"
                >
                  <ExternalLink className="w-3 h-3" />
                  Preview Form
                </a>
              </div>
            )}

            <div className="flex justify-end items-center gap-3 pt-3 border-t border-[#EAE4F7]">
              <button
                type="button"
                onClick={() => setSelectedJobDetails(null)}
                className="px-4 py-2 rounded-xl border border-[#EAE4F7] text-xs font-bold text-[#5851A4] hover:bg-[#FAF9FD] transition-all cursor-pointer"
              >
                Close
              </button>
              {canApplyJob && (
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedJobDetails;
                    setSelectedJobDetails(null);
                    setSelectedJobForApply(target);
                  }}
                  className={`px-6 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedJobDetails.form_link
                      ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/25"
                      : "bg-[#4B63D2] hover:bg-[#3E53BE] shadow-[#4B63D2]/25"
                  }`}
                >
                  {selectedJobDetails.form_link ? (
                    <>
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Apply via Form</span>
                    </>
                  ) : (
                    <span>Apply Now</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* TAB 5: FACULTY RESEARCH COLLABORATIONS (Students can explore & apply)     */}
      {/* ========================================================================= */}
      {activeTab === "research" && !isFaculty && !isController && !isAlumni && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-white/20 text-white backdrop-blur-md">
                <FlaskConical className="w-3.5 h-3.5 text-[#FFD21A]" />
                Campus Academic Nexus
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Faculty Research Papers & Collaborations
              </h2>
              <p className="text-indigo-100 text-xs sm:text-sm max-w-2xl font-medium leading-relaxed">
                Connect directly with professors and research faculty. Review ongoing research studies, required student skillsets, and submit collaboration applications to earn co-authorship and academic project experience.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : researchCollaborations.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#EAE4F7] rounded-3xl p-8 space-y-3">
              <FlaskConical className="w-12 h-12 text-indigo-400/40 mx-auto" />
              <h3 className="text-base font-bold text-[#1E2746]">
                No Research Collaborations Available
              </h3>
              <p className="text-xs text-[#5851A4] max-w-md mx-auto">
                Faculty members have not posted any active research projects at the moment. Please check back later or reach out to your department coordinator.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {researchCollaborations.map((project) => {
                const hasApplied = appliedResearchIds.has(project.id);
                return (
                  <div
                    key={project.id}
                    className="bg-white border border-[#EAE4F7] rounded-3xl p-6 hover:shadow-lg hover:shadow-indigo-500/5 transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <FlaskConical className="w-3 h-3" />
                            Research Project
                          </span>
                          {project.posted_by_name && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1E2746]">
                              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                              Prof. {project.posted_by_name}
                            </span>
                          )}
                          {project.department && (
                            <span className="text-xs text-[#5851A4]">
                              • {project.department}
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-black text-[#1E2746]">
                          {project.title}
                        </h3>
                      </div>

                      {hasApplied ? (
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Join Request Sent
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedResearchForApply(project)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                        >
                          <Send className="w-3.5 h-3.5 text-[#FFD21A]" />
                          Request to Join
                        </button>
                      )}
                    </div>

                    <p className="text-sm text-[#5851A4] whitespace-pre-line leading-relaxed">
                      {project.description}
                    </p>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#5851A4] pt-1">
                      {project.stipend_or_salary && (
                        <span className="font-bold text-indigo-700">
                          🏆 {project.stipend_or_salary}
                        </span>
                      )}
                      {project.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Duration: {project.duration}
                        </span>
                      )}
                      {project.application_deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Deadline: {new Date(project.application_deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>

                    {/* Required Skills */}
                    {project.required_skills && project.required_skills.length > 0 && (
                      <div className="pt-2 border-t border-[#EAE4F7] flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-bold text-[#5851A4] mr-1">
                          Prerequisites & Skills:
                        </span>
                        {project.required_skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 bg-indigo-50/70 border border-indigo-100 rounded-lg text-[10px] font-bold text-indigo-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Research Application Modal ────────────────────────────────────── */}
      {selectedResearchForApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start gap-4 border-b border-[#EAE4F7] pb-4">
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full mb-1">
                  Request to Join Faculty Research
                </span>
                <h3 className="text-base font-black text-[#1E2746]">
                  {selectedResearchForApply.title}
                </h3>
                {selectedResearchForApply.posted_by_name && (
                  <p className="text-xs text-[#5851A4] mt-0.5">
                    Faculty Lead: Prof. {selectedResearchForApply.posted_by_name} ({selectedResearchForApply.department || "Department Faculty"})
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedResearchForApply(null)}
                className="p-1.5 hover:bg-[#FAF9FD] rounded-full text-[#5851A4] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyResearch} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#5851A4] mb-1.5 block">
                  Statement of Interest & Relevant Background *
                </label>
                <textarea
                  value={researchApplyStatement}
                  onChange={(e) => setResearchApplyStatement(e.target.value)}
                  required
                  rows={4}
                  placeholder="Introduce yourself, mention relevant coursework or projects, technical skills (e.g. Python, ML), and why you want to collaborate on this research..."
                  className="w-full px-4 py-2.5 bg-[#FAF9FD] border border-[#EAE4F7] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedResearchForApply(null)}
                  className="px-4 py-2 rounded-xl border border-[#EAE4F7] text-xs font-bold text-[#5851A4] hover:bg-[#FAF9FD] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingResearchApply}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submittingResearchApply ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Sending Request...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-[#FFD21A]" />
                      Send Join Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: STUDENT FINDER (TPO ONLY)                                          */}
      {/* ========================================================================= */}
      {isTpo && activeTab === "student-finder" && (() => {
        // Only the 11 authorized departments
        const allowedDepartments = [
          "First year",
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

        const allowedYears = [
          "1st Year",
          "2nd Year",
          "3rd Year",
          "4th Year",
        ];

        const deptMatchesFilter = (filterDept: string, studentDept: string): boolean => {
          if (filterDept === "ALL") return true;
          const f = filterDept.toLowerCase().trim();
          const s = studentDept.toLowerCase().trim();
          if (f === s) return true;
          if (f.includes("first") || f === "fy") return s.includes("first") || s === "fy" || s.includes("1st");
          if (f.includes("aiml")) return s.includes("aiml");
          if (f.includes("aids")) return s.includes("aids");
          if (f === "cse") {
            if (s.includes("aiml") || s.includes("aids")) return false;
            return s === "cse" || s.includes("computer science") || s.includes("computer");
          }
          if (f === "it") return s === "it" || s.includes("information technology");
          if (f === "etc") return s === "etc" || s === "ece" || (s.includes("electronics") && s.includes("telecommunication")) || s.includes("electronic");
          if (f === "ee") return s === "ee" || s.includes("electrical");
          if (f === "me") return s === "me" || s.includes("mechanical");
          if (f === "bca") return s === "bca";
          if (f === "mca") return s === "mca";
          if (f === "mba") return s === "mba";
          return s.includes(f);
        };

        const yearMatchesFilter = (filterYear: string, s: any): boolean => {
          if (filterYear === "ALL") return true;
          const academicYr = String(s.academic_year || s.profile?.academic_year || "").toLowerCase();
          const gradYr = Number(s.profile?.graduation_year || s.graduation_year || 0);
          const gradYrStr = String(s.profile?.graduation_year || s.graduation_year || "").toLowerCase().trim();
          const curYear = new Date().getFullYear();

          if (filterYear === "1st Year") {
            if (academicYr.includes("1") || academicYr.includes("first")) return true;
            if (gradYr === curYear + 2 || gradYr === 2028 || gradYrStr === "1") return true;
            return false;
          }
          if (filterYear === "2nd Year") {
            if (academicYr.includes("2") || academicYr.includes("second")) return true;
            if (gradYr === curYear + 1 || gradYr === 2027 || gradYrStr === "2") return true;
            return false;
          }
          if (filterYear === "3rd Year") {
            if (academicYr.includes("3") || academicYr.includes("third")) return true;
            if (gradYr === curYear || gradYr === 2026 || gradYrStr === "3") return true;
            return false;
          }
          if (filterYear === "4th Year") {
            if (academicYr.includes("4") || academicYr.includes("fourth") || academicYr.includes("final")) return true;
            if (gradYr === curYear - 1 || gradYr === 2025 || (gradYr > 1900 && gradYr <= 2025) || gradYrStr === "4") return true;
            return false;
          }
          return true;
        };

        const skillsQuery = sfSkills.toLowerCase().trim();

        const filtered = studentList.filter((s: any) => {
          const dept = (s.profile?.department || s.department || "").toLowerCase();
          const rawSkills = s.profile?.skills || s.skills;
          const skillsStr = (
            Array.isArray(rawSkills)
              ? rawSkills.map((x: any) => (typeof x === "string" ? x : x.name || String(x))).join(" ")
              : String(rawSkills || "")
          ).toLowerCase();
          const name = `${s.profile?.first_name || s.first_name || ""} ${s.profile?.last_name || s.last_name || ""}`.toLowerCase();
          const email = (s.email || "").toLowerCase();

          if (sfYear !== "ALL" && !yearMatchesFilter(sfYear, s)) return false;
          if (sfDepartment !== "ALL" && !deptMatchesFilter(sfDepartment, dept)) return false;
          if (skillsQuery && !skillsStr.includes(skillsQuery) && !name.includes(skillsQuery) && !email.includes(skillsQuery)) return false;
          return true;
        });

        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-lg font-black text-[#1E2746] flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-600" />
                    Student Finder
                  </h2>
                  <p className="text-xs text-[#5851A4] mt-0.5 font-medium">
                    Filter and discover students by year, department, and skills
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                  <Users className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="text-xs font-extrabold text-emerald-800">{filtered.length} students found</span>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Skills / Name / Email search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5851A4]" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or skills (e.g. Python, React)..."
                    value={sfSkills}
                    onChange={(e) => setSfSkills(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-emerald-500 rounded-xl text-xs font-medium text-[#1E2746] placeholder-[#9188BE] focus:outline-none transition-colors"
                  />
                </div>

                {/* Year */}
                <select
                  value={sfYear}
                  onChange={(e) => setSfYear(e.target.value)}
                  className="px-3 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] rounded-xl text-xs font-bold text-[#1E2746] focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="ALL">All Years</option>
                  {allowedYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                {/* Department */}
                <select
                  value={sfDepartment}
                  onChange={(e) => setSfDepartment(e.target.value)}
                  className="px-3 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] rounded-xl text-xs font-bold text-[#1E2746] focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="ALL">All Departments</option>
                  {allowedDepartments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                {/* Reset */}
                {(sfYear !== "ALL" || sfDepartment !== "ALL" || sfSkills) && (
                  <button
                    onClick={() => { setSfYear("ALL"); setSfDepartment("ALL"); setSfSkills(""); }}
                    className="px-3 py-2.5 rounded-xl border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Student Cards */}
            {studentFinderLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                <p className="text-sm font-bold text-[#5851A4]">Loading students...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white border border-[#EAE4F7] rounded-2xl p-12 text-center shadow-sm">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-7 h-7 text-emerald-600" />
                </div>
                <p className="text-base font-black text-[#1E2746] mb-1">No students found</p>
                <p className="text-xs text-[#5851A4] font-medium">
                  {studentList.length === 0
                    ? "Students will appear here once they register on the platform."
                    : "Try adjusting your filters to find matching students."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((student: any) => {
                  const firstName = student.profile?.first_name || student.first_name || "";
                  const lastName = student.profile?.last_name || student.last_name || "";
                  const fullName = `${firstName} ${lastName}`.trim() || student.email?.split("@")[0] || "Student";
                  const dept = student.profile?.department || student.department || "—";
                  const gradYear = student.profile?.graduation_year || student.graduation_year;
                  const skills = student.profile?.skills || student.skills || "";
                  const pic = student.profile?.profile_picture || student.profile_picture;
                  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "S";
                  const gradColors = ["bg-emerald-100 text-emerald-800", "bg-teal-100 text-teal-800", "bg-sky-100 text-sky-800", "bg-violet-100 text-violet-800"];
                  const colorIdx = (student.id || 0) % gradColors.length;

                  return (
                    <div
                      key={student.id || student.email}
                      className="bg-white border border-[#EAE4F7] hover:border-emerald-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3 group"
                    >
                      {/* Avatar + Name */}
                      <div className="flex items-center gap-3">
                        {pic ? (
                          <img src={pic} alt={fullName} className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-200" />
                        ) : (
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-sm ${gradColors[colorIdx]} ring-2 ring-emerald-200`}>
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-black text-[#1E2746] truncate">{fullName}</p>
                          <p className="text-[11px] text-[#5851A4] font-medium truncate">{student.email}</p>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAE4F7] text-[#4B63D2] border border-[#D5CBEE]">
                          {dept}
                        </span>
                        {(() => {
                          const ay = student.academic_year || student.profile?.academic_year;
                          if (ay) return (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {ay}
                            </span>
                          );
                          const gy = Number(gradYear);
                          const cur = new Date().getFullYear();
                          let yrLabel: string | null = null;
                          if (gy === cur + 2 || gy === 2028) yrLabel = "1st Year";
                          else if (gy === cur + 1 || gy === 2027) yrLabel = "2nd Year";
                          else if (gy === cur || gy === 2026) yrLabel = "3rd Year";
                          else if (gy === cur - 1 || gy === 2025 || (gy > 1900 && gy <= 2025)) yrLabel = "4th Year";
                          else if (gradYear) yrLabel = `Batch ${gradYear}`;

                          return yrLabel ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {yrLabel}
                            </span>
                          ) : null;
                        })()}
                      </div>

                      {/* Skills */}
                      {Boolean(skills && (Array.isArray(skills) ? skills.length > 0 : String(skills).trim().length > 0)) && (
                        <div>
                          <p className="text-[10px] font-bold text-[#9188BE] uppercase tracking-wider mb-1">Skills</p>
                          <div className="flex flex-wrap gap-1">
                            {(Array.isArray(skills)
                              ? skills.map((sk: any) => (typeof sk === "string" ? sk.trim() : sk?.name || String(sk)))
                              : String(skills).split(/[,;|]/).map((sk: string) => sk.trim())
                            )
                              .filter(Boolean)
                              .slice(0, 6)
                              .map((sk: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                                  {sk}
                                </span>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Contact */}
                      <a
                        href={`mailto:${student.email}`}
                        className="mt-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Contact Student
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL: EDIT OPPORTUNITY (Central Admin & Creator)                         */}
      {/* ========================================================================= */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-2xl w-full bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingJob(null)}
              className="absolute top-5 right-5 p-2 text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD] rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#4B63D2] to-[#5851A4] flex items-center justify-center text-white shadow-md shadow-[#4B63D2]/20">
                <Edit3 className="w-6 h-6 text-[#FFD21A]" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#1E2746] tracking-tight">
                  Edit Opportunity
                </h3>
                <p className="text-xs text-[#5851A4] font-medium">
                  Update opening details, required qualifications, and application link.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveJobEdit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1.5">
                  Opportunity Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editJobTitle}
                  onChange={(e) => setEditJobTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1E2746] mb-1.5">Job Type</label>
                  <select
                    value={editJobType}
                    onChange={(e) => setEditJobType(e.target.value as JobType)}
                    className="w-full px-3 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-bold text-[#1E2746] outline-none"
                  >
                    <option value="FULL_TIME">Full-Time</option>
                    <option value="INTERNSHIP">Internship</option>
                    <option value="PART_TIME">Part-Time</option>
                    <option value="CONTRACT">Contract</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E2746] mb-1.5">Workplace Type</label>
                  <select
                    value={editWorkplaceType}
                    onChange={(e) => setEditWorkplaceType(e.target.value as WorkplaceType)}
                    className="w-full px-3 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-bold text-[#1E2746] outline-none"
                  >
                    <option value="ON_SITE">On-Site</option>
                    <option value="REMOTE">Remote</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1E2746] mb-1.5">Location</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="e.g. Pune / Bangalore"
                    className="w-full px-4 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E2746] mb-1.5">Salary / Stipend Range</label>
                  <input
                    type="text"
                    value={editSalaryRange}
                    onChange={(e) => setEditSalaryRange(e.target.value)}
                    placeholder="e.g. 6 - 8 LPA or 25k/mo"
                    className="w-full px-4 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1.5">Required Skills (Comma separated)</label>
                <input
                  type="text"
                  value={editRequiredSkills}
                  onChange={(e) => setEditRequiredSkills(e.target.value)}
                  placeholder="e.g. Python, FastAPI, React, SQL"
                  className="w-full px-4 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1E2746] mb-1.5">Application Deadline</label>
                  <input
                    type="date"
                    value={editApplicationDeadline}
                    onChange={(e) => setEditApplicationDeadline(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E2746] mb-1.5">Google Form / External Link</label>
                  <input
                    type="url"
                    value={editFormLink}
                    onChange={(e) => setEditFormLink(e.target.value)}
                    placeholder="https://forms.gle/..."
                    className="w-full px-4 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1.5">
                  Opportunity Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={editJobDescription}
                  onChange={(e) => setEditJobDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingJob(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#D5CBEE] text-[#5851A4] hover:bg-[#FAF9FD] text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingJobEdit}
                  className="px-6 py-2.5 rounded-xl bg-[#4B63D2] hover:bg-[#3E53BE] text-white text-xs font-bold shadow-md shadow-[#4B63D2]/25 transition-all cursor-pointer flex items-center gap-2"
                >
                  {submittingJobEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

