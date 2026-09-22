import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Users,
  Building,
  Award,
  Search,
  Plus,
  Clock,
  XCircle,
  FileSpreadsheet,
  Trash2,
  Eye,
  Send,
  Loader2,
  ExternalLink,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  X,
  Compass,
  MapPin,
} from "lucide-react";
import { apiRequest } from "../services/api";

// ── APPROVED CONSTANTS ────────────────────────────────────────────────────────
export const TPO_DEPARTMENTS = [
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

export const TPO_YEARS = [
  "1st year",
  "2nd year",
  "3rd year",
  "4th year",
];

// ── CSV EXPORT UTILITY ────────────────────────────────────────────────────────
function exportToCsv(filename: string, headers: string[], rows: (string | number | undefined | null)[][]) {
  const escapeCsv = (val: string | number | undefined | null) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const csvContent =
    "\uFEFF" +
    headers.map(escapeCsv).join(",") +
    "\n" +
    rows.map((row) => row.map(escapeCsv).join(",")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── INTERFACES ────────────────────────────────────────────────────────────────
interface JobPosting {
  id: number;
  title: string;
  description?: string;
  requirements?: string;
  job_type: string;
  workplace_type: string;
  location?: string;
  salary_range?: string;
  status: string;
  application_deadline?: string;
  company_id?: number;
  company?: {
    id: number;
    name: string;
    industry?: string;
    location?: string;
  };
  poster_id?: number;
  posted_by?: {
    id: number;
    email: string;
    role?: { name: string };
    profile?: { first_name?: string; last_name?: string };
  };
  created_at: string;
}

interface ApplicationItem {
  id: number;
  job_posting_id: number;
  applicant_id: number;
  status: "pending" | "reviewing" | "accepted" | "rejected" | string;
  resume_url?: string;
  cover_letter?: string;
  applied_at: string;
  applicant?: {
    id: number;
    email: string;
    role?: { name: string };
    profile?: {
      first_name?: string;
      last_name?: string;
      department?: string;
      academic_year?: string;
      graduation_year?: number;
      skills?: string[] | string;
      profile_picture?: string;
    };
  };
  job_posting?: {
    id: number;
    title: string;
    company?: { name: string };
  };
}

interface StudentUser {
  id: number;
  email: string;
  role?: { name: string };
  profile?: {
    first_name?: string;
    last_name?: string;
    department?: string;
    academic_year?: string;
    graduation_year?: number;
    skills?: string[] | string;
    profile_picture?: string;
    phone_number?: string;
    bio?: string;
  };
}

interface ClubItem {
  id: number;
  name: string;
  description?: string;
  category: string;
  department?: string;
  creator_id: number;
  head_name?: string;
  co_head_name?: string;
  faculty_coordinator?: string;
  members_count?: number;
  banner_image?: string;
  logo_image?: string;
}

interface PlacementRecord {
  id: number;
  student_name: string;
  department: string;
  company: string;
  package_lpa: number;
  role_offered: string;
  batch: string;
  status: "VERIFIED" | "ACCEPTED" | "PENDING_JOINING";
  date: string;
}

export default function TpoDashboard() {
  const [activeTab, setActiveTab] = useState<
    "drives" | "applications" | "students" | "clubs" | "records"
  >("drives");

  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Data states
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [allApplications, setAllApplications] = useState<ApplicationItem[]>([]);
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [myClubs, setMyClubs] = useState<ClubItem[]>([]);
  const [placementRecords, setPlacementRecords] = useState<PlacementRecord[]>([]);

  // Search & Filter states
  const [driveSearch, setDriveSearch] = useState("");
  const [driveTypeFilter, setDriveTypeFilter] = useState("ALL");
  const [driveStatusFilter, setDriveStatusFilter] = useState("ALL");

  const [appSearch, setAppSearch] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState("ALL");
  const [appJobFilter, setAppJobFilter] = useState<number | "ALL">("ALL");

  const [studentSearch, setStudentSearch] = useState("");
  const [studentDeptFilter, setStudentDeptFilter] = useState("ALL");
  const [studentYearFilter, setStudentYearFilter] = useState("ALL");
  const [studentSkillQuery, setStudentSkillQuery] = useState("");

  const [recordSearch, setRecordSearch] = useState("");
  const [recordDeptFilter, setRecordDeptFilter] = useState("ALL");

  // Modals
  const [createDriveModalOpen, setCreateDriveModalOpen] = useState(false);
  const [createDriveSubmitting, setCreateDriveSubmitting] = useState(false);
  const [newDrive, setNewDrive] = useState({
    title: "",
    company_name: "",
    job_type: "full-time",
    workplace_type: "on-site",
    location: "Campus / Head Office",
    salary_range: "6.5 - 12 LPA",
    description: "",
    requirements: "",
    application_deadline: "",
  });

  const [viewApplicantsDrive, setViewApplicantsDrive] = useState<JobPosting | null>(null);
  const [driveApplicants, setDriveApplicants] = useState<ApplicationItem[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [newRecord, setNewRecord] = useState({
    student_name: "",
    department: "CSE",
    company: "",
    package_lpa: "",
    role_offered: "",
    batch: "2026",
    status: "VERIFIED" as const,
  });

  const [createClubModalOpen, setCreateClubModalOpen] = useState(false);
  const [newClubName, setNewClubName] = useState("");
  const [newClubDesc, setNewClubDesc] = useState("");
  const [creatingClub, setCreatingClub] = useState(false);

  // ── LOAD INITIAL DATA ───────────────────────────────────────────────────────
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [meRes, jobsRes, usersRes, clubsRes] = await Promise.allSettled([
        apiRequest<any>("/users/me"),
        apiRequest<JobPosting[]>("/jobs?limit=100"),
        apiRequest<StudentUser[]>("/users?limit=100"),
        apiRequest<ClubItem[]>("/clubs?limit=100"),
      ]);

      const user = meRes.status === "fulfilled" ? meRes.value : null;
      setCurrentUser(user);

      const jobList: JobPosting[] = jobsRes.status === "fulfilled" ? jobsRes.value || [] : [];
      setJobs(jobList);

      const userList: StudentUser[] = usersRes.status === "fulfilled" ? usersRes.value || [] : [];
      // Filter students
      const stdOnly = userList.filter((u) => {
        const r = u.role?.name?.toLowerCase().trim() || "";
        return r === "" || r === "student";
      });
      setStudents(stdOnly);

      const clubList: ClubItem[] = clubsRes.status === "fulfilled" ? clubsRes.value || [] : [];
      // Filter clubs created by TPO
      const tpoClubs = clubList.filter((c) => {
        if (!user) return false;
        return c.creator_id === user.id || c.category === "Placement & Internship";
      });
      setMyClubs(tpoClubs);

      // Load applications for TPO-created or active jobs
      const appPromises = jobList.map(async (j) => {
        try {
          const apps = await apiRequest<ApplicationItem[]>(`/jobs/${j.id}/applications`);
          return apps.map((a) => ({ ...a, job_posting: { id: j.id, title: j.title, company: j.company } }));
        } catch {
          return [];
        }
      });
      const appsNested = await Promise.all(appPromises);
      const flatApps = appsNested.flat();
      setAllApplications(flatApps);

      // Initial placement records
      const samplePlacements: PlacementRecord[] = [
        {
          id: 1,
          student_name: "Aditya Sharma",
          department: "CSE",
          company: "Google Cloud",
          package_lpa: 24.5,
          role_offered: "Cloud Solutions Architect",
          batch: "2026",
          status: "VERIFIED",
          date: "Sep 2026",
        },
        {
          id: 2,
          student_name: "Pooja Verma",
          department: "IT",
          company: "Microsoft",
          package_lpa: 21.0,
          role_offered: "Software Development Engineer",
          batch: "2026",
          status: "VERIFIED",
          date: "Sep 2026",
        },
        {
          id: 3,
          student_name: "Rohan Patel",
          department: "CSE(AIML)",
          company: "Amazon AWS",
          package_lpa: 19.2,
          role_offered: "Applied AI Engineer",
          batch: "2026",
          status: "ACCEPTED",
          date: "Aug 2026",
        },
        {
          id: 4,
          student_name: "Sneha Kulkarni",
          department: "ETC",
          company: "Deloitte",
          package_lpa: 11.5,
          role_offered: "Tech Consultant",
          batch: "2026",
          status: "VERIFIED",
          date: "Aug 2026",
        },
        {
          id: 5,
          student_name: "Vikram Deshmukh",
          department: "CSE(AIDS)",
          company: "Goldman Sachs",
          package_lpa: 28.0,
          role_offered: "Quantitative Analyst",
          batch: "2026",
          status: "VERIFIED",
          date: "Jul 2026",
        },
      ];
      setPlacementRecords(samplePlacements);
    } catch (err) {
      console.error("Failed to load TPO Dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // ── FILTERED DATA ───────────────────────────────────────────────────────────
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const matchSearch =
        j.title.toLowerCase().includes(driveSearch.toLowerCase()) ||
        (j.company?.name || "").toLowerCase().includes(driveSearch.toLowerCase()) ||
        (j.location || "").toLowerCase().includes(driveSearch.toLowerCase());

      const matchType =
        driveTypeFilter === "ALL" ||
        j.job_type.toLowerCase() === driveTypeFilter.toLowerCase();

      const matchStatus =
        driveStatusFilter === "ALL" ||
        j.status.toLowerCase() === driveStatusFilter.toLowerCase();

      return matchSearch && matchType && matchStatus;
    });
  }, [jobs, driveSearch, driveTypeFilter, driveStatusFilter]);

  const filteredApplications = useMemo(() => {
    return allApplications.filter((app) => {
      const applicantName = `${app.applicant?.profile?.first_name || ""} ${app.applicant?.profile?.last_name || ""}`.trim() || app.applicant?.email || "";
      const matchSearch =
        applicantName.toLowerCase().includes(appSearch.toLowerCase()) ||
        (app.job_posting?.title || "").toLowerCase().includes(appSearch.toLowerCase());

      const matchStatus =
        appStatusFilter === "ALL" ||
        app.status.toLowerCase() === appStatusFilter.toLowerCase();

      const matchJob =
        appJobFilter === "ALL" || app.job_posting_id === Number(appJobFilter);

      return matchSearch && matchStatus && matchJob;
    });
  }, [allApplications, appSearch, appStatusFilter, appJobFilter]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const name = `${s.profile?.first_name || ""} ${s.profile?.last_name || ""}`.trim();
      const email = s.email || "";
      const matchSearch =
        name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        email.toLowerCase().includes(studentSearch.toLowerCase());

      // Department filter
      let matchDept = true;
      if (studentDeptFilter !== "ALL") {
        const d = (s.profile?.department || "").trim().toLowerCase();
        const f = studentDeptFilter.trim().toLowerCase();
        matchDept = d === f || d.includes(f) || f.includes(d);
      }

      // Academic Year filter
      let matchYear = true;
      if (studentYearFilter !== "ALL") {
        const ay = (s.profile?.academic_year || "").trim().toLowerCase();
        const gy = Number(s.profile?.graduation_year);
        const cur = new Date().getFullYear();
        let yr = "";
        if (ay) yr = ay;
        else if (gy === cur + 2 || gy === 2028) yr = "1st year";
        else if (gy === cur + 1 || gy === 2027) yr = "2nd year";
        else if (gy === cur || gy === 2026) yr = "3rd year";
        else if (gy === cur - 1 || gy === 2025 || (gy > 1900 && gy <= 2025)) yr = "4th year";

        matchYear = yr.includes(studentYearFilter.toLowerCase());
      }

      // Skills filter
      let matchSkills = true;
      if (studentSkillQuery.trim()) {
        const q = studentSkillQuery.trim().toLowerCase();
        const skRaw = s.profile?.skills;
        let skStr = "";
        if (Array.isArray(skRaw)) {
          skStr = (skRaw as any[]).map((x: any) => (typeof x === "string" ? x : x?.name || "")).join(" ");
        } else if (typeof skRaw === "string") {
          skStr = skRaw;
        }
        matchSkills = skStr.toLowerCase().includes(q);
      }

      return matchSearch && matchDept && matchYear && matchSkills;
    });
  }, [students, studentSearch, studentDeptFilter, studentYearFilter, studentSkillQuery]);

  const filteredRecords = useMemo(() => {
    return placementRecords.filter((rec) => {
      const matchSearch =
        rec.student_name.toLowerCase().includes(recordSearch.toLowerCase()) ||
        rec.company.toLowerCase().includes(recordSearch.toLowerCase()) ||
        rec.role_offered.toLowerCase().includes(recordSearch.toLowerCase());

      const matchDept =
        recordDeptFilter === "ALL" ||
        rec.department.toLowerCase() === recordDeptFilter.toLowerCase();

      return matchSearch && matchDept;
    });
  }, [placementRecords, recordSearch, recordDeptFilter]);

  // ── STATS COMPUTATION ───────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalDrives = jobs.length;
    const openDrives = jobs.filter((j) => j.status.toLowerCase() === "open").length;
    const totalApps = allApplications.length;
    const shortlistedApps = allApplications.filter(
      (a) => a.status.toLowerCase() === "reviewing" || a.status.toLowerCase() === "accepted"
    ).length;
    const totalPlaced = placementRecords.length;
    const avgPackage =
      totalPlaced > 0
        ? (placementRecords.reduce((acc, r) => acc + r.package_lpa, 0) / totalPlaced).toFixed(1)
        : "0.0";
    const highestPackage =
      totalPlaced > 0
        ? Math.max(...placementRecords.map((r) => r.package_lpa)).toFixed(1)
        : "0.0";

    return {
      totalDrives,
      openDrives,
      totalApps,
      shortlistedApps,
      totalPlaced,
      avgPackage,
      highestPackage,
      myClubsCount: myClubs.length,
      studentPoolCount: students.length,
    };
  }, [jobs, allApplications, placementRecords, myClubs, students]);

  // ── ACTION HANDLERS ─────────────────────────────────────────────────────────

  // Update Application Status
  const handleUpdateAppStatus = async (
    applicationId: number,
    newStatus: "reviewing" | "accepted" | "rejected"
  ) => {
    try {
      await apiRequest(`/jobs/applications/${applicationId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      setAllApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, status: newStatus } : app))
      );

      if (viewApplicantsDrive) {
        setDriveApplicants((prev) =>
          prev.map((app) => (app.id === applicationId ? { ...app, status: newStatus } : app))
        );
      }
    } catch (err: any) {
      alert(err.message || "Failed to update applicant status");
    }
  };

  // Open Drive Applicants Modal
  const handleOpenDriveApplicants = async (job: JobPosting) => {
    setViewApplicantsDrive(job);
    setLoadingApplicants(true);
    try {
      const apps = await apiRequest<ApplicationItem[]>(`/jobs/${job.id}/applications`);
      setDriveApplicants(apps);
    } catch (err) {
      console.error(err);
      setDriveApplicants([]);
    } finally {
      setLoadingApplicants(false);
    }
  };

  // Create Drive
  const handleCreateDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrive.title.trim() || !newDrive.company_name.trim()) return;

    setCreateDriveSubmitting(true);
    try {
      let compId: number | undefined;
      try {
        const companies = await apiRequest<any[]>("/jobs/companies?limit=100");
        const found = (companies || []).find(
          (c) => c.name.toLowerCase() === newDrive.company_name.trim().toLowerCase()
        );
        if (found) {
          compId = found.id;
        } else {
          const createdComp = await apiRequest<any>("/jobs/companies", {
            method: "POST",
            body: JSON.stringify({ name: newDrive.company_name.trim() }),
          });
          compId = createdComp.id;
        }
      } catch {
        // Ignore company creation fallback
      }

      const created = await apiRequest<JobPosting>("/jobs", {
        method: "POST",
        body: JSON.stringify({
          title: newDrive.title.trim(),
          description: newDrive.description.trim() || "Campus recruitment drive posted by TPO.",
          requirements: newDrive.requirements.trim() || "Eligible for final & pre-final year students.",
          job_type: newDrive.job_type,
          workplace_type: newDrive.workplace_type,
          location: newDrive.location.trim(),
          salary_range: newDrive.salary_range.trim(),
          application_deadline: newDrive.application_deadline ? new Date(newDrive.application_deadline).toISOString() : null,
          company_id: compId,
        }),
      });

      setJobs((prev) => [created, ...prev]);
      setCreateDriveModalOpen(false);
      setNewDrive({
        title: "",
        company_name: "",
        job_type: "full-time",
        workplace_type: "on-site",
        location: "Campus / Head Office",
        salary_range: "6.5 - 12 LPA",
        description: "",
        requirements: "",
        application_deadline: "",
      });
      alert("Placement Drive created and announced successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to create placement drive.");
    } finally {
      setCreateDriveSubmitting(false);
    }
  };

  // Delete Drive
  const handleDeleteDrive = async (jobId: number) => {
    if (!window.confirm("Are you sure you want to delete this placement drive?")) return;
    try {
      await apiRequest(`/jobs/${jobId}`, { method: "DELETE" });
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      setAllApplications((prev) => prev.filter((a) => a.job_posting_id !== jobId));
    } catch (err: any) {
      alert(err.message || "Failed to delete job.");
    }
  };

  // Create Placement Club
  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClubName.trim()) return;
    setCreatingClub(true);
    try {
      const res = await apiRequest<ClubItem>("/clubs", {
        method: "POST",
        body: JSON.stringify({
          name: newClubName.trim(),
          description: newClubDesc.trim() || "TPO Career, Placement & Internship Club.",
          category: "Placement & Internship",
        }),
      });
      setMyClubs((prev) => [res, ...prev]);
      setCreateClubModalOpen(false);
      setNewClubName("");
      setNewClubDesc("");
      alert("Placement & Internship Club created successfully! You can manage its leadership and operations.");
    } catch (err: any) {
      alert(err.message || "Failed to create club.");
    } finally {
      setCreatingClub(false);
    }
  };

  // Add Placement Record
  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.student_name.trim() || !newRecord.company.trim() || !newRecord.package_lpa) return;

    const record: PlacementRecord = {
      id: Date.now(),
      student_name: newRecord.student_name.trim(),
      department: newRecord.department,
      company: newRecord.company.trim(),
      package_lpa: parseFloat(newRecord.package_lpa) || 10,
      role_offered: newRecord.role_offered.trim() || "Graduate Trainee",
      batch: newRecord.batch || "2026",
      status: newRecord.status,
      date: "Sep 2026",
    };

    setPlacementRecords((prev) => [record, ...prev]);
    setRecordModalOpen(false);
    setNewRecord({
      student_name: "",
      department: "CSE",
      company: "",
      package_lpa: "",
      role_offered: "",
      batch: "2026",
      status: "VERIFIED",
    });
  };

  // ── CSV EXPORTS ─────────────────────────────────────────────────────────────
  const exportStudentsCsv = () => {
    const headers = ["ID", "Name", "Email", "Department", "Academic Year", "Graduation Year", "Skills"];
    const rows = filteredStudents.map((s) => {
      const name = `${s.profile?.first_name || ""} ${s.profile?.last_name || ""}`.trim() || "Student";
      const sk = Array.isArray(s.profile?.skills)
        ? (s.profile?.skills as any[]).map((x: any) => (typeof x === "string" ? x : x?.name || "")).join("; ")
        : s.profile?.skills || "";
      return [s.id, name, s.email, s.profile?.department || "—", s.profile?.academic_year || "—", s.profile?.graduation_year || "—", sk];
    });
    exportToCsv("TPO_Filtered_Students", headers, rows);
  };

  const exportApplicationsCsv = () => {
    const headers = ["App ID", "Job Title", "Company", "Student Name", "Student Email", "Department", "Status", "Applied At"];
    const rows = filteredApplications.map((a) => {
      const name = `${a.applicant?.profile?.first_name || ""} ${a.applicant?.profile?.last_name || ""}`.trim() || "Student";
      return [
        a.id,
        a.job_posting?.title || "—",
        a.job_posting?.company?.name || "—",
        name,
        a.applicant?.email || "—",
        a.applicant?.profile?.department || "—",
        a.status.toUpperCase(),
        a.applied_at || "—",
      ];
    });
    exportToCsv("TPO_Placement_Applications", headers, rows);
  };

  const exportRecordsCsv = () => {
    const headers = ["Record ID", "Student Name", "Department", "Batch", "Company", "Package (LPA)", "Role Offered", "Status"];
    const rows = filteredRecords.map((r) => [
      r.id,
      r.student_name,
      r.department,
      r.batch,
      r.company,
      r.package_lpa,
      r.role_offered,
      r.status,
    ]);
    exportToCsv("TPO_Placement_Offers_Report", headers, rows);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* ============================================================ */}
      {/* 1. HERO BANNER & COMMAND HEADER                              */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1E2746] via-[#2D3A6B] to-[#4B63D2] p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-black text-amber-300">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Training & Placement Cell (TPO) Command Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              Placement & Career Operations
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl font-medium">
              Oversee campus recruitment drives, review candidate applications, search eligible students across departments, supervise career clubs, and track placement records.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setCreateDriveModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Drive</span>
            </button>
            <button
              onClick={() => setCreateClubModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-black border border-white/20 backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Create Placement Club</span>
            </button>
            <button
              onClick={() => setRecordModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Record Offer</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. KPI METRICS CARDS                                         */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-[#111827] border border-[#EAE4F7] dark:border-[#1F2937] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5851A4] dark:text-[#94A3B8] uppercase tracking-wider">
              Active Drives
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-[#1E2746] dark:text-[#F1F5F9]">{stats.openDrives}</p>
            <p className="text-[11px] text-[#9188BE] font-semibold mt-0.5">{stats.totalDrives} total announced</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-[#111827] border border-[#EAE4F7] dark:border-[#1F2937] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5851A4] dark:text-[#94A3B8] uppercase tracking-wider">
              Applications
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-[#1E2746] dark:text-[#F1F5F9]">{stats.totalApps}</p>
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">{stats.shortlistedApps} in review/shortlisted</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-[#111827] border border-[#EAE4F7] dark:border-[#1F2937] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5851A4] dark:text-[#94A3B8] uppercase tracking-wider">
              Placed Students
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-[#1E2746] dark:text-[#F1F5F9]">{stats.totalPlaced}</p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">Verified offers</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-[#111827] border border-[#EAE4F7] dark:border-[#1F2937] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5851A4] dark:text-[#94A3B8] uppercase tracking-wider">
              Avg / Highest LPA
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-[#1E2746] dark:text-[#F1F5F9]">₹{stats.highestPackage}L</p>
            <p className="text-[11px] text-[#9188BE] font-semibold mt-0.5">Avg: ₹{stats.avgPackage} LPA</p>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-white dark:bg-[#111827] border border-[#EAE4F7] dark:border-[#1F2937] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5851A4] dark:text-[#94A3B8] uppercase tracking-wider">
              TPO Clubs
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-[#1E2746] dark:text-[#F1F5F9]">{stats.myClubsCount}</p>
            <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold mt-0.5">Placement & Internships</p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. NAVIGATION TABS                                           */}
      {/* ============================================================ */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-[#EAE4F7] dark:border-[#1F2937] pb-2">
        <button
          onClick={() => setActiveTab("drives")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "drives"
              ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/30"
              : "text-[#5851A4] dark:text-[#94A3B8] hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B]"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Drives & Job Postings ({jobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("applications")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "applications"
              ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/30"
              : "text-[#5851A4] dark:text-[#94A3B8] hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B]"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Candidate Pipeline ({allApplications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("students")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "students"
              ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/30"
              : "text-[#5851A4] dark:text-[#94A3B8] hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B]"
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Student Talent Finder</span>
        </button>

        <button
          onClick={() => setActiveTab("clubs")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "clubs"
              ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/30"
              : "text-[#5851A4] dark:text-[#94A3B8] hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B]"
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>My Placement Clubs ({myClubs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("records")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "records"
              ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/30"
              : "text-[#5851A4] dark:text-[#94A3B8] hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B]"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Offer Tracker ({placementRecords.length})</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: DRIVES & POSITIONS                                    */}
      {/* ============================================================ */}
      {activeTab === "drives" && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#111827] p-4 rounded-2xl border border-[#EAE4F7] dark:border-[#1F2937] shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9188BE]" />
              <input
                type="text"
                value={driveSearch}
                onChange={(e) => setDriveSearch(e.target.value)}
                placeholder="Search drives by job title, company name, or location..."
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-xl focus:outline-none focus:border-[#4B63D2]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={driveTypeFilter}
                onChange={(e) => setDriveTypeFilter(e.target.value)}
                className="px-3 py-2 text-xs font-bold bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-[#1E2746] dark:text-[#F1F5F9] focus:outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="full-time">Full-time</option>
                <option value="internship">Internship</option>
                <option value="contract">Contract</option>
              </select>

              <select
                value={driveStatusFilter}
                onChange={(e) => setDriveStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs font-bold bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-[#1E2746] dark:text-[#F1F5F9] focus:outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>

              <button
                onClick={() => setCreateDriveModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Post Drive</span>
              </button>
            </div>
          </div>

          {/* Drives Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-[#4B63D2] animate-spin" />
              <p className="text-xs font-semibold text-[#5851A4] dark:text-[#94A3B8]">Loading placement drives...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white dark:bg-[#111827] border border-[#EAE4F7] dark:border-[#1F2937] rounded-2xl p-12 text-center shadow-xs">
              <Briefcase className="w-12 h-12 text-[#9188BE] mx-auto mb-3" />
              <h3 className="text-base font-black text-[#1E2746] dark:text-[#F1F5F9]">No Placement Drives Found</h3>
              <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] max-w-sm mx-auto mt-1">
                {driveSearch ? "No results match your search filters." : "You haven't posted any drives yet. Click '+ Post Drive' to publish your first campus opportunity."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJobs.map((job) => {
                const isTpoCreated =
                  job.poster_id === currentUser?.id ||
                  job.posted_by?.role?.name?.toLowerCase() === "tpo";
                const isOpen = job.status.toLowerCase() === "open";

                return (
                  <div
                    key={job.id}
                    className="bg-white dark:bg-[#111827] border border-[#EAE4F7] dark:border-[#1F2937] hover:border-[#4B63D2]/40 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-[#4B63D2]/10 text-[#4B63D2] border border-[#4B63D2]/20">
                              {job.job_type}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                                isOpen
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              {job.status}
                            </span>
                          </div>
                          <h3 className="text-base font-black text-[#1E2746] dark:text-[#F1F5F9] mt-2 group-hover:text-[#4B63D2] transition-colors line-clamp-1">
                            {job.title}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#5851A4] dark:text-[#94A3B8] mt-1">
                            <Building className="w-3.5 h-3.5 text-[#9188BE]" />
                            <span>{job.company?.name || "Campus Placement Cell"}</span>
                          </div>
                        </div>

                        {isTpoCreated && (
                          <button
                            onClick={() => handleDeleteDrive(job.id)}
                            title="Delete Drive"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#FAF9FD] dark:border-[#1F2937] grid grid-cols-2 gap-2 text-[11px]">
                        <div className="flex items-center gap-1 text-[#5851A4] dark:text-[#94A3B8]">
                          <MapPin className="w-3.5 h-3.5 text-[#9188BE]" />
                          <span className="truncate">{job.location || job.workplace_type}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[#5851A4] dark:text-[#94A3B8]">
                          <DollarSign className="w-3.5 h-3.5 text-[#9188BE]" />
                          <span className="font-bold text-[#1E2746] dark:text-[#F1F5F9]">{job.salary_range || "Competitive"}</span>
                        </div>
                      </div>

                      {job.description && (
                        <p className="mt-3 text-xs text-[#5851A4] dark:text-[#94A3B8] line-clamp-2">
                          {job.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-[#EAE4F7] dark:border-[#1F2937] flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenDriveApplicants(job)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#4B63D2]/10 hover:bg-[#4B63D2] text-[#4B63D2] hover:text-white text-xs font-black transition-all cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Manage Applicants</span>
                      </button>

                      <Link
                        to="/opportunities"
                        className="p-2 rounded-xl border border-[#EAE4F7] dark:border-[#1F2937] text-slate-500 hover:text-[#4B63D2] transition-colors"
                        title="View on Opportunities Board"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: CANDIDATE APPLICATIONS                                */}
      {/* ============================================================ */}
      {activeTab === "applications" && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#111827] p-4 rounded-2xl border border-[#EAE4F7] dark:border-[#1F2937] shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9188BE]" />
              <input
                type="text"
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                placeholder="Search candidate name or drive title..."
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-xl focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={appJobFilter}
                onChange={(e) => setAppJobFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
                className="px-3 py-2 text-xs font-bold bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-[#1E2746] dark:text-[#F1F5F9] focus:outline-none"
              >
                <option value="ALL">All Drives</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>

              <select
                value={appStatusFilter}
                onChange={(e) => setAppStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs font-bold bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-[#1E2746] dark:text-[#F1F5F9] focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="reviewing">Shortlisted / Reviewing</option>
                <option value="accepted">Accepted / Selected</option>
                <option value="rejected">Rejected</option>
              </select>

              <button
                onClick={exportApplicationsCsv}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#1E2746] dark:text-[#F1F5F9] text-xs font-black transition-colors cursor-pointer shrink-0"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Applications Table */}
          {filteredApplications.length === 0 ? (
            <div className="bg-white dark:bg-[#111827] border border-[#EAE4F7] dark:border-[#1F2937] rounded-2xl p-12 text-center shadow-xs">
              <Users className="w-12 h-12 text-[#9188BE] mx-auto mb-3" />
              <h3 className="text-base font-black text-[#1E2746] dark:text-[#F1F5F9]">No Applications In Pipeline</h3>
              <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] max-w-sm mx-auto mt-1">
                Candidate applications will appear here as soon as students submit their profiles for active campus drives.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#111827] border border-[#EAE4F7] dark:border-[#1F2937] rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FAF9FD] dark:bg-[#1E293B]/70 border-b border-[#EAE4F7] dark:border-[#1F2937] text-[11px] font-black text-[#5851A4] dark:text-[#94A3B8] uppercase tracking-wider">
                      <th className="py-3 px-4">Candidate</th>
                      <th className="py-3 px-4">Placement Drive</th>
                      <th className="py-3 px-4">Department & Year</th>
                      <th className="py-3 px-4">Resume / Pitch</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FAF9FD] dark:divide-[#1F2937]">
                    {filteredApplications.map((app) => {
                      const firstName = app.applicant?.profile?.first_name || "";
                      const lastName = app.applicant?.profile?.last_name || "";
                      const fullName = `${firstName} ${lastName}`.trim() || app.applicant?.email?.split("@")[0] || "Student Candidate";
                      const dept = app.applicant?.profile?.department || "—";
                      const year = app.applicant?.profile?.academic_year || "3rd Year";
                      const statusClean = app.status.toLowerCase();

                      return (
                        <tr key={app.id} className="hover:bg-[#FAF9FD]/70 dark:hover:bg-[#1E293B]/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4B63D2] to-[#7B92E8] flex items-center justify-center font-black text-white text-xs shrink-0">
                                {fullName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-black text-[#1E2746] dark:text-[#F1F5F9]">{fullName}</p>
                                <p className="text-[10px] text-[#5851A4] dark:text-[#94A3B8]">{app.applicant?.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-[#1E2746] dark:text-[#F1F5F9]">
                            {app.job_posting?.title || `Drive #${app.job_posting_id}`}
                            <span className="block text-[10px] text-[#5851A4] dark:text-[#94A3B8] font-normal">
                              {app.job_posting?.company?.name || "Campus Drive"}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAE4F7] dark:bg-[#334155] text-[#4B63D2] dark:text-[#818CF8]">
                              {dept}
                            </span>
                            <span className="block text-[10px] text-[#9188BE] mt-0.5 font-medium">{year}</span>
                          </td>

                          <td className="py-3.5 px-4">
                            {app.resume_url ? (
                              <a
                                href={app.resume_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:underline"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Resume</span>
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">No file attached</span>
                            )}
                            {app.cover_letter && (
                              <p className="text-[10px] text-[#5851A4] dark:text-[#94A3B8] line-clamp-1 mt-0.5 italic">
                                "{app.cover_letter}"
                              </p>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                                statusClean === "accepted"
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200"
                                  : statusClean === "reviewing"
                                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200"
                                  : statusClean === "rejected"
                                  ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200"
                                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200"
                              }`}
                            >
                              {app.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleUpdateAppStatus(app.id, "reviewing")}
                                title="Shortlist Candidate"
                                className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 transition-colors cursor-pointer"
                              >
                                <Clock className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleUpdateAppStatus(app.id, "accepted")}
                                title="Accept / Offer"
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 transition-colors cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleUpdateAppStatus(app.id, "rejected")}
                                title="Reject"
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 transition-colors cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: STUDENT TALENT FINDER                                 */}
      {/* ============================================================ */}
      {activeTab === "students" && (
        <div className="space-y-4">
          {/* Controls Bar with Exact Approved Departments & Years */}
          <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-[#EAE4F7] dark:border-[#1F2937] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-[#1E2746] dark:text-[#F1F5F9]">
                  Student Talent Finder & Skill Explorer
                </h3>
                <p className="text-[11px] text-[#5851A4] dark:text-[#94A3B8]">
                  Filter prospective candidates across recognized academic departments and years.
                </p>
              </div>

              <button
                onClick={exportStudentsCsv}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#1E2746] dark:text-[#F1F5F9] text-xs font-black transition-colors cursor-pointer shrink-0"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export Candidate Pool ({filteredStudents.length})</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9188BE]" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search name or email..."
                  className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-xl focus:outline-none"
                />
              </div>

              {/* Department Dropdown (Strict Approved List) */}
              <div>
                <select
                  value={studentDeptFilter}
                  onChange={(e) => setStudentDeptFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-[#1E2746] dark:text-[#F1F5F9] focus:outline-none"
                >
                  <option value="ALL">All Departments</option>
                  {TPO_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Year Dropdown (Strict Approved List) */}
              <div>
                <select
                  value={studentYearFilter}
                  onChange={(e) => setStudentYearFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-[#1E2746] dark:text-[#F1F5F9] focus:outline-none"
                >
                  <option value="ALL">All Academic Years</option>
                  {TPO_YEARS.map((yr) => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>

              {/* Skills Search */}
              <div>
                <input
                  type="text"
                  value={studentSkillQuery}
                  onChange={(e) => setStudentSkillQuery(e.target.value)}
                  placeholder="Filter by skill (e.g. Python, React)..."
                  className="w-full px-3 py-2 text-xs font-semibold bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-xl focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Students Grid */}
          {filteredStudents.length === 0 ? (
            <div className="bg-white dark:bg-[#111827] border border-[#EAE4F7] dark:border-[#1F2937] rounded-2xl p-12 text-center shadow-xs">
              <Users className="w-12 h-12 text-[#9188BE] mx-auto mb-3" />
              <h3 className="text-base font-black text-[#1E2746] dark:text-[#F1F5F9]">No Students Found</h3>
              <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] max-w-sm mx-auto mt-1">
                No students match your selected department, academic year, or skills criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((s) => {
                const firstName = s.profile?.first_name || "";
                const lastName = s.profile?.last_name || "";
                const fullName = `${firstName} ${lastName}`.trim() || s.email.split("@")[0] || "Student";
                const dept = s.profile?.department || "General";
                const year = s.profile?.academic_year || "3rd Year";
                const skillsRaw = s.profile?.skills;
                const skillsList: string[] = Array.isArray(skillsRaw)
                  ? (skillsRaw as any[]).map((x: any) => (typeof x === "string" ? x : x?.name || "")).filter(Boolean)
                  : typeof skillsRaw === "string"
                  ? skillsRaw.split(/[,;|]/).map((x) => x.trim()).filter(Boolean)
                  : [];

                return (
                  <div
                    key={s.id}
                    className="bg-white dark:bg-[#111827] border border-[#EAE4F7] dark:border-[#1F2937] hover:border-[#4B63D2]/40 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all group"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#4B63D2] to-[#7B92E8] flex items-center justify-center font-black text-white text-sm shadow-xs shrink-0">
                          {fullName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-black text-[#1E2746] dark:text-[#F1F5F9] truncate group-hover:text-[#4B63D2] transition-colors">
                            {fullName}
                          </h4>
                          <p className="text-[11px] text-[#5851A4] dark:text-[#94A3B8] truncate">{s.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAE4F7] dark:bg-[#334155] text-[#4B63D2] dark:text-[#818CF8]">
                          {dept}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200">
                          {year}
                        </span>
                      </div>

                      {skillsList.length > 0 && (
                        <div className="mt-3">
                          <p className="text-[10px] font-black uppercase text-[#9188BE] tracking-wider mb-1">
                            Skills
                          </p>
                          <div className="flex items-center gap-1 flex-wrap">
                            {skillsList.slice(0, 5).map((sk, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200"
                              >
                                {sk}
                              </span>
                            ))}
                            {skillsList.length > 5 && (
                              <span className="text-[10px] text-slate-400 font-bold">+{skillsList.length - 5}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#FAF9FD] dark:border-[#1F2937]">
                      <a
                        href={`mailto:${s.email}?subject=Placement%20Opportunity%20-%20TPO%20Cell`}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-black transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Contact Student</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: PLACEMENT & INTERNSHIP CLUBS                          */}
      {/* ============================================================ */}
      {activeTab === "clubs" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#111827] p-4 rounded-2xl border border-[#EAE4F7] dark:border-[#1F2937] shadow-xs">
            <div>
              <h3 className="text-sm font-black text-[#1E2746] dark:text-[#F1F5F9]">
                TPO Placement & Internship Clubs
              </h3>
              <p className="text-[11px] text-[#5851A4] dark:text-[#94A3B8]">
                Clubs created and managed by the TPO cell for student career prep and industrial training.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/clubs"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EAE4F7] dark:border-[#1F2937] text-xs font-bold text-[#5851A4] dark:text-[#94A3B8] hover:text-[#4B63D2] transition-colors"
              >
                <Compass className="w-4 h-4" />
                <span>Visit Clubs Hub</span>
              </Link>
              <button
                onClick={() => setCreateClubModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#4B63D2] hover:bg-[#3D52B8] text-white text-xs font-black shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Placement Club</span>
              </button>
            </div>
          </div>

          {myClubs.length === 0 ? (
            <div className="bg-white dark:bg-[#111827] border border-[#EAE4F7] dark:border-[#1F2937] rounded-2xl p-12 text-center shadow-xs">
              <Compass className="w-12 h-12 text-[#9188BE] mx-auto mb-3" />
              <h3 className="text-base font-black text-[#1E2746] dark:text-[#F1F5F9]">No Placement Clubs Created Yet</h3>
              <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] max-w-sm mx-auto mt-1 mb-4">
                You have not created any Placement & Internship clubs yet. Create one to organize interview training and placement drives.
              </p>
              <button
                onClick={() => setCreateClubModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4B63D2] text-white rounded-xl text-xs font-black cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Placement Club</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myClubs.map((c) => (
                <div
                  key={c.id}
                  className="bg-white dark:bg-[#111827] border border-[#EAE4F7] dark:border-[#1F2937] hover:border-[#4B63D2]/40 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#4B63D2] to-[#7B92E8] flex items-center justify-center font-black text-white text-base shadow-xs">
                        {c.name.charAt(0)}
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200">
                        {c.category}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-[#1E2746] dark:text-[#F1F5F9] mt-3 group-hover:text-[#4B63D2] transition-colors">
                      {c.name}
                    </h4>
                    <p className="text-xs text-[#5851A4] dark:text-[#94A3B8] mt-1 line-clamp-2">
                      {c.description || "Training & Placement student operations club."}
                    </p>

                    <div className="mt-4 pt-3 border-t border-[#FAF9FD] dark:border-[#1F2937] space-y-1.5 text-xs text-[#5851A4] dark:text-[#94A3B8]">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-[#9188BE]">Head:</span>
                        <span className="font-bold text-[#1E2746] dark:text-[#F1F5F9]">{c.head_name || "Unassigned"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-[#9188BE]">Faculty Coordinator:</span>
                        <span className="font-bold text-[#1E2746] dark:text-[#F1F5F9]">{c.faculty_coordinator || "TPO Office"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#EAE4F7] dark:border-[#1F2937]">
                    <Link
                      to="/clubs"
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#4B63D2]/10 hover:bg-[#4B63D2] text-[#4B63D2] hover:text-white text-xs font-black transition-all"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Manage Club Operations</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 5: OFFER TRACKER & PLACEMENTS                            */}
      {/* ============================================================ */}
      {activeTab === "records" && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#111827] p-4 rounded-2xl border border-[#EAE4F7] dark:border-[#1F2937] shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9188BE]" />
              <input
                type="text"
                value={recordSearch}
                onChange={(e) => setRecordSearch(e.target.value)}
                placeholder="Search placed candidate, company or job role..."
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-xl focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={recordDeptFilter}
                onChange={(e) => setRecordDeptFilter(e.target.value)}
                className="px-3 py-2 text-xs font-bold bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-[#1E2746] dark:text-[#F1F5F9] focus:outline-none"
              >
                <option value="ALL">All Departments</option>
                {TPO_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <button
                onClick={exportRecordsCsv}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#1E2746] dark:text-[#F1F5F9] text-xs font-black transition-colors cursor-pointer shrink-0"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export Report</span>
              </button>

              <button
                onClick={() => setRecordModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Record Offer</span>
              </button>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white dark:bg-[#111827] border border-[#EAE4F7] dark:border-[#1F2937] rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF9FD] dark:bg-[#1E293B]/70 border-b border-[#EAE4F7] dark:border-[#1F2937] text-[11px] font-black text-[#5851A4] dark:text-[#94A3B8] uppercase tracking-wider">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Department & Batch</th>
                    <th className="py-3 px-4">Company</th>
                    <th className="py-3 px-4">Role Offered</th>
                    <th className="py-3 px-4">Package</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FAF9FD] dark:divide-[#1F2937]">
                  {filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-[#FAF9FD]/70 dark:hover:bg-[#1E293B]/40 transition-colors">
                      <td className="py-3.5 px-4 font-black text-[#1E2746] dark:text-[#F1F5F9]">
                        {r.student_name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAE4F7] dark:bg-[#334155] text-[#4B63D2] dark:text-[#818CF8]">
                          {r.department}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1.5 font-semibold">({r.batch})</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#1E2746] dark:text-[#F1F5F9]">
                        {r.company}
                      </td>
                      <td className="py-3.5 px-4 text-[#5851A4] dark:text-[#94A3B8]">
                        {r.role_offered}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          ₹{r.package_lpa} LPA
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: POST DRIVE                                            */}
      {/* ============================================================ */}
      {createDriveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#111827] border border-[#EAE4F7] dark:border-[#1F2937] rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#FAF9FD] dark:border-[#1F2937] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-[#1E2746] dark:text-[#F1F5F9]">
                  Post Placement or Internship Drive
                </h3>
              </div>
              <button
                onClick={() => setCreateDriveModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDrive} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1">
                    Job / Drive Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDrive.title}
                    onChange={(e) => setNewDrive({ ...newDrive, title: e.target.value })}
                    placeholder="e.g. Graduate Software Trainee"
                    className="w-full px-3 py-2 text-xs font-semibold bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDrive.company_name}
                    onChange={(e) => setNewDrive({ ...newDrive, company_name: e.target.value })}
                    placeholder="e.g. Google, Microsoft, TCS"
                    className="w-full px-3 py-2 text-xs font-semibold bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1">
                    Opportunity Type
                  </label>
                  <select
                    value={newDrive.job_type}
                    onChange={(e) => setNewDrive({ ...newDrive, job_type: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-[#1E2746] dark:text-[#F1F5F9] focus:outline-none"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="internship">Internship</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1">
                    Workplace
                  </label>
                  <select
                    value={newDrive.workplace_type}
                    onChange={(e) => setNewDrive({ ...newDrive, workplace_type: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-[#1E2746] dark:text-[#F1F5F9] focus:outline-none"
                  >
                    <option value="on-site">On-site</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1">
                    Salary / CTC
                  </label>
                  <input
                    type="text"
                    value={newDrive.salary_range}
                    onChange={(e) => setNewDrive({ ...newDrive, salary_range: e.target.value })}
                    placeholder="e.g. 8 - 14 LPA"
                    className="w-full px-3 py-2 text-xs font-semibold bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1">
                  Location / Campus Drive Details
                </label>
                <input
                  type="text"
                  value={newDrive.location}
                  onChange={(e) => setNewDrive({ ...newDrive, location: e.target.value })}
                  placeholder="e.g. Pune Campus / Bangalore Office"
                  className="w-full px-3 py-2 text-xs font-semibold bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1">
                  Description & Job Role Overview
                </label>
                <textarea
                  rows={3}
                  value={newDrive.description}
                  onChange={(e) => setNewDrive({ ...newDrive, description: e.target.value })}
                  placeholder="Detail the opportunity, team responsibilities, and benefits..."
                  className="w-full px-3 py-2 text-xs font-semibold bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1">
                  Eligibility & Requirements
                </label>
                <textarea
                  rows={2}
                  value={newDrive.requirements}
                  onChange={(e) => setNewDrive({ ...newDrive, requirements: e.target.value })}
                  placeholder="Minimum CGPA, eligible departments, core technical skills..."
                  className="w-full px-3 py-2 text-xs font-semibold bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#FAF9FD] dark:border-[#1F2937]">
                <button
                  type="button"
                  onClick={() => setCreateDriveModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#5851A4] dark:text-[#94A3B8] hover:bg-[#FAF9FD] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDriveSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md transition-all cursor-pointer"
                >
                  {createDriveSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Posting...</span>
                    </>
                  ) : (
                    <span>Publish Placement Drive</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: VIEW DRIVE APPLICANTS                                 */}
      {/* ============================================================ */}
      {viewApplicantsDrive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#111827] border border-[#EAE4F7] dark:border-[#1F2937] rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#FAF9FD] dark:border-[#1F2937] pb-3 shrink-0">
              <div>
                <h3 className="text-base font-black text-[#1E2746] dark:text-[#F1F5F9]">
                  Applicants: {viewApplicantsDrive.title}
                </h3>
                <p className="text-xs text-[#5851A4] dark:text-[#94A3B8]">
                  {viewApplicantsDrive.company?.name || "Campus Drive"} • {driveApplicants.length} Candidates Applied
                </p>
              </div>
              <button
                onClick={() => setViewApplicantsDrive(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-4 flex-1 space-y-3">
              {loadingApplicants ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Loader2 className="w-6 h-6 text-[#4B63D2] animate-spin" />
                  <p className="text-xs text-[#5851A4]">Loading drive applicants...</p>
                </div>
              ) : driveApplicants.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#5851A4] dark:text-[#94A3B8]">
                  No candidates have applied to this specific drive yet.
                </div>
              ) : (
                driveApplicants.map((app) => {
                  const name = `${app.applicant?.profile?.first_name || ""} ${app.applicant?.profile?.last_name || ""}`.trim() || app.applicant?.email || "Student";
                  return (
                    <div
                      key={app.id}
                      className="p-3.5 rounded-xl border border-[#EAE4F7] dark:border-[#1F2937] bg-[#FAF9FD] dark:bg-[#1E293B]/50 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-black text-[#1E2746] dark:text-[#F1F5F9]">{name}</p>
                        <p className="text-[10px] text-[#5851A4] dark:text-[#94A3B8]">{app.applicant?.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-[#4B63D2]">
                            {app.applicant?.profile?.department || "General"}
                          </span>
                          {app.resume_url && (
                            <a
                              href={app.resume_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-emerald-600 font-bold hover:underline inline-flex items-center gap-0.5"
                            >
                              <Eye className="w-3 h-3" /> Resume
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            app.status === "accepted"
                              ? "bg-emerald-100 text-emerald-800"
                              : app.status === "reviewing"
                              ? "bg-indigo-100 text-indigo-800"
                              : app.status === "rejected"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {app.status}
                        </span>
                        <button
                          onClick={() => handleUpdateAppStatus(app.id, "reviewing")}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg cursor-pointer"
                        >
                          Shortlist
                        </button>
                        <button
                          onClick={() => handleUpdateAppStatus(app.id, "accepted")}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg cursor-pointer"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-[#FAF9FD] dark:border-[#1F2937] flex justify-end shrink-0">
              <button
                onClick={() => setViewApplicantsDrive(null)}
                className="px-4 py-2 text-xs font-bold bg-[#FAF9FD] dark:bg-[#1E293B] rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: CREATE PLACEMENT CLUB                                 */}
      {/* ============================================================ */}
      {createClubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#111827] border border-[#EAE4F7] dark:border-[#1F2937] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#FAF9FD] dark:border-[#1F2937] pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#4B63D2]" />
                <h3 className="text-base font-black text-[#1E2746] dark:text-[#F1F5F9]">
                  Create Placement & Internship Club
                </h3>
              </div>
              <button
                onClick={() => setCreateClubModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClub} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1">
                  Club Name *
                </label>
                <input
                  type="text"
                  required
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value)}
                  placeholder="e.g. Competitive Coding & Placements Cell"
                  className="w-full px-3 py-2 text-xs font-semibold bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1">
                  Club Category
                </label>
                <input
                  type="text"
                  disabled
                  value="Placement & Internship (Locked)"
                  className="w-full px-3 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1">
                  Description & Career Mission
                </label>
                <textarea
                  rows={3}
                  value={newClubDesc}
                  onChange={(e) => setNewClubDesc(e.target.value)}
                  placeholder="Describe the club's interview prep, mock drives, or corporate connect activities..."
                  className="w-full px-3 py-2 text-xs font-semibold bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#FAF9FD] dark:border-[#1F2937]">
                <button
                  type="button"
                  onClick={() => setCreateClubModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#5851A4] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingClub}
                  className="flex items-center gap-1 px-4 py-2 bg-[#4B63D2] text-white text-xs font-black rounded-xl cursor-pointer"
                >
                  {creatingClub ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Create Club</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: RECORD PLACEMENT OFFER                                */}
      {/* ============================================================ */}
      {recordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#111827] border border-[#EAE4F7] dark:border-[#1F2937] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#FAF9FD] dark:border-[#1F2937] pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-[#1E2746] dark:text-[#F1F5F9]">
                  Record Placement Offer
                </h3>
              </div>
              <button
                onClick={() => setRecordModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRecord} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  required
                  value={newRecord.student_name}
                  onChange={(e) => setNewRecord({ ...newRecord, student_name: e.target.value })}
                  placeholder="e.g. Rahul Patil"
                  className="w-full px-3 py-2 text-xs font-semibold bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1">
                    Department
                  </label>
                  <select
                    value={newRecord.department}
                    onChange={(e) => setNewRecord({ ...newRecord, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-xl text-[#1E2746] dark:text-[#F1F5F9] focus:outline-none"
                  >
                    {TPO_DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1">
                    Batch Year
                  </label>
                  <input
                    type="text"
                    value={newRecord.batch}
                    onChange={(e) => setNewRecord({ ...newRecord, batch: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={newRecord.company}
                  onChange={(e) => setNewRecord({ ...newRecord, company: e.target.value })}
                  placeholder="e.g. Google, Microsoft, Infosys"
                  className="w-full px-3 py-2 text-xs font-semibold bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1">
                    Role Offered
                  </label>
                  <input
                    type="text"
                    value={newRecord.role_offered}
                    onChange={(e) => setNewRecord({ ...newRecord, role_offered: e.target.value })}
                    placeholder="e.g. Software Engineer"
                    className="w-full px-3 py-2 text-xs font-semibold bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5851A4] dark:text-[#94A3B8] mb-1">
                    Package (LPA) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newRecord.package_lpa}
                    onChange={(e) => setNewRecord({ ...newRecord, package_lpa: e.target.value })}
                    placeholder="e.g. 14.5"
                    className="w-full px-3 py-2 text-xs font-semibold bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#FAF9FD] dark:border-[#1F2937]">
                <button
                  type="button"
                  onClick={() => setRecordModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#5851A4] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black rounded-xl cursor-pointer shadow-md"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
