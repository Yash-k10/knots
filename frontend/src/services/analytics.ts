import { apiRequest } from './api'

export interface SystemStats {
  total_users: number
  total_connections: number
  total_jobs: number
  total_posts: number
  total_events?: number
  total_clubs?: number
  total_likes?: number
  total_comments?: number
  total_post_views?: number
  total_profile_views?: number
}

export interface PlatformEngagementSummary {
  total_likes: number
  total_comments: number
  total_post_views: number
  total_profile_views: number
  total_engagement_actions: number
}

export interface ProfileViewItem {
  date: string
  views: number
}

export interface ProfileViewsResponse {
  total_views: number
  history: ProfileViewItem[]
}

export interface PostEngagementItem {
  post_id: number
  content_snippet: string
  created_at: string
  likes: number
  comments: number
  views: number
}

export interface PostEngagementResponse {
  total_likes: number
  total_comments: number
  total_views: number
  posts: PostEngagementItem[]
}

export interface TrendingPost {
  post_id: number
  content: string
  created_at: string
  author_name: string
  likes: number
  comments: number
  views: number
  score: number
}

export const analyticsService = {
  getSystemStats: async (): Promise<SystemStats> => {
    return apiRequest<SystemStats>('/analytics/stats')
  },

  getPlatformEngagementSummary: async (): Promise<PlatformEngagementSummary> => {
    return apiRequest<PlatformEngagementSummary>('/analytics/platform/engagement-summary')
  },

  getProfileViews: async (days: number = 7): Promise<ProfileViewsResponse> => {
    return apiRequest<ProfileViewsResponse>(`/analytics/profile/views?days=${days}`)
  },

  getPostEngagement: async (): Promise<PostEngagementResponse> => {
    return apiRequest<PostEngagementResponse>('/analytics/posts/engagement')
  },

  getTrendingPosts: async (limit: number = 5, days: number = 7): Promise<TrendingPost[]> => {
    return apiRequest<TrendingPost[]>(`/analytics/trending-posts?limit=${limit}&days=${days}`)
  },

  recordPostView: async (postId: number): Promise<void> => {
    return apiRequest<void>(`/analytics/posts/${postId}/view`, {
      method: 'POST',
    })
  },

  recordProfileView: async (profileId: number): Promise<void> => {
    return apiRequest<void>(`/analytics/profile/${profileId}/view`, {
      method: 'POST',
    })
  },
}
