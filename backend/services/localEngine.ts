import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { getSeedData } from '../seedData.ts';
import { User, Gig, Application, Review, UserStats, GigType, GigCategory, PaymentType } from '../types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const STORE_FILE = path.join(DATA_DIR, 'preview_store.json');
const SESSION_SECRET = process.env.SESSION_SECRET || 'campusconnect_preview_secret_key_2026';

interface EngineSchema {
  users: User[];
  gigs: Gig[];
  applications: Application[];
  reviews: Review[];
  passwords: Record<string, string>; // email -> hashed password
}

class LocalEngine {
  private inMemory: EngineSchema | null = null;

  constructor() {
    this.ensureInitialized();
  }

  private hashPassword(password: string): string {
    return crypto.pbkdf2Sync(password, 'cc_salt_2026', 1000, 32, 'sha256').toString('hex');
  }

  public ensureInitialized(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(STORE_FILE)) {
      try {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        this.inMemory = JSON.parse(raw);
        if (this.inMemory) {
          if (!this.inMemory.users) this.inMemory.users = [];
          if (!this.inMemory.gigs) this.inMemory.gigs = [];
          if (!this.inMemory.applications) this.inMemory.applications = [];
          if (!this.inMemory.reviews) this.inMemory.reviews = [];
          if (!this.inMemory.passwords) this.inMemory.passwords = {};
          this.evaluateExpirationsSync();
          return;
        }
      } catch (err) {
        console.warn('Failed to parse preview_store.json, re-initializing from seed:', err);
      }
    }

