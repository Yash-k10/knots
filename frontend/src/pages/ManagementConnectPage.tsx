import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Send,
  Bell,
  FileCheck2,
  BarChart3,
  MessageSquare,
  ShieldCheck,
  Building,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  FileText,
  Download,
  Calendar,
  ExternalLink,
  ChevronRight,
  Info,
  Loader2,
} from "lucide-react";
import {
  departmentService,
  ManagementConnectRequest,
  ManagementAnnouncement,
  DepartmentReportItem,
} from "../services/department";
import { apiRequest } from "../services/api";

export default function ManagementConnectPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "announcements";
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<ManagementAnnouncement[]>([]);
  const [requests, setRequests] = useState<ManagementConnectRequest[]>([]);
  const [reports, setReports] = useState<DepartmentReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state for My Requests
  const [requestStatusFilter, setRequestStatusFilter] = useState("ALL");

  // Send Request Form State
  const [reqTitle, setReqTitle] = useState("");
  const [reqCategory, setReqCategory] = useState("Workshop or seminar request");
  const [reqBudget, setReqBudget] = useState("");
  const [reqCohort, setReqCohort] = useState("3rd & 4th Year Students");
  const [reqOutcomes, setReqOutcomes] = useState("");
  const [reqDescription, setReqDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Sync tab with URL
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [userRes, annRes, reqRes, repRes] = await Promise.all([
        apiRequest<any>("/users/me").catch(() => null),
        departmentService.getManagementAnnouncements().catch(() => []),
        departmentService.getManagementRequests().catch(() => []),
        departmentService.getReports().catch(() => []),
      ]);
      if (userRes) setCurrentUser(userRes);
      if (annRes) setAnnouncements(annRes);
      if (reqRes) setRequests(reqRes);
      if (repRes) setReports(repRes);
    } catch (err) {
      console.error("Failed to load management connect data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle.trim() || !reqDescription.trim()) return;

    try {
      setIsSubmitting(true);
      setSubmitSuccess(null);
      const newReq = await departmentService.createManagementRequest({
        title: reqTitle,
        category: reqCategory,
        budget_estimate: reqBudget || "₹ 0",
        target_cohort: reqCohort,
        expected_outcomes: reqOutcomes || "Academic enhancement and practical exposure",
        description: reqDescription,
      });

      setRequests((prev) => [newReq, ...prev]);
      setSubmitSuccess("Proposal submitted to Central Admin & Institutional Management successfully!");
      setReqTitle("");
      setReqBudget("");
      setReqOutcomes("");
      setReqDescription("");

      // Switch to my requests view after short delay
      setTimeout(() => {
        handleTabChange("requests");
        setSubmitSuccess(null);
      }, 1500);
    } catch (err: any) {
      console.error("Failed to submit request", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeDept =
    currentUser?.profile?.department || "Computer Science & Engineering";

  const filteredRequests = requests.filter((r) => {
    if (requestStatusFilter === "ALL") return true;
    return r.status.toLowerCase() === requestStatusFilter.toLowerCase();
  });

  const approvalsList = requests.filter((r) =>
    ["Approved", "Rejected", "Changes Requested"].includes(r.status)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-50 border border-emerald-200 text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case "Under Review":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-indigo-50 border border-indigo-200 text-indigo-700">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Under Review
          </span>
        );
      case "Changes Requested":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-50 border border-amber-200 text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5" /> Changes Requested
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-50 border border-rose-200 text-rose-700">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      case "Completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-50 border border-blue-200 text-blue-700">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-slate-100 border border-slate-200 text-slate-700">
            <Clock className="w-3.5 h-3.5" /> Pending Review
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#4B63D2]" />
        <p className="text-sm font-bold text-[#5851A4]">Loading management portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Header Banner */}
      <div className="bg-white border border-[#EAE4F7] rounded-2xl sm:rounded-3xl p-4 sm:p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#4B63D2]/10 border border-[#4B63D2]/20 text-[#4B63D2] text-xs font-black">
            <Building className="h-4 w-4" />
            <span>Management Connect • Institutional Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1E2746] tracking-tight">
            HOD & Management Bridge
          </h1>
          <p className="text-[#5851A4] text-xs sm:text-sm max-w-2xl font-medium leading-relaxed">
            Two-way structured communication channel for{" "}
            <strong className="text-[#1E2746]">{activeDept}</strong>. Submit institutional proposals, track approvals, receive official executive circulars, and dispatch department reports.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 shrink-0">
          <button
            onClick={() => handleTabChange("send_request")}
            className="px-4 py-2.5 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white rounded-xl font-bold text-xs shadow-md shadow-[#4B63D2]/20 flex items-center gap-2 hover:opacity-95 transition"
          >
            <PlusCircle className="h-4 w-4 text-[#FFD21A]" /> Submit New Request
          </button>
          <Link
            to="/messaging"
            className="px-4 py-2.5 bg-white border border-[#EAE4F7] text-[#1E2746] hover:bg-[#FAF9FD] rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition"
          >
            <MessageSquare className="h-4 w-4 text-[#4B63D2]" /> Direct Messenger
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#EAE4F7] overflow-x-auto pb-2 text-xs font-bold scrollbar-none">
        {[
          { id: "announcements", label: "Management Announcements", icon: Bell, badge: announcements.length },
          { id: "send_request", label: "Send Request", icon: Send },
          { id: "requests", label: "My Requests", icon: FileText, badge: requests.length },
          { id: "approvals", label: "Approvals & Decisions", icon: FileCheck2, badge: approvalsList.length },
          { id: "reports", label: "Reports Submitted", icon: BarChart3, badge: reports.length },
          { id: "messages", label: "Management Chat", icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
                isActive
                  ? "bg-[#4B63D2] text-white shadow-sm shadow-[#4B63D2]/30"
                  : "text-[#5851A4] hover:bg-[#FAF9FD] hover:text-[#1E2746]"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-[#FFD21A]" : ""}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-[#EAE4F7] text-[#5851A4]"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: MANAGEMENT ANNOUNCEMENTS ─────────────────────────────── */}
      {activeTab === "announcements" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-[#1E2746] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#4B63D2]" /> Official Institutional Circulars & Directives
            </h3>
            <span className="text-xs text-[#5851A4] font-medium">
              Issued by Principal Office, Dean & Governing Body
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-6 bg-white rounded-2xl border border-[#EAE4F7] shadow-sm hover:border-[#4B63D2]/30 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${
                        ann.priority === "Urgent"
                          ? "bg-rose-100 text-rose-800"
                          : ann.priority === "High"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {ann.priority} Notice
                    </span>
                    <span className="text-xs font-bold text-[#5851A4]">
                      {ann.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#5851A4] font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{ann.date}</span>
                    <span>•</span>
                    <span className="font-bold text-[#1E2746]">{ann.sender}</span>
                  </div>
                </div>

                <h4 className="text-base font-bold text-[#1E2746] leading-snug">
                  {ann.title}
                </h4>

                <p className="text-xs text-[#5851A4] leading-relaxed font-normal bg-[#FAF9FD] p-4 rounded-xl border border-[#EAE4F7]">
                  {ann.content}
                </p>

                {ann.attachment_url && (
                  <div className="pt-2 flex items-center justify-between border-t border-[#EAE4F7]">
                    <span className="text-[11px] font-bold text-[#5851A4] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#4B63D2]" /> Official Directive Document Attached
                    </span>
                    <a
                      href={ann.attachment_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#4B63D2]/10 hover:bg-[#4B63D2]/20 text-[#4B63D2] rounded-lg text-xs font-bold transition"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Circular
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 2: SEND STRUCTURED REQUEST ─────────────────────────────── */}
      {activeTab === "send_request" && (
        <div className="max-w-4xl mx-auto bg-white rounded-2xl sm:rounded-3xl border border-[#EAE4F7] p-4 sm:p-6 sm:p-8 shadow-sm space-y-4 sm:space-y-6">
          <div className="border-b border-[#EAE4F7] pb-4">
            <h3 className="text-lg font-black text-[#1E2746]">
              Submit Structured Department Request to Management
            </h3>
            <p className="text-xs text-[#5851A4] mt-1 font-medium">
              Formal proposal submission for budget approvals, workshops, guest lectures, infrastructure upgrades, or placement drives.
            </p>
          </div>

          {submitSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{submitSuccess}</span>
            </div>
          )}

          <form onSubmit={handleCreateRequest} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#1E2746] uppercase tracking-wider">
                  Request Category *
                </label>
                <select
                  value={reqCategory}
                  onChange={(e) => setReqCategory(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#EAE4F7] text-[#1E2746] text-xs font-bold rounded-xl p-3 focus:ring-2 focus:ring-[#4B63D2] outline-none"
                >
                  <option value="Workshop or seminar request">Workshop or Seminar Request</option>
                  <option value="Training program request">Training Program Request</option>
                  <option value="Industrial visit request">Industrial Visit Request</option>
                  <option value="Department event request">Department Event Request</option>
                  <option value="Placement drive request">Placement Drive Request</option>
                  <option value="Certification or student development program request">
                    Certification / Student Development Program
                  </option>
                  <option value="Infrastructure or resource requirement">
                    Infrastructure or Resource Requirement
                  </option>
                  <option value="Faculty requirement">Faculty Requirement</option>
                  <option value="Other department-specific institutional requirements">
                    Other Department-Specific Requirement
                  </option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#1E2746] uppercase tracking-wider">
                  Target Student Cohort
                </label>
                <input
                  type="text"
                  value={reqCohort}
                  onChange={(e) => setReqCohort(e.target.value)}
                  placeholder="e.g. 3rd & 4th Year CSE / All Department Batches"
                  className="w-full bg-[#FAF9FD] border border-[#EAE4F7] text-[#1E2746] text-xs rounded-xl p-3 focus:ring-2 focus:ring-[#4B63D2] outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-[#1E2746] uppercase tracking-wider">
                Proposal Title *
              </label>
              <input
                type="text"
                required
                value={reqTitle}
                onChange={(e) => setReqTitle(e.target.value)}
                placeholder="e.g. Procurement of High-End GPU Workstations for Deep Learning Laboratory"
                className="w-full bg-[#FAF9FD] border border-[#EAE4F7] text-[#1E2746] text-xs rounded-xl p-3 focus:ring-2 focus:ring-[#4B63D2] outline-none font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#1E2746] uppercase tracking-wider">
                  Estimated Budget / Funding Required
                </label>
                <input
                  type="text"
                  value={reqBudget}
                  onChange={(e) => setReqBudget(e.target.value)}
                  placeholder="e.g. ₹ 4,50,000 (Institutional Fund)"
                  className="w-full bg-[#FAF9FD] border border-[#EAE4F7] text-[#1E2746] text-xs rounded-xl p-3 focus:ring-2 focus:ring-[#4B63D2] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#1E2746] uppercase tracking-wider">
                  Expected Deliverables / Outcomes
                </label>
                <input
                  type="text"
                  value={reqOutcomes}
                  onChange={(e) => setReqOutcomes(e.target.value)}
                  placeholder="e.g. 90% students certified, 8 capstone research papers"
                  className="w-full bg-[#FAF9FD] border border-[#EAE4F7] text-[#1E2746] text-xs rounded-xl p-3 focus:ring-2 focus:ring-[#4B63D2] outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-[#1E2746] uppercase tracking-wider">
                Detailed Requirement & Justification *
              </label>
              <textarea
                required
                rows={5}
                value={reqDescription}
                onChange={(e) => setReqDescription(e.target.value)}
                placeholder="Provide complete justification, schedule, faculty coordinators, vendor quotes, and academic necessity for this proposal..."
                className="w-full bg-[#FAF9FD] border border-[#EAE4F7] text-[#1E2746] text-xs rounded-xl p-3 focus:ring-2 focus:ring-[#4B63D2] outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAE4F7]">
              <button
                type="button"
                onClick={() => handleTabChange("requests")}
                className="px-5 py-2.5 bg-white border border-[#EAE4F7] text-[#5851A4] font-bold text-xs rounded-xl hover:bg-[#FAF9FD] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#4B63D2] hover:bg-[#3E53BE] text-white font-black text-xs rounded-xl shadow-md shadow-[#4B63D2]/20 flex items-center gap-2 transition disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-[#FFD21A]" />
                {isSubmitting ? "Submitting to Management..." : "Submit Proposal"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 3: MY REQUESTS ─────────────────────────────────────────── */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-[#1E2746] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#4B63D2]" /> Department Requests & Status Tracker
              </h3>
              <p className="text-xs text-[#5851A4] font-medium">
                Review submitted requirements and official administrative status
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#5851A4] font-bold">Status:</span>
              <select
                value={requestStatusFilter}
                onChange={(e) => setRequestStatusFilter(e.target.value)}
                className="bg-white border border-[#EAE4F7] text-[#1E2746] text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-[#4B63D2] outline-none"
              >
                <option value="ALL">All Statuses ({requests.length})</option>
                <option value="Pending">Pending</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Changes Requested">Changes Requested</option>
                <option value="Rejected">Rejected</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredRequests.length > 0 ? (
              filteredRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white border border-[#EAE4F7] rounded-2xl p-6 shadow-sm space-y-4 hover:border-[#4B63D2]/30 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-[#4B63D2] bg-[#4B63D2]/10 px-2.5 py-0.5 rounded-lg">
                          {req.category}
                        </span>
                        <span className="text-xs text-[#5851A4]">
                          Submitted: {req.created_at}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-[#1E2746]">
                        {req.title}
                      </h4>
                    </div>
                    <div>{getStatusBadge(req.status)}</div>
                  </div>

                  <p className="text-xs text-[#5851A4] leading-relaxed bg-[#FAF9FD] p-4 rounded-xl border border-[#EAE4F7]">
                    {req.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-[#EAE4F7]">
                      <span className="text-[10px] uppercase font-black text-[#5851A4] block">
                        Estimated Budget
                      </span>
                      <span className="font-bold text-[#1E2746]">
                        {req.budget_estimate || "N/A"}
                      </span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-[#EAE4F7]">
                      <span className="text-[10px] uppercase font-black text-[#5851A4] block">
                        Target Cohort
                      </span>
                      <span className="font-bold text-[#1E2746]">
                        {req.target_cohort || "Department-Wide"}
                      </span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-[#EAE4F7]">
                      <span className="text-[10px] uppercase font-black text-[#5851A4] block">
                        Expected Outcome
                      </span>
                      <span className="font-bold text-[#1E2746]">
                        {req.expected_outcomes || "Enhanced Student Outcomes"}
                      </span>
                    </div>
                  </div>

                  {req.management_notes && (
                    <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        <span>Central Management Feedback & Directives:</span>
                      </div>
                      <p className="text-indigo-800 text-[11px] leading-relaxed">
                        {req.management_notes}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white border border-[#EAE4F7] rounded-3xl p-12 text-center text-[#5851A4] space-y-3">
                <Info className="w-8 h-8 text-[#4B63D2] mx-auto opacity-60" />
                <p className="text-sm font-bold text-[#1E2746]">No requests found under this filter</p>
                <button
                  onClick={() => handleTabChange("send_request")}
                  className="text-xs font-bold text-[#4B63D2] underline"
                >
                  Submit a new request now
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: APPROVALS & DECISIONS ───────────────────────────────── */}
      {activeTab === "approvals" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-black text-[#1E2746] flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#4B63D2]" /> Official Approvals & Decisions Log
            </h3>
            <p className="text-xs text-[#5851A4] font-medium">
              Institutional sanctions, approved budgets, and action items for {activeDept}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvalsList.map((req) => (
              <div
                key={req.id}
                className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-[#4B63D2] bg-[#4B63D2]/10 px-2.5 py-0.5 rounded-md">
                    {req.category}
                  </span>
                  {getStatusBadge(req.status)}
                </div>

                <h4 className="text-sm font-bold text-[#1E2746]">{req.title}</h4>
                <p className="text-xs text-[#5851A4] line-clamp-2">{req.description}</p>

                <div className="p-3 bg-[#FAF9FD] rounded-xl border border-[#EAE4F7] text-xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-[#5851A4] block">
                    Management Sanction Remarks:
                  </span>
                  <p className="text-[#1E2746] font-medium">
                    {req.management_notes || "Formal sanction memo issued to department registrar."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 5: REPORTS SUBMITTED ────────────────────────────────────── */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-[#1E2746] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#4B63D2]" /> Reports Dispatched to Management
              </h3>
              <p className="text-xs text-[#5851A4] font-medium">
                Official accreditation, placement, and academic standing reports
              </p>
            </div>
            <Link
              to="/reports"
              className="px-4 py-2 bg-[#4B63D2] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              <span>Reports Suite</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF9FD] border-b border-[#EAE4F7] text-[11px] font-black uppercase tracking-wider text-[#5851A4]">
                    <th className="py-3.5 px-4">Report Title</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Period</th>
                    <th className="py-3.5 px-4">Submitted On</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE4F7] text-xs">
                  {reports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-[#FAF9FD] transition">
                      <td className="py-3.5 px-4 font-bold text-[#1E2746]">
                        {rep.title}
                      </td>
                      <td className="py-3.5 px-4 text-[#5851A4] font-medium">
                        {rep.report_type}
                      </td>
                      <td className="py-3.5 px-4 text-[#1E2746]">
                        {rep.period}
                      </td>
                      <td className="py-3.5 px-4 text-[#5851A4]">
                        {rep.submitted_at || "Draft"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            rep.status === "Completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : rep.status === "Under Review"
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {rep.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to="/reports"
                          className="inline-flex items-center gap-1 text-[#4B63D2] font-bold hover:underline"
                        >
                          View <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: MESSAGES & DIRECT CONNECT ────────────────────────────── */}
      {activeTab === "messages" && (
        <div className="bg-white border border-[#EAE4F7] rounded-3xl p-8 text-center max-w-2xl mx-auto space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-[#4B63D2]/10 rounded-full flex items-center justify-center mx-auto text-[#4B63D2]">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-[#1E2746]">
            Real-Time Direct Executive Messaging
          </h3>
          <p className="text-xs text-[#5851A4] leading-relaxed max-w-md mx-auto font-medium">
            Communicate in real-time with the Principal, Vice Principal, Dean of Academics, and Central Administrative Officers through the secure institutional messaging gateway.
          </p>
          <div className="pt-2">
            <Link
              to="/messaging"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#4B63D2] hover:bg-[#3E53BE] text-white rounded-xl text-xs font-black shadow-md shadow-[#4B63D2]/20 transition"
            >
              <Send className="w-4 h-4 text-[#FFD21A]" />
              Launch Executive Messenger
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
