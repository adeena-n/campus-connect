export type GigType = 'Offering' | 'Requesting';
export type GigCategory = 'Programming' | 'Design' | 'Writing' | 'Tutoring';
export type PaymentType = 'Paid' | 'SkillSwap' | 'Free';
export type GigStatus = 'Open' | 'In Progress' | 'Completed' | 'Expired' | 'Cancelled';
export type ApplicationStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn';
export type GigSortOption = 'newest' | 'deadline' | 'budget_asc' | 'budget_desc';

export interface UserStats {
  gigs_posted: number;
  gigs_completed: number;
  average_rating: number | null;
  ratings_count: number;
}

export interface User {
  id: number;
  email?: string;
  supabase_id?: string;
  name: string;
  major: string;
  semester: number;
  bio: string;
  skills: string[];
  stats?: UserStats;
}

export interface Gig {
  id: number;
  user_id: number;
  title: string;
  description: string;
  type: GigType;
  category: GigCategory;
  payment_type: PaymentType;
  budget: number | null;
  deadline: string;
  status: GigStatus;
  accepted_applicant_id: number | null;
  created_at: string;
  owner?: User | null;
  accepted_applicant?: User | null;
  accepted_application?: Application | null;
  applications_count?: number;
  is_saved?: boolean;
}

export interface Application {
  id: number;
  gig_id: number;
  applicant_id: number;
  message: string;
  status: ApplicationStatus;
  created_at: string;
  applicant?: User | null;
  gig?: {
    id: number;
    title: string;
    type: GigType;
    category: GigCategory;
    payment_type: PaymentType;
    budget: number | null;
    status: GigStatus;
    deadline: string;
    owner_name: string;
    accepted_applicant_id: number | null;
  } | null;
}

export interface Review {
  id: number;
  gig_id: number;
  reviewer_id: number;
  reviewee_id: number;
  rating: number;
  comment: string;
  reviewer?: {
    id: number;
    name: string;
    major: string;
    semester: number;
  } | null;
  reviewee?: {
    id: number;
    name: string;
    major: string;
  } | null;
  gig_title?: string;
}

export interface SavedGig {
  id: number;
  user_id: number;
  gig_id: number;
  created_at: string;
  gig?: Gig;
}

export type NotificationType =
  | 'application_received'
  | 'application_accepted'
  | 'application_rejected'
  | 'gig_completed'
  | 'review_received';

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  gig_id?: number;
  link?: string;
  read: boolean;
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}
