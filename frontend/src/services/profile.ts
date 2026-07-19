import { apiRequest } from './api'

export interface EducationResponse {
  id: number
  profile_id: number
  institution_name: string
  degree: string
  field_of_study: string | null
  start_date: string // YYYY-MM-DD
  end_date: string | null // YYYY-MM-DD
  gpa: number | null
  description: string | null
}

export interface EducationCreate {
  institution_name: string
  degree: string
  field_of_study?: string | null
  start_date: string // YYYY-MM-DD
  end_date?: string | null // YYYY-MM-DD
  gpa?: number | null
  description?: string | null
}

export interface EducationUpdate {
  institution_name?: string
  degree?: string
  field_of_study?: string | null
  start_date?: string // YYYY-MM-DD
  end_date?: string | null // YYYY-MM-DD
  gpa?: number | null
  description?: string | null
}

export interface EmploymentHistoryResponse {
  id: number
  profile_id: number
  company_name: string
  title: string
  location: string | null
  start_date: string // YYYY-MM-DD
  end_date: string | null // YYYY-MM-DD
  description: string | null
}

export interface EmploymentHistoryCreate {
  company_name: string
  title: string
  location?: string | null
  start_date: string // YYYY-MM-DD
  end_date?: string | null // YYYY-MM-DD
  description?: string | null
}

export interface EmploymentHistoryUpdate {
  company_name?: string
  title?: string
  location?: string | null
  start_date?: string // YYYY-MM-DD
  end_date?: string | null // YYYY-MM-DD
  description?: string | null
}

export interface Certification {
  name: string
  issuer: string
}

export interface Project {
  title: string
  highlights: string[]
  tech_stack?: string[]
}

export interface ProfileResponse {
  id: number
  user_id: number
  first_name: string | null
  last_name: string | null
  bio: string | null
  graduation_year: number | null
  department: string | null
  skills: Record<string, string[]> | null
  profile_picture: string | null
  certifications?: Certification[] | null
  projects?: Project[] | null
  education: EducationResponse[]
  employment_history: EmploymentHistoryResponse[]
}

export interface ProfileUpdate {
  first_name?: string | null
  last_name?: string | null
  bio?: string | null
  graduation_year?: number | null
  department?: string | null
  skills?: Record<string, string[]> | null
  profile_picture?: string | null
  certifications?: Certification[] | null
  projects?: Project[] | null
}

export const profileService = {
  // Get own profile
  getOwnProfile: async (): Promise<ProfileResponse> => {
    return apiRequest<ProfileResponse>('/profiles/me')
  },

  // Get profile by user ID
  getProfileByUserId: async (userId: number): Promise<ProfileResponse> => {
    return apiRequest<ProfileResponse>(`/profiles/${userId}`)
  },

  // Update own profile (first_name, last_name, bio, graduation_year, department, skills)
  updateProfile: async (payload: ProfileUpdate): Promise<ProfileResponse> => {
    return apiRequest<ProfileResponse>('/profiles/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  // Upload profile picture
  uploadProfilePicture: async (file: File): Promise<ProfileResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    return apiRequest<ProfileResponse>('/profiles/me/picture', {
      method: 'POST',
      body: formData,
    })
  },

  // Education CRUD
  addEducation: async (payload: EducationCreate): Promise<EducationResponse> => {
    return apiRequest<EducationResponse>('/profiles/me/education', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  updateEducation: async (educationId: number, payload: EducationUpdate): Promise<EducationResponse> => {
    return apiRequest<EducationResponse>(`/profiles/me/education/${educationId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  deleteEducation: async (educationId: number): Promise<EducationResponse> => {
    return apiRequest<EducationResponse>(`/profiles/me/education/${educationId}`, {
      method: 'DELETE',
    })
  },

  // Employment/Experience CRUD
  addExperience: async (payload: EmploymentHistoryCreate): Promise<EmploymentHistoryResponse> => {
    return apiRequest<EmploymentHistoryResponse>('/profiles/me/experience', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  updateExperience: async (employmentId: number, payload: EmploymentHistoryUpdate): Promise<EmploymentHistoryResponse> => {
    return apiRequest<EmploymentHistoryResponse>(`/profiles/me/experience/${employmentId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  deleteExperience: async (employmentId: number): Promise<EmploymentHistoryResponse> => {
    return apiRequest<EmploymentHistoryResponse>(`/profiles/me/experience/${employmentId}`, {
      method: 'DELETE',
    })
  },
}
