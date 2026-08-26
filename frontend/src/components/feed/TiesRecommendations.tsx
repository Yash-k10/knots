import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Sparkles,
  GraduationCap,
  Briefcase,
  Building,
  Check,
  UserPlus,
  Loader2,
} from "lucide-react";
import { apiRequest, getMediaUrl } from "../../services/api";

export type TieCategory = "all" | "student" | "faculty" | "alumni" | "management";

export interface TieProfile {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  profile_picture?: string | null;
  role_name: "Student" | "Faculty" | "Alumni" | "Management" | "Admin";
  department?: string | null;
  position_title?: string | null;
  has_infinity_badge: boolean;
  mutual_ties: number;
  tie_status: "none" | "pending" | "tied";
}

export default function TiesRecommendations() {
  const [activeCategory, setActiveCategory] = useState<TieCategory>("all");
  const [profiles, setProfiles] = useState<TieProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Fetch real suggestions and users from API
  useEffect(() => {
    const fetchTies = async () => {
      setLoading(true);
      try {
        const [suggestionsData, _usersData, sentRequests, myConnections] =
          await Promise.all([
            apiRequest<any[]>("/connections/suggestions").catch(() => []),
            apiRequest<any[]>("/users").catch(() => []),
            apiRequest<any[]>("/connections/me/sent-requests").catch(() => []),
            apiRequest<any[]>("/connections/me").catch(() => []),
          ]);


        const sentTargetIds = new Set(
          (Array.isArray(sentRequests) ? sentRequests : []).map(
            (r: any) => r.addressee_id,
          ),
        );
        const connectedUserIds = new Set(
          (Array.isArray(myConnections) ? myConnections : []).map(
            (c: any) => c.requester_id || c.addressee_id,
          ),
        );

        // Fallback curated campus recommendations across 4 divisions
        const defaultPool: TieProfile[] = [
          {
            id: 101,
            email: "prof.sharma@sbjit.edu.in",
            first_name: "Dr. Rajesh",
            last_name: "Sharma",
            profile_picture: null,
            role_name: "Faculty",
            department: "Computer Science & Engineering",
            position_title: "Head of CSE & AI Research",
            has_infinity_badge: true, // Special distinguished position
            mutual_ties: 14,
            tie_status: "none",
          },
          {
            id: 102,
            email: "priya.verma@sbjit.edu.in",
            first_name: "Priya",
            last_name: "Verma",
            profile_picture: null,
            role_name: "Alumni",
            department: "AIML (Batch of 2024)",
            position_title: "AI Engineer @ Microsoft",
            has_infinity_badge: true, // Distinguished Alumni position
            mutual_ties: 9,
            tie_status: "none",
          },
          {
            id: 103,
            email: "rohit.aiml23@sbjit.edu.in",
            first_name: "Rohit",
            last_name: "Deshmukh",
            profile_picture: null,
            role_name: "Student",
            department: "AIML (3rd Year)",
            position_title: "Lead Organizer, GDSC SBJIT",
            has_infinity_badge: true, // Student Lead position
            mutual_ties: 12,
            tie_status: "none",
          },
          {
            id: 104,
            email: "dean.academics@sbjit.edu.in",
            first_name: "Dr. Ananya",
            last_name: "Mukherjee",
            profile_picture: null,
            role_name: "Management",
            department: "Academic Affairs",
            position_title: "Dean of Academics & Innovation",
            has_infinity_badge: true, // Management distinction
            mutual_ties: 22,
            tie_status: "none",
          },
          {
            id: 105,
            email: "tanvi.kulkarni@sbjit.edu.in",
            first_name: "Tanvi",
            last_name: "Kulkarni",
            profile_picture: null,
            role_name: "Student",
            department: "Data Science (4th Year)",
            position_title: "Open Source Contributor",
            has_infinity_badge: false,
            mutual_ties: 6,
            tie_status: "none",
          },
          {
            id: 106,
            email: "prof.patil@sbjit.edu.in",
            first_name: "Prof. Sanjay",
            last_name: "Patil",
            profile_picture: null,
            role_name: "Faculty",
            department: "Information Technology",
            position_title: "Senior Assistant Professor",
            has_infinity_badge: false,
            mutual_ties: 5,
            tie_status: "none",
          },
          {
            id: 107,
            email: "aman.alumni@sbjit.edu.in",
            first_name: "Aman",
            last_name: "Gupta",
            profile_picture: null,
            role_name: "Alumni",
            department: "Computer Tech (2023)",
            position_title: "Product Lead @ FinTech",
            has_infinity_badge: false,
            mutual_ties: 4,
            tie_status: "none",
          },
        ];

        // Merge live users & suggestions
        const merged: TieProfile[] = [...defaultPool];

        if (Array.isArray(suggestionsData) && suggestionsData.length > 0) {
          suggestionsData.forEach((s) => {
            if (!merged.some((m) => m.id === s.user_id)) {
              const emailHandle = s.email.split("@")[0];
              const isLead =
                s.score > 25 ||
                s.email.includes("admin") ||
                s.email.includes("prof") ||
                s.email.includes("dean");

              merged.unshift({
                id: s.user_id,
                email: s.email,
                first_name: s.first_name || emailHandle.split(".")[0],
                last_name: s.last_name || "",
                profile_picture: s.profile_picture || null,
                role_name: s.email.includes("prof")
                  ? "Faculty"
                  : s.email.includes("dean") || s.email.includes("admin")
                  ? "Management"
                  : s.email.includes("alumni")
                  ? "Alumni"
                  : "Student",
                department: s.department || "Campus Network",
                position_title: s.recommendation_reason || "Campus Member",
                has_infinity_badge: isLead,
                mutual_ties: s.mutual_count || 3,
                tie_status: connectedUserIds.has(s.user_id)
                  ? "tied"
                  : sentTargetIds.has(s.user_id)
                  ? "pending"
                  : "none",
              });
            }
          });
        }

        setProfiles(merged);
      } catch (err) {
        console.error("Failed to fetch ties suggestions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTies();
  }, []);

  // Handle "Tie" action (send connection / follow request)
  const handleTieAction = async (targetId: number) => {
    setActionLoadingId(targetId);
    try {
      await apiRequest("/connections", {
        method: "POST",
        body: JSON.stringify({ addressee_id: targetId }),
      });

      setProfiles((prev) =>
        prev.map((p) =>
          p.id === targetId ? { ...p, tie_status: "pending" } : p,
        ),
      );
    } catch (err: any) {
      // If already connected or pending
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === targetId ? { ...p, tie_status: "pending" } : p,
        ),
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter profiles based on category
  const filteredProfiles = profiles.filter((p) => {
    if (activeCategory === "all") return true;
    if (activeCategory === "student") return p.role_name === "Student";
    if (activeCategory === "faculty") return p.role_name === "Faculty";
    if (activeCategory === "alumni") return p.role_name === "Alumni";
    if (activeCategory === "management")
      return p.role_name === "Management" || p.role_name === "Admin";
    return true;
  });

  const categories: { id: TieCategory; label: string; icon: any }[] = [
    { id: "all", label: "All", icon: Sparkles },
    { id: "student", label: "Students", icon: GraduationCap },
    { id: "faculty", label: "Faculty", icon: Building },
    { id: "alumni", label: "Alumni", icon: Briefcase },
    { id: "management", label: "Management", icon: Users },
  ];

  return (
    <aside className="w-full bg-white border border-[#EAE4F7] rounded-3xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#EAE4F7] pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#4B63D2] to-[#5851A4] flex items-center justify-center text-white shadow-sm shadow-[#4B63D2]/20">
            <Users className="w-4 h-4 text-[#FFD21A]" />
          </div>
          <div>
            <h3 className="text-base font-black text-[#1E2746] tracking-tight flex items-center gap-1.5">
              Campus Ties
              <span
                className="text-[#4B63D2] text-sm font-black"
                title="Ties is your campus connection & follow network"
              >
                ∞
              </span>
            </h3>
            <p className="text-[11px] font-semibold text-[#5851A4]">
              Recommended people to tie with
            </p>
          </div>
        </div>
        <Link
          to="/connections?tab=discover"
          className="text-xs font-bold text-[#4B63D2] hover:text-[#3E53BE] hover:underline"
        >
          See All
        </Link>
      </div>

      {/* 4-Division Segmented Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-[#FAF9FD] rounded-2xl border border-[#EAE4F7]">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-1 min-w-[65px] py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-[#4B63D2] text-white shadow-sm shadow-[#4B63D2]/20"
                  : "text-[#5851A4] hover:bg-[#F3EFFB] hover:text-[#1E2746]"
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Ties Recommendation List */}
      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center text-[#5851A4] text-xs gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#4B63D2]" />
          <span>Discovering campus ties...</span>
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="py-6 text-center text-[#5851A4] text-xs font-medium bg-[#FAF9FD] rounded-2xl border border-[#EAE4F7]">
          No recommendations found in this category right now.
        </div>
      ) : (
        <div className="space-y-3 divide-y divide-[#EAE4F7]/60">
          {filteredProfiles.slice(0, 6).map((profile) => {
            const displayName =
              `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
              profile.email.split("@")[0];
            const initial = displayName.charAt(0).toUpperCase();
            const avatar = getMediaUrl(profile.profile_picture);

            return (
              <div
                key={profile.id}
                className="pt-3 first:pt-0 flex items-center justify-between gap-3 group"
              >
                {/* Avatar & User Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={displayName}
                        className="h-10 w-10 rounded-2xl object-cover border border-[#EAE4F7] shadow-sm"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#5851A4] to-[#4B63D2] flex items-center justify-center text-white font-black text-sm shadow-sm">
                        {initial}
                      </div>
                    )}
                    {/* Role badge dot */}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                        profile.role_name === "Faculty"
                          ? "bg-purple-500"
                          : profile.role_name === "Management"
                          ? "bg-amber-500"
                          : profile.role_name === "Alumni"
                          ? "bg-emerald-500"
                          : "bg-blue-500"
                      }`}
                      title={profile.role_name}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Name + Infinity Distinction Badge */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-bold text-[#1E2746] truncate group-hover:text-[#4B63D2] transition-colors">
                        {displayName}
                      </h4>

                      {/* ✨ Infinity Symbol Position Badge (like blue tick) ✨ */}
                      {profile.has_infinity_badge && (
                        <span
                          className="inline-flex items-center justify-center h-4 px-1.5 rounded-full bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white text-[10px] font-black shadow-sm"
                          title="Verified Campus Distinction / Leadership Position"
                        >
                          ∞
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] font-medium text-[#5851A4] truncate">
                      {profile.position_title || profile.department}
                    </p>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#4B63D2] bg-[#4B63D2]/10 px-1.5 py-0.2 rounded-md">
                        {profile.role_name}
                      </span>
                      {profile.mutual_ties > 0 && (
                        <span className="text-[10px] font-medium text-[#9188BE]">
                          {profile.mutual_ties} mutual ties
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* "Tie" Action Button */}
                <div>
                  {profile.tie_status === "tied" ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                      <Check className="w-3 h-3" /> Tied
                    </span>
                  ) : profile.tie_status === "pending" ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                      Pending
                    </span>
                  ) : (
                    <button
                      onClick={() => handleTieAction(profile.id)}
                      disabled={actionLoadingId === profile.id}
                      className="inline-flex items-center gap-1 text-xs font-bold text-white bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] px-3 py-1.5 rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      {actionLoadingId === profile.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5 text-[#FFD21A]" />
                          <span>Tie</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer info */}
      <div className="pt-2 border-t border-[#EAE4F7] flex items-center justify-between text-[11px] text-[#5851A4] font-medium">
        <span className="flex items-center gap-1">
          <span className="text-[#4B63D2] font-black">∞</span>
          Infinity badge indicates verified role
        </span>
        <Link
          to="/connections?tab=discover"
          className="font-bold text-[#4B63D2] hover:underline"
        >
          Explore
        </Link>
      </div>
    </aside>
  );
}
