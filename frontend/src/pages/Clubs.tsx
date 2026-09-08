import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  Compass,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  LogOut,
} from "lucide-react";
import { apiRequest } from "../services/api";

// ── TypeScript Interfaces ───────────────────────────────────────────────────

export interface ClubMemberUser {
  id: number;
  email: string;
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
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

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
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  // ── Initial Fetching ───────────────────────────────────────────────────────

  const fetchClubsAndUser = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch current user
      const userRes = await apiRequest<{ id: number; email: string }>(
        "/users/me",
      );
      setCurrentUser(userRes);

      // Fetch all clubs
      const clubsRes = await apiRequest<ClubResponse[]>(
        "/clubs?skip=0&limit=100",
      );
      setClubs(clubsRes);
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

  // Refetch clubs list
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
      alert(err.message || "Failed to retrieve club details.");
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
    setCategory("Academic");
    setDescription("");
    setShowFormModal(true);
  };

  const openEditModal = () => {
    if (!clubDetail) return;
    setIsEditing(true);
    setName(clubDetail.name);
    setCategory(clubDetail.category || "Academic");
    setDescription(clubDetail.description || "");
    setShowFormModal(true);
  };

  // ── Submit / Delete Actions ────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Club Name is required.");
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
        // Edit Mode
        await apiRequest<ClubResponse>(`/clubs/${clubDetail.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setShowFormModal(false);

        // Refresh detail side-panel and listings grid
        loadClubDetail(clubDetail.id);
        refreshClubs();
      } else {
        // Create Mode
        const newClub = await apiRequest<ClubResponse>("/clubs", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setShowFormModal(false);

        // Open the details of the newly created club
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
      setClubs((prev) => prev.filter((c) => c.id !== clubDetail.id)); // Fail-safe
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

  // ── Filters & Categories ───────────────────────────────────────────────────

  const filteredClubs = clubs.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description &&
        c.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === "ALL" || c.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // List of pre-defined categories for filters and selections
  const categoriesList = [
    "Academic",
    "Cultural",
    "Sports",
    "Technical",
    "Social",
    "Other",
  ];

  // Styling helper for category tag labels
  const getCategoryBadgeStyle = (catName?: string | null) => {
    const name = catName?.toUpperCase() || "OTHER";
    switch (name) {
      case "TECHNICAL":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "ACADEMIC":
        return "bg-sky-500/10 text-sky-400 border border-sky-500/20";
      case "SPORTS":
        return "bg-orange-500/10 text-orange-400 border border-orange-500/20";
      case "CULTURAL":
      case "SOCIAL":
        return "bg-pink-500/10 text-pink-400 border border-pink-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-sm font-medium">Retrieving student clubs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 relative z-10">
          <h2 className="text-2xl md:text-3xl font-black text-[#1E2746] flex items-center gap-3">
            <Compass className="w-8 h-8 text-[#4B63D2]" />
            Student Clubs
          </h2>
          <p className="text-[#5851A4] text-sm max-w-xl font-medium">
            Explore college clubs, view active member rosters, promote
            colleagues to leadership roles, or register a new club.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-[#4B63D2] hover:bg-[#3E53BE] text-white shadow-sm px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 relative z-10 shrink-0 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Create Club
        </button>
      </div>

      {/* 2. Filter controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 border border-[#EAE4F7] rounded-3xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE]" />
          <input
            type="text"
            placeholder="Search clubs by name, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:ring-2 focus:ring-[#4B63D2]/10 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9188BE] hover:text-[#1E2746] text-[10px] font-bold"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 bg-[#FAF9FD] border border-[#D5CBEE] rounded-xl px-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-transparent border-0 py-2.5 text-xs font-bold text-[#1E2746] focus:outline-none pr-6 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Grid & Details Layout Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Listings column */}
        <div
          className={`${selectedClubId !== null ? "lg:col-span-2" : "lg:col-span-3"} grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-300`}
        >
          {error ? (
            <div className="col-span-full bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
              <h3 className="text-rose-800 font-bold text-base">Error Loading Clubs</h3>
              <p className="text-rose-700 text-sm max-w-md mx-auto">{error}</p>
              <button
                onClick={() => fetchClubsAndUser()}
                className="px-4 py-2 mt-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-all cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : filteredClubs.length === 0 ? (
            <div className="col-span-full bg-white border border-[#EAE4F7] rounded-3xl p-16 text-center text-[#5851A4] shadow-sm">
              <Users className="w-12 h-12 text-[#B9B1D9] mx-auto mb-4" />
              <p className="font-black text-sm text-[#1E2746]">
                No clubs found
              </p>
              <p className="text-xs text-[#5851A4] mt-1 font-medium">
                Be the first to schedule and register a new student club!
              </p>
            </div>
          ) : (
            filteredClubs.map((club) => {
              const isSelected = selectedClubId === club.id;
              return (
                <div
                  key={club.id}
                  onClick={() => setSelectedClubId(club.id)}
                  className={`cursor-pointer bg-white border rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between hover:shadow-md ${
                    isSelected
                      ? "border-[#4B63D2] shadow-sm ring-2 ring-[#4B63D2]/20"
                      : "border-[#EAE4F7] hover:border-[#C8B6E2]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${getCategoryBadgeStyle(
                          club.category,
                        )}`}
                      >
                        {club.category || "Other"}
                      </span>
                    </div>

                    <h4 className="text-lg font-black text-[#1E2746] mb-2">
                      {club.name}
                    </h4>
                    <p className="text-[#5851A4] text-xs line-clamp-3 leading-relaxed mb-4 font-medium">
                      {club.description || "No description provided."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#EAE4F7] text-xs text-[#4B63D2] font-bold group">
                    <span>View roster and details</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Side Detail Panel Column */}
        {selectedClubId !== null && (
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col">
            <button
              onClick={() => setSelectedClubId(null)}
              className="absolute top-4 right-4 text-[#9188BE] hover:text-[#1E2746] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {detailLoading || !clubDetail ? (
              <div className="flex flex-col items-center justify-center py-24 text-[#5851A4] space-y-3 font-medium">
                <Loader2 className="w-6 h-6 animate-spin text-[#4B63D2]" />
                <span className="text-xs">Loading roster details...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Meta details */}
                <div className="space-y-2 pr-6">
                  <span
                    className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${getCategoryBadgeStyle(
                      clubDetail.category,
                    )}`}
                  >
                    {clubDetail.category || "Other"}
                  </span>
                  <h3 className="text-xl font-black text-[#1E2746]">
                    {clubDetail.name}
                  </h3>
                  <p className="text-[#5851A4] text-xs leading-relaxed max-h-36 overflow-y-auto font-medium">
                    {clubDetail.description || "No description provided."}
                  </p>
                </div>

                {/* Membership Roster counts & Actions */}
                <div className="border-t border-[#EAE4F7] pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#5851A4] font-medium">
                      Roster:{" "}
                      <strong className="text-[#1E2746] font-bold">
                        {clubDetail.members_count}
                      </strong>{" "}
                      members
                    </span>
                    {clubDetail.user_role && (
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#4B63D2]/10 text-[#4B63D2] border border-[#4B63D2]/20 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {clubDetail.user_role}
                      </span>
                    )}
                  </div>

                  {/* Join / Leave Buttons */}
                  <div className="flex gap-3">
                    {!clubDetail.user_role ? (
                      <button
                        onClick={handleJoinClub}
                        className="flex-1 bg-[#4B63D2] hover:bg-[#3E53BE] text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
                      >
                        Join Club
                      </button>
                    ) : (
                      // Allow leaving only if not sole leader, or let server validate
                      <button
                        onClick={handleLeaveClub}
                        className="flex-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Leave Club
                      </button>
                    )}

                    {/* Leader settings */}
                    {clubDetail.user_role === "LEADER" && (
                      <div className="flex gap-2">
                        <button
                          onClick={openEditModal}
                          className="bg-[#FAF9FD] hover:bg-white border border-[#D5CBEE] text-[#5851A4] p-2.5 rounded-xl transition-colors cursor-pointer"
                          title="Edit Club Details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleDeleteClub}
                          className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 p-2.5 rounded-xl transition-colors cursor-pointer"
                          title="Delete Club"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Member List */}
                <div className="border-t border-[#EAE4F7] pt-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#5851A4]">
                    Roster Directory
                  </h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {clubDetail.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-[#FAF9FD] border border-[#EAE4F7] rounded-2xl text-xs"
                      >
                        <span
                          className="text-[#1E2746] font-bold truncate max-w-[150px]"
                          title={member.user?.email}
                        >
                          {member.user?.email || `User #${member.user_id}`}
                        </span>

                        {/* Leader Controls to Update Roles */}
                        {clubDetail.user_role === "LEADER" &&
                        currentUser &&
                        member.user_id !== currentUser.id ? (
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleUpdateMemberRole(
                                member.user_id,
                                e.target.value as any,
                              )
                            }
                            className="bg-white border border-[#D5CBEE] rounded-lg px-2 py-1 text-[10px] text-[#1E2746] font-semibold focus:outline-none"
                          >
                            <option value="MEMBER">Member</option>
                            <option value="OFFICER">Officer</option>
                            <option value="LEADER">Leader</option>
                          </select>
                        ) : (
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              member.role === "LEADER"
                                ? "text-amber-800 bg-amber-50 border border-amber-200"
                                : member.role === "OFFICER"
                                  ? "text-[#4B63D2] bg-[#4B63D2]/10 border border-[#4B63D2]/20"
                                  : "text-[#5851A4] bg-[#FAF9FD] border border-[#EAE4F7]"
                            }`}
                          >
                            {member.role}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 4. Create/Edit Club Modal ───────────────────────────────────────── */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2746]/50 backdrop-blur-sm">
          <div
            className="w-full max-w-md bg-white border border-[#EAE4F7] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-white border-b border-[#EAE4F7] flex items-center justify-between">
              <h3 className="text-lg font-black text-[#1E2746]">
                {isEditing ? "Modify Club Settings" : "Register Student Club"}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-[#9188BE] hover:text-[#1E2746] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1E2746]">
                  Club Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="e.g. Developer Student Club"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-4 py-2.5 text-sm text-[#1E2746] placeholder-[#9188BE] outline-none focus:ring-2 focus:ring-[#4B63D2]/10 font-medium"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1E2746]">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-4 py-2.5 text-sm text-[#1E2746] outline-none focus:ring-2 focus:ring-[#4B63D2]/10 cursor-pointer font-semibold"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1E2746]">
                  Description
                </label>
                <textarea
                  rows={4}
                  maxLength={2000}
                  placeholder="Tell students about the club's activities, meeting times, and projects..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-4 py-2.5 text-sm text-[#1E2746] placeholder-[#9188BE] outline-none focus:ring-2 focus:ring-[#4B63D2]/10 resize-none font-medium"
                />
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAE4F7]">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="bg-[#FAF9FD] border border-[#D5CBEE] hover:bg-white text-[#5851A4] px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingForm}
                  className="bg-[#4B63D2] hover:bg-[#3E53BE] text-white shadow-sm px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer"
                >
                  {submittingForm && (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  )}
                  {isEditing ? "Save Changes" : "Register Club"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
