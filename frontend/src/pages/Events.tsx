import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronDown,
  ChevronUp,
  Plus,
  Check,
  History,
  AlertCircle,
  X,
  CheckCircle2,
  Crown,
  UserCheck,
  Loader2,
} from "lucide-react";

import { apiRequest } from "../services/api";

interface EventTimelineItem {
  time: string;
  title: string;
  description: string;
}

export interface EventLeadUser {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  department?: string | null;
  graduation_year?: number | null;
  profile_picture?: string | null;
  role_name?: string | null;
}

export interface RSVPRequestItem {
  id: number;
  event_id: number;
  user_id: number;
  status: "PENDING" | "GOING" | "MAYBE" | "NOT_GOING";
  note?: string | null;
  created_at: string;
  user?: {
    id: number;
    email: string;
    first_name?: string | null;
    last_name?: string | null;
    department?: string | null;
    graduation_year?: number | null;
    profile_picture?: string | null;
  } | null;
}

export interface CampusEvent {
  id: number;
  title: string;
  tagline: string;
  category: "Cultural" | "Technical" | "Sports" | "Academic";
  date: string;
  timeRange: string;
  venue: string;
  bannerGradient: string;
  accentColor: string;
  rsvpCount: number;
  isRsvp: boolean;
  userRsvpStatus?: "PENDING" | "GOING" | "MAYBE" | "NOT_GOING" | null;
  pendingRequestsCount?: number;
  timeline: EventTimelineItem[];
  highlights: string[];
  organizer: string;
  organizer_id?: number;
  head_id?: number | null;
  co_head_id?: number | null;
  head?: EventLeadUser | null;
  co_head?: EventLeadUser | null;
  isUpcoming: boolean;
  google_form_url?: string;
}

