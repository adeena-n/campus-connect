import { supabase, isSupabaseServerConfigured } from '../supabase.ts';
import { localEngine } from './localEngine.ts';
import {
  User,
  Gig,
  Application,
  Review,
  UserStats,
  GigType,
  GigCategory,
  PaymentType
} from '../types.ts';

export class SupabaseDbService {
  public isLiveCloud(): boolean {
    return isSupabaseServerConfigured();
  }

  // 1. Evaluate Expirations
  public async evaluateExpirations(): Promise<number> {
    if (!this.isLiveCloud()) {
      return 0;
    }

    const client = supabase.client;
    const nowIso = new Date().toISOString();

    const { data, error } = await client
      .from('gigs')
      .update({ status: 'Expired' })
      .eq('status', 'Open')
      .lte('deadline', nowIso)
      .select('id');

    if (error) {
      console.warn('Failed to evaluate gig expirations:', error.message);
      return 0;
    }
    return data?.length || 0;
  }

  // 2. User Stats / Reputation Calculation
  public async calculateUserStats(userId: number): Promise<UserStats> {
    if (!this.isLiveCloud()) {
      return localEngine.calculateUserStats(userId);
    }

    const client = supabase.client;

    const { count: gigsPosted } = await client
      .from('gigs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { data: ownedCompleted } = await client
      .from('gigs')
      .select('id')
      .eq('status', 'Completed')
      .eq('user_id', userId);

    const { data: acceptedApps } = await client
      .from('applications')
      .select('id, gig_id')
      .eq('applicant_id', userId)
      .eq('status', 'Accepted');

    const acceptedGigIds = (acceptedApps || []).map((a) => a.gig_id);
    let applicantCompletedCount = 0;
    if (acceptedGigIds.length > 0) {
      const { data: compGigsAsApplicant } = await client
        .from('gigs')
        .select('id')
        .eq('status', 'Completed')
        .in('id', acceptedGigIds);
      applicantCompletedCount = compGigsAsApplicant?.length || 0;
    }

    const completedGigsTotal = (ownedCompleted?.length || 0) + applicantCompletedCount;

    const { data: reviews } = await client
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', userId);

    let avgRating: number | null = null;
    const ratingsCount = reviews?.length || 0;
    if (ratingsCount > 0) {
      const sum = (reviews || []).reduce((acc, r) => acc + Number(r.rating), 0);
      avgRating = Math.round((sum / ratingsCount) * 100) / 100;
    }

    return {
      gigs_posted: gigsPosted || 0,
      gigs_completed: completedGigsTotal,
      average_rating: avgRating,
      ratings_count: ratingsCount
    };
  }

  // 3. User operations
  public async getUsers(): Promise<User[]> {
    if (!this.isLiveCloud()) {
      return localEngine.getUsers();
    }

    const client = supabase.client;
    const { data, error } = await client
      .from('users')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw new Error(`Failed to fetch users: ${error.message}`);
    const users = (data || []) as User[];

    return Promise.all(
      users.map(async (u) => ({
        ...u,
        stats: await this.calculateUserStats(u.id)
      }))
    );
  }

  public async getUserById(id: number): Promise<User | null> {
    if (!this.isLiveCloud()) {
      return localEngine.getUserById(id);
    }

    const client = supabase.client;
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    const user = data as User;
    user.stats = await this.calculateUserStats(user.id);
    return user;
  }

  public async getUserByAuthId(authUserId: string): Promise<User | null> {
    if (!this.isLiveCloud()) {
      const users = await localEngine.getUsers();
      return users.find((u) => u.auth_user_id === authUserId) || null;
    }

    const client = supabase.client;
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (error || !data) return null;
    const user = data as User;
    user.stats = await this.calculateUserStats(user.id);
    return user;
  }

  public async getUserByEmail(email: string): Promise<User | null> {
    if (!this.isLiveCloud()) {
      return localEngine.getUserByEmail(email);
    }

    const client = supabase.client;
    const { data, error } = await client
      .from('users')
      .select('*')
      .ilike('email', email.trim().toLowerCase())
      .maybeSingle();

    if (error || !data) return null;
    const user = data as User;
    user.stats = await this.calculateUserStats(user.id);
    return user;
  }

  public async linkOrRegisterAuthProfile(authUser: {
    id: string;
    email?: string;
    user_metadata?: any;
  }): Promise<User> {
    if (!this.isLiveCloud()) {
      const existing = await localEngine.getUserByEmail(authUser.email || '');
      if (existing) return existing;
      return localEngine.register({
        email: authUser.email || `student_${Date.now()}@campus.edu`,
        name: authUser.user_metadata?.name || 'Student Member',
        major: authUser.user_metadata?.major || 'Computer Science',
        semester: authUser.user_metadata?.semester || 1,
        bio: authUser.user_metadata?.bio || 'CampusConnect student member.',
        skills: authUser.user_metadata?.skills || []
      });
    }

    const client = supabase.client;
    const existing = await this.getUserByAuthId(authUser.id);
    if (existing) return existing;

    if (authUser.email) {
      const matchByEmail = await this.getUserByEmail(authUser.email);
      if (matchByEmail) {
        const { data: updated, error } = await client
          .from('users')
          .update({ auth_user_id: authUser.id })
          .eq('id', matchByEmail.id)
          .select()
          .single();

        if (!error && updated) {
          const user = updated as User;
          user.stats = await this.calculateUserStats(user.id);
          return user;
        }
      }
    }

    const meta = authUser.user_metadata || {};
    const name = meta.name || authUser.email?.split('@')[0] || 'Student Member';
    const major = meta.major || 'Undeclared';
    const semester = Number(meta.semester) || 1;
    const bio = meta.bio || 'CampusConnect student member.';
    const skills = Array.isArray(meta.skills) ? meta.skills : [];

    const { data: created, error: insertErr } = await client
      .from('users')
      .insert({
        auth_user_id: authUser.id,
        email: authUser.email?.trim().toLowerCase() || null,
        name,
        major,
        semester,
        bio,
        skills
      })
      .select()
      .single();

    if (insertErr || !created) {
      throw new Error(`Failed to create student profile in Supabase: ${insertErr?.message}`);
    }

    const user = created as User;
    user.stats = await this.calculateUserStats(user.id);
    return user;
  }

  public async updateUser(
    id: number,
    data: { bio?: string; skills?: string[]; major?: string; semester?: number }
  ): Promise<User> {
    if (!this.isLiveCloud()) {
      return localEngine.updateUser(id, data);
    }

    const client = supabase.client;
    const updatePayload: any = {};
    if (data.bio !== undefined) updatePayload.bio = data.bio.trim();
    if (data.skills !== undefined) updatePayload.skills = data.skills;
    if (data.major !== undefined) updatePayload.major = data.major.trim();
    if (data.semester !== undefined) updatePayload.semester = Number(data.semester);

    const { data: updated, error } = await client
      .from('users')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !updated) {
      throw new Error(`Failed to update student profile: ${error?.message}`);
    }

    const user = updated as User;
    user.stats = await this.calculateUserStats(user.id);
    return user;
  }

