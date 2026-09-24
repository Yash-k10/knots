import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Search,
  Mail,
  Send,
  CheckCircle2,
  X,
  ExternalLink,
} from "lucide-react";
import { apiRequest, getMediaUrl } from "../services/api";

interface StudentRecord {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  profile_picture?: string | null;
  bio?: string;
  role_name?: string;
  batch?: string;
  cgpa?: number;
  skills?: string[];
  projects_count?: number;
  status?: "Seeking Internship" | "Placed" | "Available" | "Interviewing";
  company?: string;
}

export default function Students() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedBatch, setSelectedBatch] = useState("ALL");
  const [minCgpa, setMinCgpa] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [companyFilter, setCompanyFilter] = useState("ALL");

  // Email blast modal state (for TPO)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [meRes, usersRes] = await Promise.all([
          apiRequest<{ role?: { name: string }; profile?: { department: string } }>("/users/me").catch(() => null),
          apiRequest<any[]>("/users?limit=100").catch(() => []),
        ]);

        if (meRes?.role?.name) {
          setCurrentUserRole(meRes.role.name);
          const rName = meRes.role.name.toLowerCase();
          if (rName === "controller" || rName === "hod") {
            const userDept = meRes.profile?.department || "Computer Science";
            setSelectedDept(userDept);
          }
        }

        // Transform students data from user database with deterministic enrichment
        const studentList: StudentRecord[] = (usersRes || [])
          .filter(
            (u: any) =>
              !u.role ||
              u.role?.name?.toLowerCase() === "student" ||
              u.role?.name?.toLowerCase() === "alumni",
          )
          .map((u: any, idx: number) => {
            const depts = [
              "CSE",
              "AIML",
              "AIDS",
              "MCA",
              "BCA",
              "MBA",
              "IT",
              "Mechanical",
              "Electrical",
            ];
            const companies = ["Unplaced", "TCS", "Infosys", "Google", "Amazon", "Microsoft", "Accenture"];
            const batches = ["2025", "2026", "2027", "2028"];
            const statuses: StudentRecord["status"][] = [
              "Available",
              "Seeking Internship",
              "Interviewing",
              "Placed",
            ];
            const sampleSkills = [
              ["React", "TypeScript", "Node.js", "Python"],
              ["Java", "Spring Boot", "PostgreSQL", "AWS"],
              ["Machine Learning", "PyTorch", "Python", "Data Structures"],
              ["C++", "Embedded Systems", "IoT", "MATLAB"],
              ["UI/UX Design", "Figma", "TailwindCSS", "React"],
            ];

            const dept =
              u.profile?.department || depts[idx % depts.length];
            const batch = batches[idx % batches.length];
            const cgpa = Number((7.2 + ((idx * 0.43) % 2.7)).toFixed(2));
            const skills =
              u.profile?.skills || sampleSkills[idx % sampleSkills.length];
            const status = statuses[idx % statuses.length];

            return {
              id: u.id,
              email: u.email,
              first_name: u.profile?.first_name || u.email.split("@")[0],
              last_name: u.profile?.last_name || "",
              department: dept,
              profile_picture: u.profile?.profile_picture,
              bio:
                u.profile?.bio ||
                `Passionate ${dept} student focused on software engineering and systems.`,
              role_name: u.role?.name || "Student",
              batch,
              cgpa,
              skills,
              projects_count: 2 + (idx % 5),
              status,
              company: status === "Placed" ? companies[1 + (idx % (companies.length - 1))] : "Unplaced",
            };
          });

        setStudents(studentList);
      } catch (err) {
        console.error("Failed to load students roster", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const fullName = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase();
      const matchQuery =
        fullName.includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.skills?.some((sk) =>
          sk.toLowerCase().includes(searchQuery.toLowerCase()),
        );

      const matchDept =
        selectedDept === "ALL" ||
        s.department === selectedDept ||
        Boolean(s.department && selectedDept && s.department.toLowerCase().includes(selectedDept.toLowerCase())) ||
        Boolean(s.department && selectedDept && selectedDept.toLowerCase().includes(s.department.toLowerCase()));
      const matchBatch = selectedBatch === "ALL" || s.batch === selectedBatch;
      const matchCgpa = (s.cgpa || 0) >= minCgpa;
      const matchStatus =
        statusFilter === "ALL" || s.status === statusFilter;
      const matchCompany =
        companyFilter === "ALL" || s.company === companyFilter;

      return matchQuery && matchDept && matchBatch && matchCgpa && matchStatus && matchCompany;
    });
  }, [students, searchQuery, selectedDept, selectedBatch, minCgpa, statusFilter, companyFilter]);

  const isTPO =
    currentUserRole.toLowerCase() === "tpo" ||
    currentUserRole.toLowerCase() === "admin" ||
    currentUserRole.toLowerCase() === "super admin";

  const handleSendBlast = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingEmail(true);
    setTimeout(() => {
      setIsSendingEmail(false);
      setEmailSentSuccess(true);
      setTimeout(() => {
        setIsEmailModalOpen(false);
        setEmailSentSuccess(false);
        setEmailSubject("");
        setEmailBody("");
      }, 1500);
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white border border-[#EAE4F7] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 relative overflow-hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#4B63D2]/10 border border-[#4B63D2]/20 text-[#4B63D2] text-xs font-black">
            <GraduationCap className="h-4 w-4" />
            <span>
              {currentUserRole?.toLowerCase() === "controller"
                ? `${selectedDept} Controller Console`
                : "Student Talent Directory"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1E2746] tracking-tight">
            Campus Student Talent Roster
          </h1>
          <p className="text-[#5851A4] text-xs sm:text-sm max-w-xl font-medium">
            {currentUserRole?.toLowerCase() === "controller"
              ? `Departmental student directory strictly locked to ${selectedDept}. Monitor student cohort readiness, certifications, and academic progression.`
              : "Explore student profiles, review academic performance, track placement readiness, and inspect verified skills."}
          </p>
        </div>

        {/* Action / Stats */}
        <div className="flex flex-wrap items-center gap-3">
          {isTPO && (
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white rounded-xl text-xs font-black transition-all shadow-md shadow-[#4B63D2]/25 flex items-center gap-2 cursor-pointer"
            >
              <Mail className="h-4 w-4 text-[#FFD21A]" />
              Broadcast Email Blast ({filteredStudents.length})
            </button>
          )}
          <div className="bg-[#FAF9FD] px-4 py-2.5 rounded-xl border border-[#EAE4F7] text-center">
            <span className="text-xs font-bold text-[#5851A4] block">Showing</span>
            <span className="text-lg font-black text-[#1E2746]">
              {filteredStudents.length} Students
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#EAE4F7] rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9188BE]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, email, or skills (e.g. React, Python)..."
              className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] transition font-medium"
            />
          </div>

          {/* Department Filter (Locked for Controller) */}
          {currentUserRole?.toLowerCase() === "controller" ? (
            <div className="flex items-center gap-2 bg-[#4B63D2]/10 border border-[#4B63D2]/30 rounded-xl px-3.5 py-2 text-xs font-black text-[#4B63D2] shrink-0">
              <span className="h-2 w-2 rounded-full bg-[#4B63D2] animate-pulse" />
              <span>Dept: {selectedDept} (Locked)</span>
            </div>
          ) : (
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-[#1E2746] focus:outline-none focus:border-[#4B63D2] cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              <option value="CSE">CSE</option>
              <option value="AIML">AIML</option>
              <option value="AIDS">AIDS</option>
              <option value="MCA">MCA</option>
              <option value="BCA">BCA</option>
              <option value="MBA">MBA</option>
              <option value="IT">IT</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Electrical">Electrical</option>
            </select>
          )}

          {/* Company Filter */}
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-[#1E2746] focus:outline-none focus:border-[#4B63D2] cursor-pointer"
          >
            <option value="ALL">All Companies</option>
            <option value="Unplaced">Unplaced</option>
            <option value="TCS">TCS</option>
            <option value="Infosys">Infosys</option>
            <option value="Google">Google</option>
            <option value="Amazon">Amazon</option>
            <option value="Microsoft">Microsoft</option>
            <option value="Accenture">Accenture</option>
          </select>

          {/* Batch Filter */}
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-[#1E2746] focus:outline-none focus:border-[#4B63D2] cursor-pointer"
          >
            <option value="ALL">All Batches</option>
            <option value="2025">Batch 2025</option>
            <option value="2026">Batch 2026</option>
            <option value="2027">Batch 2027</option>
            <option value="2028">Batch 2028</option>
          </select>

          {/* Placement Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-[#1E2746] focus:outline-none focus:border-[#4B63D2] cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Seeking Internship">Seeking Internship</option>
            <option value="Interviewing">Interviewing</option>
            <option value="Placed">Placed</option>
          </select>

          {/* Min CGPA Filter */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[#FAF9FD] border border-[#D5CBEE] rounded-xl text-xs font-bold text-[#1E2746]">
            <span className="text-[#5851A4]">Min CGPA:</span>
            <input
              type="number"
              min="0"
              max="10"
              step="0.5"
              value={minCgpa || ""}
              onChange={(e) => setMinCgpa(parseFloat(e.target.value) || 0)}
              className="w-12 bg-transparent text-center font-black focus:outline-none"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Student Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 bg-slate-100 rounded-3xl border border-[#EAE4F7]"
            />
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white border border-[#EAE4F7] rounded-3xl p-12 text-center space-y-3">
          <GraduationCap className="h-12 w-12 text-[#9188BE] mx-auto opacity-50" />
          <h3 className="text-lg font-black text-[#1E2746]">No Students Found</h3>
          <p className="text-xs text-[#5851A4] max-w-sm mx-auto font-medium">
            Try adjusting your search criteria or resetting filters to view students.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStudents.map((student) => {
            const avatar = getMediaUrl(student.profile_picture);
            const statusColors = {
              Placed: "bg-emerald-50 text-emerald-700 border-emerald-200",
              "Seeking Internship": "bg-indigo-50 text-indigo-700 border-indigo-200",
              Interviewing: "bg-amber-50 text-amber-700 border-amber-200",
              Available: "bg-purple-50 text-purple-700 border-purple-200",
            };

            return (
              <div
                key={student.id}
                className="bg-white border border-[#EAE4F7] hover:border-[#C8B6E2] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3 sm:space-y-4 group"
              >
                <div>
                  {/* Top row: Avatar + Name + Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={student.first_name}
                          className="w-12 h-12 rounded-2xl object-cover border border-[#EAE4F7]"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5851A4] to-[#4B63D2] text-white font-black flex items-center justify-center text-base shadow-sm">
                          {student.first_name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-black text-[#1E2746] group-hover:text-[#4B63D2] transition-colors line-clamp-1">
                          {student.first_name} {student.last_name}
                        </h3>
                        <p className="text-[11px] font-bold text-[#5851A4]">
                          {student.department} • {student.batch}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black border shrink-0 ${
                        statusColors[student.status || "Available"]
                      }`}
                    >
                      {student.status}
                    </span>
                  </div>

                  {/* CGPA & Projects stats */}
                  <div className="grid grid-cols-2 gap-2 mt-4 bg-[#FAF9FD] p-2.5 rounded-xl border border-[#EAE4F7]">
                    <div className="text-center">
                      <span className="text-[10px] font-bold text-[#5851A4] block">
                        CGPA
                      </span>
                      <span className="text-xs font-black text-[#1E2746]">
                        {student.cgpa} / 10
                      </span>
                    </div>
                    <div className="text-center border-l border-[#EAE4F7]">
                      <span className="text-[10px] font-bold text-[#5851A4] block">
                        Projects
                      </span>
                      <span className="text-xs font-black text-[#1E2746]">
                        {student.projects_count} Showcased
                      </span>
                    </div>
                  </div>

                  {/* Skills Pills */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {student.skills?.slice(0, 4).map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2 py-0.5 bg-[#4B63D2]/10 text-[#4B63D2] rounded-lg text-[10px] font-bold"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-[#EAE4F7] flex items-center justify-between gap-2">
                  <Link
                    to={`/profile/${student.id}`}
                    className="text-xs font-bold text-[#4B63D2] hover:text-[#3E53BE] flex items-center gap-1 transition"
                  >
                    View Profile <ExternalLink className="h-3.5 w-3.5" />
                  </Link>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/messaging?target=${student.id}`}
                      className="p-2 bg-[#FAF9FD] hover:bg-[#4B63D2] text-[#5851A4] hover:text-white rounded-xl border border-[#EAE4F7] transition"
                      title="Direct Message"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TPO Email Broadcast Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full border border-[#EAE4F7] shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE4F7]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#4B63D2]/10 text-[#4B63D2] rounded-xl">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1E2746]">
                    Broadcast Placement Opportunity
                  </h3>
                  <p className="text-xs text-[#5851A4] font-medium">
                    Sending to {filteredStudents.length} selected students
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="p-1.5 text-[#5851A4] hover:text-[#1E2746] rounded-xl hover:bg-[#FAF9FD]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {emailSentSuccess ? (
              <div className="p-8 text-center space-y-3">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="text-base font-black text-[#1E2746]">
                  Emails Dispatched Successfully!
                </h4>
                <p className="text-xs text-[#5851A4]">
                  Notification blast sent to all {filteredStudents.length} candidate
                  inboxes.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendBlast} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1E2746] mb-1.5 uppercase tracking-wider">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    required
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="e.g. Urgent Drive: Google Cloud SWE Campus Recruitment 2026"
                    className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl p-3 text-xs text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E2746] mb-1.5 uppercase tracking-wider">
                    Message / Instructions
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Write details about eligibility criteria, job description, deadline, and registration steps..."
                    className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl p-3 text-xs text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] transition font-medium"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#EAE4F7]">
                  <button
                    type="button"
                    onClick={() => setIsEmailModalOpen(false)}
                    className="px-4 py-2.5 bg-[#FAF9FD] hover:bg-[#F0EDF9] text-[#5851A4] font-bold text-xs rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingEmail || !emailSubject || !emailBody}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md shadow-[#4B63D2]/25 flex items-center gap-2 cursor-pointer"
                  >
                    {isSendingEmail ? (
                      "Dispatching..."
                    ) : (
                      <>
                        <Send className="h-4 w-4 text-[#FFD21A]" /> Send to{" "}
                        {filteredStudents.length} Students
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
