import { useState, useEffect } from "react";
import {
  TrendingUp,
  Award,
  Eye,
  Heart,
  MessageCircle,
  Flame,
} from "lucide-react";
import { analyticsService, TrendingPost } from "../../services/analytics";

interface TrendingPostsWidgetProps {
  initialPosts?: TrendingPost[];
}

export default function TrendingPostsWidget({
  initialPosts,
}: TrendingPostsWidgetProps) {
  const [posts, setPosts] = useState<TrendingPost[]>(initialPosts || []);
  const [days, setDays] = useState<number>(7);
  const [isLoading, setIsLoading] = useState<boolean>(!initialPosts);

  useEffect(() => {
    if (initialPosts && days === 7) {
      setPosts(initialPosts);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    analyticsService
      .getTrendingPosts(5, days)
      .then((res) => {
        if (isMounted) {
          setPosts(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load trending posts:", err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [days, initialPosts]);

  const maxScore = Math.max(...posts.map((p) => p.score), 1);

  return (
    <div className="bg-slate-950/60 border border-slate-900 hover:border-slate-800/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md transition duration-300 flex flex-col justify-between">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.02] via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Trending Discussions
            </h3>
            <p className="text-xs text-slate-400">
              Highest scoring posts across the community
            </p>
          </div>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80">
          {[7, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-200 ${
                days === d
                  ? "bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              {d}D
            </button>
          ))}
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-3 relative z-10">
        {isLoading ? (
          <div className="py-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500" />
          </div>
        ) : posts.length > 0 ? (
          posts.map((post, idx) => {
            const scorePercent = Math.min(
              Math.round((post.score / maxScore) * 100),
              100,
            );
            return (
              <div
                key={post.post_id || idx}
                className="bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/80 rounded-xl p-4 transition duration-200 relative group overflow-hidden"
              >
                {/* Visual score progress bar in background */}
                <div
                  className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-amber-500/40 to-indigo-500/40 transition-all duration-500"
                  style={{ width: `${scorePercent}%` }}
                />

                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-indigo-600/20 text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                      {post.author_name ? post.author_name.charAt(0) : "U"}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white">
                        {post.author_name || "Anonymous"}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-2">
                        {post.created_at
                          ? new Date(post.created_at).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )
                          : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Award className="h-3 w-3" />
                    {post.score} pts
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 my-1.5 font-medium">
                  {post.content}
                </p>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/40">
                  <div className="flex gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3 text-indigo-400" /> {post.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3 text-emerald-400" />{" "}
                      {post.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3 text-pink-400" />{" "}
                      {post.comments}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold group-hover:text-indigo-400 transition">
                    #{idx + 1} Trending
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
            <TrendingUp className="h-8 w-8 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-500 text-xs italic">
              No trending conversations recorded for this period.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
