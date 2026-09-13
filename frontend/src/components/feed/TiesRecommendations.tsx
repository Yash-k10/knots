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
  const [failedAvatars, setFailedAvatars] = useState<Record<number, boolean>>({});

  // Fetch real suggestions and users from API
  useEffect(() => {
    const fetchTies = async () => {
      setLoading(true);
      try {
        const [suggestionsData, sentRequests, myConnections, me] =
          await Promise.all([
            apiRequest<any[]>("/connections/suggestions").catch(() => []),
            apiRequest<any[]>("/connections/me/sent-requests").catch(() => []),
            apiRequest<any[]>("/connections/me").catch(() => []),
            apiRequest<any>("/users/me").catch(() => null),
          ]);

        const myId = me?.id;
        const sentTargetIds = new Set(
          (Array.isArray(sentRequests) ? sentRequests : []).map(
            (r: any) => r.addressee_id,
          ),
        );
        const connectedUserIds = new Set(
          (Array.isArray(myConnections) ? myConnections : []).map(
            (c: any) =>
              c.requester_id === myId ? c.addressee_id : c.requester_id,
          ),
        );

        const realProfiles: TieProfile[] = [];

        if (Array.isArray(suggestionsData) && suggestionsData.length > 0) {
          suggestionsData.forEach((s) => {
            const uid = s.user_id || s.id;
            if (uid && uid !== myId && !realProfiles.some((m) => m.id === uid)) {
              const emailHandle = s.email ? s.email.split("@")[0] : "user";
              const rawRole = s.role_name || (s.email?.includes("prof")
                ? "Faculty"
                : s.email?.includes("dean") || s.email?.includes("admin")
                ? "Management"
                : s.email?.includes("alumni")
                ? "Alumni"
                : "Student");
              const normalizedRole =
                rawRole === "Faculty" ||
                rawRole === "Alumni" ||
                rawRole === "Management" ||
                rawRole === "Admin"
                  ? rawRole
                  : "Student";

              const isLead =
                s.score > 25 ||
                normalizedRole === "Faculty" ||
                normalizedRole === "Management" ||
                normalizedRole === "Alumni" ||
                Boolean(s.has_infinity_badge);

              realProfiles.push({
                id: uid,
                email: s.email,
                first_name:
                  s.first_name ||
                  s.profile?.first_name ||
                  emailHandle.split(".")[0],
                last_name: s.last_name || s.profile?.last_name || "",
                profile_picture:
                  s.profile_picture || s.profile?.profile_picture || null,
                role_name: normalizedRole,
                department:
                  s.department || s.profile?.department || "Campus Network",
                position_title:
                  s.recommendation_reason ||
                  (s.department ? `${s.department} Member` : "Campus Member"),
                has_infinity_badge: isLead,
                mutual_ties: s.mutual_count || 0,
                tie_status: connectedUserIds.has(uid)
                  ? "tied"
                  : sentTargetIds.has(uid)
                  ? "pending"
                  : "none",
              });
            }
          });
        }

        setProfiles(realProfiles);
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
                <Link
                  to={`/profile/${profile.id}`}
                  className="flex items-center gap-3 min-w-0 flex-1 group/rec cursor-pointer"
                >
                  <div className="relative shrink-0">
                    {avatar && !failedAvatars[profile.id] ? (
                      <img
                        src={avatar}
                        alt={displayName}
                        onError={() =>
                          setFailedAvatars((prev) => ({
                            ...prev,
                            [profile.id]: true,
                          }))
                        }
                        className="h-10 w-10 rounded-2xl object-cover border border-[#EAE4F7] shadow-sm group-hover/rec:border-[#4B63D2] transition-colors"
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
                      <h4 className="text-xs font-bold text-[#1E2746] truncate group-hover/rec:text-[#4B63D2] transition-colors">
                        {displayName}
                      </h4>

                      {/* ✨ Infinity Symbol Position Badge (like blue tick) ✨ */}
                      {profile.has_infinity_badge && (
                        <img
                          src="/infinity-badge.png"
                          className="h-4 w-4 object-contain inline-block ml-0.5 drop-shadow-sm"
                          alt="Infinity Badge"
                          title="Verified Campus Distinction / Leadership Position"
                        />
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
                </Link>

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
