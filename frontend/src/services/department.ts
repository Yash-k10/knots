import { apiRequest } from "./api";

export interface BatchStat {
  batch: string;
  graduation_year?: number;
  total: number;
  placed_or_interned: number;
  avg_cgpa: number;
  placed_count?: number;
  seeking_count?: number;
}

export interface CohortBreakdown {
  first_year: number;
  second_year: number;
  third_year: number;
  fourth_year: number;
}

export interface DepartmentStatsResponse {
  department: string;
  total_students: number;
  total_faculty: number;
  active_faculty: number;
  placed_or_interned_count: number;
  placed_count: number;
  seeking_placement_count: number;
  internships_count: number;
  placement_rate: number;
  average_cgpa: number;
  clubs_count: number;
  events_count: number;
  alumni_engaged_count: number;
  alumni_mentors_count: number;
  active_referrals_count: number;
  student_engagement_rate: number;
  profile_completion_rate: number;
  pending_actions_count: number;
  reports_submitted_count: number;
  reports_pending_count: number;
  management_updates_count: number;
  cohorts?: CohortBreakdown;
  batches: BatchStat[];
}

export interface DepartmentStudentItem {
  id: number;
  first_name?: string;
  last_name?: string;
  email: string;
  department?: string;
  graduation_year?: number;
  academic_year: string;
  section: string;
  profile_picture?: string | null;
  tenth_percentage?: number;
  twelfth_diploma_percentage?: number;
  skills?: string[];
  projects_count: number;
  certifications_count: number;
  achievements_count: number;
  cgpa?: number;
  status: string;
  profile_completion_pct: number;
  is_verified: boolean;
}

export interface DepartmentFacultyItem {
  id: number;
  name: string;
  email: string;
  designation: string;
  department: string;
  specialization?: string;
  profile_picture?: string | null;
  mentored_students_count: number;
  active_projects_count: number;
  courses: string[];
}

export interface DepartmentAlumniItem {
  id: number;
  name: string;
  email: string;
  department: string;
  graduation_year: number;
  company: string;
  role_title: string;
  location: string;
  is_mentor: boolean;
  referrals_count: number;
  skills: string[];
  profile_picture?: string | null;
}

export interface DepartmentAchievementItem {
  id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  department: string;
  batch: string;
  title: string;
  category: string;
  details: string;
  date: string;
  proof_url?: string | null;
  status: "Verified" | "Pending Verification" | "Rejected";
  verified_by?: string | null;
  verified_at?: string | null;
}

export interface ManagementConnectRequest {
  id: number;
  title: string;
  category: string;
  department: string;
  hod_name: string;
  hod_email: string;
  description: string;
  budget_estimate?: string;
  target_cohort?: string;
  expected_outcomes?: string;
  status: "Pending" | "Under Review" | "Approved" | "Rejected" | "Changes Requested" | "Completed";
  management_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface ManagementAnnouncement {
  id: number;
  title: string;
  category: string;
  priority: "Urgent" | "High" | "Standard";
  sender: string;
  content: string;
  date: string;
  attachment_url?: string;
  is_read: boolean;
}

export interface DepartmentReportItem {
  id: number;
  title: string;
  report_type: string;
  department: string;
  period: string;
  generated_at: string;
  submitted_at?: string;
  status: "Draft" | "Submitted" | "Under Review" | "Completed";
  management_feedback?: string;
  summary_metrics: Record<string, string | number>;
}

export interface DepartmentAnalyticsData {
  department: string;
  student_engagement: Record<string, number>;
  profile_completion: Record<string, number>;
  skill_distribution: Array<{ skill: string; count: number }>;
  certification_status: Record<string, number>;
  project_participation: Record<string, number>;
  internship_stats: Record<string, number>;
  placement_stats: Record<string, number>;
  alumni_engagement: Record<string, number>;
  event_participation: Array<{ month: string; events: number; participants: number }>;
}

export const departmentService = {
  getStats: async (department?: string): Promise<DepartmentStatsResponse> => {
    const url = department ? `/departments/stats?department=${encodeURIComponent(department)}` : "/departments/stats";
    return apiRequest<DepartmentStatsResponse>(url);
  },

  getStudents: async (params?: { department?: string; batch?: number; search?: string }): Promise<DepartmentStudentItem[]> => {
    const searchParams = new URLSearchParams();
    if (params?.department) searchParams.append("department", params.department);
    if (params?.batch) searchParams.append("batch", String(params.batch));
    if (params?.search) searchParams.append("search", params.search);
    const qs = searchParams.toString();
    return apiRequest<DepartmentStudentItem[]>(`/departments/students${qs ? `?${qs}` : ""}`);
  },

  getFaculty: async (department?: string): Promise<DepartmentFacultyItem[]> => {
    const url = department ? `/departments/faculty?department=${encodeURIComponent(department)}` : "/departments/faculty";
    return apiRequest<DepartmentFacultyItem[]>(url);
  },

  getAlumni: async (params?: { department?: string; gradYear?: number }): Promise<DepartmentAlumniItem[]> => {
    const searchParams = new URLSearchParams();
    if (params?.department) searchParams.append("department", params.department);
    if (params?.gradYear) searchParams.append("grad_year", String(params.gradYear));
    const qs = searchParams.toString();
    return apiRequest<DepartmentAlumniItem[]>(`/departments/alumni${qs ? `?${qs}` : ""}`);
  },

  getAchievements: async (params?: { department?: string; statusFilter?: string }): Promise<DepartmentAchievementItem[]> => {
    const searchParams = new URLSearchParams();
    if (params?.department) searchParams.append("department", params.department);
    if (params?.statusFilter) searchParams.append("status_filter", params.statusFilter);
    const qs = searchParams.toString();
    return apiRequest<DepartmentAchievementItem[]>(`/departments/achievements${qs ? `?${qs}` : ""}`);
  },

  verifyAchievement: async (achievementId: number, status: string, remarks?: string): Promise<DepartmentAchievementItem> => {
    return apiRequest<DepartmentAchievementItem>("/departments/achievements/verify", {
      method: "POST",
      body: JSON.stringify({ achievement_id: achievementId, status, remarks }),
    });
  },

  getManagementRequests: async (department?: string): Promise<ManagementConnectRequest[]> => {
    const url = department ? `/departments/management-connect/requests?department=${encodeURIComponent(department)}` : "/departments/management-connect/requests";
    return apiRequest<ManagementConnectRequest[]>(url);
  },

  createManagementRequest: async (data: {
    title: string;
    category: string;
    description: string;
    budget_estimate?: string;
    target_cohort?: string;
    expected_outcomes?: string;
  }): Promise<ManagementConnectRequest> => {
    return apiRequest<ManagementConnectRequest>("/departments/management-connect/requests", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getManagementAnnouncements: async (): Promise<ManagementAnnouncement[]> => {
    return apiRequest<ManagementAnnouncement[]>("/departments/management-connect/announcements");
  },

  getReports: async (department?: string): Promise<DepartmentReportItem[]> => {
    const url = department ? `/departments/reports?department=${encodeURIComponent(department)}` : "/departments/reports";
    return apiRequest<DepartmentReportItem[]>(url);
  },

  submitReport: async (data: {
    report_type: string;
    period: string;
    title: string;
    notes?: string;
  }): Promise<DepartmentReportItem> => {
    return apiRequest<DepartmentReportItem>("/departments/reports/submit", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getAnalytics: async (department?: string): Promise<DepartmentAnalyticsData> => {
    const url = department ? `/departments/analytics?department=${encodeURIComponent(department)}` : "/departments/analytics";
    return apiRequest<DepartmentAnalyticsData>(url);
  },
};
