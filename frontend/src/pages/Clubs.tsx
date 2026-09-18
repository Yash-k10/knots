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
  ShieldCheck,
  AlertCircle,
  Loader2,
  LogOut,
  Crown,
  GraduationCap,
  UserCheck,
  ChevronRight,
  Filter,
  CheckCircle2,
  MessageSquare,
  ExternalLink,
  BookOpen,
  FileText,
  Video,
  Share2,
  Copy,
  Check,
  Lock,
  Clock,
  UserX,
  Building2,
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

export interface ClubMemberResponse {
  id: number;
  club_id: number;
  user_id: number;
  role: "PENDING" | "MEMBER" | "OFFICER" | "LEADER";
  user?: ClubMemberUser | null;
}

export interface ClubResponse {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  creator_id: number;
}

export interface ClubDetailResponse {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  creator_id: number;
  members_count: number;
  user_role?: "PENDING" | "MEMBER" | "OFFICER" | "LEADER" | null;
  members: ClubMemberResponse[];
}

export interface ExtractedResource {
  type: "classroom" | "drive" | "github" | "meet" | "notion" | "generic";
  label: string;
  url: string;
}

export interface ParsedClubDetails {
  classroomCode?: string;
  classroomUrl?: string;
  meetUrl?: string;
  driveUrl?: string;
  cleanDescription: string;
  resources: ExtractedResource[];
}

export function parseClubDescription(text?: string | null): ParsedClubDetails {
  if (!text) {
    return { cleanDescription: "", resources: [] };
  }

  let classroomCode: string | undefined;
  let classroomUrl: string | undefined;
  let meetUrl: string | undefined;
  let driveUrl: string | undefined;

  // Extract explicit prefixes if present
  const lines = text.split("\n");
  const cleanLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();
    if (lower.startsWith("classroom code:") || lower.startsWith("code:")) {
      classroomCode = trimmed.split(":")[1]?.trim();
    } else if (
      lower.startsWith("classroom link:") ||
      lower.startsWith("classroom url:") ||
      lower.startsWith("google classroom:") ||
      lower.startsWith("classroom:")
    ) {
      classroomUrl = trimmed.substring(trimmed.indexOf(":") + 1).trim();
    } else if (
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
      // Handled in URL matcher
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
    if (lower.includes("classroom.google.com")) {
      classroomUrl = classroomUrl || cleanUrl;
      resources.push({ type: "classroom", label: "Google Classroom", url: cleanUrl });
    } else if (lower.includes("drive.google.com") || lower.includes("docs.google.com")) {
      driveUrl = driveUrl || cleanUrl;
      resources.push({ type: "drive", label: "Shared Drive / Notes", url: cleanUrl });
    } else if (lower.includes("github.com")) {
      resources.push({ type: "github", label: "GitHub Repository", url: cleanUrl });
    } else if (
      lower.includes("meet.google.com") ||
      lower.includes("zoom.us") ||
      lower.includes("teams.microsoft.com")
    ) {
      meetUrl = meetUrl || cleanUrl;
      resources.push({ type: "meet", label: "Live Meeting Room", url: cleanUrl });
    } else if (lower.includes("notion.so") || lower.includes("notion.site")) {
      resources.push({ type: "notion", label: "Notion Roadmap", url: cleanUrl });
    } else {
      resources.push({ type: "generic", label: "Resource Link", url: cleanUrl });
    }
  });

  const parsedText = cleanLines.join("\n").trim();
  const fallbackDesc =
    parsedText && !parsedText.startsWith("http")
      ? parsedText
      : "Official student chapter focusing on collaborative projects, mentorship sessions, and technical skill development.";

  return {
    classroomCode,
    classroomUrl,
    meetUrl,
    driveUrl,
    cleanDescription: fallbackDesc,
    resources,
  };
}

