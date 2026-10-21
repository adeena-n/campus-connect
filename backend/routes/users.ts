import { Router, Request, Response } from 'express';
import { dbStore } from '../store.ts';
import { requireDemoAuth } from '../middleware/demoAuth.ts';

export const usersRouter = Router();

// GET /users - list all demo users with computed stats
usersRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const db = await dbStore.readData();
    const usersWithStats = db.users.map((u) => ({
      ...u,
      password: undefined,
      password_salt: undefined,
      stats: dbStore.calculateUserStats(u.id, db)
    }));
    return res.status(200).json({
      success: true,
      data: usersWithStats,
      message: 'Demo users retrieved successfully.'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to fetch users.' }
    });
  }
});

// GET /users/:id - get single user profile with computed stats
usersRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'User ID must be an integer.' }
      });
    }

    const profile = await dbStore.getUserProfile(id);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `User with ID ${id} not found.` }
      });
    }

    return res.status(200).json({
      success: true,
      data: profile,
      message: 'User profile retrieved successfully.'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to fetch user profile.' }
    });
  }
});

// PATCH /users/:id - edit own allowed profile fields
usersRouter.patch('/:id', requireDemoAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'User ID must be an integer.' }
      });
    }

    if (req.demoUserId !== id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only edit your own profile.' }
      });
    }

    const { bio, skills, major, semester } = req.body;

    const updatedUser = await dbStore.runExclusive((db) => {
      const user = db.users.find((u) => u.id === id);
      if (!user) return null;

      if (bio !== undefined) {
        if (typeof bio !== 'string' || bio.trim().length === 0) {
          throw new Error('Bio must be a non-empty string.');
        }
        user.bio = bio.trim();
      }

      if (skills !== undefined) {
        if (!Array.isArray(skills)) {
          throw new Error('Skills must be an array of strings.');
        }
        user.skills = skills.map((s) => String(s).trim()).filter(Boolean);
      }

      if (major !== undefined) {
        if (typeof major !== 'string' || major.trim().length === 0) {
          throw new Error('Major must be a non-empty string.');
        }
        user.major = major.trim();
      }

      if (semester !== undefined) {
        const sem = Number(semester);
        if (isNaN(sem) || sem < 1 || sem > 16) {
          throw new Error('Semester must be a valid number between 1 and 16.');
        }
        user.semester = sem;
      }

      return {
        ...user,
        password: undefined,
        password_salt: undefined,
        stats: dbStore.calculateUserStats(user.id, db)
      };
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `User with ID ${id} not found.` }
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully.'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: error.message || 'Failed to update profile.' }
    });
  }
});
