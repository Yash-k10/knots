import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  Compass,
  ShieldCheck,
  AlertCircle,
  Loader2,
  LogOut,
  Crown,
  GraduationCap,
  UserCheck,
  ChevronRight,
  Filter,
  CheckCircle2,
  MessageSquare,
  ExternalLink,
  BookOpen,
  FileText,
  Video,
  Share2,
} from "lucide-react";
import { apiRequest, getMediaUrl } from "../services/api";

// ── TypeScript Interfaces ───────────────────────────────────────────────────

export interface ClubMemberUser {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  profile_picture?: string | null;
  department?: string | null;
  graduation_year?: number | null;
  user_role?: string | null;
}

export interface ClubMemberResponse {
  id: number;
  club_id: number;
  user_id: number;
  role: "MEMBER" | "OFFICER" | "LEADER";
  user?: ClubMemberUser | null;
}

export interface ClubResponse {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  creator_id: number;
}

export interface ClubDetailResponse {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  creator_id: number;
  members_count: number;
  user_role?: "MEMBER" | "OFFICER" | "LEADER" | null;
  members: ClubMemberResponse[];
}

export interface ExtractedResource {
  type: "classroom" | "drive" | "github" | "meet" | "notion" | "generic";
  label: string;
  url: string;
}

export function extractResourceLinks(text?: string | null): ExtractedResource[] {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex) || [];
  const resources: ExtractedResource[] = [];
  const seen = new Set<string>();

  matches.forEach((rawUrl) => {
    const cleanUrl = rawUrl.replace(/[),.;]+$/, "");
    if (seen.has(cleanUrl)) return;
    seen.add(cleanUrl);

    const lower = cleanUrl.toLowerCase();
    if (lower.includes("classroom.google.com")) {
      resources.push({ type: "classroom", label: "Google Classroom", url: cleanUrl });
    } else if (lower.includes("drive.google.com") || lower.includes("docs.google.com")) {
      resources.push({ type: "drive", label: "Shared Drive / Notes", url: cleanUrl });
    } else if (lower.includes("github.com")) {
      resources.push({ type: "github", label: "GitHub Repository", url: cleanUrl });
    } else if (
      lower.includes("meet.google.com") ||
      lower.includes("zoom.us") ||
      lower.includes("teams.microsoft.com")
    ) {
      resources.push({ type: "meet", label: "Live Meetup / AMA Room", url: cleanUrl });
    } else if (lower.includes("notion.so") || lower.includes("notion.site")) {
      resources.push({ type: "notion", label: "Notion Roadmap", url: cleanUrl });
    } else {
      resources.push({ type: "generic", label: "Resource Link", url: cleanUrl });
    }
  });

  return resources;
}