export default function Clubs() {
  // ── States ─────────────────────────────────────────────────────────────────
  const [clubs, setClubs] = useState<ClubResponse[]>([]);
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    email: string;
    role?: { name: string };
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"overview" | "requests" | "members">("overview");

  // Detailed view of selected club
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [clubDetail, setClubDetail] = useState<ClubDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Computer Science & Engineering");
  const [formDescription, setFormDescription] = useState("");
  const [formClassroomCode, setFormClassroomCode] = useState("");
  const [formClassroomUrl, setFormClassroomUrl] = useState("");
  const [formMeetUrl, setFormMeetUrl] = useState("");
  const [formDriveUrl, setFormDriveUrl] = useState("");

  const isControllerOrAdmin = useMemo(() => {
    const roleName = currentUser?.role?.name?.toLowerCase() || "";
    return (
      roleName.includes("controller") ||
      roleName.includes("admin") ||
      roleName.includes("hod") ||
      roleName.includes("faculty")
    );
  }, [currentUser]);

  const DEFAULT_DEMO_CLUBS: ClubResponse[] = [
    {
      id: 901,
      name: "ACM Student Chapter (CSE)",
      category: "Computer Science & Engineering",
      description: "Official Association for Computing Machinery chapter. Organizing coding hackathons, algorithms masterclasses, and peer tutoring sessions.\nClassroom Code: acm-cse-2026\nClassroom Link: https://classroom.google.com/c/acm-sbjit-cse\nMeet Link: https://meet.google.com/acm-cse-weekly\nDrive Link: https://drive.google.com/drive/folders/acm-resources\nGitHub Link: https://github.com/sbjit-cse/acm-chapter",
      creator_id: 1,
    },
    {
      id: 902,
      name: "Google Developer Student Club (GDSC)",
      category: "Computer Science & Engineering",
      description: "Community group for students interested in Google developer technologies, Android, Flutter, TensorFlow, and Google Cloud Platform.\nClassroom Code: gdsc-cloud-99\nClassroom Link: https://classroom.google.com/c/gdsc-sbjit\nMeet Link: https://meet.google.com/gdsc-live-workshops\nDrive Link: https://drive.google.com/drive/folders/gdsc-materials",
      creator_id: 1,
    },
    {
      id: 903,
      name: "AI & Machine Learning Research Guild",
      category: "Information Technology",
      description: "Interdisciplinary research chapter exploring Deep Learning, Computer Vision, LLMs, and Generative AI applications.\nClassroom Code: aiml-lab-2026\nClassroom Link: https://classroom.google.com/c/aiml-research\nDrive Link: https://drive.google.com/drive/folders/aiml-datasets-papers\nMeet Link: https://meet.google.com/aiml-paper-review",
      creator_id: 1,
    },
    {
      id: 904,
      name: "Cybersecurity & Ethical Hacking Society",
      category: "Computer Science & Engineering",
      description: "Hands-on CTF competitions, network security workshops, vulnerability assessments, and OWASP best practices.\nClassroom Code: ctf-sec-404\nClassroom Link: https://classroom.google.com/c/cyber-sec-society\nDrive Link: https://drive.google.com/drive/folders/ctf-writeups",
      creator_id: 1,
    },
    {
      id: 905,
      name: "Alumni Career Mentorship Chapter",
      category: "Alumni Mentorship Guild",
      description: "Direct connection with distinguished CSE/IT alumni working at Google, Microsoft, AWS, and Barclays for mock interviews, resume reviews, and referrals.\nClassroom Code: alumni-mentor-01\nClassroom Link: https://classroom.google.com/c/alumni-mentors\nMeet Link: https://meet.google.com/alumni-weekend-ama\nDrive Link: https://drive.google.com/drive/folders/mock-interview-guides",
      creator_id: 1,
    },
    {
      id: 906,
      name: "Robotics, Automation & IoT Club",
      category: "Electronics & Communication",
      description: "Designing autonomous rovers, sensor nodes, embedded firmware, and drone systems in collaboration with mechanical and electronics students.\nClassroom Code: iot-drone-77\nClassroom Link: https://classroom.google.com/c/robotics-iot\nMeet Link: https://meet.google.com/robotics-lab-stream",
      creator_id: 1,
    },
  ];

  // ── Initial Fetching ───────────────────────────────────────────────────────

  const fetchClubsAndUser = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch current user
      const userRes = await apiRequest<{
        id: number;
        email: string;
        role?: { name: string };
      }>("/users/me");
      setCurrentUser(userRes);

      // Fetch all clubs
      let clubsRes: ClubResponse[] = [];
      try {
        clubsRes = await apiRequest<ClubResponse[]>("/clubs?skip=0&limit=100");
      } catch {
        clubsRes = [];
      }

      // If backend only has 1 or fewer clubs, merge realistic demo clubs
      const mergedClubs = [...clubsRes];
      DEFAULT_DEMO_CLUBS.forEach((demoClub) => {
        if (!mergedClubs.some((c) => c.name.toLowerCase() === demoClub.name.toLowerCase())) {
          mergedClubs.push(demoClub);
        }
      });

      setClubs(mergedClubs);

      // If clubs exist, select the first one by default on desktop
      if (mergedClubs.length > 0 && selectedClubId === null) {
        setSelectedClubId(mergedClubs[0].id);
      }
    } catch (err: any) {
      setError(
        err.message || "Failed to retrieve clubs and profile information.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubsAndUser();
  }, []);

  const refreshClubs = async () => {
    try {
      const clubsRes = await apiRequest<ClubResponse[]>(
        "/clubs?skip=0&limit=100",
      );
      const mergedClubs = [...clubsRes];
      DEFAULT_DEMO_CLUBS.forEach((demoClub) => {
        if (!mergedClubs.some((c) => c.name.toLowerCase() === demoClub.name.toLowerCase())) {
          mergedClubs.push(demoClub);
        }
      });
      setClubs(mergedClubs);
    } catch (err) {
      console.error("Failed to refresh clubs list:", err);
    }
  };

  // ── Club Detail Panel Loading ──────────────────────────────────────────────

  const loadClubDetail = async (clubId: number) => {
    setDetailLoading(true);
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
                role: "OFFICER",
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
              {
                id: 104,
                club_id: found.id,
                user_id: 203,
                role: "MEMBER",
                user: {
                  id: 203,
                  email: "amit.patel@sbjit.edu.in",
                  first_name: "Amit",
                  last_name: "Patel",
                  department: "Computer Science & Engineering",
                  graduation_year: 2026,
                  user_role: "Student",
                },
              },
            ],
          };
          setClubDetail(detail);
          return;
        }
      }
      const res = await apiRequest<ClubDetailResponse>(`/clubs/${clubId}`);
      setClubDetail(res);
    } catch (err: any) {
      console.error("Failed to retrieve club details:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClubId !== null) {
      loadClubDetail(selectedClubId);
      setActiveTab("overview");
    } else {
      setClubDetail(null);
    }
  }, [selectedClubId]);

  // ── Form Modal Setup (Create / Edit) ──────────────────────────────────────

  const openCreateModal = () => {
    setIsEditing(false);
    setName("");
    setCategory("Computer Science & Engineering");
    setFormDescription("");
    setFormClassroomCode("");
    setFormClassroomUrl("");
    setFormMeetUrl("");
    setFormDriveUrl("");
    setShowFormModal(true);
  };

  const openEditModal = () => {
    if (!clubDetail) return;
    const parsed = parseClubDescription(clubDetail.description);
    setIsEditing(true);
    setName(clubDetail.name);
    setCategory(clubDetail.category || "Computer Science & Engineering");
    setFormDescription(parsed.cleanDescription);
    setFormClassroomCode(parsed.classroomCode || "");
    setFormClassroomUrl(parsed.classroomUrl || "");
    setFormMeetUrl(parsed.meetUrl || "");
    setFormDriveUrl(parsed.driveUrl || "");
    setShowFormModal(true);
  };

  // ── Submit / Delete Actions ────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Club / Chapter Name is required.");
      return;
    }

    setSubmittingForm(true);

    // Build structured description with classroom and links
    const descParts: string[] = [];
    if (formDescription.trim()) descParts.push(formDescription.trim());
    if (formClassroomCode.trim()) descParts.push(`Classroom Code: ${formClassroomCode.trim()}`);
    if (formClassroomUrl.trim()) descParts.push(`Classroom Link: ${formClassroomUrl.trim()}`);
    if (formMeetUrl.trim()) descParts.push(`Meet Link: ${formMeetUrl.trim()}`);
    if (formDriveUrl.trim()) descParts.push(`Drive Link: ${formDriveUrl.trim()}`);

    const payload = {
      name: name.trim(),
      category: category.trim() || null,
      description: descParts.join("\n\n") || null,
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
        `Are you sure you want to delete "${clubDetail.name}"? This action permanently removes the club, links, and student membership roster.`,
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

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // ── Categories & Filtering ─────────────────────────────────────────────────

  const categoriesList = [
    "Computer Science & Engineering",
    "Information Technology",
    "Mechanical Engineering",
    "Electrical Engineering",
    "Electronics & Communication",
    "Civil Engineering",
    "Technical & Coding",
    "Alumni Mentorship Guild",
    "Career & Placement Cell",
    "Cultural & Arts",
    "Sports & Athletics",
    "Other Department",
  ];

  const filteredClubs = useMemo(() => {
    return clubs.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description &&
          c.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === "ALL" ||
        c.category?.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [clubs, searchQuery, selectedCategory]);

  // Split members by status
  const pendingRequests = useMemo(() => {
    if (!clubDetail?.members) return [];
    return clubDetail.members.filter((m) => m.role === "PENDING");
  }, [clubDetail]);

  const activeMembers = useMemo(() => {
    if (!clubDetail?.members) return [];
    return clubDetail.members.filter((m) => m.role !== "PENDING");
  }, [clubDetail]);

  const clubLeaders = useMemo(() => {
    return activeMembers.filter((m) => m.role === "LEADER");
  }, [activeMembers]);

  const clubOfficers = useMemo(() => {
    return activeMembers.filter((m) => m.role === "OFFICER");
  }, [activeMembers]);

  const isLeaderOrController = useMemo(() => {
    if (!clubDetail) return false;
    if (isControllerOrAdmin) return true;
    if (clubDetail.creator_id === currentUser?.id) return true;
    return clubDetail.user_role === "LEADER" || clubDetail.user_role === "OFFICER";
  }, [clubDetail, currentUser, isControllerOrAdmin]);

  const isConfirmedMember = useMemo(() => {
    if (!clubDetail) return false;
    if (isLeaderOrController) return true;
    return (
      clubDetail.user_role === "MEMBER" ||
      clubDetail.user_role === "OFFICER" ||
      clubDetail.user_role === "LEADER"
    );
  }, [clubDetail, isLeaderOrController]);

  const filteredActiveMembers = useMemo(() => {
    return activeMembers.filter((m) => {
      const u = m.user;
      const fullName = `${u?.first_name || ""} ${u?.last_name || ""}`.trim();
      const searchTarget = `${fullName} ${u?.email || ""} ${u?.department || ""} ${m.role}`.toLowerCase();
      const matchesSearch = searchTarget.includes(memberSearchQuery.toLowerCase());
      const matchesRole = memberRoleFilter === "ALL" || m.role === memberRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [activeMembers, memberSearchQuery, memberRoleFilter]);

  const parsedActiveClub = useMemo(() => {
    return parseClubDescription(clubDetail?.description);
  }, [clubDetail]);

  // Category styling helper
  const getCategoryBadgeStyle = (catName?: string | null) => {
    const name = catName?.toUpperCase() || "OTHER";
    if (name.includes("COMPUTER") || name.includes("INFORMATION") || name.includes("TECHNICAL")) {
      return "bg-[#FAF9FD] text-[#4B63D2] border-[#D5CBEE]";
    }
    if (name.includes("ALUMNI")) {
      return "bg-amber-50 text-amber-800 border-amber-200";
    }
    if (name.includes("CAREER") || name.includes("PLACEMENT")) {
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    }
    if (name.includes("MECHANICAL") || name.includes("ELECTRICAL") || name.includes("CIVIL")) {
      return "bg-sky-50 text-sky-800 border-sky-200";
    }
    if (name.includes("SPORTS")) {
      return "bg-orange-50 text-orange-800 border-orange-200";
    }
    return "bg-[#FAF9FD] text-[#5851A4] border-[#EAE4F7]";
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "LEADER":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "OFFICER":
        return "bg-[#4B63D2]/10 text-[#4B63D2] border-[#4B63D2]/20";
      case "PENDING":
        return "bg-amber-50 text-amber-700 border-amber-300";
      default:
        return "bg-[#FAF9FD] text-[#5851A4] border-[#EAE4F7]";
    }
  };

  // ── Render Loading ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-[#EAE4F7] border-t-[#4B63D2] animate-spin" />
          <Compass className="w-6 h-6 text-[#4B63D2] absolute inset-0 m-auto" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-[#1E2746]">Loading Department Clubs & Chapters...</p>
          <p className="text-xs text-[#5851A4] mt-0.5">Syncing classroom codes, resources, and membership requests</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── 1. Hero Banner with Department & Leadership Overview ────────────── */}
      <div className="relative overflow-hidden bg-white border border-[#EAE4F7] rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#4B63D2]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-[#FFD21A]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#4B63D2]/10 border border-[#4B63D2]/20 text-xs font-black text-[#4B63D2]">
              <Crown className="w-4 h-4 text-[#4B63D2]" />
              <span>Controller-Verified Department Clubs &amp; Alumni Chapters</span>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#1E2746] tracking-tight leading-tight">
              Department Clubs &amp; Classrooms
            </h1>
            <p className="text-xs md:text-sm leading-relaxed font-medium text-[#5851A4]">
              Official clubs organized by department and category. Join verified chapters to access Google Classroom codes, live meeting sessions, shared notes, and connect with mentors.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {isControllerOrAdmin && (
              <button
                onClick={openCreateModal}
                className="bg-[#4B63D2] hover:bg-[#3E53BE] text-white font-bold px-5 py-3 rounded-2xl text-xs md:text-sm shadow-md shadow-[#4B63D2]/20 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 cursor-pointer border border-[#4B63D2]/30 active:scale-95"
              >
                <Plus className="w-4 h-4 text-white stroke-[2.5]" />
                <span>Create Department Club</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick KPI stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mt-6 pt-6 border-t border-[#EAE4F7] relative z-10">
          <div className="bg-[#FAF9FD] border border-[#EAE4F7] hover:border-[#D5CBEE] rounded-2xl p-4 transition-all shadow-xs">
            <div className="text-[11px] font-bold text-[#5851A4] uppercase tracking-wider">
              Active Clubs
            </div>
            <div className="text-2xl font-black text-[#1E2746] mt-1.5">{clubs.length}</div>
          </div>
          <div className="bg-[#FAF9FD] border border-[#EAE4F7] hover:border-[#D5CBEE] rounded-2xl p-4 transition-all shadow-xs">
            <div className="text-[11px] font-bold text-[#5851A4] uppercase tracking-wider">
              Enrolled Members
            </div>
            <div className="text-2xl font-black text-[#4B63D2] mt-1.5">
              {clubDetail ? clubDetail.members_count : "—"}
            </div>
          </div>
          <div className="bg-[#FAF9FD] border border-[#EAE4F7] hover:border-[#D5CBEE] rounded-2xl p-4 transition-all shadow-xs">
            <div className="text-[11px] font-bold text-[#5851A4] uppercase tracking-wider">
              Pending Requests
            </div>
            <div className="text-2xl font-black text-amber-600 mt-1.5">
              {pendingRequests.length}
            </div>
          </div>
          <div className="bg-[#FAF9FD] border border-[#EAE4F7] hover:border-[#D5CBEE] rounded-2xl p-4 transition-all shadow-xs">
            <div className="text-[11px] font-bold text-[#5851A4] uppercase tracking-wider">
              Your Status
            </div>
            <div className="text-xs sm:text-sm font-bold text-[#4B63D2] mt-2 truncate bg-[#4B63D2]/10 px-2.5 py-1 rounded-lg inline-block border border-[#4B63D2]/20">
              {isControllerOrAdmin ? "HOD / Controller" : clubDetail?.user_role ? `${clubDetail.user_role}` : "Not Joined"}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Filter Bar & Category Chips ─────────────────────────────────── */}
      <div className="bg-white border border-[#EAE4F7] rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5851A4]" />
            <input
              type="text"
              placeholder="Search clubs by name, department, classroom code, or mentor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] placeholder-[#9188BE] focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5851A4] hover:text-[#1E2746] text-[10px] font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Results count */}
          <div className="text-xs text-[#5851A4] font-medium px-2 flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-[#4B63D2]" />
            <span>Showing <strong>{filteredClubs.length}</strong> department clubs</span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === "ALL"
                ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/20"
                : "bg-[#FAF9FD] hover:bg-white text-[#5851A4] border border-[#EAE4F7]"
            }`}
          >
            All Departments
          </button>
          {categoriesList.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/20"
                    : "bg-[#FAF9FD] hover:bg-white text-[#5851A4] border border-[#EAE4F7]"
                }`}
              >
                <Building2 className="w-3 h-3 text-[#5851A4]" />
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Main Content: Split Grid Layout ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Clubs List Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5 max-h-[820px] overflow-y-auto pr-1">
          {error ? (
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
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-10 text-center text-[#5851A4] shadow-sm space-y-3">
              <div className="w-12 h-12 bg-[#FAF9FD] text-[#4B63D2] rounded-2xl flex items-center justify-center mx-auto border border-[#EAE4F7]">
                <Compass className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm text-[#1E2746]">No matching clubs found</p>
              <p className="text-xs text-[#5851A4]">
                {isControllerOrAdmin
                  ? "Create a new department club with Classroom code and meeting links."
                  : "No clubs created for this category yet. Check back soon!"}
              </p>
              {isControllerOrAdmin && (
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
                        {club.category || "General Department"}
                      </span>

                      {parsed.classroomCode && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <GraduationCap className="w-3 h-3 text-emerald-600" />
                          Code Available
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-black text-[#1E2746] group-hover:text-[#4B63D2] transition-colors">
                      {club.name}
                    </h3>
                    <p className="text-[#5851A4] text-xs line-clamp-2 mt-1.5 leading-relaxed font-normal">
                      {parsed.cleanDescription || "No detailed description provided yet."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3.5 mt-3.5 border-t border-[#EAE4F7] text-xs font-bold text-[#4B63D2]">
                    <span className="text-[11px] text-[#9188BE] font-medium flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Classroom &amp; Members
                    </span>
                    <div className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span className="text-[11px]">View Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Club Details, Join Flow, & Controller Approvals (7 cols) */}
        <div className="lg:col-span-7">
          {selectedClubId === null ? (
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-12 text-center text-[#5851A4] shadow-sm space-y-3">
              <Compass className="w-12 h-12 text-[#C8B6E2] mx-auto" />
              <h3 className="text-base font-bold text-[#1E2746]">Select a Club</h3>
              <p className="text-xs text-[#5851A4] max-w-sm mx-auto">
                Choose any department club from the list to view its Google Classroom codes, join requests, meeting links, and member roster.
              </p>
            </div>
          ) : detailLoading || !clubDetail ? (
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-16 flex flex-col items-center justify-center space-y-3 text-[#5851A4] shadow-sm">
              <Loader2 className="w-8 h-8 animate-spin text-[#4B63D2]" />
              <p className="text-xs font-bold text-[#1E2746]">Loading club details &amp; classroom access...</p>
            </div>
          ) : (
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm space-y-6">
              {/* Header Details */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${getCategoryBadgeStyle(
                        clubDetail.category,
                      )}`}
                    >
                      {clubDetail.category || "General Department"}
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
                        Request Pending Approval
                      </span>
                    )}

                    {(clubDetail.user_role === "LEADER" || isControllerOrAdmin) && (
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#4B63D2]/10 text-[#4B63D2] border border-[#4B63D2]/30 font-bold uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-[#4B63D2]" />
                        {isControllerOrAdmin ? "Department Overseer / HOD" : "Club Controller / Head"}
                      </span>
                    )}
                  </div>

                  {/* Actions for current user (Join Request / Leave / Cancel / Controller Controls) */}
                  <div className="flex items-center gap-2">
                    {!clubDetail.user_role && !isControllerOrAdmin && (
                      <button
                        onClick={handleJoinClub}
                        className="bg-[#4B63D2] hover:bg-[#3E53BE] text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Request to Join Club
                      </button>
                    )}

                    {clubDetail.user_role === "PENDING" && (
                      <button
                        onClick={handleLeaveOrCancelRequest}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Cancel Pending Request"
                      >
                        <UserX className="w-3.5 h-3.5 text-amber-700" />
                        Cancel Request
                      </button>
                    )}

                    {clubDetail.user_role === "MEMBER" && (
                      <button
                        onClick={handleLeaveOrCancelRequest}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Leave Club
                      </button>
                    )}

                    {/* Leader / Controller Actions */}
                    {isLeaderOrController && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={openEditModal}
                          className="bg-[#FAF9FD] hover:bg-[#F0EDF9] border border-[#EAE4F7] text-[#5851A4] p-2 rounded-xl transition-colors cursor-pointer"
                          title="Edit Club Resources & Settings"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={handleDeleteClub}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 p-2 rounded-xl transition-colors cursor-pointer"
                          title="Delete Club"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-xl md:text-2xl font-black text-[#1E2746]">{clubDetail.name}</h2>
                  <p className="text-[#5851A4] text-xs md:text-sm mt-2 leading-relaxed">
                    {parsedActiveClub.cleanDescription || "No detailed mission description available for this club."}
                  </p>
                </div>
              </div>

              {/* ── Sub-navigation Tabs (Overview / Pending Requests / Members) ── */}
              <div className="flex items-center gap-2 border-b border-[#EAE4F7] pb-2">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "overview"
                      ? "bg-[#4B63D2] text-white shadow-xs"
                      : "text-[#5851A4] hover:bg-[#FAF9FD]"
                  }`}
                >
                  Classroom &amp; Resources
                </button>

                {isLeaderOrController && (
                  <button
                    onClick={() => setActiveTab("requests")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "requests"
                        ? "bg-[#4B63D2] text-white shadow-xs"
                        : "text-[#5851A4] hover:bg-[#FAF9FD]"
                    }`}
                  >
                    <span>Pending Requests</span>
                    {pendingRequests.length > 0 && (
                      <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                        {pendingRequests.length}
                      </span>
                    )}
                  </button>
                )}

                <button
                  onClick={() => setActiveTab("members")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "members"
                      ? "bg-[#4B63D2] text-white shadow-xs"
                      : "text-[#5851A4] hover:bg-[#FAF9FD]"
                  }`}
                >
                  <span>Members</span>
                  <span className="bg-[#FAF9FD] text-[#5851A4] border border-[#EAE4F7] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {activeMembers.length}
                  </span>
                </button>
              </div>

              {/* ── TAB 1: OVERVIEW & CLASSROOM RESOURCE VAULT ── */}
              {activeTab === "overview" && (
                <div className="space-y-5">
                  {/* Classroom Code & Direct Invite Card */}
                  {isConfirmedMember ? (
                    <div className="p-5 bg-gradient-to-br from-indigo-50/70 via-[#FAF9FD] to-indigo-50/40 border border-[#D5CBEE] rounded-2xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D5CBEE]/60 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#4B63D2] text-white flex items-center justify-center">
                            <GraduationCap className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-[#1E2746] uppercase tracking-wider">
                              Google Classroom Access
                            </h4>
                            <p className="text-[11px] text-[#5851A4]">
                              Unlocked for approved department members
                            </p>
                          </div>
                        </div>

                        {parsedActiveClub.classroomCode && (
                          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#D5CBEE] shadow-xs">
                            <span className="text-[10px] font-bold text-[#5851A4] uppercase">Code:</span>
                            <code className="text-xs font-black text-[#4B63D2] tracking-wider">
                              {parsedActiveClub.classroomCode}
                            </code>
                            <button
                              onClick={() => handleCopyCode(parsedActiveClub.classroomCode!)}
                              className="text-[#5851A4] hover:text-[#4B63D2] p-1 rounded-md transition-colors cursor-pointer"
                              title="Copy Classroom Code"
                            >
                              {copiedCode ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Resource Links Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {parsedActiveClub.classroomUrl && (
                          <a
                            href={parsedActiveClub.classroomUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3.5 bg-white hover:bg-[#4B63D2] group border border-[#EAE4F7] hover:border-[#4B63D2] rounded-xl transition-all shadow-xs cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 group-hover:bg-white/20 text-[#4B63D2] group-hover:text-white flex items-center justify-center shrink-0">
                                <GraduationCap className="w-4 h-4" />
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-bold text-[#1E2746] group-hover:text-white truncate">
                                  Google Classroom Link
                                </p>
                                <p className="text-[10px] text-[#9188BE] group-hover:text-indigo-100 truncate">
                                  Open class dashboard
                                </p>
                              </div>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-[#9188BE] group-hover:text-white shrink-0 ml-2" />
                          </a>
                        )}

                        {parsedActiveClub.meetUrl && (
                          <a
                            href={parsedActiveClub.meetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3.5 bg-white hover:bg-[#4B63D2] group border border-[#EAE4F7] hover:border-[#4B63D2] rounded-xl transition-all shadow-xs cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 group-hover:bg-white/20 text-emerald-600 group-hover:text-white flex items-center justify-center shrink-0">
                                <Video className="w-4 h-4" />
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-bold text-[#1E2746] group-hover:text-white truncate">
                                  Live Meet / Zoom Room
                                </p>
                                <p className="text-[10px] text-[#9188BE] group-hover:text-indigo-100 truncate">
                                  Join scheduled AMA / sessions
                                </p>
                              </div>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-[#9188BE] group-hover:text-white shrink-0 ml-2" />
                          </a>
                        )}

                        {parsedActiveClub.driveUrl && (
                          <a
                            href={parsedActiveClub.driveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3.5 bg-white hover:bg-[#4B63D2] group border border-[#EAE4F7] hover:border-[#4B63D2] rounded-xl transition-all shadow-xs cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-sky-50 group-hover:bg-white/20 text-sky-600 group-hover:text-white flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-bold text-[#1E2746] group-hover:text-white truncate">
                                  Shared Drive &amp; Notes
                                </p>
                                <p className="text-[10px] text-[#9188BE] group-hover:text-indigo-100 truncate">
                                  Access lecture notes &amp; code
                                </p>
                              </div>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-[#9188BE] group-hover:text-white shrink-0 ml-2" />
                          </a>
                        )}

                        {parsedActiveClub.resources
                          .filter(
                            (r) =>
                              r.type !== "classroom" &&
                              r.type !== "meet" &&
                              r.type !== "drive",
                          )
                          .map((res, idx) => (
                            <a
                              key={idx}
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-3.5 bg-white hover:bg-[#4B63D2] group border border-[#EAE4F7] hover:border-[#4B63D2] rounded-xl transition-all shadow-xs cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-[#FAF9FD] group-hover:bg-white/20 text-[#4B63D2] group-hover:text-white flex items-center justify-center shrink-0">
                                  {res.type === "github" ? (
                                    <Share2 className="w-4 h-4" />
                                  ) : (
                                    <BookOpen className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="truncate">
                                  <p className="text-xs font-bold text-[#1E2746] group-hover:text-white truncate">
                                    {res.label}
                                  </p>
                                  <p className="text-[10px] text-[#9188BE] group-hover:text-indigo-100 truncate">
                                    {res.url}
                                  </p>
                                </div>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-[#9188BE] group-hover:text-white shrink-0 ml-2" />
                            </a>
                          ))}
                      </div>
                    </div>
                  ) : (
                    /* Locked state for non-members */
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto text-[#5851A4] border border-slate-200 shadow-xs">
                        <Lock className="w-6 h-6 text-[#4B63D2]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-[#1E2746]">
                          Classroom Code &amp; Resource Vault Locked
                        </h4>
                        <p className="text-xs text-[#5851A4] max-w-md mx-auto mt-1">
                          {clubDetail.user_role === "PENDING"
                            ? "Your join request is awaiting Controller approval. Once approved, Google Classroom code and links will be unlocked automatically."
                            : "Submit a join request to the Department Controller to unlock Google Classroom code, lecture notes, and meeting links."}
                        </p>
                      </div>

                      {!clubDetail.user_role && (
                        <button
                          onClick={handleJoinClub}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4B63D2] hover:bg-[#3E53BE] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Request Access Now</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* 👑 Club Leadership & Mentors */}
                  <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/40 rounded-3xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center">
                          <Crown className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="text-xs md:text-sm font-black text-amber-950">
                            Department Leads &amp; Chapter Heads
                          </h4>
                          <p className="text-[11px] text-amber-800/80">
                            Authorized leaders managing classroom materials and memberships
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-amber-900 bg-white/80 px-2.5 py-0.5 rounded-full border border-amber-300">
                        {clubLeaders.length + clubOfficers.length} Heads
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[...clubLeaders, ...clubOfficers].map((head) => {
                        const u = head.user;
                        const fullName =
                          `${u?.first_name || ""} ${u?.last_name || ""}`.trim() ||
                          (u?.email ? u.email.split("@")[0] : `User #${head.user_id}`);
                        const avatar = u?.profile_picture ? getMediaUrl(u.profile_picture) : null;

                        return (
                          <div
                            key={head.id}
                            className="bg-white/95 backdrop-blur-sm border border-amber-200/80 rounded-2xl p-3.5 shadow-sm flex items-start gap-3 relative group"
                          >
                            <div className="relative shrink-0">
                              {avatar ? (
                                <img
                                  src={avatar}
                                  alt={fullName}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-amber-400/50"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4B63D2] to-[#5851A4] text-white font-black flex items-center justify-center text-xs shadow-sm">
                                  {fullName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div
                                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] bg-amber-500 text-white"
                                title={head.role}
                              >
                                <Crown className="w-2.5 h-2.5" />
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <Link
                                to={`/profile/${head.user_id}`}
                                className="text-xs font-black text-[#1E2746] hover:text-[#4B63D2] truncate block transition-colors"
                              >
                                {fullName}
                              </Link>
                              <div className="text-[10px] text-[#5851A4] mt-0.5 truncate">
                                {u?.department || u?.email}
                              </div>
                            </div>

                            <Link
                              to="/messaging"
                              state={{ recipientId: head.user_id, recipientName: fullName }}
                              className="text-[#5851A4] hover:text-[#4B63D2] hover:bg-[#FAF9FD] p-1.5 rounded-xl transition-colors shrink-0"
                              title={`Message ${fullName}`}
                            >
                              <MessageSquare className="w-4 h-4 text-[#4B63D2]" />
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 2: PENDING JOIN REQUESTS (CONTROLLER APPROVAL HUB) ── */}
              {activeTab === "requests" && isLeaderOrController && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-[#1E2746] flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        Pending Student Join Requests
                      </h4>
                      <p className="text-xs text-[#5851A4]">
                        Review and approve students who want to join this club and access the Google Classroom
                      </p>
                    </div>
                    <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                      {pendingRequests.length} Pending
                    </span>
                  </div>

                  {pendingRequests.length === 0 ? (
                    <div className="p-8 text-center bg-[#FAF9FD] rounded-2xl border border-[#EAE4F7] text-[#5851A4] text-xs space-y-1">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                      <p className="font-bold text-[#1E2746]">No Pending Requests</p>
                      <p>All student membership requests have been processed.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingRequests.map((req) => {
                        const u = req.user;
                        const fullName =
                          `${u?.first_name || ""} ${u?.last_name || ""}`.trim() ||
                          (u?.email ? u.email.split("@")[0] : `Student #${req.user_id}`);
                        const avatar = u?.profile_picture ? getMediaUrl(u.profile_picture) : null;

                        return (
                          <div
                            key={req.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-amber-200 hover:border-amber-300 rounded-2xl shadow-xs transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {avatar ? (
                                <img
                                  src={avatar}
                                  alt={fullName}
                                  className="w-10 h-10 rounded-full object-cover border border-[#EAE4F7] shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4B63D2] to-[#5851A4] text-white font-bold flex items-center justify-center text-xs shrink-0">
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
                                  {u?.graduation_year ? ` • Class '${String(u.graduation_year).slice(-2)}` : ""}
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
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB 3: CONFIRMED MEMBERS ROSTER ── */}
              {activeTab === "members" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-black text-[#1E2746] flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#4B63D2]" />
                        Active Enrolled Members
                      </h4>
                      <p className="text-xs text-[#5851A4]">
                        Total <strong>{activeMembers.length}</strong> verified department members
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#5851A4]" />
                        <input
                          type="text"
                          placeholder="Filter members..."
                          value={memberSearchQuery}
                          onChange={(e) => setMemberSearchQuery(e.target.value)}
                          className="pl-7 pr-3 py-1.5 bg-[#FAF9FD] border border-[#D5CBEE] rounded-xl text-[11px] text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] w-36 sm:w-44"
                        />
                      </div>

                      <select
                        value={memberRoleFilter}
                        onChange={(e) => setMemberRoleFilter(e.target.value)}
                        className="bg-[#FAF9FD] border border-[#D5CBEE] text-[#1E2746] text-[11px] font-bold rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
                      >
                        <option value="ALL">All Roles</option>
                        <option value="LEADER">Leaders</option>
                        <option value="OFFICER">Officers</option>
                        <option value="MEMBER">Members</option>
                      </select>
                    </div>
                  </div>

                  {/* Member Roster List */}
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {filteredActiveMembers.length === 0 ? (
                      <div className="p-8 text-center bg-[#FAF9FD] rounded-2xl border border-[#EAE4F7] text-[#5851A4] text-xs">
                        No active members match your search criteria.
                      </div>
                    ) : (
                      filteredActiveMembers.map((member) => {
                        const u = member.user;
                        const fullName =
                          `${u?.first_name || ""} ${u?.last_name || ""}`.trim() ||
                          (u?.email ? u.email.split("@")[0] : `User #${member.user_id}`);
                        const avatar = u?.profile_picture ? getMediaUrl(u.profile_picture) : null;
                        const isCurrentUser = currentUser?.id === member.user_id;

                        return (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-3.5 bg-white hover:bg-[#FAF9FD] border border-[#EAE4F7] hover:border-[#D5CBEE] rounded-2xl transition-all shadow-xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {avatar ? (
                                <img
                                  src={avatar}
                                  alt={fullName}
                                  className="w-10 h-10 rounded-full object-cover border border-[#EAE4F7] shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4B63D2] to-[#5851A4] text-white font-bold flex items-center justify-center text-xs shrink-0">
                                  {fullName.charAt(0).toUpperCase()}
                                </div>
                              )}

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <Link
                                    to={`/profile/${member.user_id}`}
                                    className="text-xs font-bold text-[#1E2746] hover:text-[#4B63D2] truncate transition-colors"
                                  >
                                    {fullName}
                                  </Link>
                                  {isCurrentUser && (
                                    <span className="text-[9px] font-bold bg-[#4B63D2]/10 text-[#4B63D2] px-1.5 py-0.2 rounded-md">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-[#5851A4] truncate">
                                  {u?.department ? `${u.department}` : u?.email}
                                  {u?.graduation_year ? ` • Class of '${String(u.graduation_year).slice(-2)}` : ""}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {!isCurrentUser && (
                                <Link
                                  to="/messaging"
                                  state={{ recipientId: member.user_id, recipientName: fullName }}
                                  className="px-2.5 py-1.5 bg-[#FAF9FD] hover:bg-[#4B63D2] text-[#4B63D2] hover:text-white border border-[#D5CBEE] hover:border-[#4B63D2] rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                  title={`Chat with ${fullName}`}
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  <span className="hidden sm:inline">Connect</span>
                                </Link>
                              )}

                              {isLeaderOrController && !isCurrentUser ? (
                                <div className="flex items-center gap-1.5">
                                  <select
                                    value={member.role}
                                    onChange={(e) =>
                                      handleUpdateMemberRole(
                                        member.user_id,
                                        e.target.value as any,
                                      )
                                    }
                                    className="bg-[#FAF9FD] border border-[#D5CBEE] rounded-xl px-2 py-1 text-[10px] font-bold text-[#1E2746] focus:outline-none focus:border-[#4B63D2] cursor-pointer shadow-xs"
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
                                  className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${getRoleBadgeStyle(
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
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── 4. Create / Edit Club Modal (Controller Access) ───────────────── */}
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
                  {isEditing ? "Modify Club & Classroom Setup" : "Register Department Club"}
                </h3>
                <p className="text-xs mt-0.5 font-medium" style={{ color: "#E2E8F0" }}>
                  Set up department category, Google Classroom code, and live meeting links
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

              {/* Department Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1E2746]">
                  Department Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-4 py-2.5 text-xs text-[#1E2746] outline-none cursor-pointer font-semibold"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Google Classroom Code & Invite Link Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1E2746] flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-[#4B63D2]" />
                    <span>Classroom Code</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. c7x-9kd"
                    value={formClassroomCode}
                    onChange={(e) => setFormClassroomCode(e.target.value)}
                    className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-3.5 py-2 text-xs text-[#1E2746] placeholder-[#9188BE] outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1E2746] flex items-center gap-1">
                    <ExternalLink className="w-3.5 h-3.5 text-[#4B63D2]" />
                    <span>Classroom Link</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://classroom.google.com/c/..."
                    value={formClassroomUrl}
                    onChange={(e) => setFormClassroomUrl(e.target.value)}
                    className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl px-3.5 py-2 text-xs text-[#1E2746] placeholder-[#9188BE] outline-none font-medium"
                  />
                </div>
              </div>

              {/* Meet URL & Drive URL Grid */}
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
                    placeholder="https://drive.google.com/drive/..."
                    value={formDriveUrl}
                    onChange={(e) => setFormDriveUrl(e.target.value)}
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
                  {submittingForm && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {isEditing ? "Save Club Details" : "Register Club"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
