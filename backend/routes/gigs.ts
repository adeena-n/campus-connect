import { Router, Request, Response } from 'express';
import { dbStore } from '../store.ts';
import { requireDemoAuth, optionalDemoAuth } from '../middleware/demoAuth.ts';
import { Gig, GigType, GigCategory, PaymentType } from '../types.ts';

export const gigsRouter = Router();

const VALID_CATEGORIES: GigCategory[] = ['Programming', 'Design', 'Writing', 'Tutoring'];
const VALID_TYPES: GigType[] = ['Offering', 'Requesting'];
const VALID_PAYMENT_TYPES: PaymentType[] = ['Paid', 'SkillSwap', 'Free'];

// GET /gigs - search and combined filters
gigsRouter.get('/', optionalDemoAuth, async (req: Request, res: Response) => {
  try {
    const { category, type, payment_type, min_budget, max_budget, q, status, user_id } = req.query;

    const db = await dbStore.readData();
    let gigs = [...db.gigs];

    if (category && typeof category === 'string') {
      gigs = gigs.filter((g) => g.category.toLowerCase() === category.toLowerCase());
    }

    if (type && typeof type === 'string') {
      gigs = gigs.filter((g) => g.type.toLowerCase() === type.toLowerCase());
    }

    if (payment_type && typeof payment_type === 'string') {
      gigs = gigs.filter((g) => g.payment_type.toLowerCase() === payment_type.toLowerCase());
    }

    if (status && typeof status === 'string') {
      gigs = gigs.filter((g) => g.status.toLowerCase() === status.toLowerCase());
    }

    if (user_id) {
      const uId = parseInt(user_id as string, 10);
      if (!isNaN(uId)) {
        gigs = gigs.filter((g) => g.user_id === uId);
      }
    }

    // Budget range filter (applies to Paid gigs)
    const minB = min_budget ? parseFloat(min_budget as string) : null;
    const maxB = max_budget ? parseFloat(max_budget as string) : null;

    if (minB !== null && !isNaN(minB)) {
      gigs = gigs.filter((g) => {
        if (g.payment_type !== 'Paid') return false;
        return g.budget !== null && g.budget >= minB;
      });
    }

    if (maxB !== null && !isNaN(maxB)) {
      gigs = gigs.filter((g) => {
        if (g.payment_type !== 'Paid') return false;
        return g.budget !== null && g.budget <= maxB;
      });
    }

    // Case-insensitive keyword search over title and description
    if (q && typeof q === 'string') {
      const queryLower = q.toLowerCase().trim();
      if (queryLower.length > 0) {
        gigs = gigs.filter((g) =>
          g.title.toLowerCase().includes(queryLower) ||
          g.description.toLowerCase().includes(queryLower)
        );
      }
    }

    // Sort by created_at desc
    gigs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Enrich with owner info and application count
    const enriched = gigs.map((g) => {
      const owner = db.users.find((u) => u.id === g.user_id);
      const applicationsCount = db.applications.filter((a) => a.gig_id === g.id).length;
      return {
        ...g,
        owner: owner ? {
          id: owner.id,
          name: owner.name,
          major: owner.major,
          semester: owner.semester,
          skills: owner.skills,
          stats: dbStore.calculateUserStats(owner.id, db)
        } : null,
        applications_count: applicationsCount
      };
    });

    return res.status(200).json({
      success: true,
      data: enriched,
      message: 'Gigs retrieved successfully.'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to search gigs.' }
    });
  }
});

