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
        return "bg-amber-500/10 text-amber-700 border-amber-500/30";
      case "TECHNICAL":
        return "bg-indigo-500/10 text-indigo-700 border-indigo-500/30";
      case "ACADEMIC":
        return "bg-sky-500/10 text-sky-700 border-sky-500/30";
      case "SPORTS":
        return "bg-orange-500/10 text-orange-700 border-orange-500/30";
      case "CULTURAL":
      case "SOCIAL":
        return "bg-pink-500/10 text-pink-700 border-pink-500/30";
      default:
        return "bg-slate-500/10 text-slate-700 border-slate-500/30";
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "LEADER":
        return "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-900 border-amber-400/40";
      case "OFFICER":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  // ── Render Loading ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
          <Compass className="w-6 h-6 text-indigo-600 absolute inset-0 m-auto" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-slate-800">Loading Clubs & Alumni Chapters...</p>
          <p className="text-xs text-slate-500 mt-0.5">Connecting with campus network and leadership rosters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── 1. Hero Banner with Executive Stats ────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1E2746] via-[#2A3558] to-[#182038] text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800/80">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-amber-300">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Campus Communities & Alumni Chapter Network</span>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              Clubs, Chapters &amp; Leadership Rosters
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-normal">
              Connect with club presidents, alumni chapter leads, and active student-alumni committees. Join chapters to participate in mentorship, hackathons, and regional networking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={openCreateModal}
              className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold px-5 py-3 rounded-2xl text-xs md:text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all duration-200 flex items-center gap-2 cursor-pointer border border-indigo-400/30"
            >
              <Plus className="w-4 h-4" />
              <span>Register Club / Chapter</span>
            </button>
          </div>
        </div>

        {/* Quick KPI stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mt-8 pt-6 border-t border-white/10 relative z-10">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3.5">
            <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Total Clubs</div>
            <div className="text-xl md:text-2xl font-black text-white mt-1">{clubs.length}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3.5">
            <div className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">Alumni Chapters</div>
            <div className="text-xl md:text-2xl font-black text-amber-400 mt-1">
              {clubs.filter((c) => c.category?.toLowerCase().includes("alumni")).length}
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3.5">
            <div className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">Active Roster</div>
            <div className="text-xl md:text-2xl font-black text-emerald-400 mt-1">
              {clubDetail ? clubDetail.members_count : "—"}
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3.5">
            <div className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">Your Status</div>
            <div className="text-sm font-bold text-indigo-300 mt-1 truncate">
              {clubDetail?.user_role ? `${clubDetail.user_role} Member` : "Discovering"}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Filter Bar & Category Chips ─────────────────────────────────── */}
      <div className="bg-white border border-[#EAE4F7] rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search clubs by name, mission, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-[10px] font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Results count */}
          <div className="text-xs text-slate-500 font-medium px-2 flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-indigo-500" />
            <span>Showing <strong>{filteredClubs.length}</strong> community clubs</span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === "ALL"
                ? "bg-[#1E2746] text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
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
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {cat === "Alumni Chapter" && <Crown className="w-3 h-3 text-amber-400" />}
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
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-10 text-center text-slate-500 shadow-sm space-y-3">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto">
                <Compass className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm text-slate-800">No matching clubs found</p>
              <p className="text-xs text-slate-500">
                Try searching with a different term or register a new club or alumni chapter.
              </p>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
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
                      ? "border-indigo-600 ring-2 ring-indigo-500/20 shadow-md bg-gradient-to-r from-white to-indigo-50/20"
                      : "border-[#EAE4F7] hover:border-indigo-300 hover:shadow-sm"
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
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <Crown className="w-3 h-3 text-amber-500" />
                          Alumni Led
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {club.name}
                    </h3>
                    <p className="text-slate-600 text-xs line-clamp-2 mt-1.5 leading-relaxed font-normal">
                      {club.description || "No mission description provided yet."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3.5 mt-3.5 border-t border-slate-100 text-xs font-bold text-indigo-600">
                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      View leadership &amp; members
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
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-12 text-center text-slate-500 shadow-sm space-y-3">
              <Compass className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Select a Club or Chapter</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Choose any club from the list to inspect its leadership team, alumni heads, and active student roster.
              </p>
            </div>
          ) : detailLoading || !clubDetail ? (
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-16 flex flex-col items-center justify-center space-y-3 text-slate-500 shadow-sm">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-xs font-bold text-slate-700">Loading chapter details &amp; leadership roster...</p>
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
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Join Chapter
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
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-xl transition-colors cursor-pointer"
                          title="Edit Club Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={handleDeleteClub}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 p-2 rounded-xl transition-colors cursor-pointer"
                          title="Delete Club"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900">{clubDetail.name}</h2>
                  <p className="text-slate-600 text-xs md:text-sm mt-2 leading-relaxed">
                    {clubDetail.description || "No detailed mission description available for this community."}
                  </p>
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
                        Club Leadership &amp; Alumni Chapter Heads
                      </h4>
                      <p className="text-[11px] text-amber-800/80">
                        Primary leaders, mentors, and student-alumni officers in charge
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
                        className="bg-white/90 backdrop-blur-sm border border-amber-200/80 rounded-2xl p-3.5 shadow-sm flex items-start gap-3 relative group"
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
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
                              {fullName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div
                            className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                              head.role === "LEADER"
                                ? "bg-amber-500 text-white"
                                : "bg-indigo-600 text-white"
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
                              className="text-xs font-black text-slate-900 hover:text-indigo-600 truncate block transition-colors"
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

                          <div className="text-[10px] text-slate-500 mt-1 truncate">
                            {u?.department ? `${u.department}` : u?.email}
                            {u?.graduation_year ? ` • Class of '${String(u.graduation_year).slice(-2)}` : ""}
                          </div>
                        </div>

                        {/* Action: Link to message or profile */}
                        <Link
                          to={`/messaging`}
                          className="text-slate-400 hover:text-indigo-600 p-1 rounded-lg transition-colors shrink-0"
                          title="Message Lead"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── 👥 Active Member Roster Directory ── */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      Active Community Members Roster
                    </h4>
                    <p className="text-xs text-slate-500">
                      Total <strong>{clubDetail.members_count}</strong> enrolled members
                    </p>
                  </div>

                  {/* Search and Filter inside member roster */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Filter members..."
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        className="pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36 sm:w-44"
                      />
                    </div>

                    <select
                      value={memberRoleFilter}
                      onChange={(e) => setMemberRoleFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
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
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs">
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
                          className="flex items-center justify-between p-3 bg-slate-50/70 hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {avatar ? (
                              <img
                                src={avatar}
                                alt={fullName}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                                {fullName.charAt(0).toUpperCase()}
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <Link
                                  to={`/profile/${member.user_id}`}
                                  className="text-xs font-bold text-slate-900 hover:text-indigo-600 truncate transition-colors"
                                >
                                  {fullName}
                                </Link>
                                {isCurrentUser && (
                                  <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded-md">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {u?.department ? `${u.department}` : u?.email}
                                {u?.graduation_year ? ` • Class of '${String(u.graduation_year).slice(-2)}` : ""}
                              </div>
                            </div>
                          </div>

                          {/* Role tag or Role promotion selector (if current user is Leader) */}
                          <div className="flex items-center gap-2 shrink-0">
                            {clubDetail.user_role === "LEADER" && !isCurrentUser ? (
                              <select
                                value={member.role}
                                onChange={(e) =>
                                  handleUpdateMemberRole(
                                    member.user_id,
                                    e.target.value as any,
                                  )
                                }
                                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div
            className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base md:text-lg font-black">
                  {isEditing ? "Modify Chapter Settings" : "Register Campus Club or Alumni Chapter"}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Set up community name, chapter category, and leadership description
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
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Community / Chapter Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="e.g. San Francisco Alumni Chapter or Web3 Innovators Club"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer font-semibold"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Mission &amp; Activities Description
                </label>
                <textarea
                  rows={4}
                  maxLength={2000}
                  placeholder="Describe your alumni chapter or club's goals, meeting schedules, projects, and collaboration opportunities..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/10 resize-none font-medium"
                />
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingForm}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer"
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
