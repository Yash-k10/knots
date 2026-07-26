import { apiRequest } from './api'

export interface DailyActivity {
  posts_today: number
  users_today: number
  actions_today: number
}

export interface DashboardStats {
  total_users: number
  total_posts: number
  active_users: number
  daily_activity: DailyActivity
}

export interface AdminUser {
  id: number
  email: string
  is_active: boolean
  role_id: number | null
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: number
  actor_id: number | null
  action: string
  target: string | null
  ip_address: string | null
  created_at: string
}

export interface FlaggedPost {
  id: number
  post_id: number
  flagger_id: number
  reason: string | null
  status: string
  created_at: string
  post: {
    id: number
    author_id: number
    content: string
    image_url: string | null
    created_at: string
    author?: {
      id: number
      email: string
    } | null
  } | null
  flagger: {
    id: number
    email: string
  } | null
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiRequest<DashboardStats>('/admin/dashboard/stats')
}

export async function getAdminUsers(skip: number = 0, limit: number = 100): Promise<AdminUser[]> {
  return apiRequest<AdminUser[]>(`/admin/users?skip=${skip}&limit=${limit}`)
}

export async function banUser(userId: number): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/admin/users/${userId}/ban`, {
    method: 'POST',
  })
}

export async function unbanUser(userId: number): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/admin/users/${userId}/unban`, {
    method: 'POST',
  })
}

export async function deleteAdminUser(userId: number): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/admin/users/${userId}`, {
    method: 'DELETE',
  })
}

export async function getAuditLogs(skip: number = 0, limit: number = 100): Promise<AuditLog[]> {
  return apiRequest<AuditLog[]>(`/admin/audit-logs?skip=${skip}&limit=${limit}`)
}

export async function getFlaggedPosts(skip: number = 0, limit: number = 100): Promise<FlaggedPost[]> {
  return apiRequest<FlaggedPost[]>(`/admin/posts/flagged?skip=${skip}&limit=${limit}`)
}

export async function resolveFlaggedPost(flagId: number, action: 'resolved' | 'dismissed'): Promise<FlaggedPost> {
  return apiRequest<FlaggedPost>(`/admin/posts/${flagId}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  })
}

export async function deletePostAsAdmin(postId: number): Promise<void> {
  return apiRequest<void>(`/admin/posts/${postId}`, {
    method: 'DELETE',
  })
}
