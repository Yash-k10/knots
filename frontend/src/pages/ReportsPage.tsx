import { useState } from "react";
import {
  BarChart3,
  Download,
  GraduationCap,
  Users,
  Award,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<"placement" | "academic" | "activity" | "alumni">("placement");
  const [timeRange, setTimeRange] = useState("academic_year");
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownload = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4B63D2]/10 border border-[#4B63D2]/20 text-[#4B63D2] text-xs font-black">
            <BarChart3 className="h-4 w-4" /> Academic & Institutional Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1E2746] tracking-tight">
            Institutional Analytics & Reports
          </h1>
          <p className="text-[#5851A4] text-xs sm:text-sm max-w-xl font-medium">
            Generate formal batch-wise academic reports, placement outcome dossiers, event
            engagement summaries, and alumni network interaction statistics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="px-5 py-2.5 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white rounded-xl text-xs font-black transition-all shadow-md shadow-[#4B63D2]/25 flex items-center gap-2 cursor-pointer"
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-[#FFD21A]" /> Dossier Exported
              </>
            ) : (
              <>
                <Download className="h-4 w-4 text-[#FFD21A]" /> Export PDF / Excel Dossier
              </>
            )}
          </button>
        </div>
      </div>

      {/* Report Categories Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { id: "placement", label: "Placement & Drives", icon: Award, stat: "83.1% Outcome" },
          { id: "academic", label: "Cohort Performance", icon: GraduationCap, stat: "8.14 Avg CGPA" },
          { id: "activity", label: "Campus Engagement", icon: TrendingUp, stat: "94% Active" },
          { id: "alumni", label: "Alumni Ties", icon: Users, stat: "1,240 Mentors" },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = reportType === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setReportType(item.id as any)}
              className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                isActive
                  ? "bg-[#4B63D2] text-white border-[#4B63D2] shadow-md shadow-[#4B63D2]/20"
                  : "bg-white text-[#1E2746] border-[#EAE4F7] hover:border-[#C8B6E2] hover:bg-[#FAF9FD]"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`h-5 w-5 ${isActive ? "text-[#FFD21A]" : "text-[#4B63D2]"}`} />
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  isActive ? "bg-white/20 text-white" : "bg-[#4B63D2]/10 text-[#4B63D2]"
                }`}>
                  {item.stat}
                </span>
              </div>
              <h4 className="text-xs font-black">{item.label}</h4>
              <p className={`text-[10px] mt-1 ${isActive ? "text-white/80" : "text-[#5851A4]"}`}>
                Generate analytical breakdown
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Report Details View */}
      <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE4F7]">
          <div>
            <h3 className="text-base font-black text-[#1E2746] capitalize">
              {reportType} Comprehensive Analysis
            </h3>
            <p className="text-xs text-[#5851A4] font-medium mt-0.5">
              Audited data synthesized from campus databases and verification registries.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-[#FAF9FD] border border-[#D5CBEE] rounded-xl px-3 py-1.5 text-xs font-bold text-[#1E2746] focus:outline-none focus:border-[#4B63D2]"
            >
              <option value="academic_year">Academic Year 2025-2026</option>
              <option value="semester_1">Semester 1 (Autumn)</option>
              <option value="semester_2">Semester 2 (Spring)</option>
            </select>
          </div>
        </div>

        {/* Data Breakdown Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium">
            <thead className="bg-[#FAF9FD] text-[#5851A4] font-bold uppercase text-[10px] tracking-wider border-b border-[#EAE4F7]">
              <tr>
                <th className="py-3 px-4">Department Unit</th>
                <th className="py-3 px-4">Cohort Size</th>
                <th className="py-3 px-4">Benchmark Metric</th>
                <th className="py-3 px-4">Performance Index</th>
                <th className="py-3 px-4">Compliance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE4F7]">
              {[
                { dept: "Computer Science & Engineering", count: 180, metric: "92% Placement Rate", score: "96.4/100", status: "Exceeding Goals" },
                { dept: "Information Technology", count: 120, metric: "88% Placement Rate", score: "91.2/100", status: "On Target" },
                { dept: "Electronics & Communication", count: 140, metric: "81% Placement Rate", score: "87.0/100", status: "On Target" },
                { dept: "Data Science & AI", count: 90, metric: "94% Placement Rate", score: "98.1/100", status: "Exceeding Goals" },
                { dept: "Mechanical Engineering", count: 110, metric: "74% Placement Rate", score: "82.5/100", status: "Review Required" },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-[#FAF9FD]/50 transition">
                  <td className="py-3.5 px-4 font-black text-[#1E2746]">{row.dept}</td>
                  <td className="py-3.5 px-4 text-[#5851A4]">{row.count} Enrolled</td>
                  <td className="py-3.5 px-4 font-bold text-[#4B63D2]">{row.metric}</td>
                  <td className="py-3.5 px-4 font-black text-[#1E2746]">{row.score}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                      row.status.includes("Exceeding")
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : row.status.includes("Review")
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-indigo-50 text-indigo-700 border-indigo-200"
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
