import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Application } from '../types.ts';
import { ApplicationStatusBadge, PaymentBadge, GigTypeBadge, GigStatusBadge } from '../components/StatusBadge.tsx';
import { ReviewModal } from '../components/ReviewModal.tsx';
import {
  FileCheck2,
  Star,
  ExternalLink,
  ChevronRight,
  Compass
} from 'lucide-react';

export const MyApplications: React.FC = () => {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ gigId: number; gigTitle: string; ownerId: number; ownerName: string } | null>(null);

  const fetchApplications = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await api.getMyApplications();
      setApplications(data);
    } catch (err: any) {
      console.error('Failed to load my applications:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const openReviewModal = (gigId: number, gigTitle: string, ownerId: number, ownerName: string) => {
    setReviewTarget({ gigId, gigTitle, ownerId, ownerName });
    setReviewModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="border-b border-[#E7E8E1] pb-6">
        <span className="text-xs font-medium uppercase tracking-wider text-[#72766F]">
          Proposals
        </span>
        <h1 className="text-3xl font-serif text-[#202820] mt-1">My Submitted Applications</h1>
        <p className="text-xs sm:text-sm text-[#72766F] mt-1">
          Track the status of proposals you submitted to other students' campus gigs.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white rounded-xl border border-[#E7E8E1] animate-pulse" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E7E8E1] p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
          <FileCheck2 className="w-8 h-8 text-[#A8B8A0] mx-auto" />
          <h3 className="font-serif text-lg text-[#202820]">No proposals submitted</h3>
          <p className="text-xs text-[#72766F]">
            Browse marketplace opportunities and submit proposals with your skills.
          </p>
          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#18392B] hover:bg-[#23523E] text-[#FAF9F6] text-xs font-medium rounded-lg transition"
          >
            <Compass className="w-3.5 h-3.5 text-[#A8B8A0]" />
            <span>Explore Gigs</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const gig = app.gig;
            const isCompleted = gig?.status === 'Completed';
            const isAccepted = app.status === 'Accepted';

            return (
              <div
                key={app.id}
                className="bg-white rounded-xl border border-[#E7E8E1] p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#72766F]">
                    <ApplicationStatusBadge status={app.status} />
                    {gig && (
                      <>
                        <span>·</span>
                        <span className="font-medium text-[#18392B]">{gig.category}</span>
                        <span>·</span>
                        <GigTypeBadge type={gig.type} />
                        <span>·</span>
                        <PaymentBadge payment_type={gig.payment_type} budget={gig.budget} />
                        <span>·</span>
                        <GigStatusBadge status={gig.status} />
                      </>
                    )}
                  </div>
                  <span className="text-xs text-[#72766F]">
                    Applied {new Date(app.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <Link
                    to={`/gigs/${app.gig_id}`}
                    className="font-serif text-base text-[#202820] hover:text-[#18392B] transition flex items-center gap-1.5"
                  >
                    <span>{gig?.title || `Gig #${app.gig_id}`}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#72766F]" />
                  </Link>
                  <p className="text-xs text-[#72766F] mt-0.5">
                    Posted by <span className="font-medium text-[#202820]">{gig?.owner_name || 'Student'}</span>
                  </p>
                </div>

                <div className="p-3.5 bg-[#FAF9F6] rounded-lg border border-[#E7E8E1] text-xs text-[#202820] leading-relaxed">
                  <span className="font-semibold text-[#72766F] uppercase text-[10px] block mb-0.5">Your Proposal</span>
                  "{app.message}"
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E7E8E1]">
                  <span className="text-xs text-[#72766F]">
                    Proposal #{app.id}
                  </span>

                  <div className="flex items-center gap-2">
                    {isAccepted && isCompleted && (
                      <button
                        onClick={() => openReviewModal(app.gig_id, gig?.title || 'Gig', 1, gig?.owner_name || 'Owner')}
                        className="px-3.5 py-1.5 bg-[#18392B] hover:bg-[#23523E] text-[#FAF9F6] rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Star className="w-3.5 h-3.5 text-[#C77755]" />
                        <span>Review Owner</span>
                      </button>
                    )}

                    <Link
                      to={`/gigs/${app.gig_id}`}
                      className="px-3.5 py-1.5 bg-[#FAF9F6] hover:bg-[#EBF0E8] text-[#202820] border border-[#E7E8E1] rounded-lg text-xs font-medium transition flex items-center gap-1"
                    >
                      <span>View Gig</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {reviewTarget && (
        <ReviewModal
          gigId={reviewTarget.gigId}
          gigTitle={reviewTarget.gigTitle}
          revieweeId={reviewTarget.ownerId}
          revieweeName={reviewTarget.ownerName}
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          onSuccess={fetchApplications}
        />
      )}
    </div>
  );
};
