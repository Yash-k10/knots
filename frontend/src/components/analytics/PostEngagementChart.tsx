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
    <div className="bg-white border border-[#EAE4F7] hover:border-[#D5CBEE] rounded-3xl p-6 shadow-sm relative overflow-hidden transition duration-300 flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-[#4B63D2]/10 text-[#4B63D2] rounded-2xl border border-[#4B63D2]/20">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-black tracking-tight">
              Post Engagement
            </h3>
            <p className="text-xs text-[#5851A4] font-medium">
              Performance breakdown across your recent posts
            </p>
          </div>
        </div>

        {/* Metric Filter Badges */}
        <div className="flex items-center gap-1.5 bg-[#FAF9FD] p-1 rounded-2xl border border-[#EAE4F7]">
          {(["all", "views", "likes", "comments"] as const).map((metric) => (
            <button
              key={metric}
              onClick={() => setActiveMetric(metric)}
              className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all duration-200 cursor-pointer ${
                activeMetric === metric
                  ? "bg-[#4B63D2] text-white shadow-sm shadow-[#4B63D2]/30"
                  : "text-[#5851A4] hover:text-[#1E2746] hover:bg-white"
              }`}
            >
              {metric}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-4 gap-3 mb-6 relative z-10">
        <div className="bg-[#FAF9FD] border border-[#EAE4F7] rounded-2xl p-3 text-center">
          <div className="p-1.5 bg-[#4B63D2]/10 rounded-xl text-[#4B63D2] w-fit mx-auto mb-1">
            <Eye className="h-4 w-4" />
          </div>
          <span className="text-[10px] uppercase font-bold text-[#5851A4] tracking-wider">
            Views
          </span>
          <p className="text-base font-black text-black mt-0.5">
            {totalViews}
          </p>
        </div>
        <div className="bg-[#FAF9FD] border border-[#EAE4F7] rounded-2xl p-3 text-center">
          <div className="p-1.5 bg-emerald-500/10 rounded-xl text-emerald-600 w-fit mx-auto mb-1">
            <Heart className="h-4 w-4" />
          </div>
          <span className="text-[10px] uppercase font-bold text-[#5851A4] tracking-wider">
            Likes
          </span>
          <p className="text-base font-black text-black mt-0.5">
            {totalLikes}
          </p>
        </div>
        <div className="bg-[#FAF9FD] border border-[#EAE4F7] rounded-2xl p-3 text-center">
          <div className="p-1.5 bg-pink-500/10 rounded-xl text-pink-500 w-fit mx-auto mb-1">
            <MessageCircle className="h-4 w-4" />
          </div>
          <span className="text-[10px] uppercase font-bold text-[#5851A4] tracking-wider">
            Comments
          </span>
          <p className="text-base font-black text-black mt-0.5">
            {totalComments}
          </p>
        </div>
        <div className="bg-[#FAF9FD] border border-[#EAE4F7] rounded-2xl p-3 text-center">
          <div className="p-1.5 bg-indigo-500/10 rounded-xl text-indigo-600 w-fit mx-auto mb-1">
            <Activity className="h-4 w-4" />
          </div>
          <span className="text-[10px] uppercase font-bold text-[#5851A4] tracking-wider">
            Rate
          </span>
          <p className="text-base font-black text-black mt-0.5">
            {engagementRate}%
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="h-[250px] w-full relative z-10">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#EAE4F7"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#5851A4"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#EAE4F7" }}
              />
              <YAxis
                stroke="#5851A4"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload, label }: any) => {
                  if (active && payload && payload.length) {
                    const post = chartData.find((p) => p.name === label);
                    return (
                      <div className="bg-white border border-[#EAE4F7] rounded-2xl p-3.5 shadow-xl max-w-xs">
                        <p className="text-xs font-black text-black">
                          {label}
                        </p>
                        {post?.snippet && (
                          <p className="text-[11px] text-[#5851A4] italic line-clamp-2 mt-1 mb-2 font-medium">
                            "{post.snippet}"
                          </p>
                        )}
                        <div className="space-y-1">
                          {payload.map((entry: any, index: number) => (
                            <div
                              key={`item-${index}`}
                              className="flex items-center justify-between text-xs gap-4"
                            >
                              <span
                                className="font-semibold flex items-center gap-1.5"
                                style={{ color: entry.color }}
                              >
                                <span
                                  className="h-2 w-2 rounded-full inline-block"
                                  style={{ backgroundColor: entry.color }}
                                />
                                {entry.name}:
                              </span>
                              <span className="font-black text-black">
                                {entry.value}
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
                wrapperStyle={{
                  paddingTop: "10px",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              />
              {(activeMetric === "all" || activeMetric === "views") && (
                <Bar
                  dataKey="Views"
                  fill="#4B63D2"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={30}
                />
              )}
              {(activeMetric === "all" || activeMetric === "likes") && (
                <Bar
                  dataKey="Likes"
                  fill="#10B981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={30}
                />
              )}
              {(activeMetric === "all" || activeMetric === "comments") && (
                <Bar
                  dataKey="Comments"
                  fill="#EC4899"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={30}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full border border-dashed border-[#EAE4F7] rounded-2xl bg-[#FAF9FD]">
            <Activity className="h-8 w-8 text-[#9188BE] mb-2" />
            <p className="text-[#5851A4] text-xs font-medium italic">
              No post activity recorded yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
