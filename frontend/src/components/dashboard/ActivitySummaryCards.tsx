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
      color: "text-[#4B63D2] bg-[#4B63D2]/15 border-[#4B63D2]/30",
      gradient: "from-[#4B63D2]/15 via-transparent to-transparent",
    },
    {
      title: "Job Recommendations",
      value: jobRecommendations.length.toString(),
      desc: `From ${stats?.total_jobs || 0} active opportunities`,
      icon: Briefcase,
      color: "text-[#FFD21A] bg-[#FFD21A]/15 border-[#FFD21A]/30",
      gradient: "from-[#FFD21A]/15 via-transparent to-transparent",
    },
    {
      title: "Curated Discussions",
      value: contentRecommendations.length.toString(),
      desc: `Selected from ${stats?.total_posts || 0} posts`,
      icon: MessageSquare,
      color: "text-[#C8B6E2] bg-[#5851A4]/25 border-[#5851A4]/40",
      gradient: "from-[#5851A4]/20 via-transparent to-transparent",
    },
    {
      title: "Profile Activity",
      value: (profileViews?.total_views || 0).toLocaleString(),
      desc: "Total profile visits this week",
      icon: Activity,
      color: "text-[#FFD21A] bg-[#5851A4]/20 border-[#C8B6E2]/30",
      gradient: "from-[#C8B6E2]/15 via-transparent to-transparent",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {summaryCards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-white border border-[#EAE4F7] hover:border-[#C8B6E2] rounded-3xl p-6 hover:shadow-md hover:scale-[1.01] transition-all duration-300 relative group overflow-hidden shadow-sm"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-tr ${card.gradient} opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none`}
            />
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[#5851A4] text-xs font-bold uppercase tracking-wider">
                  {card.title}
                </p>
                <p className="text-3xl font-black text-[#1E2746] mt-2 tracking-tight">
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-2xl border ${card.color} shadow-sm`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs text-[#5851A4]/80 mt-4 relative z-10 font-medium">
              {card.desc}
            </p>
          </div>
        );
      })}
    </div>
  );
}
