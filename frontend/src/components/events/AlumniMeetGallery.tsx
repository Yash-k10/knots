import React, { useState } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Search,
  Heart,
  Share2,
  Download,
  Plus,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  Award,
  Camera,
  Globe,
  Quote,
  Trash2,
  Upload,
  CheckSquare,
  Square,
  Video,
  Play,
  Layers,
  Image as ImageIcon,
} from "lucide-react";
import { getRoleNameById } from "../../utils/role";

export interface AlumniMeetMediaItem {
  id: string;
  url: string;
  mediaType: "photo" | "video";
  title: string;
  description?: string;
  uploadedBy?: string;
  uploadedRole?: string;
  uploadedAt?: string;
  likes: number;
  isLiked?: boolean;
}

export interface AlumniMeetEvent {
  id: string;
  title: string;
  edition: string;
  year: number;
  date: string;
  time?: string;
  batch: string;
  category: "Awards" | "Nostalgia" | "Gala & Dinner" | "Mentorship" | "Sports & Fun";
  description: string;
  location: string;
  attendeesCount: number;
  likes: number;
  isLiked?: boolean;
  coverImage: string;
  notableAttendees?: string[];
  tags: string[];
  media: AlumniMeetMediaItem[];
}

interface AlumniMeetGalleryProps {
  currentUser?: {
    id: number;
    email: string;
    role_id?: number;
    role?: { name: string };
    profile?: {
      first_name?: string | null;
      last_name?: string | null;
      department?: string | null;
    } | null;
  } | null;
}

