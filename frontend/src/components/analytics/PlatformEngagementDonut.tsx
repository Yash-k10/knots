// @ts-ignore
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { PieChart as PieIcon, Activity } from "lucide-react";
import { PlatformEngagementSummary } from "../../services/analytics";

interface PlatformEngagementDonutProps {
  summary: PlatformEngagementSummary | null;
}

const COLORS = ["#6366f1", "#10b981", "#ec4899", "#f59e0b"];

export default function PlatformEngagementDonut({
  summary,
}: PlatformEngagementDonutProps) {
  const likes = summary?.total_likes || 0;
  const comments = summary?.total_comments || 0;
  const postViews = summary?.total_post_views || 0;
  const profileViews = summary?.total_profile_views || 0;
  const total =
    summary?.total_engagement_actions ||
    likes + comments + postViews + profileViews;

  const data = [
    { name: "Post Views", value: postViews, color: COLORS[0] },
    { name: "Profile Views", value: profileViews, color: COLORS[1] },
    { name: "Likes", value: likes, color: COLORS[2] },
    { name: "Comments", value: comments, color: COLORS[3] },
  ];

  const hasData = total > 0 || data.some((item) => item.value > 0);

  return (
    <div className="bg-slate-950/60 border border-slate-900 hover:border-slate-800/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md transition duration-300 flex flex-col justify-between">
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/[0.02] via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <PieIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Platform Engagement
            </h3>
            <p className="text-xs text-slate-400">
              Distribution of community interaction events
            </p>
          </div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 px-3 py-1 rounded-xl text-xs font-bold text-slate-300">
          {total.toLocaleString()} Actions
        </div>
      </div>

      {/* Pie / Donut Chart */}
      <div className="h-[220px] w-full relative z-10 flex items-center justify-center">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="#0f172a"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const item = payload[0];
                    const pct =
                      total > 0
                        ? ((Number(item.value) / total) * 100).toFixed(1)
                        : 0;
                    return (
                      <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl px-4 py-2.5 shadow-2xl backdrop-blur-md">
                        <p className="text-xs font-bold text-white">
                          {item.name}
                        </p>
                        <p className="text-sm font-extrabold text-indigo-400 mt-0.5">
                          {item.value}{" "}
                          <span className="text-slate-400 text-xs">
                            ({pct}%)
                          </span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full border border-dashed border-slate-800 rounded-xl w-full">
            <Activity className="h-8 w-8 text-slate-700 mb-2" />
            <p className="text-slate-500 text-xs italic">
              No engagement data recorded yet.
            </p>
          </div>
        )}
      </div>

      {/* Legend & Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 relative z-10">
        {data.map((item) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div
              key={item.name}
              className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-2.5 text-center"
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span
                  className="h-2 w-2 rounded-full inline-block"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {item.name.split(" ")[0]}
                </span>
              </div>
              <p className="text-sm font-extrabold text-white">{item.value}</p>
              <span className="text-[9px] text-slate-500 font-semibold">
                {pct}% share
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
