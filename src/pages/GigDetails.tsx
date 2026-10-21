import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Gig, Application, Review } from '../types.ts';
import { GigStatusBadge, PaymentBadge, GigTypeBadge, ApplicationStatusBadge } from '../components/StatusBadge.tsx';
import { ApplyModal } from '../components/ApplyModal.tsx';
import { ReviewModal } from '../components/ReviewModal.tsx';
import {
  ArrowLeft,
  Clock,
  Star,
  Users,
  CheckCircle2,
  AlertCircle,
  Send,
  Calendar,
  Lock,
  ChevronRight,
  ShieldCheck,
  Briefcase
} from 'lucide-react';

export const GigDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const gigId = parseInt(id || '', 10);
  const navigate = useNavigate();
  const { currentUser, addToast, refreshCurrentUser } = useAuth();

  const [gig, setGig] = useState<Gig | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userApplication, setUserApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ id: number; name: string } | null>(null);

  const [processingAction, setProcessingAction] = useState<string | null>(null);

  const fetchGigData = useCallback(async () => {
    if (isNaN(gigId)) {
      setError('Invalid Gig ID.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const gigData = await api.getGig(gigId);
      setGig(gigData);

      if (gigData.status === 'Completed') {
        const revs = await api.getReviews({ gig_id: gigId });
        setReviews(revs);
      }

      if (currentUser && gigData.user_id === currentUser.id) {
        try {
          const apps = await api.getGigApplications(gigId);
          setApplications(apps);
        } catch (err) {
          console.error('Failed to fetch gig applications:', err);
        }
      } else if (currentUser) {
        try {
          const myApps = await api.getMyApplications();
          const match = myApps.find((a) => a.gig_id === gigId);
          setUserApplication(match || null);
        } catch (err) {
          console.error('Failed to fetch user application:', err);
        }
      }
    } catch (err: any) {
      console.error('Error fetching gig details:', err);
      setError(err.message || 'Gig not found or server error.');
    } finally {
      setLoading(false);
    }
  }, [gigId, currentUser?.id]);

  useEffect(() => {
    fetchGigData();
  }, [fetchGigData]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse py-8">
        <div className="h-4 w-32 bg-[#E7E8E1] rounded"></div>
        <div className="h-64 bg-white rounded-xl border border-[#E7E8E1]"></div>
      </div>
    );
  }

  if (error || !gig) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-xl p-8 border border-[#E7E8E1] text-center shadow-xs">
        <AlertCircle className="w-10 h-10 text-[#C77755] mx-auto mb-3" />
        <h2 className="text-xl font-serif text-[#202820]">Listing Not Found</h2>
        <p className="text-xs text-[#72766F] mt-1">{error || 'This campus listing does not exist.'}</p>
        <Link
          to="/explore"
          className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-[#18392B] text-[#FAF9F6] rounded-lg text-xs font-semibold hover:bg-[#23523E] transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </Link>
      </div>
    );
  }

  const isOwner = currentUser?.id === gig.user_id;
  const isDeadlinePassed = new Date(gig.deadline).getTime() <= Date.now();
  const isOpen = gig.status === 'Open' && !isDeadlinePassed;
  const isInProgress = gig.status === 'In Progress';
  const isCompleted = gig.status === 'Completed';

  const isAcceptedApplicant =
    currentUser &&
    gig.accepted_applicant &&
    gig.accepted_applicant.id === currentUser.id;

  const hasOwnerReviewed = reviews.some((r) => r.reviewer_id === gig.user_id);
  const hasApplicantReviewed =
    gig.accepted_applicant &&
    reviews.some((r) => r.reviewer_id === gig.accepted_applicant?.id);

  const handleCompleteGig = async () => {
    if (!window.confirm('Mark this gig as Completed? This moves the gig to Completed and allows both participants to submit mutual reviews.')) {
      return;
    }
    setProcessingAction('complete');
    try {
      await api.updateGigAction(gig.id, 'complete');
      addToast('Gig Completed', 'Participants can now review each other.', 'success');
      await refreshCurrentUser();
      await fetchGigData();
    } catch (err: any) {
      addToast('Failed to Complete', err.message, 'error');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleCancelGig = async () => {
    if (!window.confirm('Cancel this gig? It will no longer receive applications.')) {
      return;
    }
    setProcessingAction('cancel');
    try {
      await api.updateGigAction(gig.id, 'cancel');
      addToast('Gig Cancelled', 'The gig status has been updated to Cancelled.', 'info');
      await fetchGigData();
    } catch (err: any) {
      addToast('Failed to Cancel', err.message, 'error');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleAcceptApplicant = async (applicationId: number, applicantName: string) => {
    const confirmMsg =
      `Accept ${applicantName} for this gig?\n\n` +
      `• Selected application becomes Accepted\n` +
      `• Remaining pending applications will be automatically rejected\n` +
      `• Gig status moves to In Progress`;

    if (!window.confirm(confirmMsg)) return;

    setProcessingAction(`accept_${applicationId}`);
    try {
      await api.updateApplicationAction(applicationId, 'accept');
      addToast(
        'Collaborator Accepted',
        `Accepted ${applicantName}. Other pending applications were automatically rejected.`,
        'success'
      );
      await fetchGigData();
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleRejectApplicant = async (applicationId: number, applicantName: string) => {
    if (!window.confirm(`Reject ${applicantName}'s application?`)) return;

    setProcessingAction(`reject_${applicationId}`);
    try {
      await api.updateApplicationAction(applicationId, 'reject');
      addToast('Application Rejected', `Rejected application #${applicationId}.`, 'info');
      await fetchGigData();
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setProcessingAction(null);
    }
  };

  const openReviewModal = (targetId: number, targetName: string) => {
    setReviewTarget({ id: targetId, name: targetName });
    setReviewModalOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Editorial Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-[#72766F]">
        <Link to="/explore" className="hover:text-[#18392B] transition">
          Marketplace
        </Link>
        <span>/</span>
        <Link to={`/explore?category=${gig.category}`} className="hover:text-[#18392B] transition">
          {gig.category}
        </Link>
        <span>/</span>
        <span className="text-[#202820] font-medium truncate max-w-xs">{gig.title}</span>
      </div>

      {/* Main 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (Content, Description, Applicants, Reviews) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Gig Narrative Card */}
          <div className="bg-white rounded-xl border border-[#E7E8E1] p-6 sm:p-8 space-y-6 shadow-xs">
            {/* Top metadata tags */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E7E8E1]">
              <div className="flex items-center gap-2 text-xs text-[#72766F]">
                <span className="font-semibold text-[#18392B]">{gig.category}</span>
                <span aria-hidden="true">·</span>
                <GigTypeBadge type={gig.type} />
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">Posted {new Date(gig.created_at).toLocaleDateString()}</span>
              </div>
              <GigStatusBadge status={gig.status} />
            </div>

            {/* Title & Stats */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif text-[#202820] leading-tight">
                {gig.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#72766F]">
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#A8B8A0]" />
                  Deadline: {new Date(gig.deadline).toLocaleDateString()}
                  {isDeadlinePassed && gig.status === 'Open' && (
                    <span className="text-[#C77755] font-semibold ml-1">(Expired)</span>
                  )}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#A8B8A0]" />
                  {gig.applications_count || 0} student proposal{gig.applications_count === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            {/* Lifecycle Tracker */}
            <div className="p-4 bg-[#FAF9F6] rounded-xl border border-[#E7E8E1] space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#72766F] block">
                Collaboration Lifecycle
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div
                  className={`p-2.5 rounded-lg border text-center transition ${
                    gig.status === 'Open'
                      ? 'bg-[#EBF0E8] border-[#18392B] text-[#18392B] font-semibold'
                      : 'bg-white border-[#E7E8E1] text-[#72766F]'
                  }`}
                >
                  <div className="text-[10px] uppercase text-[#72766F]">Step 1</div>
                  <div>Open for Proposals</div>
                </div>

                <div
                  className={`p-2.5 rounded-lg border text-center transition ${
                    gig.status === 'In Progress'
                      ? 'bg-[#EBF0E8] border-[#18392B] text-[#18392B] font-semibold'
                      : 'bg-white border-[#E7E8E1] text-[#72766F]'
                  }`}
                >
                  <div className="text-[10px] uppercase text-[#72766F]">Step 2</div>
                  <div>In Progress</div>
                </div>

                <div
                  className={`p-2.5 rounded-lg border text-center transition ${
                    gig.status === 'Completed'
                      ? 'bg-[#EBF0E8] border-[#18392B] text-[#18392B] font-semibold'
                      : 'bg-white border-[#E7E8E1] text-[#72766F]'
                  }`}
                >
                  <div className="text-[10px] uppercase text-[#72766F]">Step 3</div>
                  <div>Completed & Rated</div>
                </div>
              </div>
            </div>

            {/* Description & Requirements */}
            <div className="pt-2 space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#72766F]">
                Project Scope & Deliverables
              </h2>
              <div className="text-sm text-[#202820] leading-relaxed whitespace-pre-line font-sans">
                {gig.description}
              </div>
            </div>
          </div>

          {/* Owner Applicant Management Section */}
          {isOwner && (
            <div className="bg-white rounded-xl border border-[#E7E8E1] p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#E7E8E1]">
                <div>
                  <h3 className="font-serif text-lg text-[#202820]">
                    Applicant Proposals ({applications.length})
                  </h3>
                  <p className="text-xs text-[#72766F]">
                    Review candidate credentials and select a collaborator.
                  </p>
                </div>
              </div>

              {applications.length === 0 ? (
                <div className="p-8 text-center bg-[#FAF9F6] rounded-xl border border-[#E7E8E1]">
                  <p className="text-xs text-[#72766F]">No students have submitted proposals to this gig yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className={`p-5 rounded-xl border transition ${
                        app.status === 'Accepted'
                          ? 'bg-[#EBF0E8]/40 border-[#18392B]'
                          : app.status === 'Rejected'
                          ? 'bg-[#FAF9F6] border-[#E7E8E1] opacity-60'
                          : 'bg-white border-[#E7E8E1]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#18392B] text-[#FAF9F6] flex items-center justify-center font-bold text-xs shrink-0">
                            {app.applicant?.name?.charAt(0) || 'A'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/profile/${app.applicant_id}`}
                                className="font-serif text-base text-[#202820] hover:text-[#18392B] transition font-medium"
                              >
                                {app.applicant?.name || `Student #${app.applicant_id}`}
                              </Link>
                              <span className="text-xs text-[#72766F]">
                                ({app.applicant?.major}, Sem {app.applicant?.semester})
                              </span>
                            </div>
                            <div className="text-xs text-[#72766F] flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-0.5 font-semibold text-[#202820]">
                                ★ {app.applicant?.stats?.average_rating ?? 'Unrated'}
                              </span>
                              <span>·</span>
                              <span>{app.applicant?.stats?.gigs_completed ?? 0} completed</span>
                              <span>·</span>
                              <span>Applied {new Date(app.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <ApplicationStatusBadge status={app.status} />

                          {isOpen && app.status === 'Pending' && (
                            <div className="flex items-center gap-1.5 ml-2">
                              <button
                                onClick={() => handleAcceptApplicant(app.id, app.applicant?.name || 'Applicant')}
                                disabled={processingAction !== null}
                                className="px-3.5 py-1.5 bg-[#18392B] hover:bg-[#23523E] text-[#FAF9F6] text-xs font-semibold rounded-lg transition cursor-pointer shadow-xs"
                              >
                                Accept Proposal
                              </button>
                              <button
                                onClick={() => handleRejectApplicant(app.id, app.applicant?.name || 'Applicant')}
                                disabled={processingAction !== null}
                                className="px-3 py-1.5 bg-white hover:bg-[#FAF2EE] text-[#C77755] border border-[#F0D5C9] text-xs font-medium rounded-lg transition cursor-pointer"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-3.5 bg-[#FAF9F6] rounded-lg text-xs text-[#202820] border border-[#E7E8E1] leading-relaxed">
                        "{app.message}"
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mutual Reviews Section for Completed Gigs */}
          {isCompleted && (
            <div className="bg-white rounded-xl border border-[#E7E8E1] p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#E7E8E1]">
                <div>
                  <h3 className="font-serif text-lg text-[#202820]">
                    Verified Peer Reviews ({reviews.length})
                  </h3>
                  <p className="text-xs text-[#72766F]">
                    Permanent ratings submitted by project collaborators.
                  </p>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="p-6 text-center bg-[#FAF9F6] rounded-xl border border-[#E7E8E1]">
                  <p className="text-xs text-[#72766F]">
                    No reviews published yet for this completed collaboration.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-4 bg-[#FAF9F6] rounded-xl border border-[#E7E8E1] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#202820]">{rev.reviewer?.name}</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= rev.rating ? 'fill-[#C77755] text-[#C77755]' : 'text-[#E7E8E1]'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-[#72766F] italic">"{rev.comment}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sticky Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-24">
          {/* Action / Compensation Card */}
          <div className="bg-white rounded-xl border border-[#E7E8E1] p-6 space-y-5 shadow-xs">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#72766F] block">
                Agreed Compensation
              </span>
              <div className="text-2xl font-serif text-[#18392B] mt-1 tabular-nums font-medium">
                {gig.payment_type === 'Paid'
                  ? `$${gig.budget?.toLocaleString()}`
                  : gig.payment_type === 'SkillSwap'
                  ? 'SkillSwap Exchange'
                  : 'Free Peer Support'}
              </div>
              <p className="text-xs text-[#72766F] mt-1.5 leading-relaxed">
                {gig.payment_type === 'Paid'
                  ? 'Direct student peer payment agreed for this deliverable.'
                  : gig.payment_type === 'SkillSwap'
                  ? '1:1 technical skill exchange without currency.'
                  : 'Voluntary academic collaboration.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-[#E7E8E1]">
              {isOwner ? (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-[#18392B] bg-[#EBF0E8] p-2.5 rounded-lg text-center">
                    You are the creator of this listing
                  </div>

                  {isOpen && (
                    <button
                      onClick={handleCancelGig}
                      disabled={processingAction === 'cancel'}
                      className="w-full py-2 text-xs font-medium text-[#C77755] border border-[#F0D5C9] hover:bg-[#FAF2EE] rounded-lg transition cursor-pointer"
                    >
                      {processingAction === 'cancel' ? 'Cancelling...' : 'Cancel Listing'}
                    </button>
                  )}

                  {isInProgress && (
                    <button
                      onClick={handleCompleteGig}
                      disabled={processingAction === 'complete'}
                      className="w-full py-2.5 bg-[#18392B] hover:bg-[#23523E] text-[#FAF9F6] text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#A8B8A0]" />
                      <span>{processingAction === 'complete' ? 'Completing...' : 'Mark Gig Completed'}</span>
                    </button>
                  )}

                  {isCompleted && gig.accepted_applicant && (
                    <div>
                      {!hasOwnerReviewed ? (
                        <button
                          onClick={() => openReviewModal(gig.accepted_applicant!.id, gig.accepted_applicant!.name)}
                          className="w-full py-2.5 bg-[#18392B] hover:bg-[#23523E] text-[#FAF9F6] text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Star className="w-3.5 h-3.5 text-[#C77755]" />
                          <span>Review Collaborator ({gig.accepted_applicant.name})</span>
                        </button>
                      ) : (
                        <div className="text-xs text-[#72766F] bg-[#FAF9F6] p-2 rounded-lg border border-[#E7E8E1] text-center">
                          ✓ You reviewed {gig.accepted_applicant.name}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {userApplication ? (
                    <div className="p-3.5 bg-[#FAF9F6] rounded-lg border border-[#E7E8E1] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#72766F] font-medium">Your Proposal:</span>
                        <ApplicationStatusBadge status={userApplication.status} />
                      </div>

                      {isAcceptedApplicant && isCompleted && (
                        <>
                          {!hasApplicantReviewed && gig.owner ? (
                            <button
                              onClick={() => openReviewModal(gig.owner!.id, gig.owner!.name)}
                              className="w-full mt-2 py-2 bg-[#18392B] hover:bg-[#23523E] text-[#FAF9F6] text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Star className="w-3.5 h-3.5 text-[#C77755]" />
                              <span>Review Gig Owner ({gig.owner.name})</span>
                            </button>
                          ) : (
                            <div className="text-xs text-[#72766F] text-center pt-1 font-medium">
                              ✓ You submitted your review
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : isOpen ? (
                    <button
                      onClick={() => setApplyModalOpen(true)}
                      className="w-full py-3 bg-[#18392B] hover:bg-[#23523E] text-[#FAF9F6] rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5 text-[#A8B8A0]" />
                      <span>Apply for this Gig</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-[#FAF9F6] rounded-lg border border-[#E7E8E1] text-xs text-[#72766F] text-center">
                      Applications closed for this {gig.status.toLowerCase()} listing.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Gig Creator Profile Card */}
          {gig.owner && (
            <div className="bg-white rounded-xl border border-[#E7E8E1] p-5 space-y-4 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#72766F] block">
                Listing Creator
              </span>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#18392B] text-[#FAF9F6] flex items-center justify-center font-bold text-sm shrink-0">
                  {gig.owner.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-serif text-base text-[#202820] font-medium">{gig.owner.name}</h4>
                  <p className="text-xs text-[#72766F]">
                    {gig.owner.major} · Semester {gig.owner.semester}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    <span className="font-semibold text-[#202820] flex items-center gap-0.5">
                      ★ {gig.owner.stats?.average_rating ?? 'Unrated'}
                    </span>
                    <span>·</span>
                    <span className="text-[#72766F]">{gig.owner.stats?.gigs_completed ?? 0} completed</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E7E8E1]">
                <Link
                  to={`/profile/${gig.owner.id}`}
                  className="text-xs font-semibold text-[#18392B] hover:underline flex items-center justify-between"
                >
                  <span>View Student Portfolio</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Accepted Collaborator Card (if In Progress or Completed) */}
          {gig.accepted_applicant && (
            <div className="bg-[#FAF9F6] rounded-xl border border-[#D3DDCF] p-5 space-y-3 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#18392B] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Accepted Collaborator
              </span>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#18392B] text-[#FAF9F6] flex items-center justify-center font-bold text-sm shrink-0">
                  {gig.accepted_applicant.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-serif text-base text-[#202820] font-medium">{gig.accepted_applicant.name}</h4>
                  <p className="text-xs text-[#72766F]">
                    {gig.accepted_applicant.major} · Semester {gig.accepted_applicant.semester}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    <span className="font-semibold text-[#202820] flex items-center gap-0.5">
                      ★ {gig.accepted_applicant.stats?.average_rating ?? 'Unrated'}
                    </span>
                    <span>·</span>
                    <span className="text-[#72766F]">{gig.accepted_applicant.stats?.gigs_completed ?? 0} completed</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E7E8E1]">
                <Link
                  to={`/profile/${gig.accepted_applicant.id}`}
                  className="text-xs font-semibold text-[#18392B] hover:underline flex items-center justify-between"
                >
                  <span>View Collaborator Profile</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Modals */}
      <ApplyModal
        gig={gig}
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        onSuccess={fetchGigData}
      />

      {reviewTarget && (
        <ReviewModal
          gigId={gig.id}
          gigTitle={gig.title}
          revieweeId={reviewTarget.id}
          revieweeName={reviewTarget.name}
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          onSuccess={fetchGigData}
        />
      )}
    </div>
  );
};
