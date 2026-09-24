import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  Compass,
  Briefcase,
  ShieldCheck,
  AlertCircle,
  Loader2,
  LogOut,
  Crown,
  GraduationCap,
  UserCheck,
  ChevronRight,
  CheckCircle2,
  MessageSquare,
  ExternalLink,
  BookOpen,
  FileText,
  Video,
  Share2,
  Copy,
  Check,
  Clock,
  UserX,
  Image as ImageIcon,
  HeartHandshake,
  FolderPlus,
  Maximize2,
  FolderGit2,
  Globe,
  MessageCircle,
  Sparkles,
  Eye,
  UploadCloud,
  Link2,
} from "lucide-react";
import { apiRequest, getMediaUrl } from "../services/api";

// ── TypeScript Interfaces ───────────────────────────────────────────────────

export interface ClubMemberUser {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  profile_picture?: string | null;
  department?: string | null;
  graduation_year?: number | null;
  user_role?: string | null;
}

export interface ClubLeadUser {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  profile_picture?: string | null;
  department?: string | null;
  graduation_year?: number | null;
  user_role?: string | null;
}

export interface ClubMemberResponse {
  id: number;
  club_id: number;
  user_id: number;
  role: "PENDING" | "MEMBER" | "OFFICER" | "LEADER" | "HEAD" | "CO-HEAD" | "FACULTY_COORDINATOR";
  user?: ClubMemberUser | null;
}

export interface ClubResourceItem {
  id: number;
  club_id: number;
  title: string;
  category: string;
  resource_type?: "DOC" | "IMAGE" | "PDF" | "GITHUB" | string;
  url: string;
  description?: string | null;
  uploaded_by_id: number;
  created_at: string;
  uploader?: ClubLeadUser | null;
}

export interface ClubGalleryPhotoItem {
  id: number;
  club_id: number;
  title: string;
  image_url: string;
  activity_name?: string | null;
  uploaded_by_id: number;
  created_at: string;
  uploader?: ClubLeadUser | null;
}

export interface ClubResponse {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  creator_id: number;
  head_id?: number | null;
  co_head_id?: number | null;
  faculty_coordinator_id?: number | null;
  alumni_mentor_id?: number | null;
  head?: ClubLeadUser | null;
  co_head?: ClubLeadUser | null;
  faculty_coordinator?: ClubLeadUser | null;
  alumni_mentor?: ClubLeadUser | null;
  resources_count?: number;
}

export interface ClubDetailResponse {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  creator_id: number;
  head_id?: number | null;
  co_head_id?: number | null;
  faculty_coordinator_id?: number | null;
  alumni_mentor_id?: number | null;
  head?: ClubLeadUser | null;
  co_head?: ClubLeadUser | null;
  faculty_coordinator?: ClubLeadUser | null;
  alumni_mentor?: ClubLeadUser | null;
  members_count: number;
  resources_count?: number;
  user_role?: "PENDING" | "MEMBER" | "OFFICER" | "LEADER" | "HEAD" | "CO-HEAD" | "FACULTY_COORDINATOR" | null;
  members: ClubMemberResponse[];
}

export interface ExtractedResource {
  type: "drive" | "github" | "meet" | "discord" | "notion" | "website" | "generic";
  label: string;
  url: string;
}

export interface ParsedClubDetails {
  meetUrl?: string;
  driveUrl?: string;
  githubUrl?: string;
  discordUrl?: string;
  notionUrl?: string;
  websiteUrl?: string;
  cleanDescription: string;
  resources: ExtractedResource[];
}

export function parseClubDescription(text?: string | null): ParsedClubDetails {
  if (!text) {
    return { cleanDescription: "", resources: [] };
  }

  let meetUrl: string | undefined;
  let driveUrl: string | undefined;
  let githubUrl: string | undefined;
  let discordUrl: string | undefined;
  let notionUrl: string | undefined;
  let websiteUrl: string | undefined;

  const lines = text.split("\n");
  const cleanLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();

    // Ignore old Google classroom prefixes if any remain in legacy descriptions
    if (
      lower.startsWith("classroom code:") ||
      lower.startsWith("code:") ||
      lower.startsWith("classroom link:") ||
      lower.startsWith("classroom url:") ||
      lower.startsWith("google classroom:") ||
      lower.startsWith("classroom:")
    ) {
      continue;
    }

    if (
      lower.startsWith("meet link:") ||
      lower.startsWith("zoom link:") ||
      lower.startsWith("meeting link:") ||
      lower.startsWith("meet:")
    ) {
      meetUrl = trimmed.substring(trimmed.indexOf(":") + 1).trim();
    } else if (
      lower.startsWith("drive link:") ||
      lower.startsWith("notes link:") ||
      lower.startsWith("shared notes & drive:") ||
      lower.startsWith("drive:") ||
      lower.startsWith("notes:")
    ) {
      driveUrl = trimmed.substring(trimmed.indexOf(":") + 1).trim();
    } else if (
      lower.startsWith("github repository:") ||
      lower.startsWith("github link:") ||
      lower.startsWith("github:")
    ) {
      githubUrl = trimmed.substring(trimmed.indexOf(":") + 1).trim();
    } else if (
      lower.startsWith("discord link:") ||
      lower.startsWith("discord:") ||
      lower.startsWith("whatsapp link:") ||
      lower.startsWith("chat:")
    ) {
      discordUrl = trimmed.substring(trimmed.indexOf(":") + 1).trim();
    } else if (
      lower.startsWith("notion link:") ||
      lower.startsWith("notion:") ||
      lower.startsWith("roadmap:")
    ) {
      notionUrl = trimmed.substring(trimmed.indexOf(":") + 1).trim();
    } else if (
      lower.startsWith("website link:") ||
      lower.startsWith("website:")
    ) {
      websiteUrl = trimmed.substring(trimmed.indexOf(":") + 1).trim();
    } else if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      cleanLines.push(line);
    }
  }

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex) || [];
  const resources: ExtractedResource[] = [];
  const seen = new Set<string>();

  matches.forEach((rawUrl) => {
    const cleanUrl = rawUrl.replace(/[),.;]+$/, "");
    if (seen.has(cleanUrl)) return;
    seen.add(cleanUrl);

    const lower = cleanUrl.toLowerCase();
    // Exclude classroom links
    if (lower.includes("classroom.google.com")) {
      return;
    }

    if (lower.includes("drive.google.com") || lower.includes("docs.google.com")) {
      driveUrl = driveUrl || cleanUrl;
      resources.push({ type: "drive", label: "Shared Drive / Notes", url: cleanUrl });
    } else if (lower.includes("github.com")) {
      githubUrl = githubUrl || cleanUrl;
      resources.push({ type: "github", label: "GitHub Organization & Code", url: cleanUrl });
    } else if (
      lower.includes("meet.google.com") ||
      lower.includes("zoom.us") ||
      lower.includes("teams.microsoft.com")
    ) {
      meetUrl = meetUrl || cleanUrl;
      resources.push({ type: "meet", label: "Live Meeting Room", url: cleanUrl });
    } else if (lower.includes("discord.gg") || lower.includes("discord.com") || lower.includes("chat.whatsapp.com")) {
      discordUrl = discordUrl || cleanUrl;
      resources.push({ type: "discord", label: "Community Chat / Discord", url: cleanUrl });
    } else if (lower.includes("notion.so") || lower.includes("notion.site")) {
      notionUrl = notionUrl || cleanUrl;
      resources.push({ type: "notion", label: "Notion Roadmap & Docs", url: cleanUrl });
    } else {
      websiteUrl = websiteUrl || cleanUrl;
      resources.push({ type: "generic", label: "Official Club Link", url: cleanUrl });
    }
  });

  const parsedText = cleanLines.join("\n").trim();
  const fallbackDesc =
    parsedText && !parsedText.startsWith("http")
      ? parsedText
      : "Official student chapter focusing on collaborative projects, mentorship sessions, and technical skill development.";

  return {
    meetUrl,
    driveUrl,
    githubUrl,
    discordUrl,
    notionUrl,
    websiteUrl,
    cleanDescription: fallbackDesc,
    resources,
  };
}

/**
 * Canonical department matching — mirrors the Python _depts_match() in club.py / event.py.
 * Prevents CSE(AIML) from matching plain CSE, CSE(AIDS) from matching CSE, etc.
 */
function deptMatches(userDept: string, clubCat: string): boolean {
  const u = userDept.toLowerCase().trim();
  const c = clubCat.toLowerCase().trim();
  if (u === c) return true;
  // Central clubs are never manageable by dept controllers
  if (["central", "central level", "campus-wide", "central club"].includes(c)) return false;
  // Sub-department exact matching
  if (u.includes("aiml")) return c.includes("aiml");
  if (u.includes("aids")) return c.includes("aids");
  // Plain CSE must NOT match CSE(AIML) or CSE(AIDS)
  if (u === "cse") return c === "cse" || c === "computer science" || c === "computer science & engineering";
  // IT
  if (u === "it") return c === "it" || c.includes("information technology");
  // ETC / ECE
  if (u === "etc" || u === "ece") return c === "etc" || c === "ece" || (c.includes("electronics") && c.includes("telecommunication")) || c.includes("ece");
  // EE
  if (u === "ee") return c === "ee" || c.includes("electrical");
  // ME
  if (u === "me") return c === "me" || c.includes("mechanical");
  // BCA / MCA / MBA
  if (u === "bca") return c === "bca";
  if (u === "mca") return c === "mca";
  if (u === "mba") return c === "mba";
  // First Year
  if (u.includes("first") || u === "fy") return c.includes("first") || c === "fy";
  // Sports
  if (u.includes("sport")) return c.includes("sport");
  return false;
}

