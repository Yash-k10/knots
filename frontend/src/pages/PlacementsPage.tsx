import { useState, useEffect, useMemo } from "react";
import {
  Award,
  Search,
  Building,
  DollarSign,
  Plus,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";
import { apiRequest } from "../services/api";

interface PlacedStudent {
  id: number;
  student_name: string;
  department: string;
  batch: string;
  company: string;
  package_lpa: number;
  role_offered: string;
  offer_date: string;
  status: "VERIFIED" | "PENDING_JOINING" | "ACCEPTED";
}

export default function PlacementsPage() {
  const [placements, setPlacements] = useState<PlacedStudent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Add Placement modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newDept, setNewDept] = useState("Computer Science");
  const [newCompany, setNewCompany] = useState("");
  const [newPackage, setNewPackage] = useState("");
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const users = await apiRequest<any[]>("/users?limit=50").catch(() => []);

        const companies = [
          "Google Cloud",
          "Microsoft",
          "Amazon AWS",
          "Deloitte",
          "Infosys",
          "TCS Digital",
          "Oracle",
          "Goldman Sachs",
        ];
        const depts = [
          "Computer Science",
          "Information Technology",
          "Electronics & Comm.",
          "Data Science",
        ];
        const roles = [
          "Software Development Engineer",
          "Cloud Architect",
          "Associate Consultant",
          "Data Engineer",
          "Systems Analyst",
        ];

        const mockList: PlacedStudent[] = (users || [])
          .slice(0, 18)
          .map((u: any, idx: number) => {
            const company = companies[idx % companies.length];
            const dept = u.profile?.department || depts[idx % depts.length];
            const pkg = Number((8.5 + ((idx * 2.1) % 24)).toFixed(1));
            return {
              id: idx + 1,
              student_name:
                `${u.profile?.first_name || u.email.split("@")[0]} ${u.profile?.last_name || ""}`.trim(),
              department: dept,
              batch: "2025",
              company,
              package_lpa: pkg,
              role_offered: roles[idx % roles.length],
              offer_date: "Aug 2026",
              status: idx % 3 === 0 ? "VERIFIED" : "ACCEPTED",
            };
          });

        setPlacements(mockList);
      } catch (err) {
        console.error("Failed to load placements data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredPlacements = useMemo(() => {
    return placements.filter((p) => {
      const matchSearch =
        p.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.role_offered.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = selectedDept === "ALL" || p.department === selectedDept;
      return matchSearch && matchDept;
    });
  }, [placements, searchQuery, selectedDept]);

  const handleAddPlacement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName || !newCompany || !newPackage) return;
    const newRecord: PlacedStudent = {
      id: Date.now(),
      student_name: newStudentName,
      department: newDept,
      batch: "2025",
      company: newCompany,
      package_lpa: parseFloat(newPackage) || 10,
      role_offered: newRole || "Software Engineer",
      offer_date: "Recent",
      status: "VERIFIED",
    };
    setPlacements([newRecord, ...placements]);
    setIsAddModalOpen(false);
    setNewStudentName("");
    setNewCompany("");
    setNewPackage("");
    setNewRole("");
  };

  const highestPackage = Math.max(...placements.map((p) => p.package_lpa), 32);
  const avgPackage = (
    placements.reduce((acc, p) => acc + p.package_lpa, 0) / (placements.length || 1)
  ).toFixed(1);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD21A]/20 border border-[#FFD21A]/40 text-[#1E2746] text-xs font-black">
            <Award className="h-4 w-4 text-[#5851A4]" /> TPO Placement Office
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1E2746] tracking-tight">
            Institutional Placement Registry
          </h1>
          <p className="text-[#5851A4] text-xs sm:text-sm max-w-xl font-medium">
            Campus recruitment tracking, corporate hiring partner registry, package
            analytics, and offer letters verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white rounded-xl text-xs font-black transition-all shadow-md shadow-[#4B63D2]/25 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4 text-[#FFD21A]" /> Record New Offer
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#5851A4] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Placed</span>
            <GraduationCap className="h-4 w-4 text-[#4B63D2]" />
          </div>
          <span className="text-2xl font-black text-[#1E2746]">{placements.length}</span>
          <p className="text-[10px] text-emerald-600 font-bold mt-1">2025-2026 Drive</p>
        </div>

        <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#5851A4] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Highest CTC</span>
            <Award className="h-4 w-4 text-[#FFD21A]" />
          </div>
          <span className="text-2xl font-black text-[#1E2746]">₹{highestPackage} LPA</span>
          <p className="text-[10px] text-indigo-600 font-bold mt-1">International Offer</p>
        </div>

        <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#5851A4] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Average CTC</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-[#1E2746]">₹{avgPackage} LPA</span>
          <p className="text-[10px] text-emerald-600 font-bold mt-1">+14% vs Previous Year</p>
        </div>

        <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#5851A4] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Recruiter Partners</span>
            <Building className="h-4 w-4 text-[#4B63D2]" />
          </div>
          <span className="text-2xl font-black text-[#1E2746]">42 Tier-1</span>
          <p className="text-[10px] text-emerald-600 font-bold mt-1">Active on Campus</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#EAE4F7] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9188BE]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search placed students by name, company, or job profile..."
            className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] transition font-medium"
          />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-[#1E2746] focus:outline-none focus:border-[#4B63D2] cursor-pointer"
        >
          <option value="ALL">All Departments</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Information Technology">Information Technology</option>
          <option value="Electronics & Comm.">Electronics & Comm.</option>
          <option value="Data Science">Data Science</option>
        </select>
      </div>

      {/* Placed Students Table */}
      <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium">
            <thead className="bg-[#FAF9FD] text-[#5851A4] font-bold uppercase text-[10px] tracking-wider border-b border-[#EAE4F7]">
              <tr>
                <th className="py-3 px-4">Student Candidate</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Company Partner</th>
                <th className="py-3 px-4">Role / Title</th>
                <th className="py-3 px-4">Package (CTC)</th>
                <th className="py-3 px-4">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE4F7]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading placement records...
                  </td>
                </tr>
              ) : filteredPlacements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No placement records found.
                  </td>
                </tr>
              ) : (
                filteredPlacements.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF9FD]/50 transition">
                    <td className="py-3.5 px-4 font-black text-[#1E2746]">
                      {p.student_name}
                    </td>
                    <td className="py-3.5 px-4 text-[#5851A4]">{p.department}</td>
                    <td className="py-3.5 px-4 font-bold text-[#4B63D2]">
                      {p.company}
                    </td>
                    <td className="py-3.5 px-4 text-[#1E2746] font-semibold">
                      {p.role_offered}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ₹{p.package_lpa} LPA
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Offer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-[#EAE4F7] shadow-2xl space-y-4">
            <h3 className="text-base font-black text-[#1E2746]">
              Record Placed Candidate
            </h3>
            <form onSubmit={handleAddPlacement} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1">
                  Student Name
                </label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. Yash Kulkarni"
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl p-2.5 text-xs text-[#1E2746] focus:outline-none focus:border-[#4B63D2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1E2746] mb-1">
                    Department
                  </label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl p-2.5 text-xs text-[#1E2746] focus:outline-none focus:border-[#4B63D2]"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Comm.">Electronics & Comm.</option>
                    <option value="Data Science">Data Science</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1E2746] mb-1">
                    Package (LPA)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newPackage}
                    onChange={(e) => setNewPackage(e.target.value)}
                    placeholder="e.g. 14.5"
                    className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl p-2.5 text-xs text-[#1E2746] focus:outline-none focus:border-[#4B63D2]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="e.g. Microsoft India"
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl p-2.5 text-xs text-[#1E2746] focus:outline-none focus:border-[#4B63D2]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1">
                  Role Offered
                </label>
                <input
                  type="text"
                  required
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="e.g. Software Engineer - Cloud"
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl p-2.5 text-xs text-[#1E2746] focus:outline-none focus:border-[#4B63D2]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#EAE4F7]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-[#FAF9FD] text-[#5851A4] font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4B63D2] text-white font-bold text-xs rounded-xl"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
