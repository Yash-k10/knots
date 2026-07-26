import { apiRequest } from './api'

export interface ConnectionRecommendation {
  user_id: number
  first_name?: string
  last_name?: string
  department?: string
  graduation_year?: number
  bio?: string
  match_score: number
  match_reasons: string[]
  shared_skills: string[]
}

export interface JobRecommendation {
  job_id: number
  title: string
  company_name: string
  location?: string
  job_type?: string
  match_score: number
  match_reasons: string[]
  matching_skills: string[]
}

export interface PostRecommendation {
  post_id: number
  author_id: number
  author_name: string
  content_snippet: string
  likes_count: number
  comments_count: number
  match_score: number
  match_reason: string
}

export interface AIRecommendationsResponse {
  connections: ConnectionRecommendation[]
  jobs: JobRecommendation[]
  posts: PostRecommendation[]
}

export interface ResumeAnalysisResponse {
  score: number
  feedback: string
  suggestions: string[]
}

export interface RoadmapResponse {
  role: string
  steps: string[]
}

export const aiService = {
  getRecommendations: async (): Promise<AIRecommendationsResponse> => {
    return apiRequest<AIRecommendationsResponse>('/ai/recommendations')
  },

  analyzeResume: async (resumeText: string): Promise<ResumeAnalysisResponse> => {
    return apiRequest<ResumeAnalysisResponse>('/ai/analyze-resume', {
      method: 'POST',
      body: JSON.stringify({ resume_text: resumeText }),
    })
  },

  generateRoadmap: async (
    targetRole: string,
    currentSkills: string[]
  ): Promise<RoadmapResponse> => {
    return apiRequest<RoadmapResponse>('/ai/roadmap', {
      method: 'POST',
      body: JSON.stringify({
        target_role: targetRole,
        current_skills: currentSkills,
      }),
    })
  },
}
