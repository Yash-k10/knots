import { useState, useEffect, useMemo } from "react";
import { FileCheck2, Search } from "lucide-react";
import { apiRequest } from "../services/api";

interface ApplicationItem {
  id: number;
  job_id: number;
  job_title: string;
  company_name: string;
  applicant_id: number;
  applicant_name: string;
  applicant_email: string;
  department: string;
  batch: string;
  cgpa: number;
  status: "SUBMITTED" | "REVIEW" | "TECH_ROUND" | "INTERVIEW" | "OFFER" | "REJECTED";
  applied_at: string;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [currentUserRole, setCurrentUserRole] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [meRes, jobsRes, usersRes] = await Promise.all([
          apiRequest<{ role?: { name: string } }>("/users/me").catch(() => null),
          apiRequest<any[]>("/jobs?limit=50").catch(() => []),
          apiRequest<any[]>("/users?limit=50").catch(() => []),
        ]);

        if (meRes?.role?.name) {
          setCurrentUserRole(meRes.role.name);
        }

        const stages: ApplicationItem["status"][] = [
          "SUBMITTED",
          "REVIEW",
          "TECH_ROUND",
          "INTERVIEW",
          "OFFER",
          "REJECTED",
        ];

        // Synthesize dynamic application entries
        const mockApplications: ApplicationItem[] = (usersRes || [])
          .slice(0, 16)
          .map((u: any, idx: number) => {
            const job = jobsRes[idx % (jobsRes.length || 1)] || {
              id: idx + 1,
              title: "Software Development Engineer",
              company_name: "Google Cloud",
            };
            const depts = [
              "Computer Science",
              "Information Technology",
              "Electronics & Comm.",
              "Data Science",
            ];
            const dept = u.profile?.department || depts[idx % depts.length];
            const batch = ["2025", "2026"][idx % 2];
            const status = stages[idx % stages.length];

            return {
              id: idx + 100,
              job_id: job.id,
              job_title: job.title || "Software Engineer",
              company_name: job.company_name || "Enterprise Partner",
              applicant_id: u.id,
              applicant_name:
                `${u.profile?.first_name || u.email.split("@")[0]} ${u.profile?.last_name || ""}`.trim(),
              applicant_email: u.email,
              department: dept,
              batch,
              cgpa: Number((7.4 + ((idx * 0.35) % 2.5)).toFixed(2)),
              status,
              applied_at: new Date(
                Date.now() - idx * 86400000 * 2,
              ).toLocaleDateString(),
            };
          });

