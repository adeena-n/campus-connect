import { Router, Request, Response } from 'express';
import { dbStore } from '../store.ts';
import { requireDemoAuth } from '../middleware/demoAuth.ts';
import { Application } from '../types.ts';

export const applicationsRouter = Router();

// GET /applications?gig_id=101 or ?mine=true
applicationsRouter.get('/', requireDemoAuth, async (req: Request, res: Response) => {
  try {
    const { gig_id, mine } = req.query;
    const db = await dbStore.readData();

    if (mine === 'true') {
      // Current user's submitted applications
      const myApps = db.applications.filter((a) => a.applicant_id === req.demoUserId);
      const enriched = myApps.map((app) => {
        const gig = db.gigs.find((g) => g.id === app.gig_id);
        const owner = gig ? db.users.find((u) => u.id === gig.user_id) : null;
        return {
          ...app,
          gig: gig ? {
            id: gig.id,
            title: gig.title,
            type: gig.type,
            category: gig.category,
            payment_type: gig.payment_type,
            budget: gig.budget,
            status: gig.status,
            deadline: gig.deadline,
            owner_name: owner ? owner.name : 'Unknown',
            accepted_applicant_id: gig.accepted_applicant_id
          } : null
        };
      });

      return res.status(200).json({
        success: true,
        data: enriched,
        message: 'My applications retrieved successfully.'
      });
    }

    if (gig_id) {
      const gId = parseInt(gig_id as string, 10);
      if (isNaN(gId)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_GIG_ID', message: 'gig_id must be an integer.' }
        });
      }

      const gig = db.gigs.find((g) => g.id === gId);
      if (!gig) {
        return res.status(404).json({
          success: false,
          error: { code: 'GIG_NOT_FOUND', message: `Gig with ID ${gId} not found.` }
        });
      }

      // Enforce owner-only viewing of gig applications
      if (gig.user_id !== req.demoUserId) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Only the gig owner can view this gig’s applications.' }
        });
      }

      const apps = db.applications.filter((a) => a.gig_id === gId);
      const enriched = apps.map((app) => {
        const applicant = db.users.find((u) => u.id === app.applicant_id);
        return {
          ...app,
          applicant: applicant ? {
            id: applicant.id,
            name: applicant.name,
            major: applicant.major,
            semester: applicant.semester,
            bio: applicant.bio,
            skills: applicant.skills,
            stats: dbStore.calculateUserStats(applicant.id, db)
          } : null
        };
      });

      return res.status(200).json({
        success: true,
        data: enriched,
        message: 'Gig applications retrieved successfully.'
      });
    }

    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_PARAM', message: 'Specify either ?gig_id=<id> or ?mine=true.' }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to fetch applications.' }
    });
  }
});

// POST /applications - submit application
applicationsRouter.post('/', requireDemoAuth, async (req: Request, res: Response) => {
  try {
    const { gig_id, message } = req.body;

    const gId = parseInt(gig_id, 10);
    if (isNaN(gId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_GIG_ID', message: 'gig_id must be an integer.' }
      });
    }

    if (!message || typeof message !== 'string' || message.trim().length < 10 || message.trim().length > 500) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_MESSAGE', message: 'Application message is required and must be between 10 and 500 characters.' }
      });
    }

    const result = await dbStore.runExclusive((db) => {
      const gig = db.gigs.find((g) => g.id === gId);
      if (!gig) {
        return { status: 404, error: { code: 'NOT_FOUND', message: `Gig with ID ${gId} not found.` } };
      }

      // Reject own gig
      if (gig.user_id === req.demoUserId) {
        return { status: 400, error: { code: 'OWN_GIG', message: 'You cannot apply to your own gig.' } };
      }

      // Reject non-Open gig
      if (gig.status !== 'Open') {
        return { status: 400, error: { code: 'GIG_NOT_OPEN', message: `Cannot apply to gig with status "${gig.status}".` } };
      }

      // Reject expired deadline
      if (new Date(gig.deadline).getTime() <= Date.now()) {
        gig.status = 'Expired';
        return { status: 400, error: { code: 'GIG_EXPIRED', message: 'The deadline for this gig has expired.' } };
      }

      // Reject duplicate application (even if previously rejected)
      const existing = db.applications.find((a) => a.gig_id === gId && a.applicant_id === req.demoUserId);
      if (existing) {
        return {
          status: 409,
          error: { code: 'DUPLICATE_APPLICATION', message: 'You have already submitted an application for this gig.' }
        };
      }

      // Create new application
      const maxId = db.applications.reduce((max, a) => (a.id > max ? a.id : max), 0);
      const newAppId = Math.max(maxId + 1, 201);

      const created: Application = {
        id: newAppId,
        gig_id: gId,
        applicant_id: req.demoUserId!,
        message: message.trim(),
        status: 'Pending',
        created_at: new Date().toISOString()
      };

      db.applications.unshift(created);
      return { status: 201, data: created, message: 'Application submitted successfully.' };
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
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to submit application.' }
    });
  }
});

