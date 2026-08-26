import { useState } from "react";
// @ts-ignore
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { Activity, Eye, Heart, MessageCircle } from "lucide-react";
import { PostEngagementResponse } from "../../services/analytics";

interface PostEngagementChartProps {
  engagement: PostEngagementResponse | null;
}

export default function PostEngagementChart({
  engagement,
}: PostEngagementChartProps) {
  const [activeMetric, setActiveMetric] = useState<
    "all" | "views" | "likes" | "comments"
  >("all");

  const totalViews = engagement?.total_views || 0;
  const totalLikes = engagement?.total_likes || 0;
  const totalComments = engagement?.total_comments || 0;
  const totalEngagements = totalLikes + totalComments;
  const engagementRate =
    totalViews > 0 ? ((totalEngagements / totalViews) * 100).toFixed(1) : "0.0";

  const rawPosts = engagement?.posts || [];
  const chartData = rawPosts.slice(0, 6).map((post, idx) => ({
    name: `Post #${post.post_id || idx + 1}`,
    snippet: post.content_snippet || "Untitled post",
    Views: post.views || 0,
    Likes: post.likes || 0,
    Comments: post.comments || 0,
  }));

  return (
    <div className="bg-slate-950/60 border border-slate-900 hover:border-slate-800/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md transition duration-300 flex flex-col justify-between">
      <div className="absolute inset-0 bg-gradient-to-tl from-indigo-500/[0.02] via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Post Engagement
            </h3>
            <p className="text-xs text-slate-400">
              Performance breakdown across your recent posts
            </p>
          </div>
        </div>

        {/* Metric Filter Badges */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80">
          {(["all", "views", "likes", "comments"] as const).map((metric) => (
            <button
              key={metric}
              onClick={() => setActiveMetric(metric)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all duration-200 ${
                activeMetric === metric
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              {metric}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-4 gap-3 mb-6 relative z-10">
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 text-center">
          <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400 w-fit mx-auto mb-1">
            <Eye className="h-4 w-4" />
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Views
          </span>
          <p className="text-base font-extrabold text-white mt-0.5">
            {totalViews}
          </p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 text-center">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 w-fit mx-auto mb-1">
            <Heart className="h-4 w-4" />
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Likes
          </span>
          <p className="text-base font-extrabold text-white mt-0.5">
            {totalLikes}
          </p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 text-center">
          <div className="p-1.5 bg-pink-500/10 rounded-lg text-pink-400 w-fit mx-auto mb-1">
            <MessageCircle className="h-4 w-4" />
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Comments
          </span>
          <p className="text-base font-extrabold text-white mt-0.5">
            {totalComments}
          </p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 text-center">
          <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 w-fit mx-auto mb-1">
            <Activity className="h-4 w-4" />
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Rate
          </span>
          <p className="text-base font-extrabold text-white mt-0.5">
            {engagementRate}%
          </p>
        </div>
      </div>

      {/* Recharts Bar Chart */}
      <div className="h-[250px] w-full relative z-10">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#273258"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#B9B1D9"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#364373" }}
              />
              <YAxis
                stroke="#B9B1D9"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload, label }: any) => {
                  if (active && payload && payload.length) {
                    const postInfo = payload[0].payload;
                    return (
                      <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-md max-w-xs">
                        <p className="text-xs font-bold text-white">{label}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mb-2">
                          {postInfo.snippet}
                        </p>
                        <div className="space-y-1 text-xs">
                          {payload.map((item: any) => (
                            <div
                              key={item.name}
                              className="flex items-center justify-between gap-4"
                            >
                              <span className="text-slate-300 flex items-center gap-1.5">
                                <span
                                  className="h-2 w-2 rounded-full inline-block"
                                  style={{ backgroundColor: item.color }}
                                />
                                {item.name}:
                              </span>
                              <span className="font-extrabold text-white">
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                iconType="circle"
              />
              {(activeMetric === "all" || activeMetric === "views") && (
                <Bar
                  dataKey="Views"
                  fill="#4B63D2"
                  radius={[4, 4, 0, 0]}
                  barSize={16}
                />
              )}
              {(activeMetric === "all" || activeMetric === "likes") && (
                <Bar
                  dataKey="Likes"
                  fill="#5851A4"
                  radius={[4, 4, 0, 0]}
                  barSize={16}
                />
              )}
              {(activeMetric === "all" || activeMetric === "comments") && (
                <Bar
                  dataKey="Comments"
                  fill="#FFD21A"
                  radius={[4, 4, 0, 0]}
                  barSize={16}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full border border-dashed border-slate-800 rounded-xl">
            <Activity className="h-8 w-8 text-slate-700 mb-2" />
            <p className="text-slate-500 text-xs italic">
              No engagement data available yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
