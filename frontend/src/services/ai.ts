import { apiRequest } from "./api";

export interface ConnectionSuggestion {
  user_id: number;
  email?: string | null;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  department: string | null;
  graduation_year: number | null;
  profile_picture: string | null;
  skills: string[];
  match_score: number;
  common_skills: string[];
  reason: string;
}

export interface JobRecommendation {
  job_id: number;
  title: string;
  company_name: string | null;
  location: string | null;
  job_type: string | null;
  workplace_type: string | null;
  salary_range: string | null;
  required_skills: string[];
  match_score: number;
  matching_skills: string[];
  reason: string;
}

export interface ContentRecommendation {
  post_id: number;
  author_id: number;
  author_name: string | null;
  author_avatar: string | null;
  content: string;
  image_url: string | null;
  created_at: string | null;
  like_count: number;
  comment_count: number;
  relevance_score: number;
  matched_topics: string[];
  reason: string;
}

export interface ResumeAnalysisResult {
  score?: number;
  feedback?: string[];
  strengths?: string[];
  suggested_improvements?: string[];
  [key: string]: any;
}

export interface CareerRoadmapResult {
  target_role?: string;
  milestones?: { title: string; description: string; duration?: string }[];
  recommended_skills?: string[];
  [key: string]: any;
}

export const aiService = {
  async getConnectionSuggestions(limit = 6): Promise<ConnectionSuggestion[]> {
    return apiRequest<ConnectionSuggestion[]>(
      `/ai/connection-suggestions?limit=${limit}`,
    );
  },

  async getJobRecommendations(limit = 6): Promise<JobRecommendation[]> {
    return apiRequest<JobRecommendation[]>(
      `/ai/job-recommendations?limit=${limit}`,
    );
  },

  async getContentRecommendations(limit = 6): Promise<ContentRecommendation[]> {
    return apiRequest<ContentRecommendation[]>(
      `/ai/content-recommendations?limit=${limit}`,
    );
  },

  async analyzeResume(resumeText: string): Promise<ResumeAnalysisResult> {
    return apiRequest<ResumeAnalysisResult>("/ai/analyze-resume", {
      method: "POST",
      body: JSON.stringify({ resume_text: resumeText }),
    });
  },

  async generateRoadmap(
    targetRole: string,
    currentSkills: string[],
  ): Promise<CareerRoadmapResult> {
    return apiRequest<CareerRoadmapResult>("/ai/roadmap", {
      method: "POST",
      body: JSON.stringify({
        target_role: targetRole,
        current_skills: currentSkills,
      }),
    });
  },
};
