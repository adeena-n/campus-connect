import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Gig, GigStatus } from '../types.ts';
import { GigStatusBadge, PaymentBadge, GigTypeBadge } from '../components/StatusBadge.tsx';
import {
  PlusCircle,
  Clock,
  Users,
  CheckCircle2,
  ChevronRight,
  Briefcase
} from 'lucide-react';

export const MyGigs: React.FC = () => {
  const { currentUser, addToast, refreshCurrentUser } = useAuth();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOwnedGigs = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await api.getGigs({ user_id: currentUser.id });
      setGigs(data);
    } catch (err: any) {
      console.error('Failed to load owned gigs:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    fetchOwnedGigs();
  }, [fetchOwnedGigs]);

  const handleCompleteGig = async (gigId: number, gigTitle: string) => {
    if (!window.confirm(`Mark "${gigTitle}" as Completed? Both participants can now submit permanent reviews.`)) {
      return;
    }
    setActionLoading(`complete_${gigId}`);
    try {
      await api.updateGigAction(gigId, 'complete');
      addToast('Gig Completed', `Marked "${gigTitle}" as Completed.`, 'success');
      await refreshCurrentUser();
      await fetchOwnedGigs();
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelGig = async (gigId: number, gigTitle: string) => {
    if (!window.confirm(`Cancel "${gigTitle}"? It will no longer receive applications.`)) {
      return;
    }
    setActionLoading(`cancel_${gigId}`);
    try {
      await api.updateGigAction(gigId, 'cancel');
      addToast('Gig Cancelled', `Cancelled "${gigTitle}".`, 'info');
      await fetchOwnedGigs();
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredGigs = gigs.filter((g) => {
    if (statusFilter === 'All') return true;
    return g.status === statusFilter;
  });

  const countByStatus = (status: GigStatus) => gigs.filter((g) => g.status === status).length;

  return (
    <div className="space-y-6 pb-20">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E7E8E1] pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#18392B]">
            Author Management
          </span>
          <h1 className="text-3xl font-serif text-[#202820] mt-1">My Posted Gigs</h1>
          <p className="text-xs sm:text-sm text-[#72766F] mt-1">
            Gigs you created as an author. Review student proposals, manage active milestones, and exchange reviews.
          </p>
        </div>
        <Link
          to="/create"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#18392B] hover:bg-[#23523E] text-[#FAF9F6] text-xs font-semibold rounded-lg transition shadow-xs self-start sm:self-auto"
        >
          <PlusCircle className="w-3.5 h-3.5 text-[#A8B8A0]" />
          <span>Post a Gig</span>
        </Link>
      </div>

      {/* Filter Tabs - Clean Segmented Control */}
      <div className="flex overflow-x-auto gap-1.5 p-1 bg-white rounded-xl border border-[#E7E8E1]">
        {['All', 'Open', 'In Progress', 'Completed', 'Expired', 'Cancelled'].map((tab) => {
          const count = tab === 'All' ? gigs.length : countByStatus(tab as GigStatus);
          const active = statusFilter === tab;
          return (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-[#18392B] text-[#FAF9F6]'
                  : 'text-[#72766F] hover:text-[#202820] hover:bg-[#FAF9F6]'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded tabular-nums font-semibold ${
                  active ? 'bg-[#23523E] text-[#FAF9F6]' : 'bg-[#FAF9F6] text-[#72766F] border border-[#E7E8E1]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Listings */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white rounded-xl border border-[#E7E8E1] animate-pulse" />
          ))}
        </div>
      ) : filteredGigs.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E7E8E1] p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
          <Briefcase className="w-8 h-8 text-[#A8B8A0] mx-auto mb-2" />
          <h3 className="font-serif text-lg text-[#202820]">No gigs found</h3>
          <p className="text-xs text-[#72766F]">
            {statusFilter === 'All'
              ? 'You have not posted any campus gigs yet.'
              : `You have no gigs with status "${statusFilter}".`}
          </p>
          <Link
            to="/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#18392B] text-[#FAF9F6] text-xs font-semibold rounded-lg hover:bg-[#23523E] transition shadow-xs mt-2"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#A8B8A0]" />
            <span>Create a gig</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGigs.map((gig) => (
            <div
              key={gig.id}
              className="bg-white rounded-xl border border-[#E7E8E1] p-5 shadow-xs hover:border-[#18392B]/50 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                {/* Zero-Pill Unboxed Metadata Header */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#72766F]">
                  <span className="font-semibold text-[#18392B]">{gig.category}</span>
                  <span aria-hidden="true">·</span>
                  <GigTypeBadge type={gig.type} />
                  <span aria-hidden="true">·</span>
                  <PaymentBadge payment_type={gig.payment_type} budget={gig.budget} />
                  <span aria-hidden="true">·</span>
                  <GigStatusBadge status={gig.status} />
                </div>

                <Link to={`/gigs/${gig.id}`}>
                  <h3 className="font-serif text-lg font-medium text-[#202820] hover:text-[#18392B] transition">
                    {gig.title}
                  </h3>
                </Link>

                <p className="text-xs text-[#72766F] line-clamp-1 leading-relaxed">
                  {gig.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-[#72766F] pt-1">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#A8B8A0]" />
                    Deadline: {new Date(gig.deadline).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1 text-[#202820] font-semibold">
                    <Users className="w-3.5 h-3.5 text-[#18392B]" />
                    {gig.applications_count || 0} applicant{gig.applications_count === 1 ? '' : 's'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-[#E7E8E1]">
                {gig.status === 'In Progress' && (
                  <button
                    onClick={() => handleCompleteGig(gig.id, gig.title)}
                    disabled={actionLoading === `complete_${gig.id}`}
                    className="px-3.5 py-1.5 bg-[#18392B] hover:bg-[#23523E] text-[#FAF9F6] rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#A8B8A0]" />
                    <span>{actionLoading === `complete_${gig.id}` ? 'Completing...' : 'Mark Complete'}</span>
                  </button>
                )}

                {gig.status === 'Open' && (
                  <button
                    onClick={() => handleCancelGig(gig.id, gig.title)}
                    disabled={actionLoading === `cancel_${gig.id}`}
                    className="px-3.5 py-1.5 text-xs font-medium text-[#C77755] border border-[#F0D5C9] hover:bg-[#FAF2EE] rounded-lg transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}

                <Link
                  to={`/gigs/${gig.id}`}
                  className="px-3.5 py-1.5 bg-[#FAF9F6] hover:bg-[#EBF0E8] text-[#202820] border border-[#E7E8E1] rounded-lg text-xs font-medium transition flex items-center gap-1"
                >
                  <span>{gig.status === 'Open' ? 'Review Applicants' : 'View Details'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
