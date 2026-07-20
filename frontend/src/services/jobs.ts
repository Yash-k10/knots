import { apiRequest } from './api'

export type JobType = 'FULL_TIME' | 'PART_TIME' | 'INTERNSHIP' | 'CONTRACT'
export type WorkplaceType = 'ON_SITE' | 'HYBRID' | 'REMOTE'
export type JobStatus = 'OPEN' | 'CLOSED' | 'DRAFT'
export type ApplicationStatus = 'PENDING' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED'

export interface Company {
  id: number
  name: string
  logo_url?: string
  website?: string
  industry?: string
  description?: string
  location?: string
  created_at: string
  updated_at: string
}

export interface JobPosting {
  id: number
  title: string
  description: string
  company_id: number
  posted_by_id: number
  job_type: JobType
  location?: string
  workplace_type: WorkplaceType
  salary_min?: number
  salary_max?: number
  salary_range?: string
  required_skills?: string[]
  application_deadline?: string
  status: JobStatus
  created_at: string
  updated_at: string
  company?: Company
}

export interface Application {
  id: number
  job_posting_id: number
  applicant_id: number
  resume_url?: string
  resume_text?: string
  cover_letter?: string
  status: ApplicationStatus
  applied_at: string
  updated_at: string
  job_posting?: JobPosting
}

export interface Referral {
  id: number
  job_posting_id: number
  referrer_id: number
  referred_user_id?: number
  message?: string
  created_at: string
  updated_at: string
}

export interface JobFilters {
  search?: string
  job_type?: JobType
  workplace_type?: WorkplaceType
  company_id?: number
  status?: JobStatus
}

export async function fetchJobs(filters?: JobFilters): Promise<JobPosting[]> {
  const queryParams = new URLSearchParams()
  if (filters?.search) queryParams.set('search', filters.search)
  if (filters?.job_type) queryParams.set('job_type', filters.job_type)
  if (filters?.workplace_type) queryParams.set('workplace_type', filters.workplace_type)
  if (filters?.company_id) queryParams.set('company_id', filters.company_id.toString())
  if (filters?.status) queryParams.set('status', filters.status)

  const queryStr = queryParams.toString()
  return apiRequest<JobPosting[]>(`/jobs${queryStr ? `?${queryStr}` : ''}`)
}

export async function fetchJobDetails(id: number): Promise<JobPosting> {
  return apiRequest<JobPosting>(`/jobs/${id}`)
}

export async function createJobPosting(data: {
  title: string
  description: string
  company_id: number
  job_type?: JobType
  location?: string
  workplace_type?: WorkplaceType
  salary_range?: string
  required_skills?: string[]
}): Promise<JobPosting> {
  return apiRequest<JobPosting>('/jobs', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function fetchCompanies(): Promise<Company[]> {
  return apiRequest<Company[]>('/jobs/companies')
}

export async function createCompany(data: {
  name: string
  industry?: string
  location?: string
  website?: string
  description?: string
}): Promise<Company> {
  return apiRequest<Company>('/jobs/companies', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function applyForJob(
  jobPostingId: number,
  data: { resume_url?: string; cover_letter?: string }
): Promise<Application> {
  return apiRequest<Application>(`/jobs/${jobPostingId}/apply`, {
    method: 'POST',
    body: JSON.stringify({ ...data, job_posting_id: jobPostingId }),
  })
}

export async function fetchMyApplications(): Promise<Application[]> {
  return apiRequest<Application[]>('/jobs/applications/me')
}

export async function requestReferral(data: {
  job_posting_id: number
  message?: string
}): Promise<Referral> {
  return apiRequest<Referral>('/jobs/referrals', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