// PATCH /applications/:id - owner accepts or rejects application
applicationsRouter.patch('/:id', requireDemoAuth, async (req: Request, res: Response) => {
  try {
    const appId = parseInt(req.params.id, 10);
    if (isNaN(appId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Application ID must be an integer.' }
      });
    }

    const { action } = req.body;
    if (action !== 'accept' && action !== 'reject') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ACTION', message: 'Action must be either "accept" or "reject".' }
      });
    }

    const result = await dbStore.runExclusive((db) => {
      const application = db.applications.find((a) => a.id === appId);
      if (!application) {
        return { status: 404, error: { code: 'NOT_FOUND', message: `Application with ID ${appId} not found.` } };
      }

      const gig = db.gigs.find((g) => g.id === application.gig_id);
      if (!gig) {
        return { status: 404, error: { code: 'GIG_NOT_FOUND', message: 'Associated gig not found.' } };
      }

      // Enforce owner authorization
      if (gig.user_id !== req.demoUserId) {
        return { status: 403, error: { code: 'FORBIDDEN', message: 'Only the gig owner can accept or reject applications.' } };
      }

      // Enforce gig status Open and not expired
      if (gig.status !== 'Open') {
        return {
          status: 400,
          error: { code: 'GIG_NOT_OPEN', message: `Cannot change applicant status because gig is currently "${gig.status}".` }
        };
      }

      if (new Date(gig.deadline).getTime() <= Date.now()) {
        gig.status = 'Expired';
        return { status: 400, error: { code: 'GIG_EXPIRED', message: 'The gig deadline has expired.' } };
      }

      // Application must be in Pending status
      if (application.status !== 'Pending') {
        return {
          status: 400,
          error: { code: 'APPLICATION_NOT_PENDING', message: `Application is already ${application.status}.` }
        };
      }

      if (action === 'reject') {
        application.status = 'Rejected';
        return {
          status: 200,
          data: application,
          message: 'Application rejected.'
        };
      }

      // Action is "accept": FR-05 indivisible atomic workflow
      // 1. Accept selected application
      application.status = 'Accepted';

      // 2. Automatically reject all other Pending applications for this gig
      const otherPending = db.applications.filter((a) => a.gig_id === gig.id && a.id !== application.id && a.status === 'Pending');
      for (const other of otherPending) {
        other.status = 'Rejected';
      }

      // 3. Store selected Applications.id in gig.accepted_applicant_id
      gig.accepted_applicant_id = application.id;

      // 4. Change gig status to In Progress
      gig.status = 'In Progress';

      return {
        status: 200,
        data: {
          application,
          gig,
          rejected_count: otherPending.length
        },
        message: `Accepted application #${application.id}. Gig is now In Progress and ${otherPending.length} other pending applications were rejected.`
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
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to update application.' }
    });
  }
});
