import React, { useState } from 'react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Gig } from '../types.ts';
import { Send, AlertCircle, X } from 'lucide-react';

interface ApplyModalProps {
  gig: Gig;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ApplyModal: React.FC<ApplyModalProps> = ({ gig, isOpen, onClose, onSuccess }) => {
  const { currentUser, addToast } = useAuth();
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const charCount = message.trim().length;
  const isValid = charCount >= 10 && charCount <= 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setSubmitting(true);
    setError(null);

    try {
      await api.submitApplication({
        gig_id: gig.id,
        message: message.trim()
      });
      addToast('Application Submitted', `Your proposal for "${gig.title}" has been sent.`, 'success');
      setMessage('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
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
              Submit Proposal
            </span>
            <h3 className="text-lg font-serif font-normal text-[#202820] line-clamp-1 mt-0.5">
              {gig.title}
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
            <span className="text-[#72766F] block text-[10px] uppercase font-semibold">Applying As</span>
            <span className="font-medium text-[#202820]">{currentUser?.name}</span> ({currentUser?.major})
          </div>
          <div className="text-right">
            <span className="text-[#72766F] block text-[10px] uppercase font-semibold">Compensation</span>
            <span className="font-medium text-[#18392B]">
              {gig.payment_type === 'Paid' ? `$${gig.budget?.toLocaleString()}` : gig.payment_type}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#FAF2EE] border border-[#F0D5C9] rounded-lg text-xs text-[#C77755] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#C77755] shrink-0 mt-0.5" />
            <div className="font-medium">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="app-message" className="text-xs font-medium text-[#202820]">
                Proposal Message <span className="text-[#C77755]">*</span>
              </label>
              <span className={`text-[11px] font-mono ${charCount < 10 || charCount > 500 ? 'text-[#C77755]' : 'text-[#72766F]'}`}>
                {charCount} / 500 (min 10)
              </span>
            </div>
            <textarea
              id="app-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Introduce your relevant coursework, past projects, or experience, and specify your availability..."
              className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-[#E7E8E1] bg-white text-[#202820] placeholder-[#72766F]/60 focus:outline-none focus:border-[#18392B] focus:ring-1 focus:ring-[#18392B] transition"
              disabled={submitting}
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E7E8E1]">
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
              disabled={!isValid || submitting}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-medium text-[#FAF9F6] bg-[#18392B] hover:bg-[#23523E] disabled:opacity-50 rounded-lg transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-[#A8B8A0]" />
              <span>{submitting ? 'Sending...' : 'Send Application'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