// GET /gigs/:id - get single gig detail
gigsRouter.get('/:id', optionalDemoAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Gig ID must be an integer.' }
      });
    }

    const db = await dbStore.readData();
    const gig = db.gigs.find((g) => g.id === id);
    if (!gig) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Gig with ID ${id} not found.` }
      });
    }

    const owner = db.users.find((u) => u.id === gig.user_id);
    let acceptedApplicant: any = null;
    let acceptedApplication: any = null;

    if (gig.accepted_applicant_id) {
      acceptedApplication = db.applications.find((a) => a.id === gig.accepted_applicant_id);
      if (acceptedApplication) {
        const student = db.users.find((u) => u.id === acceptedApplication.applicant_id);
        if (student) {
          acceptedApplicant = {
            id: student.id,
            name: student.name,
            major: student.major,
            semester: student.semester,
            skills: student.skills,
            stats: dbStore.calculateUserStats(student.id, db)
          };
        }
      }
    }

    const applicationsCount = db.applications.filter((a) => a.gig_id === gig.id).length;

    return res.status(200).json({
      success: true,
      data: {
        ...gig,
        owner: owner ? {
          id: owner.id,
          name: owner.name,
          major: owner.major,
          semester: owner.semester,
          skills: owner.skills,
          stats: dbStore.calculateUserStats(owner.id, db)
        } : null,
        accepted_applicant: acceptedApplicant,
        accepted_application: acceptedApplication,
        applications_count: applicationsCount
      },
      message: 'Gig detail retrieved successfully.'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to retrieve gig detail.' }
    });
  }
});

// POST /gigs - create new gig
gigsRouter.post('/', requireDemoAuth, async (req: Request, res: Response) => {
  try {
    const { title, description, type, category, payment_type, budget, deadline } = req.body;

    // Field validations per FR-02
    if (!title || typeof title !== 'string' || title.trim().length < 5 || title.trim().length > 100) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TITLE', message: 'Title is required and must be between 5 and 100 characters.' }
      });
    }

    if (!description || typeof description !== 'string' || description.trim().length < 20 || description.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DESCRIPTION', message: 'Description is required and must be between 20 and 2000 characters.' }
      });
    }

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TYPE', message: `Type must be one of: ${VALID_TYPES.join(', ')}.` }
      });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_CATEGORY', message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}.` }
      });
    }

    if (!VALID_PAYMENT_TYPES.includes(payment_type)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PAYMENT_TYPE', message: `Payment type must be one of: ${VALID_PAYMENT_TYPES.join(', ')}.` }
      });
    }

    // Budget validation: Positive number for Paid; null otherwise
    let finalBudget: number | null = null;
    if (payment_type === 'Paid') {
      const numBudget = Number(budget);
      if (budget === undefined || budget === null || isNaN(numBudget) || numBudget <= 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_BUDGET', message: 'Paid gigs require a positive budget amount.' }
        });
      }
      finalBudget = numBudget;
    } else {
      if (budget !== undefined && budget !== null && budget !== '') {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_BUDGET', message: 'Budget must be null for SkillSwap and Free gigs.' }
        });
      }
      finalBudget = null;
    }

    // Deadline validation: must be future date/time
    if (!deadline) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DEADLINE', message: 'Deadline is required.' }
      });
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DEADLINE', message: 'Deadline must be a valid ISO date/time string.' }
      });
    }

    if (deadlineDate.getTime() <= Date.now()) {
      return res.status(400).json({
        success: false,
        error: { code: 'PAST_DEADLINE', message: 'Deadline must be a future date and time.' }
      });
    }

    const newGig = await dbStore.runExclusive((db) => {
      // Generate ID
      const maxId = db.gigs.reduce((max, g) => (g.id > max ? g.id : max), 0);
      const gigId = Math.max(maxId + 1, 101);

      const created: Gig = {
        id: gigId,
        user_id: req.demoUserId!,
        title: title.trim(),
        description: description.trim(),
        type,
        category,
        payment_type,
        budget: finalBudget,
        deadline: deadlineDate.toISOString(),
        status: 'Open',
        accepted_applicant_id: null,
        created_at: new Date().toISOString()
      };

      db.gigs.unshift(created);
      return created;
    });

    return res.status(201).json({
      success: true,
      data: newGig,
      message: 'Gig created successfully.'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to create gig.' }
    });
  }
});

// PATCH /gigs/:id - allowed owner edit or status action
gigsRouter.patch('/:id', requireDemoAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Gig ID must be an integer.' }
      });
    }

    const { action } = req.body;

    const result = await dbStore.runExclusive((db) => {
      const gig = db.gigs.find((g) => g.id === id);
      if (!gig) {
        return { status: 404, error: { code: 'NOT_FOUND', message: `Gig with ID ${id} not found.` } };
      }

      // Owner check
      if (gig.user_id !== req.demoUserId) {
        return { status: 403, error: { code: 'FORBIDDEN', message: 'Only the gig owner can perform this action.' } };
      }

      if (action === 'complete') {
        // Enforce FR-06: In Progress -> Owner marks complete (accepted applicant required) -> Completed
        // No direct Open-to-Completed transition!
        if (gig.status !== 'In Progress') {
          return {
            status: 400,
            error: {
              code: 'INVALID_STATUS_TRANSITION',
              message: `Cannot complete gig with status "${gig.status}". Gigs must be "In Progress" with an accepted applicant before completion.`
            }
          };
        }

        if (!gig.accepted_applicant_id) {
          return {
            status: 400,
            error: {
              code: 'NO_ACCEPTED_APPLICANT',
              message: 'Cannot complete a gig without an accepted applicant.'
            }
          };
        }

        gig.status = 'Completed';
        return { status: 200, data: gig, message: 'Gig marked as Completed successfully.' };
      }

      if (action === 'cancel') {
        // Enforce FR-06: Open -> Owner cancels -> Cancelled
        if (gig.status !== 'Open') {
          return {
            status: 400,
            error: {
              code: 'INVALID_STATUS_TRANSITION',
              message: `Cannot cancel gig with status "${gig.status}". Only Open gigs can be cancelled.`
            }
          };
        }

        gig.status = 'Cancelled';
        return { status: 200, data: gig, message: 'Gig cancelled successfully.' };
      }

      return {
        status: 400,
        error: { code: 'INVALID_ACTION', message: `Invalid action "${action}". Allowed actions: "complete", "cancel".` }
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
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to update gig.' }
    });
  }
});
