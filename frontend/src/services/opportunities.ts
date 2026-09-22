import { apiRequest } from "./api";

// ── Types ───────────────────────────────────────────────────────────────────

export type OpportunityType = "JOB" | "INTERNSHIP" | "RESEARCH" | "MENTORSHIP";
export type OpportunityStatus = "OPEN" | "CLOSED";
export type OpportunityApplicationStatus =
  | "APPLIED"
  | "PENDING"
  | "SHORTLISTED"
  | "ACCEPTED"
  | "REJECTED";

export interface Opportunity {
  id: number;
  title: string;
  description: string;
  opportunity_type: OpportunityType;
  required_skills?: string[];
  department?: string;
  location?: string;
  stipend_or_salary?: string;
  duration?: string;
  max_applicants?: number;
  application_deadline?: string;
  form_link?: string;
  status: OpportunityStatus;
  posted_by_id: number;
  created_at: string;
  updated_at: string;
  applications_count: number;
  posted_by_name?: string;
  posted_by_department?: string;
  posted_by_avatar?: string;
}

export interface OpportunityApplication {
  id: number;
  opportunity_id: number;
  applicant_id: number;
  message?: string;
  resume_url?: string;
  status: OpportunityApplicationStatus;
  applied_at: string;
  updated_at: string;
  applicant_name?: string;
  applicant_email?: string;
  applicant_department?: string;
  applicant_skills?: string[] | Record<string, string[]>;
  applicant_avatar?: string;
  opportunity_title?: string;
  opportunity_type?: OpportunityType;
}

export interface StudentSearchResult {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  graduation_year?: number;
  skills?: string[] | Record<string, string[]>;
  profile_picture?: string;
  bio?: string;
}

export interface OpportunityFilters {
  opportunity_type?: OpportunityType;
  status?: OpportunityStatus;
  department?: string;
  search?: string;
  skills?: string;
  limit?: number;
  skip?: number;
}

// ── API Functions ───────────────────────────────────────────────────────────

export async function fetchOpportunities(
  filters?: OpportunityFilters
): Promise<Opportunity[]> {
  const params = new URLSearchParams();
  if (filters?.opportunity_type) params.set("opportunity_type", filters.opportunity_type);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.department) params.set("department", filters.department);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.skills) params.set("skills", filters.skills);
  if (filters?.limit) params.set("limit", filters.limit.toString());
  if (filters?.skip) params.set("skip", filters.skip.toString());
  const qs = params.toString();
  return apiRequest<Opportunity[]>(`/opportunities${qs ? `?${qs}` : ""}`);
}

export async function fetchOpportunityDetail(
  id: number
): Promise<Opportunity> {
  return apiRequest<Opportunity>(`/opportunities/${id}`);
}

export async function createOpportunity(data: {
  title: string;
  description: string;
  opportunity_type: OpportunityType;
  required_skills?: string[];
  department?: string;
  location?: string;
  stipend_or_salary?: string;
  duration?: string;
  max_applicants?: number;
  application_deadline?: string;
  form_link?: string;
}): Promise<Opportunity> {
  return apiRequest<Opportunity>("/opportunities", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateOpportunity(
  id: number,
  data: Partial<{
    title: string;
    description: string;
    opportunity_type: OpportunityType;
    required_skills: string[];
    department: string;
    location: string;
    stipend_or_salary: string;
    duration: string;
    max_applicants: number;
    application_deadline: string;
    form_link: string;
    status: OpportunityStatus;
  }>
): Promise<Opportunity> {
  return apiRequest<Opportunity>(`/opportunities/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteOpportunity(id: number): Promise<void> {
  await apiRequest(`/opportunities/${id}`, { method: "DELETE" });
}

export async function fetchMyPostings(): Promise<Opportunity[]> {
  return apiRequest<Opportunity[]>("/opportunities/me");
}

export async function applyToOpportunity(
  opportunityId: number,
  data: { message?: string; resume_url?: string }
): Promise<OpportunityApplication> {
  return apiRequest<OpportunityApplication>(
    `/opportunities/${opportunityId}/apply`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export async function fetchOpportunityApplications(
  opportunityId: number
): Promise<OpportunityApplication[]> {
  return apiRequest<OpportunityApplication[]>(
    `/opportunities/${opportunityId}/applications`
  );
}

export async function fetchMyOpportunityApplications(): Promise<
  OpportunityApplication[]
> {
  return apiRequest<OpportunityApplication[]>("/opportunities/applications/me");
}

export async function updateOpportunityApplicationStatus(
  applicationId: number,
  status: OpportunityApplicationStatus
): Promise<OpportunityApplication> {
  return apiRequest<OpportunityApplication>(
    `/opportunities/applications/${applicationId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }
  );
}

export async function searchStudents(params: {
  skills?: string;
  department?: string;
  graduation_year?: number;
  search?: string;
}): Promise<StudentSearchResult[]> {
  const qs = new URLSearchParams();
  if (params.skills) qs.set("skills", params.skills);
  if (params.department) qs.set("department", params.department);
  if (params.graduation_year)
    qs.set("graduation_year", params.graduation_year.toString());
  if (params.search) qs.set("search", params.search);
  const queryStr = qs.toString();
  return apiRequest<StudentSearchResult[]>(
    `/opportunities/students/search${queryStr ? `?${queryStr}` : ""}`
  );
}
