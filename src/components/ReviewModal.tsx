import React, { useState } from 'react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Star, AlertCircle, X, Check } from 'lucide-react';

interface ReviewModalProps {
  gigId: number;
  gigTitle: string;
  revieweeId: number;
  revieweeName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  gigId,
  gigTitle,
  revieweeId,
  revieweeName,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentUser, addToast, refreshCurrentUser } = useAuth();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const ratingLabels: Record<number, string> = {
    1: 'Needs Improvement',
    2: 'Below Expectations',
    3: 'Met Expectations',
    4: 'Great Collaboration',
    5: 'Outstanding Service'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please provide feedback on your collaboration.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.submitReview({
        gig_id: gigId,
        reviewee_id: revieweeId,
        rating,
        comment: comment.trim()
      });
      addToast('Review Published', `Your rating for ${revieweeName} was published to their student profile.`, 'success');
      await refreshCurrentUser();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202820]/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 sm:p-7 shadow-xl border border-[#E7E8E1]">
        <div className="flex items-start justify-between pb-3 border-b border-[#E7E8E1]">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#72766F]">
              Peer Review
            </span>
            <h3 className="text-lg font-serif font-normal text-[#202820] line-clamp-1 mt-0.5">
              {gigTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#72766F] hover:text-[#202820] p-1 rounded-lg hover:bg-[#FAF9F6] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-4 p-3 bg-[#FAF9F6] rounded-lg border border-[#E7E8E1] text-xs text-[#72766F] flex items-center justify-between">
          <div>
            <span className="text-[#72766F] block text-[10px] uppercase font-semibold">Reviewer</span>
            <span className="font-medium text-[#202820]">{currentUser?.name}</span>
          </div>
          <div className="text-right">
            <span className="text-[#72766F] block text-[10px] uppercase font-semibold">Reviewee</span>
            <span className="font-medium text-[#202820]">{revieweeName}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#FAF2EE] border border-[#F0D5C9] rounded-lg text-xs text-[#C77755] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#C77755] shrink-0 mt-0.5" />
            <div className="font-medium">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#202820] mb-1.5">
              Rating Score (1 to 5 Stars) <span className="text-[#C77755]">*</span>
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 rounded hover:scale-105 transition-transform focus:outline-none"
                    title={`${star} Star`}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        (hoverRating || rating) >= star
                          ? 'fill-[#C77755] text-[#C77755]'
                          : 'text-[#E7E8E1]'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-medium text-[#72766F] ml-2">
                {ratingLabels[hoverRating || rating]}
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="review-comment" className="block text-xs font-medium text-[#202820] mb-1.5">
              Collaboration Feedback <span className="text-[#C77755]">*</span>
            </label>
            <textarea
              id="review-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Share how it was collaborating with ${revieweeName}. Communication, quality of work, and timeliness...`}
              className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-[#E7E8E1] bg-white text-[#202820] placeholder-[#72766F]/60 focus:outline-none focus:border-[#18392B] focus:ring-1 focus:ring-[#18392B] transition"
              disabled={submitting}
              required
            />
            <p className="text-[11px] text-[#72766F] mt-1">
              Mutual reviews are permanent and directly update the student’s profile reputation.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E7E8E1]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3.5 py-2 text-xs font-medium text-[#72766F] hover:text-[#202820] rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !comment.trim()}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-medium text-[#FAF9F6] bg-[#18392B] hover:bg-[#23523E] disabled:opacity-50 rounded-lg transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-[#A8B8A0]" />
              <span>{submitting ? 'Submitting...' : 'Submit Review'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
