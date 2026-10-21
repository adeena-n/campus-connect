import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSchema, UserStats, UserProfileResponse, User, Gig, Application, Review } from './types.ts';
import { getInitialSeedData } from './seedData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const TMP_FILE = path.join(DATA_DIR, 'db.json.tmp');

class DatabaseStore {
  private queue: Promise<any> = Promise.resolve();
  private inMemoryData: DatabaseSchema | null = null;

  constructor() {
    this.ensureInitialized();
  }

  public ensureInitialized(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialSeedData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      this.inMemoryData = initial;
    } else {
      try {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content) as DatabaseSchema;
        if (!parsed.saved_gigs) parsed.saved_gigs = [];
        if (!parsed.notifications) parsed.notifications = [];
        this.inMemoryData = parsed;
      } catch (err) {
        console.error('Failed to parse existing db.json, reseeding:', err);
        const initial = getInitialSeedData();
        fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
        this.inMemoryData = initial;
      }
    }
    if (this.inMemoryData) {
      if (!this.inMemoryData.saved_gigs) this.inMemoryData.saved_gigs = [];
      if (!this.inMemoryData.notifications) this.inMemoryData.notifications = [];
    }
    this.evaluateExpirationsSync();
  }

  public addNotificationSync(db: DatabaseSchema, notification: {
    user_id: number;
    type: 'application_received' | 'application_accepted' | 'application_rejected' | 'gig_completed' | 'review_received';
    title: string;
    message: string;
    gig_id?: number;
    link?: string;
  }) {
    if (!db.notifications) db.notifications = [];
    const maxId = db.notifications.reduce((max, n) => (n.id > max ? n.id : max), 0);
    const newNotif = {
      id: Math.max(maxId + 1, 601),
      user_id: notification.user_id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      gig_id: notification.gig_id,
      link: notification.link,
      read: false,
      created_at: new Date().toISOString()
    };
    db.notifications.unshift(newNotif);
    return newNotif;
  }

  public async resetToSeed(): Promise<DatabaseSchema> {
    return this.runExclusive(async () => {
      const seed = getInitialSeedData();
      this.inMemoryData = seed;
      await this.persist();
      return this.inMemoryData;
    });
  }

  private evaluateExpirationsSync(): boolean {
    if (!this.inMemoryData) return false;
    let changed = false;
    const now = Date.now();
    for (const gig of this.inMemoryData.gigs) {
      if (gig.status === 'Open') {
        const deadlineTime = new Date(gig.deadline).getTime();
        if (deadlineTime < now) {
          gig.status = 'Expired';
          changed = true;
        }
      }
    }
    return changed;
  }

  private async persist(): Promise<void> {
    if (!this.inMemoryData) return;
    const jsonStr = JSON.stringify(this.inMemoryData, null, 2);
    await fs.promises.writeFile(TMP_FILE, jsonStr, 'utf-8');
    await fs.promises.rename(TMP_FILE, DB_FILE);
  }

  public async runExclusive<T>(operation: (db: DatabaseSchema) => Promise<T> | T): Promise<T> {
    const nextInQueue = this.queue.then(async () => {
      if (!this.inMemoryData) {
        this.ensureInitialized();
      }
      const expiredChanged = this.evaluateExpirationsSync();
      const result = await operation(this.inMemoryData!);
      if (expiredChanged || true) {
        await this.persist();
      }
      return result;
    });

    this.queue = nextInQueue.catch((err) => {
      console.error('Database transaction error:', err);
    });

    return nextInQueue;
  }

  public async readData(): Promise<DatabaseSchema> {
    return this.runExclusive((db) => {
      return JSON.parse(JSON.stringify(db));
    });
  }

  public calculateUserStats(userId: number, db: DatabaseSchema): UserStats {
    const gigsPosted = db.gigs.filter((g) => g.user_id === userId).length;

    // A gig is completed if status === 'Completed' and user is either owner or accepted applicant
    const completedGigs = db.gigs.filter((g) => {
      if (g.status !== 'Completed') return false;
      if (g.user_id === userId) return true;
      if (g.accepted_applicant_id) {
        const app = db.applications.find((a) => a.id === g.accepted_applicant_id);
        if (app && app.applicant_id === userId) return true;
      }
      return false;
    });
    const gigsCompleted = completedGigs.length;

    // Reviews received by this user
    const receivedReviews = db.reviews.filter((r) => r.reviewee_id === userId);
    let avgRating: number | null = null;
    if (receivedReviews.length > 0) {
      const sum = receivedReviews.reduce((acc, r) => acc + r.rating, 0);
      avgRating = Math.round((sum / receivedReviews.length) * 100) / 100;
    }

    return {
      gigs_posted: gigsPosted,
      gigs_completed: gigsCompleted,
      average_rating: avgRating,
      ratings_count: receivedReviews.length
    };
  }

  public async getUserProfile(userId: number): Promise<UserProfileResponse | null> {
    return this.runExclusive((db) => {
      const user = db.users.find((u) => u.id === userId);
      if (!user) return null;
      const stats = this.calculateUserStats(userId, db);
      return {
        ...user,
        password: undefined,
        password_salt: undefined,
        stats
      };
    });
  }
}

export const dbStore = new DatabaseStore();
