import { ApiResponse, User, Gig, Application, Review } from '../types.ts';

const BASE_URL = '/api';

export function getStoredAuthToken(): string | null {
  return localStorage.getItem('campusconnect_auth_token');
}

export function setStoredAuthToken(token: string): void {
  localStorage.setItem('campusconnect_auth_token', token);
}

export function clearStoredAuthToken(): void {
  localStorage.removeItem('campusconnect_auth_token');
  localStorage.removeItem('campusconnect_demo_user_id');
}

export function getStoredDemoUserId(): number | null {
  const stored = localStorage.getItem('campusconnect_demo_user_id');
  if (stored) {
    const parsed = parseInt(stored, 10);
    if (!isNaN(parsed)) return parsed;
  }
  return null;
}

export function setStoredDemoUserId(id: number): void {
  localStorage.setItem('campusconnect_demo_user_id', id.toString());
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredAuthToken();
  const demoUserId = getStoredDemoUserId();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (demoUserId) {
    headers.set('X-Demo-User-Id', demoUserId.toString());
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers
  });

  const json: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    error: { code: 'PARSE_ERROR', message: `Server returned HTTP ${response.status} with non-JSON body.` }
  }));

  if (!response.ok || !json.success) {
    const errorMsg = json.error?.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    (error as any).code = json.error?.code || `HTTP_${response.status}`;
    (error as any).status = response.status;
    throw error;
  }

  return json.data as T;
}

export const api = {
  // Auth
  async login(credentials: { email: string; password?: string }): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    if (res.token) {
      setStoredAuthToken(res.token);
      setStoredDemoUserId(res.user.id);
    }
    return res;
  },

  async signup(data: {
    email: string;
    password?: string;
    name: string;
    major: string;
    semester: number;
    bio?: string;
    skills?: string[];
    supabase_id?: string;
  }): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res.token) {
      setStoredAuthToken(res.token);
      setStoredDemoUserId(res.user.id);
    }
    return res;
  },

  async getMe(): Promise<User> {
    return request<User>('/auth/me');
  },

  async logout(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    } finally {
      clearStoredAuthToken();
    }
  },

  // Users
  async getUsers(): Promise<User[]> {
    return request<User[]>('/users');
  },

  async getUser(id: number): Promise<User> {
    return request<User>(`/users/${id}`);
  },

  async updateUser(id: number, data: Partial<Pick<User, 'bio' | 'skills' | 'major' | 'semester'>>): Promise<User> {
    return request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  // Gigs
  async getGigs(params?: {
    category?: string;
    type?: string;
    payment_type?: string;
    min_budget?: number;
    max_budget?: number;
    q?: string;
    status?: string;
    user_id?: number;
  }): Promise<Gig[]> {
    const query = new URLSearchParams();
    if (params) {
      if (params.category) query.set('category', params.category);
      if (params.type) query.set('type', params.type);
      if (params.payment_type) query.set('payment_type', params.payment_type);
      if (params.min_budget !== undefined && params.min_budget !== null) query.set('min_budget', params.min_budget.toString());
      if (params.max_budget !== undefined && params.max_budget !== null) query.set('max_budget', params.max_budget.toString());
      if (params.q) query.set('q', params.q);
      if (params.status) query.set('status', params.status);
      if (params.user_id) query.set('user_id', params.user_id.toString());
    }
    const queryString = query.toString();
    return request<Gig[]>(`/gigs${queryString ? `?${queryString}` : ''}`);
  },

  async getGig(id: number): Promise<Gig> {
    return request<Gig>(`/gigs/${id}`);
  },

  async createGig(payload: {
    title: string;
    description: string;
    type: string;
    category: string;
    payment_type: string;
    budget: number | null;
    deadline: string;
  }): Promise<Gig> {
    return request<Gig>('/gigs', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateGigAction(id: number, action: 'complete' | 'cancel'): Promise<Gig> {
    return request<Gig>(`/gigs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action })
    });
  },

  // Applications
  async getGigApplications(gigId: number): Promise<Application[]> {
    return request<Application[]>(`/applications?gig_id=${gigId}`);
  },

  async getMyApplications(): Promise<Application[]> {
    return request<Application[]>('/applications?mine=true');
  },

  async submitApplication(payload: { gig_id: number; message: string }): Promise<Application> {
    return request<Application>('/applications', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateApplicationAction(id: number, action: 'accept' | 'reject'): Promise<{
    application: Application;
    gig?: Gig;
    rejected_count?: number;
  }> {
    return request<{
      application: Application;
      gig?: Gig;
      rejected_count?: number;
    }>(`/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action })
    });
  },

  // Reviews
  async getReviews(params?: { reviewee_id?: number; gig_id?: number }): Promise<Review[]> {
    const query = new URLSearchParams();
    if (params?.reviewee_id) query.set('reviewee_id', params.reviewee_id.toString());
    if (params?.gig_id) query.set('gig_id', params.gig_id.toString());
    const qs = query.toString();
    return request<Review[]>(`/reviews${qs ? `?${qs}` : ''}`);
  },

  async submitReview(payload: {
    gig_id: number;
    reviewee_id: number;
    rating: number;
    comment: string;
  }): Promise<{ review: Review; reviewee_stats: any }> {
    return request<{ review: Review; reviewee_stats: any }>('/reviews', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Seed Reset
  async resetDatabase(): Promise<{ users_count: number; gigs_count: number; applications_count: number; reviews_count: number }> {
    return request<{ users_count: number; gigs_count: number; applications_count: number; reviews_count: number }>('/seed/reset', {
      method: 'POST'
    });
  }
};