  // 4. Gig operations
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
    if (!this.isLiveCloud()) {
      return localEngine.getGigs(filter);
    }

    await this.evaluateExpirations();
    const client = supabase.client;

    let query = client.from('gigs').select('*');

    if (filter.category && filter.category !== 'All') {
      query = query.ilike('category', filter.category);
    }
    if (filter.type && filter.type !== 'All') {
      query = query.ilike('type', filter.type);
    }
    if (filter.payment_type && filter.payment_type !== 'All') {
      query = query.ilike('payment_type', filter.payment_type);
    }
    if (filter.status && filter.status !== 'All') {
      query = query.ilike('status', filter.status);
    }
    if (filter.user_id) {
      query = query.eq('user_id', filter.user_id);
    }
    if (filter.min_budget !== undefined && filter.min_budget !== null) {
      query = query.gte('budget', filter.min_budget);
    }
    if (filter.max_budget !== undefined && filter.max_budget !== null) {
      query = query.lte('budget', filter.max_budget);
    }
    if (filter.q && filter.q.trim().length > 0) {
      const q = filter.q.trim();
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data: gigs, error } = await query;
    if (error) throw new Error(`Failed to query gigs: ${error.message}`);

    const gigList = gigs || [];
    if (gigList.length === 0) return [];

    const userIds = [...new Set(gigList.map((g) => g.user_id))];
    const gigIds = gigList.map((g) => g.id);

