import { useState } from 'react'
import {
  Users,
  Briefcase,
  MessageSquare,
  Zap,
  UserPlus,
  MapPin,
  Award,
  Heart,
  MessageCircle,
  ArrowUpRight,
} from 'lucide-react'
import {
  ConnectionSuggestion,
  JobRecommendation,
  ContentRecommendation,
} from '../../services/ai'

interface AiRecommendationsHubProps {
  connectionSuggestions: ConnectionSuggestion[]
  jobRecommendations: JobRecommendation[]
  contentRecommendations: ContentRecommendation[]
}

export function AiRecommendationsHub({
  connectionSuggestions,
  jobRecommendations,
  contentRecommendations,
}: AiRecommendationsHubProps) {
  const [recCategory, setRecCategory] = useState<'peers' | 'jobs' | 'content'>('peers')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setRecCategory('peers')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition border ${
            recCategory === 'peers'
              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
              : 'bg-slate-950 text-slate-400 border-slate-900 hover:border-slate-800'
          }`}
        >
          Peer Suggestions ({connectionSuggestions.length})
        </button>
        <button
          onClick={() => setRecCategory('jobs')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition border ${
            recCategory === 'jobs'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-slate-950 text-slate-400 border-slate-900 hover:border-slate-800'
          }`}
        >
          Job Matches ({jobRecommendations.length})
        </button>
        <button
          onClick={() => setRecCategory('content')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition border ${
            recCategory === 'content'
              ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
              : 'bg-slate-950 text-slate-400 border-slate-900 hover:border-slate-800'
          }`}
        >
          Feed Highlights ({contentRecommendations.length})
        </button>
      </div>

      {/* Peer Suggestions */}
      {recCategory === 'peers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connectionSuggestions.length > 0 ? (
            connectionSuggestions.map((item) => (
              <div
                key={item.user_id}
                className="bg-slate-950/50 border border-slate-900 hover:border-indigo-500/30 rounded-2xl p-6 backdrop-blur-md transition duration-300 flex flex-col justify-between relative group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-base shadow-inner overflow-hidden">
                        {item.profile_picture ? (
                          <img
                            src={item.profile_picture}
                            alt={item.first_name || 'User'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (item.first_name?.[0] || 'U')
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white leading-tight">
                          {item.first_name || 'User'} {item.last_name || ''}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {item.department || 'Student'}{' '}
                          {item.graduation_year ? `'${item.graduation_year.toString().slice(-2)}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[11px] font-extrabold flex items-center gap-1 shrink-0">
                      <Zap className="h-3 w-3 text-amber-400 fill-amber-400" />
                      {item.match_score}% Match
                    </div>
                  </div>

                  {item.bio && (
                    <p className="text-xs text-slate-300 line-clamp-2 mb-4 leading-relaxed italic">
                      "{item.bio}"
                    </p>
                  )}

                  <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 mb-4 text-[11px] text-indigo-200/90 leading-relaxed">
                    <span className="font-semibold text-indigo-300">Why recommended: </span>
                    {item.reason}
                  </div>

                  {item.common_skills && item.common_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {item.common_skills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 text-[10px] font-medium border border-slate-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <a
                  href="/connections"
                  className="w-full py-2 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-md"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Connect Now
                </a>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center border border-dashed border-slate-800 rounded-2xl">
              <Users className="h-10 w-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No peer recommendations found right now.</p>
            </div>
          )}
        </div>
      )}

      {/* Job Matches */}
      {recCategory === 'jobs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobRecommendations.length > 0 ? (
            jobRecommendations.map((job) => (
              <div
                key={job.job_id}
                className="bg-slate-950/50 border border-slate-900 hover:border-emerald-500/30 rounded-2xl p-6 backdrop-blur-md transition duration-300 flex flex-col justify-between relative group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        {job.job_type || 'Full Time'}
                      </span>
                      <h4 className="text-base font-bold text-white mt-2 leading-tight">
                        {job.title}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {job.company_name || 'Partner Company'}
                      </p>
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-extrabold flex items-center gap-1 shrink-0">
                      <Zap className="h-3 w-3 text-amber-400 fill-amber-400" />
                      {job.match_score}% Match
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-4">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-500" /> {job.location}
                      </span>
                    )}
                    {job.salary_range && (
                      <span className="text-slate-300 font-semibold">{job.salary_range}</span>
                    )}
                  </div>

                  <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 mb-4 text-[11px] text-emerald-200/90 leading-relaxed">
                    <span className="font-semibold text-emerald-300">Matching details: </span>
                    {job.reason}
                  </div>

                  {job.matching_skills && job.matching_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {job.matching_skills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-emerald-950/40 text-emerald-300 text-[10px] font-medium border border-emerald-900/50"
                        >
                          ✓ {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <a
                  href="/jobs"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Briefcase className="h-3.5 w-3.5" /> View Opportunity
                </a>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center border border-dashed border-slate-800 rounded-2xl">
              <Briefcase className="h-10 w-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No job recommendations tailored yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Feed Content Highlights */}
      {recCategory === 'content' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contentRecommendations.length > 0 ? (
            contentRecommendations.map((post) => (
              <div
                key={post.post_id}
                className="bg-slate-950/50 border border-slate-900 hover:border-pink-500/30 rounded-2xl p-6 backdrop-blur-md transition duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-pink-600/20 border border-pink-500/30 text-pink-400 flex items-center justify-center font-bold text-xs">
                        {post.author_name?.[0] || 'A'}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {post.author_name || 'Campus Member'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-[11px] font-extrabold flex items-center gap-1">
                      <Award className="h-3 w-3 text-pink-400" />
                      {post.relevance_score} Score
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed line-clamp-3 mb-4">
                    {post.content}
                  </p>

                  <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 mb-4 text-[11px] text-pink-200/90 leading-relaxed">
                    <span className="font-semibold text-pink-300">Topic match: </span>
                    {post.reason}
                  </div>

                  {post.matched_topics && post.matched_topics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {post.matched_topics.map((topic, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-slate-900 text-pink-300 text-[10px] font-medium border border-slate-800"
                        >
                          #{topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-900 text-xs text-slate-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5 text-pink-500" /> {post.like_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5 text-slate-400" /> {post.comment_count}
                    </span>
                  </div>
                  <a href="/feed" className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
                    Read on Feed <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center border border-dashed border-slate-800 rounded-2xl">
              <MessageSquare className="h-10 w-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No curated feed recommendations available right now.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
