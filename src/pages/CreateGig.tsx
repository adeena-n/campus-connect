import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { GigCategory, GigType, PaymentType } from '../types.ts';
import { PlusCircle, AlertCircle, ShieldCheck, Sparkles } from 'lucide-react';

const CATEGORIES: GigCategory[] = ['Programming', 'Design', 'Writing', 'Tutoring'];
const TYPES: GigType[] = ['Offering', 'Requesting'];
const PAYMENT_TYPES: PaymentType[] = ['Paid', 'SkillSwap', 'Free'];

export const CreateGig: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, addToast, refreshCurrentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<GigType>('Requesting');
  const [category, setCategory] = useState<GigCategory>('Programming');
  const [paymentType, setPaymentType] = useState<PaymentType>('Paid');
  const [budget, setBudget] = useState<string>('2000');

  const defaultFutureDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 16);
  };
  const [deadline, setDeadline] = useState<string>(defaultFutureDate());

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleTrimmed = title.trim();
  const isTitleValid = titleTrimmed.length >= 5 && titleTrimmed.length <= 100;

  const descTrimmed = description.trim();
  const isDescValid = descTrimmed.length >= 20 && descTrimmed.length <= 2000;

  const isBudgetValid =
    paymentType === 'Paid'
      ? parseFloat(budget) > 0 && !isNaN(parseFloat(budget))
      : true;

  const deadlineDate = new Date(deadline);
  const isDeadlineValid = !isNaN(deadlineDate.getTime()) && deadlineDate.getTime() > Date.now();

  const isFormValid = isTitleValid && isDescValid && isBudgetValid && isDeadlineValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setSubmitting(true);
    setError(null);

    try {
      const created = await api.createGig({
        title: titleTrimmed,
        description: descTrimmed,
        type,
        category,
        payment_type: paymentType,
        budget: paymentType === 'Paid' ? parseFloat(budget) : null,
        deadline: new Date(deadline).toISOString()
      });

      addToast('Listing Published', `"${created.title}" is now open for campus applications.`, 'success');
      await refreshCurrentUser();
      navigate(`/gigs/${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create gig');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Editorial Header */}
      <div className="border-b border-[#E7E8E1] pb-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#18392B]">
          New Campus Listing
        </span>
        <h1 className="text-3xl font-serif text-[#202820] mt-1">Post a Campus Gig</h1>
        <p className="text-xs sm:text-sm text-[#72766F] mt-1">
          Publish a skill offering or request assistance with programming, design, writing, or tutoring.
        </p>
      </div>

      {/* Creator Info Card */}
      <div className="p-4 bg-white rounded-xl border border-[#E7E8E1] flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#18392B] text-[#FAF9F6] flex items-center justify-center font-bold text-xs">
            {currentUser?.name.charAt(0)}
          </div>
          <div>
            <span className="text-[10px] text-[#72766F] uppercase font-semibold block">Author Identity</span>
            <span className="text-xs font-medium text-[#202820]">{currentUser?.name}</span>
          </div>
        </div>
        <span className="text-xs text-[#18392B] font-medium">
          {currentUser?.major} · Semester {currentUser?.semester}
        </span>
      </div>

      {error && (
        <div className="p-3.5 bg-[#FAF2EE] border border-[#F0D5C9] rounded-lg text-xs text-[#C77755] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-[#C77755] shrink-0 mt-0.5" />
          <div className="font-medium">{error}</div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[#E7E8E1] p-6 sm:p-8 space-y-5 shadow-xs">
        {/* Title */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="gig-title" className="text-xs font-semibold text-[#202820]">
              Listing Title <span className="text-[#C77755]">*</span>
            </label>
            <span className={`text-[11px] font-mono tabular-nums ${titleTrimmed.length > 0 && !isTitleValid ? 'text-[#C77755]' : 'text-[#72766F]'}`}>
              {titleTrimmed.length} / 100 (min 5)
            </span>
          </div>
          <input
            id="gig-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Build React portfolio website or Help with Linear Algebra proofs"
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-[#E7E8E1] bg-white text-[#202820] placeholder-[#72766F]/60 focus:outline-none focus:border-[#18392B] focus:ring-1 focus:ring-[#18392B]/20 transition"
            disabled={submitting}
            required
          />
        </div>

        {/* Type & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#202820] block mb-1.5">
              Arrangement Role <span className="text-[#C77755]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition cursor-pointer ${
                    type === t
                      ? 'bg-[#EBF0E8] border-[#18392B] text-[#18392B] font-semibold'
                      : 'bg-white border-[#E7E8E1] text-[#72766F] hover:bg-[#FAF9F6]'
                  }`}
                >
                  {t === 'Offering' ? 'Offering Skill' : 'Requesting Help'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="gig-category" className="text-xs font-semibold text-[#202820] block mb-1.5">
              Discipline / Category <span className="text-[#C77755]">*</span>
            </label>
            <select
              id="gig-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as GigCategory)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#E7E8E1] bg-white text-[#202820] focus:border-[#18392B] focus:ring-1 focus:ring-[#18392B]/20 focus:outline-none font-medium"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Compensation & Budget */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#202820] block mb-1.5">
              Compensation Model <span className="text-[#C77755]">*</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {PAYMENT_TYPES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPaymentType(p)}
                  className={`py-2 px-2 text-xs font-medium rounded-lg border transition text-center cursor-pointer ${
                    paymentType === p
                      ? 'bg-[#EBF0E8] border-[#18392B] text-[#18392B] font-semibold'
                      : 'bg-white border-[#E7E8E1] text-[#72766F] hover:bg-[#FAF9F6]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="gig-budget" className="text-xs font-semibold text-[#202820] block mb-1.5">
              Budget ($ USD) {paymentType === 'Paid' && <span className="text-[#C77755]">*</span>}
            </label>
            <input
              id="gig-budget"
              type="number"
              min="1"
              value={paymentType === 'Paid' ? budget : ''}
              onChange={(e) => setBudget(e.target.value)}
              disabled={paymentType !== 'Paid' || submitting}
              placeholder={paymentType === 'Paid' ? 'e.g. 2000' : 'Null for SkillSwap / Free'}
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-[#E7E8E1] focus:outline-none focus:border-[#18392B] focus:ring-1 focus:ring-[#18392B]/20 disabled:bg-[#FAF9F6] disabled:text-[#72766F]/60 font-medium tabular-nums"
              required={paymentType === 'Paid'}
            />
          </div>
        </div>

        {/* Deadline */}
        <div>
          <label htmlFor="gig-deadline" className="text-xs font-semibold text-[#202820] block mb-1.5">
            Application Deadline (Future Date & Time) <span className="text-[#C77755]">*</span>
          </label>
          <input
            id="gig-deadline"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-[#E7E8E1] focus:outline-none focus:border-[#18392B] focus:ring-1 focus:ring-[#18392B]/20 font-medium text-[#202820]"
            disabled={submitting}
            required
          />
        </div>

        {/* Description */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="gig-description" className="text-xs font-semibold text-[#202820]">
              Description & Requirements <span className="text-[#C77755]">*</span>
            </label>
            <span className={`text-[11px] font-mono tabular-nums ${descTrimmed.length > 0 && !isDescValid ? 'text-[#C77755]' : 'text-[#72766F]'}`}>
              {descTrimmed.length} / 2000 (min 20)
            </span>
          </div>
          <textarea
            id="gig-description"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Specify deliverables, project scope, languages or tools involved, and expected timeline..."
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-[#E7E8E1] bg-white text-[#202820] placeholder-[#72766F]/60 focus:outline-none focus:border-[#18392B] focus:ring-1 focus:ring-[#18392B]/20 transition leading-relaxed"
            disabled={submitting}
            required
          />
        </div>

        {/* Academic Community Standards Note */}
        <div className="p-3 bg-[#FAF9F6] rounded-lg border border-[#E7E8E1] text-[11px] text-[#72766F] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#18392B] shrink-0" />
          <span>Postings are bound by university academic integrity guidelines and mutual review standards.</span>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-[#E7E8E1] flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={submitting}
            className="px-4 py-2 text-xs font-medium text-[#72766F] hover:text-[#202820] transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isFormValid || submitting}
            className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-[#18392B] hover:bg-[#23523E] text-[#FAF9F6] disabled:opacity-50 text-xs font-semibold rounded-lg transition shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#A8B8A0]" />
            <span>{submitting ? 'Publishing...' : 'Publish Listing'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
