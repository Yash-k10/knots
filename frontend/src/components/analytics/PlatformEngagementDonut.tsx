// @ts-ignore
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { PieChart as PieIcon, Activity } from "lucide-react";
import { PlatformEngagementSummary } from "../../services/analytics";

interface PlatformEngagementDonutProps {
  summary: PlatformEngagementSummary | null;
}

const COLORS = ["#4B63D2", "#5851A4", "#FFD21A", "#10B981"];

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
    <div className="bg-white border border-[#EAE4F7] hover:border-[#D5CBEE] rounded-3xl p-6 shadow-sm relative overflow-hidden transition duration-300 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-[#4B63D2]/10 text-[#4B63D2] rounded-2xl border border-[#4B63D2]/20">
            <PieIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-black tracking-tight">
              Platform Engagement
            </h3>
            <p className="text-xs text-[#5851A4] font-medium">
              Distribution of community interaction events
            </p>
          </div>
        </div>
        <div className="bg-[#FAF9FD] border border-[#EAE4F7] px-3 py-1 rounded-xl text-xs font-black text-black">
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
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const item = payload[0];
                    const percent =
                      total > 0
                        ? ((item.value / total) * 100).toFixed(1)
                        : "0.0";
                    return (
                      <div className="bg-white border border-[#EAE4F7] rounded-2xl p-3 shadow-xl">
                        <p className="text-xs font-bold text-[#5851A4]">
                          {item.name}
                        </p>
                        <p className="text-base font-black text-black mt-0.5 flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full inline-block"
                            style={{ backgroundColor: item.payload.color }}
                          />
                          {item.value.toLocaleString()}{" "}
                          <span className="text-xs font-normal text-[#5851A4]">
                            ({percent}%)
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
          <div className="flex flex-col items-center justify-center h-full border border-dashed border-[#EAE4F7] rounded-2xl bg-[#FAF9FD]">
            <Activity className="h-8 w-8 text-[#9188BE] mb-2" />
            <p className="text-[#5851A4] text-xs font-medium italic">
              No platform engagement recorded yet.
            </p>
          </div>
        )}
      </div>

      {/* Legend Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-4 border-t border-[#EAE4F7] relative z-10">
        {data.map((item, idx) => {
          const percent =
            total > 0 ? ((item.value / total) * 100).toFixed(0) : "0";
          return (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-xl bg-[#FAF9FD] border border-[#EAE4F7]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-bold text-[#1E2746] truncate">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs font-black text-black">
                  {item.value}
                </span>
                <span className="text-[10px] text-[#5851A4]">
                  ({percent}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
