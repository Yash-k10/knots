import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Calendar,
  Building,
  Users,
  Briefcase,
  TrendingUp,
  FileSpreadsheet,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  MapPin,
  GraduationCap,
  Eye,
  BarChart3,
  Flag,
  ShieldAlert,
  Globe,
  Plus,
  Edit2,
  Lock,
  UserCheck,
  UserX,
  Layers,
} from "lucide-react";
import { apiRequest } from "../services/api";

// ── EXCEL EXPORT UTILITY ────────────────────────────────────────────────────────
function exportToCsv(filename: string, headers: string[], rows: (string | number | undefined | null)[][]) {
  const escapeCsv = (val: string | number | undefined | null) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const csvContent =
    "\uFEFF" +
    headers.map(escapeCsv).join(",") +
    "\n" +
    rows.map((row) => row.map(escapeCsv).join(",")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── DEPARTMENTS & UNITS LIST ───────────────────────────────────────────────────
export const CAMPUS_UNITS = [
  "Artificial Intelligence & Machine Learning",
  "Computer Science & Engineering",
  "Artificial Intelligence & Data Science",
  "Information Technology",
  "Electronics & Telecommunication",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Training & Placement Cell (TPO)",
  "Master of Computer Applications (MCA)",
  "First Year Engineering",
];

// ── TYPES ───────────────────────────────────────────────────────────────────────
export interface DepartmentStudent {
  id: number;
  name: string;
  prn: string;
  email: string;
  department: string;
  batchYear: string;
  academicYear: "1st Year" | "2nd Year" | "3rd Year" | "4th Year";
  cgpa: number;
  status: "Active" | "Probation" | "Graduated";
}

export interface DepartmentOfficer {
  id: number;
  name: string;
  email: string;
  roleType: "Faculty" | "TPO" | "Controller";
  department: string;
  designation: string;
  specialization: string;
  appointedRole?: string;
  publicationsCount?: number;
  status: "Active" | "Probation";
}

export interface DepartmentReportedPost {
  id: number;
  postId: number;
  authorName: string;
  authorRole: string;
  authorEmail: string;
  department: string;
  content: string;
  imageUrl?: string;
  likes: number;
  commentsCount: number;
  reportedBy: string;
  reporterRole: string;
  reporterEmail?: string;
  reportReason: string;
  reportDetails?: string;
  reportedAt: string;
  status: "PENDING" | "DISMISSED";
}

export interface EventRegistration {
  id: number;
  studentName: string;
  studentPrn: string;
  email: string;
  department?: string;
  registeredAt: string;
  rsvpStatus: "Attending" | "Maybe";
}

export interface DepartmentEvent {
  id: number;
  title: string;
  department: string;
  category: string;
  date: string;
  time: string;
  location: string;
  headName: string;
  coHeadName: string;
  facultyCoordinator: string;
  registrationsCount: number;
  capacity: number;
  registrations: EventRegistration[];
  organizerName?: string;
  organizerEmail?: string;
  organizerRole?: string;
  organizerDepartment?: string;
  facultyCoordinatorDepartment?: string;
  headDepartment?: string;
  coHeadDepartment?: string;
}

export interface DepartmentClub {
  id: number;
  name: string;
  department: string;
  category: string;
  headName: string;
  coHeadName: string;
  facultyMentor: string;
  alumniMentor: string;
  membersCount: number;
  resourcesCount: number;
  galleryCount: number;
  creatorName?: string;
  creatorEmail?: string;
  creatorRole?: string;
  creatorDepartment?: string;
  facultyMentorDepartment?: string;
  alumniMentorDepartment?: string;
  headDepartment?: string;
  coHeadDepartment?: string;
}

export interface OpportunityApplicant {
  id: number;
  studentName: string;
  prn: string;
  email: string;
  academicYear: string;
  appliedDate: string;
  resumeUrl?: string;
  status: "Applied" | "Shortlisted" | "Selected" | "Rejected";
}

export interface DepartmentOpportunity {
  id: number;
  title: string;
  department: string;
  companyOrLab: string;
  type: "Internship" | "Research" | "Full-time";
  stipend: string;
  deadline: string;
  applicantsCount: number;
  applicants: OpportunityApplicant[];
  postedByName?: string;
  postedByEmail?: string;
  postedByRole?: string;
  postedByDepartment?: string;
}

export function deptsMatch(userDept?: string | null, itemDept?: string | null): boolean {
  if (!userDept || !itemDept) return false;
  const u = userDept.toLowerCase().trim();
  const i = itemDept.toLowerCase().trim();
  if (u === i) return true;
  if (["central", "central level", "campus-wide", "central club", "all departments", "all"].includes(i)) {
    return true;
  }
  // Sub-department exact matching
  if (u.includes("aiml") || u.includes("machine learning") || u.includes("ai & ml") || u.includes("ai and ml")) {
    return i.includes("aiml") || i.includes("machine learning") || i.includes("ai & ml") || i.includes("ai and ml");
  }
  if (u.includes("aids") || u.includes("data science")) {
    return i.includes("aids") || i.includes("data science");
  }
  // Plain CSE must NOT match AIML or AIDS
  if (u === "cse" || u.includes("computer science")) {
    return (
      (i.includes("cse") || i.includes("computer science")) &&
      !i.includes("aiml") &&
      !i.includes("aids") &&
      !i.includes("data science") &&
      !i.includes("machine learning")
    );
  }
  if (u === "it" || u.includes("information technology")) {
    return i === "it" || i.includes("information technology");
  }
  if (u === "etc" || u === "ece" || (u.includes("electronics") && u.includes("telecommunication"))) {
    return i === "etc" || i === "ece" || (i.includes("electronics") && i.includes("telecommunication"));
  }
  if (u === "ee" || u.includes("electrical")) {
    return i === "ee" || i.includes("electrical");
  }
  if (u === "me" || u.includes("mechanical")) {
    return i === "me" || i.includes("mechanical");
  }
  if (u === "civil" || u.includes("civil")) {
    return i === "civil" || i.includes("civil");
  }
  if (u === "bca" || u.includes("bca")) return i.includes("bca");
  if (u === "mca" || u.includes("mca")) return i.includes("mca");
  if (u === "mba" || u.includes("mba")) return i.includes("mba");
  if (u.includes("first") || u === "fy") return i.includes("first") || i.includes("fy");
  if (u.includes("training") || u.includes("tpo") || u.includes("placement")) {
    return i.includes("training") || i.includes("tpo") || i.includes("placement");
  }
  return u.includes(i) || i.includes(u);
}

export default function Controller() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [departmentName, setDepartmentName] = useState<string>("Artificial Intelligence & Machine Learning");
  const [selectedScope, setSelectedScope] = useState<string>("ALL");

  const [activeTab, setActiveTab] = useState<
    "analytics" | "students" | "officers" | "reported-posts" | "events" | "clubs" | "opportunities"
  >("analytics");

  // Feedback notifications
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Determine user role and privileges
  const roleName = (currentUser?.role?.name || "").toLowerCase().trim();
  const isCentralAdmin =
    currentUser?.role_id === 1 ||
    roleName === "admin" ||
    roleName === "super admin" ||
    roleName === "superadmin" ||
    roleName === "central admin" ||
    roleName === "central_admin" ||
    (currentUser?.email || "").toLowerCase().includes("admin");

  // ── DATA STATES ────────────────────────────────────────────────────────────────
  const [students, setStudents] = useState<DepartmentStudent[]>([
    {
      id: 101,
      name: "Rohan Patil",
      prn: "PRN2023AIML012",
      email: "rohan.patil@sbjit.edu.in",
      department: "Artificial Intelligence & Machine Learning",
      batchYear: "2023 – 2027",
      academicYear: "3rd Year",
      cgpa: 8.92,
      status: "Active",
    },
    {
      id: 102,
      name: "Ananya Deshmukh",
      prn: "PRN2022AIML045",
      email: "ananya.d@sbjit.edu.in",
      department: "Artificial Intelligence & Machine Learning",
      batchYear: "2022 – 2026",
      academicYear: "4th Year",
      cgpa: 9.35,
      status: "Active",
    },
    {
      id: 103,
      name: "Aditya Verma",
      prn: "PRN2024AIML008",
      email: "aditya.verma@sbjit.edu.in",
      department: "Artificial Intelligence & Machine Learning",
      batchYear: "2024 – 2028",
      academicYear: "2nd Year",
      cgpa: 8.45,
      status: "Active",
    },
    {
      id: 104,
      name: "Snehal Shinde",
      prn: "PRN2025AIML022",
      email: "snehal.s@sbjit.edu.in",
      department: "Artificial Intelligence & Machine Learning",
      batchYear: "2025 – 2029",
      academicYear: "1st Year",
      cgpa: 8.1,
      status: "Active",
    },
    {
      id: 105,
      name: "Varun Kulkarni",
      prn: "PRN2022AIML019",
      email: "varun.k@sbjit.edu.in",
      department: "Artificial Intelligence & Machine Learning",
      batchYear: "2022 – 2026",
      academicYear: "4th Year",
      cgpa: 7.8,
      status: "Active",
    },
    {
      id: 106,
      name: "Neha Joshi",
      prn: "PRN2023AIML088",
      email: "neha.j@sbjit.edu.in",
      department: "Artificial Intelligence & Machine Learning",
      batchYear: "2023 – 2027",
      academicYear: "3rd Year",
      cgpa: 9.15,
      status: "Active",
    },
    {
      id: 107,
      name: "Karan Mehta",
      prn: "PRN2024AIML063",
      email: "karan.m@sbjit.edu.in",
      department: "Artificial Intelligence & Machine Learning",
      batchYear: "2024 – 2028",
      academicYear: "2nd Year",
      cgpa: 7.4,
      status: "Probation",
    },
    {
      id: 108,
      name: "Aarav Sharma",
      prn: "PRN2023CSE015",
      email: "aarav.sharma@sbjit.edu.in",
      department: "Computer Science & Engineering",
      batchYear: "2023 – 2027",
      academicYear: "3rd Year",
      cgpa: 9.02,
      status: "Active",
    },
    {
      id: 109,
      name: "Tanvi Kulkarni",
      prn: "PRN2022CSE099",
      email: "tanvi.k@sbjit.edu.in",
      department: "Computer Science & Engineering",
      batchYear: "2022 – 2026",
      academicYear: "4th Year",
      cgpa: 8.85,
      status: "Active",
    },
    {
      id: 110,
      name: "Devendra Rathod",
      prn: "PRN2024AIDS042",
      email: "devendra.r@sbjit.edu.in",
      department: "Artificial Intelligence & Data Science",
      batchYear: "2024 – 2028",
      academicYear: "2nd Year",
      cgpa: 8.3,
      status: "Active",
    },
    {
      id: 111,
      name: "Pooja Gaikwad",
      prn: "PRN2023IT029",
      email: "pooja.g@sbjit.edu.in",
      department: "Information Technology",
      batchYear: "2023 – 2027",
      academicYear: "3rd Year",
      cgpa: 8.65,
      status: "Active",
    },
  ]);

  const [officers, setOfficers] = useState<DepartmentOfficer[]>([
    // AIML Faculty & Controller
    {
      id: 201,
      name: "Dr. P. S. Kulkarni",
      email: "hod.aiml@sbjit.edu.in",
      roleType: "Faculty",
      department: "Artificial Intelligence & Machine Learning",
      designation: "Head of Department & Professor",
      specialization: "Deep Learning & Computer Vision",
      appointedRole: "Department HOD",
      publicationsCount: 38,
      status: "Active",
    },
    {
      id: 202,
      name: "Prof. Amit Sharma",
      email: "controller.aiml@sbjit.edu.in",
      roleType: "Controller",
      department: "Artificial Intelligence & Machine Learning",
      designation: "Department Controller & Associate Professor",
      specialization: "Distributed Systems & Cloud AI",
      appointedRole: "Department Controller",
      publicationsCount: 22,
      status: "Active",
    },
    {
      id: 203,
      name: "Dr. Sunita Rao",
      email: "sunita.rao@sbjit.edu.in",
      roleType: "Faculty",
      department: "Artificial Intelligence & Machine Learning",
      designation: "Associate Professor",
      specialization: "Natural Language Processing & LLMs",
      appointedRole: "AI Society Faculty Mentor",
      publicationsCount: 19,
      status: "Active",
    },
    {
      id: 204,
      name: "Prof. Rajesh Deshpande",
      email: "rajesh.d@sbjit.edu.in",
      roleType: "Faculty",
      department: "Artificial Intelligence & Machine Learning",
      designation: "Assistant Professor",
      specialization: "Robotics & Embedded Edge AI",
      appointedRole: "RoboKnots Faculty Coordinator",
      publicationsCount: 11,
      status: "Active",
    },
    {
      id: 205,
      name: "Prof. Meera K.",
      email: "meera.k@sbjit.edu.in",
      roleType: "Faculty",
      department: "Artificial Intelligence & Machine Learning",
      designation: "Assistant Professor",
      specialization: "Neural Networks & Mathematics for ML",
      appointedRole: "Tech Symposium Faculty Coord",
      publicationsCount: 8,
      status: "Active",
    },
    // TPO Officers (Training & Placement Cell)
    {
      id: 210,
      name: "Dr. Anand Joshi",
      email: "tpo.head@sbjit.edu.in",
      roleType: "TPO",
      department: "Training & Placement Cell (TPO)",
      designation: "Director - Training & Placement (Chief TPO)",
      specialization: "Corporate Partnerships, Placements & Internships",
      appointedRole: "Campus Chief TPO Head",
      status: "Active",
    },
    {
      id: 211,
      name: "Ms. Priya Deshmukh",
      email: "priya.tpo@sbjit.edu.in",
      roleType: "TPO",
      department: "Training & Placement Cell (TPO)",
      designation: "Senior TPO Officer & Industry Liaison",
      specialization: "Core Engineering & MNC Recruitment Drives",
      appointedRole: "Senior TPO Placement Lead",
      status: "Active",
    },
    {
      id: 212,
      name: "Prof. Nitin Mane",
      email: "nitin.tpo@sbjit.edu.in",
      roleType: "TPO",
      department: "Training & Placement Cell (TPO)",
      designation: "Assistant TPO & Internship Coordinator",
      specialization: "Student Skill Development & Mock Interviews",
      appointedRole: "Internship & Pre-Placement Lead",
      status: "Active",
    },
    // Other Department Controllers
    {
      id: 220,
      name: "Dr. Vandana Jadhav",
      email: "controller.cse@sbjit.edu.in",
      roleType: "Controller",
      department: "Computer Science & Engineering",
      designation: "Department Controller & Professor",
      specialization: "Cloud Computing & Cybersecurity",
      appointedRole: "CSE Department Controller",
      publicationsCount: 31,
      status: "Active",
    },
    {
      id: 221,
      name: "Prof. Saurabh Roy",
      email: "controller.aids@sbjit.edu.in",
      roleType: "Controller",
      department: "Artificial Intelligence & Data Science",
      designation: "Department Controller & Associate Professor",
      specialization: "Big Data & Machine Learning Operations",
      appointedRole: "AIDS Department Controller",
      publicationsCount: 16,
      status: "Active",
    },
  ]);

  const [reportedPosts, setReportedPosts] = useState<DepartmentReportedPost[]>([
    {
      id: 801,
      postId: 301,
      authorName: "Varun Kulkarni",
      authorRole: "STUDENT",
      authorEmail: "varun.k@sbjit.edu.in",
      department: "Artificial Intelligence & Machine Learning",
      content:
        "Selling unauthorized end-semester question paper solutions and AI assignment code packets before the exam. DM for price list.",
      likes: 2,
      commentsCount: 5,
      reportedBy: "Dr. Sunita Rao",
      reporterRole: "Faculty",
      reporterEmail: "sunita.rao@sbjit.edu.in",
      reportReason: "Academic Dishonesty / Unauthorized Exam Material",
      reportDetails:
        "Soliciting unauthorized examination solution sales in violation of department academic code of conduct.",
      reportedAt: "15 mins ago",
      status: "PENDING",
    },
    {
      id: 802,
      postId: 302,
      authorName: "Aditya Verma",
      authorRole: "STUDENT",
      authorEmail: "aditya.verma@sbjit.edu.in",
      department: "Artificial Intelligence & Machine Learning",
      content:
        "Anyone from AIML looking to bypass the mandatory attendance bio-metric scanner can use this Python spoofing script on GitHub.",
      likes: 8,
      commentsCount: 11,
      reportedBy: "Snehal Shinde",
      reporterRole: "Student",
      reporterEmail: "snehal.s@sbjit.edu.in",
      reportReason: "Inappropriate Content / Code of Conduct",
      reportDetails:
        "Distributing scripts to tamper with campus biometric attendance hardware.",
      reportedAt: "1 hour ago",
      status: "PENDING",
    },
    {
      id: 803,
      postId: 303,
      authorName: "Rohan Patil",
      authorRole: "STUDENT",
      authorEmail: "rohan.patil@sbjit.edu.in",
      department: "Artificial Intelligence & Machine Learning",
      content:
        "Guaranteed 500% returns in 3 days! Sign up for this student trading bot group immediately. Claimed official college endorsement.",
      likes: 14,
      commentsCount: 6,
      reportedBy: "Ananya Deshmukh",
      reporterRole: "Student",
      reporterEmail: "ananya.d@sbjit.edu.in",
      reportReason: "Spam, Scam, or Misinformation",
      reportDetails:
        "Suspicious cryptocurrency pyramid scheme falsely claiming department endorsement.",
      reportedAt: "Yesterday",
      status: "PENDING",
    },
    {
      id: 804,
      postId: 304,
      authorName: "Devendra Rathod",
      authorRole: "STUDENT",
      authorEmail: "devendra.r@sbjit.edu.in",
      department: "Artificial Intelligence & Data Science",
      content:
        "Paid proxy attendance service available for 2nd and 3rd year labs. Weekly subscriptions available via UPI.",
      likes: 3,
      commentsCount: 4,
      reportedBy: "Prof. Saurabh Roy",
      reporterRole: "Controller",
      reporterEmail: "controller.aids@sbjit.edu.in",
      reportReason: "Code of Conduct Violation",
      reportDetails: "Offering illegal proxy attendance for laboratory practicals.",
      reportedAt: "3 hours ago",
      status: "PENDING",
    },
  ]);

  const [events, setEvents] = useState<DepartmentEvent[]>([
    {
      id: 401,
      title: "AIML Department Annual Tech Symposium 2026",
      department: "Artificial Intelligence & Machine Learning",
      category: "Technical",
      date: "Saturday, Oct 25, 2026",
      time: "9:30 AM – 5:00 PM IST",
      location: "Auditorium 2 & AI Supercomputing Complex",
      headName: "Ananya Deshmukh (Student)",
      coHeadName: "Rohan Patil (Student)",
      facultyCoordinator: "Prof. Amit Sharma (Faculty)",
      registrationsCount: 185,
      capacity: 220,
      registrations: [
        {
          id: 1,
          studentName: "Aditya Verma",
          studentPrn: "PRN2024AIML008",
          email: "aditya.verma@sbjit.edu.in",
          registeredAt: "Oct 12, 2026",
          rsvpStatus: "Attending",
        },
        {
          id: 2,
          studentName: "Snehal Shinde",
          studentPrn: "PRN2025AIML022",
          email: "snehal.s@sbjit.edu.in",
          registeredAt: "Oct 14, 2026",
          rsvpStatus: "Attending",
        },
        {
          id: 3,
          studentName: "Karan Mehta",
          studentPrn: "PRN2024AIML063",
          email: "karan.m@sbjit.edu.in",
          registeredAt: "Oct 15, 2026",
          rsvpStatus: "Maybe",
        },
      ],
    },
    {
      id: 402,
      title: "Generative AI & LLM Deployment Workshop",
      department: "Artificial Intelligence & Machine Learning",
      category: "Academic",
      date: "Wednesday, Nov 12, 2026",
      time: "2:00 PM – 6:00 PM IST",
      location: "Department Lab 401",
      headName: "Varun Kulkarni (Student)",
      coHeadName: "Neha Joshi (Student)",
      facultyCoordinator: "Dr. Sunita Rao (Faculty)",
      registrationsCount: 92,
      capacity: 100,
      registrations: [
        {
          id: 4,
          studentName: "Rohan Patil",
          studentPrn: "PRN2023AIML012",
          email: "rohan.patil@sbjit.edu.in",
          registeredAt: "Nov 02, 2026",
          rsvpStatus: "Attending",
        },
      ],
    },
    {
      id: 403,
      title: "Campus Mega Placement & Internship Drive 2026",
      department: "Training & Placement Cell (TPO)",
      category: "Placements",
      date: "Friday, Nov 20, 2026",
      time: "9:00 AM – 6:00 PM IST",
      location: "Campus Convention Center & Placement Block",
      headName: "Aarav Sharma (Student Lead)",
      coHeadName: "Ananya Deshmukh (Student Lead)",
      facultyCoordinator: "Dr. Anand Joshi (Chief TPO)",
      registrationsCount: 420,
      capacity: 500,
      registrations: [
        {
          id: 5,
          studentName: "Tanvi Kulkarni",
          studentPrn: "PRN2022CSE099",
          email: "tanvi.k@sbjit.edu.in",
          registeredAt: "Nov 01, 2026",
          rsvpStatus: "Attending",
        },
      ],
    },
  ]);

  const [clubs, setClubs] = useState<DepartmentClub[]>([
    {
      id: 501,
      name: "AIRS (Artificial Intelligence & Robotics Society)",
      department: "Artificial Intelligence & Machine Learning",
      category: "Technical",
      headName: "Ananya Deshmukh (Student)",
      coHeadName: "Rohan Patil (Student)",
      facultyMentor: "Dr. Sunita Rao (Faculty)",
      alumniMentor: "Arjun Rao (Senior Lead, Amazon UK)",
      membersCount: 140,
      resourcesCount: 28,
      galleryCount: 16,
    },
    {
      id: 502,
      name: "DataKnots Coding & Competitive AI Club",
      department: "Artificial Intelligence & Machine Learning",
      category: "Academic",
      headName: "Varun Kulkarni (Student)",
      coHeadName: "Neha Joshi (Student)",
      facultyMentor: "Prof. Rajesh Deshpande (Faculty)",
      alumniMentor: "Vikas Patil (Founder, TensorScale)",
      membersCount: 115,
      resourcesCount: 42,
      galleryCount: 12,
    },
    {
      id: 503,
      name: "Campus Career & Corporate Connect Club",
      department: "Training & Placement Cell (TPO)",
      category: "Professional Development",
      headName: "Pooja Gaikwad (Student)",
      coHeadName: "Aarav Sharma (Student)",
      facultyMentor: "Ms. Priya Deshmukh (Senior TPO)",
      alumniMentor: "Siddharth Verma (VP Engineering, Google)",
      membersCount: 210,
      resourcesCount: 65,
      galleryCount: 24,
    },
  ]);

  const [opportunities, setOpportunities] = useState<DepartmentOpportunity[]>([
    {
      id: 601,
      title: "Computer Vision & Edge AI Research Intern",
      department: "Artificial Intelligence & Machine Learning",
      companyOrLab: "Autonomous Systems Lab & Bosch Mobility",
      type: "Research",
      stipend: "₹30,000 / month",
      deadline: "Nov 30, 2026",
      applicantsCount: 28,
      applicants: [
        {
          id: 1,
          studentName: "Ananya Deshmukh",
          prn: "PRN2022AIML045",
          email: "ananya.d@sbjit.edu.in",
          academicYear: "4th Year",
          appliedDate: "Nov 10, 2026",
          status: "Shortlisted",
        },
        {
          id: 2,
          studentName: "Rohan Patil",
          prn: "PRN2023AIML012",
          email: "rohan.patil@sbjit.edu.in",
          academicYear: "3rd Year",
          appliedDate: "Nov 12, 2026",
          status: "Applied",
        },
      ],
    },
    {
      id: 602,
      title: "Full-Stack Machine Learning Engineer Trainee",
      department: "Artificial Intelligence & Machine Learning",
      companyOrLab: "TensorScale Systems (Alumni Venture)",
      type: "Internship",
      stipend: "₹45,000 / month",
      deadline: "Dec 15, 2026",
      applicantsCount: 44,
      applicants: [
        {
          id: 4,
          studentName: "Varun Kulkarni",
          prn: "PRN2022AIML019",
          email: "varun.k@sbjit.edu.in",
          academicYear: "4th Year",
          appliedDate: "Nov 15, 2026",
          status: "Selected",
        },
      ],
    },
    {
      id: 603,
      title: "Global Graduate Software Engineering Campus Hire",
      department: "Training & Placement Cell (TPO)",
      companyOrLab: "Microsoft India (TPO Campus Drive)",
      type: "Full-time",
      stipend: "₹18,50,000 / year",
      deadline: "Dec 05, 2026",
      applicantsCount: 165,
      applicants: [
        {
          id: 5,
          studentName: "Tanvi Kulkarni",
          prn: "PRN2022CSE099",
          email: "tanvi.k@sbjit.edu.in",
          academicYear: "4th Year",
          appliedDate: "Nov 18, 2026",
          status: "Shortlisted",
        },
      ],
    },
  ]);

  // ── SEARCH & FILTER STATES ───────────────────────────────────────────────────
  const [studentSearch, setStudentSearch] = useState("");
  const [studentYearFilter, setStudentYearFilter] = useState("All");

  const [officerSearch, setOfficerSearch] = useState("");
  const [officerRoleFilter, setOfficerRoleFilter] = useState<"All" | "Faculty" | "TPO" | "Controller">("All");

  // Modals for CRUD operations
  const [studentToDelete, setStudentToDelete] = useState<DepartmentStudent | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<DepartmentStudent | null>(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({
    name: "",
    email: "",
    prn: "",
    department: "Artificial Intelligence & Machine Learning",
    academicYear: "1st Year" as "1st Year" | "2nd Year" | "3rd Year" | "4th Year",
    cgpa: 8.5,
  });

  const [officerToDelete, setOfficerToDelete] = useState<DepartmentOfficer | null>(null);
  const [officerToEdit, setOfficerToEdit] = useState<DepartmentOfficer | null>(null);
  const [showAddOfficerModal, setShowAddOfficerModal] = useState(false);
  const [newOfficerForm, setNewOfficerForm] = useState({
    name: "",
    email: "",
    roleType: "Faculty" as "Faculty" | "TPO" | "Controller",
    department: "Artificial Intelligence & Machine Learning",
    designation: "",
    specialization: "",
    appointedRole: "",
  });

  const [deletingStudent, setDeletingStudent] = useState(false);
  const [deletingOfficer, setDeletingOfficer] = useState(false);

  const [inspectEventRegistrations, setInspectEventRegistrations] = useState<DepartmentEvent | null>(null);
  const [inspectOpportunityApplicants, setInspectOpportunityApplicants] = useState<DepartmentOpportunity | null>(null);

  // ── INITIAL FETCH ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfileAndUsers = async () => {
      try {
        const me = await apiRequest<any>("/users/me");
        setCurrentUser(me);
        if (me.profile?.department) {
          setDepartmentName(me.profile.department);
          if (!isCentralAdmin) {
            setSelectedScope(me.profile.department);
          }
        }

        // Fetch real department users
        const usersResp = await apiRequest<any>("/users?limit=100");
        const list = Array.isArray(usersResp) ? usersResp : usersResp.items || [];
        if (list.length > 0) {
          const fetchedStudents: DepartmentStudent[] = list
            .filter((u: any) => {
              const r = (u.role?.name || "").toLowerCase();
              return r === "student" || r.includes("student");
            })
            .map((u: any, idx: number) => ({
              id: u.id,
              name: `${u.profile?.first_name || ""} ${u.profile?.last_name || ""}`.trim() || u.email.split("@")[0],
              prn: u.profile?.student_prn || `PRN2024${idx.toString().padStart(4, "0")}`,
              email: u.email,
              department: u.profile?.department || "Artificial Intelligence & Machine Learning",
              batchYear: u.profile?.graduation_year ? `${u.profile.graduation_year - 4} – ${u.profile.graduation_year}` : "2023 – 2027",
              academicYear: (idx % 4 === 0 ? "4th Year" : idx % 3 === 0 ? "3rd Year" : idx % 2 === 0 ? "2nd Year" : "1st Year") as any,
              cgpa: Number((8.2 + (idx % 15) * 0.1).toFixed(2)),
              status: "Active" as const,
            }));

          if (fetchedStudents.length > 0) {
            setStudents((prev) => {
              const existingIds = new Set(prev.map((s) => s.id));
              const additions = fetchedStudents.filter((s) => !existingIds.has(s.id));
              return [...prev, ...additions];
            });
          }
        }

        // Fetch real department events
        try {
          const eventsResp = await apiRequest<any>("/events?limit=100");
          const eventsList = Array.isArray(eventsResp) ? eventsResp : eventsResp?.items || [];
          if (eventsList.length > 0) {
            const mappedEvents: DepartmentEvent[] = eventsList.map((e: any) => ({
              id: e.id,
              title: e.title,
              department: e.department || e.organizer?.department || "Campus-Wide",
              category: e.category || "General",
              date: e.date || (e.start_time ? new Date(e.start_time).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "TBA"),
              time: e.time || (e.start_time ? new Date(e.start_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "TBA"),
              location: e.location || "Campus Venue",
              headName: e.head ? `${e.head.first_name || ""} ${e.head.last_name || ""}`.trim() || e.head.email : "Student Lead",
              coHeadName: e.co_head ? `${e.co_head.first_name || ""} ${e.co_head.last_name || ""}`.trim() || e.co_head.email : "Student Co-Lead",
              facultyCoordinator: e.faculty_coordinator ? `${e.faculty_coordinator.first_name || ""} ${e.faculty_coordinator.last_name || ""}`.trim() || e.faculty_coordinator.email : "Faculty Lead",
              registrationsCount: e.rsvp_count || e.rsvps_count || 0,
              capacity: e.capacity || 100,
              registrations: [],
              organizerName: e.organizer ? `${e.organizer.first_name || ""} ${e.organizer.last_name || ""}`.trim() || e.organizer.email : undefined,
              organizerEmail: e.organizer?.email,
              organizerRole: e.organizer?.role_name,
              organizerDepartment: e.organizer?.department,
              facultyCoordinatorDepartment: e.faculty_coordinator?.department,
              headDepartment: e.head?.department,
              coHeadDepartment: e.co_head?.department,
            }));
            setEvents((prev) => {
              const existingIds = new Set(prev.map((x) => x.id));
              const additions = mappedEvents.filter((x) => !existingIds.has(x.id));
              return [...prev, ...additions];
            });
          }
        } catch (eErr) {
          console.warn("Live events fetch fallback:", eErr);
        }

        // Fetch real department clubs
        try {
          const clubsResp = await apiRequest<any>("/clubs?skip=0&limit=100");
          const clubsList = Array.isArray(clubsResp) ? clubsResp : clubsResp?.items || [];
          if (clubsList.length > 0) {
            const mappedClubs: DepartmentClub[] = clubsList.map((c: any) => ({
              id: c.id,
              name: c.name,
              department: c.department || c.creator?.department || "Campus-Wide",
              category: c.category || "General",
              headName: c.lead_user ? `${c.lead_user.first_name || ""} ${c.lead_user.last_name || ""}`.trim() || c.lead_user.email : "Lead",
              coHeadName: c.co_lead_user ? `${c.co_lead_user.first_name || ""} ${c.co_lead_user.last_name || ""}`.trim() || c.co_lead_user.email : "Co-Lead",
              facultyMentor: c.faculty_mentor ? `${c.faculty_mentor.first_name || ""} ${c.faculty_mentor.last_name || ""}`.trim() || c.faculty_mentor.email : "Faculty Advisor",
              alumniMentor: c.alumni_mentor ? `${c.alumni_mentor.first_name || ""} ${c.alumni_mentor.last_name || ""}`.trim() || c.alumni_mentor.email : "Alumni Mentor",
              membersCount: c.members_count || 0,
              resourcesCount: 0,
              galleryCount: 0,
              creatorName: c.creator ? `${c.creator.first_name || ""} ${c.creator.last_name || ""}`.trim() || c.creator.email : undefined,
              creatorEmail: c.creator?.email,
              creatorRole: c.creator?.role_name,
              creatorDepartment: c.creator?.department,
              facultyMentorDepartment: c.faculty_mentor?.department,
              alumniMentorDepartment: c.alumni_mentor?.department,
              headDepartment: c.lead_user?.department,
              coHeadDepartment: c.co_lead_user?.department,
            }));
            setClubs((prev) => {
              const existingIds = new Set(prev.map((x) => x.id));
              const additions = mappedClubs.filter((x) => !existingIds.has(x.id));
              return [...prev, ...additions];
            });
          }
        } catch (cErr) {
          console.warn("Live clubs fetch fallback:", cErr);
        }

        // Fetch real department opportunities
        try {
          const oppsResp = await apiRequest<any>("/opportunities?limit=100");
          const oppsList = Array.isArray(oppsResp) ? oppsResp : oppsResp?.items || [];
          if (oppsList.length > 0) {
            const mappedOpps: DepartmentOpportunity[] = oppsList.map((o: any) => ({
              id: o.id,
              title: o.title,
              department: o.department || o.posted_by_department || "Campus-Wide",
              companyOrLab: o.company || "Campus Venture",
              type: (o.type === "Internship" || o.type === "Research" || o.type === "Full-time") ? o.type : "Internship",
              stipend: o.stipend || "Competitive",
              deadline: o.deadline ? new Date(o.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Rolling",
              applicantsCount: o.applicants_count || 0,
              applicants: [],
              postedByName: o.posted_by_name,
              postedByEmail: o.posted_by_email,
              postedByRole: o.posted_by_role,
              postedByDepartment: o.posted_by_department,
            }));
            setOpportunities((prev) => {
              const existingIds = new Set(prev.map((x) => x.id));
              const additions = mappedOpps.filter((x) => !existingIds.has(x.id));
              return [...prev, ...additions];
            });
          }
        } catch (oErr) {
          console.warn("Live opportunities fetch fallback:", oErr);
        }

        // Fetch real department jobs/placements if any
        try {
          const jobsResp = await apiRequest<any>("/jobs?limit=100");
          const jobsList = Array.isArray(jobsResp) ? jobsResp : jobsResp?.items || [];
          if (jobsList.length > 0) {
            const mappedJobs: DepartmentOpportunity[] = jobsList.map((j: any) => ({
              id: 10000 + j.id,
              title: j.title,
              department: j.department || j.poster?.department || "Training & Placement Cell (TPO)",
              companyOrLab: j.company?.name || "Corporate Partner",
              type: j.job_type === "INTERNSHIP" ? "Internship" : j.job_type === "RESEARCH" ? "Research" : "Full-time",
              stipend: j.salary_min && j.salary_max ? `₹${j.salary_min.toLocaleString()} - ₹${j.salary_max.toLocaleString()}` : j.salary_max ? `₹${j.salary_max.toLocaleString()}` : "Competitive",
              deadline: j.deadline ? new Date(j.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Open",
              applicantsCount: j.applications_count || 0,
              applicants: [],
              postedByName: j.poster ? `${j.poster.first_name || ""} ${j.poster.last_name || ""}`.trim() || j.poster.email : undefined,
              postedByEmail: j.poster?.email,
              postedByRole: j.poster?.role_name,
              postedByDepartment: j.poster?.department,
            }));
            setOpportunities((prev) => {
              const existingIds = new Set(prev.map((x) => x.id));
              const additions = mappedJobs.filter((x) => !existingIds.has(x.id));
              return [...prev, ...additions];
            });
          }
        } catch (jErr) {
          // Ignored
        }
      } catch (err) {
        // Fallback to rich pre-seeded department demo state
      }
    };
    fetchProfileAndUsers();

    // Sync reported posts from localStorage
    try {
      const stored = localStorage.getItem("KNOTS_REPORTED_POSTS");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setReportedPosts((prev) => {
            const existingIds = new Set(prev.map((p) => p.postId));
            const newItems = parsed.filter((r: any) => !existingIds.has(r.postId));
            return [...newItems, ...prev];
          });
        }
      }
    } catch {}

    // Real-time listener for incoming post reports from any user
    const handleNewReport = (event: any) => {
      const report = event.detail;
      if (!report) return;
      setReportedPosts((prev) => [report, ...prev.filter((p) => p.postId !== report.postId)]);
      showToast(`New post report received from ${report.reportedBy} for review!`);
    };

    window.addEventListener("knots-post-reported", handleNewReport);
    return () => window.removeEventListener("knots-post-reported", handleNewReport);
  }, []);

  // Department / Unit matching helper
  const targetScope = isCentralAdmin ? selectedScope : departmentName;

  const matchScope = (itemDept?: string | null) => {
    if (!itemDept) return true;
    if (isCentralAdmin && targetScope === "ALL") return true;
    return deptsMatch(targetScope, itemDept);
  };

  const matchesEventScope = (evt: DepartmentEvent) => {
    if (isCentralAdmin && targetScope === "ALL") return true;
    return (
      matchScope(evt.department) ||
      matchScope(evt.organizerDepartment) ||
      matchScope(evt.facultyCoordinatorDepartment) ||
      matchScope(evt.headDepartment) ||
      matchScope(evt.coHeadDepartment)
    );
  };

  const matchesClubScope = (club: DepartmentClub) => {
    if (isCentralAdmin && targetScope === "ALL") return true;
    return (
      matchScope(club.department) ||
      matchScope(club.creatorDepartment) ||
      matchScope(club.facultyMentorDepartment) ||
      matchScope(club.alumniMentorDepartment) ||
      matchScope(club.headDepartment) ||
      matchScope(club.coHeadDepartment)
    );
  };

  const matchesOpportunityScope = (opp: DepartmentOpportunity) => {
    if (isCentralAdmin && targetScope === "ALL") return true;
    return (
      matchScope(opp.department) ||
      matchScope(opp.postedByDepartment)
    );
  };

  // Active Scope Label
  const currentScopeLabel = isCentralAdmin
    ? selectedScope === "ALL"
      ? "All Departments & TPO (Campus-Wide)"
      : selectedScope
    : departmentName;

  // ── ACTIONS (CRUD) ───────────────────────────────────────────────────────────

  // 1. Student CRUD
  const handleAddStudent = () => {
    if (!newStudentForm.name.trim() || !newStudentForm.email.trim() || !newStudentForm.prn.trim()) {
      alert("Please fill in all required fields (Name, Email, PRN).");
      return;
    }
    const created: DepartmentStudent = {
      id: Date.now(),
      name: newStudentForm.name.trim(),
      email: newStudentForm.email.trim(),
      prn: newStudentForm.prn.trim(),
      department: newStudentForm.department,
      batchYear: "2024 – 2028",
      academicYear: newStudentForm.academicYear,
      cgpa: Number(newStudentForm.cgpa) || 8.5,
      status: "Active",
    };
    setStudents((prev) => [created, ...prev]);
    setShowAddStudentModal(false);
    setNewStudentForm({
      name: "",
      email: "",
      prn: "",
      department: isCentralAdmin && selectedScope !== "ALL" ? selectedScope : "Artificial Intelligence & Machine Learning",
      academicYear: "1st Year",
      cgpa: 8.5,
    });
    showToast(`Student account "${created.name}" created successfully!`);
  };

  const handleToggleStudentStatus = (studentId: number) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const nextStatus = s.status === "Active" ? "Probation" : "Active";
          showToast(`Student "${s.name}" status updated to ${nextStatus}.`);
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
  };

  const handleSaveStudentEdit = () => {
    if (!studentToEdit) return;
    setStudents((prev) => prev.map((s) => (s.id === studentToEdit.id ? studentToEdit : s)));
    showToast(`Student account "${studentToEdit.name}" updated successfully.`);
    setStudentToEdit(null);
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    setDeletingStudent(true);
    try {
      await apiRequest(`/users/${studentToDelete.id}`, { method: "DELETE" });
    } catch (err: any) {
      console.warn("Delete student fallback:", err);
    }
    setStudents((prev) => prev.filter((s) => s.id !== studentToDelete.id));
    showToast(`Student account "${studentToDelete.name}" deleted successfully.`);
    setStudentToDelete(null);
    setDeletingStudent(false);
  };

  // 2. Officer / Personnel CRUD (Faculty, TPO Officers, Department Controllers)
  const handleAddOfficer = () => {
    if (!newOfficerForm.name.trim() || !newOfficerForm.email.trim()) {
      alert("Please fill in required fields (Name and Email).");
      return;
    }
    const created: DepartmentOfficer = {
      id: Date.now(),
      name: newOfficerForm.name.trim(),
      email: newOfficerForm.email.trim(),
      roleType: newOfficerForm.roleType,
      department:
        newOfficerForm.roleType === "TPO"
          ? "Training & Placement Cell (TPO)"
          : newOfficerForm.department,
      designation: newOfficerForm.designation.trim() || `${newOfficerForm.roleType} Officer`,
      specialization: newOfficerForm.specialization.trim() || "Operations & Academic Oversight",
      appointedRole: newOfficerForm.appointedRole.trim() || `${newOfficerForm.roleType} Lead`,
      publicationsCount: newOfficerForm.roleType === "Faculty" ? 5 : undefined,
      status: "Active",
    };
    setOfficers((prev) => [created, ...prev]);
    setShowAddOfficerModal(false);
    setNewOfficerForm({
      name: "",
      email: "",
      roleType: "Faculty",
      department: "Artificial Intelligence & Machine Learning",
      designation: "",
      specialization: "",
      appointedRole: "",
    });
    showToast(`${created.roleType} "${created.name}" registered successfully.`);
  };

  const handleToggleOfficerStatus = (officerId: number) => {
    setOfficers((prev) =>
      prev.map((o) => {
        if (o.id === officerId) {
          const nextStatus = o.status === "Active" ? "Probation" : "Active";
          showToast(`Account "${o.name}" status updated to ${nextStatus}.`);
          return { ...o, status: nextStatus };
        }
        return o;
      })
    );
  };

  const handleSaveOfficerEdit = () => {
    if (!officerToEdit) return;
    setOfficers((prev) => prev.map((o) => (o.id === officerToEdit.id ? officerToEdit : o)));
    showToast(`Personnel record for "${officerToEdit.name}" updated successfully.`);
    setOfficerToEdit(null);
  };

  const confirmDeleteOfficer = async () => {
    if (!officerToDelete) return;
    setDeletingOfficer(true);
    try {
      await apiRequest(`/users/${officerToDelete.id}`, { method: "DELETE" });
    } catch (err: any) {
      console.warn("Delete officer fallback:", err);
    }
    setOfficers((prev) => prev.filter((o) => o.id !== officerToDelete.id));
    showToast(`${officerToDelete.roleType} account "${officerToDelete.name}" was permanently deleted.`);
    setOfficerToDelete(null);
    setDeletingOfficer(false);
  };

  // 3. Reported Posts Moderation
  const handlePassReport = (reportId: number) => {
    const post = reportedPosts.find((r) => r.id === reportId);
    setReportedPosts((prev) => prev.filter((r) => r.id !== reportId));

    try {
      const stored = localStorage.getItem("KNOTS_REPORTED_POSTS");
      if (stored) {
        const parsed = JSON.parse(stored);
        const updated = parsed.filter((r: any) => r.id !== reportId && r.postId !== post?.postId);
        localStorage.setItem("KNOTS_REPORTED_POSTS", JSON.stringify(updated));
      }
    } catch {}

    showToast("Report dismissed. Post passed and retained in feed.");
  };

  const handleDeleteReportedPost = async (reportId: number, postId: number) => {
    if (!window.confirm("Are you sure you want to permanently delete this reported post from the platform? This cannot be undone.")) {
      return;
    }
    try {
      await apiRequest(`/posts/${postId}`, { method: "DELETE" });
    } catch (err: any) {
      console.warn("Delete post fallback:", err);
    }

    setReportedPosts((prev) => prev.filter((r) => r.id !== reportId));

    try {
      const stored = localStorage.getItem("KNOTS_REPORTED_POSTS");
      if (stored) {
        const parsed = JSON.parse(stored);
        const updated = parsed.filter((r: any) => r.id !== reportId && r.postId !== postId);
        localStorage.setItem("KNOTS_REPORTED_POSTS", JSON.stringify(updated));
      }
    } catch {}

    window.dispatchEvent(new CustomEvent("knots-post-deleted", { detail: { postId } }));
    showToast("Violating post permanently deleted by administration.");
  };

  // 4. Events, Clubs, Opportunities Delete
  const handleDeleteEvent = async (eventId: number) => {
    const evt = events.find((e) => e.id === eventId);
    if (!evt) return;
    if (!window.confirm(`Are you sure you want to delete event "${evt.title}"? All student registrations will be removed.`)) {
      return;
    }
    try {
      await apiRequest(`/events/${eventId}`, { method: "DELETE" });
    } catch (err: any) {
      console.warn("Event delete notice:", err);
    }
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    showToast(`Event "${evt.title}" deleted successfully.`);
  };

  const handleDeleteClub = async (clubId: number) => {
    const clb = clubs.find((c) => c.id === clubId);
    if (!clb) return;
    if (!window.confirm(`Are you sure you want to disband club "${clb.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await apiRequest(`/clubs/${clubId}`, { method: "DELETE" });
    } catch (err: any) {
      console.warn("Club delete notice:", err);
    }
    setClubs((prev) => prev.filter((c) => c.id !== clubId));
    showToast(`Club "${clb.name}" deleted successfully.`);
  };

  const handleDeleteOpportunity = async (oppId: number) => {
    const opp = opportunities.find((o) => o.id === oppId);
    if (!opp) return;
    if (!window.confirm(`Are you sure you want to delete opportunity "${opp.title}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await apiRequest(`/opportunities/${oppId}`, { method: "DELETE" });
    } catch (err: any) {
      console.warn("Opportunity delete notice:", err);
    }
    setOpportunities((prev) => prev.filter((o) => o.id !== oppId));
    showToast(`Opportunity "${opp.title}" deleted successfully.`);
  };

  // ── EXCEL EXPORTS ────────────────────────────────────────────────────────────
  const handleExportStudents = () => {
    const scopedStudents = students.filter((s) => matchScope(s.department));
    const headers = ["Student ID", "Full Name", "PRN / Roll No", "Department", "Email Address", "Batch", "Academic Year", "CGPA", "Status"];
    const rows = scopedStudents.map((s) => [s.id, s.name, s.prn, s.department, s.email, s.batchYear, s.academicYear, s.cgpa, s.status]);
    exportToCsv(`${currentScopeLabel.replace(/[^a-zA-Z0-9]/g, "_")}_Students_Roster_2026`, headers, rows);
    showToast("Students Excel report downloaded successfully.");
  };

  const handleExportOfficers = () => {
    const scopedOfficers = officers.filter((o) => matchScope(o.department));
    const headers = ["Officer ID", "Full Name", "Role Category", "Department / Office", "Designation", "Email", "Appointed Role", "Status"];
    const rows = scopedOfficers.map((o) => [o.id, o.name, o.roleType, o.department, o.designation, o.email, o.appointedRole || "N/A", o.status]);
    exportToCsv(`${currentScopeLabel.replace(/[^a-zA-Z0-9]/g, "_")}_Officers_Faculty_Roster_2026`, headers, rows);
    showToast("Faculty & Officers Excel report downloaded successfully.");
  };

  const handleExportEvents = () => {
    const scopedEvents = events.filter(matchesEventScope);
    const headers = ["Event ID", "Event Title", "Department", "Category", "Scheduled Date", "Time", "Location", "Student Head", "Student Co-Head", "Coordinator", "Registrations", "Capacity"];
    const rows = scopedEvents.map((e) => [e.id, e.title, e.department, e.category, e.date, e.time, e.location, e.headName, e.coHeadName, e.facultyCoordinator, e.registrationsCount, e.capacity]);
    exportToCsv(`${currentScopeLabel.replace(/[^a-zA-Z0-9]/g, "_")}_Events_Summary_2026`, headers, rows);
    showToast("Events Excel report downloaded successfully.");
  };

  const handleExportOpportunities = () => {
    const scopedOpps = opportunities.filter(matchesOpportunityScope);
    const headers = ["Opportunity ID", "Role Title", "Department", "Company / Research Lab", "Opportunity Type", "Stipend / Package", "Deadline", "Total Applicants"];
    const rows = scopedOpps.map((o) => [o.id, o.title, o.department, o.companyOrLab, o.type, o.stipend, o.deadline, o.applicantsCount]);
    exportToCsv(`${currentScopeLabel.replace(/[^a-zA-Z0-9]/g, "_")}_Opportunities_Applications_2026`, headers, rows);
    showToast("Opportunities Excel report downloaded successfully.");
  };

  const handleExportMasterReport = () => {
    const headers = [
      "Record Type",
      "ID",
      "Title / Name",
      "Department / Unit",
      "Identifier / Role",
      "Status / Additional Detail",
      "Email / Contact",
      "Metrics / Count",
    ];

    const rows: (string | number)[][] = [];

    // Students
    students.filter((s) => matchScope(s.department)).forEach((s) => {
      rows.push(["STUDENT", s.id, s.name, s.department, s.prn, `CGPA: ${s.cgpa} (${s.status})`, s.email, s.batchYear]);
    });

    // Officers / Faculty / TPO
    officers.filter((o) => matchScope(o.department)).forEach((o) => {
      rows.push([o.roleType.toUpperCase(), o.id, o.name, o.department, o.designation, `${o.appointedRole || "Staff"} (${o.status})`, o.email, o.specialization]);
    });

    // Events
    events.filter(matchesEventScope).forEach((e) => {
      rows.push(["EVENT", e.id, e.title, e.department, e.category, `Venue: ${e.location}`, `Coord: ${e.facultyCoordinator}`, `Registrations: ${e.registrationsCount}/${e.capacity}`]);
    });

    // Clubs
    clubs.filter(matchesClubScope).forEach((c) => {
      rows.push(["CLUB", c.id, c.name, c.department, c.category, `Mentor: ${c.facultyMentor}`, `Alumni: ${c.alumniMentor}`, `Members: ${c.membersCount}`]);
    });

    // Opportunities
    opportunities.filter(matchesOpportunityScope).forEach((o) => {
      rows.push(["OPPORTUNITY", o.id, o.title, o.department, o.type, o.companyOrLab, `Stipend: ${o.stipend}`, `Applicants: ${o.applicantsCount}`]);
    });

    // Reported Posts
    reportedPosts.filter((r) => matchScope(r.department)).forEach((r) => {
      rows.push(["REPORTED_POST", r.id, r.authorName, r.department, `Post #${r.postId}`, `Flagged by ${r.reportedBy}: ${r.reportReason}`, r.authorEmail, `Status: ${r.status}`]);
    });

    exportToCsv(`${currentScopeLabel.replace(/[^a-zA-Z0-9]/g, "_")}_Master_Administration_Analytics_2026`, headers, rows);
    showToast("Master Administration Excel Report downloaded successfully.");
  };

  // ── FILTERED DATA ─────────────────────────────────────────────────────────────
  const visibleStudents = students.filter((s) => {
    if (!matchScope(s.department)) return false;
    const matchesYear = studentYearFilter === "All" || s.academicYear === studentYearFilter;
    const q = studentSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.prn.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q);
    return matchesYear && matchesSearch;
  });

  const visibleOfficers = officers.filter((o) => {
    if (!matchScope(o.department)) return false;
    const matchesRole = officerRoleFilter === "All" || o.roleType === officerRoleFilter;
    const q = officerSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      o.name.toLowerCase().includes(q) ||
      o.designation.toLowerCase().includes(q) ||
      o.specialization.toLowerCase().includes(q) ||
      o.department.toLowerCase().includes(q) ||
      o.email.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  const visibleReportedPosts = reportedPosts.filter((r) => matchScope(r.department));
  const visibleEvents = events.filter(matchesEventScope);
  const visibleClubs = clubs.filter(matchesClubScope);
  const visibleOpportunities = opportunities.filter(matchesOpportunityScope);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast Feedback */}
      {successToast && (
        <div className="fixed top-24 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{successToast}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HERO HEADER & SCOPE SELECTOR                                           */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1E2746] via-[#2A365D] to-[#4B63D2] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-[#4B63D2]/10 border border-white/10">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-sm">
                <ShieldCheck className="w-6 h-6 text-amber-300" />
              </span>

              {isCentralAdmin ? (
                <>
                  <span className="text-xs font-black uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/40 px-3.5 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-purple-300" />
                    <span>Central Admin Console (Master Authority)</span>
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full">
                    All Departments &amp; TPO
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-300/30 px-3.5 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-300" />
                    <span>Department Controller Console</span>
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider bg-white/15 text-white border border-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                    🔒 {departmentName}
                  </span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-white">
              {isCentralAdmin ? "Central Administration Command Dashboard" : `${departmentName} Controller Dashboard`}
            </h1>

            <p className="text-xs sm:text-sm font-medium leading-relaxed" style={{ color: "#F1F5F9" }}>
              {isCentralAdmin
                ? "Full administrative authority across all campus departments, TPO officers, controllers, and students. Perform comprehensive CRUD operations, moderate reports, and oversee college-wide programs."
                : `Official administrative console for ${departmentName}. Analyze and visualize students and faculty, oversee department events & clubs, manage rosters, and moderate reported posts.`}
            </p>

            {/* Central Admin Department & Unit Filter Dropdown */}
            {isCentralAdmin && (
              <div className="pt-2 flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-300" />
                  <span>Authority Scope:</span>
                </span>
                <select
                  value={selectedScope}
                  onChange={(e) => setSelectedScope(e.target.value)}
                  className="bg-white/20 hover:bg-white/25 border border-white/30 text-white font-bold text-xs rounded-xl px-3 py-1.5 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer"
                >
                  <option value="ALL" className="text-slate-900 font-bold">
                    🌐 All Departments &amp; TPO (Campus-Wide)
                  </option>
                  {CAMPUS_UNITS.map((dept) => (
                    <option key={dept} value={dept} className="text-slate-900 font-medium">
                      {dept === "Training & Placement Cell (TPO)" ? `💼 ${dept}` : `🏛️ ${dept}`}
                    </option>
                  ))}
                </select>

                {selectedScope !== "ALL" && (
                  <button
                    onClick={() => setSelectedScope("ALL")}
                    className="text-[11px] font-bold text-amber-200 underline hover:text-white cursor-pointer ml-1"
                  >
                    Reset to All
                  </button>
                )}
              </div>
            )}
          </div>

          {/* User Profile & Master Report Button */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 shrink-0">
            <div className="p-3 bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl text-left lg:text-right shadow-sm">
              <span className="text-[11px] font-bold block" style={{ color: "#CBD5E1" }}>
                Logged in Administrator:
              </span>
              <span className="text-xs font-black block" style={{ color: "#FFFFFF" }}>
                {currentUser?.profile?.first_name
                  ? `${currentUser.profile.first_name} ${currentUser.profile.last_name || ""}`.trim()
                  : isCentralAdmin
                  ? "Dr. Central Admin"
                  : "Prof. Amit Sharma"}
              </span>
              <span className="text-[10px] font-mono block font-bold" style={{ color: "#FCD34D" }}>
                {currentUser?.email || (isCentralAdmin ? "admin@sbjit.edu.in" : "controller.aiml@sbjit.edu.in")}
              </span>
            </div>

            <button
              onClick={handleExportMasterReport}
              className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer"
              title="Export all records to formatted Excel spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Master Excel Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. NAVIGATION TABS                                                        */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#EAE4F7] dark:border-slate-800">
        {[
          { key: "analytics", label: "Overview & Visualizations", icon: TrendingUp },
          { key: "students", label: `Students Directory (${visibleStudents.length})`, icon: Users },
          {
            key: "officers",
            label: isCentralAdmin
              ? `Faculty & Officers Roster (${visibleOfficers.length})`
              : `Faculty Roster (${visibleOfficers.length})`,
            icon: GraduationCap,
          },
          { key: "reported-posts", label: `Reported Posts (${visibleReportedPosts.length})`, icon: ShieldAlert },
          { key: "events", label: `Events & Registrations (${visibleEvents.length})`, icon: Calendar },
          { key: "clubs", label: `Clubs & Oversight (${visibleClubs.length})`, icon: Building },
          { key: "opportunities", label: `Opportunities (${visibleOpportunities.length})`, icon: Briefcase },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/25"
                  : "bg-white dark:bg-slate-900 text-[#5851A4] dark:text-slate-400 border border-[#EAE4F7] dark:border-slate-800 hover:border-[#4B63D2] hover:text-[#1E2746]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ANALYTICS & VISUALIZATIONS                                         */}
      {/* ========================================================================= */}
      {activeTab === "analytics" && (
        <div className="space-y-8">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-[#EAE4F7] dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between text-[#4B63D2]">
                <Users className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-50 text-[#4B63D2]">
                  Students
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-[#1E2746] dark:text-white">{visibleStudents.length}</p>
              <p className="text-xs font-bold text-[#5851A4]">Enrolled Students</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-[#EAE4F7] dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between text-indigo-600">
                <GraduationCap className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                  Personnel
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-[#1E2746] dark:text-white">{visibleOfficers.length}</p>
              <p className="text-xs font-bold text-[#5851A4]">Faculty &amp; Officers</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-[#EAE4F7] dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between text-rose-600">
                <ShieldAlert className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
                  Reports
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-[#1E2746] dark:text-white">{visibleReportedPosts.length}</p>
              <p className="text-xs font-bold text-[#5851A4]">Reported Posts</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-[#EAE4F7] dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between text-emerald-600">
                <Calendar className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  Events
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-[#1E2746] dark:text-white">
                {visibleEvents.reduce((acc, e) => acc + e.registrationsCount, 0)}
              </p>
              <p className="text-xs font-bold text-[#5851A4]">Event Registrations</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-[#EAE4F7] dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between text-amber-600">
                <Building className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                  Clubs
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-[#1E2746] dark:text-white">
                {visibleClubs.reduce((acc, c) => acc + c.membersCount, 0)}
              </p>
              <p className="text-xs font-bold text-[#5851A4]">Club Memberships</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-[#EAE4F7] dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between text-rose-600">
                <Briefcase className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
                  Careers
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-[#1E2746] dark:text-white">
                {visibleOpportunities.reduce((acc, o) => acc + o.applicantsCount, 0)}
              </p>
              <p className="text-xs font-bold text-[#5851A4]">Applications Submitted</p>
            </div>
          </div>

          {/* Visual Analysis & Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Student Year-Wise Distribution */}
            <div className="bg-white dark:bg-slate-900 border border-[#EAE4F7] dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-[#1E2746] dark:text-white">
                    Student Enrollment by Academic Year
                  </h3>
                  <p className="text-xs text-[#5851A4] font-medium">Batch progression across {currentScopeLabel}</p>
                </div>
                <BarChart3 className="w-5 h-5 text-[#4B63D2]" />
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { year: "4th Year (Class of 2026)", count: 72, pct: "90%", color: "bg-indigo-600" },
                  { year: "3rd Year (Class of 2027)", count: 80, pct: "100%", color: "bg-[#4B63D2]" },
                  { year: "2nd Year (Class of 2028)", count: 76, pct: "95%", color: "bg-purple-600" },
                  { year: "1st Year (Class of 2029)", count: 68, pct: "85%", color: "bg-emerald-600" },
                ].map((row, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-[#1E2746] dark:text-slate-200">
                      <span>{row.year}</span>
                      <span className="font-mono text-[#4B63D2]">{row.count} Students</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-[#FAF9FD] dark:bg-slate-800 overflow-hidden border border-[#EAE4F7] dark:border-slate-700">
                      <div className={`h-full rounded-full ${row.color}`} style={{ width: row.pct }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Event Registrations vs Capacity */}
            <div className="bg-white dark:bg-slate-900 border border-[#EAE4F7] dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-[#1E2746] dark:text-white">
                    Event Registrations &amp; Engagement
                  </h3>
                  <p className="text-xs text-[#5851A4] font-medium">Student response across events</p>
                </div>
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>

              <div className="space-y-3 pt-2">
                {visibleEvents.map((evt) => {
                  const pct = Math.min(100, Math.round((evt.registrationsCount / evt.capacity) * 100));
                  return (
                    <div key={evt.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-[#1E2746] dark:text-slate-200">
                        <span className="truncate max-w-[240px]">{evt.title}</span>
                        <span className="font-mono text-emerald-600">
                          {evt.registrationsCount} / {evt.capacity} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-[#FAF9FD] dark:bg-slate-800 overflow-hidden border border-[#EAE4F7] dark:border-slate-700">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STUDENTS DIRECTORY & MANAGEMENT (CRUD)                             */}
      {/* ========================================================================= */}
      {activeTab === "students" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-[#1E2746] dark:text-white">
                {currentScopeLabel} Students Directory
              </h3>
              <p className="text-xs text-[#5851A4] font-medium">
                {isCentralAdmin
                  ? "Central Admin can create, edit, toggle probation, and delete student accounts across all departments."
                  : `Controllers can inspect records and delete student accounts belonging to ${departmentName}.`}
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Central Admin Create Student Button */}
              {isCentralAdmin && (
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#4B63D2] hover:bg-[#3E52B5] text-white text-xs font-black shadow-md shadow-[#4B63D2]/25 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Student Account</span>
                </button>
              )}

              <button
                onClick={handleExportStudents}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Students Excel</span>
              </button>
            </div>
          </div>

          {/* Search & Year Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-[#EAE4F7] dark:border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#9188BE] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search students by name, PRN, email, or dept..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#FAF9FD] dark:bg-slate-800 border border-[#D5CBEE] dark:border-slate-700 rounded-xl text-xs font-medium text-[#1E2746] dark:text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              {["All", "1st Year", "2nd Year", "3rd Year", "4th Year"].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setStudentYearFilter(yr)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                    studentYearFilter === yr
                      ? "bg-[#4B63D2] text-white shadow-xs"
                      : "bg-[#FAF9FD] dark:bg-slate-800 text-[#5851A4] border border-[#EAE4F7] dark:border-slate-700"
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white dark:bg-slate-900 border border-[#EAE4F7] dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9FD] dark:bg-slate-800/60 border-b border-[#EAE4F7] dark:border-slate-800 text-[#5851A4] font-black uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Student Name &amp; Email</th>
                    <th className="px-5 py-3.5">Department</th>
                    <th className="px-5 py-3.5">PRN Number</th>
                    <th className="px-5 py-3.5">Academic Year</th>
                    <th className="px-5 py-3.5">CGPA</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE4F7] dark:divide-slate-800 font-medium text-[#1E2746] dark:text-slate-200">
                  {visibleStudents.length > 0 ? (
                    visibleStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-[#FAF9FD] dark:hover:bg-slate-800/40 transition">
                        <td className="px-5 py-4">
                          <div className="font-black text-sm text-[#1E2746] dark:text-white">{s.name}</div>
                          <div className="text-[11px] text-[#5851A4] font-mono">{s.email}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] border border-slate-200 dark:border-slate-700">
                            {s.department}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono font-bold text-[#4B63D2]">{s.prn}</td>
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#4B63D2] font-black text-[10px]">
                            {s.academicYear}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono font-black">{s.cgpa}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-black text-[10px] ${
                              s.status === "Active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Central Admin Edit & Status Toggle */}
                            {isCentralAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleStudentStatus(s.id)}
                                  className={`p-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                                    s.status === "Active"
                                      ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                                      : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                                  }`}
                                  title={s.status === "Active" ? "Put on Academic Probation" : "Restore to Active Status"}
                                >
                                  {s.status === "Active" ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setStudentToEdit(s)}
                                  className="p-1.5 rounded-xl bg-[#FAF9FD] hover:bg-blue-50 text-[#4B63D2] border border-[#EAE4F7] text-xs font-bold transition cursor-pointer"
                                  title="Edit Student Information"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {/* Delete Student Account (Available to Controller for their dept, and Central Admin for everyone) */}
                            <button
                              type="button"
                              onClick={() => setStudentToDelete(s)}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Delete Student Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-[#9188BE] italic">
                        No students found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: FACULTY, TPO & OFFICERS ROSTER (CRUD)                               */}
      {/* ========================================================================= */}
      {activeTab === "officers" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-[#1E2746] dark:text-white">
                {isCentralAdmin ? "Faculty, TPO & Department Controllers Roster" : `${departmentName} Faculty Directory`}
              </h3>
              <p className="text-xs text-[#5851A4] font-medium">
                {isCentralAdmin
                  ? "Central Admin has full CRUD authority on everyone: Professors, TPO Officers, and Department Controllers."
                  : `Directory of professors and appointed coordinators in ${departmentName}.`}
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Central Admin Appoint Officer Button */}
              {isCentralAdmin && (
                <button
                  type="button"
                  onClick={() => setShowAddOfficerModal(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-600/25 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Appoint / Register Personnel</span>
                </button>
              )}

              <button
                onClick={handleExportOfficers}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Roster Excel</span>
              </button>
            </div>
          </div>

          {/* Search & Role Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-[#EAE4F7] dark:border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#9188BE] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, designation, specialization, or dept..."
                value={officerSearch}
                onChange={(e) => setOfficerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#FAF9FD] dark:bg-slate-800 border border-[#D5CBEE] dark:border-slate-700 rounded-xl text-xs font-medium text-[#1E2746] dark:text-white focus:outline-none"
              />
            </div>

            {isCentralAdmin && (
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                {(["All", "Faculty", "TPO", "Controller"] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => setOfficerRoleFilter(role)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                      officerRoleFilter === role
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-[#FAF9FD] dark:bg-slate-800 text-[#5851A4] border border-[#EAE4F7] dark:border-slate-700"
                    }`}
                  >
                    {role === "All" ? "All Personnel" : role === "TPO" ? "TPO Officers" : role === "Controller" ? "Controllers" : "Faculty"}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-[#EAE4F7] dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9FD] dark:bg-slate-800/60 border-b border-[#EAE4F7] dark:border-slate-800 text-[#5851A4] font-black uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Name &amp; Email</th>
                    <th className="px-5 py-3.5">Role Type</th>
                    <th className="px-5 py-3.5">Department / Unit</th>
                    <th className="px-5 py-3.5">Designation</th>
                    <th className="px-5 py-3.5">Domain / Specialization</th>
                    <th className="px-5 py-3.5">Status</th>
                    {isCentralAdmin && <th className="px-5 py-3.5 text-right">Master Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE4F7] dark:divide-slate-800 font-medium text-[#1E2746] dark:text-slate-200">
                  {visibleOfficers.length > 0 ? (
                    visibleOfficers.map((f) => (
                      <tr key={f.id} className="hover:bg-[#FAF9FD] dark:hover:bg-slate-800/40 transition">
                        <td className="px-5 py-4">
                          <div className="font-black text-sm text-[#1E2746] dark:text-white">{f.name}</div>
                          <div className="text-[11px] text-[#5851A4] font-mono">{f.email}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-black text-[10px] ${
                              f.roleType === "TPO"
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : f.roleType === "Controller"
                                ? "bg-purple-100 text-purple-800 border border-purple-300"
                                : "bg-blue-50 text-[#4B63D2] border border-blue-200"
                            }`}
                          >
                            {f.roleType === "TPO" ? "💼 TPO Officer" : f.roleType === "Controller" ? "🔒 Controller" : "🎓 Faculty"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{f.department}</span>
                        </td>
                        <td className="px-5 py-4 font-bold text-[#4B63D2]">{f.designation}</td>
                        <td className="px-5 py-4">{f.specialization}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-black text-[10px] ${
                              f.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {f.status}
                          </span>
                        </td>
                        {isCentralAdmin && (
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleOfficerStatus(f.id)}
                                className={`p-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                                  f.status === "Active"
                                    ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                                }`}
                                title={f.status === "Active" ? "Put Account on Probation" : "Restore Account to Active"}
                              >
                                {f.status === "Active" ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => setOfficerToEdit(f)}
                                className="p-1.5 rounded-xl bg-[#FAF9FD] hover:bg-indigo-50 text-indigo-600 border border-[#EAE4F7] text-xs font-bold transition cursor-pointer"
                                title="Edit Personnel Record"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setOfficerToDelete(f)}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                title="Delete Personnel Account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Delete</span>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isCentralAdmin ? 7 : 6} className="px-5 py-8 text-center text-[#9188BE] italic">
                        No personnel found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: REPORTED POSTS & SAFETY MODERATION                                 */}
      {/* ========================================================================= */}
      {activeTab === "reported-posts" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl font-black text-[#1E2746] dark:text-white">
                  {currentScopeLabel} Reported Posts &amp; Safety Moderation
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-700 border border-rose-200">
                  {visibleReportedPosts.length} Pending Moderation
                </span>
              </div>
              <p className="text-xs text-[#5851A4] dark:text-slate-400 font-medium pt-1">
                {isCentralAdmin
                  ? "Central Admin has platform-wide authority to review, dismiss, or delete reported violating content across all departments."
                  : `Posts authored by students or faculty in ${departmentName} flagged by community members.`}
              </p>
            </div>
          </div>

          {visibleReportedPosts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-[#EAE4F7] dark:border-slate-800 rounded-3xl p-12 text-center space-y-3 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-black text-[#1E2746] dark:text-white">
                No Pending Reported Posts
              </h4>
              <p className="text-xs text-[#5851A4] dark:text-slate-400 max-w-md mx-auto">
                All posts under this scope adhere to campus safety guidelines. New community reports will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {visibleReportedPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white dark:bg-slate-900 border-2 border-rose-100 dark:border-rose-950/40 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    {/* Reporter Alert Banner */}
                    <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Reported by <strong>{post.reportedBy}</strong> ({post.reporterRole})</span>
                        </div>
                        <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                          {post.reportedAt}
                        </span>
                      </div>
                      <div className="text-xs font-black text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                        <Flag className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>Reason: {post.reportReason}</span>
                      </div>
                      {post.reportDetails && (
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 italic bg-white/70 dark:bg-slate-900/60 p-2 rounded-xl border border-amber-200/50">
                          "{post.reportDetails}"
                        </p>
                      )}
                    </div>

                    {/* Post Author Info */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#5851A4] to-[#4B63D2] text-white flex items-center justify-center font-black text-xs">
                          {post.authorName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-black text-[#1E2746] dark:text-white">{post.authorName}</div>
                          <span className="text-[10px] font-bold text-[#5851A4]">{post.authorRole} • {post.authorEmail}</span>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#4B63D2] border border-blue-200">
                        {post.department}
                      </span>
                    </div>

                    {/* Post Content */}
                    <p className="text-xs sm:text-sm text-[#1E2746] dark:text-slate-200 leading-relaxed font-medium">
                      {post.content}
                    </p>

                    {post.imageUrl && (
                      <div className="rounded-2xl overflow-hidden aspect-video bg-slate-950">
                        <img src={post.imageUrl} alt="post media" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Moderation Actions: Pass or Delete */}
                  <div className="pt-3 border-t border-[#EAE4F7] dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="text-xs text-[#5851A4] font-semibold">
                      ❤️ {post.likes} • 💬 {post.commentsCount}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePassReport(post.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                        title="Pass post and dismiss community report"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Pass / Dismiss</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteReportedPost(post.id, post.postId)}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-rose-600/20"
                        title="Permanently delete violating post from platform"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Post</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: EVENTS & REGISTRATIONS                                             */}
      {/* ========================================================================= */}
      {activeTab === "events" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-[#1E2746] dark:text-white">
                {currentScopeLabel} Events &amp; Registrations
              </h3>
              <p className="text-xs text-[#5851A4] font-medium">
                Monitor events, faculty &amp; student coordinators, registrations, and delete/manage programs.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handleExportEvents}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Events Excel</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-white dark:bg-slate-900 border border-[#EAE4F7] dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase bg-[#4B63D2]/10 text-[#4B63D2] border border-[#4B63D2]/20">
                      {evt.department} • {evt.category}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      {evt.registrationsCount} / {evt.capacity} Registered
                    </span>
                  </div>

                  <h4 className="text-lg font-black text-[#1E2746] dark:text-white">{evt.title}</h4>

                  <div className="space-y-1.5 text-xs text-[#5851A4] dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#4B63D2]" />
                      <span>{evt.date} • {evt.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#4B63D2]" />
                      <span>{evt.location}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#EAE4F7] dark:border-slate-800 space-y-1.5 text-xs">
                    {evt.organizerName && (
                      <div className="text-[11px] text-[#5851A4] flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">Posted by:</span>
                        <span className="font-bold text-[#1E2746] dark:text-white">{evt.organizerName}</span>
                        {evt.organizerRole && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                            {evt.organizerRole}
                          </span>
                        )}
                        {evt.organizerDepartment && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25">
                            {evt.organizerDepartment}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="font-bold text-[#1E2746] dark:text-white">Appointed Leadership:</div>
                    <div className="text-[#5851A4] text-[11px]">
                      👑 Head: <strong className="text-[#1E2746] dark:text-slate-200">{evt.headName}</strong> • Co-Head: <strong className="text-[#1E2746] dark:text-slate-200">{evt.coHeadName}</strong>
                    </div>
                    <div className="text-[#5851A4] text-[11px]">
                      🎓 Faculty Coordinator: <strong className="text-emerald-600">{evt.facultyCoordinator}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EAE4F7] dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectEventRegistrations(evt)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#FAF9FD] dark:bg-slate-800 hover:bg-[#EAE4F7] text-[#4B63D2] font-black text-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Registered Students ({evt.registrations.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(evt.id)}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    title={`Delete event "${evt.title}"`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Event</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: CLUBS & OVERSIGHT                                                  */}
      {/* ========================================================================= */}
      {activeTab === "clubs" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-[#1E2746] dark:text-white">
                {currentScopeLabel} Clubs &amp; Societies
              </h3>
              <p className="text-xs text-[#5851A4] font-medium">
                Student clubs and societies oversight across {currentScopeLabel}.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleClubs.map((club) => (
              <div
                key={club.id}
                className="bg-white dark:bg-slate-900 border border-[#EAE4F7] dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase bg-purple-50 text-purple-700 border border-purple-200">
                    {club.department} • {club.category}
                  </span>
                  <span className="text-xs font-bold text-[#5851A4]">{club.membersCount} Members</span>
                </div>

                <h4 className="text-lg font-black text-[#1E2746] dark:text-white">{club.name}</h4>

                <div className="space-y-2 text-xs pt-1 border-t border-[#EAE4F7] dark:border-slate-800">
                  {club.creatorName && (
                    <div className="text-[11px] text-[#5851A4] flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">Created by:</span>
                      <span className="font-bold text-[#1E2746] dark:text-white">{club.creatorName}</span>
                      {club.creatorRole && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25">
                          {club.creatorRole}
                        </span>
                      )}
                      {club.creatorDepartment && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25">
                          {club.creatorDepartment}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="text-[11px] text-[#5851A4]">
                    👑 Student Head: <strong className="text-[#1E2746] dark:text-slate-200">{club.headName}</strong>
                  </div>
                  <div className="text-[11px] text-[#5851A4]">
                    🎖️ Student Co-Head: <strong className="text-[#1E2746] dark:text-slate-200">{club.coHeadName}</strong>
                  </div>
                  <div className="text-[11px] text-[#5851A4]">
                    🎓 Faculty Mentor: <strong className="text-emerald-600">{club.facultyMentor}</strong>
                  </div>
                  <div className="text-[11px] text-[#5851A4]">
                    🤝 Alumni Mentor: <strong className="text-amber-600">{club.alumniMentor}</strong>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EAE4F7] dark:border-slate-800 flex items-center justify-between gap-2 text-xs font-bold text-[#5851A4]">
                  <div className="flex items-center gap-3">
                    <span>📚 {club.resourcesCount} Resources</span>
                    <span>📸 {club.galleryCount} Archives</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteClub(club.id)}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    title={`Delete/Disband club "${club.name}"`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Club</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: OPPORTUNITIES & PLACEMENTS                                         */}
      {/* ========================================================================= */}
      {activeTab === "opportunities" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-[#1E2746] dark:text-white">
                {currentScopeLabel} Opportunities &amp; Placements
              </h3>
              <p className="text-xs text-[#5851A4] font-medium">
                Review internships, TPO corporate recruitment drives, and student applications.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handleExportOpportunities}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Applications Excel</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="bg-white dark:bg-slate-900 border border-[#EAE4F7] dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase bg-blue-50 text-[#4B63D2] border border-blue-200">
                      {opp.department} • {opp.type}
                    </span>
                    <span className="text-xs font-bold text-[#5851A4]">
                      Deadline: {opp.deadline}
                    </span>
                  </div>

                  <h4 className="text-lg font-black text-[#1E2746] dark:text-white">{opp.title}</h4>
                  <p className="text-xs font-bold text-[#5851A4]">{opp.companyOrLab}</p>
                  <p className="text-xs font-mono font-bold text-emerald-600">{opp.stipend}</p>

                  {opp.postedByName && (
                    <div className="text-[11px] text-[#5851A4] flex items-center gap-1.5 flex-wrap pt-2 border-t border-[#EAE4F7] dark:border-slate-800">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">Posted by:</span>
                      <span className="font-bold text-[#1E2746] dark:text-white">{opp.postedByName}</span>
                      {opp.postedByRole && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25">
                          {opp.postedByRole}
                        </span>
                      )}
                      {opp.postedByDepartment && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25">
                          {opp.postedByDepartment}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#EAE4F7] dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectOpportunityApplicants(opp)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#FAF9FD] dark:bg-slate-800 hover:bg-[#EAE4F7] text-[#4B63D2] font-black text-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Student Applicants ({opp.applicants.length})</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#5851A4] hidden sm:inline">{opp.applicantsCount} Total Applications</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteOpportunity(opp.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                      title={`Delete opportunity "${opp.title}"`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD STUDENT ACCOUNT (CENTRAL ADMIN CRUD)                            */}
      {/* ========================================================================= */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-[#EAE4F7] dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#EAE4F7] dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-[#1E2746] dark:text-white">Create New Student Account</h3>
                <p className="text-xs text-[#5851A4]">Central Admin Master Creation Tool</p>
              </div>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="p-1 hover:bg-[#FAF9FD] dark:hover:bg-slate-800 rounded-full text-[#9188BE]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Yash Kulkarni"
                  value={newStudentForm.name}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF9FD] dark:bg-slate-800 border border-[#D5CBEE] dark:border-slate-700 rounded-xl font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. yash.k@sbjit.edu.in"
                  value={newStudentForm.email}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF9FD] dark:bg-slate-800 border border-[#D5CBEE] dark:border-slate-700 rounded-xl font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">PRN / Roll Number</label>
                  <input
                    type="text"
                    placeholder="e.g. PRN2024AIML099"
                    value={newStudentForm.prn}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, prn: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF9FD] dark:bg-slate-800 border border-[#D5CBEE] dark:border-slate-700 rounded-xl font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={newStudentForm.cgpa}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, cgpa: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-[#FAF9FD] dark:bg-slate-800 border border-[#D5CBEE] dark:border-slate-700 rounded-xl font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Department</label>
                  <select
                    value={newStudentForm.department}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF9FD] dark:bg-slate-800 border border-[#D5CBEE] dark:border-slate-700 rounded-xl font-medium focus:outline-none"
                  >
                    {CAMPUS_UNITS.filter((d) => d !== "Training & Placement Cell (TPO)").map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Academic Year</label>
                  <select
                    value={newStudentForm.academicYear}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, academicYear: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#FAF9FD] dark:bg-slate-800 border border-[#D5CBEE] dark:border-slate-700 rounded-xl font-medium focus:outline-none"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#EAE4F7] dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddStudentModal(false)}
                className="px-4 py-2 rounded-xl border border-[#EAE4F7] dark:border-slate-700 text-xs font-bold text-[#5851A4]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddStudent}
                className="px-5 py-2 rounded-xl bg-[#4B63D2] text-white text-xs font-black"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT STUDENT ACCOUNT (CENTRAL ADMIN CRUD)                           */}
      {/* ========================================================================= */}
      {studentToEdit && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-[#EAE4F7] dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#EAE4F7] dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-[#1E2746] dark:text-white">Edit Student Account</h3>
                <p className="text-xs text-[#5851A4]">{studentToEdit.prn}</p>
              </div>
              <button
                onClick={() => setStudentToEdit(null)}
                className="p-1 hover:bg-[#FAF9FD] dark:hover:bg-slate-800 rounded-full text-[#9188BE]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={studentToEdit.name}
                  onChange={(e) => setStudentToEdit({ ...studentToEdit, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF9FD] dark:bg-slate-800 border border-[#D5CBEE] dark:border-slate-700 rounded-xl font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={studentToEdit.email}
                  onChange={(e) => setStudentToEdit({ ...studentToEdit, email: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF9FD] dark:bg-slate-800 border border-[#D5CBEE] dark:border-slate-700 rounded-xl font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Department</label>
                  <select
                    value={studentToEdit.department}
                    onChange={(e) => setStudentToEdit({ ...studentToEdit, department: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF9FD] dark:bg-slate-800 border border-[#D5CBEE] dark:border-slate-700 rounded-xl font-medium focus:outline-none"
                  >
                    {CAMPUS_UNITS.filter((d) => d !== "Training & Placement Cell (TPO)").map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Academic Status</label>
                  <select
                    value={studentToEdit.status}
                    onChange={(e) => setStudentToEdit({ ...studentToEdit, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#FAF9FD] dark:bg-slate-800 border border-[#D5CBEE] dark:border-slate-700 rounded-xl font-medium focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Probation">Probation</option>
                    <option value="Graduated">Graduated</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Academic Year</label>
                  <select
                    value={studentToEdit.academicYear}
                    onChange={(e) => setStudentToEdit({ ...studentToEdit, academicYear: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#FAF9FD] dark:bg-slate-800 border border-[#D5CBEE] dark:border-slate-700 rounded-xl font-medium focus:outline-none"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    value={studentToEdit.cgpa}
                    onChange={(e) => setStudentToEdit({ ...studentToEdit, cgpa: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-[#FAF9FD] dark:bg-slate-800 border border-[#D5CBEE] dark:border-slate-700 rounded-xl font-medium focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#EAE4F7] dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStudentToEdit(null)}
                className="px-4 py-2 rounded-xl border border-[#EAE4F7] dark:border-slate-700 text-xs font-bold text-[#5851A4]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStudentEdit}
                className="px-5 py-2 rounded-xl bg-[#4B63D2] text-white text-xs font-black"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD PERSONNEL (FACULTY / TPO / CONTROLLER)                          */}
      {/* ========================================================================= */}
      {showAddOfficerModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-[#EAE4F7] dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#EAE4F7] dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-[#1E2746] dark:text-white">Appoint / Register Personnel</h3>
                <p className="text-xs text-[#5851A4]">Appoint Faculty, TPO Officers, or Department Controllers</p>
              </div>
              <button
                onClick={() => setShowAddOfficerModal(false)}
                className="p-1 hover:bg-[#FAF9FD] dark:hover:bg-slate-800 rounded-full text-[#9188BE]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Personnel Role Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "Faculty", label: "🎓 Faculty" },
                    { id: "TPO", label: "💼 TPO Officer" },
                    { id: "Controller", label: "🔒 Controller" },
                  ].map((rt) => (
                    <button
                      key={rt.id}
                      type="button"
                      onClick={() =>
                        setNewOfficerForm({
                          ...newOfficerForm,
                          roleType: rt.id as any,
                          department: rt.id === "TPO" ? "Training & Placement Cell (TPO)" : newOfficerForm.department,
                        })
                      }
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        newOfficerForm.roleType === rt.id
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-[#FAF9FD] text-slate-700 border-slate-200 hover:border-indigo-400"
                      }`}
                    >
                      {rt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Rajesh Verma"
                  value={newOfficerForm.name}
                  onChange={(e) => setNewOfficerForm({ ...newOfficerForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF9FD] dark:bg-slate-800 border border-[#D5CBEE] dark:border-slate-700 rounded-xl font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Official Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. rajesh.verma@sbjit.edu.in"
                  value={newOfficerForm.email}
                  onChange={(e) => setNewOfficerForm({ ...newOfficerForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF9FD] dark:bg-slate-800 border border-[#D5CBEE] dark:border-slate-700 rounded-xl font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Department / Office</label>
                  <select
                    disabled={newOfficerForm.roleType === "TPO"}
                    value={newOfficerForm.department}
                    onChange={(e) => setNewOfficerForm({ ...newOfficerForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF9FD] dark:bg-slate-800 border border-[#D5CBEE] dark:border-slate-700 rounded-xl font-medium focus:outline-none disabled:opacity-60"
                  >
                    {CAMPUS_UNITS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Official Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Associate Professor / Senior TPO"
                    value={newOfficerForm.designation}
                    onChange={(e) => setNewOfficerForm({ ...newOfficerForm, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF9FD] dark:bg-slate-800 border border-[#D5CBEE] dark:border-slate-700 rounded-xl font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Domain / Specialization</label>
                <input
                  type="text"
                  placeholder="e.g. Cloud Computing & Big Data, or MNC Placements"
                  value={newOfficerForm.specialization}
                  onChange={(e) => setNewOfficerForm({ ...newOfficerForm, specialization: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF9FD] dark:bg-slate-800 border border-[#D5CBEE] dark:border-slate-700 rounded-xl font-medium focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#EAE4F7] dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddOfficerModal(false)}
                className="px-4 py-2 rounded-xl border border-[#EAE4F7] dark:border-slate-700 text-xs font-bold text-[#5851A4]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddOfficer}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black"
              >
                Confirm Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT PERSONNEL (CENTRAL ADMIN CRUD)                                 */}
      {/* ========================================================================= */}
      {officerToEdit && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-[#EAE4F7] dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#EAE4F7] dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-[#1E2746] dark:text-white">Edit Personnel Record</h3>
                <p className="text-xs text-[#5851A4]">{officerToEdit.name} ({officerToEdit.roleType})</p>
              </div>
              <button
                onClick={() => setOfficerToEdit(null)}
                className="p-1 hover:bg-[#FAF9FD] dark:hover:bg-slate-800 rounded-full text-[#9188BE]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={officerToEdit.name}
                  onChange={(e) => setOfficerToEdit({ ...officerToEdit, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF9FD] dark:bg-slate-800 border border-[#D5CBEE] dark:border-slate-700 rounded-xl font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={officerToEdit.email}
                  onChange={(e) => setOfficerToEdit({ ...officerToEdit, email: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF9FD] dark:bg-slate-800 border border-[#D5CBEE] dark:border-slate-700 rounded-xl font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Designation</label>
                  <input
                    type="text"
                    value={officerToEdit.designation}
                    onChange={(e) => setOfficerToEdit({ ...officerToEdit, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF9FD] dark:bg-slate-800 border border-[#D5CBEE] dark:border-slate-700 rounded-xl font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Status</label>
                  <select
                    value={officerToEdit.status}
                    onChange={(e) => setOfficerToEdit({ ...officerToEdit, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#FAF9FD] dark:bg-slate-800 border border-[#D5CBEE] dark:border-slate-700 rounded-xl font-medium focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Probation">Probation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Domain / Specialization</label>
                <input
                  type="text"
                  value={officerToEdit.specialization}
                  onChange={(e) => setOfficerToEdit({ ...officerToEdit, specialization: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF9FD] dark:bg-slate-800 border border-[#D5CBEE] dark:border-slate-700 rounded-xl font-medium focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#EAE4F7] dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOfficerToEdit(null)}
                className="px-4 py-2 rounded-xl border border-[#EAE4F7] dark:border-slate-700 text-xs font-bold text-[#5851A4]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveOfficerEdit}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRM DELETE STUDENT ACCOUNT                                     */}
      {/* ========================================================================= */}
      {studentToDelete && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-[#EAE4F7] dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#1E2746] dark:text-white">Delete Student Account</h3>
                <p className="text-xs text-[#5851A4]">
                  {isCentralAdmin ? "Campus-Wide Master Deletion" : `${departmentName} Scoped Deletion`}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#1E2746] dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete the student account for{" "}
              <strong className="text-rose-600 font-bold">{studentToDelete.name}</strong> ({studentToDelete.prn})
              belonging to <strong>{studentToDelete.department}</strong>? This will erase their login credentials and student records.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#EAE4F7] dark:border-slate-800">
              <button
                type="button"
                disabled={deletingStudent}
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 rounded-xl border border-[#EAE4F7] dark:border-slate-700 text-xs font-bold text-[#5851A4] hover:bg-[#FAF9FD] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingStudent}
                onClick={confirmDeleteStudent}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/20"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deletingStudent ? "Deleting..." : "Confirm & Delete Account"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRM DELETE OFFICER / PERSONNEL ACCOUNT                         */}
      {/* ========================================================================= */}
      {officerToDelete && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-[#EAE4F7] dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#1E2746] dark:text-white">Delete Personnel Account</h3>
                <p className="text-xs text-[#5851A4]">Central Admin Master Authority</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#1E2746] dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete the account for{" "}
              <strong className="text-rose-600 font-bold">{officerToDelete.name}</strong> ({officerToDelete.roleType} - {officerToDelete.designation})
              from <strong>{officerToDelete.department}</strong>?
            </p>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#EAE4F7] dark:border-slate-800">
              <button
                type="button"
                disabled={deletingOfficer}
                onClick={() => setOfficerToDelete(null)}
                className="px-4 py-2 rounded-xl border border-[#EAE4F7] dark:border-slate-700 text-xs font-bold text-[#5851A4] hover:bg-[#FAF9FD] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingOfficer}
                onClick={confirmDeleteOfficer}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/20"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deletingOfficer ? "Deleting..." : "Confirm & Delete Personnel"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INSPECT EVENT REGISTRATIONS                                        */}
      {/* ========================================================================= */}
      {inspectEventRegistrations && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl border border-[#EAE4F7] dark:border-slate-800 animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EAE4F7] dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-[#1E2746] dark:text-white">
                  {inspectEventRegistrations.title}
                </h3>
                <p className="text-xs text-[#5851A4]">
                  Registered Attendees Roster ({inspectEventRegistrations.registrationsCount} Confirmed)
                </p>
              </div>
              <button
                onClick={() => setInspectEventRegistrations(null)}
                className="p-1 hover:bg-[#FAF9FD] dark:hover:bg-slate-800 rounded-full text-[#9188BE]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9FD] dark:bg-slate-800/60 text-[#5851A4] font-black uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-2.5">Student Name</th>
                    <th className="px-4 py-2.5">PRN Number</th>
                    <th className="px-4 py-2.5">Email</th>
                    <th className="px-4 py-2.5">Registration Date</th>
                    <th className="px-4 py-2.5">RSVP Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE4F7] dark:divide-slate-800 font-medium">
                  {inspectEventRegistrations.registrations.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3 font-bold text-[#1E2746] dark:text-white">{r.studentName}</td>
                      <td className="px-4 py-3 font-mono text-[#4B63D2]">{r.studentPrn}</td>
                      <td className="px-4 py-3 text-[#5851A4]">{r.email}</td>
                      <td className="px-4 py-3">{r.registeredAt}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-black text-[10px]">
                          {r.rsvpStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-[#EAE4F7] dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectEventRegistrations(null)}
                className="px-4 py-2 rounded-xl bg-[#4B63D2] text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INSPECT OPPORTUNITY APPLICANTS                                      */}
      {/* ========================================================================= */}
      {inspectOpportunityApplicants && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl border border-[#EAE4F7] dark:border-slate-800 animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EAE4F7] dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-[#1E2746] dark:text-white">
                  {inspectOpportunityApplicants.title}
                </h3>
                <p className="text-xs text-[#5851A4]">
                  Applicant Candidates ({inspectOpportunityApplicants.applicantsCount} Total Applications)
                </p>
              </div>
              <button
                onClick={() => setInspectOpportunityApplicants(null)}
                className="p-1 hover:bg-[#FAF9FD] dark:hover:bg-slate-800 rounded-full text-[#9188BE]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9FD] dark:bg-slate-800/60 text-[#5851A4] font-black uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-2.5">Student Name</th>
                    <th className="px-4 py-2.5">PRN Number</th>
                    <th className="px-4 py-2.5">Year</th>
                    <th className="px-4 py-2.5">Applied Date</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE4F7] dark:divide-slate-800 font-medium">
                  {inspectOpportunityApplicants.applicants.map((a) => (
                    <tr key={a.id}>
                      <td className="px-4 py-3 font-bold text-[#1E2746] dark:text-white">{a.studentName}</td>
                      <td className="px-4 py-3 font-mono text-[#4B63D2]">{a.prn}</td>
                      <td className="px-4 py-3">{a.academicYear}</td>
                      <td className="px-4 py-3 text-[#5851A4]">{a.appliedDate}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${
                          a.status === "Selected"
                            ? "bg-emerald-50 text-emerald-700"
                            : a.status === "Shortlisted"
                            ? "bg-blue-50 text-[#4B63D2]"
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-[#EAE4F7] dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectOpportunityApplicants(null)}
                className="px-4 py-2 rounded-xl bg-[#4B63D2] text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