export default function Events() {
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    email: string;
    role_id?: number;
    role?: { name: string };
  } | null>(null);

  // Department Students List (for Controller to pick Event Head & Co-Head)
  const [departmentStudents, setDepartmentStudents] = useState<any[]>([]);

  // Event Creation Modal state (Controller & Admin restricted)
  const [showCreateEventModal, setShowCreateEventModal] = useState<boolean>(false);
  const [newEventTitle, setNewEventTitle] = useState<string>("");
  const [newEventTagline, setNewEventTagline] = useState<string>("");
  const [newEventCategory, setNewEventCategory] = useState<"Cultural" | "Technical" | "Sports" | "Academic">("Technical");
  const [newEventDate, setNewEventDate] = useState<string>("");
  const [newEventTimeRange, setNewEventTimeRange] = useState<string>("");
  const [newEventVenue, setNewEventVenue] = useState<string>("");
  const [newEventGoogleFormUrl, setNewEventGoogleFormUrl] = useState<string>("");
  const [newEventHighlights, setNewEventHighlights] = useState<string>("");
  const [newEventHeadId, setNewEventHeadId] = useState<number | null>(null);
  const [newEventCoHeadId, setNewEventCoHeadId] = useState<number | null>(null);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState<boolean>(false);
  const [createEventError, setCreateEventError] = useState<string | null>(null);
  const [createEventSuccess, setCreateEventSuccess] = useState<string | null>(null);

  // Leads Appointment Modal (After event created)
  const [leadsModalEvent, setLeadsModalEvent] = useState<CampusEvent | null>(null);
  const [appointedHeadId, setAppointedHeadId] = useState<number | null>(null);
  const [appointedCoHeadId, setAppointedCoHeadId] = useState<number | null>(null);
  const [isSubmittingLeads, setIsSubmittingLeads] = useState<boolean>(false);
  const [leadsSuccess, setLeadsSuccess] = useState<string | null>(null);
  const [leadsError, setLeadsError] = useState<string | null>(null);

  // Manage Requests Modal (For Event Head & Co-Head & Controller)
  const [requestsModalEvent, setRequestsModalEvent] = useState<CampusEvent | null>(null);
  const [pendingRequests, setPendingRequests] = useState<RSVPRequestItem[]>([]);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(false);
  const [requestsActionMsg, setRequestsActionMsg] = useState<string | null>(null);

  const [showPreviousEvents, setShowPreviousEvents] = useState<boolean>(false);
  const [expandedEventId, setExpandedEventId] = useState<number | null>(1);

  // Default Flagship Events fallback
  const defaultEvents: CampusEvent[] = [
    {
      id: 1,
      title: "Garbotsav 2026",
      tagline: "SBJIT Grand Navratri, Dandiya Raas & Traditional Cultural Gala",
      category: "Cultural",
      date: "October 10, 2026",
      timeRange: "6:00 PM – 10:30 PM",
      venue: "SBJIT Main Amphitheatre & Sports Ground",
      bannerGradient: "from-amber-500 via-rose-500 to-purple-600",
      accentColor: "#FFD21A",
      rsvpCount: 420,
      isRsvp: false,
      userRsvpStatus: null,
      pendingRequestsCount: 0,
      organizer: "Sanskriti Cultural Council & Student Activity Centre",
      isUpcoming: true,
      highlights: [
        "Live DJ & Dhol Tasha Troupe",
        "Inter-Department Traditional Garba Competition",
        "Best Traditional Attire & Best Performer Awards",
        "Authentic Festive Food Stalls & Refreshments",
      ],
      timeline: [
        {
          time: "6:00 PM",
          title: "Deep Prajwalan & Auspicious Aarti",
          description:
            "Inauguration by College Management, Faculty heads, and Student Council Leads.",
        },
        {
          time: "6:30 PM",
          title: "Inter-Department Dance Showcase",
          description:
            "Curated classical and folk Garba performances by CSE, AIML, IT, and Mechanical teams.",
        },
        {
          time: "7:30 PM",
          title: "Grand Open Dandiya & Raas",
          description:
            "Open ground celebration for all students, alumni, faculty, and family guests.",
        },
        {
          time: "9:45 PM",
          title: "Prize Distribution & Gala Finale",
          description:
            "Felicitation of Best Dressed, King & Queen of Garbotsav, and closing ceremony.",
        },
      ],
    },
    {
      id: 2,
      title: "Ganesh Chaturthi Mahotsav",
      tagline: "SBJIT Campus Eco-Friendly Sthapana & Cultural Utsav",
      category: "Cultural",
      date: "September 18, 2026",
      timeRange: "9:00 AM – 7:30 PM",
      venue: "Central Auditorium & Campus Temple Plaza",
      bannerGradient: "from-orange-500 via-amber-500 to-rose-600",
      accentColor: "#FF9F1C",
      rsvpCount: 380,
      isRsvp: false,
      userRsvpStatus: null,
      pendingRequestsCount: 0,
      organizer: "SBJIT Cultural Club & Sanskriti Council",
      isUpcoming: true,
      highlights: [
        "Eco-Friendly Clay Idol Sthapana",
        "Maha Prasad Vitran for entire college",
        "Inter-Branch Modak Making Contest",
        "Spiritual Music Performances by Dhwani Club",
      ],
      timeline: [
        {
          time: "9:00 AM",
          title: "Shree Ganesh Sthapana & Vedic Puja",
          description:
            "Traditional morning sthapana rituals led by Principal, HODs, and student representatives.",
        },
        {
          time: "11:30 AM",
          title: "Maha Prasad Vitran & Bhajans",
          description:
            "Distribution of festive prasad accompanied by devotional music recitals.",
        },
        {
          time: "3:30 PM",
          title: "Modak Making & Art Competition",
          description:
            "Creativity competition featuring eco-friendly idol crafting and dessert presentation.",
        },
        {
          time: "6:30 PM",
          title: "Maha Aarti & Cultural Evening",
          description:
            "Grand evening lamp aarti followed by classical music & instrumental performances.",
        },
      ],
    },
    {
      id: 3,
      title: "Shikhar 2026 — Annual TechFest",
      tagline: "24-Hour National Hackathon, Robotics Battle & Code Arena",
      category: "Technical",
      date: "November 14 - 15, 2026",
      timeRange: "10:00 AM onwards (24h)",
      venue: "SBJIT Innovation & Incubation Labs",
      bannerGradient: "from-blue-600 via-indigo-600 to-[#5851A4]",
      accentColor: "#4B63D2",
      rsvpCount: 540,
      isRsvp: false,
      userRsvpStatus: null,
      pendingRequestsCount: 0,
      organizer: "GDSC SBJIT & Coding Council",
      isUpcoming: true,
      highlights: [
        "₹1,50,000 Total Prize Pool for Winning Teams",
        "Mentorship by Industry Tech Leads from Google & Microsoft",
        "RoboWars Battle Arena and Drone Racing Challenge",
      ],
      timeline: [
        {
          time: "10:00 AM",
          title: "Hackathon Opening & Problem Release",
          description: "Keynote by Chief Guest and release of 5 industry tracks.",
        },
        {
          time: "4:00 PM",
          title: "RoboWars Eliminator Rounds",
          description: "High-intensity battle arena clash between college robotics teams.",
        },
        {
          time: "10:00 PM",
          title: "Midnight Code Sprint & Mentor Reviews",
          description: "1-on-1 feedback sessions with top technology mentors.",
        },
        {
          time: "11:00 AM (Day 2)",
          title: "Final Pitches & Award Ceremony",
          description: "Top 10 teams demonstrate live prototypes to jury.",
        },
      ],
    },
  ];

  const [events, setEvents] = useState<CampusEvent[]>(defaultEvents);

  // Previous Events (Past College Events Archive)
  const previousEvents: CampusEvent[] = [
    {
      id: 101,
      title: "SBJIT Annual Sports Meet 2025",
      tagline: "Inter-Branch Champions Trophy & Track Events",
      category: "Sports",
      date: "December 12, 2025",
      timeRange: "Full Day",
      venue: "College Sports Pavilion",
      bannerGradient: "from-emerald-600 to-teal-700",
      accentColor: "#10B981",
      rsvpCount: 650,
      isRsvp: true,
      organizer: "Sports & Fitness Council",
      isUpcoming: false,
      highlights: [
        "AIML Department won Overall Championship Trophy",
        "Inter-College Cricket & Football Finals",
      ],
      timeline: [
        {
          time: "8:00 AM",
          title: "Torch Lighting & March Past",
          description: "Opening parade with all departments.",
        },
        {
          time: "4:30 PM",
          title: "Grand Trophies Presentation",
          description: "Awarding medals to track and field champions.",
        },
      ],
    },
    {
      id: 102,
      title: "Alumni Career Conclave 2025",
      tagline: "Global Mentorship & Placements Networking Talk",
      category: "Academic",
      date: "November 5, 2025",
      timeRange: "2:00 PM – 6:00 PM",
      venue: "Central Auditorium",
      bannerGradient: "from-purple-600 to-indigo-800",
      accentColor: "#8B5CF6",
      rsvpCount: 310,
      isRsvp: true,
      organizer: "Alumni Relations Cell & Placement Cell",
      isUpcoming: false,
      highlights: [
        "Keynotes by alumni working in US, Europe & Top Indian MNCs",
        "Mock interviews and resume reviews for 3rd & 4th year students",
      ],
      timeline: [
        {
          time: "2:00 PM",
          title: "Alumni Panel Discussion",
          description: "Navigating off-campus hires and masters abroad.",
        },
      ],
    },
    {
      id: 103,
      title: "Winter Web3 & AI Bootcamp 2025",
      tagline: "3-Day Practical Hands-on Workshop on LLMs & Full Stack",
      category: "Technical",
      date: "October 20, 2025",
      timeRange: "3 Days",
      venue: "Lab Complex 3",
      bannerGradient: "from-blue-600 to-cyan-600",
      accentColor: "#06B6D4",
      rsvpCount: 220,
      isRsvp: true,
      organizer: "GDSC SBJIT",
      isUpcoming: false,
      highlights: ["Built 5 end-to-end fullstack AI prototypes in 72 hours"],
      timeline: [],
    },
  ];

  // Fetch current user, backend events, and department students
  const loadInitialData = async () => {
    try {
      // 1. Current user
      const userData = await apiRequest<{
        id: number;
        email: string;
        role_id?: number;
        role?: { name: string };
      }>("/users/me").catch(() => null);
      if (userData) setCurrentUser(userData);

      // 2. Fetch live events from API
      const liveEvents = await apiRequest<any[]>("/events").catch(() => []);
      if (Array.isArray(liveEvents) && liveEvents.length > 0) {
        const mappedLive: CampusEvent[] = liveEvents.map((evt) => {
          const startDate = evt.start_datetime
            ? new Date(evt.start_datetime).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Upcoming";
          const startTime = evt.start_datetime
            ? new Date(evt.start_datetime).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })
            : "10:00 AM";

          return {
            id: evt.id,
            title: evt.title,
            tagline: evt.description?.split("\n")[0] || "Official College Program",
            category: (evt.category?.name as any) || "Technical",
            date: startDate,
            timeRange: startTime,
            venue: evt.location || "SBJIT Auditorium",
            bannerGradient:
              evt.category?.name === "Cultural"
                ? "from-amber-500 via-rose-500 to-purple-600"
                : evt.category?.name === "Sports"
                ? "from-emerald-600 to-teal-700"
                : "from-blue-600 via-indigo-600 to-[#5851A4]",
            accentColor: "#4B63D2",
            rsvpCount: evt.rsvp_count || 0,
            isRsvp: evt.user_rsvp_status === "GOING",
            userRsvpStatus: evt.user_rsvp_status,
            pendingRequestsCount: evt.pending_requests_count || 0,
            timeline: [],
            highlights: evt.description?.includes("\n\n")
              ? evt.description.split("\n\n")[1].split(",").map((s: string) => s.trim())
              : ["Authorized College Event", "Open to all Students & Faculty"],
            organizer: evt.organizer?.email ? `Organized by ${evt.organizer.email}` : "Controller & Academic Office",
            organizer_id: evt.organizer_id,
            head_id: evt.head_id,
            co_head_id: evt.co_head_id,
            head: evt.head,
            co_head: evt.co_head,
            isUpcoming: true,
            google_form_url: evt.google_form_url,
          };
        });

        // Merge: live events first, then default events not duplicated by id
        setEvents([...mappedLive, ...defaultEvents.filter((d) => !mappedLive.some((l) => l.id === d.id))]);
      }

      // 3. Department students for appointing Event Head & Co-Head
      const studentsData =
        (await apiRequest<any[]>("/departments/students").catch(() => null)) ||
        (await apiRequest<any[]>("/users?limit=100").catch(() => []));
      if (Array.isArray(studentsData)) {
        // Filter or map student objects
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
    } catch (err) {
      console.error("Failed to load events initial data", err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const roleName = currentUser?.role?.name?.toLowerCase().trim() || "";
  const isAdmin =
    currentUser?.role_id === 1 ||
    ["admin", "super admin", "superadmin", "management", "central admin"].includes(roleName) ||
    currentUser?.email?.toLowerCase().includes("admin") ||
    false;

  const isController =
    roleName === "controller" ||
    roleName === "tpo" ||
    roleName === "hod" ||
    currentUser?.email?.toLowerCase().includes("controller") ||
    false;

  const canCreateEvent = isAdmin || isController;

  // ── Join / RSVP Action ──────────────────────────────────────────────────────
  const handleRequestOrRSVP = async (event: CampusEvent) => {
    if (event.google_form_url) {
      window.open(event.google_form_url, "_blank");
      return;
    }

    try {
      // If already attending or pending, toggle/cancel
      if (event.userRsvpStatus === "GOING" || event.userRsvpStatus === "PENDING") {
        if (!window.confirm("Do you want to cancel your attendance / join request?")) return;
        await apiRequest(`/events/${event.id}/rsvp`, { method: "DELETE" }).catch(() => null);
        setEvents((prev) =>
          prev.map((e) =>
            e.id === event.id
              ? {
                  ...e,
                  isRsvp: false,
                  userRsvpStatus: null,
                  rsvpCount: e.userRsvpStatus === "GOING" ? Math.max(0, e.rsvpCount - 1) : e.rsvpCount,
                }
              : e
          )
        );
        return;
      }

      // Submit new join request (PENDING)
      const res = await apiRequest<any>(`/events/${event.id}/rsvp`, {
        method: "POST",
        body: JSON.stringify({ status: "PENDING" }),
      }).catch(() => null);

      const nextStatus = res?.status || "PENDING";
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id
            ? {
                ...e,
                isRsvp: nextStatus === "GOING",
                userRsvpStatus: nextStatus,
                pendingRequestsCount: (e.pendingRequestsCount || 0) + 1,
              }
            : e
        )
      );
      alert("Your request to join the event has been sent to the Event Head & Co-Head for approval!");
    } catch (err: any) {
      alert(err?.message || "Failed to submit event request");
    }
  };

  // ── Open Leads Modal ────────────────────────────────────────────────────────
  const handleOpenLeadsModal = (event: CampusEvent) => {
    setLeadsModalEvent(event);
    setAppointedHeadId(event.head_id || null);
    setAppointedCoHeadId(event.co_head_id || null);
    setLeadsSuccess(null);
    setLeadsError(null);
  };

  const handleSaveLeads = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadsModalEvent) return;

    if (appointedHeadId && appointedCoHeadId && appointedHeadId === appointedCoHeadId) {
      setLeadsError("Event Head and Co-Head cannot be the same student.");
      return;
    }

    setIsSubmittingLeads(true);
    setLeadsError(null);
    try {
      await apiRequest(`/events/${leadsModalEvent.id}/leads`, {
        method: "PUT",
        body: JSON.stringify({
          head_id: appointedHeadId || null,
          co_head_id: appointedCoHeadId || null,
        }),
      });

      const headObj = departmentStudents.find((s) => s.id === appointedHeadId);
      const coHeadObj = departmentStudents.find((s) => s.id === appointedCoHeadId);

      setEvents((prev) =>
        prev.map((evt) =>
          evt.id === leadsModalEvent.id
            ? {
                ...evt,
                head_id: appointedHeadId,
                co_head_id: appointedCoHeadId,
                head: headObj
                  ? {
                      id: headObj.id,
                      email: headObj.email,
                      first_name: headObj.name.split(" ")[0],
                      last_name: headObj.name.split(" ").slice(1).join(" "),
                      department: headObj.department,
                    }
                  : null,
                co_head: coHeadObj
                  ? {
                      id: coHeadObj.id,
                      email: coHeadObj.email,
                      first_name: coHeadObj.name.split(" ")[0],
                      last_name: coHeadObj.name.split(" ").slice(1).join(" "),
                      department: coHeadObj.department,
                    }
                  : null,
              }
            : evt
        )
      );

      setLeadsSuccess("Event Head and Co-Head successfully appointed!");
      setTimeout(() => {
        setLeadsModalEvent(null);
        setLeadsSuccess(null);
      }, 1200);
    } catch (err: any) {
      setLeadsError(err?.message || "Failed to appoint event leads");
    } finally {
      setIsSubmittingLeads(false);
    }
  };

  // ── Open Requests Modal ─────────────────────────────────────────────────────
  const handleOpenRequestsModal = async (event: CampusEvent) => {
    setRequestsModalEvent(event);
    setLoadingRequests(true);
    setRequestsActionMsg(null);
    try {
      const data = await apiRequest<RSVPRequestItem[]>(`/events/${event.id}/requests`);
      setPendingRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch pending event requests", err);
      setPendingRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleUpdateRequestStatus = async (targetUserId: number, newStatus: "GOING" | "NOT_GOING") => {
    if (!requestsModalEvent) return;
    try {
      await apiRequest(`/events/${requestsModalEvent.id}/rsvps/${targetUserId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });

      // Remove from pending list
      setPendingRequests((prev) => prev.filter((r) => r.user_id !== targetUserId));

      // Update event counters in main list
      setEvents((prev) =>
        prev.map((e) => {
          if (e.id === requestsModalEvent.id) {
            return {
              ...e,
              pendingRequestsCount: Math.max(0, (e.pendingRequestsCount || 1) - 1),
              rsvpCount: newStatus === "GOING" ? e.rsvpCount + 1 : e.rsvpCount,
            };
          }
          return e;
        })
      );

      setRequestsActionMsg(
        newStatus === "GOING" ? "Request accepted! Student is enrolled." : "Request declined."
      );
      setTimeout(() => setRequestsActionMsg(null), 2500);
    } catch (err: any) {
      alert(err?.message || "Failed to update join request status");
    }
  };

  return (
    <div className="space-y-10">
      {/* ========================================================================= */}
      {/* 1. UPCOMING COLLEGE EVENTS SECTION                                         */}
      {/* ========================================================================= */}
      <section className="space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-2xl bg-[#4B63D2]/10 text-[#4B63D2]">
                <Calendar className="w-6 h-6" />
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1E2746] tracking-tight">
                Upcoming College Events
              </h2>
            </div>
            <p className="text-[#5851A4] text-xs sm:text-sm font-medium mt-1">
              Flagship campus festivals, departmental techfests, and student-led initiatives.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {events.length} Upcoming Events
            </span>

            {canCreateEvent && (
              <button
                onClick={() => {
                  setNewEventTitle("");
                  setNewEventTagline("");
                  setNewEventDate("");
                  setNewEventTimeRange("");
                  setNewEventVenue("");
                  setNewEventGoogleFormUrl("");
                  setNewEventHighlights("");
                  setNewEventHeadId(null);
                  setNewEventCoHeadId(null);
                  setCreateEventError(null);
                  setCreateEventSuccess(null);
                  setShowCreateEventModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#4B63D2] hover:bg-[#3E53BE] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Post Event</span>
              </button>
            )}
          </div>
        </div>

        {/* Event Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const isExpanded = expandedEventId === event.id;
            const isHead = currentUser?.id === event.head_id;
            const isCoHead = currentUser?.id === event.co_head_id;
            const canManage = isHead || isCoHead || isController || isAdmin || event.organizer_id === currentUser?.id;

            return (
              <div
                key={event.id}
                className="bg-white border border-[#EAE4F7] hover:border-[#C8B6E2] rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Event Top Banner */}
                <div>
                  <div
                    className={`p-6 bg-gradient-to-br ${event.bannerGradient} text-white relative overflow-hidden`}
                  >
                    <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

                    <div className="flex items-center justify-between relative z-10 mb-3">
                      <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur-md border border-white/30 text-white">
                        {event.category}
                      </span>
                      <span className="text-xs font-bold text-white/90 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {event.rsvpCount} Attending
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight relative z-10 leading-snug">
                      {event.title}
                    </h3>
                    <p className="text-xs text-white/90 font-medium mt-1.5 line-clamp-2 relative z-10 leading-relaxed">
                      {event.tagline}
                    </p>
                  </div>

                  {/* Personal Role Banner if student is Head or Co-Head */}
                  {(isHead || isCoHead) && (
                    <div
                      className={`px-4 py-2 text-xs font-black flex items-center gap-2 border-b ${
                        isHead
                          ? "bg-amber-500/15 border-amber-400/40 text-amber-900"
                          : "bg-indigo-500/15 border-indigo-400/40 text-indigo-900"
                      }`}
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-600" />
                      <span>
                        {isHead
                          ? "🎖️ You are the appointed Event Head for this event"
                          : "🎖️ You are the appointed Event Co-Head for this event"}
                      </span>
                    </div>
                  )}

                  {/* Date, Time & Venue Bar */}
                  <div className="p-5 space-y-3 border-b border-[#EAE4F7] bg-[#FAF9FD]/50">
                    <div className="flex items-center gap-2.5 text-xs font-bold text-[#1E2746]">
                      <Calendar className="w-4 h-4 text-[#4B63D2] shrink-0" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs font-medium text-[#5851A4]">
                      <Clock className="w-4 h-4 text-[#5851A4] shrink-0" />
                      <span>{event.timeRange}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs font-medium text-[#5851A4]">
                      <MapPin className="w-4 h-4 text-[#5851A4] shrink-0" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                  </div>

                  {/* Appointed Leads Badges (Event Head & Event Co-Head) */}
                  {(event.head || event.co_head) && (
                    <div className="p-4 bg-gradient-to-r from-[#FAF9FD] to-white border-b border-[#EAE4F7] space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-wider text-[#5851A4] flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-500" /> Appointed Student Leads
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {event.head && (
                          <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200/80 rounded-xl">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                              {event.head.first_name ? event.head.first_name[0] : "H"}
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] font-black uppercase text-amber-800 tracking-wider block">
                                🎖️ Head
                              </span>
                              <div className="text-xs font-bold text-[#1E2746] truncate">
                                {event.head.first_name} {event.head.last_name || ""}
                              </div>
                            </div>
                          </div>
                        )}

                        {event.co_head && (
                          <div className="flex items-center gap-2 p-2 bg-indigo-50 border border-indigo-200/80 rounded-xl">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                              {event.co_head.first_name ? event.co_head.first_name[0] : "C"}
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] font-black uppercase text-indigo-800 tracking-wider block">
                                🎖️ Co-Head
                              </span>
                              <div className="text-xs font-bold text-[#1E2746] truncate">
                                {event.co_head.first_name} {event.co_head.last_name || ""}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Event Highlights */}
                  <div className="p-5 space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1E2746]">
                      Event Highlights
                    </h4>
                    <ul className="space-y-1.5">
                      {event.highlights.map((h, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-[#5851A4] font-medium leading-relaxed"
                        >
                          <span className="text-[#4B63D2] font-bold text-sm leading-none mt-0.5">
                            •
                          </span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Timeline Expansion Details */}
                    {isExpanded && event.timeline && event.timeline.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-[#EAE4F7] space-y-3 animate-in fade-in duration-200">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#4B63D2] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          Event Schedule & Timeline
                        </h4>
                        <div className="space-y-2.5 pl-2 border-l-2 border-[#4B63D2]/30">
                          {event.timeline.map((item, idx) => (
                            <div key={idx} className="relative pl-3 space-y-0.5">
                              <span className="absolute -left-[13px] top-1.5 h-2 w-2 rounded-full bg-[#4B63D2]" />
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-extrabold text-[#4B63D2] bg-[#4B63D2]/10 px-1.5 py-0.2 rounded">
                                  {item.time}
                                </span>
                                <span className="text-xs font-bold text-[#1E2746]">
                                  {item.title}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#5851A4] leading-relaxed">
                                {item.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Management Bar (If user can manage or appoint leads) */}
                <div className="p-4 bg-[#FAF9FD] border-t border-[#EAE4F7] flex flex-wrap items-center justify-between gap-2">
                  {/* Left: Appoint Leads Button (Controller / Admin) */}
                  {(isController || isAdmin) && (
                    <button
                      onClick={() => handleOpenLeadsModal(event)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-[#D5CBEE] text-[11px] font-bold text-[#1E2746] hover:bg-[#FAF9FD] transition cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-[#4B63D2]" />
                      <span>{event.head || event.co_head ? "Edit Leads" : "Appoint Leads"}</span>
                    </button>
                  )}

                  {/* Right: Manage Join Requests (Head, Co-Head, Controller) */}
                  {canManage && (
                    <button
                      onClick={() => handleOpenRequestsModal(event)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4B63D2]/10 border border-[#4B63D2]/30 text-[11px] font-extrabold text-[#4B63D2] hover:bg-[#4B63D2] hover:text-white transition cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Manage Requests</span>
                      {(event.pendingRequestsCount || 0) > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                          {event.pendingRequestsCount}
                        </span>
                      )}
                    </button>
                  )}
                </div>

                {/* Footer RSVP / Join Button */}
                <div className="p-5 pt-3 flex items-center gap-2.5">
                  <button
                    onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-[#EAE4F7] hover:border-[#C8B6E2] text-xs font-bold text-[#5851A4] hover:text-[#1E2746] bg-[#FAF9FD] hover:bg-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{isExpanded ? "Hide Timeline" : "View Timeline"}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => handleRequestOrRSVP(event)}
                    className={`py-2.5 px-5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                      event.google_form_url
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : event.userRsvpStatus === "GOING"
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : event.userRsvpStatus === "PENDING"
                        ? "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200"
                        : "bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white hover:shadow-md active:scale-95"
                    }`}
                  >
                    {event.google_form_url ? (
                      <span>Register via Google Form ↗</span>
                    ) : event.userRsvpStatus === "GOING" ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Enrolled / Attending</span>
                      </>
                    ) : event.userRsvpStatus === "PENDING" ? (
                      <>
                        <Clock className="w-4 h-4 text-amber-700" />
                        <span>Request Pending</span>
                      </>
                    ) : (
                      <span>Request to Join</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ===================================================================== */}
        {/* 2. SEE PREVIOUS EVENTS ARCHIVE                                        */}
        {/* ===================================================================== */}
        <div className="pt-2 flex flex-col items-center">
          <button
            onClick={() => setShowPreviousEvents(!showPreviousEvents)}
            className="flex items-center gap-2 py-3 px-6 rounded-2xl bg-white hover:bg-[#FAF9FD] border border-[#EAE4F7] hover:border-[#C8B6E2] text-xs sm:text-sm font-bold text-[#5851A4] hover:text-[#1E2746] shadow-sm transition-all duration-200 cursor-pointer"
          >
            <History className="w-4 h-4 text-[#4B63D2]" />
            <span>
              {showPreviousEvents
                ? "Hide Previous College Events"
                : "See Previous College Events Archive"}
            </span>
            {showPreviousEvents ? (
              <ChevronUp className="w-4 h-4 text-[#4B63D2]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#4B63D2]" />
            )}
          </button>

          {showPreviousEvents && (
            <div className="w-full mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-300">
              {previousEvents.map((pe) => (
                <div
                  key={pe.id}
                  className="bg-white border border-[#EAE4F7] rounded-3xl p-5 space-y-3 shadow-sm hover:shadow-md transition-all opacity-90 hover:opacity-100"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EAE4F7] text-[#5851A4]">
                      {pe.category} (Concluded)
                    </span>
                    <span className="text-xs font-semibold text-[#9188BE]">
                      {pe.date}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-[#1E2746]">
                    {pe.title}
                  </h4>
                  <p className="text-xs text-[#5851A4] leading-relaxed font-medium">
                    {pe.tagline}
                  </p>

                  <div className="pt-2 border-t border-[#EAE4F7] flex items-center justify-between text-xs text-[#5851A4]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {pe.venue}
                    </span>
                    <span className="font-bold text-emerald-600">
                      ✓ Completed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CONTROLLER & ADMIN EVENT CREATION MODAL WITH LEADS APPOINTMENT         */}
      {/* ========================================================================= */}
      {showCreateEventModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EAE4F7] pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#4B63D2]" />
                <h3 className="text-lg font-black text-[#1E2746]">Post New Campus Event</h3>
              </div>
              <button
                onClick={() => setShowCreateEventModal(false)}
                className="p-1 hover:bg-[#FAF9FD] rounded-full text-[#9188BE] hover:text-[#1E2746] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createEventSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{createEventSuccess}</span>
              </div>
            )}

            {createEventError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{createEventError}</span>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newEventTitle.trim() || !newEventDate.trim()) {
                  setCreateEventError("Please enter event title and date.");
                  return;
                }

                if (newEventHeadId && newEventCoHeadId && newEventHeadId === newEventCoHeadId) {
                  setCreateEventError("Event Head and Co-Head cannot be the same student.");
                  return;
                }

                setIsSubmittingCreate(true);
                setCreateEventError(null);

                try {
                  // Post to backend API
                  const futureDate = new Date(Date.now() + 86400000 * 14).toISOString();
                  const payload = {
                    title: newEventTitle.trim(),
                    description: `${newEventTagline.trim() || "Campus Program"}\n\n${newEventHighlights.trim() || "Flagship college initiative"}`,
                    location: newEventVenue.trim() || "SBJIT Auditorium",
                    start_datetime: futureDate,
                    google_form_url: newEventGoogleFormUrl.trim() || null,
                    head_id: newEventHeadId || null,
                    co_head_id: newEventCoHeadId || null,
                  };

                  const createdRes = await apiRequest<any>("/events", {
                    method: "POST",
                    body: JSON.stringify(payload),
                  }).catch(() => null);

                  const headObj = departmentStudents.find((s) => s.id === newEventHeadId);
                  const coHeadObj = departmentStudents.find((s) => s.id === newEventCoHeadId);

                  const newEvt: CampusEvent = {
                    id: createdRes?.id || Date.now(),
                    title: newEventTitle.trim(),
                    tagline: newEventTagline.trim() || "Official Campus Event",
                    category: newEventCategory,
                    date: newEventDate.trim(),
                    timeRange: newEventTimeRange.trim() || "10:00 AM - 4:00 PM",
                    venue: newEventVenue.trim() || "SBJIT Auditorium",
                    bannerGradient: "from-blue-600 via-indigo-600 to-purple-600",
                    accentColor: "#4B63D2",
                    rsvpCount: 0,
                    isRsvp: false,
                    userRsvpStatus: null,
                    pendingRequestsCount: 0,
                    highlights: newEventHighlights.trim()
                      ? newEventHighlights.split(",").map((s) => s.trim())
                      : ["Authorized Controller / Admin Program", "Open to all Students & Faculty"],
                    organizer: "Controller & Campus Academic Office",
                    organizer_id: currentUser?.id,
                    head_id: newEventHeadId,
                    co_head_id: newEventCoHeadId,
                    head: headObj
                      ? {
                          id: headObj.id,
                          email: headObj.email,
                          first_name: headObj.name.split(" ")[0],
                          last_name: headObj.name.split(" ").slice(1).join(" "),
                          department: headObj.department,
                        }
                      : null,
                    co_head: coHeadObj
                      ? {
                          id: coHeadObj.id,
                          email: coHeadObj.email,
                          first_name: coHeadObj.name.split(" ")[0],
                          last_name: coHeadObj.name.split(" ").slice(1).join(" "),
                          department: coHeadObj.department,
                        }
                      : null,
                    isUpcoming: true,
                    timeline: [],
                    google_form_url: newEventGoogleFormUrl.trim() || undefined,
                  };

                  setEvents((prev) => [newEvt, ...prev]);
                  setCreateEventSuccess("Event published and Student Leads appointed successfully!");
                  setTimeout(() => {
                    setShowCreateEventModal(false);
                    setCreateEventSuccess(null);
                  }, 1200);
                } catch (err: any) {
                  setCreateEventError(err?.message || "Failed to publish event.");
                } finally {
                  setIsSubmittingCreate(false);
                }
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1E2746] mb-1">
                    Event Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SBJIT Hackathon 2026"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E2746] mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newEventCategory}
                    onChange={(e) => setNewEventCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Academic">Academic</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1">
                  Tagline / Brief Rationale
                </label>
                <input
                  type="text"
                  placeholder="e.g. Annual National Inter-College Hackathon & Paper Presentation"
                  value={newEventTagline}
                  onChange={(e) => setNewEventTagline(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none"
                />
              </div>

              {/* Appoint Event Head & Co-Head (Department Controller Feature) */}
              <div className="bg-gradient-to-r from-[#FAF9FD] to-amber-50/50 p-3.5 rounded-2xl border border-amber-200 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#1E2746]">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span>Appoint Student Event Leads (Optional)</span>
                </div>
                <p className="text-[11px] text-[#5851A4]">
                  Appointed students will receive <strong>Event Head</strong> and <strong>Event Co-Head</strong> badges and the authority to approve/decline participant join requests.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 mb-1">
                      🎖️ Appoint Event Head (Student)
                    </label>
                    <select
                      value={newEventHeadId || ""}
                      onChange={(e) => setNewEventHeadId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3 py-2 bg-white border border-amber-300 focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Select Student --</option>
                      {departmentStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.department} {s.graduation_year ? `• Batch ${s.graduation_year}` : ""})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                      🎖️ Appoint Event Co-Head (Student)
                    </label>
                    <select
                      value={newEventCoHeadId || ""}
                      onChange={(e) => setNewEventCoHeadId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3 py-2 bg-white border border-indigo-300 focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Select Student --</option>
                      {departmentStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.department} {s.graduation_year ? `• Batch ${s.graduation_year}` : ""})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1E2746] mb-1">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Nov 15, 2026"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E2746] mb-1">
                    Time Range
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10:00 AM - 5:00 PM"
                    value={newEventTimeRange}
                    onChange={(e) => setNewEventTimeRange(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E2746] mb-1">
                    Venue / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SBJIT Main Auditorium"
                    value={newEventVenue}
                    onChange={(e) => setNewEventVenue(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none"
                  />
                </div>
              </div>

              {/* Google Form Link */}
              <div className="bg-[#4B63D2]/5 p-3 rounded-2xl border border-[#4B63D2]/20 space-y-1">
                <label className="block text-xs font-bold text-[#4B63D2]">
                  Google Form Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://forms.google.com/..."
                  value={newEventGoogleFormUrl}
                  onChange={(e) => setNewEventGoogleFormUrl(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#D5CBEE] focus:border-[#4B63D2] rounded-xl text-xs font-mono text-[#1E2746] focus:outline-none"
                />
                <p className="text-[10px] text-[#5851A4] font-medium">
                  If provided, clicking Register will redirect users directly to this Google Form.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1">
                  Event Highlights (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Cash Prizes ₹50,000, Free Lunch & Certificates, Industry Jury"
                  value={newEventHighlights}
                  onChange={(e) => setNewEventHighlights(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateEventModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#EAE4F7] text-xs font-bold text-[#5851A4] hover:bg-[#FAF9FD] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white text-xs font-bold shadow-md shadow-[#4B63D2]/25 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingCreate && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Publish Event</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. APPOINT EVENT LEADS MODAL (Post-Creation for Controller & Admin)       */}
      {/* ========================================================================= */}
      {leadsModalEvent && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#EAE4F7] pb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-base font-black text-[#1E2746]">Appoint Event Student Leads</h3>
                  <p className="text-[11px] text-[#5851A4]">{leadsModalEvent.title}</p>
                </div>
              </div>
              <button
                onClick={() => setLeadsModalEvent(null)}
                className="p-1 hover:bg-[#FAF9FD] rounded-full text-[#9188BE] hover:text-[#1E2746] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {leadsSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{leadsSuccess}</span>
              </div>
            )}

            {leadsError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{leadsError}</span>
              </div>
            )}

            <form onSubmit={handleSaveLeads} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-amber-900">
                  🎖️ Event Head (Student)
                </label>
                <select
                  value={appointedHeadId || ""}
                  onChange={(e) => setAppointedHeadId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF9FD] border border-amber-300 focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none cursor-pointer"
                >
                  <option value="">-- No Event Head Assigned --</option>
                  {departmentStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.department} {s.graduation_year ? `• Batch ${s.graduation_year}` : ""})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[#5851A4]">
                  Receives "Event Head" badge and primary authority to manage attendees and requests.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-indigo-900">
                  🎖️ Event Co-Head (Student)
                </label>
                <select
                  value={appointedCoHeadId || ""}
                  onChange={(e) => setAppointedCoHeadId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF9FD] border border-indigo-300 focus:bg-white focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none cursor-pointer"
                >
                  <option value="">-- No Event Co-Head Assigned --</option>
                  {departmentStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.department} {s.graduation_year ? `• Batch ${s.graduation_year}` : ""})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[#5851A4]">
                  Receives "Event Co-Head" badge and secondary authority to review participant requests.
                </p>
              </div>

              <div className="pt-3 border-t border-[#EAE4F7] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setLeadsModalEvent(null)}
                  className="px-4 py-2 rounded-xl border border-[#EAE4F7] text-xs font-bold text-[#5851A4] hover:bg-[#FAF9FD] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLeads}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white text-xs font-bold shadow-md shadow-[#4B63D2]/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingLeads && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Appointments</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MANAGE JOIN REQUESTS MODAL (Event Head, Co-Head & Controller)          */}
      {/* ========================================================================= */}
      {requestsModalEvent && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#EAE4F7] pb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#4B63D2]" />
                  <h3 className="text-base font-black text-[#1E2746]">Participant Join Requests</h3>
                </div>
                <p className="text-xs text-[#5851A4] mt-0.5 font-medium">{requestsModalEvent.title}</p>
              </div>
              <button
                onClick={() => setRequestsModalEvent(null)}
                className="p-1 hover:bg-[#FAF9FD] rounded-full text-[#9188BE] hover:text-[#1E2746] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {requestsActionMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{requestsActionMsg}</span>
              </div>
            )}

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {loadingRequests ? (
                <div className="py-12 flex flex-col items-center justify-center text-[#5851A4] space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#4B63D2]" />
                  <span className="text-xs font-medium">Loading requests...</span>
                </div>
              ) : pendingRequests.length > 0 ? (
                pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 bg-[#FAF9FD] border border-[#EAE4F7] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#4B63D2] to-[#5851A4] text-white flex items-center justify-center font-black text-xs shrink-0">
                        {req.user?.first_name ? req.user.first_name[0] : "S"}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#1E2746] truncate">
                          {req.user?.first_name || ""} {req.user?.last_name || ""}
                        </h4>
                        <p className="text-[11px] text-[#5851A4] truncate">{req.user?.email}</p>
                        <p className="text-[10px] text-[#9188BE] font-medium mt-0.5">
                          {req.user?.department || "Student"}
                          {req.user?.graduation_year ? ` • Batch ${req.user.graduation_year}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleUpdateRequestStatus(req.user_id, "GOING")}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept & Enroll</span>
                      </button>

                      <button
                        onClick={() => handleUpdateRequestStatus(req.user_id, "NOT_GOING")}
                        className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-[#5851A4] space-y-2">
                  <Users className="w-8 h-8 mx-auto text-[#D5CBEE]" />
                  <p className="text-xs font-medium">No pending join requests for this event.</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#EAE4F7] flex justify-end shrink-0">
              <button
                onClick={() => setRequestsModalEvent(null)}
                className="px-4 py-2 bg-[#FAF9FD] hover:bg-[#EAE4F7] text-xs font-bold text-[#1E2746] rounded-xl transition cursor-pointer"
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
