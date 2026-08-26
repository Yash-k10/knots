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
  Building,
  GraduationCap,
  Briefcase,
  History,
  AlertCircle,
  X,
  Music,
  Code,
  Trophy,
  Camera,
  Layers,
  CheckCircle2,
} from "lucide-react";

import { apiRequest } from "../services/api";
import { clubsService, Club } from "../services/clubs";

interface EventTimelineItem {
  time: string;
  title: string;
  description: string;
}

interface CampusEvent {
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
  timeline: EventTimelineItem[];
  highlights: string[];
  organizer: string;
  isUpcoming: boolean;
}

export default function Events() {
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    email: string;
    role?: { name: string };
  } | null>(null);

  // Active category filter for clubs
  const [clubCategory, setClubCategory] = useState<string>("ALL");

  // Previous Events expansion state
  const [showPreviousEvents, setShowPreviousEvents] = useState<boolean>(false);

  // Expanded event timeline modal/card state
  const [expandedEventId, setExpandedEventId] = useState<number | null>(1);

  // Create Club Modal state
  const [showCreateClubModal, setShowCreateClubModal] = useState<boolean>(false);
  const [newClubName, setNewClubName] = useState<string>("");
  const [newClubCategory, setNewClubCategory] = useState<string>("Technical");
  const [newClubDesc, setNewClubDesc] = useState<string>("");
  const [newClubDemandReason, setNewClubDemandReason] = useState<string>("");
  const [createClubSuccess, setCreateClubSuccess] = useState<string | null>(null);
  const [createClubError, setCreateClubError] = useState<string | null>(null);
  const [isSubmittingClub, setIsSubmittingClub] = useState<boolean>(false);

  // Joined club states
  const [joinedClubIds, setJoinedClubIds] = useState<Set<number>>(new Set([1]));

  // Events list with Garbotsav, Ganesh Chaturthi, and flagship college programs
  const [events, setEvents] = useState<CampusEvent[]>([
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
  ]);

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

  // College Clubs List
  const [clubs, setClubs] = useState<Club[]>([
    {
      id: 1,
      name: "GDSC SBJIT & Coding Club",
      description:
        "The premier technology & developer community at SBJIT. Organizing hackathons, workshops on Web, App, AI/ML, and Open Source.",
      category: "Technical",
      is_official: true,
      member_count: 156,
      created_at: "2024-01-01",
      lead_name: "Rohit Deshmukh",
      has_lead_infinity: true,
    },
    {
      id: 2,
      name: "AI & Robotics Society (AIRS)",
      description:
        "Dedicated to robotics competitions, computer vision research, autonomous bots, and machine learning research papers.",
      category: "Technical",
      is_official: true,
      member_count: 112,
      created_at: "2024-02-15",
      lead_name: "Dr. Rajesh Sharma",
      has_lead_infinity: true,
    },
    {
      id: 3,
      name: "E-Cell SBJIT (Entrepreneurship Hub)",
      description:
        "Fostering startup ideas, venture funding pitch decks, founder connect talks, and business plan competitions.",
      category: "Entrepreneurship",
      is_official: true,
      member_count: 89,
      created_at: "2024-03-10",
      lead_name: "Priya Verma",
      has_lead_infinity: true,
    },
    {
      id: 4,
      name: "Sanskriti Cultural & Dance Club",
      description:
        "Organizing Garbotsav, annual cultural festivals, drama nights, choreography performances, and inter-collegiate dance battles.",
      category: "Cultural",
      is_official: true,
      member_count: 140,
      created_at: "2024-01-20",
      lead_name: "Tanvi Kulkarni",
      has_lead_infinity: true,
    },
    {
      id: 5,
      name: "Dhwani Music & Arts Society",
      description:
        "Campus home for singers, instrumentalists, bands, and audio producers. Performing live in all major college events.",
      category: "Cultural",
      is_official: true,
      member_count: 76,
      created_at: "2024-04-05",
      lead_name: "Aman Gupta",
      has_lead_infinity: false,
    },
    {
      id: 6,
      name: "Drishti Media & Photography Club",
      description:
        "Official media coverage, filmmaking, video editing, and creative graphic design team for all campus activities.",
      category: "Media",
      is_official: true,
      member_count: 62,
      created_at: "2024-05-12",
      lead_name: "Sneha Patil",
      has_lead_infinity: false,
    },
    {
      id: 7,
      name: "SBJIT Sports & Fitness League",
      description:
        "Inter-branch tournaments, fitness bootcamps, cricket, football, basketball, and athletics training.",
      category: "Sports",
      is_official: true,
      member_count: 130,
      created_at: "2024-01-15",
      lead_name: "Prof. Sanjay Patil",
      has_lead_infinity: true,
    },
  ]);

  // Fetch current user & roles
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await apiRequest<{
          id: number;
          email: string;
          role?: { name: string };
        }>("/users/me");
        setCurrentUser(data);
      } catch (err) {
        // Fallback
      }
    };
    fetchUser();
  }, []);

  // Fetch live clubs from backend if available
  useEffect(() => {
    const loadClubs = async () => {
      try {
        const liveClubs = await clubsService.getClubs();
        if (Array.isArray(liveClubs) && liveClubs.length > 0) {
          // Merge with predefined clubs
          setClubs((prev) => {
            const merged = [...prev];
            liveClubs.forEach((c) => {
              if (!merged.some((m) => m.name.toLowerCase() === c.name.toLowerCase())) {
                merged.push(c);
              }
            });
            return merged;
          });
        }
      } catch (err) {
        // Fallback to rich curated clubs
      }
    };
    loadClubs();
  }, []);

  // Check if current user is President, Secretary, or Admin
  const isPresidentOrSecretary =
    currentUser?.email?.toLowerCase().includes("president") ||
    currentUser?.email?.toLowerCase().includes("secretary") ||
    currentUser?.email?.toLowerCase().includes("admin") ||
    currentUser?.email?.toLowerCase().includes("dean") ||
    currentUser?.email?.toLowerCase().includes("yashkapse") ||
    currentUser?.role?.name?.toLowerCase() === "admin" ||
    currentUser?.role?.name?.toLowerCase() === "management";

  const handleRSVP = (eventId: number) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const nextRsvp = !e.isRsvp;
          return {
            ...e,
            isRsvp: nextRsvp,
            rsvpCount: nextRsvp ? e.rsvpCount + 1 : e.rsvpCount - 1,
          };
        }
        return e;
      }),
    );
  };

  const handleToggleJoinClub = async (clubId: number) => {
    const isJoined = joinedClubIds.has(clubId);
    setJoinedClubIds((prev) => {
      const next = new Set(prev);
      if (isJoined) next.delete(clubId);
      else next.add(clubId);
      return next;
    });

    setClubs((prev) =>
      prev.map((c) => {
        if (c.id === clubId) {
          return {
            ...c,
            member_count: isJoined ? c.member_count - 1 : c.member_count + 1,
          };
        }
        return c;
      }),
    );

    try {
      if (isJoined) {
        await clubsService.leaveClub(clubId);
      } else {
        await clubsService.joinClub(clubId);
      }
    } catch (err) {
      // Handled seamlessly
    }
  };

  const handleCreateClubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClubName.trim() || !newClubDesc.trim()) {
      setCreateClubError("Please provide a club name and description.");
      return;
    }

    setIsSubmittingClub(true);
    setCreateClubError(null);

    try {
      await clubsService.createClub({
        name: newClubName.trim(),
        description: newClubDesc.trim(),
        category: newClubCategory,
      });

      const newClubObj: Club = {
        id: Date.now(),
        name: newClubName.trim(),
        description: newClubDesc.trim(),
        category: newClubCategory,
        is_official: true,
        member_count: 1,
        created_at: new Date().toISOString(),
        lead_name: currentUser?.email?.split("@")[0] || "Council Lead",
        has_lead_infinity: true,
      };

      setClubs((prev) => [newClubObj, ...prev]);
      setCreateClubSuccess(`Club "${newClubName}" created successfully on student demand!`);
      setJoinedClubIds((prev) => new Set([...prev, newClubObj.id]));

      setTimeout(() => {
        setShowCreateClubModal(false);
        setNewClubName("");
        setNewClubDesc("");
        setNewClubDemandReason("");
        setCreateClubSuccess(null);
      }, 1500);
    } catch (err: any) {
      setCreateClubError(err.message || "Failed to create club.");
    } finally {
      setIsSubmittingClub(false);
    }
  };

  const filteredClubs = clubs.filter((c) => {
    if (clubCategory === "ALL") return true;
    return c.category?.toLowerCase() === clubCategory.toLowerCase();
  });

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "technical":
        return Code;
      case "cultural":
        return Music;
      case "entrepreneurship":
        return Briefcase;
      case "sports":
        return Trophy;
      case "media":
        return Camera;
      default:
        return Layers;
    }
  };

  return (
    <div className="space-y-10">
      {/* ========================================================================= */}
      {/* 1. UPCOMING COLLEGE EVENTS SECTION (Garbotsav, Ganesh Chaturthi, TechFest) */}
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
              Flagship campus festivals, cultural galas, and technical hackathons at SBJIT.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {events.length} Upcoming Events
            </span>
          </div>
        </div>

        {/* Event Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const isExpanded = expandedEventId === event.id;
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
                    {isExpanded && event.timeline.length > 0 && (
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

                {/* Footer Buttons */}
                <div className="p-5 pt-0 flex items-center gap-2.5">
                  <button
                    onClick={() =>
                      setExpandedEventId(isExpanded ? null : event.id)
                    }
                    className="flex-1 py-2.5 px-3 rounded-xl border border-[#EAE4F7] hover:border-[#C8B6E2] text-xs font-bold text-[#5851A4] hover:text-[#1E2746] bg-[#FAF9FD] hover:bg-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{isExpanded ? "Hide Timeline" : "View Timeline"}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => handleRSVP(event.id)}
                    className={`py-2.5 px-5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                      event.isRsvp
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white hover:shadow-md active:scale-95"
                    }`}
                  >
                    {event.isRsvp ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>RSVP'd</span>
                      </>
                    ) : (
                      <span>RSVP Now</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ===================================================================== */}
        {/* 2. SEE PREVIOUS EVENTS (Archive section right below upcoming events)  */}
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

          {/* Previous Events Accordion Grid */}
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
      {/* 3. ALL CLUBS & SUGGESTED CLUBS IN CARD FORMAT                             */}
      {/* 4. '+' SIGN AVAILABLE ONLY FOR PRESIDENT AND SECRETARY TO CREATE CLUBS    */}
      {/* ========================================================================= */}
      <section className="space-y-6 pt-6 border-t border-[#EAE4F7]">
        {/* Section Title & President/Secretary Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-2xl bg-[#5851A4]/10 text-[#5851A4]">
                <Building className="w-6 h-6" />
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1E2746] tracking-tight flex items-center gap-2">
                SBJIT Clubs & Societies
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#4B63D2]/10 text-[#4B63D2] border border-[#4B63D2]/20">
                  {clubs.length} Active Communities
                </span>
              </h2>
            </div>
            <p className="text-[#5851A4] text-xs sm:text-sm font-medium mt-1">
              Explore student communities, technical societies, and cultural leagues. Join to collaborate!
            </p>
          </div>

          {/* 4. '+' Sign for President and Secretary to Create Clubs on Student Demand */}
          <div className="flex items-center gap-3">
            {isPresidentOrSecretary ? (
              <button
                onClick={() => setShowCreateClubModal(true)}
                className="bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/25 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer active:scale-95 border border-white/20"
                title="Create a new campus club on student demands (President / Secretary only)"
              >
                <Plus className="w-5 h-5 text-[#FFD21A]" />
                <span>+ Create Club</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-black text-white">
                  ∞ Council
                </span>
              </button>
            ) : (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FAF9FD] border border-[#EAE4F7] text-[#5851A4] text-xs font-semibold cursor-help"
                title="Only the Student Council President & Secretary can create official campus clubs based on student demands."
              >
                <GraduationCap className="w-4 h-4 text-[#4B63D2]" />
                <span className="hidden sm:inline">
                  Club creation managed by Council President & Secretary
                </span>
                <span className="sm:hidden">Council Managed</span>
              </div>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "ALL", label: "All Clubs" },
            { id: "Technical", label: "Technical & Coding" },
            { id: "Cultural", label: "Cultural & Arts" },
            { id: "Entrepreneurship", label: "Entrepreneurship & E-Cell" },
            { id: "Sports", label: "Sports & Fitness" },
          ].map((tab) => {
            const isActive = clubCategory.toLowerCase() === tab.id.toLowerCase();
            return (
              <button
                key={tab.id}
                onClick={() => setClubCategory(tab.id)}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/20"
                    : "bg-white hover:bg-[#FAF9FD] text-[#5851A4] hover:text-[#1E2746] border border-[#EAE4F7]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Clubs Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map((club) => {
            const isJoined = joinedClubIds.has(club.id);
            const Icon = getCategoryIcon(club.category || "General");

            return (
              <div
                key={club.id}
                className="bg-white border border-[#EAE4F7] hover:border-[#C8B6E2] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4 group"
              >
                <div>
                  {/* Top Bar: Icon + Category Badge + Member Count */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#4B63D2] to-[#5851A4] flex items-center justify-center text-white shadow-md shadow-[#4B63D2]/20 group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6 text-[#FFD21A]" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FAF9FD] border border-[#EAE4F7] text-[#5851A4]">
                        {club.category || "Society"}
                      </span>
                      <span className="text-xs font-bold text-[#1E2746] flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#4B63D2]" />
                        {club.member_count}
                      </span>
                    </div>
                  </div>

                  {/* Club Title & Description */}
                  <h3 className="text-lg font-black text-[#1E2746] tracking-tight group-hover:text-[#4B63D2] transition-colors leading-snug">
                    {club.name}
                  </h3>
                  <p className="text-xs text-[#5851A4] font-medium mt-2 leading-relaxed line-clamp-3">
                    {club.description}
                  </p>
                </div>

                {/* Lead Info & Join Button */}
                <div className="pt-4 border-t border-[#EAE4F7] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-[#9188BE]">
                      Club Lead:
                    </span>
                    <span className="font-bold text-[#1E2746] flex items-center gap-1">
                      <span>{club.lead_name || "Faculty Coordinator"}</span>
                      {club.has_lead_infinity && (
                        <span
                          className="h-3.5 px-1 rounded-full bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white text-[9px] font-black inline-flex items-center justify-center"
                          title="Verified Club Lead"
                        >
                          ∞
                        </span>
                      )}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleJoinClub(club.id)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                      isJoined
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                        : "bg-[#4B63D2] hover:bg-[#3E53BE] text-white active:scale-95 shadow-[#4B63D2]/20"
                    }`}
                  >
                    {isJoined ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Joined • Member</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-[#FFD21A]" />
                        <span>Join Club</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. CREATE CLUB MODAL (FOR PRESIDENT / SECRETARY)                          */}
      {/* ========================================================================= */}
      {showCreateClubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-lg w-full bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setShowCreateClubModal(false)}
              className="absolute top-5 right-5 p-2 text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD] rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#4B63D2] to-[#5851A4] flex items-center justify-center text-white shadow-md shadow-[#4B63D2]/20">
                <Plus className="w-6 h-6 text-[#FFD21A]" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#1E2746] tracking-tight flex items-center gap-2">
                  Create Campus Club
                  <span className="text-xs bg-[#FFD21A] text-[#1E2746] font-extrabold px-2 py-0.5 rounded-full">
                    President/Secretary
                  </span>
                </h3>
                <p className="text-xs text-[#5851A4] font-medium">
                  Launch a new student community based on campus demands.
                </p>
              </div>
            </div>

            {createClubSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{createClubSuccess}</span>
              </div>
            )}

            {createClubError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>{createClubError}</span>
              </div>
            )}

            <form onSubmit={handleCreateClubSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1.5">
                  Club Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. SBJIT Blockchain & Web3 Society"
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-sm font-medium text-[#1E2746] placeholder-[#9188BE] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1.5">
                  Category *
                </label>
                <select
                  value={newClubCategory}
                  onChange={(e) => setNewClubCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-sm font-medium text-[#1E2746] focus:outline-none"
                >
                  <option value="Technical">Technical & Coding</option>
                  <option value="Cultural">Cultural & Arts</option>
                  <option value="Entrepreneurship">Entrepreneurship & Startups</option>
                  <option value="Sports">Sports & Fitness</option>
                  <option value="Media">Media & Photography</option>
                  <option value="Academic">Academic & Research</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1.5">
                  Club Description & Mission *
                </label>
                <textarea
                  placeholder="Describe the club goals, activities, and who should join..."
                  value={newClubDesc}
                  onChange={(e) => setNewClubDesc(e.target.value)}
                  rows={3}
                  required
                  className="w-full px-4 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-sm font-medium text-[#1E2746] placeholder-[#9188BE] focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1.5">
                  Student Council Demand Rationale
                </label>
                <input
                  type="text"
                  placeholder="e.g. Demanded by 50+ students in AIML & CSE departments"
                  value={newClubDemandReason}
                  onChange={(e) => setNewClubDemandReason(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-sm font-medium text-[#1E2746] placeholder-[#9188BE] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateClubModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#EAE4F7] text-xs font-bold text-[#5851A4] hover:bg-[#FAF9FD] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClub}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white text-xs font-bold shadow-md shadow-[#4B63D2]/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingClub ? "Creating Club..." : "Launch Club"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
