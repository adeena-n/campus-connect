import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { Gig, Application } from '../types.ts';
import { GigStatusBadge, PaymentBadge, GigTypeBadge, ApplicationStatusBadge } from '../components/StatusBadge.tsx';
import {
  PlusCircle,
  Briefcase,
  FileCheck2,
  Star,
  Clock,
  ArrowRight,
  AlertCircle,
  ChevronRight,
  Compass
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [recentGigs, setRecentGigs] = useState<Gig[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [myGigs, setMyGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [gigs, apps, owned] = await Promise.all([
          api.getGigs({ status: 'Open' }),
          api.getMyApplications(),
          currentUser?.id ? api.getGigs({ user_id: currentUser.id }) : Promise.resolve([])
        ]);
        if (active) {
          setRecentGigs(gigs.filter((g) => g.user_id !== currentUser?.id).slice(0, 4));
          setMyApplications(apps.slice(0, 4));
          setMyGigs(owned);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => {
      active = false;
    };
  }, [currentUser?.id]);

  const stats = currentUser?.stats;

  // Check for any open gigs owned by user that have pending applicants
  const gigsWithApplicants = myGigs.filter(
    (g) => g.status === 'Open' && (g.applications_count || 0) > 0
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Editorial Student Welcome Workspace */}
      <div className="bg-white rounded-xl border border-[#E7E8E1] p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#18392B]"></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#18392B]">
                Student Workspace
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif text-[#202820]">
              Welcome back, {currentUser?.name || 'Student'}.
            </h1>
            <p className="text-xs sm:text-sm text-[#72766F] max-w-xl leading-relaxed">
              {currentUser?.major} · Semester {currentUser?.semester} — {currentUser?.bio || 'Collaborating across campus.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/create"
              className="px-4 py-2 bg-[#18392B] hover:bg-[#23523E] text-[#FAF9F6] text-xs font-semibold rounded-lg transition shadow-xs flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#A8B8A0]" />
              <span>Post a Gig</span>
            </Link>
            <Link
              to="/explore"
              className="px-4 py-2 bg-white hover:bg-[#FAF9F6] text-[#202820] text-xs font-medium rounded-lg border border-[#E7E8E1] transition shadow-xs"
            >
              Explore Marketplace
            </Link>
          </div>
        </div>

        {/* Clean Proportionate Metric Strip */}
        <div className="pt-5 border-t border-[#E7E8E1] grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-[#72766F] font-semibold block">
              Reputation
            </span>
            <div className="text-2xl font-serif text-[#202820] flex items-center gap-1.5 tabular-nums">
              <span>{stats?.average_rating !== null && stats?.average_rating !== undefined ? `${stats.average_rating}` : 'Unrated'}</span>
              <Star className="w-4 h-4 fill-[#C77755] text-[#C77755]" />
            </div>
            <span className="text-[11px] text-[#72766F]">{stats?.ratings_count || 0} peer review{stats?.ratings_count === 1 ? '' : 's'}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-[#72766F] font-semibold block">
              Gigs Posted
            </span>
            <div className="text-2xl font-serif text-[#202820] tabular-nums">
              {stats?.gigs_posted ?? 0}
            </div>
            <Link to="/my-gigs" className="text-[11px] text-[#18392B] font-medium hover:underline inline-flex items-center gap-0.5">
              <span>Manage listings</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-[#72766F] font-semibold block">
              Completed Gigs
            </span>
            <div className="text-2xl font-serif text-[#202820] tabular-nums">
              {stats?.gigs_completed ?? 0}
            </div>
            <span className="text-[11px] text-[#72766F]">Across departments</span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-[#72766F] font-semibold block">
              Active Proposals
            </span>
            <div className="text-2xl font-serif text-[#202820] tabular-nums">
              {myApplications.length}
            </div>
            <Link to="/my-applications" className="text-[11px] text-[#18392B] font-medium hover:underline inline-flex items-center gap-0.5">
              <span>View submissions</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Actionable Notice if applicants awaiting review */}
      {gigsWithApplicants.length > 0 && (
        <div className="p-4 bg-[#EBF0E8] border border-[#D3DDCF] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[#18392B] shrink-0" />
            <div className="text-xs text-[#202820]">
              <span className="font-semibold text-[#18392B]">Applicant Proposals Waiting: </span>
              <span>
                You have received student applications on {gigsWithApplicants.length} of your open gig{gigsWithApplicants.length === 1 ? '' : 's'}.
              </span>
            </div>
          </div>
          <Link
            to={`/gigs/${gigsWithApplicants[0].id}`}
            className="px-4 py-1.5 bg-[#18392B] text-[#FAF9F6] text-xs font-semibold rounded-lg hover:bg-[#23523E] transition whitespace-nowrap self-start sm:self-auto"
          >
            Review Proposals
          </Link>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Campus Gigs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E7E8E1]">
            <div>
              <h2 className="text-xl font-serif text-[#202820]">Campus Opportunities</h2>
              <p className="text-xs text-[#72766F]">Recent listings from fellow university students</p>
            </div>
            <Link
              to="/explore"
              className="text-xs font-semibold text-[#18392B] hover:underline flex items-center gap-1"
            >
              <span>Explore all</span>
              <ArrowRight className="w-3 h-3 text-[#A8B8A0]" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-44 bg-white rounded-xl border border-[#E7E8E1] animate-pulse" />
              ))}
            </div>
          ) : recentGigs.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-[#E7E8E1] text-center shadow-xs">
              <Compass className="w-8 h-8 text-[#A8B8A0] mx-auto mb-2" />
              <p className="text-xs text-[#72766F]">No new gigs from other students at the moment.</p>
              <Link to="/create" className="text-xs text-[#18392B] font-semibold hover:underline mt-2 inline-block">
                Post the first gig →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentGigs.map((gig) => (
                <Link
                  key={gig.id}
                  to={`/gigs/${gig.id}`}
                  className="bg-white rounded-xl p-5 border border-[#E7E8E1] hover:border-[#18392B] transition flex flex-col justify-between group shadow-xs"
                >
                  <div className="space-y-2.5">
                    {/* Zero-Pill Unboxed Category Line */}
                    <div className="flex items-center justify-between text-xs text-[#72766F]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[#18392B]">{gig.category}</span>
                        <span aria-hidden="true">·</span>
                        <GigTypeBadge type={gig.type} />
                      </div>
                      <PaymentBadge payment_type={gig.payment_type} budget={gig.budget} />
                    </div>

                    <h3 className="font-serif text-base font-medium text-[#202820] group-hover:text-[#18392B] transition line-clamp-2 leading-snug">
                      {gig.title}
                    </h3>

                    <p className="text-xs text-[#72766F] line-clamp-2 leading-relaxed">
                      {gig.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E7E8E1] flex items-center justify-between text-xs text-[#72766F]">
                    <span className="font-medium text-[#202820] truncate max-w-[120px]">
                      {gig.owner?.name}
                    </span>
                    <span className="text-xs flex items-center gap-1 font-medium text-[#72766F]">
                      <Clock className="w-3 h-3 text-[#A8B8A0]" />
                      {new Date(gig.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Applications & Quick Profile Info */}
        <div className="space-y-6">
          {/* Applications Widget */}
          <div className="bg-white rounded-xl border border-[#E7E8E1] p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E7E8E1] pb-3">
              <div>
                <h3 className="text-base font-serif text-[#202820]">My Submitted Proposals</h3>
                <p className="text-[11px] text-[#72766F]">Track proposal responses</p>
              </div>
              <Link to="/my-applications" className="text-xs text-[#18392B] font-semibold hover:underline">
                View all
              </Link>
            </div>

            {myApplications.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#72766F]">
                <p>No active proposals.</p>
                <Link to="/explore" className="text-[#18392B] font-semibold hover:underline mt-1.5 inline-block">
                  Find a gig to apply to →
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {myApplications.map((app) => (
                  <Link
                    key={app.id}
                    to={app.gig ? `/gigs/${app.gig.id}` : '/my-applications'}
                    className="block p-3.5 rounded-lg bg-[#FAF9F6] hover:bg-[#EBF0E8]/50 border border-[#E7E8E1] transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-medium text-[#202820] line-clamp-1">
                        {app.gig?.title || `Gig #${app.gig_id}`}
                      </h4>
                      <ApplicationStatusBadge status={app.status} />
                    </div>
                    <p className="text-xs text-[#72766F] mt-1.5 line-clamp-1 italic">
                      "{app.message}"
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Student Skills & Profile Card */}
          <div className="bg-white rounded-xl border border-[#E7E8E1] p-5 space-y-3.5 shadow-xs">
            <div className="border-b border-[#E7E8E1] pb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#72766F] block">
                My Skills & Disciplines
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {currentUser?.skills?.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#FAF9F6] text-[#202820] border border-[#E7E8E1]"
                >
                  {skill}
                </span>
              ))}
            </div>
            <Link
              to={`/profile/${currentUser?.id}`}
              className="mt-3 block text-xs font-semibold text-[#18392B] hover:underline"
            >
              Edit portfolio & skills →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
