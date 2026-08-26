import { useState } from "react";
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
} from "lucide-react";
import {
  ConnectionSuggestion,
  JobRecommendation,
  ContentRecommendation,
} from "../../services/ai";
import { getMediaUrl } from "../../services/api";
import { formatDate } from "../../utils/date";

interface AiRecommendationsHubProps {
  connectionSuggestions: ConnectionSuggestion[];
  jobRecommendations: JobRecommendation[];
  contentRecommendations: ContentRecommendation[];
}

export function AiRecommendationsHub({
  connectionSuggestions,
  jobRecommendations,
  contentRecommendations,
}: AiRecommendationsHubProps) {
  const [recCategory, setRecCategory] = useState<"peers" | "jobs" | "content">(
    "peers",
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setRecCategory("peers")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition border cursor-pointer ${
            recCategory === "peers"
              ? "bg-[#4B63D2] text-white border-[#4B63D2] shadow-sm"
              : "bg-white text-[#5851A4] border-[#EAE4F7] hover:border-[#C8B6E2] hover:bg-[#FAF9FD]"
          }`}
        >
          Peer Suggestions ({connectionSuggestions.length})
        </button>
        <button
          onClick={() => setRecCategory("jobs")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition border cursor-pointer ${
            recCategory === "jobs"
              ? "bg-[#4B63D2] text-white border-[#4B63D2] shadow-sm"
              : "bg-white text-[#5851A4] border-[#EAE4F7] hover:border-[#C8B6E2] hover:bg-[#FAF9FD]"
          }`}
        >
          Job Matches ({jobRecommendations.length})
        </button>
        <button
          onClick={() => setRecCategory("content")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition border cursor-pointer ${
            recCategory === "content"
              ? "bg-[#4B63D2] text-white border-[#4B63D2] shadow-sm"
              : "bg-white text-[#5851A4] border-[#EAE4F7] hover:border-[#C8B6E2] hover:bg-[#FAF9FD]"
          }`}
        >
          Feed Highlights ({contentRecommendations.length})
        </button>
      </div>

      {/* Peer Suggestions */}
      {recCategory === "peers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connectionSuggestions.length > 0 ? (
            connectionSuggestions.map((item) => {
              // Extract real name or clean handle from email
              const fullProfileName = `${item.first_name || ""} ${item.last_name || ""}`.trim();
              let displayName = fullProfileName;
              if (!displayName || displayName.toLowerCase() === "user" || displayName.toLowerCase() === "user user") {
                if (item.email) {
                  const raw = item.email.split("@")[0];
                  displayName = raw
                    .replace(/[_.-]+/g, " ")
                    .split(" ")
                    .filter(Boolean)
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ") || raw;
                } else if (item.first_name && item.first_name.toLowerCase() !== "user") {
                  displayName = item.first_name;
                } else {
                  displayName = `Peer #${item.user_id}`;
                }
              }

              const initialLetter = displayName.charAt(0).toUpperCase() || "P";

              return (
                <div
                  key={item.user_id}
                  className="bg-white border border-[#EAE4F7] hover:border-[#C8B6E2] rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between relative group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-[#C8B6E2]/25 border border-[#C8B6E2] text-[#4B63D2] flex items-center justify-center font-black text-base shadow-sm overflow-hidden">
                          {item.profile_picture ? (
                            <img
                              src={getMediaUrl(item.profile_picture)}
                              alt={displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            initialLetter
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#1E2746] leading-tight">
                            {displayName}
                          </h4>
                          <p className="text-xs text-[#5851A4] font-medium mt-0.5">
                            {item.department || "Student"}{" "}
                            {item.graduation_year
                              ? `'${item.graduation_year.toString().slice(-2)}`
                              : ""}
                          </p>
                        </div>
                      </div>

                      <div className="px-2.5 py-1 rounded-full bg-[#FFD21A]/20 border border-[#FFD21A]/50 text-[#1E2746] text-[11px] font-extrabold flex items-center gap-1 shrink-0">
                        <Zap className="h-3 w-3 text-[#5851A4] fill-[#5851A4]" />
                        {item.match_score}% Match
                      </div>
                    </div>


                  {item.bio && (
                    <p className="text-xs text-[#1E2746] line-clamp-2 mb-4 leading-relaxed italic font-medium">
                      "{item.bio}"
                    </p>
                  )}

                  <div className="bg-[#FAF9FD] border border-[#EAE4F7] rounded-xl p-3 mb-4 text-[11px] text-[#5851A4] leading-relaxed font-medium">
                    <span className="font-bold text-[#1E2746]">
                      Why recommended:{" "}
                    </span>
                    {item.reason}
                  </div>

                  {item.common_skills && item.common_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {item.common_skills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-white text-[#4B63D2] text-[10px] font-bold border border-[#EAE4F7]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <a
                  href="/connections"
                  className="w-full py-2.5 bg-[#4B63D2] hover:bg-[#3E53BE] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Connect Now
                </a>
              </div>
            );
          })
        ) : (
            <div className="col-span-full py-12 text-center border border-dashed border-[#D5CBEE] rounded-3xl bg-white">
              <Users className="h-10 w-10 text-[#B9B1D9] mx-auto mb-2" />
              <p className="text-[#5851A4] text-sm font-medium">
                No peer recommendations found right now.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Job Matches */}
      {recCategory === "jobs" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobRecommendations.length > 0 ? (
            jobRecommendations.map((job) => (
              <div
                key={job.job_id}
                className="bg-white border border-[#EAE4F7] hover:border-[#C8B6E2] rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between relative group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        {job.job_type || "Full Time"}
                      </span>
                      <h4 className="text-base font-bold text-[#1E2746] mt-2 leading-tight">
                        {job.title}
                      </h4>
                      <p className="text-xs text-[#5851A4] font-semibold mt-0.5">
                        {job.company_name || "Partner Company"}
                      </p>
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-[#FFD21A]/20 border border-[#FFD21A]/50 text-[#1E2746] text-[11px] font-extrabold flex items-center gap-1 shrink-0">
                      <Zap className="h-3 w-3 text-[#5851A4] fill-[#5851A4]" />
                      {job.match_score}% Match
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#5851A4] mb-4 font-medium">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[#4B63D2]" />{" "}
                        {job.location}
                      </span>
                    )}
                    {job.salary_range && (
                      <span className="text-[#1E2746] font-bold">
                        {job.salary_range}
                      </span>
                    )}
                  </div>

                  <div className="bg-[#FAF9FD] border border-[#EAE4F7] rounded-xl p-3 mb-4 text-[11px] text-[#5851A4] leading-relaxed font-medium">
                    <span className="font-bold text-[#1E2746]">
                      Matching details:{" "}
                    </span>
                    {job.reason}
                  </div>

                  {job.matching_skills && job.matching_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {job.matching_skills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200"
                        >
                          ✓ {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <a
                  href="/jobs"
                  className="w-full py-2.5 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Briefcase className="h-3.5 w-3.5 text-[#FFD21A]" /> View Opportunity
                </a>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center border border-dashed border-[#D5CBEE] rounded-3xl bg-white">
              <Briefcase className="h-10 w-10 text-[#B9B1D9] mx-auto mb-2" />
              <p className="text-[#5851A4] text-sm font-medium">
                No job recommendations tailored yet.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Feed Content Highlights */}
      {recCategory === "content" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contentRecommendations.length > 0 ? (
            contentRecommendations.map((post) => (
              <div
                key={post.post_id}
                className="bg-white border border-[#EAE4F7] hover:border-[#C8B6E2] rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-[#C8B6E2]/30 border border-[#C8B6E2] text-[#5851A4] flex items-center justify-center font-black text-xs">
                        {post.author_name?.[0] || "A"}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#1E2746] block">
                          {post.author_name || "Campus Member"}
                        </span>
                        <span className="text-[10px] text-[#9188BE] font-medium">
                          {post.created_at
                            ? formatDate(post.created_at)
                            : "Recent"}
                        </span>
                      </div>
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-[#FFD21A]/20 border border-[#FFD21A]/50 text-[#1E2746] text-[11px] font-extrabold flex items-center gap-1">
                      <Award className="h-3 w-3 text-[#5851A4]" />
                      {post.relevance_score} Score
                    </div>
                  </div>

                  <p className="text-xs text-[#1E2746] leading-relaxed line-clamp-3 mb-4 font-medium">
                    {post.content}
                  </p>

                  <div className="bg-[#FAF9FD] border border-[#EAE4F7] rounded-xl p-3 mb-4 text-[11px] text-[#5851A4] leading-relaxed font-medium">
                    <span className="font-bold text-[#1E2746]">
                      Topic match:{" "}
                    </span>
                    {post.reason}
                  </div>

                  {post.matched_topics && post.matched_topics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {post.matched_topics.map((topic, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-md bg-[#FAF9FD] text-[#4B63D2] text-[10px] font-bold border border-[#EAE4F7]"
                        >
                          #{topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#EAE4F7] text-xs text-[#5851A4]">
                  <div className="flex items-center gap-4 font-semibold">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5 text-rose-500" />{" "}
                      {post.like_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5 text-[#5851A4]" />{" "}
                      {post.comment_count}
                    </span>
                  </div>
                  <a
                    href="/feed"
                    className="text-[#4B63D2] hover:text-[#5851A4] font-bold flex items-center gap-1"
                  >
                    Read on Feed <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center border border-dashed border-[#D5CBEE] rounded-3xl bg-white">
              <MessageSquare className="h-10 w-10 text-[#B9B1D9] mx-auto mb-2" />
              <p className="text-[#5851A4] text-sm font-medium">
                No curated feed recommendations available right now.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