export default function Clubs() {
  // ── States ─────────────────────────────────────────────────────────────────
  const [clubs, setClubs] = useState<ClubResponse[]>([]);
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    email: string;
    role?: { name: string };
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState("ALL");

  // Detailed view of selected club
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [clubDetail, setClubDetail] = useState<ClubDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Academic");
  const [description, setDescription] = useState("");

  // ── Initial Fetching ───────────────────────────────────────────────────────

  const fetchClubsAndUser = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch current user
      const userRes = await apiRequest<{
        id: number;
        email: string;
        role?: { name: string };
      }>("/users/me");
      setCurrentUser(userRes);

      // Fetch all clubs
      const clubsRes = await apiRequest<ClubResponse[]>(
        "/clubs?skip=0&limit=100",
      );
      setClubs(clubsRes);

      // If clubs exist, select the first one by default on desktop
      if (clubsRes.length > 0 && selectedClubId === null) {
        setSelectedClubId(clubsRes[0].id);
      }
    } catch (err: any) {
      setError(
        err.message || "Failed to retrieve clubs and profile information.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubsAndUser();
  }, []);

  const refreshClubs = async () => {
    try {
      const clubsRes = await apiRequest<ClubResponse[]>(
        "/clubs?skip=0&limit=100",
      );
      setClubs(clubsRes);
    } catch (err) {
      console.error("Failed to refresh clubs list:", err);
    }
  };

  // ── Club Detail Panel Loading ──────────────────────────────────────────────

  const loadClubDetail = async (clubId: number) => {
    setDetailLoading(true);
    try {
      const res = await apiRequest<ClubDetailResponse>(`/clubs/${clubId}`);
      setClubDetail(res);
    } catch (err: any) {
      console.error("Failed to retrieve club details:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClubId !== null) {
      loadClubDetail(selectedClubId);
    } else {
      setClubDetail(null);
    }
  }, [selectedClubId]);

  // ── Form Modal Setup (Create / Edit) ──────────────────────────────────────

  const openCreateModal = () => {
    setIsEditing(false);
    setName("");
    setCategory("Alumni Chapter");
    setDescription("");
    setShowFormModal(true);
  };

  const openEditModal = () => {
    if (!clubDetail) return;
    setIsEditing(true);
    setName(clubDetail.name);
    setCategory(clubDetail.category || "Alumni Chapter");
    setDescription(clubDetail.description || "");
    setShowFormModal(true);
  };

  // ── Submit / Delete Actions ────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Club / Chapter Name is required.");
      return;
    }

    setSubmittingForm(true);
    const payload = {
      name: name.trim(),
      category: category.trim() || null,
      description: description.trim() || null,
    };

    try {
      if (isEditing && clubDetail) {
        await apiRequest<ClubResponse>(`/clubs/${clubDetail.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setShowFormModal(false);
        loadClubDetail(clubDetail.id);
        refreshClubs();
      } else {
        const newClub = await apiRequest<ClubResponse>("/clubs", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setShowFormModal(false);
        setSelectedClubId(newClub.id);
        refreshClubs();
      }
    } catch (err: any) {
      alert(err.message || "Failed to save club details.");
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleDeleteClub = async () => {
    if (!clubDetail) return;
    if (
      !window.confirm(
        `Are you sure you want to delete "${clubDetail.name}"? This action deletes the club and its member roster permanently.`,
      )
    ) {
      return;
    }

    try {
      await apiRequest(`/clubs/${clubDetail.id}`, { method: "DELETE" });
      setSelectedClubId(null);
      setClubs((prev) => prev.filter((c) => c.id !== clubDetail.id));
      refreshClubs();
    } catch (err: any) {
      alert(err.message || "Failed to delete club.");
    }
  };

  // ── Member Operations (Join / Leave / Promote) ──────────────────────────────

  const handleJoinClub = async () => {
    if (!clubDetail) return;
    try {
      await apiRequest(`/clubs/${clubDetail.id}/join`, { method: "POST" });
      loadClubDetail(clubDetail.id);
      refreshClubs();
    } catch (err: any) {
      alert(err.message || "Failed to join the club.");
    }
  };

  const handleLeaveClub = async () => {
    if (!clubDetail) return;
    if (!window.confirm("Are you sure you want to leave this club?")) {
      return;
    }

    try {
      await apiRequest(`/clubs/${clubDetail.id}/leave`, { method: "POST" });
      loadClubDetail(clubDetail.id);
      refreshClubs();
    } catch (err: any) {
      alert(err.message || "Failed to leave the club.");
    }
  };

  const handleUpdateMemberRole = async (
    targetUserId: number,
    newRole: "MEMBER" | "OFFICER" | "LEADER",
  ) => {
    if (!clubDetail) return;
    try {
      await apiRequest(`/clubs/${clubDetail.id}/members/${targetUserId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole }),
      });
      loadClubDetail(clubDetail.id);
    } catch (err: any) {
      alert(err.message || "Failed to update member role.");
    }
  };

  // ── Categories & Filtering ─────────────────────────────────────────────────

  const categoriesList = [
    "Alumni Chapter",
    "Technical",
    "Academic",
    "Cultural",
    "Sports",
    "Social",
    "Other",
  ];

  const filteredClubs = useMemo(() => {
    return clubs.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description &&
          c.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === "ALL" ||
        c.category?.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [clubs, searchQuery, selectedCategory]);

  // Group Leaders, Officers, and Members for the active club
  const clubLeaders = useMemo(() => {
    if (!clubDetail?.members) return [];
    return clubDetail.members.filter((m) => m.role === "LEADER");
  }, [clubDetail]);

  const clubOfficers = useMemo(() => {
    if (!clubDetail?.members) return [];
    return clubDetail.members.filter((m) => m.role === "OFFICER");
  }, [clubDetail]);

  const filteredClubMembers = useMemo(() => {
    if (!clubDetail?.members) return [];
    return clubDetail.members.filter((m) => {
      const u = m.user;
      const fullName = `${u?.first_name || ""} ${u?.last_name || ""}`.trim();
      const searchTarget = `${fullName} ${u?.email || ""} ${u?.department || ""} ${m.role}`.toLowerCase();
      const matchesSearch = searchTarget.includes(memberSearchQuery.toLowerCase());

      const matchesRole =
        memberRoleFilter === "ALL" || m.role === memberRoleFilter;

      return matchesSearch && matchesRole;
    });
  }, [clubDetail, memberSearchQuery, memberRoleFilter]);

  // Styling helper for category tag labels
  const getCategoryBadgeStyle = (catName?: string | null) => {
    const name = catName?.toUpperCase() || "OTHER";
    switch (name) {
      case "ALUMNI CHAPTER":
      case "ALUMNI MENTORSHIP CHAPTER":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "TECHNICAL":
      case "TECHNICAL & CODING CLUB":
        return "bg-[#FAF9FD] text-[#4B63D2] border-[#D5CBEE]";
      case "ACADEMIC":
      case "ACADEMIC SOCIETY":
        return "bg-sky-50 text-sky-800 border-sky-200";
      case "CAREER & PLACEMENT CELL":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "SPORTS":
        return "bg-orange-50 text-orange-800 border-orange-200";
      case "CULTURAL":
      case "SOCIAL":
        return "bg-pink-50 text-pink-800 border-pink-200";
      default:
        return "bg-[#FAF9FD] text-[#5851A4] border-[#EAE4F7]";
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "LEADER":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "OFFICER":
        return "bg-[#4B63D2]/10 text-[#4B63D2] border-[#4B63D2]/20";
      default:
        return "bg-[#FAF9FD] text-[#5851A4] border-[#EAE4F7]";
    }
  };

  // ── Render Loading ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-[#EAE4F7] border-t-[#4B63D2] animate-spin" />
          <Compass className="w-6 h-6 text-[#4B63D2] absolute inset-0 m-auto" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-[#1E2746]">Loading Clubs & Alumni Chapters...</p>
          <p className="text-xs text-[#5851A4] mt-0.5">Connecting with campus network and leadership rosters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── 1. Hero Banner with Executive Stats ────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1E2746] via-[#2A3558] to-[#182038] text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800/80">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#4B63D2]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-[#FFD21A]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-amber-300">
              <Crown className="w-3.5 h-3.5 text-[#FFD21A]" />
              <span>Campus Communities &amp; Alumni Mentorship Guilds</span>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              Clubs, Chapters &amp; Mentorship Hub
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-normal">
              Alumni mentorship chapters, technical guilds, and student committees. Create or join chapters to share Google Classroom notes, career roadmaps, and connect 1-on-1 with mentors.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={openCreateModal}
              className="bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white font-bold px-5 py-3 rounded-2xl text-xs md:text-sm shadow-lg shadow-[#4B63D2]/30 transition-all duration-200 flex items-center gap-2 cursor-pointer border border-white/15"
            >
              <Plus className="w-4 h-4 text-[#FFD21A]" />
              <span>+ Create Club or Chapter</span>
            </button>
          </div>
        </div>

        {/* Quick KPI stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mt-8 pt-6 border-t border-white/10 relative z-10">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3.5">
            <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Total Communities</div>
            <div className="text-xl md:text-2xl font-black text-white mt-1">{clubs.length}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3.5">
            <div className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">Alumni Chapters</div>
            <div className="text-xl md:text-2xl font-black text-amber-400 mt-1">
              {clubs.filter((c) => c.category?.toLowerCase().includes("alumni")).length}
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3.5">
            <div className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">Enrolled Mentees</div>
            <div className="text-xl md:text-2xl font-black text-emerald-400 mt-1">
              {clubDetail ? clubDetail.members_count : "—"}
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3.5">
            <div className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">Your Chapter Role</div>
            <div className="text-sm font-bold text-indigo-300 mt-1 truncate">
              {clubDetail?.user_role ? `${clubDetail.user_role}` : "Discovering"}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Filter Bar & Category Chips ─────────────────────────────────── */}
      <div className="bg-white border border-[#EAE4F7] rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5851A4]" />
            <input
              type="text"
              placeholder="Search chapters by name, mission, category, or mentor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] placeholder-[#9188BE] focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5851A4] hover:text-[#1E2746] text-[10px] font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Results count */}
          <div className="text-xs text-[#5851A4] font-medium px-2 flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-[#4B63D2]" />
            <span>Showing <strong>{filteredClubs.length}</strong> communities</span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === "ALL"
                ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/20"
                : "bg-[#FAF9FD] hover:bg-white text-[#5851A4] border border-[#EAE4F7]"
            }`}
          >
            All Communities
          </button>
          {categoriesList.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/20"
                    : "bg-[#FAF9FD] hover:bg-white text-[#5851A4] border border-[#EAE4F7]"
                }`}
              >
                {cat.toLowerCase().includes("alumni") && <Crown className="w-3 h-3 text-[#FFD21A]" />}
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Main Content: Split Grid Layout ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Clubs List Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5 max-h-[820px] overflow-y-auto pr-1">
          {error ? (
            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
              <h3 className="text-rose-900 font-bold text-sm">Error Loading Clubs</h3>
              <p className="text-rose-700 text-xs">{error}</p>
              <button
                onClick={() => fetchClubsAndUser()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : filteredClubs.length === 0 ? (
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-10 text-center text-[#5851A4] shadow-sm space-y-3">
              <div className="w-12 h-12 bg-[#FAF9FD] text-[#4B63D2] rounded-2xl flex items-center justify-center mx-auto border border-[#EAE4F7]">
                <Compass className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm text-[#1E2746]">No matching chapters found</p>
              <p className="text-xs text-[#5851A4]">
                Register a new alumni chapter or campus club to start building a mentorship community.
              </p>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4B63D2] hover:bg-[#3E53BE] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create One Now</span>
              </button>
            </div>
          ) : (
            filteredClubs.map((club) => {
              const isSelected = selectedClubId === club.id;
              const isAlumniChapter = club.category?.toLowerCase().includes("alumni");

              return (
                <div
                  key={club.id}
                  onClick={() => setSelectedClubId(club.id)}
                  className={`cursor-pointer bg-white border rounded-3xl p-5 transition-all duration-200 flex flex-col justify-between relative group ${
                    isSelected
                      ? "border-[#4B63D2] ring-2 ring-[#4B63D2]/20 shadow-md bg-gradient-to-r from-white to-[#FAF9FD]"
                      : "border-[#EAE4F7] hover:border-[#4B63D2]/50 hover:shadow-sm"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${getCategoryBadgeStyle(
                          club.category,
                        )}`}
                      >
                        {club.category || "General"}
                      </span>

                      {isAlumniChapter && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <Crown className="w-3 h-3 text-[#FFD21A]" />
                          Alumni Led
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-black text-[#1E2746] group-hover:text-[#4B63D2] transition-colors">
                      {club.name}
                    </h3>
                    <p className="text-[#5851A4] text-xs line-clamp-2 mt-1.5 leading-relaxed font-normal">
                      {club.description || "No mission description provided yet."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3.5 mt-3.5 border-t border-[#EAE4F7] text-xs font-bold text-[#4B63D2]">
                    <span className="text-[11px] text-[#9188BE] font-medium flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      View leadership &amp; mentees
                    </span>
                    <div className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span className="text-[11px]">Explore</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Club Leadership & Member Roster (7 cols) */}
        <div className="lg:col-span-7">
          {selectedClubId === null ? (
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-12 text-center text-[#5851A4] shadow-sm space-y-3">
              <Compass className="w-12 h-12 text-[#C8B6E2] mx-auto" />
              <h3 className="text-base font-bold text-[#1E2746]">Select a Club or Chapter</h3>
              <p className="text-xs text-[#5851A4] max-w-sm mx-auto">
                Choose any chapter from the list to view its leadership, Google Classroom notes, and connect with students and mentors.
              </p>
            </div>
          ) : detailLoading || !clubDetail ? (
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-16 flex flex-col items-center justify-center space-y-3 text-[#5851A4] shadow-sm">
              <Loader2 className="w-8 h-8 animate-spin text-[#4B63D2]" />
              <p className="text-xs font-bold text-[#1E2746]">Loading chapter details &amp; leadership roster...</p>
            </div>
          ) : (
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm space-y-6">
              {/* Header Details of the selected club */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${getCategoryBadgeStyle(
                        clubDetail.category,
                      )}`}
                    >
                      {clubDetail.category || "General"}
                    </span>
                    {clubDetail.user_role && (
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        You are {clubDetail.user_role}
                      </span>
                    )}
                  </div>

                  {/* Actions for current user (Join / Leave / Edit / Delete) */}
                  <div className="flex items-center gap-2">
                    {!clubDetail.user_role ? (
                      <button
                        onClick={handleJoinClub}
                        className="bg-[#4B63D2] hover:bg-[#3E53BE] text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Join Chapter &amp; Connect
                      </button>
                    ) : (
                      <button
                        onClick={handleLeaveClub}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Leave
                      </button>
                    )}

                    {/* Leader / Admin Controls */}
                    {clubDetail.user_role === "LEADER" && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={openEditModal}
                          className="bg-[#FAF9FD] hover:bg-[#F0EDF9] border border-[#EAE4F7] text-[#5851A4] p-2 rounded-xl transition-colors cursor-pointer"
                          title="Edit Chapter Settings"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={handleDeleteClub}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 p-2 rounded-xl transition-colors cursor-pointer"
                          title="Delete Chapter"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-xl md:text-2xl font-black text-[#1E2746]">{clubDetail.name}</h2>
                  <p className="text-[#5851A4] text-xs md:text-sm mt-2 leading-relaxed">
                    {clubDetail.description || "No detailed mission description available for this community."}
                  </p>

                  {/* 📚 Mentorship & Resource Vault (Google Classroom / Drive / GitHub / Meet) */}
                  {(() => {
                    const resources = extractResourceLinks(clubDetail.description);
                    if (resources.length === 0) return null;

                    return (
                      <div className="mt-4 p-4 bg-gradient-to-br from-[#FAF9FD] to-indigo-50/50 border border-[#D5CBEE] rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-[#4B63D2]" />
                            <h4 className="text-xs font-black text-[#1E2746] uppercase tracking-wider">
                              Mentorship Notes &amp; Classroom Links
                            </h4>
                          </div>
                          <span className="text-[10px] font-bold text-[#4B63D2] bg-white px-2.5 py-0.5 rounded-full border border-[#D5CBEE]">
                            {resources.length} Links Attached
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {resources.map((res, idx) => (
                            <a
                              key={idx}
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-3 bg-white hover:bg-[#4B63D2] group border border-[#EAE4F7] hover:border-[#4B63D2] rounded-xl transition-all shadow-xs cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5 overflow-hidden">
                                <div className="w-8 h-8 rounded-lg bg-[#FAF9FD] group-hover:bg-white/20 text-[#4B63D2] group-hover:text-white flex items-center justify-center shrink-0 transition-colors border border-[#EAE4F7] group-hover:border-transparent">
                                  {res.type === "classroom" && <GraduationCap className="w-4 h-4" />}
                                  {res.type === "drive" && <FileText className="w-4 h-4" />}
                                  {res.type === "github" && <Share2 className="w-4 h-4" />}
                                  {res.type === "meet" && <Video className="w-4 h-4" />}
                                  {res.type !== "classroom" &&
                                    res.type !== "drive" &&
                                    res.type !== "github" &&
                                    res.type !== "meet" && <ExternalLink className="w-4 h-4" />}
                                </div>
                                <div className="truncate">
                                  <p className="text-xs font-bold text-[#1E2746] group-hover:text-white transition-colors truncate">
                                    {res.label}
                                  </p>
                                  <p className="text-[10px] text-[#9188BE] group-hover:text-indigo-100 transition-colors truncate">
                                    {res.url}
                                  </p>
                                </div>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-[#9188BE] group-hover:text-white shrink-0 ml-2 transition-colors" />
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* ── Spotlight Section: 👑 Club Leadership & Alumni Heads ── */}
              <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/40 rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center">
                      <Crown className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-xs md:text-sm font-black text-amber-950">
                        Chapter Mentors &amp; Alumni Heads
                      </h4>
                      <p className="text-[11px] text-amber-800/80">
                        Primary leaders, mentors, and student officers guiding this community
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-amber-900 bg-white/80 px-2.5 py-0.5 rounded-full border border-amber-300">
                    {clubLeaders.length + clubOfficers.length} Leaders
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[...clubLeaders, ...clubOfficers].map((head) => {
                    const u = head.user;
                    const fullName =
                      `${u?.first_name || ""} ${u?.last_name || ""}`.trim() ||
                      (u?.email ? u.email.split("@")[0] : `User #${head.user_id}`);
                    const avatar = u?.profile_picture ? getMediaUrl(u.profile_picture) : null;
                    const isAlumni =
                      u?.user_role?.toLowerCase() === "alumni" ||
                      clubDetail.category?.toLowerCase().includes("alumni");

                    return (
                      <div
                        key={head.id}
                        className="bg-white/95 backdrop-blur-sm border border-amber-200/80 rounded-2xl p-3.5 shadow-sm flex items-start gap-3 relative group"
                      >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          {avatar ? (
                            <img
                              src={avatar}
                              alt={fullName}
                              className="w-11 h-11 rounded-full object-cover border-2 border-amber-400/50"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#4B63D2] to-[#5851A4] text-white font-black flex items-center justify-center text-sm shadow-sm">
                              {fullName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div
                            className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                              head.role === "LEADER"
                                ? "bg-amber-500 text-white"
                                : "bg-[#4B63D2] text-white"
                            }`}
                            title={head.role}
                          >
                            {head.role === "LEADER" ? (
                              <Crown className="w-2.5 h-2.5" />
                            ) : (
                              <ShieldCheck className="w-2.5 h-2.5" />
                            )}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <Link
                              to={`/profile/${head.user_id}`}
                              className="text-xs font-black text-[#1E2746] hover:text-[#4B63D2] truncate block transition-colors"
                            >
                              {fullName}
                            </Link>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border ${getRoleBadgeStyle(
                                head.role,
                              )}`}
                            >
                              {head.role === "LEADER" ? "Chapter Head" : "Officer"}
                            </span>

                            {isAlumni && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-0.5">
                                <GraduationCap className="w-2.5 h-2.5" />
                                Alumni
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] text-[#5851A4] mt-1 truncate">
                            {u?.department ? `${u.department}` : u?.email}
                            {u?.graduation_year ? ` • Class of '${String(u.graduation_year).slice(-2)}` : ""}
                          </div>
                        </div>

                        {/* Direct Chat / Message */}
                        <Link
                          to="/messaging"
                          state={{ recipientId: head.user_id, recipientName: fullName }}
                          className="text-[#5851A4] hover:text-[#4B63D2] hover:bg-[#FAF9FD] p-1.5 rounded-xl transition-colors shrink-0 border border-transparent hover:border-[#EAE4F7]"
                          title={`Message ${fullName}`}
                        >
                          <MessageSquare className="w-4 h-4 text-[#4B63D2]" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── 👥 Active Member & Mentee Roster Directory ── */}
              <div className="space-y-4 pt-2 border-t border-[#EAE4F7]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-black text-[#1E2746] flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#4B63D2]" />
                      Connected Mentees &amp; Student Members
                    </h4>
                    <p className="text-xs text-[#5851A4]">
                      Total <strong>{clubDetail.members_count}</strong> enrolled community members
                    </p>
                  </div>

                  {/* Search and Filter inside member roster */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#5851A4]" />
                      <input
                        type="text"
                        placeholder="Filter members..."
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        className="pl-7 pr-3 py-1.5 bg-[#FAF9FD] border border-[#D5CBEE] rounded-xl text-[11px] text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] w-36 sm:w-44"
                      />
                    </div>

                    <select
                      value={memberRoleFilter}
                      onChange={(e) => setMemberRoleFilter(e.target.value)}
                      className="bg-[#FAF9FD] border border-[#D5CBEE] text-[#1E2746] text-[11px] font-bold rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">All Roles</option>
                      <option value="LEADER">Leaders</option>
                      <option value="OFFICER">Officers</option>
                      <option value="MEMBER">Members</option>
                    </select>
                  </div>
                </div>

                {/* Member Roster List */}
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {filteredClubMembers.length === 0 ? (
                    <div className="p-8 text-center bg-[#FAF9FD] rounded-2xl border border-[#EAE4F7] text-[#5851A4] text-xs">
                      No members match your search criteria.
                    </div>
                  ) : (
                    filteredClubMembers.map((member) => {
                      const u = member.user;
                      const fullName =
                        `${u?.first_name || ""} ${u?.last_name || ""}`.trim() ||
                        (u?.email ? u.email.split("@")[0] : `User #${member.user_id}`);
                      const avatar = u?.profile_picture ? getMediaUrl(u.profile_picture) : null;
                      const isCurrentUser = currentUser?.id === member.user_id;

                      return (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3.5 bg-white hover:bg-[#FAF9FD] border border-[#EAE4F7] hover:border-[#D5CBEE] rounded-2xl transition-all shadow-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {avatar ? (
                              <img
                                src={avatar}
                                alt={fullName}
                                className="w-10 h-10 rounded-full object-cover border border-[#EAE4F7] shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4B63D2] to-[#5851A4] text-white font-bold flex items-center justify-center text-xs shrink-0">
                                {fullName.charAt(0).toUpperCase()}
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <Link
                                  to={`/profile/${member.user_id}`}
                                  className="text-xs font-bold text-[#1E2746] hover:text-[#4B63D2] truncate transition-colors"
                                >
                                  {fullName}
                                </Link>
                                {isCurrentUser && (
                                  <span className="text-[9px] font-bold bg-[#4B63D2]/10 text-[#4B63D2] px-1.5 py-0.2 rounded-md">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[#5851A4] truncate">
                                {u?.department ? `${u.department}` : u?.email}
                                {u?.graduation_year ? ` • Class of '${String(u.graduation_year).slice(-2)}` : ""}
                              </div>
                            </div>
                          </div>

                          {/* Role tag / Promotion controls + Direct Connect */}
                          <div className="flex items-center gap-2 shrink-0">
                            {!isCurrentUser && (
                              <Link
                                to="/messaging"
                                state={{ recipientId: member.user_id, recipientName: fullName }}
                                className="px-2.5 py-1.5 bg-[#FAF9FD] hover:bg-[#4B63D2] text-[#4B63D2] hover:text-white border border-[#D5CBEE] hover:border-[#4B63D2] rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title={`Chat with ${fullName}`}
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span className="hidden sm:inline">Connect</span>
                              </Link>
                            )}

                            {clubDetail.user_role === "LEADER" && !isCurrentUser ? (
                              <select
                                value={member.role}
                                onChange={(e) =>
                                  handleUpdateMemberRole(
                                    member.user_id,
                                    e.target.value as any,
                                  )
                                }
                                className="bg-[#FAF9FD] border border-[#D5CBEE] rounded-xl px-2 py-1 text-[10px] font-bold text-[#1E2746] focus:outline-none focus:border-[#4B63D2] cursor-pointer shadow-xs"
                              >
                                <option value="MEMBER">Member</option>
                                <option value="OFFICER">Officer</option>
                                <option value="LEADER">Chapter Lead</option>
                              </select>
                            ) : (
                              <span
                                className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${getRoleBadgeStyle(
                                  member.role,
                                )}`}
                              >
                                {member.role}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 4. Create / Edit Club Modal ─────────────────────────────────────── */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg bg-white border border-[#EAE4F7] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-[#1E2746] to-[#2A3558] text-white flex items-center justify-between">
              <div>
                <h3 className="text-base md:text-lg font-black">
                  {isEditing ? "Modify Chapter Settings" : "Register Campus Club or Alumni Chapter"}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Set up community name, category, and mentorship description
                </p>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1E2746]">
                  Community / Chapter Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="e.g. Cloud & AI Mentorship Chapter or Web3 Coding Club"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-4 py-2.5 text-xs text-[#1E2746] placeholder-[#9188BE] outline-none font-medium"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1E2746]">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-4 py-2.5 text-xs text-[#1E2746] outline-none cursor-pointer font-semibold"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description with Quick Resource Chips */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1E2746]">
                    Mission &amp; Activities Description
                  </label>
                  <span className="text-[10px] text-[#9188BE] font-medium">Supports links</span>
                </div>

                {/* Quick Helper Chips for Alumni & Mentors */}
                <div className="flex flex-wrap gap-1.5 pb-1">
                  <button
                    type="button"
                    onClick={() =>
                      setDescription(
                        (prev) =>
                          prev +
                          (prev ? "\n" : "") +
                          "Google Classroom: https://classroom.google.com/c/your-code",
                      )
                    }
                    className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-[#4B63D2] rounded-lg transition-colors cursor-pointer border border-[#D5CBEE] flex items-center gap-1"
                  >
                    + Google Classroom
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDescription(
                        (prev) =>
                          prev +
                          (prev ? "\n" : "") +
                          "Shared Notes & Drive: https://drive.google.com/drive/folders/your-folder",
                      )
                    }
                    className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer border border-emerald-200 flex items-center gap-1"
                  >
                    + Drive Notes
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDescription(
                        (prev) =>
                          prev +
                          (prev ? "\n" : "") +
                          "GitHub Repository: https://github.com/organization/repo",
                      )
                    }
                    className="text-[10px] font-bold px-2 py-0.5 bg-[#FAF9FD] hover:bg-[#F0EDF9] text-[#5851A4] rounded-lg transition-colors cursor-pointer border border-[#EAE4F7] flex items-center gap-1"
                  >
                    + GitHub Repo
                  </button>
                </div>

                <textarea
                  rows={4}
                  maxLength={2000}
                  placeholder="Describe your alumni chapter or club's goals, meeting schedules, projects, and paste Google Classroom / Drive links..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-4 py-2.5 text-xs text-[#1E2746] placeholder-[#9188BE] outline-none resize-none font-medium"
                />
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAE4F7]">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="bg-[#FAF9FD] hover:bg-[#F0EDF9] border border-[#EAE4F7] text-[#5851A4] px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingForm}
                  className="bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/25 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer"
                >
                  {submittingForm && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {isEditing ? "Save Changes" : "Register Community"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