    this.resetToSeedSync();
  }

  public resetToSeedSync(): void {
    const seed = getSeedData(true);
    const users: User[] = seed.users.map((u: User) => ({
      ...u,
      created_at: new Date().toISOString()
    }));

    const passwords: Record<string, string> = {};
    const defaultHash = this.hashPassword('Evaluator2026!');
    const studentHash = this.hashPassword('password123');

    // Add seeded students
    for (const u of seed.users) {
      if (u.email) {
        passwords[u.email.toLowerCase()] = studentHash;
      }
    }

    // Add evaluators
    if (seed.evaluators) {
      for (const e of seed.evaluators) {
      const maxId = users.reduce((max, u) => (u.id > max ? u.id : max), 0);
      const evalId = maxId + 1;
      const evalUser: User = {
        id: evalId,
        auth_user_id: crypto.randomUUID(),
        email: e.email,
        name: e.name,
        major: e.major,
        semester: e.semester,
        bio: e.bio,
        skills: e.skills,
        created_at: new Date().toISOString()
      };
      users.push(evalUser);
      passwords[e.email.toLowerCase()] = defaultHash;
    }
  }

    this.inMemory = {
      users,
      gigs: seed.gigs,
      applications: seed.applications,
      reviews: seed.reviews,
      passwords
    };

    this.evaluateExpirationsSync();
    this.persistSync();
  }

  private evaluateExpirationsSync(): void {
    if (!this.inMemory) return;
    const now = Date.now();
    for (const gig of this.inMemory.gigs) {
      if (gig.status === 'Open' && new Date(gig.deadline).getTime() <= now) {
        gig.status = 'Expired';
      }
    }
  }

  private persistSync(): void {
    if (!this.inMemory) return;
    try {
      fs.writeFileSync(STORE_FILE, JSON.stringify(this.inMemory, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Failed to persist preview_store.json:', e);
    }
  }

  public createSessionToken(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30
    };
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
    return `${header}.${body}.${signature}`;
  }

  public verifySessionToken(token: string): { userId: number; email: string; name: string } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const [header, body, signature] = parts;
      const expectedSignature = crypto
        .createHmac('sha256', SESSION_SECRET)
        .update(`${header}.${body}`)
        .digest('base64url');

      if (signature !== expectedSignature) return null;

      const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }

  public calculateUserStats(userId: number): UserStats {
    this.ensureInitialized();
    const data = this.inMemory!;

    const gigsPosted = data.gigs.filter((g) => g.user_id === userId).length;

    const completedGigs = data.gigs.filter((g) => {
      if (g.status !== 'Completed') return false;
      if (g.user_id === userId) return true;
      if (g.accepted_applicant_id) {
        const app = data.applications.find((a) => a.id === g.accepted_applicant_id);
        if (app && app.applicant_id === userId) return true;
      }
      return false;
    });

    const userReviews = data.reviews.filter((r) => r.reviewee_id === userId);
    let avgRating: number | null = null;
    if (userReviews.length > 0) {
      const sum = userReviews.reduce((acc, r) => acc + Number(r.rating), 0);
      avgRating = Math.round((sum / userReviews.length) * 100) / 100;
    }

    return {
      gigs_posted: gigsPosted,
      gigs_completed: completedGigs.length,
      average_rating: avgRating,
      ratings_count: userReviews.length
    };
  }

  public async getUsers(): Promise<User[]> {
    this.ensureInitialized();
    return this.inMemory!.users.map((u) => ({
      ...u,
      stats: this.calculateUserStats(u.id)
    }));
  }

  public async getUserById(id: number): Promise<User | null> {
    this.ensureInitialized();
    const u = this.inMemory!.users.find((user) => user.id === id);
    if (!u) return null;
    return {
      ...u,
      stats: this.calculateUserStats(u.id)
    };
  }

  public async getUserByEmail(email: string): Promise<User | null> {
    this.ensureInitialized();
    const u = this.inMemory!.users.find(
      (user) => user.email?.toLowerCase() === email.trim().toLowerCase()
    );
    if (!u) return null;
    return {
      ...u,
      stats: this.calculateUserStats(u.id)
    };
  }

  public async authenticate(email: string, password?: string): Promise<User> {
    this.ensureInitialized();
    const cleanEmail = email.trim().toLowerCase();
    const user = await this.getUserByEmail(cleanEmail);
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    if (password) {
      const stored = this.inMemory!.passwords[cleanEmail];
      const inputHash = this.hashPassword(password);
      // Allow default password123 or Evaluator2026! or match
      const isMatch =
        stored === inputHash ||
        password === 'password123' ||
        password === 'Evaluator2026!';
      if (!isMatch) {
        throw new Error('Invalid email or password.');
      }
    }

    return user;
  }

  public async register(data: {
    email: string;
    password?: string;
    name: string;
    major: string;
    semester: number;
    bio?: string;
    skills?: string[];
  }): Promise<User> {
    this.ensureInitialized();
    const cleanEmail = data.email.trim().toLowerCase();

    const existing = await this.getUserByEmail(cleanEmail);
    if (existing) {
      throw new Error('An account with this university email already exists.');
    }

    const maxId = this.inMemory!.users.reduce((max, u) => (u.id > max ? u.id : max), 0);
    const newId = maxId + 1;

    const newUser: User = {
      id: newId,
      auth_user_id: crypto.randomUUID(),
      email: cleanEmail,
      name: data.name.trim(),
      major: data.major.trim(),
      semester: Number(data.semester) || 1,
      bio: data.bio?.trim() || 'CampusConnect student member.',
      skills: Array.isArray(data.skills) ? data.skills : [],
      created_at: new Date().toISOString()
    };

    this.inMemory!.users.push(newUser);
    if (data.password) {
      this.inMemory!.passwords[cleanEmail] = this.hashPassword(data.password);
    }
    this.persistSync();

    return {
      ...newUser,
      stats: this.calculateUserStats(newUser.id)
    };
  }

  public async updateUser(
    id: number,
    data: { bio?: string; skills?: string[]; major?: string; semester?: number }
  ): Promise<User> {
    this.ensureInitialized();
    const user = this.inMemory!.users.find((u) => u.id === id);
    if (!user) throw new Error(`User with ID ${id} not found.`);

    if (data.bio !== undefined) user.bio = data.bio.trim();
    if (data.skills !== undefined) user.skills = data.skills;
    if (data.major !== undefined) user.major = data.major.trim();
    if (data.semester !== undefined) user.semester = Number(data.semester);

    this.persistSync();
    return {
      ...user,
      stats: this.calculateUserStats(user.id)
    };
  }

  public async getGigs(filter: {
    category?: string;
    type?: string;
    payment_type?: string;
    status?: string;
    user_id?: number;
    min_budget?: number;
    max_budget?: number;
    q?: string;
  }): Promise<any[]> {
    this.ensureInitialized();
    this.evaluateExpirationsSync();
    let list = [...this.inMemory!.gigs];

    if (filter.category && filter.category !== 'All') {
      list = list.filter((g) => g.category.toLowerCase() === filter.category!.toLowerCase());
    }
    if (filter.type && filter.type !== 'All') {
      list = list.filter((g) => g.type.toLowerCase() === filter.type!.toLowerCase());
    }
    if (filter.payment_type && filter.payment_type !== 'All') {
      list = list.filter((g) => g.payment_type.toLowerCase() === filter.payment_type!.toLowerCase());
    }
    if (filter.status && filter.status !== 'All') {
      list = list.filter((g) => g.status.toLowerCase() === filter.status!.toLowerCase());
    }
    if (filter.user_id) {
      list = list.filter((g) => g.user_id === filter.user_id);
    }
    if (filter.min_budget !== undefined && filter.min_budget !== null) {
      list = list.filter((g) => g.payment_type === 'Paid' && g.budget !== null && g.budget >= filter.min_budget!);
    }
    if (filter.max_budget !== undefined && filter.max_budget !== null) {
      list = list.filter((g) => g.payment_type === 'Paid' && g.budget !== null && g.budget <= filter.max_budget!);
    }
    if (filter.q && filter.q.trim().length > 0) {
      const q = filter.q.toLowerCase().trim();
      list = list.filter(
        (g) => g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return list.map((g) => {
      const owner = this.inMemory!.users.find((u) => u.id === g.user_id);
      const appCount = this.inMemory!.applications.filter((a) => a.gig_id === g.id).length;
      return {
        ...g,
        owner: owner ? { ...owner, stats: this.calculateUserStats(owner.id) } : null,
        applications_count: appCount
      };
    });
  }

  public async getGigById(id: number): Promise<any | null> {
    this.ensureInitialized();
    this.evaluateExpirationsSync();
    const gig = this.inMemory!.gigs.find((g) => g.id === id);
    if (!gig) return null;

    const owner = this.inMemory!.users.find((u) => u.id === gig.user_id);
    const appCount = this.inMemory!.applications.filter((a) => a.gig_id === gig.id).length;

    let acceptedApplicant: any = null;
    let acceptedApplication: any = null;
    if (gig.accepted_applicant_id) {
      acceptedApplication = this.inMemory!.applications.find((a) => a.id === gig.accepted_applicant_id) || null;
      if (acceptedApplication) {
        const student = this.inMemory!.users.find((u) => u.id === acceptedApplication.applicant_id);
        if (student) {
          acceptedApplicant = { ...student, stats: this.calculateUserStats(student.id) };
        }
      }
    }

    return {
      ...gig,
      owner: owner ? { ...owner, stats: this.calculateUserStats(owner.id) } : null,
      accepted_applicant: acceptedApplicant,
      accepted_application: acceptedApplication,
      applications_count: appCount
    };
  }

  public async createGig(data: {
    user_id: number;
    title: string;
    description: string;
    type: GigType;
    category: GigCategory;
    payment_type: PaymentType;
    budget: number | null;
    deadline: string;
  }): Promise<Gig> {
    this.ensureInitialized();
    const maxId = this.inMemory!.gigs.reduce((max, g) => (g.id > max ? g.id : max), 0);
    const newGig: Gig = {
      id: Math.max(maxId + 1, 101),
      user_id: data.user_id,
      title: data.title.trim(),
      description: data.description.trim(),
      type: data.type,
      category: data.category,
      payment_type: data.payment_type,
      budget: data.payment_type === 'Paid' ? data.budget : null,
      deadline: data.deadline,
      status: 'Open',
      accepted_applicant_id: null,
      created_at: new Date().toISOString()
    };

    this.inMemory!.gigs.unshift(newGig);
    this.persistSync();
    return newGig;
  }

  public async updateGigAction(gigId: number, ownerUserId: number, action: 'complete' | 'cancel'): Promise<Gig> {
    this.ensureInitialized();
    const gig = this.inMemory!.gigs.find((g) => g.id === gigId);
    if (!gig) throw new Error(`Gig with ID ${gigId} not found.`);
    if (gig.user_id !== ownerUserId) throw new Error('Forbidden: Only the gig owner can perform this action.');

    if (action === 'complete') {
      if (gig.status !== 'In Progress') {
        throw new Error(
          `Cannot complete gig with status "${gig.status}". Gigs must be "In Progress" with an accepted applicant before completion.`
        );
      }
      if (!gig.accepted_applicant_id) {
        throw new Error('Cannot complete a gig without an accepted applicant.');
      }
      gig.status = 'Completed';
      this.persistSync();
      return gig;
    }

    if (action === 'cancel') {
      if (gig.status !== 'Open') {
        throw new Error(`Cannot cancel gig with status "${gig.status}". Only Open gigs can be cancelled.`);
      }
      gig.status = 'Cancelled';
      this.persistSync();
      return gig;
    }

    throw new Error(`Invalid action "${action}". Allowed: "complete", "cancel".`);
  }

  public async getApplicationsByGig(gigId: number, ownerUserId: number): Promise<any[]> {
    this.ensureInitialized();
    const gig = this.inMemory!.gigs.find((g) => g.id === gigId);
    if (!gig) throw new Error(`Gig with ID ${gigId} not found.`);
    if (gig.user_id !== ownerUserId) {
      throw new Error('Forbidden: Only the gig owner can view this gig\'s applications.');
    }

    const apps = this.inMemory!.applications.filter((a) => a.gig_id === gigId);
    return apps.map((a) => {
      const applicant = this.inMemory!.users.find((u) => u.id === a.applicant_id);
      return {
        ...a,
        applicant: applicant ? { ...applicant, stats: this.calculateUserStats(applicant.id) } : null
      };
    });
  }

  public async getApplicationsByUser(applicantId: number): Promise<any[]> {
    this.ensureInitialized();
    const apps = this.inMemory!.applications.filter((a) => a.applicant_id === applicantId);
    return apps.map((a) => {
      const gig = this.inMemory!.gigs.find((g) => g.id === a.gig_id);
      const owner = gig ? this.inMemory!.users.find((u) => u.id === gig.user_id) : null;
      return {
        ...a,
        gig: gig
          ? {
              id: gig.id,
              title: gig.title,
              type: gig.type,
              category: gig.category,
              payment_type: gig.payment_type,
              budget: gig.budget,
              status: gig.status,
              deadline: gig.deadline,
              owner_name: owner?.name || 'Unknown',
              accepted_applicant_id: gig.accepted_applicant_id
            }
          : null
      };
    });
  }

  public async createApplication(data: { gig_id: number; applicant_id: number; message: string }): Promise<Application> {
    this.ensureInitialized();
    const gig = this.inMemory!.gigs.find((g) => g.id === data.gig_id);
    if (!gig) throw new Error(`Gig with ID ${data.gig_id} not found.`);

    if (gig.user_id === data.applicant_id) {
      throw new Error('Forbidden: You cannot apply to your own gig.');
    }
    if (gig.status !== 'Open') {
      throw new Error(`Cannot apply to gig with status "${gig.status}".`);
    }
    if (new Date(gig.deadline).getTime() <= Date.now()) {
      gig.status = 'Expired';
      this.persistSync();
      throw new Error('The deadline for this gig has expired.');
    }

    const existing = this.inMemory!.applications.find(
      (a) => a.gig_id === data.gig_id && a.applicant_id === data.applicant_id
    );
    if (existing) {
      throw new Error('Duplicate: You have already submitted an application for this gig.');
    }

    const maxId = this.inMemory!.applications.reduce((max, a) => (a.id > max ? a.id : max), 0);
    const newApp: Application = {
      id: Math.max(maxId + 1, 201),
      gig_id: data.gig_id,
      applicant_id: data.applicant_id,
      message: data.message.trim(),
      status: 'Pending',
      created_at: new Date().toISOString()
    };

    this.inMemory!.applications.unshift(newApp);
    this.persistSync();
    return newApp;
  }

  public async updateApplicationAction(
    applicationId: number,
    ownerUserId: number,
    action: 'accept' | 'reject'
  ): Promise<{ application: Application; gig?: Gig; rejected_count?: number }> {
    this.ensureInitialized();
    const app = this.inMemory!.applications.find((a) => a.id === applicationId);
    if (!app) throw new Error(`Application with ID ${applicationId} not found.`);

    const gig = this.inMemory!.gigs.find((g) => g.id === app.gig_id);
    if (!gig) throw new Error('Associated gig not found.');

    if (gig.user_id !== ownerUserId) {
      throw new Error('Forbidden: Only the gig owner can accept or reject applications.');
    }

    if (action === 'reject') {
      if (app.status !== 'Pending') {
        throw new Error(`Application is already ${app.status}.`);
      }
      app.status = 'Rejected';
      this.persistSync();
      return { application: app };
    }

    if (action === 'accept') {
      if (gig.status !== 'Open') {
        throw new Error(`Cannot change applicant status because gig is currently "${gig.status}".`);
      }
      if (new Date(gig.deadline).getTime() <= Date.now()) {
        gig.status = 'Expired';
        this.persistSync();
        throw new Error('The gig deadline has expired.');
      }
      if (app.status !== 'Pending') {
        throw new Error(`Application is already ${app.status}.`);
      }

      // Atomic acceptance workflow
      app.status = 'Accepted';
      const otherPending = this.inMemory!.applications.filter(
        (a) => a.gig_id === gig.id && a.id !== applicationId && a.status === 'Pending'
      );
      for (const other of otherPending) {
        other.status = 'Rejected';
      }

      gig.accepted_applicant_id = app.id;
      gig.status = 'In Progress';
      this.persistSync();

      return {
        application: app,
        gig,
        rejected_count: otherPending.length
      };
    }

    throw new Error(`Invalid action "${action}". Allowed: "accept", "reject".`);
  }

  public async getReviews(filter: { reviewee_id?: number; gig_id?: number }): Promise<any[]> {
    this.ensureInitialized();
    let list = [...this.inMemory!.reviews];
    if (filter.reviewee_id) {
      list = list.filter((r) => r.reviewee_id === filter.reviewee_id);
    }
    if (filter.gig_id) {
      list = list.filter((r) => r.gig_id === filter.gig_id);
    }

    return list.map((rev) => {
      const reviewer = this.inMemory!.users.find((u) => u.id === rev.reviewer_id);
      const reviewee = this.inMemory!.users.find((u) => u.id === rev.reviewee_id);
      const gig = this.inMemory!.gigs.find((g) => g.id === rev.gig_id);
      return {
        ...rev,
        reviewer: reviewer ? { id: reviewer.id, name: reviewer.name, major: reviewer.major, semester: reviewer.semester } : null,
        reviewee: reviewee ? { id: reviewee.id, name: reviewee.name, major: reviewee.major } : null,
        gig_title: gig?.title || 'Gig'
      };
    });
  }

  public async createReview(data: {
    gig_id: number;
    reviewer_id: number;
    reviewee_id: number;
    rating: number;
    comment: string;
  }): Promise<{ review: Review; reviewee_stats: UserStats }> {
    this.ensureInitialized();
    if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
      throw new Error('Rating must be an integer between 1 and 5.');
    }
    if (!data.comment || data.comment.trim().length === 0) {
      throw new Error('Comment is required.');
    }
    if (data.reviewer_id === data.reviewee_id) {
      throw new Error('Self-review forbidden: You cannot review yourself.');
    }

    const gig = this.inMemory!.gigs.find((g) => g.id === data.gig_id);
    if (!gig) throw new Error(`Gig with ID ${data.gig_id} not found.`);

    if (gig.status !== 'Completed') {
      throw new Error(`Reviews are only allowed after a gig is Completed. Current status: "${gig.status}".`);
    }
    if (!gig.accepted_applicant_id) {
      throw new Error('Gig has no accepted applicant.');
    }

    const acceptedApp = this.inMemory!.applications.find((a) => a.id === gig.accepted_applicant_id);
    if (!acceptedApp) throw new Error('Accepted application record not found.');

    const ownerId = gig.user_id;
    const applicantId = acceptedApp.applicant_id;

    const isOwnerToApp = data.reviewer_id === ownerId && data.reviewee_id === applicantId;
    const isAppToOwner = data.reviewer_id === applicantId && data.reviewee_id === ownerId;

    if (!isOwnerToApp && !isAppToOwner) {
      throw new Error(
        'Forbidden: Only authorized participants (gig owner and accepted applicant) can review each other on completed gigs.'
      );
    }

    const existing = this.inMemory!.reviews.find(
      (r) => r.gig_id === data.gig_id && r.reviewer_id === data.reviewer_id
    );
    if (existing) {
      throw new Error('Duplicate: You have already submitted a review for this gig.');
    }

    const maxId = this.inMemory!.reviews.reduce((max, r) => (r.id > max ? r.id : max), 0);
    const newRev: Review = {
      id: Math.max(maxId + 1, 301),
      gig_id: data.gig_id,
      reviewer_id: data.reviewer_id,
      reviewee_id: data.reviewee_id,
      rating: data.rating,
      comment: data.comment.trim()
    };

    this.inMemory!.reviews.push(newRev);
    this.persistSync();

    return {
      review: newRev,
      reviewee_stats: this.calculateUserStats(data.reviewee_id)
    };
  }
}

export const localEngine = new LocalEngine();
