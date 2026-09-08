import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Loader2,
  User,
  Rss,
  Briefcase,
  Calendar,
  ChevronRight,
} from "lucide-react";
import {
  searchApi,
  GlobalSearchResponse,
  UserSearchResult,
  PostSearchResult,
  JobSearchResult,
  EventSearchResult,
} from "../../services/search";

export default function GlobalSearchBar() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GlobalSearchResponse | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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
        const data = await searchApi.globalSearch(query, category);
        setResults(data);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, category]);

  const handleSelect = (path: string) => {
    setIsOpen(false);
    setQuery("");
    navigate(path);
  };

  const getCategoryCount = (cat: string): number => {
    if (!results) return 0;
    if (cat === "all") return results.total_results || 0;
    if (cat === "users") return results.users?.length || 0;
    if (cat === "posts") return results.posts?.length || 0;
    if (cat === "jobs") return results.jobs?.length || 0;
    if (cat === "events") return results.events?.length || 0;
    return 0;
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 h-4 w-4 text-[#9188BE]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder="Search students, alumni, posts, jobs, events..."
          aria-label="Global search across users, posts, jobs, and events"
          className="w-full bg-[#FAF9FD] border border-[#D5CBEE] rounded-xl pl-10 pr-10 py-2.5 text-sm font-medium text-[#1E2746] placeholder-[#9188BE] focus:bg-white focus:outline-none focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20 transition-all"
        />
        {loading ? (
          <Loader2 className="absolute right-3.5 h-4 w-4 text-[#4B63D2] animate-spin" />
        ) : query ? (
          <button
            onClick={() => {
              setQuery("");
              setResults(null);
            }}
            title="Clear search"
            className="absolute right-3.5 text-[#9188BE] hover:text-[#1E2746]"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#EAE4F7] rounded-2xl shadow-xl overflow-hidden z-50 max-h-[80vh] flex flex-col">
          {/* Category Filter Tabs */}
          <div className="flex border-b border-[#EAE4F7] bg-[#FAF9FD] p-1.5 gap-1.5 text-xs font-bold overflow-x-auto">
            {["all", "users", "posts", "jobs", "events"].map((cat) => {
              const count = getCategoryCount(cat);
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl capitalize transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    category === cat
                      ? "bg-[#4B63D2] text-white shadow-sm"
                      : "text-[#5851A4] hover:text-[#1E2746] hover:bg-white"
                  }`}
                >
                  <span>{cat}</span>
                  {results && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                        category === cat
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

          {/* Results List */}
          <div className="overflow-y-auto p-3 space-y-4 text-sm">
            {loading && !results ? (
              <div className="flex justify-center items-center py-6 text-[#5851A4] gap-2 font-medium">
                <Loader2 className="h-5 w-5 animate-spin text-[#4B63D2]" />
                <span>Searching platform...</span>
              </div>
            ) : results && results.total_results === 0 ? (
              <div className="text-center py-6 text-[#5851A4] font-medium">
                No matching results found for "{query}".
              </div>
            ) : results ? (
              <>
                {/* Users Section */}
                {(category === "all" || category === "users") &&
                  results.users &&
                  results.users.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#5851A4] mb-2 px-1">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-[#4B63D2]" />
                          <span>Users</span>
                        </div>
                        <span className="text-[10px] text-[#9188BE] font-semibold">
                          {results.users.length} match
                          {results.users.length > 1 ? "es" : ""}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {results.users.map((u: UserSearchResult) => (
                          <div
                            key={u.id}
                            onClick={() => handleSelect(`/profile/${u.id}`)}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FAF9FD] cursor-pointer group transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-xl bg-[#C8B6E2]/30 text-[#4B63D2] flex items-center justify-center font-black text-xs">
                                {u.first_name?.[0] || u.email[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-[#1E2746] group-hover:text-[#4B63D2] transition-colors">
                                  {u.first_name || u.last_name
                                    ? `${u.first_name || ""} ${u.last_name || ""}`.trim()
                                    : u.email}
                                </p>
                                <p className="text-xs text-[#5851A4]">
                                  {u.department || u.email}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-[#9188BE] group-hover:text-[#4B63D2] transition-all transform group-hover:translate-x-0.5" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Posts Section */}
                {(category === "all" || category === "posts") &&
                  results.posts &&
                  results.posts.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#5851A4] mb-2 px-1">
                        <div className="flex items-center gap-2">
                          <Rss className="h-3.5 w-3.5 text-[#4B63D2]" />
                          <span>Posts</span>
                        </div>
                        <span className="text-[10px] text-[#9188BE] font-semibold">
                          {results.posts.length} match
                          {results.posts.length > 1 ? "es" : ""}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {results.posts.map((p: PostSearchResult) => (
                          <div
                            key={p.id}
                            onClick={() => handleSelect(`/feed`)}
                            className="p-2.5 rounded-xl hover:bg-[#FAF9FD] cursor-pointer group transition-all"
                          >
                            <p className="text-xs text-[#5851A4] mb-1 font-semibold">
                              By {p.author_name || "Anonymous"}
                            </p>
                            <p className="line-clamp-2 text-[#1E2746] text-xs font-medium group-hover:text-[#4B63D2]">
                              {p.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Jobs Section */}
                {(category === "all" || category === "jobs") &&
                  results.jobs &&
                  results.jobs.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#5851A4] mb-2 px-1">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-3.5 w-3.5 text-[#4B63D2]" />
                          <span>Jobs & Opportunities</span>
                        </div>
                        <span className="text-[10px] text-[#9188BE] font-semibold">
                          {results.jobs.length} match
                          {results.jobs.length > 1 ? "es" : ""}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {results.jobs.map((j: JobSearchResult) => (
                          <div
                            key={j.id}
                            onClick={() => handleSelect(`/jobs`)}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FAF9FD] cursor-pointer group transition-all"
                          >
                            <div>
                              <p className="font-bold text-[#1E2746] group-hover:text-[#4B63D2] transition-colors">
                                {j.title}
                              </p>
                              <p className="text-xs text-[#5851A4]">
                                {j.company_name || "Company"} •{" "}
                                {j.location || "Remote"}
                              </p>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#4B63D2]/10 text-[#4B63D2] font-bold border border-[#4B63D2]/20">
                              {j.job_type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Events Section */}
                {(category === "all" || category === "events") &&
                  results.events &&
                  results.events.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#5851A4] mb-2 px-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-[#4B63D2]" />
                          <span>Events</span>
                        </div>
                        <span className="text-[10px] text-[#9188BE] font-semibold">
                          {results.events.length} match
                          {results.events.length > 1 ? "es" : ""}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {results.events.map((e: EventSearchResult) => (
                          <div
                            key={e.id}
                            onClick={() => handleSelect(`/events`)}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FAF9FD] cursor-pointer group transition-all"
                          >
                            <div>
                              <p className="font-bold text-[#1E2746] group-hover:text-[#4B63D2] transition-colors">
                                {e.title}
                              </p>
                              <p className="text-xs text-[#5851A4]">
                                {e.location || "Campus"}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-[#9188BE] group-hover:text-[#4B63D2]" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </>
            ) : null}
          </div>

          {/* Search Dropdown Footer Hint */}
          <div className="px-3 py-2 bg-[#FAF9FD] border-t border-[#EAE4F7] text-[11px] text-[#5851A4] flex justify-between items-center font-medium">
            <span>
              Press{" "}
              <kbd className="px-1.5 py-0.5 bg-white border border-[#D5CBEE] rounded-md text-[#1E2746] font-bold">
                ESC
              </kbd>{" "}
              to close
            </span>
            <span>Click any item to view details</span>
          </div>
        </div>
      )}
    </div>
  );
}