const INITIAL_ALUMNI_MEETS: AlumniMeetEvent[] = [
  {
    id: "meet-homecoming-2025",
    title: "Annual Global Alumni Homecoming & Gala 2025",
    edition: "Homecoming 2025",
    year: 2025,
    date: "Saturday, Dec 20, 2025",
    time: "5:00 PM – 11:00 PM IST",
    batch: "Batches 2012 – 2024",
    category: "Gala & Dinner",
    description:
      "The flagship annual homecoming of SBJIT bringing together over 480 alumni from across the world. Features the grand lamp lighting, Distinguished Alumni Awards, campus innovation walk, and an unforgettable lawn banquet.",
    coverImage:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
    location: "Main Auditorium & Central Lawns, SBJIT Campus",
    attendeesCount: 480,
    likes: 245,
    notableAttendees: [
      "Dr. S. K. Mehta (Principal)",
      "Rajesh Sharma (VP Engg, Infosys)",
      "Anita Roy (MD, Accel)",
      "Vikas Patil (Founder, TensorScale)",
    ],
    tags: ["Homecoming", "Gala Dinner", "Excellence Awards", "Nostalgia"],
    media: [
      {
        id: "media-hc25-1",
        url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
        mediaType: "photo",
        title: "Grand Inaugural Deep Prajwalan & Lamp Lighting",
        description: "Auspicious lamp lighting by College Management and Alumni President to open the meet.",
        uploadedBy: "Prof. Deshpande (Faculty)",
        uploadedRole: "Faculty",
        uploadedAt: "Dec 20, 2025",
        likes: 89,
      },
      {
        id: "media-hc25-2",
        url: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
        mediaType: "photo",
        title: "Distinguished Alumni Excellence Awards Ceremony",
        description: "Honoring visionary alumni founders and chief architects who pioneered breakthrough AI startups.",
        uploadedBy: "Sneha Kulkarni (Alumni)",
        uploadedRole: "Alumni",
        uploadedAt: "Dec 20, 2025",
        likes: 124,
      },
      {
        id: "media-hc25-3",
        url: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80",
        mediaType: "photo",
        title: "Lawn Gala Banquet & Nostalgic Acoustic Evening",
        description: "Alumni, professors, and families reconnecting under fairy-lit lawns with acoustic melodies.",
        uploadedBy: "Alumni Association",
        uploadedRole: "Alumni",
        uploadedAt: "Dec 20, 2025",
        likes: 165,
      },
      {
        id: "media-hc25-4",
        url: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80",
        mediaType: "photo",
        title: "Campus Nostalgia Walk: Revisiting Computing & AI Labs",
        description: "Alumni walking down memory lane through the newly renovated AI clusters.",
        uploadedBy: "Rohan Verma (Student)",
        uploadedRole: "Student",
        uploadedAt: "Dec 20, 2025",
        likes: 95,
      },
      {
        id: "media-hc25-5",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        mediaType: "video",
        title: "Homecoming 2025 Highlights & Flashmob Reel",
        description: "Dynamic video recap capturing the student flashmob, amphitheatre roar, and alumni laughter.",
        uploadedBy: "Campus Media Club",
        uploadedRole: "Student",
        uploadedAt: "Dec 21, 2025",
        likes: 210,
      },
      {
        id: "media-hc25-6",
        url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
        mediaType: "photo",
        title: "Batch of 2015 Silver Circle Group Portrait",
        description: "Graduates of 2015 gathering on the heritage amphitheatre steps for their 10th reunion photo.",
        uploadedBy: "Batch Representative",
        uploadedRole: "Alumni",
        uploadedAt: "Dec 21, 2025",
        likes: 142,
      },
    ],
  },
  {
    id: "meet-conclave-2025",
    title: "Global Alumni Tech & Career Conclave 2025",
    edition: "Global Conclave 2025",
    year: 2025,
    date: "Saturday, Aug 16, 2025",
    time: "10:00 AM – 4:30 PM IST",
    batch: "Batches 2018 – 2024",
    category: "Mentorship",
    description:
      "An intensive mentorship and venture conclave connecting international and domestic tech alumni with students. Included off-campus referrals, portfolio clinics, and seed startup pitches.",
    coverImage:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    location: "Innovation & Incubation Hub, SBJIT",
    attendeesCount: 260,
    likes: 180,
    notableAttendees: [
      "Arjun Rao (Senior Lead, Amazon UK)",
      "Meera Sen (Tech Lead, Google)",
      "Venture Capitalist Alumni Cohort",
    ],
    tags: ["Mentorship", "Global Careers", "Startup Pitch", "Incubation"],
    media: [
      {
        id: "media-gc25-1",
        url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
        mediaType: "photo",
        title: "Mentorship Roundtables: Off-Campus & Global Referrals",
        description: "Interactive roundtables where Silicon Valley and London alumni mentored final year students.",
        uploadedBy: "Arjun Rao",
        uploadedRole: "Alumni",
        uploadedAt: "Aug 16, 2025",
        likes: 98,
      },
      {
        id: "media-gc25-2",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        mediaType: "video",
        title: "Keynote Address: Scaling AI from Campus to Cloud",
        description: "Alumni keynote lecture on modern cloud architecture, LLM fine-tuning, and early career growth.",
        uploadedBy: "Dept of CSE",
        uploadedRole: "Controller",
        uploadedAt: "Aug 16, 2025",
        likes: 154,
      },
      {
        id: "media-gc25-3",
        url: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80",
        mediaType: "photo",
        title: "Alumni Angel Investors & Venture Pitch Showcase",
        description: "Student ventures pitching to alumni angels, securing initial proof-of-concept incubation funding.",
        uploadedBy: "Incubation Cell",
        uploadedRole: "Faculty",
        uploadedAt: "Aug 16, 2025",
        likes: 112,
      },
      {
        id: "media-gc25-4",
        url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
        mediaType: "photo",
        title: "1-on-1 Student Resume & Portfolio Clinic",
        description: "Alumni conducting direct code reviews and resume audits for aspiring software developers.",
        uploadedBy: "Placement Committee",
        uploadedRole: "Student",
        uploadedAt: "Aug 16, 2025",
        likes: 87,
      },
    ],
  },
  {
    id: "meet-decennial-2024",
    title: "Decennial Milestone Reunion (Class of 2014)",
    edition: "Decennial Reunion",
    year: 2024,
    date: "Sunday, Nov 09, 2024",
    time: "11:00 AM – 8:00 PM IST",
    batch: "Class of 2014",
    category: "Nostalgia",
    description:
      "A monumental 10-year reunion for the Class of 2014! Over 110 classmates reunited from 6 nations to recreate their graduation photos, visit hostel corridors, and honor retired professors.",
    coverImage:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
    location: "Administrative Heritage Steps & Canteen Plaza",
    attendeesCount: 110,
    likes: 215,
    notableAttendees: ["Class of 2014 Mechanical, IT & CSE Batches", "Founding Faculty"],
    tags: ["10 Years", "Batch 2014", "Class Reunion", "Hostel Nostalgia"],
    media: [
      {
        id: "media-dr24-1",
        url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
        mediaType: "photo",
        title: "Class of 2014 Graduation Photo Re-creation",
        description: "Re-creating the legendary 2014 convocation photograph exactly 10 years later on the front steps.",
        uploadedBy: "Kavita Rao",
        uploadedRole: "Alumni",
        uploadedAt: "Nov 09, 2024",
        likes: 210,
      },
      {
        id: "media-dr24-2",
        url: "https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?auto=format&fit=crop&w=1200&q=80",
        mediaType: "photo",
        title: "Hostel Chai Canteen & Corridor Reminiscing",
        description: "Sharing hot chai and samosas while reliving late-night exams and hostel room banter.",
        uploadedBy: "Amit Roy",
        uploadedRole: "Alumni",
        uploadedAt: "Nov 09, 2024",
        likes: 135,
      },
      {
        id: "media-dr24-3",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        mediaType: "video",
        title: "Batch of 2014 Memory Reel & Nostalgia Video",
        description: "A heartfelt 10-year video documentary with old college footage and reunion messages.",
        uploadedBy: "Class Coordinator",
        uploadedRole: "Alumni",
        uploadedAt: "Nov 09, 2024",
        likes: 180,
      },
    ],
  },
  {
    id: "meet-silver-2024",
    title: "Silver Jubilee Alumni Reunion & Gala 2024",
    edition: "Silver Jubilee Meet 2024",
    year: 2024,
    date: "Saturday, Feb 24, 2024",
    time: "4:00 PM – 10:00 PM IST",
    batch: "Class of 1999 & Senior Alumni",
    category: "Awards",
    description:
      "Celebrating 25 years of engineering excellence for the pioneer batches of SBJIT. Honored veteran founding faculty, inaugurated the Silver Jubilee Wall of Fame, and celebrated lifelong friendships.",
    coverImage:
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80",
    location: "Seminar Hall 1 & Lawn Plaza, SBJIT",
    attendeesCount: 220,
    likes: 195,
    notableAttendees: ["Pioneer Batch of 1999", "Founding Faculty Emeritus"],
    tags: ["25 Years", "Silver Jubilee", "Faculty Honor", "Legacy"],
    media: [
      {
        id: "media-sj24-1",
        url: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80",
        mediaType: "photo",
        title: "Heartfelt Faculty Felicitation by Senior Alumni",
        description: "Emotional moments as senior alumni presented gratitude mementos to veteran department professors.",
        uploadedBy: "Dr. P. Joshi",
        uploadedRole: "Faculty",
        uploadedAt: "Feb 24, 2024",
        likes: 142,
      },
      {
        id: "media-sj24-2",
        url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80",
        mediaType: "photo",
        title: "Silver Jubilee Memorial Plaque Unveiling",
        description: "Permanent bronze plaque unveiled commemorating 25 years since the college's first graduation.",
        uploadedBy: "Central Admin",
        uploadedRole: "Central Admin",
        uploadedAt: "Feb 24, 2024",
        likes: 168,
      },
      {
        id: "media-sj24-3",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        mediaType: "video",
        title: "25-Year Campus Retrospective Video Documentary",
        description: "Archival footage spanning 1999 to 2024 showing the campus evolution and alumni journeys.",
        uploadedBy: "Archives Dept",
        uploadedRole: "Controller",
        uploadedAt: "Feb 24, 2024",
        likes: 192,
      },
    ],
  },
  {
    id: "meet-sports-2024",
    title: "Alumni vs Students Friendly Cricket Cup & Sports Fiesta",
    edition: "Annual Alumni Gala 2023",
    year: 2023,
    date: "Sunday, Dec 10, 2023",
    time: "9:00 AM – 3:00 PM IST",
    batch: "All Batches & Students",
    category: "Sports & Fun",
    description:
      "High energy friendly match on the college sports pavilion turf! Alumni XI faced current final-year student athletes in an electric T20 friendly match followed by sports high tea.",
    coverImage:
      "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1200&q=80",
    location: "College Cricket Pavilion Ground",
    attendeesCount: 340,
    likes: 178,
    notableAttendees: ["Alumni XI Captain: Rohit V.", "Sports Director", "Student Council"],
    tags: ["Cricket", "Sports Fiesta", "Friendly Match", "Pavilion"],
    media: [
      {
        id: "media-sp23-1",
        url: "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1200&q=80",
        mediaType: "photo",
        title: "Alumni XI Lifting the Rolling Cricket Trophy",
        description: "The victorious Alumni XI lifting the trophy after a thrilling final over finish.",
        uploadedBy: "Rohit V. (Alumni XI)",
        uploadedRole: "Alumni",
        uploadedAt: "Dec 10, 2023",
        likes: 178,
      },
      {
        id: "media-sp23-2",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        mediaType: "video",
        title: "Final Super-Over Thriller & Winning Moments",
        description: "Match highlights of the final over drama with cheering alumni on the pavilion boundaries.",
        uploadedBy: "Student Sports Lead",
        uploadedRole: "Student",
        uploadedAt: "Dec 10, 2023",
        likes: 205,
      },
    ],
  },
];

const NOSTALGIA_VOICES = [
  {
    quote:
      "Stepping back into the campus lawns after 8 years felt like going home. Seeing our old project lab transformed into a high-performance AI lab while preserving the same warmth and camaraderie was unforgettable.",
    author: "Rohan Kulkarni",
    role: "Senior Engineering Manager, Uber",
    batch: "Class of 2016 (CSE)",
  },
  {
    quote:
      "The Alumni Meet is where networks turn into lifelong friendships. Our batch pledged an annual scholarship for economically challenged engineering students during the 2025 gala dinner.",
    author: "Pooja Deshmukh",
    role: "Founder & CTO, CloudMatrix",
    batch: "Class of 2014 (IT)",
  },
  {
    quote:
      "Connecting with current final-year students at the Mentorship Conclave was rewarding. We referred 4 bright graduates into our product team right after the session!",
    author: "Aditya Verma",
    role: "Staff Software Architect, Microsoft",
    batch: "Class of 2018 (AIML)",
  },
];

