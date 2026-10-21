import { Router, Request, Response } from 'express';
import { dbStore } from '../store.ts';
import { requireAuth } from '../middleware/auth.ts';
import { User } from '../types.ts';
import { hashPassword, verifyPassword, createSignedSessionToken } from '../utils/auth.ts';

export const authRouter = Router();

// POST /auth/signup - register new student account
authRouter.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name, major, semester, bio, skills, supabase_id } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_EMAIL', message: 'A valid university email address is required.' }
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters long.' }
      });
    }

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_NAME', message: 'Full name is required (minimum 2 characters).' }
      });
    }

    const semNum = Number(semester || 1);
    if (isNaN(semNum) || semNum < 1 || semNum > 16) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_SEMESTER', message: 'Semester must be between 1 and 16.' }
      });
    }

    const result = await dbStore.runExclusive((db) => {
      // Check duplicate email
      const existing = db.users.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase());
      if (existing) {
        return {
          status: 409,
          error: { code: 'EMAIL_IN_USE', message: 'An account with this email already exists.' }
        };
      }

      const maxId = db.users.reduce((max, u) => (u.id > max ? u.id : max), 0);
      const newUserId = maxId + 1;

      const { hash, salt } = hashPassword(password);

      const newUser: User = {
        id: newUserId,
        email: email.trim().toLowerCase(),
        password: hash,
        password_salt: salt,
        supabase_id: supabase_id || undefined,
        name: name.trim(),
        major: (major || 'Undeclared').trim(),
        semester: semNum,
        bio: (bio || 'Student member at CampusConnect.').trim(),
        skills: Array.isArray(skills) ? skills.map((s) => String(s).trim()).filter(Boolean) : []
      };

      db.users.push(newUser);
      const token = createSignedSessionToken(newUser);
      const stats = dbStore.calculateUserStats(newUser.id, db);

      // Welcome notification
      dbStore.addNotificationSync(db, {
        user_id: newUser.id,
        type: 'application_received',
        title: 'Welcome to CampusConnect',
        message: 'Your student account is active. Explore open opportunities or publish your first gig!',
        link: '/explore'
      });

      return {
        status: 201,
        data: {
          token,
          user: {
            ...newUser,
            password: undefined,
            password_salt: undefined,
            stats
          }
        },
        message: 'Student account created successfully.'
      };
    });

    if (result.error) {
      return res.status(result.status).json({
        success: false,
        error: result.error
      });
    }

    return res.status(result.status).json({
      success: true,
      data: result.data,
      message: result.message
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message || 'Registration failed.' }
    });
  }
});

// POST /auth/login - authenticate student with email & password
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_CREDENTIALS', message: 'Email and password are required.' }
      });
    }

    let userToReturn: any = null;
    let tokenToReturn: string | null = null;

    const authResult = await dbStore.runExclusive((db) => {
      const user = db.users.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase());

      if (!user) {
        return {
          status: 401,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }
        };
      }

      // Verify password securely using PBKDF2 with salt or legacy fallback
      const isMatch = verifyPassword(password, user.password, user.password_salt);
      if (!isMatch) {
        return {
          status: 401,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }
        };
      }

      // Upgrade legacy unhashed password if needed
      if (!user.password_salt) {
        const { hash, salt } = hashPassword(password);
        user.password = hash;
        user.password_salt = salt;
      }

      const token = createSignedSessionToken(user);
      const stats = dbStore.calculateUserStats(user.id, db);

      userToReturn = {
        ...user,
        password: undefined,
        password_salt: undefined,
        stats
      };
      tokenToReturn = token;

      return {
        status: 200,
        data: {
          token,
          user: userToReturn
        },
        message: 'Logged in successfully.'
      };
    });

    if (authResult.error) {
      return res.status(authResult.status).json({
        success: false,
        error: authResult.error
      });
    }

    return res.status(200).json({
      success: true,
      data: authResult.data,
      message: authResult.message
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message || 'Login failed.' }
    });
  }
});

// GET /auth/me - get currently authenticated student
authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const db = await dbStore.readData();
    const user = db.users.find((u) => u.id === req.authUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Student profile not found.' }
      });
    }

    const stats = dbStore.calculateUserStats(user.id, db);
    return res.status(200).json({
      success: true,
      data: {
        ...user,
        password: undefined,
        password_salt: undefined,
        stats
      },
      message: 'Active session retrieved.'
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message || 'Failed to retrieve session.' }
    });
  }
});

// POST /auth/logout
authRouter.post('/logout', (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
});
