import { apiRequest } from "./api";

export interface ClubMember {
  id: number;
  club_id: number;
  user_id: number;
  role: string;
  user?: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

export interface Club {
  id: number;
  name: string;
  description?: string;
  category?: string;
  logo_url?: string;
  banner_url?: string;
  is_official: boolean;
  member_count: number;
  created_at: string;
  lead_name?: string;
  has_lead_infinity?: boolean;
  is_joined?: boolean;
}

export interface ClubCreatePayload {
  name: string;
  description: string;
  category: string;
}

export const clubsService = {
  getClubs: async (params?: { category?: string; search?: string }): Promise<Club[]> => {
    let query = "";
    if (params) {
      const q = new URLSearchParams();
      if (params.category) q.append("category", params.category);
      if (params.search) q.append("search", params.search);
      if (q.toString()) query = `?${q.toString()}`;
    }
    return apiRequest<Club[]>(`/clubs${query}`);
  },

  createClub: async (payload: ClubCreatePayload): Promise<Club> => {
    return apiRequest<Club>("/clubs", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  joinClub: async (clubId: number): Promise<any> => {
    return apiRequest<any>(`/clubs/${clubId}/join`, {
      method: "POST",
    });
  },

  leaveClub: async (clubId: number): Promise<any> => {
    return apiRequest<any>(`/clubs/${clubId}/leave`, {
      method: "POST",
    });
  },
};
