import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Calendar,
  Building,
  Users,
  Briefcase,
  Bell,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Clock,
} from "lucide-react";
import { apiRequest } from "../services/api";

interface ControllerStats {
  totalEvents: number;
  totalClubs: number;
  activeStudents: number;
  pendingApprovals: number;
}

export default function Controller() {
  const [activeTab, setActiveTab] = useState<
    "events" | "clubs" | "notices" | "placements" | "analytics"
  >("events");

  const [currentUser, setCurrentUser] = useState<{
    id: number;
    email: string;
    department?: string;
    role?: { name: string };
  } | null>(null);

  const [stats, setStats] = useState<ControllerStats>({
    totalEvents: 14,
    totalClubs: 8,
    activeStudents: 340,
    pendingApprovals: 3,
  });

  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeBody, setNoticeBody] = useState("");
  const [noticeDept, setNoticeDept] = useState("Computer Science");
  const [noticeSuccess, setNoticeSuccess] = useState<string | null>(null);

  // Department Events State
  const [events, setEvents] = useState([
    {
      id: 1,
      title: "Department Tech Symposium 2026",
      category: "Technical",
      date: "Oct 25, 2026",
      status: "APPROVED",
      organizer: "GDSC & CSE Club",
    },
    {
      id: 2,
      title: "Inter-Branch Garba & Cultural Gala",
      category: "Cultural",
      date: "Oct 10, 2026",
      status: "APPROVED",
      organizer: "Cultural Committee",
    },
    {
      id: 3,
      title: "AI & ML Paper Presentation Workshop",
      category: "Academic",
      date: "Nov 02, 2026",
      status: "PENDING_APPROVAL",
      organizer: "AIRS Society",
    },
  ]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await apiRequest<any>("/users/me");
        setCurrentUser(data);
        if (data.department) {
          setNoticeDept(data.department);
        }
      } catch (err) {
        // Fallback
      }
    };
    fetchUser();
  }, []);

  const handleApproveEvent = (id: number) => {
    setEvents((prev) =>
      prev.map((evt) =>
        evt.id === id ? { ...evt, status: "APPROVED" } : evt
      )
    );
    setStats((s) => ({
      ...s,
      pendingApprovals: Math.max(0, s.pendingApprovals - 1),
    }));
  };

  const handleSendNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeBody.trim()) return;

    setNoticeSuccess(`Notice "${noticeTitle}" broadcasted to ${noticeDept} department!`);
    setTimeout(() => {
      setNoticeTitle("");
      setNoticeBody("");
      setNoticeSuccess(null);
    }, 2500);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1E2746] via-[#2A365D] to-[#4B63D2] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-[#4B63D2]/10">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20">
                <ShieldCheck className="w-6 h-6 text-[#FFD21A]" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full backdrop-blur-md border border-white/30">
                Department Controller Console
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Controller Management Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 font-medium max-w-2xl leading-relaxed">
              Authorized portal for Department Controllers to oversee departmental events,
              approve student clubs, publish official announcements, and monitor placement drives.
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-xs font-bold text-white/80">Controller Account:</span>
            <span className="text-xs font-black px-3.5 py-1.5 rounded-xl bg-white text-[#1E2746] shadow-sm">
              {currentUser?.email || "Controller"}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#EAE4F7] rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[#4B63D2]">
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50">
              Department
            </span>
          </div>
          <p className="text-2xl font-black text-[#1E2746]">{stats.totalEvents}</p>
          <p className="text-xs font-bold text-[#5851A4]">Department Events</p>
        </div>

        <div className="bg-white border border-[#EAE4F7] rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-purple-600">
            <Building className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50">
              Clubs
            </span>
          </div>
          <p className="text-2xl font-black text-[#1E2746]">{stats.totalClubs}</p>
          <p className="text-xs font-bold text-[#5851A4]">Supervised Clubs</p>
        </div>

        <div className="bg-white border border-[#EAE4F7] rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-600">
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50">
              Active
            </span>
          </div>
          <p className="text-2xl font-black text-[#1E2746]">{stats.activeStudents}</p>
          <p className="text-xs font-bold text-[#5851A4]">Enrolled Students</p>
        </div>

        <div className="bg-white border border-[#EAE4F7] rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-amber-600">
            <Clock className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50">
              Action Req.
            </span>
          </div>
          <p className="text-2xl font-black text-[#1E2746]">{stats.pendingApprovals}</p>
          <p className="text-xs font-bold text-[#5851A4]">Pending Approvals</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#EAE4F7]">
        {[
          { key: "events", label: "Event Approvals & Scheduling", icon: Calendar },
          { key: "notices", label: "Department Broadcast Notices", icon: Bell },
          { key: "clubs", label: "Club Oversight", icon: Building },
          { key: "placements", label: "Placement Drives & Opportunities", icon: Briefcase },
          { key: "analytics", label: "Department Performance Analytics", icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/20"
                  : "bg-white text-[#5851A4] border border-[#EAE4F7] hover:border-[#C8B6E2] hover:text-[#1E2746]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: EVENT APPROVALS */}
      {activeTab === "events" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-[#1E2746]">Department Event Submissions</h3>
            <span className="text-xs font-bold text-[#5851A4] bg-white border border-[#EAE4F7] px-3 py-1 rounded-xl">
              Controller Role Access Enabled
            </span>
          </div>

          <div className="bg-white border border-[#EAE4F7] rounded-3xl overflow-hidden shadow-sm divide-y divide-[#EAE4F7]">
            {events.map((evt) => (
              <div key={evt.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF9FD] transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#4B63D2]/10 text-[#4B63D2] border border-[#4B63D2]/20">
                      {evt.category}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      evt.status === "APPROVED"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      {evt.status}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-[#1E2746]">{evt.title}</h4>
                  <p className="text-xs text-[#5851A4] font-medium">
                    Organizer: <strong>{evt.organizer}</strong> • Proposed Date: <strong>{evt.date}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {evt.status === "PENDING_APPROVAL" ? (
                    <button
                      onClick={() => handleApproveEvent(evt.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve & Publish
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Approved
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: BROADCAST NOTICES */}
      {activeTab === "notices" && (
        <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 space-y-4 shadow-sm max-w-3xl">
          <div className="flex items-center gap-2 border-b border-[#EAE4F7] pb-3">
            <Bell className="w-5 h-5 text-[#4B63D2]" />
            <h3 className="text-lg font-black text-[#1E2746]">Broadcast Department Notice</h3>
          </div>

          {noticeSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{noticeSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSendNotice} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1E2746] mb-1">
                Target Academic Department
              </label>
              <input
                type="text"
                value={noticeDept}
                onChange={(e) => setNoticeDept(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-bold text-[#1E2746] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E2746] mb-1">
                Notice Header / Subject <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Mandatory Attendance Notice for Mid-Semester Exam Review"
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E2746] mb-1">
                Notice Content <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Write official departmental announcement details..."
                value={noticeBody}
                onChange={(e) => setNoticeBody(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-[#4B63D2] hover:bg-[#3E53BE] text-white text-xs font-bold transition-all shadow-md shadow-[#4B63D2]/25 cursor-pointer flex items-center gap-2"
            >
              <Bell className="w-4 h-4" /> Send Department Broadcast
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: CLUBS OVERSIGHT */}
      {activeTab === "clubs" && (
        <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#EAE4F7] pb-3">
            <h3 className="text-lg font-black text-[#1E2746]">Supervised Department Clubs</h3>
            <span className="text-xs font-bold text-[#4B63D2] bg-[#4B63D2]/10 px-3 py-1 rounded-full">
              8 Official Clubs Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["GDSC & Coding Club", "AI & Robotics Society", "Dhwani Music Club", "Sports League"].map((cName, idx) => (
              <div key={idx} className="p-4 bg-[#FAF9FD] border border-[#EAE4F7] rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#1E2746]">{cName}</h4>
                  <p className="text-xs text-[#5851A4]">120+ Student Members</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PLACEMENTS */}
      {activeTab === "placements" && (
        <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#EAE4F7] pb-3">
            <h3 className="text-lg font-black text-[#1E2746]">Department Placement Drives</h3>
            <a
              href="/jobs"
              className="text-xs font-bold text-[#4B63D2] hover:underline flex items-center gap-1"
            >
              <span>View Job Board</span> <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <p className="text-xs text-[#5851A4] font-medium">
            Oversight of active recruitment drives for students in your department.
          </p>
        </div>
      )}

      {/* TAB 5: ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-lg font-black text-[#1E2746]">Department Performance Metrics</h3>
          <p className="text-xs text-[#5851A4] font-medium">
            Real-time analytics for student engagement, event attendance, and tie connections across your department.
          </p>
        </div>
      )}
    </div>
  );
}
