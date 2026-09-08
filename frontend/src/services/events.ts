import { apiRequest } from "./api";

export interface EventCategory {
  id: number;
  name: string;
  description?: string;
}

export interface EventOrganizerInfo {
  id: number;
  email: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  location?: string;
  banner_image_url?: string;
  start_datetime: string;
  end_datetime?: string;
  max_capacity?: number;
  is_rsvp_enabled: boolean;
  status: string;
  organizer_id: number;
  organizer?: EventOrganizerInfo;
  category_id?: number;
  category?: EventCategory;
  rsvp_count: number;
  user_rsvp_status?: string;
  created_at: string;
  updated_at: string;
}

export const eventsService = {
  getEvents: async (params?: { category_id?: number; search?: string }): Promise<Event[]> => {
    let query = '';
    if (params) {
      const q = new URLSearchParams();
      if (params.category_id) q.append('category_id', params.category_id.toString());
      if (params.search) q.append('search', params.search);
      if (q.toString()) query = `?${q.toString()}`;
    }
    return apiRequest<Event[]>(`/events${query}`);
  },
  getCategories: async (): Promise<EventCategory[]> => {
    return apiRequest<EventCategory[]>("/events/categories");
  },
  rsvpToEvent: async (eventId: number): Promise<any> => {
    return apiRequest<any>(`/events/${eventId}/rsvp`, {
      method: "POST",
      body: JSON.stringify({ status: "Going" }),
    });
  }
};
