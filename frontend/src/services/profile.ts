import { apiRequest } from "./api";

export interface EducationResponse {
  id: number;
  profile_id: number;
  institution_name: string;
  degree: string;
  field_of_study: string | null;
  start_date: string; // YYYY-MM-DD
  end_date: string | null; // YYYY-MM-DD
  gpa: number | null;
  description: string | null;
}

export interface EducationCreate {
  institution_name: string;
  degree: string;
  field_of_study?: string | null;
  start_date: string; // YYYY-MM-DD
  end_date?: string | null; // YYYY-MM-DD
  gpa?: number | null;
  description?: string | null;
}

export interface EducationUpdate {
  institution_name?: string;
  degree?: string;
  field_of_study?: string | null;
  start_date?: string; // YYYY-MM-DD
  end_date?: string | null; // YYYY-MM-DD
  gpa?: number | null;
  description?: string | null;
}

export interface EmploymentHistoryResponse {
  id: number;
  profile_id: number;
  company_name: string;
  title: string;
  location: string | null;
  start_date: string; // YYYY-MM-DD
  end_date: string | null; // YYYY-MM-DD
  description: string | null;
}

export interface EmploymentHistoryCreate {
  company_name: string;
  title: string;
  location?: string | null;
  start_date: string; // YYYY-MM-DD
  end_date?: string | null; // YYYY-MM-DD
  description?: string | null;
}

export interface EmploymentHistoryUpdate {
  company_name?: string;
  title?: string;
  location?: string | null;
  start_date?: string; // YYYY-MM-DD
  end_date?: string | null; // YYYY-MM-DD
  description?: string | null;
}

export interface Certification {
  name: string;
  issuer: string;
}

export interface Project {
  title: string;
  highlights: string[];
  tech_stack?: string[];
}

export interface SkillEndorsement {
  id: number;
  profile_id: number;
  skill_name: string;
  endorser_id: number;
  endorser_name: string;
}

export interface ProfileResponse {
  id: number;
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  graduation_year: number | null;
  department: string | null;
  skills: Record<string, string[]> | null;
  profile_picture: string | null;
  certifications?: Certification[] | null;
  projects?: Project[] | null;
  education: EducationResponse[];
  employment_history: EmploymentHistoryResponse[];
  endorsements: SkillEndorsement[];
  connection_count: number;
}

export interface ProfileUpdate {
  first_name?: string | null;
  last_name?: string | null;
  bio?: string | null;
  graduation_year?: number | null;
  department?: string | null;
  skills?: Record<string, string[]> | null;
  profile_picture?: string | null;
  certifications?: Certification[] | null;
  projects?: Project[] | null;
}

export const profileService = {
  // Get own profile
  getOwnProfile: async (): Promise<ProfileResponse> => {
    return apiRequest<ProfileResponse>("/profiles/me");
  },

  // Get profile by user ID
  getProfileByUserId: async (userId: number): Promise<ProfileResponse> => {
    return apiRequest<ProfileResponse>(`/profiles/${userId}`);
  },

  // Update own profile (first_name, last_name, bio, graduation_year, department, skills)
  updateProfile: async (payload: ProfileUpdate): Promise<ProfileResponse> => {
    return apiRequest<ProfileResponse>("/profiles/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  // Upload profile picture
  uploadProfilePicture: async (file: File): Promise<ProfileResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    return apiRequest<ProfileResponse>("/profiles/me/picture", {
      method: "POST",
      body: formData,
    });
  },

  // Education CRUD
  addEducation: async (
    payload: EducationCreate,
  ): Promise<EducationResponse> => {
    return apiRequest<EducationResponse>("/profiles/me/education", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateEducation: async (
    educationId: number,
    payload: EducationUpdate,
  ): Promise<EducationResponse> => {
    return apiRequest<EducationResponse>(
      `/profiles/me/education/${educationId}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    );
  },

  deleteEducation: async (educationId: number): Promise<EducationResponse> => {
    return apiRequest<EducationResponse>(
      `/profiles/me/education/${educationId}`,
      {
        method: "DELETE",
      },
    );
  },

  // Employment/Experience CRUD
  addExperience: async (
    payload: EmploymentHistoryCreate,
  ): Promise<EmploymentHistoryResponse> => {
    return apiRequest<EmploymentHistoryResponse>("/profiles/me/experience", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateExperience: async (
    employmentId: number,
    payload: EmploymentHistoryUpdate,
  ): Promise<EmploymentHistoryResponse> => {
    return apiRequest<EmploymentHistoryResponse>(
      `/profiles/me/experience/${employmentId}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    );
  },

  deleteExperience: async (
    employmentId: number,
  ): Promise<EmploymentHistoryResponse> => {
    return apiRequest<EmploymentHistoryResponse>(
      `/profiles/me/experience/${employmentId}`,
      {
        method: "DELETE",
      },
    );
  },

  endorseSkill: async (
    userId: number,
    skillName: string,
  ): Promise<ProfileResponse> => {
    return apiRequest<ProfileResponse>(
      `/profiles/${userId}/skills/${encodeURIComponent(skillName)}/endorse`,
      {
        method: "POST",
      },
    );
  },

  unendorseSkill: async (
    userId: number,
    skillName: string,
  ): Promise<ProfileResponse> => {
    return apiRequest<ProfileResponse>(
      `/profiles/${userId}/skills/${encodeURIComponent(skillName)}/endorse`,
      {
        method: "DELETE",
      },
    );
  },

  downloadResume: async (userId?: number): Promise<void> => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
    const endpoint = userId
      ? `/profiles/${userId}/resume/download`
      : `/profiles/me/resume/download`;
    const token = localStorage.getItem("knots_token");
    const headers = new Headers();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to generate and download resume. Please try again.");
    }

    let filename = "Resume.docx";
    const disposition = response.headers.get("Content-Disposition");
    if (disposition && disposition.includes("filename=")) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        filename = match[1].trim();
      }
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
