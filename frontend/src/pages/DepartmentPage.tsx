import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Layers,
  Users,
  GraduationCap,
  Award,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { apiRequest } from "../services/api";

interface FacultyMember {
  id: number;
  name: string;
  designation: string;
  department: string;
  specialization: string;
  email: string;
  profile_picture?: string | null;
  courses: string[];
}

export default function DepartmentPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "faculty" | "students" | "courses">("overview");
  const [selectedDept, setSelectedDept] = useState("Computer Science & Engineering");

  useEffect(() => {
    async function loadUserData() {
      try {
        const user = await apiRequest<any>("/users/me");
        if (user?.profile?.department) {
          setSelectedDept(user.profile.department);
        }
      } catch (err) {
        console.error("Failed to fetch user in department page", err);
      }
    }
    loadUserData();
  }, []);

  const departments = [
    "Computer Science & Engineering",
    "Information Technology",
    "Electronics & Communication",
    "Data Science & AI",
    "Mechanical Engineering",
    "Civil Engineering",
  ];

  const facultyList: FacultyMember[] = [
    {
      id: 101,
      name: "Dr. Arvind Sharma",
      designation: "Professor & HOD",
      department: selectedDept,
      specialization: "Distributed Systems & Cloud Computing",
      email: "hod.cse@sbjit.edu.in",
      courses: ["Advanced OS", "Distributed Systems"],
    },
    {
      id: 102,
      name: "Dr. Meenakshi Rao",
      designation: "Associate Professor",
      department: selectedDept,
      specialization: "Machine Learning & Neural Networks",
      email: "m.rao@sbjit.edu.in",
      courses: ["Deep Learning", "Data Mining"],
    },
    {
      id: 103,
      name: "Prof. Rajesh Verma",
      designation: "Assistant Professor",
      department: selectedDept,
      specialization: "Cybersecurity & Cryptography",
      email: "r.verma@sbjit.edu.in",
      courses: ["Network Security", "Ethical Hacking"],
    },
    {
      id: 104,
      name: "Prof. Sunita Patil",
      designation: "Assistant Professor",
      department: selectedDept,
      specialization: "Database Management & Algorithms",
      email: "s.patil@sbjit.edu.in",
      courses: ["DBMS", "Data Structures"],
    },
  ];

  const batchStats = [
    { batch: "Final Year (2025)", total: 142, placed: 118, avgCgpa: 8.42, rate: "83%" },
    { batch: "Third Year (2026)", total: 156, interned: 89, avgCgpa: 8.15, rate: "57%" },
    { batch: "Second Year (2027)", total: 160, projects: 124, avgCgpa: 7.95, rate: "78%" },
    { batch: "First Year (2028)", total: 165, active: 165, avgCgpa: 8.05, rate: "100%" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4B63D2]/10 border border-[#4B63D2]/20 text-[#4B63D2] text-xs font-black">
            <Layers className="h-4 w-4" /> Department Administration
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1E2746] tracking-tight">
            {selectedDept}
          </h1>
          <p className="text-[#5851A4] text-xs sm:text-sm max-w-xl font-medium">
            Academic administration, faculty directory, cohort statistics, and departmental
            operations oversight.
          </p>
        </div>

        {/* Department Switcher */}
        <div className="flex items-center gap-3">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-2xl px-4 py-2.5 text-xs font-bold text-[#1E2746] focus:outline-none focus:border-[#4B63D2] shadow-sm cursor-pointer"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#5851A4] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Students</span>
            <GraduationCap className="h-4 w-4 text-[#4B63D2]" />
          </div>
          <span className="text-2xl font-black text-[#1E2746]">623</span>
          <p className="text-[10px] text-emerald-600 font-bold mt-1">Across 4 Batches</p>
        </div>

        <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#5851A4] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Faculty Staff</span>
            <Users className="h-4 w-4 text-[#4B63D2]" />
          </div>
          <span className="text-2xl font-black text-[#1E2746]">28</span>
          <p className="text-[10px] text-emerald-600 font-bold mt-1">1:22 Faculty Ratio</p>
        </div>

        <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#5851A4] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Placement Rate</span>
            <Award className="h-4 w-4 text-[#FFD21A]" />
          </div>
          <span className="text-2xl font-black text-[#1E2746]">83.1%</span>
          <p className="text-[10px] text-emerald-600 font-bold mt-1">+6.4% YoY Growth</p>
        </div>

        <div className="bg-white border border-[#EAE4F7] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#5851A4] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Research</span>
            <BookOpen className="h-4 w-4 text-[#4B63D2]" />
          </div>
          <span className="text-2xl font-black text-[#1E2746]">19 Papers</span>
          <p className="text-[10px] text-indigo-600 font-bold mt-1">Published this year</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-[#EAE4F7] gap-1.5 shadow-sm max-w-md">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "overview"
              ? "bg-[#4B63D2] text-white shadow-sm"
              : "text-[#5851A4] hover:bg-[#FAF9FD]"
          }`}
        >
          Cohort Analytics
        </button>
        <button
          onClick={() => setActiveTab("faculty")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "faculty"
              ? "bg-[#4B63D2] text-white shadow-sm"
              : "text-[#5851A4] hover:bg-[#FAF9FD]"
          }`}
        >
          Faculty Directory
        </button>
      </div>

      {/* TAB 1: Cohort Analytics */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-black text-[#1E2746] mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#4B63D2]" /> Batch-wise Performance Breakdown
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium">
                <thead className="bg-[#FAF9FD] text-[#5851A4] font-bold uppercase text-[10px] tracking-wider border-b border-[#EAE4F7]">
                  <tr>
                    <th className="py-3 px-4">Batch / Academic Year</th>
                    <th className="py-3 px-4">Students Enrolled</th>
                    <th className="py-3 px-4">Avg. CGPA</th>
                    <th className="py-3 px-4">Placement / Internship Metric</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE4F7]">
                  {batchStats.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#FAF9FD]/50 transition">
                      <td className="py-3.5 px-4 font-bold text-[#1E2746]">{item.batch}</td>
                      <td className="py-3.5 px-4 text-[#5851A4]">{item.total} Candidates</td>
                      <td className="py-3.5 px-4 font-black text-[#4B63D2]">{item.avgCgpa}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.rate} Achieved
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Link
                          to="/students"
                          className="text-[#4B63D2] font-bold hover:underline"
                        >
                          View Roster &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Faculty Directory */}
      {activeTab === "faculty" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {facultyList.map((fac) => (
            <div
              key={fac.id}
              className="bg-white border border-[#EAE4F7] rounded-3xl p-5 shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#4B63D2] to-[#5851A4] text-white font-black flex items-center justify-center text-sm shadow-sm">
                    {fac.name.split(" ")[1]?.charAt(0) || "F"}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[#1E2746]">{fac.name}</h4>
                    <p className="text-xs font-bold text-[#4B63D2]">{fac.designation}</p>
                    <p className="text-[11px] text-[#5851A4] font-medium">{fac.email}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#FAF9FD] p-3 rounded-2xl border border-[#EAE4F7] space-y-1.5">
                <span className="text-[10px] font-bold text-[#5851A4] uppercase tracking-wider block">
                  Domain & Research Specialization
                </span>
                <p className="text-xs font-semibold text-[#1E2746]">{fac.specialization}</p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {fac.courses.map((c, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 bg-[#4B63D2]/10 text-[#4B63D2] rounded-lg text-[10px] font-bold"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
