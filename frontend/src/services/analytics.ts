import { apiRequest } from './api'

export interface SystemStats {
  total_users: number
  total_connections: number
  total_jobs: number
  total_posts: number
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

  getProfileViews: async (days: number = 7): Promise<ProfileViewsResponse> => {
    return apiRequest<ProfileViewsResponse>(`/analytics/profile/views?days=${days}`)
  },

  getPostEngagement: async (): Promise<PostEngagementResponse> => {
    return apiRequest<PostEngagementResponse>('/analytics/posts/engagement')
  },

  getTrendingPosts: async (limit: number = 5): Promise<TrendingPost[]> => {
    return apiRequest<TrendingPost[]>(`/analytics/trending-posts?limit=${limit}`)
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
