import { Users, Briefcase, MessageSquare, Activity } from "lucide-react";
import { SystemStats, ProfileViewsResponse } from "../../services/analytics";
import {
  ConnectionSuggestion,
  JobRecommendation,
  ContentRecommendation,
} from "../../services/ai";

interface ActivitySummaryCardsProps {
  stats: SystemStats | null;
  profileViews: ProfileViewsResponse | null;
  connectionSuggestions: ConnectionSuggestion[];
  jobRecommendations: JobRecommendation[];
  contentRecommendations: ContentRecommendation[];
}

export function ActivitySummaryCards({
  stats,
  profileViews,
  connectionSuggestions,
  jobRecommendations,
  contentRecommendations,
}: ActivitySummaryCardsProps) {
  const summaryCards = [
    {
      title: "AI Peer Matches",
      value: connectionSuggestions.length.toString(),
      desc: `Out of ${stats?.total_users || 0} active members`,
      icon: Users,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      gradient: "from-indigo-500/10 via-transparent to-transparent",
    },
    {
      title: "Job Recommendations",
      value: jobRecommendations.length.toString(),
      desc: `From ${stats?.total_jobs || 0} active opportunities`,
      icon: Briefcase,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      gradient: "from-emerald-500/10 via-transparent to-transparent",
    },
    {
      title: "Curated Discussions",
      value: contentRecommendations.length.toString(),
      desc: `Selected from ${stats?.total_posts || 0} posts`,
      icon: MessageSquare,
      color: "text-pink-400 bg-pink-500/10 border-pink-500/20",
      gradient: "from-pink-500/10 via-transparent to-transparent",
    },
    {
      title: "Profile Activity",
      value: (profileViews?.total_views || 0).toLocaleString(),
      desc: "Total profile visits this week",
      icon: Activity,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      gradient: "from-amber-500/10 via-transparent to-transparent",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {summaryCards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-slate-950/70 border border-slate-900 hover:border-slate-800/80 rounded-2xl p-6 hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 relative group overflow-hidden backdrop-blur-md"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-tr ${card.gradient} opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none`}
            />
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                  {card.title}
                </p>
                <p className="text-3xl font-black text-white mt-2 tracking-tight">
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-2xl border ${card.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4 relative z-10">
              {card.desc}
            </p>
          </div>
        );
      })}
    </div>
  );
}
