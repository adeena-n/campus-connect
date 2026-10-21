import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { User, Review, Gig } from '../types.ts';
import { GigStatusBadge, PaymentBadge, GigTypeBadge } from '../components/StatusBadge.tsx';
import {
  GraduationCap,
  Star,
  Briefcase,
  CheckCircle2,
  Edit3,
  X,
  AlertCircle,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const userId = parseInt(id || '', 10);
  const { currentUser, addToast, refreshCurrentUser } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userGigs, setUserGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Profile Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editMajor, setEditMajor] = useState('');
  const [editSemester, setEditSemester] = useState(1);
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchProfileData = useCallback(async () => {
    if (isNaN(userId)) {
      setError('Invalid student ID.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [userData, reviewData, gigsData] = await Promise.all([
        api.getUser(userId),
        api.getReviews({ reviewee_id: userId }),
        api.getGigs({ user_id: userId })
      ]);
      setUser(userData);
      setReviews(reviewData);
      setUserGigs(gigsData);

      setEditBio(userData.bio || '');
      setEditMajor(userData.major || '');
      setEditSemester(userData.semester || 1);
      setEditSkills(userData.skills || []);
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      setError(err.message || 'User profile not found.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const isOwnProfile = currentUser?.id === userId;

  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim();
    if (trimmed && !editSkills.includes(trimmed)) {
      setEditSkills([...editSkills, trimmed]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setEditSkills(editSkills.filter((s) => s !== skillToRemove));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnProfile) return;

    setSaving(true);
    setEditError(null);
    try {
      const updated = await api.updateUser(userId, {
        bio: editBio.trim(),
        major: editMajor.trim(),
        semester: Number(editSemester),
        skills: editSkills
      });
      setUser(updated);
      addToast('Profile Updated', 'Your student details have been saved.', 'success');
      await refreshCurrentUser();
      setIsEditModalOpen(false);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse py-8">
        <div className="h-44 bg-white rounded-xl border border-[#E7E8E1] p-6"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-xl p-8 border border-[#E7E8E1] text-center shadow-xs">
        <AlertCircle className="w-10 h-10 text-[#C77755] mx-auto mb-3" />
        <h2 className="text-lg font-serif text-[#202820]">Student Not Found</h2>
        <p className="text-xs text-[#72766F] mt-1">{error || 'This user profile does not exist.'}</p>
        <Link
          to="/explore"
          className="mt-4 inline-flex items-center gap-1 px-4 py-2 bg-[#18392B] text-[#FAF9F6] rounded-lg text-xs font-medium hover:bg-[#23523E] transition"
        >
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const stats = user.stats;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Portfolio Header */}
      <div className="bg-white rounded-xl border border-[#E7E8E1] p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-[#18392B] text-[#FAF9F6] flex items-center justify-center font-bold text-xl shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-serif text-[#202820]">{user.name}</h1>
                {isOwnProfile && (
                  <span className="text-[10px] bg-[#EBF0E8] text-[#18392B] px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                    You
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-medium text-[#72766F] flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#A8B8A0]" />
                {user.major} · Semester {user.semester}
              </p>
              <p className="text-xs sm:text-sm text-[#202820] leading-relaxed max-w-xl pt-2">
                {user.bio || 'Student member of the CampusConnect academic exchange community.'}
              </p>
            </div>
          </div>

          {isOwnProfile && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#FAF9F6] hover:bg-[#EBF0E8] text-[#202820] text-xs font-medium rounded-lg border border-[#E7E8E1] transition cursor-pointer self-start"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#72766F]" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {/* Skills Tag Row */}
        {user.skills && user.skills.length > 0 && (
          <div className="pt-5 border-t border-[#E7E8E1]">
            <span className="text-xs font-medium uppercase tracking-wider text-[#72766F] block mb-2">
              Skills & Expertise
            </span>
            <div className="flex flex-wrap gap-1.5">
              {user.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#FAF9F6] text-[#202820] border border-[#E7E8E1]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#E7E8E1] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#72766F] uppercase tracking-wider block">
              Average Rating
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-serif text-[#202820] tabular-nums">
                {stats?.average_rating !== null && stats?.average_rating !== undefined
                  ? `${stats.average_rating}`
                  : 'Unrated'}
              </span>
              {stats?.average_rating !== null && (
                <span className="text-xs text-[#72766F]">/ 5.0</span>
              )}
            </div>
            <p className="text-[11px] text-[#72766F] mt-0.5">
              {stats?.ratings_count || 0} verified peer review{stats?.ratings_count === 1 ? '' : 's'}
            </p>
          </div>
          <Star className="w-6 h-6 fill-[#C77755] text-[#C77755]" />
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E7E8E1] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#72766F] uppercase tracking-wider block">
              Gigs Posted
            </span>
            <div className="mt-1 text-2xl font-serif text-[#202820] tabular-nums">
              {stats?.gigs_posted ?? 0}
            </div>
            <p className="text-[11px] text-[#72766F] mt-0.5">As gig creator</p>
          </div>
          <Briefcase className="w-6 h-6 text-[#18392B]" />
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E7E8E1] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#72766F] uppercase tracking-wider block">
              Completed Gigs
            </span>
            <div className="mt-1 text-2xl font-serif text-[#202820] tabular-nums">
              {stats?.gigs_completed ?? 0}
            </div>
            <p className="text-[11px] text-[#72766F] mt-0.5">As creator or accepted applicant</p>
          </div>
          <CheckCircle2 className="w-6 h-6 text-[#18392B]" />
        </div>
      </div>

      {/* Received Reviews List */}
      <div className="bg-white rounded-xl border border-[#E7E8E1] p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#E7E8E1]">
          <div>
            <h3 className="font-serif text-lg text-[#202820]">
              Verified Peer Reviews ({reviews.length})
            </h3>
            <p className="text-xs text-[#72766F]">
              Ratings earned through concluded campus collaborations.
            </p>
          </div>
          <span className="text-xs font-medium text-[#72766F]">
            {stats?.average_rating ? `Average: ${stats.average_rating} ★` : 'No reviews yet'}
          </span>
        </div>

        {reviews.length === 0 ? (
          <div className="p-8 text-center bg-[#FAF9F6] rounded-xl border border-[#E7E8E1]">
            <MessageSquare className="w-8 h-8 text-[#A8B8A0] mx-auto mb-2" />
            <p className="text-xs text-[#72766F]">No reviews received yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-xl border border-[#E7E8E1] bg-[#FAF9F6] space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#18392B] text-[#FAF9F6] flex items-center justify-center font-bold text-[10px]">
                      {rev.reviewer?.name?.charAt(0) || 'R'}
                    </div>
                    <div>
                      <Link
                        to={`/profile/${rev.reviewer_id}`}
                        className="text-xs font-medium text-[#202820] hover:text-[#18392B]"
                      >
                        {rev.reviewer?.name || `Student #${rev.reviewer_id}`}
                      </Link>
                      <span className="text-xs text-[#72766F] ml-1">
                        ({rev.reviewer?.major}, Sem {rev.reviewer?.semester})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= rev.rating ? 'fill-[#C77755] text-[#C77755]' : 'text-[#E7E8E1]'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-semibold text-[#202820] ml-1 tabular-nums">{rev.rating}.0</span>
                  </div>
                </div>

                <p className="text-xs text-[#202820] italic leading-relaxed">
                  "{rev.comment}"
                </p>

                <div className="text-[11px] text-[#72766F] pt-1">
                  Gig: <span className="font-medium text-[#202820]">{rev.gig_title}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gigs History by this Student */}
      <div className="bg-white rounded-xl border border-[#E7E8E1] p-6 sm:p-8 space-y-4 shadow-xs">
        <h3 className="font-serif text-lg text-[#202820]">
          Gigs Posted by {user.name} ({userGigs.length})
        </h3>

        {userGigs.length === 0 ? (
          <div className="p-6 text-center bg-[#FAF9F6] rounded-xl border border-[#E7E8E1] text-xs text-[#72766F]">
            No listings currently posted by this student.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {userGigs.map((g) => (
              <Link
                key={g.id}
                to={`/gigs/${g.id}`}
                className="p-4 rounded-xl border border-[#E7E8E1] hover:border-[#18392B] transition bg-white space-y-2 block"
              >
                <div className="flex items-center justify-between gap-1 text-xs text-[#72766F]">
                  <span className="font-medium text-[#18392B]">{g.category}</span>
                  <GigStatusBadge status={g.status} />
                </div>
                <h4 className="font-serif text-sm text-[#202820] line-clamp-1">{g.title}</h4>
                <p className="text-xs text-[#72766F] line-clamp-2">{g.description}</p>
                <div className="pt-2 border-t border-[#E7E8E1] flex items-center justify-between text-xs">
                  <PaymentBadge payment_type={g.payment_type} budget={g.budget} />
                  <span className="text-[#72766F]">{new Date(g.deadline).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202820]/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 sm:p-7 shadow-xl border border-[#E7E8E1] max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-[#E7E8E1]">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#72766F]">
                  Profile Settings
                </span>
                <h3 className="text-lg font-serif text-[#202820]">Edit Student Portfolio</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-[#72766F] hover:text-[#202820] p-1 rounded-lg hover:bg-[#FAF9F6] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="my-3 p-3 bg-[#FAF2EE] border border-[#F0D5C9] rounded-lg text-xs text-[#C77755] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#C77755] shrink-0 mt-0.5" />
                <div className="flex-1">{editError}</div>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 my-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#202820] block mb-1">
                    Major / Department
                  </label>
                  <input
                    type="text"
                    value={editMajor}
                    onChange={(e) => setEditMajor(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E7E8E1] text-[#202820] focus:border-[#18392B] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#202820] block mb-1">
                    Semester
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={editSemester}
                    onChange={(e) => setEditSemester(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E7E8E1] text-[#202820] focus:border-[#18392B] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#202820] block mb-1">
                  Student Biography
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E7E8E1] text-[#202820] focus:border-[#18392B] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#202820] block mb-1">
                  Skills & Expertise
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    placeholder="e.g. Python, Figma, React"
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#E7E8E1] text-[#202820] focus:border-[#18392B] focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-3 py-1.5 bg-[#18392B] text-[#FAF9F6] rounded-lg text-xs font-medium hover:bg-[#23523E]"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {editSkills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-[#FAF9F6] text-[#202820] border border-[#E7E8E1]"
                    >
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(s)}
                        className="text-[#72766F] hover:text-[#C77755]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E7E8E1] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-medium text-[#72766F] hover:text-[#202820] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-medium text-[#FAF9F6] bg-[#18392B] hover:bg-[#23523E] rounded-lg transition"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
