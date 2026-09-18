import { useState } from "react";
import {
  Building,
  GraduationCap,
  Users,
  Award,
  TrendingUp,
  Sparkles,
  Globe,
  Send,
  CheckCircle2,
} from "lucide-react";
import { apiRequest } from "../services/api";

export default function InstitutionOverview() {
  const [directiveText, setDirectiveText] = useState("");
  const [directiveSent, setDirectiveSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePostDirective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directiveText.trim()) return;
    
    setIsSubmitting(true);
    try {
      await apiRequest("/posts", {
        method: "POST",
        body: JSON.stringify({
          content: `**Institutional Directive:**\n\n${directiveText.trim()}`,
          visibility: "BROADCAST",
        }),
      });
      setDirectiveSent(true);
      setTimeout(() => {
        setDirectiveSent(false);
        setDirectiveText("");
      }, 3000);
    } catch (err) {
      console.error("Failed to broadcast directive", err);
      alert("Failed to broadcast directive. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4B63D2]/10 border border-[#4B63D2]/20 text-[#4B63D2] text-xs font-black">
            <Building className="h-4 w-4" /> Executive Leadership Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1E2746] tracking-tight">
            Institutional Strategic Overview
          </h1>
          <p className="text-[#5851A4] text-xs sm:text-sm max-w-xl font-medium">
            High-level executive metrics for Deans, Principal, and CEO across campus
            operations, academic excellence, accreditation health, and strategic growth.
          </p>
        </div>

        <div className="bg-[#FAF9FD] px-5 py-3 rounded-2xl border border-[#EAE4F7] text-center">
          <span className="text-xs font-bold text-[#5851A4] block">Accreditation Score</span>
          <span className="text-xl font-black text-[#1E2746]">
            NAAC A++ <span className="text-emerald-600 text-sm">(3.74 CGPA)</span>
          </span>
        </div>
      </div>

      {/* Strategic KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#5851A4] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Campus Population</span>
            <GraduationCap className="h-4 w-4 text-[#4B63D2]" />
          </div>
          <span className="text-2xl font-black text-[#1E2746]">3,420</span>
          <p className="text-[10px] text-emerald-600 font-bold mt-1">98.4% Retention Rate</p>
        </div>

        <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#5851A4] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Academic Faculty</span>
            <Users className="h-4 w-4 text-[#4B63D2]" />
          </div>
          <span className="text-2xl font-black text-[#1E2746]">184 Staff</span>
          <p className="text-[10px] text-emerald-600 font-bold mt-1">68% PhD Holders</p>
        </div>

        <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#5851A4] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Placement Aggregate</span>
            <Award className="h-4 w-4 text-[#FFD21A]" />
          </div>
          <span className="text-2xl font-black text-[#1E2746]">86.2%</span>
          <p className="text-[10px] text-emerald-600 font-bold mt-1">₹8.4 LPA Avg CTC</p>
        </div>

        <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#5851A4] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Funded Research</span>
            <Globe className="h-4 w-4 text-[#4B63D2]" />
          </div>
          <span className="text-2xl font-black text-[#1E2746]">₹4.2 Cr</span>
          <p className="text-[10px] text-indigo-600 font-bold mt-1">12 Government Grants</p>
        </div>
      </div>

      {/* Leadership Directive Broadcast Widget */}
      <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-black text-[#1E2746] flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#4B63D2]" /> Broadcast Institutional Directive / Campus Address
        </h3>
        <p className="text-xs text-[#5851A4] font-medium">
          Direct communication from Executive Leadership to entire campus or specific department heads.
        </p>

        {directiveSent ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-700 text-xs font-bold animate-in fade-in duration-200">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            Institutional directive broadcasted across campus feed and notifications!
          </div>
        ) : (
          <form onSubmit={handlePostDirective} className="space-y-3">
            <textarea
              rows={3}
              value={directiveText}
              onChange={(e) => setDirectiveText(e.target.value)}
              placeholder="State institutional announcement, strategic policy change, or commencement address..."
              className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl p-3 text-xs text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] transition font-medium"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!directiveText.trim() || isSubmitting}
                className="px-5 py-2.5 bg-[#4B63D2] hover:bg-[#3E53BE] disabled:opacity-50 text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Send className="h-4 w-4" /> Issue Campus Directive
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Department Comparison Matrix */}
      <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-black text-[#1E2746] flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#4B63D2]" /> Departmental Strategic Benchmark Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium">
            <thead className="bg-[#FAF9FD] text-[#5851A4] font-bold uppercase text-[10px] tracking-wider border-b border-[#EAE4F7]">
              <tr>
                <th className="py-3 px-4">Academic Division</th>
                <th className="py-3 px-4">Head of Department</th>
                <th className="py-3 px-4">Student Enrolment</th>
                <th className="py-3 px-4">Placement Outcome</th>
                <th className="py-3 px-4">Research Publications</th>
                <th className="py-3 px-4">Strategic Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE4F7]">
              {[
                { name: "Computer Science & Eng.", hod: "Dr. Arvind Sharma", students: 620, placement: "92.4%", research: "42 Papers", status: "Optimal" },
                { name: "Information Technology", hod: "Dr. Sanjay Deshmukh", students: 480, placement: "88.1%", research: "28 Papers", status: "Optimal" },
                { name: "Electronics & Communication", hod: "Dr. Kavita Joshi", students: 510, placement: "81.6%", research: "34 Papers", status: "Good" },
                { name: "Data Science & AI", hod: "Dr. Meenakshi Rao", students: 360, placement: "94.5%", research: "19 Papers", status: "Optimal" },
                { name: "Mechanical Engineering", hod: "Dr. Prakash Mane", students: 440, placement: "74.2%", research: "22 Papers", status: "Focus Area" },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-[#FAF9FD]/50 transition">
                  <td className="py-3.5 px-4 font-black text-[#1E2746]">{row.name}</td>
                  <td className="py-3.5 px-4 text-[#5851A4] font-semibold">{row.hod}</td>
                  <td className="py-3.5 px-4 font-bold text-[#1E2746]">{row.students}</td>
                  <td className="py-3.5 px-4 font-black text-[#4B63D2]">{row.placement}</td>
                  <td className="py-3.5 px-4 text-[#5851A4]">{row.research}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                      row.status === "Optimal"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : row.status === "Good"
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
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
