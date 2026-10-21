import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.ts';
import { Gig } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Code2,
  Palette,
  PenTool,
  GraduationCap,
  ArrowRight,
  Search,
  CheckCircle2,
  Clock,
  ChevronRight,
  DollarSign,
  Repeat,
  HeartHandshake,
  Sparkles,
  Users
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [featuredGigs, setFeaturedGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroSearchQuery, setHeroSearchQuery] = useState('');

  useEffect(() => {
    let active = true;
    const fetchFeatured = async () => {
      try {
        const gigs = await api.getGigs({ status: 'Open' });
        if (active) {
          setFeaturedGigs(gigs.slice(0, 6));
        }
      } catch (err) {
        console.error('Failed to load featured gigs:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchFeatured();
    return () => {
      active = false;
    };
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(heroSearchQuery.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  const categories = [
    {
      name: 'Programming',
      icon: Code2,
      description: 'Full-stack web apps, Python scripts, algorithms, mobile apps, and database debugging.',
      query: 'Programming',
      highlight: true
    },
    {
      name: 'Design',
      icon: Palette,
      description: 'Figma prototypes, club brand identities, pitch deck aesthetics, and vector illustrations.',
      query: 'Design',
      highlight: false
    },
    {
      name: 'Writing',
      icon: PenTool,
      description: 'Research paper editing, statement of purpose polish, and technical documentation.',
      query: 'Writing',
      highlight: false
    },
    {
      name: 'Tutoring',
      icon: GraduationCap,
      description: '1-on-1 coaching in multivariable calculus, organic chemistry, linear algebra, and data structures.',
      query: 'Tutoring',
      highlight: false
    }
  ];

  return (
    <div className="space-y-24 pb-24">
      {/* Editorial Asymmetric Hero Section */}
      <section className="pt-4 sm:pt-8 pb-12 border-b border-[#E7E8E1]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Editorial Typographic Anchor */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#18392B]"></span>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#18392B]">
                University Freelance & Skill Exchange
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-normal tracking-tight text-[#202820] leading-[1.08] text-balance">
              Where campus talent meets <span className="italic font-serif text-[#18392B]">campus need.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#72766F] max-w-xl leading-relaxed">
              Connect directly with verified university peers to exchange programming, design, and tutoring services. Trade skills 1:1, hire student talent, and build an authentic campus portfolio.
            </p>

            {/* Direct Marketplace Search in Hero */}
            <form onSubmit={handleHeroSearch} className="pt-1 max-w-lg">
              <div className="flex items-center gap-2 p-1.5 bg-white rounded-xl border border-[#E7E8E1] shadow-xs focus-within:border-[#18392B] focus-within:ring-1 focus-within:ring-[#18392B]/20 transition">
                <Search className="w-4 h-4 ml-3 text-[#72766F] shrink-0" />
                <input
                  type="text"
                  value={heroSearchQuery}
                  onChange={(e) => setHeroSearchQuery(e.target.value)}
                  placeholder="Search gigs by skill, course, or topic (e.g. Python, Figma, Calculus)..."
                  className="w-full px-2 py-2 text-xs sm:text-sm bg-transparent text-[#202820] placeholder-[#72766F]/60 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#18392B] hover:bg-[#23523E] text-[#FAF9F6] text-xs font-medium rounded-lg transition whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Find Gigs
                </button>
              </div>
            </form>

            {/* Quick Primary Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to="/explore"
                className="px-5 py-2.5 bg-white hover:bg-[#FAF9F6] text-[#202820] text-xs font-medium rounded-lg border border-[#E7E8E1] transition flex items-center gap-1.5 shadow-xs"
              >
                <span>Browse All Gigs</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#72766F]" />
              </Link>

              {isAuthenticated ? (
                <Link
                  to="/create"
                  className="px-5 py-2.5 bg-[#18392B] hover:bg-[#23523E] text-[#FAF9F6] text-xs font-medium rounded-lg transition shadow-xs"
                >
                  + Post a Gig
                </Link>
              ) : (
                <Link
                  to="/signup"
                  className="px-5 py-2.5 bg-[#18392B] hover:bg-[#23523E] text-[#FAF9F6] text-xs font-medium rounded-lg transition shadow-xs"
                >
                  Create Student Account
                </Link>
              )}

              <Link
                to="/talent"
                className="px-4 py-2.5 text-[#72766F] hover:text-[#18392B] text-xs font-medium transition flex items-center gap-1"
              >
                <Users className="w-3.5 h-3.5 text-[#A8B8A0]" />
                <span>View Student Directory</span>
              </Link>
            </div>

            {/* Quantitative Proof Strip */}
            <div className="pt-6 border-t border-[#E7E8E1] grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
              <div>
                <div className="text-xl sm:text-2xl font-serif text-[#202820] tabular-nums">100%</div>
                <div className="text-[11px] text-[#72766F] mt-0.5">Verified Student Peers</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-serif text-[#202820]">3 Models</div>
                <div className="text-[11px] text-[#72766F] mt-0.5">Paid, SkillSwap & Free</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-serif text-[#202820]">Two-Way</div>
                <div className="text-[11px] text-[#72766F] mt-0.5">Mutual Reputation</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-serif text-[#202820] tabular-nums">0%</div>
                <div className="text-[11px] text-[#72766F] mt-0.5">Platform Service Fees</div>
              </div>
            </div>
          </div>

          {/* Right Column: Carefully Art-Directed University Photography */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-[#E7E8E1] bg-white shadow-xs group">
              <img
                src="/src/assets/images/campus_collaboration_hero_1792564680854.jpg"
                alt="University students collaborating over coursework and laptops in a campus study hall"
                referrerPolicy="no-referrer"
                className="w-full h-[360px] sm:h-[460px] object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#10261D]/80 via-transparent to-transparent flex flex-col justify-end p-6 text-[#FAF9F6]">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#18392B]/85 backdrop-blur-xs text-[11px] font-medium text-[#A8B8A0] self-start mb-2 border border-[#A8B8A0]/20">
                  <Sparkles className="w-3 h-3 text-[#A8B8A0]" />
                  <span>Verified Campus Exchange</span>
                </div>
                <p className="text-sm font-serif font-medium text-white leading-snug">
                  Peer-to-peer collaboration across engineering, design, humanities, and sciences.
                </p>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/20 text-[11px] text-white/80">
                  <span>Semester 1–8 Students</span>
                  <span>·</span>
                  <span>25+ Live Opportunities</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Sides of Campus: Offering vs. Requesting */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#18392B]">
              Flexible Student Participation
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif text-[#202820]">
              Offer your strengths. Request help where you need it.
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#72766F] max-w-md">
            Every student account holds unified privileges: post offerings to earn compensation or swap skills, and post requests to find peer collaborators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: Offering */}
          <div className="rounded-xl bg-white border border-[#E7E8E1] overflow-hidden flex flex-col justify-between shadow-xs hover:border-[#18392B]/40 transition">
            <div className="relative h-56 overflow-hidden">
              <img
                src="/src/assets/images/student_creative_design_1792564680138.jpg"
                alt="University student designing user interfaces and digital wireframes in campus studio"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded text-[11px] font-semibold text-[#18392B] border border-[#E7E8E1]">
                Student Offerings
              </div>
            </div>
            <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-serif text-[#202820]">Offering Gigs</h3>
                <p className="text-xs text-[#72766F] mt-2 leading-relaxed">
                  Have experience in frontend development, Figma design, statistical analysis, or chemistry? Post your offerings to tutor classmates, build apps for campus clubs, and build a verified portfolio.
                </p>
              </div>

              <div className="pt-4 border-t border-[#E7E8E1] space-y-2 text-xs text-[#202820]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#18392B] shrink-0" />
                  <span>Set upfront budgets or propose direct 1:1 SkillSwaps</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#18392B] shrink-0" />
                  <span>Receive proposals from student applicants across campus</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Requesting */}
          <div className="rounded-xl bg-white border border-[#E7E8E1] overflow-hidden flex flex-col justify-between shadow-xs hover:border-[#C77755]/40 transition">
            <div className="relative h-56 overflow-hidden">
              <img
                src="/src/assets/images/student_peer_tutoring_1792564680934.jpg"
                alt="Two university students studying code and calculus notes in library"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded text-[11px] font-semibold text-[#C77755] border border-[#E7E8E1]">
                Student Assistance
              </div>
            </div>
            <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-serif text-[#202820]">Requesting Gigs</h3>
                <p className="text-xs text-[#72766F] mt-2 leading-relaxed">
                  Stuck on a tricky linear algebra assignment, preparing a pitch deck for an entrepreneurship challenge, or needing a custom website? Post a request and connect directly with talented student peers.
                </p>
              </div>

              <div className="pt-4 border-t border-[#E7E8E1] space-y-2 text-xs text-[#202820]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C77755] shrink-0" />
                  <span>Select the most qualified peer and review their reputation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C77755] shrink-0" />
                  <span>Structured lifecycle from In Progress to mutual review</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories: Distinctive Editorial Layout */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#E7E8E1] pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#18392B]">
              Marketplace Taxonomy
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif text-[#202820] mt-1">
              Explore Campus Disciplines
            </h2>
          </div>
          <Link
            to="/explore"
            className="text-xs font-medium text-[#18392B] hover:underline flex items-center gap-1"
          >
            <span>View all marketplace listings</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.name}
                to={`/explore?category=${cat.query}`}
                className={`p-6 rounded-xl border transition group flex flex-col justify-between shadow-xs ${
                  cat.highlight
                    ? 'bg-[#EBF0E8]/50 border-[#A8B8A0]/60 hover:border-[#18392B]'
                    : 'bg-white border-[#E7E8E1] hover:border-[#18392B]'
                }`}
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-[#FAF9F6] border border-[#E7E8E1] text-[#18392B] flex items-center justify-center mb-4 group-hover:bg-[#EBF0E8] transition">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-lg text-[#202820] group-hover:text-[#18392B] transition">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-[#72766F] mt-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-[#E7E8E1] text-xs font-medium text-[#18392B] flex items-center gap-1">
                  <span>Browse {cat.name}</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Gigs Grid: High-Craft Marketplace Listings */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#E7E8E1] pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#18392B]">
              Active Listings
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif text-[#202820] mt-1">
              Featured Marketplace Opportunities
            </h2>
          </div>
          <Link
            to="/explore"
            className="text-xs font-medium text-[#18392B] hover:underline flex items-center gap-1"
          >
            <span>Browse all open gigs</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 bg-white rounded-xl border border-[#E7E8E1] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredGigs.map((gig) => (
              <Link
                key={gig.id}
                to={`/gigs/${gig.id}`}
                className="p-5 bg-white rounded-xl border border-[#E7E8E1] hover:border-[#18392B] transition flex flex-col justify-between group shadow-xs"
              >
                <div className="space-y-3">
                  {/* Zero-Pill Unboxed Metadata Header */}
                  <div className="flex items-center justify-between text-[11px] text-[#72766F]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[#18392B]">{gig.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{gig.type}</span>
                    </div>
                    <span className="text-[#18392B] font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#18392B]"></span>
                      <span>Open</span>
                    </span>
                  </div>

                  <h3 className="font-serif text-lg text-[#202820] group-hover:text-[#18392B] transition line-clamp-2 leading-snug">
                    {gig.title}
                  </h3>

                  <p className="text-xs text-[#72766F] line-clamp-2 leading-relaxed">
                    {gig.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#E7E8E1] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-[#72766F] uppercase tracking-wider block font-medium">Compensation</span>
                    <span className="font-semibold text-[#18392B] text-sm tabular-nums">
                      {gig.payment_type === 'Paid'
                        ? `$${gig.budget?.toLocaleString()}`
                        : gig.payment_type}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-[#72766F] uppercase tracking-wider block font-medium">Deadline</span>
                    <span className="text-[#202820] text-xs flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-[#A8B8A0]" />
                      {new Date(gig.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* The Three Payment Models Explained */}
      <section className="p-8 sm:p-12 bg-white rounded-xl border border-[#E7E8E1] space-y-8 shadow-xs">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#18392B]">
            Transparent Compensation
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif text-[#202820]">
            Three flexible ways to collaborate
          </h2>
          <p className="text-xs sm:text-sm text-[#72766F]">
            CampusConnect accommodates student budgets and mutual skill exchange with three transparent arrangement models.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          <div className="space-y-3 p-5 rounded-lg bg-[#FAF9F6] border border-[#E7E8E1]">
            <div className="w-8 h-8 rounded-md bg-[#EBF0E8] text-[#18392B] flex items-center justify-center font-bold text-sm">
              <DollarSign className="w-4 h-4" />
            </div>
            <h4 className="font-serif text-base text-[#202820]">Paid Gigs</h4>
            <p className="text-xs text-[#72766F] leading-relaxed">
              Clear upfront monetary compensation agreed between students for high-effort projects, development sprints, and formal tutoring.
            </p>
          </div>

          <div className="space-y-3 p-5 rounded-lg bg-[#FAF9F6] border border-[#E7E8E1]">
            <div className="w-8 h-8 rounded-md bg-[#FAF2EE] text-[#C77755] flex items-center justify-center font-bold text-sm">
              <Repeat className="w-4 h-4" />
            </div>
            <h4 className="font-serif text-base text-[#202820]">SkillSwap</h4>
            <p className="text-xs text-[#72766F] leading-relaxed">
              Direct exchange of skills without currency: barter a custom Figma logo for API backend debugging, or essay editing for calculus coaching.
            </p>
          </div>

          <div className="space-y-3 p-5 rounded-lg bg-[#FAF9F6] border border-[#E7E8E1]">
            <div className="w-8 h-8 rounded-md bg-[#EBF0E8] text-[#72766F] flex items-center justify-center font-bold text-sm">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <h4 className="font-serif text-base text-[#202820]">Free Peer Support</h4>
            <p className="text-xs text-[#72766F] leading-relaxed">
              Voluntary mentorship, quick resume reviews, exam study sessions, and student club initiatives with zero financial barrier.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#18392B]">
            Structured Lifecycle
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif text-[#202820]">
            How CampusConnect works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-xl border border-[#E7E8E1] space-y-3 shadow-xs">
            <span className="text-xl font-serif italic text-[#18392B] block">01</span>
            <h4 className="font-serif text-lg text-[#202820]">Post or Discover</h4>
            <p className="text-xs text-[#72766F] leading-relaxed">
              Publish a validated gig with category, deadline, and compensation type, or search marketplace listings using combined filters.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-[#E7E8E1] space-y-3 shadow-xs">
            <span className="text-xl font-serif italic text-[#18392B] block">02</span>
            <h4 className="font-serif text-lg text-[#202820]">Select & Collaborate</h4>
            <p className="text-xs text-[#72766F] leading-relaxed">
              Review applicant proposals and credentials. Selecting a student transitions the gig to In Progress and locks other applications.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-[#E7E8E1] space-y-3 shadow-xs">
            <span className="text-xl font-serif italic text-[#18392B] block">03</span>
            <h4 className="font-serif text-lg text-[#202820]">Review & Build Reputation</h4>
            <p className="text-xs text-[#72766F] leading-relaxed">
              Upon completion, both students leave mutual 1–5 star reviews and feedback, permanently strengthening academic portfolio ratings.
            </p>
          </div>
        </div>
      </section>

      {/* Closing Editorial Call to Action */}
      <section className="p-10 sm:p-14 bg-[#18392B] rounded-2xl text-[#FAF9F6] text-center space-y-5 shadow-sm">
        <span className="text-xs font-semibold tracking-widest uppercase text-[#A8B8A0]">
          University Student Community
        </span>
        <h2 className="text-3xl sm:text-5xl font-serif font-normal tracking-tight max-w-xl mx-auto leading-tight text-balance">
          Ready to put your skills to work on campus?
        </h2>
        <p className="text-sm text-[#FAF9F6]/85 max-w-md mx-auto leading-relaxed">
          Create your verified student profile today and connect with peers across engineering, design, humanities, and sciences.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/signup"
            className="px-6 py-3 bg-[#FAF9F6] hover:bg-white text-[#18392B] text-xs font-semibold rounded-lg transition shadow-xs"
          >
            Get Started Free
          </Link>
          <Link
            to="/explore"
            className="px-6 py-3 bg-transparent hover:bg-white/10 text-[#FAF9F6] text-xs font-medium rounded-lg border border-[#A8B8A0]/40 transition"
          >
            Browse Marketplace
          </Link>
        </div>
      </section>
    </div>
  );
};
