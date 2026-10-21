import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api.ts';
import { Gig, GigCategory, GigType, PaymentType, GigStatus } from '../types.ts';
import { GigStatusBadge, PaymentBadge, GigTypeBadge } from '../components/StatusBadge.tsx';
import {
  Search,
  X,
  Clock,
  ChevronRight,
  Filter,
  AlertCircle,
  SlidersHorizontal,
  ArrowUpDown
} from 'lucide-react';

const CATEGORIES: GigCategory[] = ['Programming', 'Design', 'Writing', 'Tutoring'];
const TYPES: GigType[] = ['Offering', 'Requesting'];
const PAYMENT_TYPES: PaymentType[] = ['Paid', 'SkillSwap', 'Free'];
const STATUSES: GigStatus[] = ['Open', 'In Progress', 'Completed', 'Expired', 'Cancelled'];

type SortOption = 'newest' | 'deadline' | 'budget_desc' | 'budget_asc';

export const ExploreGigs: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'All');
  const [selectedType, setSelectedType] = useState<string>(searchParams.get('type') || 'All');
  const [selectedPayment, setSelectedPayment] = useState<string>(searchParams.get('payment_type') || 'All');
  const [selectedStatus, setSelectedStatus] = useState<string>(searchParams.get('status') || 'All');
  const [minBudget, setMinBudget] = useState<string>(searchParams.get('min_budget') || '');
  const [maxBudget, setMaxBudget] = useState<string>(searchParams.get('max_budget') || '');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('category')) setSelectedCategory(searchParams.get('category')!);
    if (searchParams.get('q')) setSearchQuery(searchParams.get('q')!);
  }, [searchParams]);

  const fetchGigs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedType !== 'All') params.type = selectedType;
      if (selectedPayment !== 'All') params.payment_type = selectedPayment;
      if (selectedStatus !== 'All') params.status = selectedStatus;
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (minBudget) {
        const val = parseFloat(minBudget);
        if (!isNaN(val)) params.min_budget = val;
      }
      if (maxBudget) {
        const val = parseFloat(maxBudget);
        if (!isNaN(val)) params.max_budget = val;
      }

      const data = await api.getGigs(params);
      setGigs(data);
    } catch (err: any) {
      console.error('Failed to fetch gigs:', err);
      setError(err.message || 'Failed to load gigs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGigs();
  }, [selectedCategory, selectedType, selectedPayment, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGigs();
  };

  const handleClearFilters = () => {
    setSelectedCategory('All');
    setSelectedType('All');
    setSelectedPayment('All');
    setSelectedStatus('All');
    setSearchQuery('');
    setMinBudget('');
    setMaxBudget('');
    setSortBy('newest');
    setSearchParams({});
    setTimeout(() => {
      api.getGigs({}).then(setGigs);
    }, 0);
  };

  // Client-side sorting for fine-grained ranking
  const sortedGigs = useMemo(() => {
    const list = [...gigs];
    switch (sortBy) {
      case 'newest':
        return list.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case 'deadline':
        return list.sort(
          (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        );
      case 'budget_desc':
        return list.sort((a, b) => (b.budget || 0) - (a.budget || 0));
      case 'budget_asc':
        return list.sort((a, b) => (a.budget || 0) - (b.budget || 0));
      default:
        return list;
    }
  }, [gigs, sortBy]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'All') count++;
    if (selectedType !== 'All') count++;
    if (selectedPayment !== 'All') count++;
    if (selectedStatus !== 'All') count++;
    if (searchQuery.trim()) count++;
    if (minBudget || maxBudget) count++;
    return count;
  }, [selectedCategory, selectedType, selectedPayment, selectedStatus, searchQuery, minBudget, maxBudget]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E7E8E1] pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#18392B]">
            Campus Marketplace
          </span>
          <h1 className="text-3xl font-serif text-[#202820] mt-1">Explore Campus Gigs</h1>
          <p className="text-xs sm:text-sm text-[#72766F] mt-1">
            Browse peer skill offerings, tutoring requests, and freelance project collaborations.
          </p>
        </div>
        <Link
          to="/create"
          className="inline-flex items-center px-4 py-2.5 bg-[#18392B] hover:bg-[#23523E] text-[#FAF9F6] text-xs font-semibold rounded-lg transition shadow-xs self-start sm:self-auto"
        >
          + Post a Gig
        </Link>
      </div>

      {/* Category Quick Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 p-1 bg-white rounded-xl border border-[#E7E8E1]">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer ${
            selectedCategory === 'All'
              ? 'bg-[#18392B] text-[#FAF9F6]'
              : 'text-[#72766F] hover:text-[#202820] hover:bg-[#FAF9F6]'
          }`}
        >
          All Disciplines
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#18392B] text-[#FAF9F6]'
                : 'text-[#72766F] hover:text-[#202820] hover:bg-[#FAF9F6]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-[#E7E8E1] p-5 space-y-4 shadow-xs">
        {/* Search Row */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#72766F]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords, coursework, tools, or description..."
              className="w-full pl-10 pr-8 py-2.5 text-xs sm:text-sm rounded-lg border border-[#E7E8E1] bg-white text-[#202820] placeholder-[#72766F]/60 focus:outline-none focus:border-[#18392B] focus:ring-1 focus:ring-[#18392B]/20 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#72766F] hover:text-[#202820]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#18392B] hover:bg-[#23523E] text-[#FAF9F6] text-xs sm:text-sm font-semibold rounded-lg transition cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-[#E7E8E1]">
          <div>
            <label className="block text-[11px] font-semibold text-[#72766F] uppercase tracking-wider mb-1">
              Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E7E8E1] bg-white text-[#202820] font-medium focus:border-[#18392B] focus:outline-none"
            >
              <option value="All">All Types</option>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#72766F] uppercase tracking-wider mb-1">
              Arrangement
            </label>
            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E7E8E1] bg-white text-[#202820] font-medium focus:border-[#18392B] focus:outline-none"
            >
              <option value="All">All Arrangements</option>
              {PAYMENT_TYPES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#72766F] uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E7E8E1] bg-white text-[#202820] font-medium focus:border-[#18392B] focus:outline-none"
            >
              <option value="All">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#72766F] uppercase tracking-wider mb-1">
              Min Budget ($)
            </label>
            <input
              type="number"
              placeholder="e.g. 500"
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
              onBlur={fetchGigs}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E7E8E1] bg-white text-[#202820] font-medium focus:border-[#18392B] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#72766F] uppercase tracking-wider mb-1">
              Max Budget ($)
            </label>
            <input
              type="number"
              placeholder="e.g. 3000"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              onBlur={fetchGigs}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E7E8E1] bg-white text-[#202820] font-medium focus:border-[#18392B] focus:outline-none"
            />
          </div>
        </div>

        {/* Active Filters and Reset */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center justify-between text-xs text-[#72766F] pt-3 border-t border-[#E7E8E1]">
            <span>
              <b>{activeFiltersCount}</b> active filter{activeFiltersCount > 1 ? 's' : ''} applied
            </span>
            <button
              onClick={handleClearFilters}
              className="text-[#18392B] hover:underline font-medium flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Results Header with Sorting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <span className="text-xs font-semibold text-[#72766F] uppercase tracking-wider">
          {loading ? 'Searching marketplace...' : `Showing ${sortedGigs.length} Campus Listing${sortedGigs.length === 1 ? '' : 's'}`}
        </span>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#72766F]" />
          <span className="text-xs text-[#72766F]">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-2.5 py-1 text-xs rounded-lg border border-[#E7E8E1] bg-white text-[#202820] font-medium focus:border-[#18392B] focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="deadline">Approaching Deadline</option>
            <option value="budget_desc">Highest Budget</option>
            <option value="budget_asc">Lowest Budget</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3.5 bg-[#FAF2EE] border border-[#F0D5C9] rounded-lg text-xs text-[#C77755] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#C77755] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Gigs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 bg-white rounded-xl border border-[#E7E8E1] animate-pulse" />
          ))}
        </div>
      ) : sortedGigs.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E7E8E1] p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
          <Filter className="w-8 h-8 text-[#A8B8A0] mx-auto" />
          <h3 className="font-serif text-lg text-[#202820]">No matching gigs found</h3>
          <p className="text-xs text-[#72766F]">
            Try clearing search keywords, broadening category filters, or resetting budget limits.
          </p>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-[#18392B] text-[#FAF9F6] text-xs font-semibold rounded-lg hover:bg-[#23523E] transition"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedGigs.map((gig) => {
            const isDeadlinePassed = new Date(gig.deadline).getTime() <= Date.now();

            return (
              <div
                key={gig.id}
                className="bg-white rounded-xl border border-[#E7E8E1] hover:border-[#18392B] transition flex flex-col justify-between overflow-hidden group shadow-xs"
              >
                <div className="p-5 flex-1 flex flex-col space-y-3">
                  {/* Category and Status - Zero-Pill Unboxed Text */}
                  <div className="flex items-center justify-between text-xs text-[#72766F]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[#18392B]">{gig.category}</span>
                      <span aria-hidden="true">·</span>
                      <GigTypeBadge type={gig.type} />
                    </div>
                    <GigStatusBadge status={gig.status} />
                  </div>

                  {/* Title */}
                  <Link to={`/gigs/${gig.id}`}>
                    <h3 className="font-serif text-base font-medium text-[#202820] group-hover:text-[#18392B] transition line-clamp-2 leading-snug">
                      {gig.title}
                    </h3>
                  </Link>

                  {/* Description */}
                  <p className="text-xs text-[#72766F] line-clamp-3 leading-relaxed flex-1">
                    {gig.description}
                  </p>

                  {/* Price & Deadline */}
                  <div className="pt-3 border-t border-[#E7E8E1] flex items-center justify-between text-xs">
                    <PaymentBadge payment_type={gig.payment_type} budget={gig.budget} />

                    <span
                      className={`text-xs flex items-center gap-1 ${
                        isDeadlinePassed ? 'text-[#C77755] font-medium' : 'text-[#72766F]'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-[#A8B8A0]" />
                      {isDeadlinePassed
                        ? 'Expired'
                        : `Due ${new Date(gig.deadline).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric'
                          })}`}
                    </span>
                  </div>
                </div>

                {/* Bottom Card Footer with Creator Info */}
                <div className="bg-[#FAF9F6] px-5 py-3 border-t border-[#E7E8E1] flex items-center justify-between">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-[#18392B] text-[#FAF9F6] flex items-center justify-center font-bold text-[10px] shrink-0">
                      {gig.owner?.name?.charAt(0) || 'U'}
                    </div>
                    <span className="text-xs font-medium text-[#202820] truncate">
                      {gig.owner?.name}
                    </span>
                  </div>

                  <Link
                    to={`/gigs/${gig.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#18392B] hover:underline"
                  >
                    <span>View Listing</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