export default function AlumniMeetGallery({ currentUser }: AlumniMeetGalleryProps) {
  const roleName = currentUser?.role?.name?.toLowerCase().trim() || "";
  const isExecutiveObserver = ["ceo", "dean", "principal"].includes(roleName);
  const isAlumni =
    !isExecutiveObserver &&
    (roleName === "alumni" ||
      currentUser?.role_id === 4 ||
      (currentUser?.role_id ? getRoleNameById(currentUser.role_id).toLowerCase() === "alumni" : false));

  const isController =
    !isExecutiveObserver &&
    (roleName === "controller" ||
      currentUser?.role_id === 6 ||
      (currentUser?.role_id ? getRoleNameById(currentUser.role_id).toLowerCase() === "controller" : false));

  const isCentralAdmin =
    !isExecutiveObserver &&
    (roleName.includes("admin") ||
      currentUser?.role_id === 1 ||
      currentUser?.role_id === 5);

  // Controller and Central Admin have deletion powers
  const canDeleteMedia = !isExecutiveObserver && (isController || isCentralAdmin);

  // Meets Data State
  const [alumniMeets, setAlumniMeets] = useState<AlumniMeetEvent[]>(INITIAL_ALUMNI_MEETS);
  const [selectedEdition, setSelectedEdition] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Meet Media Viewer / Lightbox State
  const [activeMeetModal, setActiveMeetModal] = useState<AlumniMeetEvent | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);

  // Multi-delete Selection within an Alumni Meet
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);

  // Post Alumni Event Modal State (For Controller / Admin)
  const [showPostEventModal, setShowPostEventModal] = useState<boolean>(false);
  const [postEventTitle, setPostEventTitle] = useState<string>("");
  const [postEventEdition, setPostEventEdition] = useState<string>("Homecoming 2026");
  const [postEventDate, setPostEventDate] = useState<string>("");
  const [postEventTime, setPostEventTime] = useState<string>("5:00 PM – 10:00 PM IST");
  const [postEventBatch, setPostEventBatch] = useState<string>("All Batches");
  const [postEventLocation, setPostEventLocation] = useState<string>("SBJIT Main Amphitheatre & Lawn Plaza");
  const [postEventAttendees, setPostEventAttendees] = useState<number>(300);
  const [postEventCategory, setPostEventCategory] = useState<AlumniMeetEvent["category"]>("Gala & Dinner");
  const [postEventCoverUrl, setPostEventCoverUrl] = useState<string>("");
  const [postEventDescription, setPostEventDescription] = useState<string>("");
  const [postEventSuccessMsg, setPostEventSuccessMsg] = useState<string | null>(null);

  // Upload Media Modal State (Open to EVERYONE)
  const [showUploadMediaModal, setShowUploadMediaModal] = useState<boolean>(false);
  const [targetMeetId, setTargetMeetId] = useState<string>("");
  const [mediaTypeInput, setMediaTypeInput] = useState<"photo" | "video">("photo");
  const [uploadMediaTitle, setUploadMediaTitle] = useState<string>("");
  const [uploadMediaDesc, setUploadMediaDesc] = useState<string>("");
  const [uploadMediaUrl, setUploadMediaUrl] = useState<string>("");
  const [uploadMediaFile, setUploadMediaFile] = useState<File | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  // Homecoming RSVP for Alumni
  const [homecomingRsvpStatus, setHomecomingRsvpStatus] = useState<"ATTENDING" | "MAYBE" | null>(null);
  const [homecomingRsvpMsg, setHomecomingRsvpMsg] = useState<string | null>(null);

  // Handle RSVP
  const handleHomecomingRsvp = (status: "ATTENDING" | "MAYBE") => {
    setHomecomingRsvpStatus(status);
    if (status === "ATTENDING") {
      setHomecomingRsvpMsg("🎉 You're confirmed for Homecoming 2026! We can't wait to see you back on campus.");
    } else {
      setHomecomingRsvpMsg("📝 Marked as tentative. We'll send you reminders as Homecoming 2026 approaches.");
    }
    setTimeout(() => setHomecomingRsvpMsg(null), 3500);
  };

  // Filtered Meets
  const editionsList = ["All", ...Array.from(new Set(alumniMeets.map((m) => m.edition)))];
  const categoriesList = ["All", "Awards", "Nostalgia", "Gala & Dinner", "Mentorship", "Sports & Fun"];

  const filteredMeets = alumniMeets.filter((meet) => {
    const matchesEdition = selectedEdition === "All" || meet.edition === selectedEdition;
    const matchesCategory = selectedCategory === "All" || meet.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      meet.title.toLowerCase().includes(q) ||
      meet.edition.toLowerCase().includes(q) ||
      meet.batch.toLowerCase().includes(q) ||
      meet.location.toLowerCase().includes(q) ||
      meet.description.toLowerCase().includes(q) ||
      meet.tags.some((t) => t.toLowerCase().includes(q)) ||
      meet.media.some((m) => m.title.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q));

    return matchesEdition && matchesCategory && matchesQuery;
  });

  // Toggle Meet Like
  const handleToggleMeetLike = (meetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAlumniMeets((prev) =>
      prev.map((meet) => {
        if (meet.id === meetId) {
          const isLiked = !meet.isLiked;
          return {
            ...meet,
            isLiked,
            likes: isLiked ? meet.likes + 1 : Math.max(0, meet.likes - 1),
          };
        }
        return meet;
      })
    );
  };

  // Open Media Viewer for a specific meet and optional media index
  const handleOpenMeetMedia = (meet: AlumniMeetEvent, mediaIdx: number = 0) => {
    setActiveMeetModal(meet);
    setActiveMediaIndex(Math.max(0, Math.min(mediaIdx, meet.media.length - 1)));
    setIsSelectionMode(false);
    setSelectedMediaIds([]);
  };

  const handlePrevMedia = () => {
    if (!activeMeetModal || activeMeetModal.media.length === 0) return;
    setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : activeMeetModal.media.length - 1));
  };

  const handleNextMedia = () => {
    if (!activeMeetModal || activeMeetModal.media.length === 0) return;
    setActiveMediaIndex((prev) => (prev < activeMeetModal.media.length - 1 ? prev + 1 : 0));
  };

  // Open Upload Media modal for a specific meet
  const handleOpenUploadForMeet = (meetId?: string) => {
    if (isExecutiveObserver) return;
    const idToUse = meetId || (alumniMeets.length > 0 ? alumniMeets[0].id : "");
    setTargetMeetId(idToUse);
    setUploadMediaTitle("");
    setUploadMediaDesc("");
    setUploadMediaUrl("");
    setUploadMediaFile(null);
    setMediaTypeInput("photo");
    setUploadSuccessMsg(null);
    setShowUploadMediaModal(true);
  };

  // File change handler for Media upload
  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadMediaFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setUploadMediaUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Media Upload (Photos / Videos) into a specific Alumni Meet
  const handleSaveMediaUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadMediaTitle.trim() || !targetMeetId) return;

    const defaultFallbackUrl =
      mediaTypeInput === "video"
        ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
        : "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80";

    const userUploaderName = currentUser?.profile?.first_name
      ? `${currentUser.profile.first_name} ${currentUser.profile.last_name || ""}`.trim()
      : currentUser?.email?.split("@")[0] || "Campus Member";

    const newMediaItem: AlumniMeetMediaItem = {
      id: `media-${Date.now()}`,
      url: uploadMediaUrl.trim() || defaultFallbackUrl,
      mediaType: mediaTypeInput,
      title: uploadMediaTitle.trim(),
      description: uploadMediaDesc.trim() || `Alumni meet ${mediaTypeInput} uploaded by ${userUploaderName}.`,
      uploadedBy: userUploaderName,
      uploadedRole: roleName ? roleName.toUpperCase() : "MEMBER",
      uploadedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      likes: 0,
      isLiked: false,
    };

    setAlumniMeets((prev) =>
      prev.map((meet) => {
        if (meet.id === targetMeetId) {
          return {
            ...meet,
            media: [newMediaItem, ...meet.media],
          };
        }
        return meet;
      })
    );

    // If viewing this meet, update the active modal too
    if (activeMeetModal && activeMeetModal.id === targetMeetId) {
      setActiveMeetModal((prev) =>
        prev ? { ...prev, media: [newMediaItem, ...prev.media] } : null
      );
    }

    setUploadSuccessMsg(
      `${mediaTypeInput === "video" ? "Video" : "Photo"} uploaded successfully to this Alumni Meet!`
    );

    setTimeout(() => {
      setShowUploadMediaModal(false);
      setUploadSuccessMsg(null);
      setUploadMediaTitle("");
      setUploadMediaDesc("");
      setUploadMediaUrl("");
      setUploadMediaFile(null);
    }, 1200);
  };

  // Controller / Admin: Delete a single photo or video from an Alumni Meet
  const handleDeleteMediaItem = (meetId: string, mediaId: string) => {
    if (!canDeleteMedia) return;
    if (!window.confirm("Are you sure you want to delete this photo/video from this Alumni Meet?")) {
      return;
    }

    setAlumniMeets((prev) =>
      prev.map((m) => {
        if (m.id === meetId) {
          return {
            ...m,
            media: m.media.filter((item) => item.id !== mediaId),
          };
        }
        return m;
      })
    );

    if (activeMeetModal && activeMeetModal.id === meetId) {
      const updatedMedia = activeMeetModal.media.filter((item) => item.id !== mediaId);
      if (updatedMedia.length === 0) {
        setActiveMeetModal(null);
      } else {
        setActiveMeetModal({ ...activeMeetModal, media: updatedMedia });
        setActiveMediaIndex((prev) => Math.min(prev, updatedMedia.length - 1));
      }
    }

    setSelectedMediaIds((prev) => prev.filter((id) => id !== mediaId));
    alert("Media item deleted successfully.");
  };

  // Controller / Admin: Delete Selected photos/videos in bulk
  const handleDeleteSelectedMedia = (meetId: string) => {
    if (!canDeleteMedia || selectedMediaIds.length === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to delete the ${selectedMediaIds.length} selected photos/videos from this Alumni Meet?`
      )
    ) {
      return;
    }

    const count = selectedMediaIds.length;
    setAlumniMeets((prev) =>
      prev.map((m) => {
        if (m.id === meetId) {
          return {
            ...m,
            media: m.media.filter((item) => !selectedMediaIds.includes(item.id)),
          };
        }
        return m;
      })
    );

    if (activeMeetModal && activeMeetModal.id === meetId) {
      const updatedMedia = activeMeetModal.media.filter((item) => !selectedMediaIds.includes(item.id));
      if (updatedMedia.length === 0) {
        setActiveMeetModal(null);
      } else {
        setActiveMeetModal({ ...activeMeetModal, media: updatedMedia });
        setActiveMediaIndex(0);
      }
    }

    setSelectedMediaIds([]);
    setIsSelectionMode(false);
    alert(`${count} media items have been deleted.`);
  };

  // Controller / Admin: Delete entire Alumni Meet Event
  const handleDeleteMeetEvent = (meetId: string, meetTitle: string) => {
    if (!canDeleteMedia) return;
    if (
      !window.confirm(
        `Are you sure you want to permanently delete the alumni meet event: "${meetTitle}" and all its photos & videos?`
      )
    ) {
      return;
    }

    setAlumniMeets((prev) => prev.filter((m) => m.id !== meetId));
    if (activeMeetModal?.id === meetId) {
      setActiveMeetModal(null);
    }
    alert(`Alumni Meet event "${meetTitle}" deleted successfully.`);
  };

  // Controller / Admin: Submit Post Alumni Event
  const handleSavePostAlumniEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postEventTitle.trim()) return;

    const defaultCover =
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80";

    const newMeet: AlumniMeetEvent = {
      id: `meet-event-${Date.now()}`,
      title: postEventTitle.trim(),
      edition: postEventEdition.trim() || "Homecoming 2026",
      year: new Date().getFullYear() + 1,
      date: postEventDate.trim() || "Saturday, Dec 19, 2026",
      time: postEventTime.trim() || "5:00 PM – 10:00 PM IST",
      batch: postEventBatch.trim() || "All Alumni Batches",
      category: postEventCategory,
      description:
        postEventDescription.trim() ||
        "Official Alumni Meet bringing together distinguished graduates, faculty, and current students for an evening of reconnection and celebration.",
      location: postEventLocation.trim() || "SBJIT Main Amphitheatre & Lawn Plaza",
      attendeesCount: postEventAttendees || 250,
      likes: 0,
      isLiked: false,
      coverImage: postEventCoverUrl.trim() || defaultCover,
      tags: [postEventEdition, postEventCategory, "Alumni Meet"],
      media: [], // Empty initially, everyone can upload photos and videos!
    };

    setAlumniMeets((prev) => [newMeet, ...prev]);
    setPostEventSuccessMsg("Alumni Meet event posted successfully! Attendees can now upload photos and videos.");

    setTimeout(() => {
      setShowPostEventModal(false);
      setPostEventSuccessMsg(null);
      setPostEventTitle("");
      setPostEventDate("");
      setPostEventDescription("");
      setPostEventCoverUrl("");
    }, 1200);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. HERO BANNER: DEDICATED ALUMNI REUNION & MEET ARCHIVE                   */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E2746] via-[#2D1B69] to-[#4B63D2] text-white p-7 sm:p-10 shadow-xl border border-white/10">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-amber-300 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {currentUser?.profile?.first_name ? `Welcome, ${currentUser.profile.first_name} • ` : ""}
                {isController
                  ? "Department Controller Portal • Official Alumni Meet Events & Media Archives"
                  : "Official SBJIT Alumni Association • Exclusive Alumni Meets & Moments"}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Alumni Meets &amp; Reunion Gallery
            </h1>

            <p className="text-sm sm:text-base text-white/80 font-medium leading-relaxed">
              Explore past Alumni Meets, celebrate milestones, and browse all photos and video reels of each reunion.
              Students, faculty, alumni, and controllers can upload photos and videos to any meet.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* If Controller / Admin: Quick Post Alumni Event */}
              {canDeleteMedia && (
                <button
                  onClick={() => setShowPostEventModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#1E2746] text-xs font-black shadow-lg shadow-amber-400/25 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Post Alumni Event</span>
                </button>
              )}

              {/* Upload Media to any meet (Open to everyone except observers) */}
              {!isExecutiveObserver && (
                <button
                  onClick={() => handleOpenUploadForMeet()}
                  className="px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 backdrop-blur-md text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Media</span>
                </button>
              )}

              {isAlumni && (
                <button
                  onClick={() => {
                    const el = document.getElementById("homecoming-spotlight");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-amber-300" />
                  <span>Homecoming 2026 RSVP</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Pillar */}
          <div className="grid grid-cols-2 gap-3.5 sm:gap-4 shrink-0 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15">
            <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-2xl sm:text-3xl font-black text-amber-300">{alumniMeets.length}</div>
              <div className="text-[11px] font-bold text-white/75 mt-0.5 uppercase tracking-wider">
                Alumni Meets
              </div>
            </div>

            <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-2xl sm:text-3xl font-black text-emerald-300">
                {alumniMeets.reduce((acc, m) => acc + m.media.length, 0)}+
              </div>
              <div className="text-[11px] font-bold text-white/75 mt-0.5 uppercase tracking-wider">
                Photos &amp; Videos
              </div>
            </div>

            <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-2xl sm:text-3xl font-black text-blue-300">4,200+</div>
              <div className="text-[11px] font-bold text-white/75 mt-0.5 uppercase tracking-wider">
                Alumni Attended
              </div>
            </div>

            <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-2xl sm:text-3xl font-black text-purple-300">8</div>
              <div className="text-[11px] font-bold text-white/75 mt-0.5 uppercase tracking-wider">
                Global Chapters
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. UPCOMING ALUMNI MEET SPOTLIGHT (HOMECOMING 2026)                       */}
      {/* ========================================================================= */}
      <section
        id="homecoming-spotlight"
        className="bg-white border-2 border-amber-300/80 rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden space-y-6"
      >
        <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-orange-500 text-white text-[11px] font-black uppercase tracking-wider py-1.5 px-6 rounded-bl-2xl shadow-sm">
          🌟 Next Flagship Alumni Meet
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-2">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Exclusive Alumni Invitation • Save the Date</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-[#1E2746]">
              Annual Global Alumni Homecoming &amp; Gala 2026
            </h2>

            <p className="text-xs sm:text-sm text-[#5851A4] leading-relaxed font-medium">
              Join fellow alumni from batches 2012 to 2025 for an unforgettable weekend of
              nostalgia, the Distinguished Alumni Awards, campus innovation tours, and a grand lawn
              cocktail dinner.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-[#1E2746] pt-1">
              <div className="flex items-center gap-1.5 bg-[#FAF9FD] px-3 py-1.5 rounded-xl border border-[#EAE4F7]">
                <Calendar className="w-4 h-4 text-[#4B63D2]" />
                <span>Saturday, December 19, 2026</span>
              </div>

              <div className="flex items-center gap-1.5 bg-[#FAF9FD] px-3 py-1.5 rounded-xl border border-[#EAE4F7]">
                <Clock className="w-4 h-4 text-[#4B63D2]" />
                <span>5:00 PM – 11:00 PM IST</span>
              </div>

              <div className="flex items-center gap-1.5 bg-[#FAF9FD] px-3 py-1.5 rounded-xl border border-[#EAE4F7]">
                <MapPin className="w-4 h-4 text-[#4B63D2]" />
                <span>SBJIT Main Amphitheatre &amp; Lawn Plaza</span>
              </div>

              <div className="flex items-center gap-1.5 bg-[#FAF9FD] px-3 py-1.5 rounded-xl border border-[#EAE4F7]">
                <Users className="w-4 h-4 text-[#4B63D2]" />
                <span>450+ Confirmed Alumni</span>
              </div>
            </div>
          </div>

          {/* Right Card: Alumni RSVP for Alumni ONLY; Post Alumni Event for Controller & Central Admin */}
          {isAlumni ? (
            <div className="bg-gradient-to-br from-[#FAF9FD] to-[#EAE4F7]/40 p-5 rounded-2xl border border-[#D5CBEE] flex flex-col justify-between space-y-4 shrink-0 lg:w-72">
              <div>
                <div className="text-xs font-black uppercase text-[#1E2746] tracking-wider">
                  Alumni RSVP Status
                </div>
                <p className="text-[11px] text-[#5851A4] mt-1">
                  Confirm your attendance early for personalized badges and alumni kit.
                </p>
              </div>

              {homecomingRsvpMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{homecomingRsvpMsg}</span>
                </div>
              )}

              <div className="space-y-2">
                <button
                  onClick={() => handleHomecomingRsvp("ATTENDING")}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                    homecomingRsvpStatus === "ATTENDING"
                      ? "bg-emerald-600 text-white shadow-emerald-600/20"
                      : "bg-[#4B63D2] hover:bg-[#3E53BE] text-white shadow-[#4B63D2]/20"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {homecomingRsvpStatus === "ATTENDING"
                      ? "✓ You're Attending"
                      : "I Will Attend (RSVP)"}
                  </span>
                </button>

                <button
                  onClick={() => handleHomecomingRsvp("MAYBE")}
                  className={`w-full py-2 px-4 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    homecomingRsvpStatus === "MAYBE"
                      ? "bg-amber-100 border-amber-300 text-amber-900"
                      : "bg-white border-[#D5CBEE] text-[#5851A4] hover:bg-[#FAF9FD]"
                  }`}
                >
                  <span>{homecomingRsvpStatus === "MAYBE" ? "Marked as Maybe" : "Tentative / Maybe"}</span>
                </button>
              </div>
            </div>
          ) : (
            /* EXACT SPOTLIGHT CARD FROM USER SCREENSHOT: Replaced 'Post Photo to Gallery' with 'Post Alumni Event' */
            <div className="bg-gradient-to-br from-[#FAF9FD] to-[#EAE4F7]/40 p-5 rounded-2xl border border-[#D5CBEE] flex flex-col justify-between space-y-4 shrink-0 lg:w-72">
              <div>
                <div className="text-xs font-black uppercase text-[#1E2746] tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#4B63D2]" />
                  <span>Alumni Event Management</span>
                </div>
                <p className="text-[11px] text-[#5851A4] mt-1.5 font-medium leading-relaxed">
                  Controller &amp; Campus View. Create official alumni meet events and manage reunion archives.
                </p>
              </div>

              <button
                onClick={() => setShowPostEventModal(true)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-black bg-[#4B63D2] hover:bg-[#3E53BE] text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Post Alumni Event</span>
              </button>
            </div>
          )}
        </div>

        {/* Highlights Pillows */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-amber-200/60">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200">
            <Award className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <div className="text-xs font-black text-[#1E2746]">Distinguished Awards</div>
              <div className="text-[10px] text-[#5851A4]">Honoring Tech &amp; CXO Leaders</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50/70 border border-blue-200">
            <Users className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <div className="text-xs font-black text-[#1E2746]">Mentorship Roundtable</div>
              <div className="text-[10px] text-[#5851A4]">Student &amp; Startup Guidance</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-50/70 border border-purple-200">
            <Camera className="w-5 h-5 text-purple-600 shrink-0" />
            <div>
              <div className="text-xs font-black text-[#1E2746]">Campus Nostalgia Walk</div>
              <div className="text-[10px] text-[#5851A4]">AI Supercluster &amp; Labs</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <Globe className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="text-xs font-black text-[#1E2746]">Lawn Gala Banquet</div>
              <div className="text-[10px] text-[#5851A4]">Live Music &amp; Cocktail Dinner</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. ALUMNI MEETS CONTROLS & SEARCH                                         */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-[#1E2746] flex items-center gap-2">
              <Calendar className="w-6 h-6 text-[#4B63D2]" />
              <span>Official Alumni Meets &amp; Photo/Video Collections</span>
            </h3>
            <p className="text-xs text-[#5851A4] font-medium mt-0.5">
              Each card below contains all the photos and videos of that particular Alumni Meet.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search bar */}
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-[#9188BE] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search meets, batches, media..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-white border border-[#D5CBEE] focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none shadow-sm"
              />
            </div>

            {/* Post Alumni Event Button (Controller / Central Admin) */}
            {canDeleteMedia && (
              <button
                onClick={() => setShowPostEventModal(true)}
                className="px-3.5 py-2 rounded-xl bg-[#4B63D2] hover:bg-[#3E53BE] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Post Alumni Event</span>
              </button>
            )}

            {/* Upload Media Button */}
            {!isExecutiveObserver && (
              <button
                onClick={() => handleOpenUploadForMeet()}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Media</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#4B63D2] text-white shadow-sm"
                    : "bg-white border border-[#EAE4F7] text-[#5851A4] hover:bg-[#FAF9FD]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Meet Edition Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#5851A4]">Edition:</span>
            <select
              value={selectedEdition}
              onChange={(e) => setSelectedEdition(e.target.value)}
              className="px-3 py-1.5 bg-white border border-[#D5CBEE] focus:border-[#4B63D2] rounded-xl text-xs font-bold text-[#1E2746] focus:outline-none cursor-pointer shadow-xs"
            >
              {editionsList.map((ed) => (
                <option key={ed} value={ed}>
                  {ed === "All" ? "All Meet Editions" : ed}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. ALUMNI MEET CARDS (EACH CARD CONTAINS ALL PHOTOS & VIDEOS OF THAT MEET) */}
      {/* ========================================================================= */}
      <section className="space-y-6">
        {filteredMeets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
            {filteredMeets.map((meet) => {
              const photoCount = meet.media.filter((m) => m.mediaType === "photo").length;
              const videoCount = meet.media.filter((m) => m.mediaType === "video").length;
              const featuredCover = meet.media.length > 0 ? meet.media[0].url : meet.coverImage;
              const hasVideo = meet.media.some((m) => m.mediaType === "video");

              return (
                <div
                  key={meet.id}
                  className="bg-white border border-[#EAE4F7] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-[#D5CBEE] transition-all duration-300 flex flex-col justify-between group"
                >
                  {/* Card Top: Cover Preview */}
                  <div>
                    <div
                      className="relative h-60 sm:h-64 w-full bg-slate-950 overflow-hidden cursor-pointer"
                      onClick={() => handleOpenMeetMedia(meet, 0)}
                    >
                      <img
                        src={featuredCover}
                        alt={meet.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-95"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/90 text-[#1E2746] shadow-sm backdrop-blur-md">
                            {meet.edition}
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#4B63D2]/90 text-white shadow-sm backdrop-blur-md">
                            {meet.category}
                          </span>
                        </div>

                        {/* Media Counter Badge */}
                        <div className="flex items-center gap-1.5">
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-sm flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-amber-300" />
                            <span>{photoCount} Photos</span>
                            {videoCount > 0 && (
                              <>
                                <span>•</span>
                                <Video className="w-3.5 h-3.5 text-emerald-300" />
                                <span>{videoCount} Videos</span>
                              </>
                            )}
                          </span>

                          {/* Controller / Central Admin Delete Meet Button */}
                          {canDeleteMedia && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMeetEvent(meet.id, meet.title);
                              }}
                              className="p-1.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-full shadow-md transition cursor-pointer"
                              title="Delete this entire Alumni Meet (Controller / Admin)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Overlay Play Indicator if meet contains videos */}
                      {hasVideo && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-12 h-12 rounded-full bg-white/25 backdrop-blur-md border border-white/40 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                            <Play className="w-5 h-5 fill-white ml-0.5" />
                          </div>
                        </div>
                      )}

                      {/* Bottom Title on Image */}
                      <div className="absolute bottom-3.5 left-4 right-4">
                        <span className="text-xs font-black text-amber-300 block mb-0.5 drop-shadow-sm">
                          🎓 {meet.batch}
                        </span>
                        <h4 className="text-lg sm:text-xl font-black text-white leading-snug drop-shadow-md">
                          {meet.title}
                        </h4>
                      </div>
                    </div>

                    {/* Photos & Videos Thumbnails of THIS PARTICULAR Alumni Meet */}
                    <div className="p-4 bg-[#FAF9FD] border-b border-[#EAE4F7] space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#5851A4]">
                        <span className="flex items-center gap-1.5 text-[#1E2746]">
                          <Layers className="w-3.5 h-3.5 text-[#4B63D2]" />
                          <span>Meet Media ({meet.media.length} items)</span>
                        </span>
                        <span>Click any thumbnail to inspect</span>
                      </div>

                      {meet.media.length > 0 ? (
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                          {meet.media.slice(0, 5).map((med, idx) => (
                            <div
                              key={med.id}
                              onClick={() => handleOpenMeetMedia(meet, idx)}
                              className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-[#D5CBEE] hover:border-[#4B63D2] cursor-pointer group/thumb transition"
                              title={med.title}
                            >
                              <img
                                src={med.url}
                                alt={med.title}
                                className="w-full h-full object-cover group-hover/thumb:scale-110 transition duration-300"
                              />
                              {med.mediaType === "video" && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                                  <Play className="w-3.5 h-3.5 fill-white" />
                                </div>
                              )}
                              {idx === 4 && meet.media.length > 5 && (
                                <div className="absolute inset-0 bg-slate-950/75 flex items-center justify-center text-white text-xs font-black">
                                  +{meet.media.length - 5}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-[#9188BE] italic py-1">
                          No photos or videos uploaded yet. Click "Upload Media" below to contribute!
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-3">
                      <p className="text-xs text-[#5851A4] leading-relaxed line-clamp-2 font-medium">
                        {meet.description}
                      </p>

                      <div className="flex items-center justify-between text-xs text-[#5851A4] pt-1">
                        <span className="flex items-center gap-1.5 font-medium truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#4B63D2] shrink-0" />
                          <span className="truncate">{meet.location}</span>
                        </span>

                        <span className="flex items-center gap-1 font-bold text-[#1E2746] shrink-0">
                          <Users className="w-3.5 h-3.5 text-[#5851A4]" />
                          {meet.attendeesCount} Alumni
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="px-5 pb-5 pt-3 border-t border-[#EAE4F7] flex items-center justify-between gap-2 flex-wrap">
                    {/* Like button */}
                    <button
                      onClick={(e) => handleToggleMeetLike(meet.id, e)}
                      className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        meet.isLiked
                          ? "bg-rose-50 border-rose-200 text-rose-600"
                          : "bg-white border-[#EAE4F7] text-[#5851A4] hover:text-rose-600"
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${meet.isLiked ? "fill-rose-500 text-rose-500" : ""}`}
                      />
                      <span>{meet.likes}</span>
                    </button>

                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {/* Upload Media to THIS specific Alumni Meet */}
                      {!isExecutiveObserver && (
                        <button
                          type="button"
                          onClick={() => handleOpenUploadForMeet(meet.id)}
                          className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Upload photos or videos to this Alumni Meet"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Media</span>
                        </button>
                      )}

                      {/* View Full Photos & Videos Gallery of this meet */}
                      <button
                        type="button"
                        onClick={() => handleOpenMeetMedia(meet, 0)}
                        className="px-3.5 py-2 bg-[#4B63D2] hover:bg-[#3E53BE] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>View Media ({meet.media.length})</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-12 text-center space-y-3">
            <Camera className="w-12 h-12 text-[#9188BE] mx-auto" />
            <h4 className="text-base font-bold text-[#1E2746]">No Alumni Meets Found</h4>
            <p className="text-xs text-[#5851A4]">
              No meets matched your selected filters or search query. Try resetting filters.
            </p>
            <button
              onClick={() => {
                setSelectedEdition("All");
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="mt-2 px-4 py-2 bg-[#4B63D2] text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 5. VOICES OF NOSTALGIA: ALUMNI REFLECTIONS & QUOTES                       */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-br from-[#FAF9FD] to-[#EAE4F7]/30 border border-[#EAE4F7] rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2">
          <Quote className="w-5 h-5 text-[#4B63D2]" />
          <div>
            <h3 className="text-lg sm:text-xl font-black text-[#1E2746]">
              Voices of Nostalgia &amp; Reflections
            </h3>
            <p className="text-xs text-[#5851A4]">
              What returning to campus and meeting classmates means to our alumni fraternity.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {NOSTALGIA_VOICES.map((v, i) => (
            <div
              key={i}
              className="bg-white border border-[#EAE4F7] p-5 rounded-2xl space-y-4 shadow-sm flex flex-col justify-between"
            >
              <p className="text-xs text-[#1E2746] leading-relaxed italic font-medium">
                "{v.quote}"
              </p>

              <div className="pt-3 border-t border-[#EAE4F7]">
                <div className="text-xs font-black text-[#1E2746]">{v.author}</div>
                <div className="text-[11px] text-[#4B63D2] font-bold">{v.role}</div>
                <div className="text-[10px] text-[#9188BE] font-medium mt-0.5">{v.batch}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. MEET MEDIA VIEWER / LIGHTBOX (PHOTOS & VIDEOS FOR SELECTED MEET)        */}
      {/* ========================================================================= */}
      {activeMeetModal && activeMeetModal.media.length > 0 && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-200">
            {/* Top Modal Bar */}
            <div className="p-4 sm:px-6 border-b border-[#EAE4F7] flex items-center justify-between shrink-0 bg-[#FAF9FD]">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#4B63D2] text-white">
                  {activeMeetModal.edition}
                </span>
                <div>
                  <h4 className="text-sm font-black text-[#1E2746] line-clamp-1">
                    {activeMeetModal.title}
                  </h4>
                  <span className="text-[11px] font-bold text-[#5851A4]">
                    Item {activeMediaIndex + 1} of {activeMeetModal.media.length} ({activeMeetModal.media[activeMediaIndex].mediaType === "video" ? "Video" : "Photo"})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Upload media directly to this meet */}
                {!isExecutiveObserver && (
                  <button
                    onClick={() => handleOpenUploadForMeet(activeMeetModal.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Media</span>
                  </button>
                )}

                {/* Controller / Admin: Multi-Selection Toggle */}
                {canDeleteMedia && (
                  <button
                    onClick={() => {
                      setIsSelectionMode(!isSelectionMode);
                      if (isSelectionMode) setSelectedMediaIds([]);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isSelectionMode
                        ? "bg-rose-600 text-white"
                        : "bg-[#FAF9FD] border border-[#D5CBEE] text-[#1E2746] hover:bg-white"
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>{isSelectionMode ? "Cancel Select" : "Select to Delete"}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Alumni Meet link copied to clipboard!");
                  }}
                  className="p-2 hover:bg-white rounded-xl text-[#5851A4] hover:text-[#1E2746] border border-transparent hover:border-[#D5CBEE] transition cursor-pointer"
                  title="Share"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setActiveMeetModal(null)}
                  className="p-2 hover:bg-white rounded-xl text-[#9188BE] hover:text-[#1E2746] border border-transparent hover:border-[#D5CBEE] transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Selection Banner if active */}
            {canDeleteMedia && isSelectionMode && (
              <div className="bg-slate-900 text-white px-6 py-2.5 flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-3">
                  <span>{selectedMediaIds.length} media selected</span>
                  <button
                    onClick={() => setSelectedMediaIds(activeMeetModal.media.map((m) => m.id))}
                    className="text-amber-300 hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedMediaIds([])}
                    className="text-slate-300 hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>

                <button
                  disabled={selectedMediaIds.length === 0}
                  onClick={() => handleDeleteSelectedMedia(activeMeetModal.id)}
                  className="px-3.5 py-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-lg font-black flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected ({selectedMediaIds.length})</span>
                </button>
              </div>
            )}

            {/* Media Player / Image Container */}
            <div className="relative bg-slate-950 flex items-center justify-center min-h-[300px] sm:min-h-[440px] max-h-[55vh] overflow-hidden group">
              {activeMeetModal.media[activeMediaIndex].mediaType === "video" ? (
                <video
                  src={activeMeetModal.media[activeMediaIndex].url}
                  controls
                  autoPlay
                  className="max-h-[55vh] w-auto max-w-full object-contain"
                />
              ) : (
                <img
                  src={activeMeetModal.media[activeMediaIndex].url}
                  alt={activeMeetModal.media[activeMediaIndex].title}
                  className="max-h-[55vh] w-auto max-w-full object-contain"
                />
              )}

              {/* Prev / Next controls */}
              <button
                onClick={handlePrevMedia}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-sm transition cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={handleNextMedia}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-sm transition cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Media Details & Strip of all photos/videos of this meet */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-black text-amber-600 block uppercase tracking-wider">
                    {activeMeetModal.media[activeMediaIndex].mediaType === "video" ? "🎥 Video Clip" : "📸 Photograph"} • Uploaded by {activeMeetModal.media[activeMediaIndex].uploadedBy || "Member"}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-[#1E2746] mt-0.5">
                    {activeMeetModal.media[activeMediaIndex].title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Controller & Central Admin Delete Media Button */}
                  {canDeleteMedia && (
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteMediaItem(
                          activeMeetModal.id,
                          activeMeetModal.media[activeMediaIndex].id
                        )
                      }
                      className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      title="Delete this photo/video (Controller / Central Admin)"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete This Media</span>
                    </button>
                  )}

                  <a
                    href={activeMeetModal.media[activeMediaIndex].url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-[#4B63D2] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </a>
                </div>
              </div>

              {activeMeetModal.media[activeMediaIndex].description && (
                <p className="text-xs sm:text-sm text-[#5851A4] leading-relaxed">
                  {activeMeetModal.media[activeMediaIndex].description}
                </p>
              )}

              {/* Thumbnails of all media in this meet */}
              <div className="pt-2 border-t border-[#EAE4F7] space-y-2">
                <span className="text-xs font-bold text-[#1E2746]">
                  All Photos &amp; Videos of {activeMeetModal.title} ({activeMeetModal.media.length}):
                </span>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-2">
                  {activeMeetModal.media.map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => setActiveMediaIndex(idx)}
                      className={`relative w-20 h-14 rounded-xl overflow-hidden shrink-0 cursor-pointer border-2 transition ${
                        activeMediaIndex === idx
                          ? "border-[#4B63D2] shadow-md scale-105"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                      {item.mediaType === "video" && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                          <Play className="w-3.5 h-3.5 fill-white" />
                        </div>
                      )}
                      {canDeleteMedia && isSelectionMode && (
                        <div
                          className="absolute top-1 left-1 p-0.5 rounded bg-black/60 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMediaIds((prev) =>
                              prev.includes(item.id)
                                ? prev.filter((id) => id !== item.id)
                                : [...prev, item.id]
                            );
                          }}
                        >
                          {selectedMediaIds.includes(item.id) ? (
                            <CheckSquare className="w-3.5 h-3.5 text-rose-400" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-white" />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. POST ALUMNI EVENT MODAL (FOR CONTROLLER & CENTRAL ADMIN)               */}
      {/* ========================================================================= */}
      {showPostEventModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-[#EAE4F7] animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EAE4F7] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#4B63D2]/10 text-[#4B63D2] rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1E2746]">Post Alumni Event</h3>
                  <p className="text-xs text-[#5851A4]">
                    Controller &amp; Campus Portal • Create official alumni meet card
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPostEventModal(false)}
                className="p-1 hover:bg-[#FAF9FD] rounded-full text-[#9188BE] hover:text-[#1E2746]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {postEventSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{postEventSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSavePostAlumniEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1">
                  Alumni Meet Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Annual Global Alumni Homecoming 2026"
                  value={postEventTitle}
                  onChange={(e) => setPostEventTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-[#FAF9FD] border border-[#D5CBEE] focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1E2746] mb-1">
                    Meet Edition / Series <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Homecoming 2026"
                    value={postEventEdition}
                    onChange={(e) => setPostEventEdition(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 bg-[#FAF9FD] border border-[#D5CBEE] focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E2746] mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={postEventCategory}
                    onChange={(e) => setPostEventCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-[#FAF9FD] border border-[#D5CBEE] focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none cursor-pointer"
                  >
                    <option value="Gala & Dinner">Gala &amp; Dinner</option>
                    <option value="Awards">Awards &amp; Felicitations</option>
                    <option value="Nostalgia">Nostalgia &amp; Campus Walk</option>
                    <option value="Mentorship">Mentorship &amp; Conclave</option>
                    <option value="Sports & Fun">Sports &amp; Fun Match</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1E2746] mb-1">
                    Date &amp; Schedule
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Saturday, Dec 19, 2026"
                    value={postEventDate}
                    onChange={(e) => setPostEventDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#FAF9FD] border border-[#D5CBEE] focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E2746] mb-1">
                    Cohorts / Batches Invited
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Batches 2012 – 2025"
                    value={postEventBatch}
                    onChange={(e) => setPostEventBatch(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#FAF9FD] border border-[#D5CBEE] focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1">
                  Location / Venue
                </label>
                <input
                  type="text"
                  placeholder="e.g. SBJIT Main Amphitheatre & Lawn Plaza"
                  value={postEventLocation}
                  onChange={(e) => setPostEventLocation(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FAF9FD] border border-[#D5CBEE] focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1E2746] mb-1">
                    Event Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5:00 PM – 10:00 PM IST"
                    value={postEventTime}
                    onChange={(e) => setPostEventTime(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#FAF9FD] border border-[#D5CBEE] focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E2746] mb-1">
                    Expected Attendees
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={postEventAttendees}
                    onChange={(e) => setPostEventAttendees(Number(e.target.value) || 100)}
                    className="w-full px-3.5 py-2 bg-[#FAF9FD] border border-[#D5CBEE] focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1">
                  Cover Photo URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or image link"
                  value={postEventCoverUrl}
                  onChange={(e) => setPostEventCoverUrl(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FAF9FD] border border-[#D5CBEE] focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1">
                  Event Description &amp; Highlights <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the alumni meet schedule, key guests, awards, and agenda..."
                  value={postEventDescription}
                  onChange={(e) => setPostEventDescription(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-[#FAF9FD] border border-[#D5CBEE] focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#EAE4F7]">
                <button
                  type="button"
                  onClick={() => setShowPostEventModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE4F7] text-xs font-bold text-[#5851A4] hover:bg-[#FAF9FD] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#4B63D2] hover:bg-[#3E53BE] text-white text-xs font-bold shadow-md shadow-[#4B63D2]/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Post Alumni Event</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. UPLOAD MEDIA MODAL (OPEN TO EVERYONE: PHOTO & VIDEO UPLOADS)            */}
      {/* ========================================================================= */}
      {showUploadMediaModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-[#EAE4F7] animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EAE4F7] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1E2746]">Upload Media to Alumni Meet</h3>
                  <p className="text-xs text-[#5851A4]">
                    Open to Students, Faculty, Alumni, Controllers &amp; Admins
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadMediaModal(false)}
                className="p-1 hover:bg-[#FAF9FD] rounded-full text-[#9188BE] hover:text-[#1E2746]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{uploadSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveMediaUpload} className="space-y-4">
              {/* Select Target Alumni Meet */}
              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1">
                  Target Alumni Meet <span className="text-rose-500">*</span>
                </label>
                <select
                  value={targetMeetId}
                  onChange={(e) => setTargetMeetId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-[#FAF9FD] border border-[#D5CBEE] focus:border-[#4B63D2] rounded-xl text-xs font-bold text-[#1E2746] focus:outline-none cursor-pointer"
                >
                  {alumniMeets.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.edition})
                    </option>
                  ))}
                </select>
              </div>

              {/* Media Type Toggle: Photo vs Video */}
              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1.5">
                  Media Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMediaTypeInput("photo")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                      mediaTypeInput === "photo"
                        ? "bg-[#4B63D2] text-white border-[#4B63D2] shadow-sm"
                        : "bg-[#FAF9FD] border-[#D5CBEE] text-[#5851A4] hover:bg-white"
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>📸 Photo (Image)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMediaTypeInput("video")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                      mediaTypeInput === "video"
                        ? "bg-[#4B63D2] text-white border-[#4B63D2] shadow-sm"
                        : "bg-[#FAF9FD] border-[#D5CBEE] text-[#5851A4] hover:bg-white"
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>🎥 Video (Clip)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1">
                  Title / Caption <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={
                    mediaTypeInput === "video"
                      ? "e.g. Lawn Dance & Flashmob Video Reel"
                      : "e.g. Batch of 2018 Dinner with Professors"
                  }
                  value={uploadMediaTitle}
                  onChange={(e) => setUploadMediaTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-[#FAF9FD] border border-[#D5CBEE] focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none"
                />
              </div>

              {/* Local File Picker */}
              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1">
                  Choose File from Device ({mediaTypeInput === "video" ? "Video" : "Photo"})
                </label>
                <div className="relative border-2 border-dashed border-[#D5CBEE] hover:border-[#4B63D2] bg-[#FAF9FD] rounded-xl p-3.5 text-center transition">
                  <input
                    type="file"
                    accept={mediaTypeInput === "video" ? "video/*" : "image/*"}
                    onChange={handleMediaFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center gap-1 pointer-events-none">
                    <Upload className="w-5 h-5 text-[#4B63D2]" />
                    <span className="text-xs font-bold text-[#1E2746]">
                      {uploadMediaFile
                        ? uploadMediaFile.name
                        : `Click to choose ${mediaTypeInput === "video" ? "video" : "photo"} file`}
                    </span>
                    <span className="text-[10px] text-[#5851A4]">
                      {uploadMediaFile
                        ? `${(uploadMediaFile.size / (1024 * 1024)).toFixed(2)} MB selected`
                        : "Supports MP4, WebM, MOV for video; JPG, PNG, WEBP for photos"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1">
                  Or Paste {mediaTypeInput === "video" ? "Video" : "Photo"} Link / URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder={
                    mediaTypeInput === "video"
                      ? "https://.../video.mp4 or direct video link"
                      : "https://images.unsplash.com/... or direct image link"
                  }
                  value={uploadMediaUrl}
                  onChange={(e) => setUploadMediaUrl(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FAF9FD] border border-[#D5CBEE] focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2746] mb-1">
                  Story / Memory Note
                </label>
                <textarea
                  rows={2}
                  placeholder="Share a short note or memory about this moment..."
                  value={uploadMediaDesc}
                  onChange={(e) => setUploadMediaDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FAF9FD] border border-[#D5CBEE] focus:border-[#4B63D2] rounded-xl text-xs font-medium text-[#1E2746] focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#EAE4F7]">
                <button
                  type="button"
                  onClick={() => setShowUploadMediaModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE4F7] text-xs font-bold text-[#5851A4] hover:bg-[#FAF9FD] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload {mediaTypeInput === "video" ? "Video" : "Photo"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
