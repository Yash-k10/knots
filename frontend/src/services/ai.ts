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

export interface BulletRewrite {
  original: string;
  improved: string;
  reason: string;
}

export interface ResumeAnalysisResult {
  score: number;
  rating?: string;
  target_role?: string;
  dimensions?: {
    overall: number;
    ats_compatibility: number;
    impact_metrics: number;
    tech_stack_depth: number;
  };
  detected_skills?: Record<string, string[]>;
  detected_skills_count?: number;
  missing_high_impact_keywords?: string[];
  bullet_rewrites?: BulletRewrite[];
  feedback?: string[];
  strengths?: string[];
  suggestions?: string[];
  [key: string]: any;
}

export interface RoadmapMilestone {
  phase: string;
  title: string;
  duration: string;
  description: string;
  key_topics?: string[];
  project?: {
    title: string;
    description: string;
    tech_stack: string;
  };
  interview_focus?: string;
}

export interface LearningStep {
  step: number;
  title: string;
  skills: string[];
  status: "completed" | "in_progress" | "not_started" | string;
}

export interface CareerRoadmapResult {
  role?: string;
  target_role?: string;
  description?: string;
  currentSkills?: string[];
  matchedSkills?: string[];
  missingSkills?: string[];
  totalRequiredSkills?: number;
  completionPercentage?: number;
  learningSteps?: LearningStep[];
  milestones?: RoadmapMilestone[];
  role_overview?: {
    title: string;
    market_demand: string;
    salary_range: string;
    estimated_duration: string;
  };
  skill_gap_analysis?: {
    matching_skills: string[];
    skills_to_acquire: string[];
    readiness_percentage: number;
  };
  error?: string;
  suggestions?: string[];
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

  async analyzeResume(
    resumeText: string,
    targetRole = "Software Developer",
  ): Promise<ResumeAnalysisResult> {
    return apiRequest<ResumeAnalysisResult>("/ai/analyze-resume", {
      method: "POST",
      body: JSON.stringify({
        resume_text: resumeText,
        target_role: targetRole,
      }),
    });
  },

  async generateRoadmap(
    targetRole: string,
    currentSkills: string[],
    experienceLevel = "Mid-Level",
  ): Promise<CareerRoadmapResult> {
    return apiRequest<CareerRoadmapResult>("/ai/roadmap", {
      method: "POST",
      body: JSON.stringify({
        target_role: targetRole,
        current_skills: currentSkills,
        experience_level: experienceLevel,
      }),
    });
  },
};
