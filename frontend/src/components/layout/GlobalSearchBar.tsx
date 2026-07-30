import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  X,
  Loader2,
  User,
  Rss,
  Briefcase,
  Calendar,
  ChevronRight,
} from 'lucide-react'
import {
  searchApi,
  GlobalSearchResponse,
  UserSearchResult,
  PostSearchResult,
  JobSearchResult,
  EventSearchResult,
} from '../../services/search'

export default function GlobalSearchBar() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<GlobalSearchResponse | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setResults(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setIsOpen(true)

    const timer = setTimeout(async () => {
      try {
        const data = await searchApi.globalSearch(query, category)
        setResults(data)
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, category])

  const handleSelect = (path: string) => {
    setIsOpen(false)
    setQuery('')
    navigate(path)
  }

  const getCategoryCount = (cat: string): number => {
    if (!results) return 0
    if (cat === 'all') return results.total_results || 0
    if (cat === 'users') return results.users?.length || 0
    if (cat === 'posts') return results.posts?.length || 0
    if (cat === 'jobs') return results.jobs?.length || 0
    if (cat === 'events') return results.events?.length || 0
    return 0
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder="Search users, posts, jobs, events..."
          aria-label="Global search across users, posts, jobs, and events"
          className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-9 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />
        {loading ? (
          <Loader2 className="absolute right-3 h-4 w-4 text-indigo-400 animate-spin" />
        ) : query ? (
          <button
            onClick={() => {
              setQuery('')
              setResults(null)
            }}
            title="Clear search"
            className="absolute right-3 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[80vh] flex flex-col">
          {/* Category Filter Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/60 p-1 gap-1 text-xs font-medium overflow-x-auto">
            {['all', 'users', 'posts', 'jobs', 'events'].map((cat) => {
              const count = getCategoryCount(cat)
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-md capitalize transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    category === cat
                      ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{cat}</span>
                  {results && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        category === cat
                          ? 'bg-indigo-800 text-indigo-100'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Results List */}
          <div className="overflow-y-auto p-3 space-y-4 text-sm">
            {loading && !results ? (
              <div className="flex justify-center items-center py-6 text-slate-400 gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                <span>Searching platform...</span>
              </div>
            ) : results && results.total_results === 0 ? (
              <div className="text-center py-6 text-slate-400">
                No matching results found for "{query}".
              </div>
            ) : results ? (
              <>
                {/* Users Section */}
                {(category === 'all' || category === 'users') &&
                  results.users && results.users.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-indigo-400" />
                          <span>Users</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-normal">
                          {results.users.length} match{results.users.length > 1 ? 'es' : ''}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {results.users.map((u: UserSearchResult) => (
                          <div
                            key={u.id}
                            onClick={() => handleSelect(`/profile/${u.id}`)}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 cursor-pointer group transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                                {u.first_name?.[0] || u.email[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-slate-100 group-hover:text-indigo-400 transition-colors">
                                  {u.first_name || u.last_name
                                    ? `${u.first_name || ''} ${u.last_name || ''}`.trim()
                                    : u.email}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {u.department || u.email}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 transition-all transform group-hover:translate-x-0.5" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Posts Section */}
                {(category === 'all' || category === 'posts') &&
                  results.posts && results.posts.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        <div className="flex items-center gap-2">
                          <Rss className="h-3.5 w-3.5 text-indigo-400" />
                          <span>Posts</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-normal">
                          {results.posts.length} match{results.posts.length > 1 ? 'es' : ''}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {results.posts.map((p: PostSearchResult) => (
                          <div
                            key={p.id}
                            onClick={() => handleSelect(`/feed`)}
                            className="p-2 rounded-lg hover:bg-slate-800 cursor-pointer group transition-all"
                          >
                            <p className="text-xs text-slate-400 mb-1">
                              By {p.author_name || 'Anonymous'}
                            </p>
                            <p className="line-clamp-2 text-slate-200 group-hover:text-indigo-300">
                              {p.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Jobs Section */}
                {(category === 'all' || category === 'jobs') &&
                  results.jobs && results.jobs.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-3.5 w-3.5 text-indigo-400" />
                          <span>Jobs & Internships</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-normal">
                          {results.jobs.length} match{results.jobs.length > 1 ? 'es' : ''}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {results.jobs.map((j: JobSearchResult) => (
                          <div
                            key={j.id}
                            onClick={() => handleSelect(`/jobs`)}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 cursor-pointer group transition-all"
                          >
                            <div>
                              <p className="font-medium text-slate-100 group-hover:text-indigo-400 transition-colors">
                                {j.title}
                              </p>
                              <p className="text-xs text-slate-400">
                                {j.company_name || 'Company'} • {j.location || 'Remote'}
                              </p>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {j.job_type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Events Section */}
                {(category === 'all' || category === 'events') &&
                  results.events && results.events.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                          <span>Events</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-normal">
                          {results.events.length} match{results.events.length > 1 ? 'es' : ''}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {results.events.map((e: EventSearchResult) => (
                          <div
                            key={e.id}
                            onClick={() => handleSelect(`/events`)}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 cursor-pointer group transition-all"
                          >
                            <div>
                              <p className="font-medium text-slate-100 group-hover:text-indigo-400 transition-colors">
                                {e.title}
                              </p>
                              <p className="text-xs text-slate-400">
                                {e.location || 'Campus'}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-400" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </>
            ) : null}
          </div>

          {/* Search Dropdown Footer Hint */}
          <div className="px-3 py-2 bg-slate-950 border-t border-slate-800/80 text-[11px] text-slate-500 flex justify-between items-center">
            <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">ESC</kbd> to close</span>
            <span>Click any item to view details</span>
          </div>
        </div>
      )}
    </div>
  )
}

