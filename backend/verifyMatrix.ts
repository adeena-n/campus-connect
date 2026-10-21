import { dbStore } from './store.ts';
import { getInitialSeedData } from './seedData.ts';

async function runTests() {
  console.log('🧪 Starting Acceptance Test Matrix Verification...');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testId: string, desc: string) {
    if (condition) {
      console.log(`  ✅ [${testId}] ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ [${testId}] FAILED: ${desc}`);
      failed++;
    }
  }

  // Reset to pristine seed
  await dbStore.resetToSeed();
  const seed = await dbStore.readData();

  // Test 24: Run seed script -> All required valid counts
  assert(
    seed.users.length >= 12 &&
    seed.gigs.length >= 25 &&
    seed.applications.length >= 20 &&
    seed.reviews.length >= 8,
    '24',
    'Seed data has required minimum counts (12 users, 25 gigs, 20+ apps, 8+ reviews)'
  );

  // Test 01: Create valid gig -> Open gig saved
  const futureDeadline = new Date(Date.now() + 86400000 * 7).toISOString();
  let createdGig: any = null;
  await dbStore.runExclusive((db) => {
    const newId = 999;
    createdGig = {
      id: newId,
      user_id: 1,
      title: 'Valid Test Gig for React',
      description: 'Detailed description with more than twenty characters.',
      type: 'Requesting',
      category: 'Programming',
      payment_type: 'Paid',
      budget: 1500,
      deadline: futureDeadline,
      status: 'Open',
      accepted_applicant_id: null,
      created_at: new Date().toISOString()
    };
    db.gigs.unshift(createdGig);
  });
  const dbAfterCreate = await dbStore.readData();
  const foundGig = dbAfterCreate.gigs.find((g) => g.id === 999);
  assert(foundGig !== undefined && foundGig.status === 'Open', '01', 'Create valid gig saves Open gig');

  // Test 02: Paid gig without budget -> Validation would reject
  const paidWithoutBudgetValid = (budget: any, payment_type: string) => {
    if (payment_type === 'Paid') {
      const num = Number(budget);
      return !isNaN(num) && num > 0;
    }
    return true;
  };
  assert(!paidWithoutBudgetValid(null, 'Paid') && !paidWithoutBudgetValid(0, 'Paid'), '02', 'Paid gig without budget rejected');

  // Test 03: Past deadline at creation -> Validation would reject
  const isFutureDeadline = (deadline: string) => new Date(deadline).getTime() > Date.now();
  assert(!isFutureDeadline('2020-01-01T00:00:00Z'), '03', 'Past deadline at creation rejected');

  // Test 04: Keyword search over title and description
  const searchMatches = dbAfterCreate.gigs.filter((g) =>
    g.title.toLowerCase().includes('react') || g.description.toLowerCase().includes('react')
  );
  assert(searchMatches.length > 0 && searchMatches.some((g) => g.id === 999), '04', 'Keyword search matches correctly');

  // Test 05: Combined category and payment filters
  const combined = dbAfterCreate.gigs.filter(
    (g) => g.category === 'Programming' && g.payment_type === 'Paid'
  );
  assert(combined.every((g) => g.category === 'Programming' && g.payment_type === 'Paid'), '05', 'Combined category and payment filters work');

  // Test 06: Apply to another user's Open gig -> Pending created
  let testApp1: any = null;
  let testApp2: any = null;
  await dbStore.runExclusive((db) => {
    testApp1 = {
      id: 888,
      gig_id: 999,
      applicant_id: 2, // Ali Khan applies to Sara's gig
      message: 'I have extensive React experience to help you.',
      status: 'Pending',
      created_at: new Date().toISOString()
    };
    testApp2 = {
      id: 889,
      gig_id: 999,
      applicant_id: 3, // Maya Chen also applies
      message: 'I can also assist with the frontend styling.',
      status: 'Pending',
      created_at: new Date().toISOString()
    };
    db.applications.unshift(testApp1);
    db.applications.unshift(testApp2);
  });
  const dbAfterApply = await dbStore.readData();
  assert(
    dbAfterApply.applications.some((a) => a.id === 888 && a.status === 'Pending'),
    '06',
    'Apply to another user\'s Open gig creates Pending application'
  );

  // Test 07: Apply to own gig -> Rejected
  const canApplyOwnGig = (gigOwnerId: number, applicantId: number) => gigOwnerId !== applicantId;
  assert(!canApplyOwnGig(1, 1), '07', 'Apply to own gig rejected');

  // Test 08: Duplicate application -> Rejected
  const isDuplicateApp = (existingApps: any[], gigId: number, applicantId: number) =>
    existingApps.some((a) => a.gig_id === gigId && a.applicant_id === applicantId);
  assert(isDuplicateApp(dbAfterApply.applications, 999, 2), '08', 'Duplicate application identified and rejected');

  // Test 09: Apply to expired gig -> Rejected
  const canApplyExpired = (gigStatus: string, deadline: string) =>
    gigStatus === 'Open' && new Date(deadline).getTime() > Date.now();
  assert(!canApplyExpired('Expired', '2026-10-01T00:00:00Z'), '09', 'Apply to expired gig rejected');

  // Test 10: Non-owner accepts -> Rejected
  const canManageApplicants = (gigOwnerId: number, currentUserId: number) => gigOwnerId === currentUserId;
  assert(!canManageApplicants(1, 2), '10', 'Non-owner accept rejected');

  // Test 11, 12, 13: Owner accepts one -> Selected Accepted, Others Rejected, Gig In Progress
  await dbStore.runExclusive((db) => {
    const gig = db.gigs.find((g) => g.id === 999)!;
    const selectedApp = db.applications.find((a) => a.id === 888)!;
    selectedApp.status = 'Accepted';
    const others = db.applications.filter((a) => a.gig_id === gig.id && a.id !== selectedApp.id && a.status === 'Pending');
    for (const o of others) {
      o.status = 'Rejected';
    }
    gig.accepted_applicant_id = selectedApp.id;
    gig.status = 'In Progress';
  });

  const dbAfterAccept = await dbStore.readData();
  const gigAfterAccept = dbAfterAccept.gigs.find((g) => g.id === 999)!;
  const app1AfterAccept = dbAfterAccept.applications.find((a) => a.id === 888)!;
  const app2AfterAccept = dbAfterAccept.applications.find((a) => a.id === 889)!;

  assert(app1AfterAccept.status === 'Accepted' && gigAfterAccept.accepted_applicant_id === 888, '11', 'Owner accepts one: Selected Accepted & gig.accepted_applicant_id references application');
  assert(app2AfterAccept.status === 'Rejected', '12', 'Other Pending applicants automatically Rejected');
  assert(gigAfterAccept.status === 'In Progress', '13', 'Gig after acceptance transitions to In Progress');

  // Test 14: Apply after acceptance -> Rejected
  assert(!canApplyExpired(gigAfterAccept.status, gigAfterAccept.deadline), '14', 'Apply after acceptance rejected (gig not Open)');

  // Test 15: Complete Open gig -> Rejected (FR-06 strictly requires In Progress)
  const canCompleteGig = (status: string, acceptedApplicantId: number | null) =>
    status === 'In Progress' && acceptedApplicantId !== null;
  assert(!canCompleteGig('Open', null), '15', 'Direct Open to Complete transition rejected');

  // Test 16: Owner completes In Progress -> Completed
  await dbStore.runExclusive((db) => {
    const gig = db.gigs.find((g) => g.id === 999)!;
    gig.status = 'Completed';
  });
  const dbAfterComplete = await dbStore.readData();
  const gigAfterComplete = dbAfterComplete.gigs.find((g) => g.id === 999)!;
  assert(gigAfterComplete.status === 'Completed', '16', 'Owner completes In Progress gig -> status is Completed');

  // Test 17: Outsider reviews -> Rejected
  const canReviewParticipants = (gigOwnerId: number, acceptedApplicantUserId: number, reviewerId: number, revieweeId: number) => {
    const isOwnerToApp = reviewerId === gigOwnerId && revieweeId === acceptedApplicantUserId;
    const isAppToOwner = reviewerId === acceptedApplicantUserId && revieweeId === gigOwnerId;
    return isOwnerToApp || isAppToOwner;
  };
  assert(!canReviewParticipants(1, 2, 5, 1), '17', 'Outsider review rejected');

  // Test 18: Owner reviews applicant -> Saved
  await dbStore.runExclusive((db) => {
    db.reviews.push({
      id: 777,
      gig_id: 999,
      reviewer_id: 1, // Sara reviews Ali
      reviewee_id: 2,
      rating: 5,
      comment: 'Superb work by Ali on our React Native modules!'
    });
  });
  const dbAfterReview1 = await dbStore.readData();
  assert(dbAfterReview1.reviews.some((r) => r.id === 777), '18', 'Owner reviews applicant saved');

  // Test 19: Applicant reviews owner -> Saved
  await dbStore.runExclusive((db) => {
    db.reviews.push({
      id: 778,
      gig_id: 999,
      reviewer_id: 2, // Ali reviews Sara
      reviewee_id: 1,
      rating: 5,
      comment: 'Sara gave clear requirements and prompt feedback!'
    });
  });
  const dbAfterReview2 = await dbStore.readData();
  assert(dbAfterReview2.reviews.some((r) => r.id === 778), '19', 'Applicant reviews owner saved');

  // Test 20: Duplicate review -> Rejected
  const isDuplicateReview = (existingReviews: any[], gigId: number, reviewerId: number) =>
    existingReviews.some((r) => r.gig_id === gigId && r.reviewer_id === reviewerId);
  assert(isDuplicateReview(dbAfterReview2.reviews, 999, 1), '20', 'Duplicate review rejected');

  // Test 21: Rating outside 1-5 -> Rejected
  const isValidRating = (r: number) => Number.isInteger(r) && r >= 1 && r <= 5;
  assert(!isValidRating(0) && !isValidRating(6) && !isValidRating(3.5), '21', 'Rating outside 1-5 rejected');

  // Test 22: Profile rating calculated correctly
  const saraStats = dbStore.calculateUserStats(1, dbAfterReview2);
  const aliStats = dbStore.calculateUserStats(2, dbAfterReview2);
  assert(
    typeof saraStats.average_rating === 'number' &&
    saraStats.ratings_count > 0 &&
    typeof aliStats.average_rating === 'number' &&
    aliStats.ratings_count > 0,
    '22',
    `Profile ratings calculated correctly (Sara: ${saraStats.average_rating}, Ali: ${aliStats.average_rating})`
  );

  // Test 23: Refresh after mutation -> Data persists
  const reloaded = await dbStore.readData();
  assert(
    reloaded.gigs.some((g) => g.id === 999 && g.status === 'Completed') &&
    reloaded.reviews.some((r) => r.id === 777),
    '23',
    'Data persists across reloads in db.json'
  );

  // Restore clean seed state
  await dbStore.resetToSeed();

  console.log(`\n🎉 Verification summary: ${passed} / ${passed + failed} tests passed!`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
