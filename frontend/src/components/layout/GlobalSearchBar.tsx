import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Loader2,
  User as UserIcon,
  Rss,
  Briefcase,
  Calendar,
  ChevronRight,
  GraduationCap,
  Building,
  FolderGit2,
} from "lucide-react";
import {
  searchApi,
  GlobalSearchResponse,
  UserSearchResult,
  PostSearchResult,
  JobSearchResult,
  EventSearchResult,
} from "../../services/search";
import { getMediaUrl } from "../../services/api";

export default function GlobalSearchBar() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GlobalSearchResponse | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Close dropdown on outside click or ESC
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Debounced search query
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);

    const timer = setTimeout(async () => {
      try {
        const data = await searchApi.globalSearch(query.trim(), category);
        setResults(data);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, category]);

  const handleSelect = (path: string) => {
    setIsOpen(false);
    setQuery("");
    navigate(path);
  };

  // Keyboard navigation on Enter key: pick top match
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && results && isOpen) {
      e.preventDefault();
      // Pick first matching item from priority: Users -> Posts -> Jobs -> Events
      if (uniqueUsers.length > 0) {
        handleSelect(`/profile/${uniqueUsers[0].id}`);
      } else if (uniquePosts.length > 0) {
        handleSelect(`/feed`);
      } else if (uniqueJobs.length > 0) {
        handleSelect(`/jobs`);
      } else if (uniqueEvents.length > 0) {
        handleSelect(`/events`);
      }
    }
  };

  // Deduplicate search results by ID to prevent duplicate suggestions
  const uniqueUsers = results?.users
    ? Array.from(new Map(results.users.map((u) => [u.id, u])).values())
    : [];
  const uniquePosts = results?.posts
    ? Array.from(new Map(results.posts.map((p) => [p.id, p])).values())
    : [];
  const uniqueJobs = results?.jobs
    ? Array.from(new Map(results.jobs.map((j) => [j.id, j])).values())
    : [];
  const uniqueEvents = results?.events
    ? Array.from(new Map(results.events.map((e) => [e.id, e])).values())
    : [];

  const getUserBadge = (user: UserSearchResult) => {
    const role = (user.role_name || "Student").trim();
    const dept = user.department ? ` • ${user.department}` : "";
    return `${role}${dept}`;
  };

  const getRoleIcon = (roleName?: string) => {
    const r = (roleName || "").toLowerCase();
    if (r.includes("faculty") || r.includes("prof")) {
      return <Building className="h-3.5 w-3.5 text-purple-600" />;
    }
    if (r.includes("alumni")) {
      return <Briefcase className="h-3.5 w-3.5 text-blue-600" />;
    }
    return <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />;
  };

  // Check if post is project-related
  const isProjectPost = (content: string) => {
    const lower = (content || "").toLowerCase();
    return (
      lower.includes("project") ||
      lower.includes("github") ||
      lower.includes("repo") ||
      lower.includes("built") ||
      lower.includes("hackathon")
    );
  };

  const getCategoryCount = (cat: string): number => {
    if (!results) return 0;
    if (cat === "all")
      return (
        uniqueUsers.length +
        uniquePosts.length +
        uniqueJobs.length +
        uniqueEvents.length
      );
    if (cat === "users") return uniqueUsers.length;
    if (cat === "posts") return uniquePosts.length;
    if (cat === "jobs") return uniqueJobs.length;
    if (cat === "events") return uniqueEvents.length;
    return 0;
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 h-4 w-4 text-[#9188BE] pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search students, alumni, faculty, posts, projects, opportunities..."
          aria-label="Search KNOTS Campus Platform"
          className="w-full bg-[#FAF9FD] border border-[#D5CBEE] rounded-2xl pl-10 pr-10 py-2.5 text-xs sm:text-sm font-medium text-[#1E2746] placeholder-[#9188BE] focus:bg-white focus:outline-none focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/15 transition-all shadow-xs"
        />
        {loading ? (
          <Loader2 className="absolute right-3.5 h-4 w-4 text-[#4B63D2] animate-spin" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults(null);
              inputRef.current?.focus();
            }}
            title="Clear search"
            className="absolute right-3.5 text-[#9188BE] hover:text-[#1E2746] p-0.5 rounded-lg hover:bg-[#EAE4F7] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 w-[calc(100vw-32px)] sm:w-[480px] md:w-[520px] max-w-[96vw] mt-2 bg-white border border-[#EAE4F7] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-50 max-h-[75vh] flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Category Filter Tabs */}
          <div className="flex border-b border-[#EAE4F7] bg-[#FAF9FD] p-2 gap-1.5 text-xs font-bold overflow-x-auto scrollbar-none">
            {[
              { id: "all", label: "All" },
              { id: "users", label: "People" },
              { id: "posts", label: "Posts & Projects" },
              { id: "jobs", label: "Opportunities" },
              { id: "events", label: "Events" },
            ].map((tab) => {
              const count = getCategoryCount(tab.id);
              const isActive = category === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer text-xs font-bold ${
                    isActive
                      ? "bg-[#4B63D2] text-white shadow-sm shadow-[#4B63D2]/20"
                      : "text-[#5851A4] hover:text-[#1E2746] hover:bg-white"
                  }`}
                >
                  <span>{tab.label}</span>
                  {results && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-[#EAE4F7] text-[#5851A4]"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Results List Body */}
          <div className="overflow-y-auto p-3 space-y-4 text-sm divide-y divide-[#EAE4F7]/60">
            {loading && !results ? (
              <div className="flex justify-center items-center py-8 text-[#5851A4] gap-2 font-medium">
                <Loader2 className="h-5 w-5 animate-spin text-[#4B63D2]" />
                <span className="text-xs">Searching campus network...</span>
              </div>
            ) : results && getCategoryCount("all") === 0 ? (
              <div className="text-center py-8 px-4 space-y-2">
                <div className="h-10 w-10 rounded-2xl bg-[#FAF9FD] border border-[#EAE4F7] flex items-center justify-center mx-auto text-[#9188BE]">
                  <Search className="h-5 w-5" />
                </div>
                <p className="text-sm font-bold text-[#1E2746]">
                  No matching results found
                </p>
                <p className="text-xs text-[#5851A4] max-w-xs mx-auto">
                  We couldn't find any students, alumni, faculty, posts, or opportunities matching "{query}".
                </p>
              </div>
            ) : results ? (
              <>
                {/* 1. People / Users Section */}
                {(category === "all" || category === "users") &&
                  uniqueUsers.length > 0 && (
                    <div className="space-y-2 pt-2 first:pt-0">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#5851A4] px-1">
                        <div className="flex items-center gap-1.5">
                          <UserIcon className="h-3.5 w-3.5 text-[#4B63D2]" />
                          <span>People ({uniqueUsers.length})</span>
                        </div>
                        <span className="text-[10px] text-[#9188BE] font-semibold">
                          Students • Alumni • Faculty
                        </span>
                      </div>
                      <div className="space-y-1">
                        {uniqueUsers.map((u: UserSearchResult) => {
                          const fullName =
                            u.first_name || u.last_name
                              ? `${u.first_name || ""} ${u.last_name || ""}`.trim()
                              : u.email.split("@")[0];
                          const roleLabel = getUserBadge(u);
                          const isFaculty = u.role_name?.toLowerCase().includes("faculty");
                          const isAlumni = u.role_name?.toLowerCase().includes("alumni");

                          return (
                            <div
                              key={`user-${u.id}`}
                              onClick={() => handleSelect(`/profile/${u.id}`)}
                              className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#FAF9FD] cursor-pointer group transition-all"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {u.profile_picture ? (
                                  <img
                                    src={getMediaUrl(u.profile_picture)}
                                    alt={fullName}
                                    className="h-9 w-9 rounded-xl object-cover border border-[#EAE4F7] shrink-0"
                                  />
                                ) : (
                                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#5851A4] to-[#4B63D2] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                                    {fullName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-xs sm:text-sm text-[#1E2746] group-hover:text-[#4B63D2] transition-colors truncate">
                                      {fullName}
                                    </p>
                                    {getRoleIcon(u.role_name)}
                                  </div>
                                  <span
                                    className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold mt-0.5 ${
                                      isFaculty
                                        ? "bg-purple-50 text-purple-700 border border-purple-200/80"
                                        : isAlumni
                                        ? "bg-blue-50 text-blue-700 border border-blue-200/80"
                                        : "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                                    }`}
                                  >
                                    {roleLabel}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-[#9188BE] group-hover:text-[#4B63D2] transition-all transform group-hover:translate-x-0.5 shrink-0 ml-2" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* 2. Posts & Projects Section */}
                {(category === "all" || category === "posts") &&
                  uniquePosts.length > 0 && (
                    <div className="space-y-2 pt-3 first:pt-0">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#5851A4] px-1">
                        <div className="flex items-center gap-1.5">
                          <Rss className="h-3.5 w-3.5 text-[#4B63D2]" />
                          <span>Posts & Projects ({uniquePosts.length})</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {uniquePosts.map((p: PostSearchResult) => {
                          const isProject = isProjectPost(p.content);
                          return (
                            <div
                              key={`post-${p.id}`}
                              onClick={() => handleSelect(`/feed`)}
                              className="p-2.5 rounded-2xl hover:bg-[#FAF9FD] cursor-pointer group transition-all space-y-1"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] text-[#5851A4] font-semibold truncate">
                                  By {p.author_name || "Campus Member"}
                                </span>
                                <span
                                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${
                                    isProject
                                      ? "bg-[#4B63D2]/10 text-[#4B63D2] border border-[#4B63D2]/20"
                                      : "bg-[#FAF9FD] text-[#5851A4] border border-[#EAE4F7]"
                                  }`}
                                >
                                  {isProject && <FolderGit2 className="w-3 h-3" />}
                                  {isProject ? "Project" : "Post"}
                                </span>
                              </div>
                              <p className="line-clamp-2 text-[#1E2746] text-xs font-medium group-hover:text-[#4B63D2] leading-relaxed">
                                {p.content}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* 3. Opportunities (Jobs / Internships) Section */}
                {(category === "all" || category === "jobs") &&
                  uniqueJobs.length > 0 && (
                    <div className="space-y-2 pt-3 first:pt-0">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#5851A4] px-1">
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 text-[#4B63D2]" />
                          <span>Opportunities ({uniqueJobs.length})</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {uniqueJobs.map((j: JobSearchResult) => (
                          <div
                            key={`job-${j.id}`}
                            onClick={() => handleSelect(`/jobs`)}
                            className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#FAF9FD] cursor-pointer group transition-all"
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <p className="font-bold text-xs sm:text-sm text-[#1E2746] group-hover:text-[#4B63D2] transition-colors truncate">
                                {j.title}
                              </p>
                              <p className="text-[11px] text-[#5851A4] font-medium truncate">
                                {j.company_name || "Campus Placement"} • {j.location || "On-Campus / Remote"}
                              </p>
                            </div>
                            <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#4B63D2]/10 text-[#4B63D2] font-bold border border-[#4B63D2]/20 shrink-0">
                              {j.job_type || "Opportunity"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 4. Events Section */}
                {(category === "all" || category === "events") &&
                  uniqueEvents.length > 0 && (
                    <div className="space-y-2 pt-3 first:pt-0">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#5851A4] px-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-[#4B63D2]" />
                          <span>Campus Events ({uniqueEvents.length})</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {uniqueEvents.map((e: EventSearchResult) => (
                          <div
                            key={`event-${e.id}`}
                            onClick={() => handleSelect(`/events`)}
                            className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#FAF9FD] cursor-pointer group transition-all"
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <p className="font-bold text-xs sm:text-sm text-[#1E2746] group-hover:text-[#4B63D2] transition-colors truncate">
                                {e.title}
                              </p>
                              <p className="text-[11px] text-[#5851A4] font-medium truncate">
                                {e.location || "Campus Auditorium"}
                              </p>
                            </div>
                            <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 shrink-0">
                              Event
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </>
            ) : null}
          </div>

          {/* Search Dropdown Footer Hint */}
          <div className="px-4 py-2.5 bg-[#FAF9FD] border-t border-[#EAE4F7] text-[11px] text-[#5851A4] flex justify-between items-center font-medium">
            <span>
              Press{" "}
              <kbd className="px-1.5 py-0.5 bg-white border border-[#D5CBEE] rounded-md text-[#1E2746] font-bold text-[10px]">
                Enter ↵
              </kbd>{" "}
              to open top result
            </span>
            <span>Click any item to view</span>
          </div>
        </div>
      )}
    </div>
  );
}