    const [usersRes, appsRes] = await Promise.all([
      client.from('users').select('*').in('id', userIds),
      client.from('applications').select('id, gig_id').in('gig_id', gigIds)
    ]);

    const usersMap = new Map((usersRes.data || []).map((u) => [u.id, u]));
    const appCountMap = new Map<number, number>();
    for (const app of appsRes.data || []) {
      appCountMap.set(app.gig_id, (appCountMap.get(app.gig_id) || 0) + 1);
    }

    return Promise.all(
      gigList.map(async (g) => {
        const owner = usersMap.get(g.user_id);
        let ownerWithStats = null;
        if (owner) {
          ownerWithStats = {
            ...owner,
            stats: await this.calculateUserStats(owner.id)
          };
        }
        return {
          ...g,
          owner: ownerWithStats,
          applications_count: appCountMap.get(g.id) || 0
        };
      })
    );
  }

  public async getGigById(id: number): Promise<any | null> {
    if (!this.isLiveCloud()) {
      return localEngine.getGigById(id);
    }

    await this.evaluateExpirations();
    const client = supabase.client;

    const { data: gig, error } = await client
      .from('gigs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !gig) return null;

    const owner = await this.getUserById(gig.user_id);
    const { count: appCount } = await client
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('gig_id', gig.id);

    let acceptedApplicant: any = null;
    let acceptedApplication: any = null;
    if (gig.accepted_applicant_id) {
      const { data: appData } = await client
        .from('applications')
        .select('*')
        .eq('id', gig.accepted_applicant_id)
        .maybeSingle();

      if (appData) {
        acceptedApplication = appData;
        acceptedApplicant = await this.getUserById(appData.applicant_id);
      }
    }

    return {
      ...gig,
      owner,
      accepted_applicant: acceptedApplicant,
      accepted_application: acceptedApplication,
      applications_count: appCount || 0
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
    if (!this.isLiveCloud()) {
      return localEngine.createGig(data);
    }

    const client = supabase.client;
    const { data: created, error } = await client
      .from('gigs')
      .insert({
        user_id: data.user_id,
        title: data.title.trim(),
        description: data.description.trim(),
        type: data.type,
        category: data.category,
        payment_type: data.payment_type,
        budget: data.payment_type === 'Paid' ? data.budget : null,
        deadline: data.deadline,
        status: 'Open'
      })
      .select()
      .single();

    if (error || !created) {
      throw new Error(`Failed to create gig: ${error?.message}`);
    }

    return created as Gig;
  }

  public async updateGigAction(
    gigId: number,
    ownerUserId: number,
    action: 'complete' | 'cancel'
  ): Promise<Gig> {
    if (!this.isLiveCloud()) {
      return localEngine.updateGigAction(gigId, ownerUserId, action);
    }

    const client = supabase.client;
    const { data: gig, error } = await client
      .from('gigs')
      .select('*')
      .eq('id', gigId)
      .single();

    if (error || !gig) {
      throw new Error(`Gig with ID ${gigId} not found.`);
    }

    if (gig.user_id !== ownerUserId) {
      throw new Error('Forbidden: Only the gig owner can perform this action.');
    }

    if (action === 'complete') {
      if (gig.status !== 'In Progress') {
        throw new Error(
          `Cannot complete gig with status "${gig.status}". Gigs must be "In Progress" with an accepted applicant before completion.`
        );
      }
      if (!gig.accepted_applicant_id) {
        throw new Error('Cannot complete a gig without an accepted applicant.');
      }

      const { data: updated, error: updateErr } = await client
        .from('gigs')
        .update({ status: 'Completed' })
        .eq('id', gigId)
        .select()
        .single();

      if (updateErr || !updated) {
        throw new Error(`Failed to complete gig: ${updateErr?.message}`);
      }
      return updated as Gig;
    }

    if (action === 'cancel') {
      if (gig.status !== 'Open') {
        throw new Error(
          `Cannot cancel gig with status "${gig.status}". Only Open gigs can be cancelled.`
        );
      }

      const { data: updated, error: updateErr } = await client
        .from('gigs')
        .update({ status: 'Cancelled' })
        .eq('id', gigId)
        .select()
        .single();

      if (updateErr || !updated) {
        throw new Error(`Failed to cancel gig: ${updateErr?.message}`);
      }
      return updated as Gig;
    }

    throw new Error(`Invalid action "${action}". Allowed: "complete", "cancel".`);
  }

  // 5. Application operations
  public async getApplicationsByGig(gigId: number, ownerUserId: number): Promise<any[]> {
    if (!this.isLiveCloud()) {
      return localEngine.getApplicationsByGig(gigId, ownerUserId);
    }

    const client = supabase.client;
    const { data: gig, error: gigErr } = await client
      .from('gigs')
      .select('*')
      .eq('id', gigId)
      .single();

    if (gigErr || !gig) throw new Error(`Gig with ID ${gigId} not found.`);

    if (gig.user_id !== ownerUserId) {
      throw new Error('Forbidden: Only the gig owner can view this gig\'s applications.');
    }

    const { data: apps, error } = await client
      .from('applications')
      .select('*')
      .eq('gig_id', gigId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch applications: ${error.message}`);
    const appList = apps || [];

    return Promise.all(
      appList.map(async (a) => {
        const applicant = await this.getUserById(a.applicant_id);
        return {
          ...a,
          applicant
        };
      })
    );
  }

  public async getApplicationsByUser(applicantId: number): Promise<any[]> {
    if (!this.isLiveCloud()) {
      return localEngine.getApplicationsByUser(applicantId);
    }

    const client = supabase.client;
    const { data: apps, error } = await client
      .from('applications')
      .select('*')
      .eq('applicant_id', applicantId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch applications: ${error.message}`);
    const appList = apps || [];

    return Promise.all(
      appList.map(async (a) => {
        const gig = await this.getGigById(a.gig_id);
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
                owner_name: gig.owner?.name || 'Unknown',
                accepted_applicant_id: gig.accepted_applicant_id
              }
            : null
        };
      })
    );
  }

  public async createApplication(data: {
    gig_id: number;
    applicant_id: number;
    message: string;
  }): Promise<Application> {
    if (!this.isLiveCloud()) {
      return localEngine.createApplication(data);
    }

    const client = supabase.client;
    const { data: gig, error: gigErr } = await client
      .from('gigs')
      .select('*')
      .eq('id', data.gig_id)
      .single();

    if (gigErr || !gig) throw new Error(`Gig with ID ${data.gig_id} not found.`);

    if (gig.user_id === data.applicant_id) {
      throw new Error('Forbidden: You cannot apply to your own gig.');
    }
    if (gig.status !== 'Open') {
      throw new Error(`Cannot apply to gig with status "${gig.status}".`);
    }
    if (new Date(gig.deadline).getTime() <= Date.now()) {
      await client.from('gigs').update({ status: 'Expired' }).eq('id', gig.id);
      throw new Error('The deadline for this gig has expired.');
    }

    const { data: existingApp } = await client
      .from('applications')
      .select('id')
      .eq('gig_id', data.gig_id)
      .eq('applicant_id', data.applicant_id)
      .maybeSingle();

    if (existingApp) {
      throw new Error('Duplicate: You have already submitted an application for this gig.');
    }

    const { data: created, error } = await client
      .from('applications')
      .insert({
        gig_id: data.gig_id,
        applicant_id: data.applicant_id,
        message: data.message.trim(),
        status: 'Pending'
      })
      .select()
      .single();

    if (error || !created) {
      throw new Error(`Failed to submit application: ${error?.message}`);
    }

    return created as Application;
  }

  public async updateApplicationAction(
    applicationId: number,
    ownerUserId: number,
    action: 'accept' | 'reject'
  ): Promise<{ application: Application; gig?: Gig; rejected_count?: number }> {
    if (!this.isLiveCloud()) {
      return localEngine.updateApplicationAction(applicationId, ownerUserId, action);
    }

    const client = supabase.client;

    if (action === 'accept') {
      const { data: rpcData, error: rpcErr } = await client.rpc('accept_applicant', {
        p_application_id: applicationId,
        p_owner_user_id: ownerUserId
      });

      if (!rpcErr && rpcData) {
        const { data: updatedApp } = await client
          .from('applications')
          .select('*')
          .eq('id', applicationId)
          .single();

        const { data: updatedGig } = await client
          .from('gigs')
          .select('*')
          .eq('id', rpcData.gig_id)
          .single();

        return {
          application: updatedApp as Application,
          gig: updatedGig as Gig,
          rejected_count: rpcData.rejected_count
        };
      }

      const { data: application, error: appErr } = await client
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (appErr || !application) {
        throw new Error(`Application with ID ${applicationId} not found.`);
      }

      const { data: gig, error: gigErr } = await client
        .from('gigs')
        .select('*')
        .eq('id', application.gig_id)
        .single();

      if (gigErr || !gig) throw new Error('Associated gig not found.');
      if (gig.user_id !== ownerUserId) {
        throw new Error('Forbidden: Only the gig owner can accept or reject applications.');
      }
      if (gig.status !== 'Open') {
        throw new Error(`Cannot change applicant status because gig is currently "${gig.status}".`);
      }
      if (new Date(gig.deadline).getTime() <= Date.now()) {
        await client.from('gigs').update({ status: 'Expired' }).eq('id', gig.id);
        throw new Error('The gig deadline has expired.');
      }
      if (application.status !== 'Pending') {
        throw new Error(`Application is already ${application.status}.`);
      }

      const { data: acceptedApp } = await client
        .from('applications')
        .update({ status: 'Accepted' })
        .eq('id', applicationId)
        .select()
        .single();

      const { data: rejectedOthers } = await client
        .from('applications')
        .update({ status: 'Rejected' })
        .eq('gig_id', gig.id)
        .neq('id', applicationId)
        .eq('status', 'Pending')
        .select();

      const { data: updatedGig } = await client
        .from('gigs')
        .update({
          status: 'In Progress',
          accepted_applicant_id: applicationId
        })
        .eq('id', gig.id)
        .select()
        .single();

      return {
        application: acceptedApp as Application,
        gig: updatedGig as Gig,
        rejected_count: rejectedOthers?.length || 0
      };
    }

    if (action === 'reject') {
      const { data: application, error: appErr } = await client
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (appErr || !application) {
        throw new Error(`Application with ID ${applicationId} not found.`);
      }

      const { data: gig, error: gigErr } = await client
        .from('gigs')
        .select('user_id')
        .eq('id', application.gig_id)
        .single();

      if (gigErr || !gig) throw new Error('Associated gig not found.');
      if (gig.user_id !== ownerUserId) {
        throw new Error('Forbidden: Only the gig owner can accept or reject applications.');
      }
      if (application.status !== 'Pending') {
        throw new Error(`Application is already ${application.status}.`);
      }

      const { data: rejectedApp, error: rejectErr } = await client
        .from('applications')
        .update({ status: 'Rejected' })
        .eq('id', applicationId)
        .select()
        .single();

      if (rejectErr) throw new Error(`Failed to reject application: ${rejectErr.message}`);

      return {
        application: rejectedApp as Application
      };
    }

    throw new Error(`Invalid action "${action}". Allowed: "accept", "reject".`);
  }

  // 6. Review operations
  public async getReviews(filter: { reviewee_id?: number; gig_id?: number }): Promise<any[]> {
    if (!this.isLiveCloud()) {
      return localEngine.getReviews(filter);
    }

    const client = supabase.client;
    let query = client.from('reviews').select('*');
    if (filter.reviewee_id) query = query.eq('reviewee_id', filter.reviewee_id);
    if (filter.gig_id) query = query.eq('gig_id', filter.gig_id);

    query = query.order('created_at', { ascending: false });

    const { data: reviews, error } = await query;
    if (error) throw new Error(`Failed to query reviews: ${error.message}`);
    const reviewList = reviews || [];
    if (reviewList.length === 0) return [];

    const userIds = [
      ...new Set([
        ...reviewList.map((r) => r.reviewer_id),
        ...reviewList.map((r) => r.reviewee_id)
      ])
    ];
    const gigIds = [...new Set(reviewList.map((r) => r.gig_id))];

    const [usersRes, gigsRes] = await Promise.all([
      client.from('users').select('id, name, major, semester').in('id', userIds),
      client.from('gigs').select('id, title').in('id', gigIds)
    ]);

    const usersMap = new Map((usersRes.data || []).map((u) => [u.id, u]));
    const gigsMap = new Map((gigsRes.data || []).map((g) => [g.id, g.title]));

    return reviewList.map((rev) => ({
      ...rev,
      reviewer: usersMap.get(rev.reviewer_id) || null,
      reviewee: usersMap.get(rev.reviewee_id) || null,
      gig_title: gigsMap.get(rev.gig_id) || 'Gig'
    }));
  }

  public async createReview(data: {
    gig_id: number;
    reviewer_id: number;
    reviewee_id: number;
    rating: number;
    comment: string;
  }): Promise<{ review: Review; reviewee_stats: UserStats }> {
    if (!this.isLiveCloud()) {
      return localEngine.createReview(data);
    }

    const client = supabase.client;

    if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
      throw new Error('Rating must be an integer between 1 and 5.');
    }
    if (!data.comment || data.comment.trim().length === 0) {
      throw new Error('Comment is required.');
    }
    if (data.reviewer_id === data.reviewee_id) {
      throw new Error('Self-review forbidden: You cannot review yourself.');
    }

    const { data: gig, error: gigErr } = await client
      .from('gigs')
      .select('*')
      .eq('id', data.gig_id)
      .single();

    if (gigErr || !gig) throw new Error(`Gig with ID ${data.gig_id} not found.`);

    if (gig.status !== 'Completed') {
      throw new Error(`Reviews are only allowed after a gig is Completed. Current status: "${gig.status}".`);
    }
    if (!gig.accepted_applicant_id) {
      throw new Error('Gig has no accepted applicant.');
    }

    const { data: acceptedApp } = await client
      .from('applications')
      .select('*')
      .eq('id', gig.accepted_applicant_id)
      .single();

    if (!acceptedApp) throw new Error('Accepted application record not found.');

    const ownerId = gig.user_id;
    const applicantId = acceptedApp.applicant_id;

    const isOwnerReviewingApplicant = data.reviewer_id === ownerId && data.reviewee_id === applicantId;
    const isApplicantReviewingOwner = data.reviewer_id === applicantId && data.reviewee_id === ownerId;

    if (!isOwnerReviewingApplicant && !isApplicantReviewingOwner) {
      throw new Error(
        'Forbidden: Only authorized participants (gig owner and accepted applicant) can review each other on completed gigs.'
      );
    }

    const { data: existingReview } = await client
      .from('reviews')
      .select('id')
      .eq('gig_id', data.gig_id)
      .eq('reviewer_id', data.reviewer_id)
      .maybeSingle();

    if (existingReview) {
      throw new Error('Duplicate: You have already submitted a review for this gig.');
    }

    const { data: created, error: insertErr } = await client
      .from('reviews')
      .insert({
        gig_id: data.gig_id,
        reviewer_id: data.reviewer_id,
        reviewee_id: data.reviewee_id,
        rating: data.rating,
        comment: data.comment.trim()
      })
      .select()
      .single();

    if (insertErr || !created) {
      throw new Error(`Failed to submit review: ${insertErr?.message}`);
    }

    const updatedRevieweeStats = await this.calculateUserStats(data.reviewee_id);

    return {
      review: created as Review,
      reviewee_stats: updatedRevieweeStats
    };
  }
}

export const supabaseDb = new SupabaseDbService();
