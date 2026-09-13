import { useState, useEffect } from "react";
import {
  Flame,
  MessageSquare,
  Heart,
  TrendingUp,
  User as UserIcon,
} from "lucide-react";
import {
  analyticsService,
  TrendingPost,
} from "../../services/analytics";

interface TrendingPostsWidgetProps {
  initialPosts?: TrendingPost[];
}

export default function TrendingPostsWidget({
  initialPosts = [],
}: TrendingPostsWidgetProps) {
  const [posts, setPosts] = useState<TrendingPost[]>(initialPosts);
  const [days, setDays] = useState<number>(7);
  const [isLoading, setIsLoading] = useState<boolean>(initialPosts.length === 0);

  useEffect(() => {
    // If we have initial posts and days is 7, use them
    if (initialPosts.length > 0 && days === 7) {
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
        console.error("Failed to fetch trending posts:", err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [days, initialPosts]);

  return (
    <div className="bg-white border border-[#EAE4F7] hover:border-[#D5CBEE] rounded-3xl p-6 shadow-sm relative overflow-hidden transition duration-300 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-black tracking-tight">
              Trending Discussions
            </h3>
            <p className="text-xs text-[#5851A4] font-medium">
              Highest scoring posts across the community
            </p>
          </div>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-1.5 bg-[#FAF9FD] p-1 rounded-2xl border border-[#EAE4F7]">
          {[7, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                days === d
                  ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30 font-bold"
                  : "text-[#5851A4] hover:text-[#1E2746] hover:bg-white"
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
            return (
              <div
                key={post.post_id}
                className="group p-3.5 bg-[#FAF9FD] hover:bg-[#F3EEFF] border border-[#EAE4F7] hover:border-[#D5CBEE] rounded-2xl transition duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left: Rank & Author & Snippet */}
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`h-7 w-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                      idx === 0
                        ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30"
                        : idx === 1
                          ? "bg-[#4B63D2] text-white shadow-sm shadow-[#4B63D2]/30"
                          : idx === 2
                            ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                            : "bg-white text-[#5851A4] border border-[#EAE4F7]"
                    }`}
                  >
                    #{idx + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-black flex items-center gap-1 truncate">
                        <UserIcon className="h-3.5 w-3.5 text-[#5851A4] shrink-0" />
                        {post.author_name || "Campus Member"}
                      </span>
                      <span className="text-[10px] text-[#5851A4] font-medium">
                        • {new Date(post.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <p className="text-xs text-[#5851A4] font-medium line-clamp-1 group-hover:text-[#1E2746] transition">
                      {post.content}
                    </p>
                  </div>
                </div>

                {/* Right: Metrics & Score Gauge */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-10 sm:pl-0">
                  <div className="flex items-center gap-3 text-xs text-[#5851A4]">
                    <span className="flex items-center gap-1 font-semibold">
                      <Heart className="h-3.5 w-3.5 text-rose-500" />
                      {post.likes}
                    </span>
                    <span className="flex items-center gap-1 font-semibold">
                      <MessageSquare className="h-3.5 w-3.5 text-indigo-500" />
                      {post.comments}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl">
                    <TrendingUp className="h-3 w-3 text-amber-600" />
                    <span className="text-xs font-black text-amber-700">
                      {post.score} pts
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed border-[#EAE4F7] rounded-2xl bg-[#FAF9FD]">
            <Flame className="h-8 w-8 text-[#9188BE] mb-2" />
            <p className="text-[#5851A4] text-xs font-medium italic">
              No trending discussions yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