export default function Clubs() {
  // ── States ─────────────────────────────────────────────────────────────────
  const [clubs, setClubs] = useState<ClubResponse[]>([]);
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    email: string;
    first_name?: string | null;
    last_name?: string | null;
    department?: string;
    profile?: { first_name?: string; last_name?: string; department?: string; graduation_year?: number };
    role?: { name: string };
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState("ALL");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState("ALL");

  // STRICTLY 3 TABS: Resources, Gallery, Links
  const [activeTab, setActiveTab] = useState<"resources" | "gallery" | "links">("resources");

  // Detailed view of selected club
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [clubDetail, setClubDetail] = useState<ClubDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [copiedLinkIndex, setCopiedLinkIndex] = useState<string | null>(null);

  // Club Resources State
  const [clubResources, setClubResources] = useState<ClubResourceItem[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [selectedResourceCategory, setSelectedResourceCategory] = useState("ALL");
  const [showShareResourceModal, setShowShareResourceModal] = useState(false);
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceCategory, setResourceCategory] = useState("Notes");
  const [resourceType, setResourceType] = useState<"DOC" | "IMAGE" | "PDF" | "GITHUB">("DOC");
  const [resourceInputMode, setResourceInputMode] = useState<"file" | "url">("file");
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceDescription, setResourceDescription] = useState("");
  const [submittingResource, setSubmittingResource] = useState(false);

  // Club Gallery State
  const [clubGallery, setClubGallery] = useState<ClubGalleryPhotoItem[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [photoTitle, setPhotoTitle] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoActivity, setPhotoActivity] = useState("");
  const [submittingPhoto, setSubmittingPhoto] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<ClubGalleryPhotoItem | null>(null);

  // Candidate pools for 4-way leadership appointments
  const [departmentStudents, setDepartmentStudents] = useState<
    { id: number; name: string; email: string; department?: string; graduation_year?: number }[]
  >([]);
  const [facultyCandidates, setFacultyCandidates] = useState<ClubLeadUser[]>([]);
  const [alumniCandidates, setAlumniCandidates] = useState<ClubLeadUser[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Modals for Create / Edit Club
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("CSE");
  const [formHeadId, setFormHeadId] = useState<number | null>(null);
  const [formCoHeadId, setFormCoHeadId] = useState<number | null>(null);
  const [formFacultyCoordinatorId, setFormFacultyCoordinatorId] = useState<number | null>(null);
  const [formAlumniMentorId, setFormAlumniMentorId] = useState<number | null>(null);
  const [formDescription, setFormDescription] = useState("");
  const [formMeetUrl, setFormMeetUrl] = useState("");
  const [formDriveUrl, setFormDriveUrl] = useState("");
  const [formGithubUrl, setFormGithubUrl] = useState("");
  const [formDiscordUrl, setFormDiscordUrl] = useState("");

  // Appointments Modal (Controller Access)
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  const [selectedHeadId, setSelectedHeadId] = useState<number | null>(null);
  const [selectedCoHeadId, setSelectedCoHeadId] = useState<number | null>(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null);
  const [selectedAlumniMentorId, setSelectedAlumniMentorId] = useState<number | null>(null);
  const [submittingAppointments, setSubmittingAppointments] = useState(false);

  // Separate Member Management Modals (kept out of main tab bar)
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState(false);

  const getControllerDefaultCategory = (user: any): string => {
    const email = (user?.email || "").toLowerCase();
    const profileDept = (user?.department || user?.profile?.department || "").toLowerCase();

    if (email.includes("aiml") || profileDept.includes("aiml")) return "CSE(AIML)";
    if (email.includes("aids") || profileDept.includes("aids")) return "CSE(AIDS)";
    if (email.includes("cse") || profileDept.includes("computer")) return "CSE";
    if (email.includes("it") || profileDept.includes("information")) return "IT";
    if (email.includes("etc") || email.includes("ece") || profileDept.includes("electronics")) return "ETC";
    if (email.includes("ee") || profileDept.includes("electrical")) return "EE";
    if (email.includes("mech") || profileDept.includes("mechanical")) return "ME";
    if (email.includes("bca") || profileDept.includes("bca")) return "BCA";
    if (email.includes("mca") || profileDept.includes("mca")) return "MCA";
    if (email.includes("mba") || profileDept.includes("mba")) return "MBA";
    if (email.includes("sport")) return "Sports Department";
    if (email.includes("first") || profileDept.includes("first") || profileDept.includes("fy")) return "First Year";
    return "CSE";
  };

  const userRoleName = useMemo(() => {
    return (currentUser?.role?.name || "").toLowerCase().trim();
  }, [currentUser]);

  const isFaculty = useMemo(() => {
    return userRoleName.includes("faculty");
  }, [userRoleName]);

  const isController = useMemo(() => {
    return userRoleName.includes("controller");
  }, [userRoleName]);

  const isAdmin = useMemo(() => {
    return (
      userRoleName.includes("admin") ||
      userRoleName.includes("superadmin") ||
      userRoleName.includes("management") ||
      userRoleName.includes("central admin") ||
      (currentUser as any)?.role_id === 9 ||
      (currentUser as any)?.role_id === 1 ||
      (currentUser as any)?.role_id === 2
    );
  }, [userRoleName, currentUser]);

  const isHod = useMemo(() => {
    return userRoleName.includes("hod");
  }, [userRoleName]);

  const isTpo = useMemo(() => {
    return userRoleName === "tpo" || userRoleName.includes("tpo");
  }, [userRoleName]);

  const isControllerOrAdmin = useMemo(() => {
    return isController || isAdmin;
  }, [isController, isAdmin]);

  const isExecutiveObserver = useMemo(() => {
    return ["ceo", "dean", "principal"].includes(userRoleName);
  }, [userRoleName]);

  const EXECUTIVE_DEPARTMENTS = [
    "ALL",
    "First year",
    "CSE",
    "CSE(AIML)",
    "CSE(AIDS)",
    "IT",
    "ETC",
    "EE",
    "ME",
    "BCA",
    "MCA",
    "MBA",
    "Central",
    "Placement & Internship",
  ];

  // Demo seed data cleaned completely of Google Classroom
  const DEFAULT_DEMO_CLUBS: ClubResponse[] = [
    {
      id: 901,
      name: "ACM Student Chapter (CSE)",
      category: "CSE",
      description: "Official Association for Computing Machinery chapter. Organizing coding hackathons, algorithms masterclasses, and peer tutoring sessions.\nMeet Link: https://meet.google.com/acm-cse-weekly\nDrive Link: https://drive.google.com/drive/folders/acm-resources\nGitHub Link: https://github.com/sbjit-cse/acm-chapter\nDiscord Link: https://discord.gg/acm-sbjit",
      creator_id: 1,
      resources_count: 3,
    },
    {
      id: 902,
      name: "Google Developer Student Club (GDSC)",
      category: "CSE",
      description: "Community group for students interested in Google developer technologies, Android, Flutter, TensorFlow, and Google Cloud Platform.\nMeet Link: https://meet.google.com/gdsc-live-workshops\nDrive Link: https://drive.google.com/drive/folders/gdsc-materials\nGitHub Link: https://github.com/gdsc-sbjit",
      creator_id: 1,
      resources_count: 2,
    },
    {
      id: 903,
      name: "AI & Machine Learning Research Guild",
      category: "CSE(AIML)",
      description: "Interdisciplinary research chapter exploring Deep Learning, Computer Vision, LLMs, and Generative AI applications.\nDrive Link: https://drive.google.com/drive/folders/aiml-datasets-papers\nMeet Link: https://meet.google.com/aiml-paper-review\nGitHub Link: https://github.com/sbjit-aiml/guild-projects",
      creator_id: 1,
      resources_count: 2,
    },
    {
      id: 904,
      name: "Big Data & AI Data Science Society",
      category: "CSE(AIDS)",
      description: "Hands-on data analytics, big data processing with Spark/Hadoop, Kaggle competitions, and predictive modeling workshops.\nDrive Link: https://drive.google.com/drive/folders/aids-datasets\nMeet Link: https://meet.google.com/aids-weekly-sync",
      creator_id: 1,
      resources_count: 1,
    },
    {
      id: 905,
      name: "Cloud Computing & Web Technologies Club",
      category: "IT",
      description: "Full-stack development, AWS/GCP architecture, DevOps CI/CD pipelines, and microservices design workshops for IT students.\nDrive Link: https://drive.google.com/drive/folders/it-resources\nMeet Link: https://meet.google.com/it-cloud-lab",
      creator_id: 1,
      resources_count: 2,
    },
    {
      id: 906,
      name: "Robotics, Automation & IoT Club",
      category: "ETC",
      description: "Designing autonomous rovers, sensor nodes, embedded firmware, and drone systems in collaboration with mechanical and electronics students.\nMeet Link: https://meet.google.com/robotics-lab-stream\nDrive Link: https://drive.google.com/drive/folders/robotics-firmware",
      creator_id: 1,
      resources_count: 1,
    },
    {
      id: 907,
      name: "Renewable Energy & Power Systems Guild",
      category: "EE",
      description: "Smart grids, EV battery management systems, renewable energy simulations, and industrial automation for Electrical Engineering.\nDrive Link: https://drive.google.com/drive/folders/ee-notes\nMeet Link: https://meet.google.com/ee-energy-talks",
      creator_id: 1,
      resources_count: 1,
    },
    {
      id: 908,
      name: "SAE Collegiate Club (Automotive & CAD)",
      category: "ME",
      description: "Formula student racing vehicle design, CAD modeling with SolidWorks, 3D printing, and thermal dynamics analysis.\nDrive Link: https://drive.google.com/drive/folders/me-cad-files\nMeet Link: https://meet.google.com/sae-racing-pit",
      creator_id: 1,
      resources_count: 2,
    },
    {
      id: 909,
      name: "SBJIT Sports & Athletics Department Club",
      category: "Sports Department",
      description: "Official SBJIT Sports Department club coordinating inter-college sports tournaments, cricket, football, basketball, badminton, chess championships, and campus fitness bootcamps.\nMeet Link: https://meet.google.com/sports-coaching-briefing\nDrive Link: https://drive.google.com/drive/folders/sports-schedules-rosters",
      creator_id: 1,
      resources_count: 1,
    },
  ];

  // Fallback demo resources for instant rich previews
  const DEMO_RESOURCES: Record<number, ClubResourceItem[]> = {
    901: [
      {
        id: 1001,
        club_id: 901,
        title: "Data Structures & Graph Algorithms Handbook",
        category: "Notes",
        resource_type: "PDF",
        url: "https://drive.google.com/file/d/demo-dsa-notes/view",
        description: "Complete lecture notes covering balanced binary trees, dynamic programming patterns, Dijkstra, and network flows.",
        uploaded_by_id: 1,
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        uploader: { id: 1, email: "hod@sbjit.edu.in", first_name: "Dr. Arvind", last_name: "Sharma", user_role: "HOD" },
      },
      {
        id: 1002,
        club_id: 901,
        title: "Competitive Programming Masterclass Question Bank",
        category: "Question Bank",
        resource_type: "DOC",
        url: "https://drive.google.com/file/d/demo-question-bank/view",
        description: "Curated problem sets from Codeforces and LeetCode categorized by difficulty (Easy, Medium, Hard) with test cases.",
        uploaded_by_id: 201,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        uploader: { id: 201, email: "rohit.verma@sbjit.edu.in", first_name: "Rohit", last_name: "Verma", user_role: "Student" },
      },
      {
        id: 1003,
        club_id: 901,
        title: "Full-Stack Project Starter & Docker DevOps Template",
        category: "URL / Repo",
        resource_type: "GITHUB",
        url: "https://github.com/sbjit-cse/acm-chapter",
        description: "Production-ready monorepo template with React, FastAPI, PostgreSQL, and automated GitHub Actions CI/CD pipelines.",
        uploaded_by_id: 201,
        created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        uploader: { id: 201, email: "rohit.verma@sbjit.edu.in", first_name: "Rohit", last_name: "Verma", user_role: "Student" },
      },
      {
        id: 1004,
        club_id: 901,
        title: "System Design & Microservices Architecture Cheat Sheet",
        category: "Notes",
        resource_type: "IMAGE",
        url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
        description: "High-resolution architectural breakdown diagram covering API gateways, caching, message queues, and database sharding.",
        uploaded_by_id: 1,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        uploader: { id: 1, email: "hod@sbjit.edu.in", first_name: "Dr. Arvind", last_name: "Sharma", user_role: "HOD" },
      },
    ],
  };

  const DEMO_GALLERY: Record<number, ClubGalleryPhotoItem[]> = {
    901: [
      {
        id: 2001,
        club_id: 901,
        title: "HackSBJIT 2026 24-Hour Hackathon Kickoff",
        image_url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80",
        activity_name: "Hackathon 2026",
        uploaded_by_id: 1,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        uploader: { id: 1, email: "hod@sbjit.edu.in", first_name: "Dr. Arvind", last_name: "Sharma" },
      },
      {
        id: 2002,
        club_id: 901,
        title: "System Design & Cloud Architecture Masterclass",
        image_url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80",
        activity_name: "Tech Workshop",
        uploaded_by_id: 201,
        created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
        uploader: { id: 201, email: "rohit.verma@sbjit.edu.in", first_name: "Rohit", last_name: "Verma" },
      },
      {
        id: 2003,
        club_id: 901,
        title: "Student Chapter Leadership Meet & Project Review",
        image_url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=80",
        activity_name: "Executive Council",
        uploaded_by_id: 201,
        created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
        uploader: { id: 201, email: "rohit.verma@sbjit.edu.in", first_name: "Rohit", last_name: "Verma" },
      },
    ],
  };

  // ── Initial Fetching ───────────────────────────────────────────────────────

  const fetchClubsAndUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const userRes = await apiRequest<{
        id: number;
        email: string;
        first_name?: string | null;
        last_name?: string | null;
        department?: string;
        profile?: { first_name?: string; last_name?: string; department?: string; graduation_year?: number };
        role?: { name: string };
      }>("/users/me");
      setCurrentUser(userRes);

      let clubsRes: ClubResponse[] = [];
      try {
        clubsRes = await apiRequest<ClubResponse[]>("/clubs?skip=0&limit=100");
      } catch {
        clubsRes = [];
      }

      const isUserFaculty = (userRes?.role?.name || "").toLowerCase().includes("faculty");

      const mergedClubs = [...clubsRes];
      if (!isUserFaculty) {
        DEFAULT_DEMO_CLUBS.forEach((demoClub) => {
          if (!mergedClubs.some((c) => c.name.toLowerCase() === demoClub.name.toLowerCase())) {
            mergedClubs.push(demoClub);
          }
        });
      }

      setClubs(mergedClubs);

      // Fetch department students for appointing Head & Co-Head
      const studentsData =
        (await apiRequest<any[]>("/departments/students").catch(() => null)) ||
        (await apiRequest<any[]>("/users?limit=100").catch(() => []));
      if (Array.isArray(studentsData)) {
        const cleanStudents = studentsData
          .map((s) => ({
            id: s.id,
            name: `${s.first_name || ""} ${s.last_name || ""}`.trim() || s.email,
            email: s.email,
            department: s.department || s.profile?.department || "Engineering",
            graduation_year: s.graduation_year || s.profile?.graduation_year,
          }))
          .filter((s) => s.name && !s.name.toLowerCase().includes("admin"));
        setDepartmentStudents(cleanStudents);
      }

      // Pre-fetch faculty & alumni candidates
      fetchFacultyCandidates(userRes.department || userRes.profile?.department);
      fetchAlumniCandidates(userRes.department || userRes.profile?.department);

      if (mergedClubs.length > 0 && selectedClubId === null) {
        setSelectedClubId(mergedClubs[0].id);
      } else if (mergedClubs.length === 0) {
        setSelectedClubId(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to retrieve clubs and profile information.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFacultyCandidates = async (dept?: string) => {
    setLoadingCandidates(true);
    try {
      const candidates = await apiRequest<ClubLeadUser[]>(
        `/clubs/faculty-candidates?department=${encodeURIComponent(dept || "")}`
      );
      if (candidates && candidates.length > 0) {
        setFacultyCandidates(candidates);
        return;
      }
      const allCandidates = await apiRequest<ClubLeadUser[]>("/clubs/faculty-candidates");
      if (allCandidates && allCandidates.length > 0) {
        setFacultyCandidates(allCandidates);
        return;
      }
    } catch (err) {
      console.error("Failed to load faculty candidates:", err);
    }
    // Fallback from users endpoint
    try {
      const users = await apiRequest<any[]>("/users?limit=60");
      const facUsers: ClubLeadUser[] = users
        .filter((u) => u.role?.name?.toLowerCase().includes("faculty") || u.role_id === 6 || u.role_id === 10)
        .map((u) => ({
          id: u.id,
          email: u.email,
          first_name: u.first_name || u.profile?.first_name,
          last_name: u.last_name || u.profile?.last_name,
          department: u.department || u.profile?.department,
          profile_picture: u.profile_picture || u.profile?.profile_picture,
          user_role: "Faculty",
        }));
      setFacultyCandidates(facUsers);
    } catch {} finally {
      setLoadingCandidates(false);
    }
  };

  const fetchAlumniCandidates = async (dept?: string) => {
    try {
      const candidates = await apiRequest<ClubLeadUser[]>(
        `/clubs/alumni-candidates?department=${encodeURIComponent(dept || "")}`
      );
      if (candidates && candidates.length > 0) {
        setAlumniCandidates(candidates);
        return;
      }
    } catch (err) {
      console.error("Failed to load alumni candidates:", err);
    }
    // Fallback: fetch from /departments/alumni or /users
    try {
      const users = (await apiRequest<any[]>("/departments/alumni").catch(() => null)) ||
                    (await apiRequest<any[]>("/users?limit=60").catch(() => []));
      if (Array.isArray(users)) {
        const alumUsers: ClubLeadUser[] = users
          .filter((u) => u.role?.name?.toLowerCase().includes("alumn") || u.user_role === "Alumni" || u.role_id === 7)
          .map((u) => ({
            id: u.id,
            email: u.email,
            first_name: u.first_name || u.profile?.first_name,
            last_name: u.last_name || u.profile?.last_name,
            department: u.department || u.profile?.department,
            graduation_year: u.graduation_year || u.profile?.graduation_year,
            profile_picture: u.profile_picture || u.profile?.profile_picture,
            user_role: "Alumni",
          }));
        setAlumniCandidates(alumUsers);
      }
    } catch {}
  };

  useEffect(() => {
    fetchClubsAndUser();
  }, []);

  const refreshClubs = async () => {
    try {
      const clubsRes = await apiRequest<ClubResponse[]>("/clubs?skip=0&limit=100");
      const isUserFaculty = (currentUser?.role?.name || "").toLowerCase().includes("faculty");
      const mergedClubs = [...clubsRes];
      if (!isUserFaculty) {
        DEFAULT_DEMO_CLUBS.forEach((demoClub) => {
          if (!mergedClubs.some((c) => c.name.toLowerCase() === demoClub.name.toLowerCase())) {
            mergedClubs.push(demoClub);
          }
        });
      }
      setClubs(mergedClubs);
      if (mergedClubs.length === 0) {
        setSelectedClubId(null);
      } else if (selectedClubId !== null && !mergedClubs.some((c) => c.id === selectedClubId)) {
        setSelectedClubId(mergedClubs[0].id);
      }
    } catch (err) {
      console.error("Failed to refresh clubs list:", err);
    }
  };

  // ── Club Detail & Tab Data Loading ─────────────────────────────────────────

  const loadClubDetail = async (clubId: number) => {
    setDetailLoading(true);
    setLoadingResources(true);
    setLoadingGallery(true);
    try {
      if (clubId >= 900) {
        const found = DEFAULT_DEMO_CLUBS.find((c) => c.id === clubId);
        if (found) {
          const detail: ClubDetailResponse = {
            id: found.id,
            name: found.name,
            description: found.description,
            category: found.category,
            creator_id: found.creator_id,
            members_count: 28,
            resources_count: DEMO_RESOURCES[found.id]?.length || 2,
            user_role: "LEADER",
            members: [
              {
                id: 101,
                club_id: found.id,
                user_id: 1,
                role: "LEADER",
                user: {
                  id: 1,
                  email: "hod@sbjit.edu.in",
                  first_name: "Dr. Arvind",
                  last_name: "Sharma",
                  department: "Computer Science & Engineering",
                  user_role: "HOD",
                },
              },
              {
                id: 102,
                club_id: found.id,
                user_id: 201,
                role: "HEAD",
                user: {
                  id: 201,
                  email: "rohit.verma@sbjit.edu.in",
                  first_name: "Rohit",
                  last_name: "Verma",
                  department: "Computer Science & Engineering",
                  graduation_year: 2026,
                  user_role: "Student",
                },
              },
              {
                id: 103,
                club_id: found.id,
                user_id: 202,
                role: "MEMBER",
                user: {
                  id: 202,
                  email: "sneha.kulkarni@sbjit.edu.in",
                  first_name: "Sneha",
                  last_name: "Kulkarni",
                  department: "Information Technology",
                  graduation_year: 2027,
                  user_role: "Student",
                },
              },
            ],
          };
          setClubDetail(detail);
          setClubResources(DEMO_RESOURCES[found.id] || []);
          setClubGallery(DEMO_GALLERY[found.id] || []);
          return;
        }
      }

      // Real club fetch: Club detail, Resources, and Gallery
      const [detailRes, resourcesRes, galleryRes] = await Promise.all([
        apiRequest<ClubDetailResponse>(`/clubs/${clubId}`),
        apiRequest<ClubResourceItem[]>(`/clubs/${clubId}/resources`).catch(() => []),
        apiRequest<ClubGalleryPhotoItem[]>(`/clubs/${clubId}/gallery`).catch(() => []),
      ]);

      setClubDetail(detailRes);
      setClubResources(resourcesRes || []);
      setClubGallery(galleryRes || []);

      // Also trigger candidate loading tailored to the club's department
      if (detailRes.category) {
        fetchFacultyCandidates(detailRes.category);
        fetchAlumniCandidates(detailRes.category);
      }
    } catch (err: any) {
      console.error("Failed to retrieve club details:", err);
    } finally {
      setDetailLoading(false);
      setLoadingResources(false);
      setLoadingGallery(false);
    }
  };

  useEffect(() => {
    if (selectedClubId !== null) {
      loadClubDetail(selectedClubId);
      setActiveTab("resources");
    } else {
      setClubDetail(null);
      setClubResources([]);
      setClubGallery([]);
    }
  }, [selectedClubId]);

  // ── Form Modal Setup (Create / Edit) ──────────────────────────────────────

  const openCreateModal = () => {
    setIsEditing(false);
    setName("");
    setCategory(
      isAdmin
        ? "Central"
        : isTpo
        ? "Placement & Internship"
        : getControllerDefaultCategory(currentUser)
    );
    setFormHeadId(null);
    setFormCoHeadId(null);
    setFormFacultyCoordinatorId(null);
    setFormAlumniMentorId(null);
    setFormDescription("");
    setFormMeetUrl("");
    setFormDriveUrl("");
    setFormGithubUrl("");
    setFormDiscordUrl("");
    setShowFormModal(true);
  };

  const openEditModal = () => {
    if (!clubDetail) return;
    const parsed = parseClubDescription(clubDetail.description);
    setIsEditing(true);
    setName(clubDetail.name);
    setCategory(clubDetail.category || getControllerDefaultCategory(currentUser));
    setFormHeadId(clubDetail.head_id || null);
    setFormCoHeadId(clubDetail.co_head_id || null);
    setFormFacultyCoordinatorId(clubDetail.faculty_coordinator_id || null);
    setFormAlumniMentorId(clubDetail.alumni_mentor_id || null);
    setFormDescription(parsed.cleanDescription);
    setFormMeetUrl(parsed.meetUrl || "");
    setFormDriveUrl(parsed.driveUrl || "");
    setFormGithubUrl(parsed.githubUrl || "");
    setFormDiscordUrl(parsed.discordUrl || "");
    setShowFormModal(true);
  };

  // ── Submit / Delete Actions ────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Club / Chapter Name is required.");
      return;
    }

    if (formHeadId && formCoHeadId && formHeadId === formCoHeadId) {
      alert("Club Head and Club Co-Head cannot be the same student.");
      return;
    }

    setSubmittingForm(true);

    // Build structured description with official links (no classroom)
    const descParts: string[] = [];
    if (formDescription.trim()) descParts.push(formDescription.trim());
    if (formMeetUrl.trim()) descParts.push(`Meet Link: ${formMeetUrl.trim()}`);
    if (formDriveUrl.trim()) descParts.push(`Drive Link: ${formDriveUrl.trim()}`);
    if (formGithubUrl.trim()) descParts.push(`GitHub Link: ${formGithubUrl.trim()}`);
    if (formDiscordUrl.trim()) descParts.push(`Discord Link: ${formDiscordUrl.trim()}`);

    const finalCategory = (
      isTpo
        ? "Placement & Internship"
        : category || getControllerDefaultCategory(currentUser)
    ).trim();
    const payload = {
      name: name.trim(),
      category: finalCategory || null,
      description: descParts.join("\n\n") || null,
      head_id: formHeadId || null,
      co_head_id: formCoHeadId || null,
      faculty_coordinator_id: formFacultyCoordinatorId || null,
      alumni_mentor_id: formAlumniMentorId || null,
    };

    try {
      if (isEditing && clubDetail) {
        await apiRequest<ClubResponse>(`/clubs/${clubDetail.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setShowFormModal(false);
        loadClubDetail(clubDetail.id);
        refreshClubs();
      } else {
        const newClub = await apiRequest<ClubResponse>("/clubs", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setShowFormModal(false);
        setSelectedClubId(newClub.id);
        refreshClubs();
      }
    } catch (err: any) {
      alert(err.message || "Failed to save club details.");
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleDeleteClub = async () => {
    if (!clubDetail) return;
    if (
      !window.confirm(
        `Are you sure you want to delete "${clubDetail.name}"? This action permanently removes the club, resources, gallery items, and member roster.`,
      )
    ) {
      return;
    }

    try {
      await apiRequest(`/clubs/${clubDetail.id}`, { method: "DELETE" });
      setSelectedClubId(null);
      setClubs((prev) => prev.filter((c) => c.id !== clubDetail.id));
      refreshClubs();
    } catch (err: any) {
      alert(err.message || "Failed to delete club.");
    }
  };

  // ── Unified 4-Way Leadership Appointments Handler ──────────────────────────

  const openAppointmentsModal = () => {
    if (!clubDetail) return;
    setSelectedHeadId(clubDetail.head_id || null);
    setSelectedCoHeadId(clubDetail.co_head_id || null);
    setSelectedFacultyId(clubDetail.faculty_coordinator_id || null);
    setSelectedAlumniMentorId(clubDetail.alumni_mentor_id || null);
    setShowAppointmentsModal(true);
  };

  const handleSaveAppointments = async () => {
    if (!clubDetail) return;
    if (selectedHeadId && selectedCoHeadId && selectedHeadId === selectedCoHeadId) {
      alert("Student Head and Student Co-Head cannot be the same person.");
      return;
    }

    setSubmittingAppointments(true);
    try {
      const payload = {
        head_id: selectedHeadId,
        co_head_id: selectedCoHeadId,
        faculty_coordinator_id: selectedFacultyId,
        alumni_mentor_id: selectedAlumniMentorId,
      };

      if (clubDetail.id >= 900) {
        // Demo update
        const headStudent = departmentStudents.find((s) => s.id === selectedHeadId);
        const coHeadStudent = departmentStudents.find((s) => s.id === selectedCoHeadId);
        const facCoord = facultyCandidates.find((f) => f.id === selectedFacultyId);
        const alumMentor = alumniCandidates.find((a) => a.id === selectedAlumniMentorId);

        const updated: ClubDetailResponse = {
          ...clubDetail,
          head_id: selectedHeadId,
          head: headStudent
            ? { id: headStudent.id, email: headStudent.email, first_name: headStudent.name, department: headStudent.department, graduation_year: headStudent.graduation_year }
            : null,
          co_head_id: selectedCoHeadId,
          co_head: coHeadStudent
            ? { id: coHeadStudent.id, email: coHeadStudent.email, first_name: coHeadStudent.name, department: coHeadStudent.department, graduation_year: coHeadStudent.graduation_year }
            : null,
          faculty_coordinator_id: selectedFacultyId,
          faculty_coordinator: facCoord || null,
          alumni_mentor_id: selectedAlumniMentorId,
          alumni_mentor: alumMentor || null,
        };
        setClubDetail(updated);
        setClubs((prev) =>
          prev.map((c) =>
            c.id === clubDetail.id
              ? {
                  ...c,
                  head_id: selectedHeadId,
                  head: updated.head,
                  co_head_id: selectedCoHeadId,
                  co_head: updated.co_head,
                  faculty_coordinator_id: selectedFacultyId,
                  faculty_coordinator: updated.faculty_coordinator,
                  alumni_mentor_id: selectedAlumniMentorId,
                  alumni_mentor: updated.alumni_mentor,
                }
              : c
          )
        );
        setShowAppointmentsModal(false);
        return;
      }

      const res = await apiRequest<ClubDetailResponse>(
        `/clubs/${clubDetail.id}/appointments`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );
      setClubDetail(res);
      setShowAppointmentsModal(false);
      refreshClubs();
    } catch (err: any) {
      alert(err.message || "Failed to update appointments.");
    } finally {
      setSubmittingAppointments(false);
    }
  };

  // ── Resources Handlers ─────────────────────────────────────────────────────

  const handleShareResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubDetail) return;
    if (!resourceTitle.trim()) {
      alert("Resource title is required.");
      return;
    }

    const isFileUpload = resourceInputMode === "file" && resourceType !== "GITHUB";
    if (isFileUpload && !resourceFile) {
      alert("Please select a file to upload.");
      return;
    }
    if (!isFileUpload && !resourceUrl.trim()) {
      alert("Resource URL link is required.");
      return;
    }

    setSubmittingResource(true);
    try {
      if (clubDetail.id >= 900) {
        const dummyUrl = isFileUpload && resourceFile
          ? URL.createObjectURL(resourceFile)
          : resourceUrl.trim();

        const newRes: ClubResourceItem = {
          id: Date.now(),
          club_id: clubDetail.id,
          title: resourceTitle.trim(),
          category: resourceCategory,
          resource_type: resourceType,
          url: dummyUrl,
          description: resourceDescription.trim() || null,
          uploaded_by_id: currentUser?.id || 1,
          created_at: new Date().toISOString(),
          uploader: {
            id: currentUser?.id || 1,
            email: currentUser?.email || "user@sbjit.edu.in",
            first_name: currentUser?.first_name || currentUser?.profile?.first_name || currentUser?.email?.split("@")[0] || "User",
            user_role: currentUser?.role?.name || "Member",
          },
        };
        setClubResources((prev) => [newRes, ...prev]);
        setClubDetail((prev) => (prev ? { ...prev, resources_count: (prev.resources_count || 0) + 1 } : prev));
        setShowShareResourceModal(false);
        setResourceTitle("");
        setResourceUrl("");
        setResourceFile(null);
        setResourceDescription("");
        return;
      }

      let created: ClubResourceItem;
      if (isFileUpload && resourceFile) {
        const formData = new FormData();
        formData.append("file", resourceFile);
        formData.append("title", resourceTitle.trim());
        formData.append("category", resourceCategory);
        formData.append("resource_type", resourceType);
        if (resourceDescription.trim()) {
          formData.append("description", resourceDescription.trim());
        }

        created = await apiRequest<ClubResourceItem>(
          `/clubs/${clubDetail.id}/resources/upload`,
          {
            method: "POST",
            body: formData,
          }
        );
      } else {
        created = await apiRequest<ClubResourceItem>(
          `/clubs/${clubDetail.id}/resources`,
          {
            method: "POST",
            body: JSON.stringify({
              title: resourceTitle.trim(),
              category: resourceCategory,
              resource_type: resourceType,
              url: resourceUrl.trim(),
              description: resourceDescription.trim() || null,
            }),
          }
        );
      }

      setClubResources((prev) => [created, ...prev]);
      setClubDetail((prev) => (prev ? { ...prev, resources_count: (prev.resources_count || 0) + 1 } : prev));
      setShowShareResourceModal(false);
      setResourceTitle("");
      setResourceUrl("");
      setResourceFile(null);
      setResourceDescription("");
      refreshClubs();
    } catch (err: any) {
      alert(err.message || "Failed to share resource.");
    } finally {
      setSubmittingResource(false);
    }
  };

  const handleDeleteResource = async (resId: number) => {
    if (!clubDetail) return;
    if (!window.confirm("Are you sure you want to remove this resource?")) return;

    try {
      if (clubDetail.id < 900) {
        await apiRequest(`/clubs/${clubDetail.id}/resources/${resId}`, {
          method: "DELETE",
        });
      }
      setClubResources((prev) => prev.filter((r) => r.id !== resId));
      setClubDetail((prev) => (prev ? { ...prev, resources_count: Math.max(0, (prev.resources_count || 1) - 1) } : prev));
    } catch (err: any) {
      alert(err.message || "Failed to delete resource.");
    }
  };

  // ── Gallery Handlers ───────────────────────────────────────────────────────

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubDetail) return;
    if (!photoTitle.trim() || !photoUrl.trim()) {
      alert("Photo title and image URL are required.");
      return;
    }

    setSubmittingPhoto(true);
    try {
      if (clubDetail.id >= 900) {
        const newPhoto: ClubGalleryPhotoItem = {
          id: Date.now(),
          club_id: clubDetail.id,
          title: photoTitle.trim(),
          image_url: photoUrl.trim(),
          activity_name: photoActivity.trim() || null,
          uploaded_by_id: currentUser?.id || 1,
          created_at: new Date().toISOString(),
          uploader: {
            id: currentUser?.id || 1,
            email: currentUser?.email || "user@sbjit.edu.in",
            first_name: currentUser?.first_name || currentUser?.profile?.first_name || currentUser?.email?.split("@")[0] || "User",
          },
        };
        setClubGallery((prev) => [newPhoto, ...prev]);
        setShowAddPhotoModal(false);
        setPhotoTitle("");
        setPhotoUrl("");
        setPhotoActivity("");
        return;
      }

      const created = await apiRequest<ClubGalleryPhotoItem>(
        `/clubs/${clubDetail.id}/gallery`,
        {
          method: "POST",
          body: JSON.stringify({
            title: photoTitle.trim(),
            image_url: photoUrl.trim(),
            activity_name: photoActivity.trim() || null,
          }),
        }
      );

      setClubGallery((prev) => [created, ...prev]);
      setShowAddPhotoModal(false);
      setPhotoTitle("");
      setPhotoUrl("");
      setPhotoActivity("");
    } catch (err: any) {
      alert(err.message || "Failed to add photo to gallery.");
    } finally {
      setSubmittingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!clubDetail) return;
    if (!window.confirm("Are you sure you want to remove this photo from the gallery?")) return;

    try {
      if (clubDetail.id < 900) {
        await apiRequest(`/clubs/${clubDetail.id}/gallery/${photoId}`, {
          method: "DELETE",
        });
      }
      setClubGallery((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err: any) {
      alert(err.message || "Failed to delete photo.");
    }
  };

  // ── Member Operations (Join Request / Leave / Approve / Reject) ────────────

  const handleJoinClub = async () => {
    if (!clubDetail) return;
    try {
      await apiRequest(`/clubs/${clubDetail.id}/join`, { method: "POST" });
      alert("Your join request has been submitted to the Department Controller / Club Lead for review.");
      loadClubDetail(clubDetail.id);
      refreshClubs();
    } catch (err: any) {
      alert(err.message || "Failed to request club membership.");
    }
  };

  const handleLeaveOrCancelRequest = async () => {
    if (!clubDetail) return;
    const isPending = clubDetail.user_role === "PENDING";
    const msg = isPending
      ? "Are you sure you want to cancel your join request?"
      : "Are you sure you want to leave this club?";

    if (!window.confirm(msg)) return;

    try {
      if (isPending && currentUser) {
        await apiRequest(`/clubs/${clubDetail.id}/members/${currentUser.id}`, {
          method: "DELETE",
        });
      } else {
        await apiRequest(`/clubs/${clubDetail.id}/leave`, { method: "POST" });
      }
      loadClubDetail(clubDetail.id);
      refreshClubs();
    } catch (err: any) {
      alert(err.message || "Failed to process action.");
    }
  };

  const handleApproveRequest = async (targetUserId: number) => {
    if (!clubDetail) return;
    try {
      await apiRequest(`/clubs/${clubDetail.id}/members/${targetUserId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: "MEMBER" }),
      });
      loadClubDetail(clubDetail.id);
      refreshClubs();
    } catch (err: any) {
      alert(err.message || "Failed to approve student request.");
    }
  };

  const handleRejectOrRemoveMember = async (targetUserId: number, targetName: string) => {
    if (!clubDetail) return;
    if (!window.confirm(`Are you sure you want to remove or reject ${targetName}?`)) return;

    try {
      await apiRequest(`/clubs/${clubDetail.id}/members/${targetUserId}`, {
        method: "DELETE",
      });
      loadClubDetail(clubDetail.id);
      refreshClubs();
    } catch (err: any) {
      alert(err.message || "Failed to reject or remove member.");
    }
  };

  const handleUpdateMemberRole = async (
    targetUserId: number,
    newRole: "PENDING" | "MEMBER" | "OFFICER" | "LEADER",
  ) => {
    if (!clubDetail) return;
    try {
      await apiRequest(`/clubs/${clubDetail.id}/members/${targetUserId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole }),
      });
      loadClubDetail(clubDetail.id);
    } catch (err: any) {
      alert(err.message || "Failed to update member role.");
    }
  };

  const handleCopyLink = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLinkIndex(key);
    setTimeout(() => setCopiedLinkIndex(null), 2000);
  };

  // ── Categories & Filtering ─────────────────────────────────────────────────

  const resourceCategoriesList = [
    "ALL",
    "Notes",
    "Question Bank",
    "URL / Repo",
  ];

  const filteredClubs = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return clubs.filter((c) => {
      // 1. Department filter
      if (selectedDepartmentFilter !== "ALL") {
        const sel = selectedDepartmentFilter.toLowerCase();
        const cat = (c.category || "").toLowerCase();
        if (sel === "central") {
          if (!["central", "central level", "campus-wide", "central club"].includes(cat)) return false;
        } else if (sel.includes("placement") || sel.includes("internship")) {
          if (!cat.includes("placement") && !cat.includes("internship")) return false;
        } else {
          if (!deptMatches(selectedDepartmentFilter, c.category || "")) return false;
        }
      }

      // 2. Search query
      if (!q.trim()) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.category && c.category.toLowerCase().includes(q))
      );
    });
  }, [clubs, searchQuery, selectedDepartmentFilter]);

  const filteredResources = useMemo(() => {
    if (selectedResourceCategory === "ALL") return clubResources;
    return clubResources.filter(
      (r) => (r.category || "").toLowerCase() === selectedResourceCategory.toLowerCase()
    );
  }, [clubResources, selectedResourceCategory]);

  const activeMembers = useMemo(() => {
    if (!clubDetail?.members) return [];
    return clubDetail.members.filter((m) => m.role !== "PENDING");
  }, [clubDetail]);

  const pendingRequests = useMemo(() => {
    if (!clubDetail?.members) return [];
    return clubDetail.members.filter((m) => m.role === "PENDING");
  }, [clubDetail]);

  const filteredActiveMembers = useMemo(() => {
    return activeMembers.filter((member) => {
      const u = member.user;
      const fullName = `${u?.first_name || ""} ${u?.last_name || ""}`.trim().toLowerCase();
      const email = (u?.email || "").toLowerCase();
      const matchesQuery =
        fullName.includes(memberSearchQuery.toLowerCase()) ||
        email.includes(memberSearchQuery.toLowerCase());

      if (memberRoleFilter === "ALL") return matchesQuery;
      return matchesQuery && member.role === memberRoleFilter;
    });
  }, [activeMembers, memberSearchQuery, memberRoleFilter]);

  // Whether the currently-viewed club is a Central-level club (posted by Central Admin)
  const isCentralClub = useMemo(() => {
    if (!clubDetail) return false;
    const cat = (clubDetail.category || "").toLowerCase().trim();
    return cat === "central" || cat === "central level" || cat === "campus-wide" || cat === "central club";
  }, [clubDetail]);

  // Whether the controller's department matches the active club's department
  // Central Admin can manage ALL clubs. Controllers can only manage their own dept clubs (NOT Central clubs).
  const isMyDepartmentClub = useMemo(() => {
    if (isExecutiveObserver) return false;
    if (!clubDetail) return false;
    if (isAdmin) return true; // Central Admin manages everything
    if (!isController) return false;
    if (isCentralClub) return false; // Controllers cannot manage central clubs
    const userDept = (currentUser?.department || currentUser?.profile?.department || "").trim();
    const clubCat = (clubDetail.category || "").trim();
    // Use canonical matching — CSE(AIML) controller cannot manage CSE clubs and vice versa
    return userDept.length > 0 && deptMatches(userDept, clubCat);
  }, [clubDetail, isAdmin, isController, isCentralClub, isExecutiveObserver, currentUser]);

  const isConfirmedMember = useMemo(() => {
    if (isExecutiveObserver) return false;
    if (!clubDetail) return false;
    if (isAdmin) return true;
    if (isController && isMyDepartmentClub) return true;
    if (isTpo) return clubDetail.creator_id === currentUser?.id;
    return (
      clubDetail.user_role === "MEMBER" ||
      clubDetail.user_role === "OFFICER" ||
      clubDetail.user_role === "LEADER" ||
      clubDetail.user_role === "HEAD" ||
      clubDetail.user_role === "CO-HEAD" ||
      clubDetail.user_role === "FACULTY_COORDINATOR" ||
      currentUser?.id === clubDetail.head_id ||
      currentUser?.id === clubDetail.co_head_id ||
      currentUser?.id === clubDetail.faculty_coordinator_id ||
      currentUser?.id === clubDetail.alumni_mentor_id ||
      currentUser?.id === clubDetail.creator_id
    );
  }, [clubDetail, isAdmin, isController, isMyDepartmentClub, isTpo, isExecutiveObserver, currentUser]);

  // Strict permission for Vault Resource Posting:
  // Club head, co-head, faculty coordinator, and alumni (plus Admin/Dept Controller)
  const canPostResource = useMemo(() => {
    if (isExecutiveObserver) return false;
    if (!clubDetail) return false;
    if (isAdmin) return true;
    if (isController && isMyDepartmentClub) return true;

    // 1. Appointed Club Head or Co-Head
    if (currentUser?.id === clubDetail.head_id || currentUser?.id === clubDetail.co_head_id) return true;
    if (
      clubDetail.user_role === "HEAD" ||
      clubDetail.user_role === "CO-HEAD" ||
      clubDetail.user_role === "LEADER"
    )
      return true;

    // 2. Faculty Coordinator
    if (
      currentUser?.id === clubDetail.faculty_coordinator_id ||
      clubDetail.user_role === "FACULTY_COORDINATOR"
    )
      return true;

    // 3. Alumni Mentor or user with Alumni role
    if (currentUser?.id === clubDetail.alumni_mentor_id) return true;
    if (userRoleName === "alumni" || userRoleName.includes("alumni")) return true;

    return false;
  }, [clubDetail, isAdmin, isController, isMyDepartmentClub, isExecutiveObserver, currentUser, userRoleName]);

  const isLeaderOrController = useMemo(() => {
    if (isExecutiveObserver) return false;
    if (isAdmin) return true;
    if (isController) return isMyDepartmentClub;
    if (isTpo) return clubDetail?.creator_id === currentUser?.id;
    if (!clubDetail) return false;
    return (
      clubDetail.user_role === "LEADER" ||
      clubDetail.user_role === "HEAD" ||
      clubDetail.user_role === "CO-HEAD" ||
      clubDetail.user_role === "FACULTY_COORDINATOR" ||
      currentUser?.id === clubDetail.head_id ||
      currentUser?.id === clubDetail.co_head_id ||
      currentUser?.id === clubDetail.faculty_coordinator_id ||
      currentUser?.id === clubDetail.creator_id
    );
  }, [clubDetail, isAdmin, isController, isMyDepartmentClub, isTpo, isExecutiveObserver, currentUser]);

  // Whether the current user can manage (edit/delete/appoint) the active club
  const canManageActiveClub = useMemo(() => {
    if (isExecutiveObserver) return false;
    if (isAdmin) return true;
    if (isController && isMyDepartmentClub) return true;
    if (isTpo) return clubDetail?.creator_id === currentUser?.id;
    return false;
  }, [isAdmin, isController, isMyDepartmentClub, isTpo, isExecutiveObserver, clubDetail, currentUser]);

  const parsedActiveClub = useMemo(() => {
    return parseClubDescription(clubDetail?.description);
  }, [clubDetail]);

  // Available official links count
  const officialLinksCount = useMemo(() => {
    let count = 0;
    if (parsedActiveClub.meetUrl) count++;
    if (parsedActiveClub.driveUrl) count++;
    if (parsedActiveClub.githubUrl) count++;
    if (parsedActiveClub.discordUrl) count++;
    if (parsedActiveClub.notionUrl) count++;
    if (parsedActiveClub.websiteUrl) count++;
    return count;
  }, [parsedActiveClub]);

  const getCategoryBadgeStyle = (cat?: string | null) => {
    const c = (cat || "").toLowerCase();
    if (c === "central" || c === "central level" || c === "campus-wide" || c === "central club")
      return "bg-purple-100 text-purple-900 border-purple-400 font-extrabold";
    if (c.includes("aiml")) return "bg-purple-100 text-purple-800 border-purple-200";
    if (c.includes("aids")) return "bg-indigo-100 text-indigo-800 border-indigo-200";
    if (c.includes("cse")) return "bg-blue-100 text-blue-800 border-blue-200";
    if (c.includes("it")) return "bg-sky-100 text-sky-800 border-sky-200";
    if (c.includes("etc") || c.includes("ece")) return "bg-teal-100 text-teal-800 border-teal-200";
    if (c.includes("ee")) return "bg-amber-100 text-amber-800 border-amber-200";
    if (c.includes("me")) return "bg-orange-100 text-orange-800 border-orange-200";
    if (c.includes("bca") || c.includes("mca")) return "bg-cyan-100 text-cyan-800 border-cyan-200";
    if (c.includes("mba")) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (c.includes("placement") || c.includes("internship")) return "bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold";
    if (c.includes("sport")) return "bg-amber-100 text-amber-900 border-amber-300";
    if (c.includes("first")) return "bg-violet-100 text-violet-800 border-violet-200";
    return "bg-slate-100 text-slate-800 border-slate-200";
  };

  const getResourceCategoryBadge = (cat?: string) => {
    const c = (cat || "").toLowerCase();
    if (c.includes("note")) return "bg-amber-100 text-amber-900 border-amber-300";
    if (c.includes("question")) return "bg-emerald-100 text-emerald-900 border-emerald-300";
    if (c.includes("url") || c.includes("repo") || c.includes("code") || c.includes("git"))
      return "bg-indigo-100 text-indigo-900 border-indigo-300";
    return "bg-slate-100 text-slate-800 border-slate-300";
  };

  const getResourceTypeBadge = (type?: string) => {
    const t = (type || "DOC").toUpperCase();
    switch (t) {
      case "IMAGE":
        return {
          style: "bg-emerald-50 text-emerald-700 border-emerald-200",
          label: "IMAGE",
          icon: ImageIcon,
          cta: "Preview Image",
        };
      case "PDF":
        return {
          style: "bg-rose-50 text-rose-700 border-rose-200",
          label: "PDF",
          icon: FileText,
          cta: "Open PDF",
        };
      case "GITHUB":
        return {
          style: "bg-purple-50 text-purple-800 border-purple-200",
          label: "GITHUB",
          icon: FolderGit2,
          cta: "View GitHub Repo",
        };
      case "DOC":
      default:
        return {
          style: "bg-blue-50 text-blue-700 border-blue-200",
          label: "DOC",
          icon: FileText,
          cta: "View Document",
        };
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "LEADER":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "HEAD":
        return "bg-amber-100 text-amber-900 border-amber-300";
      case "CO-HEAD":
        return "bg-indigo-100 text-indigo-900 border-indigo-300";
      case "FACULTY_COORDINATOR":
        return "bg-purple-100 text-purple-900 border-purple-300";
      case "OFFICER":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "MEMBER":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "PENDING":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* ── 1. Header Banner ────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1E2746] via-[#2A3558] to-[#4B63D2] p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-100 border border-white/20 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-300" />
                Department Chapters &amp; Guilds
              </span>

              {isFaculty && (
                <span className="bg-purple-500/25 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-purple-200 border border-purple-300/30 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-purple-300" />
                  Faculty Coordinator View
                </span>
              )}

              {isController && (
                <span className="bg-emerald-500/25 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-emerald-200 border border-emerald-300/30 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  Department Controller Access
                </span>
              )}

              {isTpo && (
                <span className="bg-emerald-500/25 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-emerald-200 border border-emerald-300/30 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-300" />
                  TPO Placement &amp; Internship Hub
                </span>
              )}

              {isHod && (
                <span className="bg-blue-500/25 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-blue-200 border border-blue-300/30 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
                  Head of Department (HOD)
                </span>
              )}

              {isExecutiveObserver && (
                <span className="bg-indigo-500/25 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-indigo-200 border border-indigo-300/30 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-indigo-300" />
                  Executive Observer ({userRoleName.toUpperCase()})
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              {isExecutiveObserver
                ? "Institutional Clubs & Student Societies"
                : isHod
                ? "Department Clubs & Student Societies"
                : isFaculty
                ? "My Coordinated Department Clubs"
                : isController
                ? "Department Club Management & Leadership"
                : isTpo
                ? "Training & Placement Clubs"
                : "Student Clubs & Resource Hub"}
            </h1>

            <p className="text-xs md:text-sm font-medium max-w-2xl leading-relaxed" style={{ color: "#E2E8F0" }}>
              {isExecutiveObserver
                ? "Institutional read-only dashboard across all campus departments. Browse student clubs, inspect leadership rosters, and review shared resources."
                : isHod
                ? "Department monitoring view. Review student clubs, active memberships, and shared resources. Club creation and appointments are managed by the Department Controller."
                : isFaculty
                ? "Manage resources, review student memberships, and coordinate activities for the clubs you supervise."
                : isController
                ? "Create department-specific clubs, appoint Student Heads, Co-Heads, Faculty Members, and invite Alumni Mentors."
                : isTpo
                ? "Create and operate placement & internship clubs, appoint student leads, coordinate industry preparation, and manage club operations."
                : "Explore technical clubs, share study resources and question banks, browse event galleries, and connect with mentors."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {(isControllerOrAdmin || isTpo) && !isExecutiveObserver && !isHod && (
              <button
                onClick={openCreateModal}
                className="bg-white hover:bg-slate-50 text-[#1E2746] font-bold px-4 py-2.5 rounded-2xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4 text-[#4B63D2]" />
                <span>
                  {isAdmin
                    ? "Create Central Club"
                    : isTpo
                    ? "Create Placement & Internship Club"
                    : `Create ${getControllerDefaultCategory(currentUser)} Club`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Filters & Department Selector Bar ─────────────────────────────── */}
      <div className="bg-white border border-[#EAE4F7] rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5851A4]" />
            <input
              type="text"
              placeholder={isFaculty ? "Search in your coordinated clubs..." : "Search clubs by name or domain..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-2xl pl-9 pr-4 py-2 text-xs text-[#1E2746] placeholder-[#9188BE] outline-none transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#5851A4]">Department:</span>
              <select
                value={selectedDepartmentFilter}
                onChange={(e) => setSelectedDepartmentFilter(e.target.value)}
                className="bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-3 py-1.5 text-xs text-[#1E2746] font-bold outline-none cursor-pointer"
              >
                {EXECUTIVE_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept === "ALL" ? "All Departments" : dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs font-bold text-[#5851A4] flex items-center gap-2">
              <span>Showing:</span>
              <span className="bg-[#FAF9FD] text-[#4B63D2] border border-[#D5CBEE] px-2.5 py-0.5 rounded-full font-black">
                {filteredClubs.length} Clubs
              </span>
            </div>
          </div>
        </div>

        {/* Department filter pills removed — clubs are scoped by role on the backend */}
      </div>

      {/* ── 3. Main Content: Split Grid Layout ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Clubs List Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5 max-h-[860px] overflow-y-auto pr-1">
          {loading ? (
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-12 text-center text-[#5851A4] shadow-sm space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#4B63D2] mx-auto" />
              <p className="text-xs font-bold text-[#1E2746]">Loading department clubs...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
              <h3 className="text-rose-900 font-bold text-sm">Error Loading Clubs</h3>
              <p className="text-rose-700 text-xs">{error}</p>
              <button
                onClick={() => fetchClubsAndUser()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : filteredClubs.length === 0 ? (
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-8 text-center text-[#5851A4] shadow-sm space-y-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border ${
                  isFaculty
                    ? "bg-purple-50 text-purple-600 border-purple-200"
                    : "bg-[#FAF9FD] text-[#4B63D2] border-[#EAE4F7]"
                }`}
              >
                {isFaculty ? (
                  <GraduationCap className="w-6 h-6 text-purple-600" />
                ) : (
                  <Compass className="w-6 h-6 text-[#4B63D2]" />
                )}
              </div>
              <p className="font-bold text-sm text-[#1E2746]">
                {isFaculty ? "No Coordinated Clubs Assigned" : "No matching clubs found"}
              </p>
              <p className="text-xs text-[#5851A4] leading-relaxed">
                {isFaculty
                  ? "You have not been appointed as a Faculty Coordinator for any club yet. Your Department Controller will appoint you to coordinate clubs in your department."
                  : isControllerOrAdmin
                  ? "Create a new department club and appoint students, faculty, and alumni mentors."
                  : "No clubs created for this category yet. Check back soon!"}
              </p>
              {(isControllerOrAdmin || isTpo) && !isExecutiveObserver && (
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4B63D2] hover:bg-[#3E53BE] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Club Now</span>
                </button>
              )}
            </div>
          ) : (
            filteredClubs.map((club) => {
              const isSelected = selectedClubId === club.id;
              const parsed = parseClubDescription(club.description);
              const resCount = club.resources_count !== undefined ? club.resources_count : (DEMO_RESOURCES[club.id]?.length || 0);

              return (
                <div
                  key={club.id}
                  onClick={() => setSelectedClubId(club.id)}
                  className={`cursor-pointer bg-white border rounded-3xl p-5 transition-all duration-200 flex flex-col justify-between relative group ${
                    isSelected
                      ? "border-[#4B63D2] ring-2 ring-[#4B63D2]/20 shadow-md bg-gradient-to-r from-white to-[#FAF9FD]"
                      : "border-[#EAE4F7] hover:border-[#4B63D2]/50 hover:shadow-sm"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${getCategoryBadgeStyle(
                          club.category,
                        )}`}
                      >
                        {(() => {
                          const cat = (club.category || "").toLowerCase().trim();
                          if (cat === "central" || cat === "central level" || cat === "campus-wide" || cat === "central club")
                            return "🏛️ Central (Campus-Wide)";
                          return club.category || "General Department";
                        })()}
                      </span>

                      {resCount > 0 ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-[#4B63D2] bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                          <BookOpen className="w-3 h-3 text-[#4B63D2]" />
                          {resCount} {resCount === 1 ? "Resource" : "Resources"}
                        </span>
                      ) : null}
                    </div>

                    <h3 className="text-base font-black text-[#1E2746] group-hover:text-[#4B63D2] transition-colors">
                      {club.name}
                    </h3>

                    {/* Appointed Leads, Faculty & Alumni Badges */}
                    {(club.head || club.co_head || club.faculty_coordinator || club.alumni_mentor) && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {club.faculty_coordinator && (
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 border border-purple-200 flex items-center gap-1">
                            <GraduationCap className="w-2.5 h-2.5 text-purple-600" />
                            Coord: {club.faculty_coordinator.first_name ? `${club.faculty_coordinator.first_name} ${club.faculty_coordinator.last_name || ""}`.trim() : club.faculty_coordinator.email.split("@")[0]}
                          </span>
                        )}
                        {club.alumni_mentor && (
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-1">
                            <HeartHandshake className="w-2.5 h-2.5 text-emerald-600" />
                            Mentor: {club.alumni_mentor.first_name ? `${club.alumni_mentor.first_name} ${club.alumni_mentor.last_name || ""}`.trim() : club.alumni_mentor.email.split("@")[0]}
                          </span>
                        )}
                        {club.head && (
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                            <Crown className="w-2.5 h-2.5 text-amber-600" />
                            Head: {club.head.first_name || club.head.email.split("@")[0]}
                          </span>
                        )}
                        {club.co_head && (
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-200 flex items-center gap-1">
                            <Crown className="w-2.5 h-2.5 text-indigo-600" />
                            Co-Head: {club.co_head.first_name || club.co_head.email.split("@")[0]}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Role Tag for Current User */}
                    {currentUser?.id === club.faculty_coordinator_id && (
                      <div className="mt-2 text-[10px] font-black text-purple-900 bg-purple-100 border border-purple-300 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-purple-600" />
                        🎓 You are Faculty Coordinator
                      </div>
                    )}
                    {currentUser?.id === club.alumni_mentor_id && (
                      <div className="mt-2 text-[10px] font-black text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                        <HeartHandshake className="w-3 h-3 text-emerald-600" />
                        🤝 You are Alumni Mentor
                      </div>
                    )}
                    {(currentUser?.id === club.head_id || currentUser?.id === club.co_head_id) && (
                      <div className="mt-2 text-[10px] font-black text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-600" />
                        {currentUser?.id === club.head_id ? "🎖️ You are Club Head" : "🎖️ You are Club Co-Head"}
                      </div>
                    )}
                    {isTpo && currentUser?.id === club.creator_id && (
                      <div className="mt-2 text-[10px] font-black text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        💼 Created by You (Manageable)
                      </div>
                    )}

                    <p className="text-[#5851A4] text-xs line-clamp-2 mt-1.5 leading-relaxed font-normal">
                      {parsed.cleanDescription || "No detailed description provided yet."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3.5 mt-3.5 border-t border-[#EAE4F7] text-xs font-bold text-[#4B63D2]">
                    <span className="text-[11px] text-[#9188BE] font-medium flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      Resources, Gallery &amp; Links
                    </span>
                    <div className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span className="text-[11px]">Explore</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Club Details (7 cols) */}
        <div className="lg:col-span-7">
          {selectedClubId === null ? (
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-12 text-center text-[#5851A4] shadow-sm space-y-3">
              <Compass className="w-12 h-12 text-[#C8B6E2] mx-auto" />
              <h3 className="text-base font-bold text-[#1E2746]">Select a Club</h3>
              <p className="text-xs text-[#5851A4] max-w-sm mx-auto">
                Choose any department club to browse study resources, photo gallery, official links, and leadership appointments.
              </p>
            </div>
          ) : detailLoading || !clubDetail ? (
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-16 flex flex-col items-center justify-center space-y-3 text-[#5851A4] shadow-sm">
              <Loader2 className="w-8 h-8 animate-spin text-[#4B63D2]" />
              <p className="text-xs font-bold text-[#1E2746]">Loading club resources and details...</p>
            </div>
          ) : (
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm space-y-6">
              {/* Header Details */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${getCategoryBadgeStyle(
                        clubDetail.category,
                      )}`}
                    >
                      {isCentralClub ? "🏛️ Central (Campus-Wide)" : (clubDetail.category || "General Department")}
                    </span>

                    {isCentralClub && (
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-300 font-bold flex items-center gap-1">
                        <span>Campus-Wide Access</span>
                      </span>
                    )}

                    {/* Read-only badge for controllers viewing a central club */}
                    {isController && isCentralClub && (
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-300 font-bold flex items-center gap-1">
                        👁️ View Only
                      </span>
                    )}

                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-50 text-[#4B63D2] border border-indigo-200 font-bold flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-[#4B63D2]" />
                      {clubResources.length} {clubResources.length === 1 ? "Resource" : "Resources"}
                    </span>

                    {clubDetail.user_role === "MEMBER" && (
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Member
                      </span>
                    )}

                    {clubDetail.user_role === "PENDING" && (
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Pending Approval
                      </span>
                    )}
                  </div>

                  {/* Header Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {isExecutiveObserver && (
                      <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Executive Observer</span>
                      </span>
                    )}

                    {!clubDetail.user_role && !isControllerOrAdmin && !isExecutiveObserver && (
                      <button
                        onClick={handleJoinClub}
                        className="bg-[#4B63D2] hover:bg-[#3E53BE] text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Request to Join
                      </button>
                    )}

                    {!isExecutiveObserver && clubDetail.user_role === "PENDING" && (
                      <button
                        onClick={handleLeaveOrCancelRequest}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <UserX className="w-3.5 h-3.5 text-amber-700" />
                        Cancel Request
                      </button>
                    )}

                    {!isExecutiveObserver && clubDetail.user_role === "MEMBER" && (
                      <button
                        onClick={handleLeaveOrCancelRequest}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Leave Club
                      </button>
                    )}

                    {/* Member & Requests Modals Triggers */}
                    {isLeaderOrController && pendingRequests.length > 0 && (
                      <button
                        onClick={() => setShowRequestsModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-black px-3 py-2 rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        title="Review Pending Student Requests"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Requests ({pendingRequests.length})</span>
                      </button>
                    )}

                    <button
                      onClick={() => setShowRosterModal(true)}
                      className="bg-[#FAF9FD] hover:bg-white text-[#5851A4] border border-[#D5CBEE] font-bold px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="View Club Members Roster"
                    >
                      <Users className="w-3.5 h-3.5 text-[#4B63D2]" />
                      <span>Roster ({activeMembers.length})</span>
                    </button>

                    {/* Controller / Leader Controls — scoped strictly to dept or Central Admin */}
                    {canManageActiveClub && (
                      <button
                        onClick={openAppointmentsModal}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-black px-3.5 py-2 rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        title="Appoint Student Heads, Faculty Member, and Alumni Mentor"
                      >
                        <Crown className="w-3.5 h-3.5 text-amber-300" />
                        <span>Appoint Leadership</span>
                      </button>
                    )}

                    {(canManageActiveClub || (!isController && isLeaderOrController)) && (
                      <button
                        onClick={openEditModal}
                        className="bg-[#FAF9FD] hover:bg-[#F0EDF9] border border-[#EAE4F7] text-[#5851A4] p-2 rounded-xl transition-colors cursor-pointer"
                        title="Edit Club Details & Links"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {canManageActiveClub && (
                      <button
                        onClick={handleDeleteClub}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 p-2 rounded-xl transition-colors cursor-pointer"
                        title="Delete Club"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-xl md:text-2xl font-black text-[#1E2746]">{clubDetail.name}</h2>
                  <p className="text-[#5851A4] text-xs md:text-sm mt-2 leading-relaxed">
                    {parsedActiveClub.cleanDescription || "No detailed description available for this club."}
                  </p>
                </div>

                {/* ── 4-Way Leadership & Mentorship Showcase ──────────────────── */}
                <div className="bg-gradient-to-br from-[#FAF9FD] to-indigo-50/30 border border-[#EAE4F7] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#4B63D2]" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#1E2746]">
                        Club Leadership, Faculty &amp; Alumni Mentorship
                      </h4>
                    </div>

                    {canManageActiveClub && (
                      <button
                        onClick={openAppointmentsModal}
                        className="text-[11px] font-bold text-[#4B63D2] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Update Appointments</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {/* 1. Student Head */}
                    {clubDetail.head ? (
                      <div className="bg-white border-2 border-amber-300/80 rounded-2xl p-3 shadow-2xs flex items-start gap-2.5 relative">
                        <div className="relative shrink-0">
                          {clubDetail.head.profile_picture ? (
                            <img
                              src={getMediaUrl(clubDetail.head.profile_picture)}
                              alt="Head"
                              className="w-9 h-9 rounded-full object-cover border border-amber-400"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-white font-black flex items-center justify-center text-xs">
                              {clubDetail.head.first_name?.charAt(0) || "H"}
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[8px]">
                            <Crown className="w-2.5 h-2.5" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[8px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded inline-block mb-0.5">
                            🎖️ Student Head
                          </span>
                          <Link
                            to={`/profile/${clubDetail.head.id}`}
                            className="text-xs font-black text-[#1E2746] hover:text-[#4B63D2] truncate block"
                          >
                            {`${clubDetail.head.first_name || ""} ${clubDetail.head.last_name || ""}`.trim() || clubDetail.head.email}
                          </Link>
                          <p className="text-[10px] text-[#5851A4] truncate">
                            {clubDetail.head.department || "Student"}
                          </p>
                        </div>
                        <Link
                          to="/messaging"
                          state={{ recipientId: clubDetail.head.id, recipientName: clubDetail.head.first_name || clubDetail.head.email }}
                          className="text-[#5851A4] hover:text-[#4B63D2] p-1 rounded-lg transition-colors shrink-0"
                          title="Message Head"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[#4B63D2]" />
                        </Link>
                      </div>
                    ) : (
                      <div className="bg-white/60 border border-dashed border-amber-300 rounded-2xl p-3 flex flex-col justify-center items-center text-center">
                        <Crown className="w-4 h-4 text-amber-400 mb-1" />
                        <span className="text-[10px] font-bold text-amber-900">Student Head</span>
                        <span className="text-[9px] text-[#9188BE]">Not appointed yet</span>
                        {canManageActiveClub && (
                          <button
                            onClick={openAppointmentsModal}
                            className="text-[10px] font-bold text-[#4B63D2] hover:underline mt-1 cursor-pointer"
                          >
                            + Appoint Head
                          </button>
                        )}
                      </div>
                    )}

                    {/* 2. Student Co-Head */}
                    {clubDetail.co_head ? (
                      <div className="bg-white border-2 border-indigo-300/80 rounded-2xl p-3 shadow-2xs flex items-start gap-2.5 relative">
                        <div className="relative shrink-0">
                          {clubDetail.co_head.profile_picture ? (
                            <img
                              src={getMediaUrl(clubDetail.co_head.profile_picture)}
                              alt="Co-Head"
                              className="w-9 h-9 rounded-full object-cover border border-indigo-400"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-black flex items-center justify-center text-xs">
                              {clubDetail.co_head.first_name?.charAt(0) || "C"}
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[8px]">
                            <Crown className="w-2.5 h-2.5" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[8px] font-black uppercase tracking-wider text-indigo-900 bg-indigo-100 px-1.5 py-0.2 rounded inline-block mb-0.5">
                            🎖️ Student Co-Head
                          </span>
                          <Link
                            to={`/profile/${clubDetail.co_head.id}`}
                            className="text-xs font-black text-[#1E2746] hover:text-[#4B63D2] truncate block"
                          >
                            {`${clubDetail.co_head.first_name || ""} ${clubDetail.co_head.last_name || ""}`.trim() || clubDetail.co_head.email}
                          </Link>
                          <p className="text-[10px] text-[#5851A4] truncate">
                            {clubDetail.co_head.department || "Student"}
                          </p>
                        </div>
                        <Link
                          to="/messaging"
                          state={{ recipientId: clubDetail.co_head.id, recipientName: clubDetail.co_head.first_name || clubDetail.co_head.email }}
                          className="text-[#5851A4] hover:text-[#4B63D2] p-1 rounded-lg transition-colors shrink-0"
                          title="Message Co-Head"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[#4B63D2]" />
                        </Link>
                      </div>
                    ) : (
                      <div className="bg-white/60 border border-dashed border-indigo-300 rounded-2xl p-3 flex flex-col justify-center items-center text-center">
                        <Crown className="w-4 h-4 text-indigo-400 mb-1" />
                        <span className="text-[10px] font-bold text-indigo-900">Student Co-Head</span>
                        <span className="text-[9px] text-[#9188BE]">Not appointed yet</span>
                        {canManageActiveClub && (
                          <button
                            onClick={openAppointmentsModal}
                            className="text-[10px] font-bold text-[#4B63D2] hover:underline mt-1 cursor-pointer"
                          >
                            + Appoint Co-Head
                          </button>
                        )}
                      </div>
                    )}

                    {/* 3. Faculty Coordinator / Member */}
                    {clubDetail.faculty_coordinator ? (
                      <div className="bg-white border-2 border-purple-300/80 rounded-2xl p-3 shadow-2xs flex items-start gap-2.5 relative">
                        <div className="relative shrink-0">
                          {clubDetail.faculty_coordinator.profile_picture ? (
                            <img
                              src={getMediaUrl(clubDetail.faculty_coordinator.profile_picture)}
                              alt="Faculty"
                              className="w-9 h-9 rounded-full object-cover border border-purple-400"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black flex items-center justify-center text-xs">
                              {clubDetail.faculty_coordinator.first_name?.charAt(0) || "F"}
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[8px]">
                            <GraduationCap className="w-2.5 h-2.5" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[8px] font-black uppercase tracking-wider text-purple-900 bg-purple-100 px-1.5 py-0.2 rounded inline-block mb-0.5">
                            🎓 Faculty Member
                          </span>
                          <Link
                            to={`/profile/${clubDetail.faculty_coordinator.id}`}
                            className="text-xs font-black text-[#1E2746] hover:text-[#4B63D2] truncate block"
                          >
                            {`${clubDetail.faculty_coordinator.first_name || ""} ${clubDetail.faculty_coordinator.last_name || ""}`.trim() || clubDetail.faculty_coordinator.email}
                          </Link>
                          <p className="text-[10px] text-[#5851A4] truncate">
                            {clubDetail.faculty_coordinator.department || "Faculty Coordinator"}
                          </p>
                        </div>
                        <Link
                          to="/messaging"
                          state={{ recipientId: clubDetail.faculty_coordinator.id, recipientName: clubDetail.faculty_coordinator.first_name || clubDetail.faculty_coordinator.email }}
                          className="text-[#5851A4] hover:text-[#4B63D2] p-1 rounded-lg transition-colors shrink-0"
                          title="Message Faculty Member"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[#4B63D2]" />
                        </Link>
                      </div>
                    ) : (
                      <div className="bg-white/60 border border-dashed border-purple-300 rounded-2xl p-3 flex flex-col justify-center items-center text-center">
                        <GraduationCap className="w-4 h-4 text-purple-400 mb-1" />
                        <span className="text-[10px] font-bold text-purple-900">Faculty Coordinator</span>
                        <span className="text-[9px] text-[#9188BE]">Not assigned</span>
                        {canManageActiveClub && (
                          <button
                            onClick={openAppointmentsModal}
                            className="text-[10px] font-bold text-[#4B63D2] hover:underline mt-1 cursor-pointer"
                          >
                            + Appoint Faculty
                          </button>
                        )}
                      </div>
                    )}

                    {/* 4. Alumni Mentor */}
                    {clubDetail.alumni_mentor ? (
                      <div className="bg-white border-2 border-emerald-300/80 rounded-2xl p-3 shadow-2xs flex items-start gap-2.5 relative">
                        <div className="relative shrink-0">
                          {clubDetail.alumni_mentor.profile_picture ? (
                            <img
                              src={getMediaUrl(clubDetail.alumni_mentor.profile_picture)}
                              alt="Alumni"
                              className="w-9 h-9 rounded-full object-cover border border-emerald-400"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-black flex items-center justify-center text-xs">
                              {clubDetail.alumni_mentor.first_name?.charAt(0) || "A"}
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[8px]">
                            <HeartHandshake className="w-2.5 h-2.5" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[8px] font-black uppercase tracking-wider text-emerald-900 bg-emerald-100 px-1.5 py-0.2 rounded inline-block mb-0.5">
                            🤝 Alumni Mentor
                          </span>
                          <Link
                            to={`/profile/${clubDetail.alumni_mentor.id}`}
                            className="text-xs font-black text-[#1E2746] hover:text-[#4B63D2] truncate block"
                          >
                            {`${clubDetail.alumni_mentor.first_name || ""} ${clubDetail.alumni_mentor.last_name || ""}`.trim() || clubDetail.alumni_mentor.email}
                          </Link>
                          <p className="text-[10px] text-[#5851A4] truncate">
                            {clubDetail.alumni_mentor.department || "Alumni"} {clubDetail.alumni_mentor.graduation_year ? `• '${String(clubDetail.alumni_mentor.graduation_year).slice(-2)}` : ""}
                          </p>
                        </div>
                        <Link
                          to="/messaging"
                          state={{ recipientId: clubDetail.alumni_mentor.id, recipientName: clubDetail.alumni_mentor.first_name || clubDetail.alumni_mentor.email }}
                          className="text-[#5851A4] hover:text-[#4B63D2] p-1 rounded-lg transition-colors shrink-0"
                          title="Message Alumni Mentor"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[#4B63D2]" />
                        </Link>
                      </div>
                    ) : (
                      <div className="bg-white/60 border border-dashed border-emerald-300 rounded-2xl p-3 flex flex-col justify-center items-center text-center">
                        <HeartHandshake className="w-4 h-4 text-emerald-500 mb-1" />
                        <span className="text-[10px] font-bold text-emerald-900">Alumni Mentor</span>
                        <span className="text-[9px] text-[#9188BE]">No mentor requested yet</span>
                        {canManageActiveClub && (
                          <button
                            onClick={openAppointmentsModal}
                            className="text-[10px] font-bold text-[#4B63D2] hover:underline mt-1 cursor-pointer"
                          >
                            + Request Mentor
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── STRICTLY 3 TABS: Resources, Gallery, Links ────────────────── */}
              <div className="flex items-center gap-2 border-b border-[#EAE4F7] pb-2">
                {/* TAB 1: Resources */}
                <button
                  onClick={() => setActiveTab("resources")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "resources"
                      ? "bg-[#4B63D2] text-white shadow-sm"
                      : "text-[#5851A4] hover:bg-[#FAF9FD]"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Resources</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                      activeTab === "resources"
                        ? "bg-white/20 text-white"
                        : "bg-[#FAF9FD] text-[#5851A4] border border-[#EAE4F7]"
                    }`}
                  >
                    {clubResources.length}
                  </span>
                </button>

                {/* TAB 2: Gallery */}
                <button
                  onClick={() => setActiveTab("gallery")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "gallery"
                      ? "bg-[#4B63D2] text-white shadow-sm"
                      : "text-[#5851A4] hover:bg-[#FAF9FD]"
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Gallery</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                      activeTab === "gallery"
                        ? "bg-white/20 text-white"
                        : "bg-[#FAF9FD] text-[#5851A4] border border-[#EAE4F7]"
                    }`}
                  >
                    {clubGallery.length}
                  </span>
                </button>

                {/* TAB 3: Links */}
                <button
                  onClick={() => setActiveTab("links")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "links"
                      ? "bg-[#4B63D2] text-white shadow-sm"
                      : "text-[#5851A4] hover:bg-[#FAF9FD]"
                  }`}
                >
                  <Share2 className="w-4 h-4" />
                  <span>Links</span>
                  {officialLinksCount > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                        activeTab === "links"
                          ? "bg-white/20 text-white"
                          : "bg-[#FAF9FD] text-[#5851A4] border border-[#EAE4F7]"
                      }`}
                    >
                      {officialLinksCount}
                    </span>
                  )}
                </button>
              </div>

              {/* ── TAB 1 CONTENT: RESOURCES (Vault & Sharing) ───────────────── */}
              {activeTab === "resources" && (
                <div className="space-y-4">
                  {/* Top Bar: Categories & Share Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF9FD] p-3 rounded-2xl border border-[#EAE4F7]">
                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                      {resourceCategoriesList.map((cat) => {
                        const isSel = selectedResourceCategory.toLowerCase() === cat.toLowerCase();
                        return (
                          <button
                            key={cat}
                            onClick={() => setSelectedResourceCategory(cat)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                              isSel
                                ? "bg-[#4B63D2] text-white shadow-2xs"
                                : "bg-white hover:bg-slate-100 text-[#5851A4] border border-[#EAE4F7]"
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>

                    {/* Share Resource Trigger */}
                    {isExecutiveObserver ? (
                      <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                        <Eye className="w-3 h-3 text-indigo-600" />
                        Observer (Read-Only)
                      </span>
                    ) : canPostResource ? (
                      <button
                        onClick={() => setShowShareResourceModal(true)}
                        className="bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:opacity-95 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>Share Resource</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#5851A4] bg-white border border-[#EAE4F7] px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-[#4B63D2]" />
                        Posting: Head, Co-Head, Faculty &amp; Alumni
                      </span>
                    )}
                  </div>

                  {/* Resources Grid */}
                  {loadingResources ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-2 text-[#5851A4]">
                      <Loader2 className="w-6 h-6 animate-spin text-[#4B63D2]" />
                      <span className="text-xs">Loading shared club resources...</span>
                    </div>
                  ) : filteredResources.length === 0 ? (
                    <div className="p-8 text-center bg-[#FAF9FD] rounded-2xl border border-[#EAE4F7] text-[#5851A4] space-y-2">
                      <BookOpen className="w-8 h-8 text-[#C8B6E2] mx-auto" />
                      <h4 className="text-xs font-bold text-[#1E2746]">No Resources Shared Yet</h4>
                      <p className="text-[11px] max-w-sm mx-auto text-[#5851A4]">
                        {canPostResource
                          ? `Share notes, question banks, images, or repositories for ${clubDetail.name}!`
                          : `Club Head, Co-Head, Faculty Coordinator, or Alumni can share lecture notes, question banks, or repositories for ${clubDetail.name}.`}
                      </p>
                      {canPostResource && (
                        <button
                          onClick={() => setShowShareResourceModal(true)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4B63D2] text-white rounded-xl text-xs font-bold transition-all mt-2 cursor-pointer shadow-xs"
                        >
                          <FolderPlus className="w-3.5 h-3.5" />
                          <span>Share First Resource</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredResources.map((res) => {
                        const canDelete =
                          !isExecutiveObserver &&
                          (isLeaderOrController || (currentUser && res.uploaded_by_id === currentUser.id));
                        const typeMeta = getResourceTypeBadge(res.resource_type);
                        const TypeIcon = typeMeta.icon;

                        return (
                          <div
                            key={res.id}
                            className="bg-white border border-[#EAE4F7] hover:border-[#4B63D2]/50 hover:shadow-xs rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all group"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {/* Resource Type Badge */}
                                  <span
                                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 ${typeMeta.style}`}
                                  >
                                    <TypeIcon className="w-2.5 h-2.5" />
                                    {typeMeta.label}
                                  </span>

                                  {/* Category Badge */}
                                  <span
                                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${getResourceCategoryBadge(
                                      res.category,
                                    )}`}
                                  >
                                    {res.category}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleCopyLink(getMediaUrl(res.url) || res.url, `res-${res.id}`)}
                                    className="p-1 text-[#9188BE] hover:text-[#4B63D2] rounded-md transition-colors cursor-pointer"
                                    title="Copy Resource Link"
                                  >
                                    {copiedLinkIndex === `res-${res.id}` ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>

                                  {canDelete && (
                                    <button
                                      onClick={() => handleDeleteResource(res.id)}
                                      className="p-1 text-[#9188BE] hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                                      title="Delete Resource"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              <h5 className="text-xs font-black text-[#1E2746] group-hover:text-[#4B63D2] transition-colors leading-snug">
                                {res.title}
                              </h5>

                              {res.description && (
                                <p className="text-[11px] text-[#5851A4] line-clamp-2 leading-relaxed">
                                  {res.description}
                                </p>
                              )}
                            </div>

                            <div className="pt-2 border-t border-[#EAE4F7] flex items-center justify-between gap-2 text-[10px] text-[#9188BE]">
                              <div className="truncate">
                                <span>Shared by </span>
                                <strong className="text-[#1E2746]">
                                  {res.uploader?.first_name || res.uploader?.email?.split("@")[0] || "Member"}
                                </strong>
                              </div>

                              <a
                                href={getMediaUrl(res.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#4B63D2] hover:bg-[#3E53BE] text-white rounded-lg font-bold text-[10px] transition-all cursor-pointer shadow-2xs shrink-0"
                              >
                                <span>{typeMeta.cta}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB 2 CONTENT: GALLERY (Photos of Activities & Workshops) ── */}
              {activeTab === "gallery" && (
                <div className="space-y-4">
                  {/* Gallery Header Row */}
                  <div className="flex items-center justify-between bg-[#FAF9FD] p-3 rounded-2xl border border-[#EAE4F7]">
                    <div>
                      <h4 className="text-xs font-black text-[#1E2746]">
                        Club Activities, Hackathons &amp; Workshop Gallery
                      </h4>
                      <p className="text-[11px] text-[#5851A4]">
                        Photo memories and achievements from past club meetups
                      </p>
                    </div>

                    {isExecutiveObserver ? (
                      <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                        <Eye className="w-3 h-3 text-indigo-600" />
                        Observer (Read-Only)
                      </span>
                    ) : isConfirmedMember ? (
                      <button
                        onClick={() => setShowAddPhotoModal(true)}
                        className="bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:opacity-95 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Add Photo</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#9188BE] font-medium italic">
                        Join club to contribute photos
                      </span>
                    )}
                  </div>

                  {/* Photos Grid */}
                  {loadingGallery ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-2 text-[#5851A4]">
                      <Loader2 className="w-6 h-6 animate-spin text-[#4B63D2]" />
                      <span className="text-xs">Loading activity photos...</span>
                    </div>
                  ) : clubGallery.length === 0 ? (
                    <div className="p-8 text-center bg-[#FAF9FD] rounded-2xl border border-[#EAE4F7] text-[#5851A4] space-y-2">
                      <ImageIcon className="w-8 h-8 text-[#C8B6E2] mx-auto" />
                      <h4 className="text-xs font-bold text-[#1E2746]">No Photos in Club Gallery Yet</h4>
                      <p className="text-[11px] max-w-sm mx-auto text-[#5851A4]">
                        Share workshop moments, hackathon victories, and guest speaker sessions for {clubDetail.name}!
                      </p>
                      {isConfirmedMember && !isExecutiveObserver && (
                        <button
                          onClick={() => setShowAddPhotoModal(true)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4B63D2] text-white rounded-xl text-xs font-bold transition-all mt-2 cursor-pointer shadow-xs"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Add First Photo</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                      {clubGallery.map((photo) => {
                        const canDelete =
                          !isExecutiveObserver &&
                          (isLeaderOrController || (currentUser && photo.uploaded_by_id === currentUser.id));

                        return (
                          <div
                            key={photo.id}
                            className="bg-white border border-[#EAE4F7] rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all group flex flex-col justify-between"
                          >
                            <div className="relative aspect-video overflow-hidden bg-slate-100">
                              <img
                                src={photo.image_url}
                                alt={photo.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80";
                                }}
                              />

                              {photo.activity_name && (
                                <span className="absolute top-2 left-2 bg-black/65 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                                  {photo.activity_name}
                                </span>
                              )}

                              <button
                                onClick={() => setPreviewPhoto(photo)}
                                className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                                title="Enlarge photo"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="p-3 space-y-1">
                              <div className="flex items-start justify-between gap-1">
                                <h5 className="text-xs font-black text-[#1E2746] line-clamp-1">{photo.title}</h5>
                                {canDelete && (
                                  <button
                                    onClick={() => handleDeletePhoto(photo.id)}
                                    className="text-[#9188BE] hover:text-rose-600 p-0.5 transition-colors cursor-pointer shrink-0"
                                    title="Delete photo"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <p className="text-[10px] text-[#9188BE] truncate">
                                Posted by {photo.uploader?.first_name || "Member"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB 3 CONTENT: LINKS (Official Links Directory) ─────────── */}
              {activeTab === "links" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-[#FAF9FD] p-3 rounded-2xl border border-[#EAE4F7]">
                    <div>
                      <h4 className="text-xs font-black text-[#1E2746]">
                        Official Chapter Links &amp; Communities
                      </h4>
                      <p className="text-[11px] text-[#5851A4]">
                        Direct access to live meeting rooms, repositories, and community chatrooms
                      </p>
                    </div>

                    {isLeaderOrController && (
                      <button
                        onClick={openEditModal}
                        className="bg-white hover:bg-slate-100 text-[#5851A4] border border-[#D5CBEE] font-bold px-3 py-1.5 rounded-xl text-xs transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#4B63D2]" />
                        <span>Edit Official Links</span>
                      </button>
                    )}
                  </div>

                  {/* Curated Links Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Live Meeting Link */}
                    {parsedActiveClub.meetUrl && (
                      <div className="p-3.5 bg-white border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <Video className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <h5 className="text-xs font-black text-[#1E2746]">Live Meeting Room</h5>
                            <p className="text-[10px] text-[#9188BE] truncate">{parsedActiveClub.meetUrl}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleCopyLink(parsedActiveClub.meetUrl!, "meet")}
                            className="p-1.5 text-[#9188BE] hover:text-[#4B63D2] rounded-lg transition-colors cursor-pointer"
                            title="Copy link"
                          >
                            {copiedLinkIndex === "meet" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <a
                            href={parsedActiveClub.meetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                            title="Join Meeting"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Shared Drive & Notes Link */}
                    {parsedActiveClub.driveUrl && (
                      <div className="p-3.5 bg-white border border-sky-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <h5 className="text-xs font-black text-[#1E2746]">Shared Drive &amp; Cloud Notes</h5>
                            <p className="text-[10px] text-[#9188BE] truncate">{parsedActiveClub.driveUrl}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleCopyLink(parsedActiveClub.driveUrl!, "drive")}
                            className="p-1.5 text-[#9188BE] hover:text-[#4B63D2] rounded-lg transition-colors cursor-pointer"
                            title="Copy link"
                          >
                            {copiedLinkIndex === "drive" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <a
                            href={parsedActiveClub.driveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors cursor-pointer"
                            title="Open Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* GitHub Link */}
                    {parsedActiveClub.githubUrl && (
                      <div className="p-3.5 bg-white border border-slate-300 rounded-2xl flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
                            <FolderGit2 className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <h5 className="text-xs font-black text-[#1E2746]">GitHub Organization &amp; Code</h5>
                            <p className="text-[10px] text-[#9188BE] truncate">{parsedActiveClub.githubUrl}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleCopyLink(parsedActiveClub.githubUrl!, "github")}
                            className="p-1.5 text-[#9188BE] hover:text-[#4B63D2] rounded-lg transition-colors cursor-pointer"
                            title="Copy link"
                          >
                            {copiedLinkIndex === "github" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <a
                            href={parsedActiveClub.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-slate-800 hover:bg-black text-white rounded-lg transition-colors cursor-pointer"
                            title="Open GitHub"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Discord / WhatsApp Community Link */}
                    {parsedActiveClub.discordUrl && (
                      <div className="p-3.5 bg-white border border-indigo-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <MessageCircle className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <h5 className="text-xs font-black text-[#1E2746]">Community Discord / Chat</h5>
                            <p className="text-[10px] text-[#9188BE] truncate">{parsedActiveClub.discordUrl}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleCopyLink(parsedActiveClub.discordUrl!, "discord")}
                            className="p-1.5 text-[#9188BE] hover:text-[#4B63D2] rounded-lg transition-colors cursor-pointer"
                            title="Copy link"
                          >
                            {copiedLinkIndex === "discord" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <a
                            href={parsedActiveClub.discordUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer"
                            title="Join Community"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Notion Roadmap Link */}
                    {parsedActiveClub.notionUrl && (
                      <div className="p-3.5 bg-white border border-purple-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <h5 className="text-xs font-black text-[#1E2746]">Notion Project Roadmap</h5>
                            <p className="text-[10px] text-[#9188BE] truncate">{parsedActiveClub.notionUrl}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleCopyLink(parsedActiveClub.notionUrl!, "notion")}
                            className="p-1.5 text-[#9188BE] hover:text-[#4B63D2] rounded-lg transition-colors cursor-pointer"
                            title="Copy link"
                          >
                            {copiedLinkIndex === "notion" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <a
                            href={parsedActiveClub.notionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors cursor-pointer"
                            title="Open Notion"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Official Website Link */}
                    {parsedActiveClub.websiteUrl && (
                      <div className="p-3.5 bg-white border border-teal-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                            <Globe className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <h5 className="text-xs font-black text-[#1E2746]">Official Club Website</h5>
                            <p className="text-[10px] text-[#9188BE] truncate">{parsedActiveClub.websiteUrl}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleCopyLink(parsedActiveClub.websiteUrl!, "website")}
                            className="p-1.5 text-[#9188BE] hover:text-[#4B63D2] rounded-lg transition-colors cursor-pointer"
                            title="Copy link"
                          >
                            {copiedLinkIndex === "website" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <a
                            href={parsedActiveClub.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors cursor-pointer"
                            title="Open Website"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {officialLinksCount === 0 && (
                    <div className="p-8 text-center bg-[#FAF9FD] rounded-2xl border border-[#EAE4F7] text-[#5851A4] space-y-2">
                      <Share2 className="w-8 h-8 text-[#C8B6E2] mx-auto" />
                      <h4 className="text-xs font-bold text-[#1E2746]">No Official Links Configured</h4>
                      <p className="text-[11px] max-w-sm mx-auto text-[#5851A4]">
                        Add Google Meet links, GitHub repositories, Discord channels, or Drive folders for club members.
                      </p>
                      {isLeaderOrController && (
                        <button
                          onClick={openEditModal}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4B63D2] text-white rounded-xl text-xs font-bold transition-all mt-2 cursor-pointer shadow-xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Configure Links Now</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── 4. Create / Edit Club Modal ─────────────────────────────────────── */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-xl bg-white border border-[#EAE4F7] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-[#1E2746] to-[#2A3558] text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base md:text-lg font-black">
                  {isEditing ? "Modify Department Club" : "Register Department Club"}
                </h3>
                <p className="text-xs mt-0.5 font-medium" style={{ color: "#E2E8F0" }}>
                  Configure department chapter, leadership appointments, and official links
                </p>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-white/75 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1E2746]">
                  Club / Chapter Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="e.g. AI & Cloud Computing Club"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-4 py-2.5 text-xs text-[#1E2746] placeholder-[#9188BE] outline-none font-medium"
                />
              </div>

              {/* Department / Category — locked for Controllers/TPO, dropdown for Central Admin */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1E2746]">
                    {isAdmin ? "Club Scope" : isTpo ? "Club Scope" : "Department"} <span className="text-rose-500">*</span>
                  </label>
                  {!isAdmin && !isTpo && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      🔒 Locked to Your Department
                    </span>
                  )}
                  {isTpo && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      🔒 Placement &amp; Internship Only
                    </span>
                  )}
                  {isAdmin && (
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                      🏛️ Central Admin — Full Authority
                    </span>
                  )}
                </div>
                {isAdmin ? (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-4 py-2.5 text-xs text-[#1E2746] font-bold outline-none"
                  >
                    <option value="Central">🏛️ Central (Campus-Wide)</option>
                    <option value="Placement & Internship">💼 Placement &amp; Internship</option>
                    <option value="CSE">CSE – Computer Science & Engineering</option>
                    <option value="CSE(AIML)">CSE(AIML) – AI & Machine Learning</option>
                    <option value="CSE(AIDS)">CSE(AIDS) – Data Science</option>
                    <option value="IT">IT – Information Technology</option>
                    <option value="ETC">ETC – Electronics & Telecom</option>
                    <option value="EE">EE – Electrical Engineering</option>
                    <option value="ME">ME – Mechanical Engineering</option>
                    <option value="BCA">BCA</option>
                    <option value="MCA">MCA</option>
                    <option value="MBA">MBA</option>
                    <option value="First Year">First Year</option>
                    <option value="Sports Department">Sports Department</option>
                  </select>
                ) : isTpo ? (
                  <div className="w-full bg-[#FAF9FD] border border-emerald-200 rounded-xl px-4 py-2.5 text-xs text-[#1E2746] font-bold flex items-center justify-between">
                    <span className="text-emerald-800">Placement &amp; Internship</span>
                    <span className="text-[11px] text-emerald-600 font-medium">Training &amp; Placement</span>
                  </div>
                ) : (
                  <div className="w-full bg-[#FAF9FD] border border-[#D5CBEE] rounded-xl px-4 py-2.5 text-xs text-[#1E2746] font-bold flex items-center justify-between">
                    <span>{category || getControllerDefaultCategory(currentUser)}</span>
                    <span className="text-[11px] text-[#5851A4] font-medium">Department Chapter</span>
                  </div>
                )}
              </div>

              {/* 4-Way Leadership Appointments Grid */}
              <div className="bg-gradient-to-r from-[#FAF9FD] to-amber-50/50 p-4 rounded-2xl border border-amber-200 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#1E2746]">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span>Appoint Leadership &amp; Mentors</span>
                </div>
                <p className="text-[11px] text-[#5851A4]">
                  Controller can appoint student heads, assign a faculty coordinator, and invite an alumni mentor.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 mb-1">
                      🎖️ Student Head
                    </label>
                    <select
                      value={formHeadId || ""}
                      onChange={(e) => setFormHeadId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3.5 py-2 bg-white border border-amber-200 focus:border-amber-500 rounded-xl text-xs font-semibold text-[#1E2746] focus:outline-none"
                    >
                      <option value="">-- Select Student Head --</option>
                      {departmentStudents.map((s) => (
                        <option key={`head-${s.id}`} value={s.id} disabled={s.id === formCoHeadId}>
                          {s.name} ({s.department || "Student"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                      🎖️ Student Co-Head
                    </label>
                    <select
                      value={formCoHeadId || ""}
                      onChange={(e) => setFormCoHeadId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3.5 py-2 bg-white border border-indigo-200 focus:border-indigo-500 rounded-xl text-xs font-semibold text-[#1E2746] focus:outline-none"
                    >
                      <option value="">-- Select Student Co-Head --</option>
                      {departmentStudents.map((s) => (
                        <option key={`cohead-${s.id}`} value={s.id} disabled={s.id === formHeadId}>
                          {s.name} ({s.department || "Student"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-purple-900 mb-1">
                      🎓 Faculty Member / Coordinator
                    </label>
                    <select
                      value={formFacultyCoordinatorId || ""}
                      onChange={(e) => setFormFacultyCoordinatorId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3.5 py-2 bg-white border border-purple-200 focus:border-purple-500 rounded-xl text-xs font-semibold text-[#1E2746] focus:outline-none"
                    >
                      <option value="">-- Select Faculty Member --</option>
                      {facultyCandidates.map((f) => (
                        <option key={`fac-${f.id}`} value={f.id}>
                          {`${f.first_name || ""} ${f.last_name || ""}`.trim() || f.email} ({f.department || "Faculty"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                      🤝 Alumni Mentor
                    </label>
                    <select
                      value={formAlumniMentorId || ""}
                      onChange={(e) => setFormAlumniMentorId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3.5 py-2 bg-white border border-emerald-200 focus:border-emerald-500 rounded-xl text-xs font-semibold text-[#1E2746] focus:outline-none"
                    >
                      <option value="">-- Request Alumni Mentor --</option>
                      {alumniCandidates.map((a) => (
                        <option key={`alum-${a.id}`} value={a.id}>
                          {`${a.first_name || ""} ${a.last_name || ""}`.trim() || a.email} (Class {a.graduation_year || "Alumni"})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Official Links Inputs (Meet, Drive, GitHub, Discord) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1E2746] flex items-center gap-1">
                    <Video className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Meet / Zoom URL</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={formMeetUrl}
                    onChange={(e) => setFormMeetUrl(e.target.value)}
                    className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-3.5 py-2 text-xs text-[#1E2746] placeholder-[#9188BE] outline-none font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1E2746] flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-sky-600" />
                    <span>Drive / Notes URL</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={formDriveUrl}
                    onChange={(e) => setFormDriveUrl(e.target.value)}
                    className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-3.5 py-2 text-xs text-[#1E2746] placeholder-[#9188BE] outline-none font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1E2746] flex items-center gap-1">
                    <FolderGit2 className="w-3.5 h-3.5 text-slate-700" />
                    <span>GitHub URL</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={formGithubUrl}
                    onChange={(e) => setFormGithubUrl(e.target.value)}
                    className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-3.5 py-2 text-xs text-[#1E2746] placeholder-[#9188BE] outline-none font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1E2746] flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Discord / Community URL</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://discord.gg/..."
                    value={formDiscordUrl}
                    onChange={(e) => setFormDiscordUrl(e.target.value)}
                    className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-3.5 py-2 text-xs text-[#1E2746] placeholder-[#9188BE] outline-none font-medium"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1E2746]">
                  Club Mission &amp; Overview
                </label>
                <textarea
                  rows={3}
                  maxLength={1500}
                  placeholder="Describe club activities, eligibility, workshops, and weekly meet schedules..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-4 py-2.5 text-xs text-[#1E2746] placeholder-[#9188BE] outline-none resize-none font-medium"
                />
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAE4F7]">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="bg-[#FAF9FD] hover:bg-[#F0EDF9] border border-[#EAE4F7] text-[#5851A4] px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingForm}
                  className="bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/25 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer"
                >
                  {submittingForm && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isEditing ? "Save Club Details" : "Register Club"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 5. Appoint Leadership & Mentors Modal (Controller Access) ─────── */}
      {showAppointmentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-xl bg-white border border-[#EAE4F7] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-[#5851A4] to-[#4B63D2] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-black">
                    Appoint Club Leadership &amp; Mentors
                  </h3>
                  <p className="text-xs font-medium text-white/80">
                    {clubDetail?.name} • {clubDetail?.category}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAppointmentsModal(false)}
                className="text-white/75 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-[#5851A4] leading-relaxed">
                As the Department Controller, assign student leaders to manage memberships, a faculty coordinator for department oversight, and invite an alumni mentor to guide students.
              </p>

              {loadingCandidates ? (
                <div className="py-8 flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#4B63D2]" />
                  <span className="text-xs text-[#5851A4]">Loading candidate rosters...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 1. Student Head */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      <span>Student Club Head</span>
                    </label>
                    <select
                      value={selectedHeadId || ""}
                      onChange={(e) => setSelectedHeadId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-3.5 py-2.5 text-xs text-[#1E2746] outline-none font-semibold cursor-pointer"
                    >
                      <option value="">-- No Student Head Appointed --</option>
                      {departmentStudents.map((s) => (
                        <option key={`sel-head-${s.id}`} value={s.id} disabled={s.id === selectedCoHeadId}>
                          {s.name} ({s.department || "Student"}{s.graduation_year ? ` '${String(s.graduation_year).slice(-2)}` : ""})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Student Co-Head */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Student Club Co-Head</span>
                    </label>
                    <select
                      value={selectedCoHeadId || ""}
                      onChange={(e) => setSelectedCoHeadId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-3.5 py-2.5 text-xs text-[#1E2746] outline-none font-semibold cursor-pointer"
                    >
                      <option value="">-- No Student Co-Head Appointed --</option>
                      {departmentStudents.map((s) => (
                        <option key={`sel-cohead-${s.id}`} value={s.id} disabled={s.id === selectedHeadId}>
                          {s.name} ({s.department || "Student"}{s.graduation_year ? ` '${String(s.graduation_year).slice(-2)}` : ""})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Faculty Coordinator */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                      <span>Faculty Member / Coordinator</span>
                    </label>
                    <select
                      value={selectedFacultyId || ""}
                      onChange={(e) => setSelectedFacultyId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-3.5 py-2.5 text-xs text-[#1E2746] outline-none font-semibold cursor-pointer"
                    >
                      <option value="">-- No Faculty Coordinator Assigned --</option>
                      {facultyCandidates.map((f) => (
                        <option key={`sel-fac-${f.id}`} value={f.id}>
                          {`${f.first_name || ""} ${f.last_name || ""}`.trim() || f.email} ({f.department || "Faculty"})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 4. Alumni Mentor */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Request Alumni Mentor</span>
                    </label>
                    <select
                      value={selectedAlumniMentorId || ""}
                      onChange={(e) => setSelectedAlumniMentorId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-3.5 py-2.5 text-xs text-[#1E2746] outline-none font-semibold cursor-pointer"
                    >
                      <option value="">-- No Alumni Mentor Assigned --</option>
                      {alumniCandidates.map((a) => (
                        <option key={`sel-alum-${a.id}`} value={a.id}>
                          {`${a.first_name || ""} ${a.last_name || ""}`.trim() || a.email} (Class {a.graduation_year || "Alumni"} • {a.department || "Engineering"})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAE4F7]">
                <button
                  type="button"
                  onClick={() => setShowAppointmentsModal(false)}
                  className="bg-[#FAF9FD] hover:bg-[#F0EDF9] border border-[#EAE4F7] text-[#5851A4] px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAppointments}
                  disabled={submittingAppointments}
                  className="bg-gradient-to-r from-[#5851A4] to-[#4B63D2] hover:opacity-95 text-white shadow-md shadow-[#4B63D2]/25 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer"
                >
                  {submittingAppointments && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Appointments</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Share Resource Modal ─────────────────────────────────────────── */}
      {showShareResourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg bg-white border border-[#EAE4F7] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 bg-gradient-to-r from-[#1E2746] to-[#4B63D2] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <FolderPlus className="w-5 h-5 text-indigo-300" />
                <div>
                  <h3 className="text-base font-black">Share Study Resource</h3>
                  <p className="text-xs text-white/80">{clubDetail?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowShareResourceModal(false)}
                className="text-white/75 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleShareResource} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* 1. Resource Type Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1E2746] flex items-center justify-between">
                  <span>Resource Type <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-[#5851A4] font-normal lowercase">Doc • Image • PDF • GitHub</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "DOC", label: "Doc", icon: FileText, desc: "Word, PPT, Text" },
                    { id: "IMAGE", label: "Image", icon: ImageIcon, desc: "Diagrams, Infographics" },
                    { id: "PDF", label: "PDF", icon: FileText, desc: "Handouts, Books" },
                    { id: "GITHUB", label: "GitHub link", icon: FolderGit2, desc: "Repositories, Code" },
                  ].map((t) => {
                    const isSelected = resourceType === t.id;
                    const IconComp = t.icon;
                    return (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => {
                          const newType = t.id as "DOC" | "IMAGE" | "PDF" | "GITHUB";
                          setResourceType(newType);
                          if (newType === "GITHUB") {
                            setResourceInputMode("url");
                            setResourceCategory("URL / Repo");
                          } else if (resourceCategory === "URL / Repo") {
                            setResourceCategory("Notes");
                          }
                        }}
                        className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "bg-indigo-50/70 border-[#4B63D2] ring-2 ring-[#4B63D2]/30 shadow-2xs"
                            : "bg-[#FAF9FD] border-[#D5CBEE] hover:border-[#4B63D2]/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <IconComp
                            className={`w-4 h-4 ${
                              isSelected
                                ? t.id === "PDF"
                                  ? "text-rose-600"
                                  : t.id === "IMAGE"
                                  ? "text-emerald-600"
                                  : t.id === "GITHUB"
                                  ? "text-purple-600"
                                  : "text-[#4B63D2]"
                                : "text-[#9188BE]"
                            }`}
                          />
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-[#4B63D2]" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-black text-[#1E2746]">{t.label}</div>
                          <div className="text-[9px] text-[#5851A4] leading-tight truncate">{t.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Category Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1E2746]">
                  Category <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: "Notes", label: "Notes", icon: "📝" },
                    { id: "Question Bank", label: "Question Bank", icon: "🎯" },
                    { id: "URL / Repo", label: "URL / Repo", icon: "🔗" },
                  ].map((cat) => {
                    const isSel = resourceCategory === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setResourceCategory(cat.id)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isSel
                            ? "bg-[#4B63D2] text-white border-[#4B63D2] shadow-2xs"
                            : "bg-[#FAF9FD] text-[#5851A4] border-[#D5CBEE] hover:bg-white hover:border-[#4B63D2]/50"
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Resource Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1E2746]">
                  Resource Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    resourceType === "GITHUB"
                      ? "e.g. Club Core Web Application Repository"
                      : resourceCategory === "Question Bank"
                      ? "e.g. Semester 6 End-Sem Previous 5 Years Question Bank"
                      : "e.g. Full Stack Development & Cloud Architecture Lecture Notes"
                  }
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-3.5 py-2.5 text-xs text-[#1E2746] placeholder-[#9188BE] outline-none font-medium"
                />
              </div>

              {/* 4. Input Mode Toggle (File Upload vs External Cloud URL) */}
              {resourceType !== "GITHUB" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#1E2746]">
                      Resource Source <span className="text-rose-500">*</span>
                    </label>
                    <div className="inline-flex rounded-lg bg-[#FAF9FD] border border-[#D5CBEE] p-0.5">
                      <button
                        type="button"
                        onClick={() => setResourceInputMode("file")}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                          resourceInputMode === "file"
                            ? "bg-[#4B63D2] text-white shadow-2xs"
                            : "text-[#5851A4] hover:text-[#1E2746]"
                        }`}
                      >
                        <UploadCloud className="w-3 h-3" />
                        <span>Upload File</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setResourceInputMode("url")}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                          resourceInputMode === "url"
                            ? "bg-[#4B63D2] text-white shadow-2xs"
                            : "text-[#5851A4] hover:text-[#1E2746]"
                        }`}
                      >
                        <Link2 className="w-3 h-3" />
                        <span>Cloud / Drive Link</span>
                      </button>
                    </div>
                  </div>

                  {resourceInputMode === "file" ? (
                    <div className="relative border-2 border-dashed border-[#D5CBEE] hover:border-[#4B63D2] rounded-2xl p-4 transition-colors bg-[#FAF9FD]/60 text-center">
                      <input
                        type="file"
                        id="club-resource-file-input"
                        accept={
                          resourceType === "PDF"
                            ? ".pdf,application/pdf"
                            : resourceType === "IMAGE"
                            ? "image/*"
                            : ".doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.odt,.rtf,application/msword,application/vnd.openxmlformats-officedocument.*,text/*"
                        }
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setResourceFile(f);
                        }}
                        className="hidden"
                      />
                      {resourceFile ? (
                        <div className="flex items-center justify-between bg-white border border-indigo-200 rounded-xl p-2.5 text-left">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4 text-[#4B63D2]" />
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold text-[#1E2746] truncate">
                                {resourceFile.name}
                              </p>
                              <p className="text-[10px] text-[#5851A4]">
                                {(resourceFile.size / 1024 / 1024).toFixed(2)} MB • Ready to upload
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setResourceFile(null)}
                            className="text-[#9188BE] hover:text-rose-600 p-1 transition-colors cursor-pointer shrink-0"
                            title="Remove file"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="club-resource-file-input"
                          className="cursor-pointer block py-3 space-y-1.5"
                        >
                          <UploadCloud className="w-8 h-8 text-[#4B63D2] mx-auto" />
                          <p className="text-xs font-bold text-[#1E2746]">
                            Click to select a {resourceType.toLowerCase()} file
                          </p>
                          <p className="text-[10px] text-[#9188BE]">
                            {resourceType === "PDF"
                              ? "PDF files up to 25MB"
                              : resourceType === "IMAGE"
                              ? "PNG, JPG, WEBP diagrams up to 15MB"
                              : "DOC, DOCX, PPTX, TXT files up to 25MB"}
                          </p>
                        </label>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <input
                        type="url"
                        required={resourceInputMode === "url"}
                        placeholder="https://drive.google.com/file/d/... or OneDrive link"
                        value={resourceUrl}
                        onChange={(e) => setResourceUrl(e.target.value)}
                        className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-3.5 py-2.5 text-xs text-[#1E2746] placeholder-[#9188BE] outline-none font-medium"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 4b. GitHub Link input (if GITHUB type selected) */}
              {resourceType === "GITHUB" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1E2746]">
                    GitHub Repository Link <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <FolderGit2 className="w-4 h-4 text-purple-600 absolute left-3.5 top-3" />
                    <input
                      type="url"
                      required
                      placeholder="https://github.com/organization/repository-name"
                      value={resourceUrl}
                      onChange={(e) => setResourceUrl(e.target.value)}
                      className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#1E2746] placeholder-[#9188BE] outline-none font-medium"
                    />
                  </div>
                </div>
              )}

              {/* 5. Description (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1E2746]">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  placeholder="Explain covered topics, course syllabus units, or lab setup instructions..."
                  value={resourceDescription}
                  onChange={(e) => setResourceDescription(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-3.5 py-2 text-xs text-[#1E2746] placeholder-[#9188BE] outline-none resize-none font-medium"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAE4F7]">
                <button
                  type="button"
                  onClick={() => setShowShareResourceModal(false)}
                  className="bg-[#FAF9FD] hover:bg-[#F0EDF9] border border-[#EAE4F7] text-[#5851A4] px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingResource}
                  className="bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:opacity-95 text-white font-bold px-5 py-2 rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingResource && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {submittingResource
                      ? resourceInputMode === "file" && resourceType !== "GITHUB"
                        ? "Uploading & Sharing..."
                        : "Sharing Resource..."
                      : "Share to Vault"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 7. Add Photo to Gallery Modal ───────────────────────────────────── */}
      {showAddPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg bg-white border border-[#EAE4F7] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 bg-gradient-to-r from-[#1E2746] to-[#4B63D2] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-5 h-5 text-indigo-300" />
                <div>
                  <h3 className="text-base font-black">Add Photo to Gallery</h3>
                  <p className="text-xs text-white/80">{clubDetail?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddPhotoModal(false)}
                className="text-white/75 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPhoto} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1E2746]">
                  Photo Caption / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Robotics Workshop - Lab Hands-on Session"
                  value={photoTitle}
                  onChange={(e) => setPhotoTitle(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-3.5 py-2.5 text-xs text-[#1E2746] placeholder-[#9188BE] outline-none font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1E2746]">
                  Activity / Workshop Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. HackSBJIT 2026 or Winter Bootcamp"
                  value={photoActivity}
                  onChange={(e) => setPhotoActivity(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-3.5 py-2.5 text-xs text-[#1E2746] placeholder-[#9188BE] outline-none font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1E2746]">
                  Image URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/... or cloud image URL"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-3.5 py-2.5 text-xs text-[#1E2746] placeholder-[#9188BE] outline-none font-medium"
                />
              </div>

              {photoUrl && (
                <div className="rounded-xl overflow-hidden aspect-video border border-[#EAE4F7] max-h-44 bg-slate-100">
                  <img
                    src={photoUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAE4F7]">
                <button
                  type="button"
                  onClick={() => setShowAddPhotoModal(false)}
                  className="bg-[#FAF9FD] hover:bg-[#F0EDF9] border border-[#EAE4F7] text-[#5851A4] px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPhoto}
                  className="bg-[#4B63D2] hover:bg-[#3E53BE] text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingPhoto && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Add Photo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 8. Photo Lightbox Modal ─────────────────────────────────────────── */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="w-full max-w-3xl bg-slate-900 border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 flex items-center justify-between text-white border-b border-white/10">
              <div>
                <h4 className="text-sm font-black">{previewPhoto.title}</h4>
                {previewPhoto.activity_name && (
                  <span className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider">
                    {previewPhoto.activity_name}
                  </span>
                )}
              </div>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-black/95 flex items-center justify-center max-h-[75vh] p-2">
              <img
                src={previewPhoto.image_url}
                alt={previewPhoto.title}
                className="max-h-[70vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── 9. Manage Join Requests Modal ───────────────────────────────────── */}
      {showRequestsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-xl bg-white border border-[#EAE4F7] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-amber-200" />
                <div>
                  <h3 className="text-base font-black">Pending Student Join Requests</h3>
                  <p className="text-xs text-amber-100">{clubDetail?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowRequestsModal(false)}
                className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              {pendingRequests.length === 0 ? (
                <div className="p-8 text-center bg-[#FAF9FD] rounded-2xl border border-[#EAE4F7] text-[#5851A4] space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                  <p className="font-bold text-xs text-[#1E2746]">No Pending Requests</p>
                  <p className="text-[11px]">All student requests have been processed.</p>
                </div>
              ) : (
                pendingRequests.map((req) => {
                  const u = req.user;
                  const fullName =
                    `${u?.first_name || ""} ${u?.last_name || ""}`.trim() ||
                    (u?.email ? u.email.split("@")[0] : `Student #${req.user_id}`);
                  const avatar = u?.profile_picture ? getMediaUrl(u.profile_picture) : null;

                  return (
                    <div
                      key={req.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white border border-amber-200 rounded-2xl shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={fullName}
                            className="w-9 h-9 rounded-full object-cover border border-[#EAE4F7] shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4B63D2] to-[#5851A4] text-white font-bold flex items-center justify-center text-xs shrink-0">
                            {fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link
                            to={`/profile/${req.user_id}`}
                            className="text-xs font-bold text-[#1E2746] hover:text-[#4B63D2] truncate block"
                          >
                            {fullName}
                          </Link>
                          <div className="text-[10px] text-[#5851A4] truncate">
                            {u?.department || "Student"} • {u?.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleApproveRequest(req.user_id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => handleRejectOrRemoveMember(req.user_id, fullName)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 10. Club Members Roster Modal ────────────────────────────────────── */}
      {showRosterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-xl bg-white border border-[#EAE4F7] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 bg-gradient-to-r from-[#1E2746] to-[#2A3558] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-indigo-300" />
                <div>
                  <h3 className="text-base font-black">Enrolled Members Roster</h3>
                  <p className="text-xs text-white/80">
                    {clubDetail?.name} • {activeMembers.length} active members
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRosterModal(false)}
                className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5851A4]" />
                  <input
                    type="text"
                    placeholder="Search enrolled members..."
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#1E2746] placeholder-[#9188BE] outline-none font-medium"
                  />
                </div>

                <select
                  value={memberRoleFilter}
                  onChange={(e) => setMemberRoleFilter(e.target.value)}
                  className="bg-[#FAF9FD] border border-[#D5CBEE] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#1E2746] outline-none cursor-pointer"
                >
                  <option value="ALL">All Roles</option>
                  <option value="MEMBER">Members</option>
                  <option value="OFFICER">Officers</option>
                  <option value="LEADER">Leads</option>
                </select>
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {filteredActiveMembers.length === 0 ? (
                  <div className="p-6 text-center text-[#5851A4] text-xs">
                    No enrolled members match your search criteria.
                  </div>
                ) : (
                  filteredActiveMembers.map((member) => {
                    const u = member.user;
                    const fullName =
                      `${u?.first_name || ""} ${u?.last_name || ""}`.trim() ||
                      (u?.email ? u.email.split("@")[0] : `User #${member.user_id}`);
                    const avatar = u?.profile_picture ? getMediaUrl(u.profile_picture) : null;
                    const canManage = !isExecutiveObserver && isControllerOrAdmin && member.user_id !== currentUser?.id;

                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between gap-3 p-3 bg-white border border-[#EAE4F7] rounded-2xl hover:border-[#4B63D2]/40 transition-all shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {avatar ? (
                            <img
                              src={avatar}
                              alt={fullName}
                              className="w-8 h-8 rounded-full object-cover border border-[#EAE4F7] shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4B63D2] to-[#5851A4] text-white font-bold flex items-center justify-center text-xs shrink-0">
                              {fullName.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0">
                            <Link
                              to={`/profile/${member.user_id}`}
                              className="text-xs font-bold text-[#1E2746] hover:text-[#4B63D2] truncate block"
                            >
                              {fullName}
                            </Link>
                            <div className="text-[10px] text-[#5851A4] truncate">
                              {u?.department || "Student"} • {u?.email}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {canManage ? (
                            <div className="flex items-center gap-1.5">
                              <select
                                value={member.role}
                                onChange={(e) =>
                                  handleUpdateMemberRole(
                                    member.user_id,
                                    e.target.value as any,
                                  )
                                }
                                className="bg-[#FAF9FD] border border-[#D5CBEE] rounded-xl px-2 py-1 text-[10px] font-bold text-[#1E2746] focus:outline-none focus:border-[#4B63D2] cursor-pointer"
                              >
                                <option value="MEMBER">Member</option>
                                <option value="OFFICER">Officer</option>
                                <option value="LEADER">Lead</option>
                              </select>
                              <button
                                onClick={() => handleRejectOrRemoveMember(member.user_id, fullName)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-[10px] transition-colors cursor-pointer"
                                title="Remove from club"
                              >
                                <UserX className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${getRoleBadgeStyle(
                                member.role,
                              )}`}
                            >
                              {member.role}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