        setApplications(mockApplications);
      } catch (err) {
        console.error("Failed to load applications", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleStatusChange = (appId: number, newStatus: ApplicationItem["status"]) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app)),
    );
  };

  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const matchStatus =
        statusFilter === "ALL" || app.status === statusFilter;
      const matchDept =
        selectedDept === "ALL" || app.department === selectedDept;
      const matchSearch =
        app.applicant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.company_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchDept && matchSearch;
    });
  }, [applications, statusFilter, selectedDept, searchQuery]);

  const isTPOOrController =
    currentUserRole.toLowerCase() === "tpo" ||
    currentUserRole.toLowerCase() === "controller" ||
    currentUserRole.toLowerCase() === "admin" ||
    currentUserRole.toLowerCase() === "super admin";

  const stageBadgeStyle = (status: ApplicationItem["status"]) => {
    switch (status) {
      case "OFFER":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "INTERVIEW":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "TECH_ROUND":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "REVIEW":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "REJECTED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white border border-[#EAE4F7] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4B63D2]/10 border border-[#4B63D2]/20 text-[#4B63D2] text-xs font-black">
            <FileCheck2 className="h-4 w-4" /> Opportunities & Applications Pipeline
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#1E2746] tracking-tight">
            Applications Management Hub
          </h1>
          <p className="text-[#5851A4] text-xs sm:text-sm max-w-xl font-medium">
            Review student candidate submissions across campus recruitment drives, verify
            eligibility, and transition applicants across recruitment stages.
          </p>
        </div>

        <div className="bg-[#FAF9FD] px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl border border-[#EAE4F7] text-center shrink-0 self-start md:self-auto">
          <span className="text-[11px] sm:text-xs font-bold text-[#5851A4] block">Pipeline Active</span>
          <span className="text-lg sm:text-xl font-black text-[#1E2746]">
            {filteredApps.length} Submissions
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#EAE4F7] rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row gap-2.5 sm:gap-3">
        <div className="flex-1 relative min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9188BE]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by candidate name, company, or job role..."
            className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-xs text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] transition font-medium"
          />
        </div>

        {/* Stage Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-[#1E2746] focus:outline-none focus:border-[#4B63D2] cursor-pointer"
        >
          <option value="ALL">All Pipeline Stages</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="REVIEW">Under Review</option>
          <option value="TECH_ROUND">Technical Assessment</option>
          <option value="INTERVIEW">Interview Scheduled</option>
          <option value="OFFER">Offer Extended</option>
          <option value="REJECTED">Rejected</option>
        </select>

        {/* Department Filter */}
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-[#1E2746] focus:outline-none focus:border-[#4B63D2] cursor-pointer"
        >
          <option value="ALL">All Departments</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Information Technology">Information Technology</option>
          <option value="Electronics & Comm.">Electronics & Comm.</option>
          <option value="Data Science">Data Science</option>
        </select>
      </div>

      {/* Applications Table */}
      <div className="bg-white border border-[#EAE4F7] rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-sm overflow-hidden">
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <table className="w-full text-left text-xs font-medium">
            <thead className="bg-[#FAF9FD] text-[#5851A4] font-bold uppercase text-[10px] tracking-wider border-b border-[#EAE4F7]">
              <tr>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4 whitespace-nowrap">Applicant Candidate</th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4 whitespace-nowrap">Opportunity & Company</th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4 whitespace-nowrap">Department / Batch</th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4 whitespace-nowrap">CGPA</th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4 whitespace-nowrap">Current Stage</th>
                {isTPOOrController && <th className="py-2.5 sm:py-3 px-3 sm:px-4 whitespace-nowrap">Stage Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE4F7]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading applications...
                  </td>
                </tr>
              ) : filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No applications match the current filters.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-[#FAF9FD]/50 transition">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-black text-[#1E2746] block">
                          {app.applicant_name}
                        </span>
                        <span className="text-[11px] text-[#5851A4]">
                          {app.applicant_email}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-[#1E2746] block">
                          {app.job_title}
                        </span>
                        <span className="text-[11px] text-[#4B63D2] font-semibold">
                          {app.company_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#5851A4]">
                      {app.department} • {app.batch}
                    </td>
                    <td className="py-3.5 px-4 font-black text-[#1E2746]">
                      {app.cgpa}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${stageBadgeStyle(
                          app.status,
                        )}`}
                      >
                        {app.status}
                      </span>
                    </td>
                    {isTPOOrController && (
                      <td className="py-3.5 px-4">
                        <select
                          value={app.status}
                          onChange={(e) =>
                            handleStatusChange(
                              app.id,
                              e.target.value as ApplicationItem["status"],
                            )
                          }
                          className="bg-[#FAF9FD] border border-[#D5CBEE] rounded-lg px-2.5 py-1 text-[11px] font-bold text-[#1E2746] focus:outline-none focus:border-[#4B63D2] cursor-pointer"
                        >
                          <option value="SUBMITTED">Submitted</option>
                          <option value="REVIEW">Review</option>
                          <option value="TECH_ROUND">Tech Round</option>
                          <option value="INTERVIEW">Interview</option>
                          <option value="OFFER">Offer</option>
                          <option value="REJECTED">Reject</option>
                        </select>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
