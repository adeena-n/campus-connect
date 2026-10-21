import { Router, Request, Response } from 'express';
import { dbStore } from '../store.ts';
import { requireDemoAuth, optionalDemoAuth } from '../middleware/demoAuth.ts';
import { Review } from '../types.ts';

export const reviewsRouter = Router();

// GET /reviews?reviewee_id=2 or ?gig_id=105
reviewsRouter.get('/', optionalDemoAuth, async (req: Request, res: Response) => {
  try {
    const { reviewee_id, gig_id } = req.query;
    const db = await dbStore.readData();

    let list = [...db.reviews];

    if (reviewee_id) {
      const uId = parseInt(reviewee_id as string, 10);
      if (!isNaN(uId)) {
        list = list.filter((r) => r.reviewee_id === uId);
      }
    }

    if (gig_id) {
      const gId = parseInt(gig_id as string, 10);
      if (!isNaN(gId)) {
        list = list.filter((r) => r.gig_id === gId);
      }
    }

    // Enrich with reviewer and gig info
    const enriched = list.map((rev) => {
      const reviewer = db.users.find((u) => u.id === rev.reviewer_id);
      const reviewee = db.users.find((u) => u.id === rev.reviewee_id);
      const gig = db.gigs.find((g) => g.id === rev.gig_id);
      return {
        ...rev,
        reviewer: reviewer ? {
          id: reviewer.id,
          name: reviewer.name,
          major: reviewer.major,
          semester: reviewer.semester
        } : null,
        reviewee: reviewee ? {
          id: reviewee.id,
          name: reviewee.name,
          major: reviewee.major
        } : null,
        gig_title: gig ? gig.title : 'Gig'
      };
    });

    return res.status(200).json({
      success: true,
      data: enriched,
      message: 'Reviews retrieved successfully.'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to fetch reviews.' }
    });
  }
});

// POST /reviews - submit mutual review
reviewsRouter.post('/', requireDemoAuth, async (req: Request, res: Response) => {
  try {
    const { gig_id, reviewee_id, rating, comment } = req.body;

    const gId = parseInt(gig_id, 10);
    const rId = parseInt(reviewee_id, 10);
    const numRating = Number(rating);

    if (isNaN(gId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_GIG_ID', message: 'gig_id must be an integer.' }
      });
    }

    if (isNaN(rId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REVIEWEE_ID', message: 'reviewee_id must be an integer.' }
      });
    }

    // Rating validation: 1-5 integer
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_RATING', message: 'Rating must be an integer between 1 and 5.' }
      });
    }

    // Comment validation: required non-empty
    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_COMMENT', message: 'Comment is required.' }
      });
    }

    const reviewerId = req.demoUserId!;

    // Prevent self-reviews
    if (reviewerId === rId) {
      return res.status(400).json({
        success: false,
        error: { code: 'SELF_REVIEW', message: 'You cannot submit a review for yourself.' }
      });
    }

    const result = await dbStore.runExclusive((db) => {
      const gig = db.gigs.find((g) => g.id === gId);
      if (!gig) {
        return { status: 404, error: { code: 'GIG_NOT_FOUND', message: `Gig with ID ${gId} not found.` } };
      }

      // Must be Completed
      if (gig.status !== 'Completed') {
        return {
          status: 400,
          error: {
            code: 'GIG_NOT_COMPLETED',
            message: `Reviews are only allowed after a gig is Completed. Current status: "${gig.status}".`
          }
        };
      }

      if (!gig.accepted_applicant_id) {
        return {
          status: 400,
          error: { code: 'NO_ACCEPTED_APPLICANT', message: 'Gig has no accepted applicant.' }
        };
      }

      const acceptedApp = db.applications.find((a) => a.id === gig.accepted_applicant_id);
      if (!acceptedApp) {
        return {
          status: 404,
          error: { code: 'ACCEPTED_APP_NOT_FOUND', message: 'Accepted application record not found.' }
        };
      }

      const ownerId = gig.user_id;
      const applicantId = acceptedApp.applicant_id;

      // Check authorization: must be either Owner reviewing Accepted Applicant, or Accepted Applicant reviewing Owner!
      const isOwnerReviewingApplicant = (reviewerId === ownerId && rId === applicantId);
      const isApplicantReviewingOwner = (reviewerId === applicantId && rId === ownerId);

      if (!isOwnerReviewingApplicant && !isApplicantReviewingOwner) {
        return {
          status: 403,
          error: {
            code: 'FORBIDDEN',
            message: 'Only authorized participants (gig owner and accepted applicant) can review each other on completed gigs.'
          }
        };
      }

      // Check duplicate review: One review per reviewer per gig!
      const existing = db.reviews.find((r) => r.gig_id === gId && r.reviewer_id === reviewerId);
      if (existing) {
        return {
          status: 409,
          error: { code: 'DUPLICATE_REVIEW', message: 'You have already submitted a review for this gig.' }
        };
      }

      const maxId = db.reviews.reduce((max, r) => (r.id > max ? r.id : max), 0);
      const newReviewId = Math.max(maxId + 1, 301);

      const created: Review = {
        id: newReviewId,
        gig_id: gId,
        reviewer_id: reviewerId,
        reviewee_id: rId,
        rating: numRating,
        comment: comment.trim()
      };

      db.reviews.push(created);

      // Return updated reviewee stats as well
      const updatedRevieweeStats = dbStore.calculateUserStats(rId, db);

      return {
        status: 201,
        data: {
          review: created,
          reviewee_stats: updatedRevieweeStats
        },
        message: 'Review submitted successfully.'
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
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to submit review.' }
    });
  }
});
