import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { ArrowRight, AlertCircle, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (studentEmail: string, studentPass: string = 'password123') => {
    setEmail(studentEmail);
    setPassword(studentPass);
    setError(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl border border-[#E7E8E1] overflow-hidden shadow-xs">
        {/* Left Column: Form & Quick Auth */}
        <div className="lg:col-span-7 p-8 sm:p-10 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#18392B] text-[#FAF9F6] flex items-center justify-center shadow-xs">
                <GraduationCap className="w-5 h-5 text-[#A8B8A0]" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif text-[#202820]">
                Sign in to CampusConnect
              </h1>
              <p className="text-xs sm:text-sm text-[#72766F] leading-relaxed">
                Access your campus gigs, student proposals, and verified academic reputation.
              </p>
            </div>

            {/* Error notification */}
            {error && (
              <div className="p-3.5 bg-[#FAF2EE] border border-[#F0D5C9] rounded-lg text-xs text-[#C77755] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#C77755] shrink-0 mt-0.5" />
                <div className="font-medium">{error}</div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#202820] mb-1.5">
                  University Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sara.ahmed@campus.edu"
                  required
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-[#E7E8E1] bg-white text-[#202820] placeholder-[#72766F]/60 focus:outline-none focus:border-[#18392B] focus:ring-1 focus:ring-[#18392B]/20 transition"
                  disabled={loading}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#202820]">
                    Password
                  </label>
                  <span className="text-[11px] text-[#72766F]">Min 6 characters</span>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-[#E7E8E1] bg-white text-[#202820] placeholder-[#72766F]/60 focus:outline-none focus:border-[#18392B] focus:ring-1 focus:ring-[#18392B]/20 transition"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-[#18392B] hover:bg-[#23523E] text-[#FAF9F6] text-xs sm:text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-60 shadow-xs cursor-pointer"
              >
                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                {!loading && <ArrowRight className="w-4 h-4 text-[#A8B8A0]" />}
              </button>
            </form>

            {/* Quick Student Credentials for evaluation */}
            <div className="pt-4 border-t border-[#E7E8E1] text-xs text-[#72766F] space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-[#202820]">Quick sign-in for testing:</span>
                <span className="font-mono text-[#72766F]">password123</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickSelect('sara.ahmed@campus.edu')}
                  className="text-left px-2.5 py-1.5 rounded-lg border border-[#E7E8E1] hover:bg-[#FAF9F6] text-[11px] text-[#202820] truncate cursor-pointer transition"
                >
                  Sara Ahmed (CS)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect('ali.khan@campus.edu')}
                  className="text-left px-2.5 py-1.5 rounded-lg border border-[#E7E8E1] hover:bg-[#FAF9F6] text-[11px] text-[#202820] truncate cursor-pointer transition"
                >
                  Ali Khan (SE)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect('maya.chen@campus.edu')}
                  className="text-left px-2.5 py-1.5 rounded-lg border border-[#E7E8E1] hover:bg-[#FAF9F6] text-[11px] text-[#202820] truncate cursor-pointer transition"
                >
                  Maya Chen (Design)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect('liam.oconnor@campus.edu')}
                  className="text-left px-2.5 py-1.5 rounded-lg border border-[#E7E8E1] hover:bg-[#FAF9F6] text-[11px] text-[#202820] truncate cursor-pointer transition"
                >
                  Liam O'Connor (Lit)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect('evaluator.owner@campus.edu', 'Evaluator2026!')}
                  className="text-left px-2.5 py-1.5 rounded-lg border border-[#18392B]/30 bg-[#EBF0E8]/40 hover:bg-[#EBF0E8] text-[11px] text-[#18392B] font-semibold truncate cursor-pointer transition"
                >
                  Evaluator Owner
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect('evaluator.applicant@campus.edu', 'Evaluator2026!')}
                  className="text-left px-2.5 py-1.5 rounded-lg border border-[#18392B]/30 bg-[#EBF0E8]/40 hover:bg-[#EBF0E8] text-[11px] text-[#18392B] font-semibold truncate cursor-pointer transition"
                >
                  Evaluator Applicant
                </button>
              </div>
            </div>
          </div>

          {/* Link to Sign Up */}
          <div className="pt-4 border-t border-[#E7E8E1] text-xs text-[#72766F] text-center">
            <span>New to CampusConnect? </span>
            <Link to="/signup" className="font-semibold text-[#18392B] hover:underline">
              Create student profile
            </Link>
          </div>
        </div>

        {/* Right Column: Editorial Atmosphere & Campus Visual */}
        <div className="hidden lg:flex lg:col-span-5 relative bg-[#18392B] text-[#FAF9F6] flex-col justify-between p-8 overflow-hidden">
          <img
            src="/src/assets/images/student_creative_design_1792564680138.jpg"
            alt="Student designing user interfaces in campus design lab"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-25"
          />
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/10 backdrop-blur-xs text-[11px] font-medium text-[#A8B8A0] border border-white/15">
              <Sparkles className="w-3 h-3 text-[#A8B8A0]" />
              <span>Campus Community</span>
            </div>
            <h3 className="font-serif text-2xl text-white leading-snug">
              "The most rewarding way to build coursework experience and support fellow students."
            </h3>
          </div>

          <div className="relative z-10 pt-6 border-t border-white/15 text-xs text-[#FAF9F6]/80 space-y-1">
            <div className="flex items-center gap-1.5 text-white font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#A8B8A0]" />
              <span>University Honor Code Compliant</span>
            </div>
            <p className="text-[11px] text-[#FAF9F6]/60">
              Verified peer exchanges across all campus faculties and colleges.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
