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
