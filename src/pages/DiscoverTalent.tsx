import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.ts';
import { User } from '../types.ts';
import {
  Search,
  Star,
  Briefcase,
  CheckCircle2,
  GraduationCap,
  ChevronRight,
  X,
  Users,
  ArrowUpDown
} from 'lucide-react';

type SortOption = 'reputation' | 'completed' | 'gigs_posted' | 'name';

export const DiscoverTalent: React.FC = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMajor, setSelectedMajor] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('reputation');

  useEffect(() => {
    let active = true;
    const fetchStudents = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getUsers();
        if (active) {
          setStudents(data);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Failed to fetch student directory.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchStudents();
    return () => {
      active = false;
    };
  }, []);

  // Unique majors for filter tabs
  const majors = useMemo(() => {
    const list = students.map((s) => s.major).filter(Boolean);
    return ['All', ...Array.from(new Set(list))];
  }, [students]);

  // Filter & Search logic
  const filteredStudents = useMemo(() => {
    let result = [...students];

    if (selectedMajor !== 'All') {
      result = result.filter((s) => s.major.toLowerCase() === selectedMajor.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.major.toLowerCase().includes(q) ||
          s.bio.toLowerCase().includes(q) ||
          s.skills?.some((skill) => skill.toLowerCase().includes(q))
      );
    }

    switch (sortBy) {
      case 'reputation':
        return result.sort((a, b) => (b.stats?.average_rating || 0) - (a.stats?.average_rating || 0));
      case 'completed':
        return result.sort((a, b) => (b.stats?.gigs_completed || 0) - (a.stats?.gigs_completed || 0));
      case 'gigs_posted':
        return result.sort((a, b) => (b.stats?.gigs_posted || 0) - (a.stats?.gigs_posted || 0));
      case 'name':
      default:
        return result.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [students, selectedMajor, searchQuery, sortBy]);

  return (
    <div className="space-y-6 pb-20">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E7E8E1] pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#18392B]">
            Campus Talent Directory
          </span>
          <h1 className="text-3xl font-serif text-[#202820] mt-1">Discover Campus Talent</h1>
          <p className="text-xs sm:text-sm text-[#72766F] mt-1">
            Browse verified student peers across engineering, design, humanities, and sciences with documented reputation.
          </p>
        </div>
        <div className="text-xs text-[#72766F] font-semibold self-start sm:self-auto tabular-nums bg-white px-3 py-1.5 rounded-lg border border-[#E7E8E1]">
          {students.length} Registered Students
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-[#E7E8E1] p-5 space-y-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#72766F]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students by name, major, or skill (e.g., React, Calculus, Figma, Editing)..."
            className="w-full pl-10 pr-8 py-2.5 text-xs sm:text-sm rounded-lg border border-[#E7E8E1] bg-white text-[#202820] placeholder-[#72766F]/60 focus:outline-none focus:border-[#18392B] focus:ring-1 focus:ring-[#18392B]/20 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#72766F] hover:text-[#202820]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Major Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 p-1 bg-[#FAF9F6] rounded-xl border border-[#E7E8E1]">
          {majors.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMajor(m)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                selectedMajor === m
                  ? 'bg-[#18392B] text-[#FAF9F6]'
                  : 'text-[#72766F] hover:text-[#202820] hover:bg-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Results Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <span className="text-xs font-semibold text-[#72766F] uppercase tracking-wider">
          {loading
            ? 'Loading student directory...'
            : `Showing ${filteredStudents.length} Student${filteredStudents.length === 1 ? '' : 's'}`}
        </span>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#72766F]" />
          <span className="text-xs text-[#72766F]">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-2.5 py-1 text-xs rounded-lg border border-[#E7E8E1] bg-white text-[#202820] font-medium focus:border-[#18392B] focus:outline-none"
          >
            <option value="reputation">Highest Rating</option>
            <option value="completed">Most Gigs Completed</option>
            <option value="gigs_posted">Most Gigs Posted</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-[#FAF2EE] border border-[#F0D5C9] rounded-xl text-xs text-[#C77755]">
          {error}
        </div>
      )}

      {/* Student Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-white rounded-xl border border-[#E7E8E1] animate-pulse" />
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E7E8E1] p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
          <Users className="w-8 h-8 text-[#A8B8A0] mx-auto" />
          <h3 className="font-serif text-lg text-[#202820]">No students matched your search</h3>
          <p className="text-xs text-[#72766F]">
            Try searching for another skill, academic department, or clearing your query.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedMajor('All');
            }}
            className="px-4 py-2 bg-[#18392B] text-[#FAF9F6] text-xs font-semibold rounded-lg hover:bg-[#23523E] transition"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStudents.map((student) => {
            const stats = student.stats;
            return (
              <div
                key={student.id}
                className="bg-white rounded-xl border border-[#E7E8E1] hover:border-[#18392B] transition flex flex-col justify-between overflow-hidden shadow-xs group"
              >
                <div className="p-5 space-y-3 flex-1 flex flex-col">
                  {/* Avatar and Identity */}
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#18392B] text-[#FAF9F6] flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                      {student.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/profile/${student.id}`}
                        className="font-serif text-base font-medium text-[#202820] group-hover:text-[#18392B] transition truncate block"
                      >
                        {student.name}
                      </Link>
                      <div className="text-xs text-[#72766F] flex items-center gap-1.5 mt-0.5">
                        <GraduationCap className="w-3.5 h-3.5 text-[#A8B8A0] shrink-0" />
                        <span className="truncate">{student.major}</span>
                        <span>·</span>
                        <span className="whitespace-nowrap">Sem {student.semester}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bio snippet */}
                  <p className="text-xs text-[#72766F] line-clamp-2 leading-relaxed flex-1">
                    {student.bio || 'Student member of the CampusConnect academic exchange community.'}
                  </p>

                  {/* Skills Display */}
                  {student.skills && student.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {student.skills.slice(0, 4).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#FAF9F6] text-[#202820] border border-[#E7E8E1]"
                        >
                          {skill}
                        </span>
                      ))}
                      {student.skills.length > 4 && (
                        <span className="px-1.5 py-0.5 text-[10px] text-[#72766F] font-medium">
                          +{student.skills.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Metrics Row */}
                  <div className="pt-3 border-t border-[#E7E8E1] grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#72766F] block font-semibold">
                        Rating
                      </span>
                      <div className="font-semibold text-[#202820] mt-0.5 flex items-center justify-center gap-1 tabular-nums">
                        <span>{stats?.average_rating !== null && stats?.average_rating !== undefined ? `${stats.average_rating}` : '—'}</span>
                        {stats?.average_rating !== null && stats?.average_rating !== undefined && (
                          <Star className="w-3 h-3 fill-[#C77755] text-[#C77755]" />
                        )}
                      </div>
                      <span className="text-[10px] text-[#72766F]">
                        {stats?.ratings_count || 0} reviews
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#72766F] block font-semibold">
                        Completed
                      </span>
                      <div className="font-semibold text-[#202820] mt-0.5 tabular-nums">
                        {stats?.gigs_completed ?? 0}
                      </div>
                      <span className="text-[10px] text-[#72766F]">gigs</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#72766F] block font-semibold">
                        Posted
                      </span>
                      <div className="font-semibold text-[#202820] mt-0.5 tabular-nums">
                        {stats?.gigs_posted ?? 0}
                      </div>
                      <span className="text-[10px] text-[#72766F]">gigs</span>
                    </div>
                  </div>
                </div>

                {/* Footer Link */}
                <div className="bg-[#FAF9F6] px-5 py-3 border-t border-[#E7E8E1] flex items-center justify-between">
                  <span className="text-[11px] text-[#72766F]">Verified Student Member</span>
                  <Link
                    to={`/profile/${student.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#18392B] hover:underline"
                  >
                    <span>View Profile</span>
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
