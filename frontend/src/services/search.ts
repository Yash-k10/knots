import { apiRequest } from "./api";

export interface UserSearchResult {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  profile_picture?: string;
}

export interface PostSearchResult {
  id: number;
  content: string;
  author_id: number;
  author_name?: string;
  created_at: string;
}

export interface JobSearchResult {
  id: number;
  title: string;
  company_name?: string;
  location?: string;
  job_type: string;
}

export interface EventSearchResult {
  id: number;
  title: string;
  description?: string;
  location?: string;
  start_datetime: string;
}

export interface GlobalSearchResponse {
  query: string;
  total_results: number;
  users: UserSearchResult[];
  posts: PostSearchResult[];
  jobs: JobSearchResult[];
  events: EventSearchResult[];
}

export const searchApi = {
  globalSearch: async (
    query: string,
    category: string = "all",
    limit: number = 10,
  ): Promise<GlobalSearchResponse> => {
    const encodedQuery = encodeURIComponent(query);
    const encodedCat = encodeURIComponent(category);
    return await apiRequest<GlobalSearchResponse>(
      `/search?q=${encodedQuery}&category=${encodedCat}&limit=${limit}`,
    );
  },
};
