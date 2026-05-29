export interface Document {
  id: string;
  title: string;
  abstract?: string;
  author: string;
  category: string;
  faculty?: string;
  major?: string;
  file_url: string;
  material_type: "file" | "link";
  thumbnail_url?: string;
  year?: number;
  course_code: string;
  course_name: string;
  publish_mode: "public" | "student" | "faculty";
  created_at: string;
}

export interface DocumentSummary {
  id: string;
  title: string;
  abstract?: string;
  page_count: number;
  word_count: number;
  keywords: string[];
}

export type WebinarStatus = "scheduled" | "live" | "ended";

export interface WebinarRoom {
  id: string;
  title: string;
  description?: string;
  host_id: string;
  status: WebinarStatus;
  room_url?: string;
  scheduled_at: string;
  created_at: string;
}

export interface WebinarQuestion {
  id: string;
  webinar_id: string;
  user_id: string;
  question: string;
  upvotes: number;
  answered: boolean;
  created_at: string;
}

export interface FacultyMember {
  email: string;
  role: "student" | "admin";
  faculty?: string;
  major?: string;
}
