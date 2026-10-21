import { Router, Request, Response } from 'express';
import { dbStore } from '../store.ts';

export const seedRouter = Router();

seedRouter.post('/reset', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production' && req.header('X-Admin-Key') !== process.env.ADMIN_KEY) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Database reset is restricted in production.' }
    });
  }

  try {
    const data = await dbStore.resetToSeed();
    return res.status(200).json({
      success: true,
      data: {
        users_count: data.users.length,
        gigs_count: data.gigs.length,
        applications_count: data.applications.length,
        reviews_count: data.reviews.length
      },
      message: 'Database reset to initial seed state successfully.'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'RESET_FAILED', message: error.message || 'Failed to reset seed data.' }
    });
  }
});
