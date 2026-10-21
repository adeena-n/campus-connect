import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { ArrowRight, AlertCircle, X, GraduationCap, ShieldCheck } from 'lucide-react';

export const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [major, setMajor] = useState('');
  const [semester, setSemester] = useState(1);
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>(['React', 'UI Design']);
  const [skillInput, setSkillInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError('Name, email, and password are required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signup({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        major: major.trim() || 'Computer Science',
        semester: Number(semester),
        bio: bio.trim() || 'University student exchanging skills and offering gigs on CampusConnect.',
        skills
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="max-w-xl w-full space-y-6 bg-white p-8 sm:p-10 rounded-2xl border border-[#E7E8E1] shadow-xs">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#18392B] text-[#FAF9F6] flex items-center justify-center mx-auto mb-2 shadow-xs">
            <GraduationCap className="w-5 h-5 text-[#A8B8A0]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#202820]">
            Join CampusConnect
          </h1>
          <p className="text-xs sm:text-sm text-[#72766F] max-w-sm mx-auto leading-relaxed">
            Create your student profile to post gigs, offer peer services, and collaborate across campus.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 bg-[#FAF2EE] border border-[#F0D5C9] rounded-lg text-xs text-[#C77755] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#C77755] shrink-0 mt-0.5" />
            <div className="font-medium">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#202820] mb-1.5">
                Full Name <span className="text-[#C77755]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                required
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-[#E7E8E1] bg-white text-[#202820] placeholder-[#72766F]/60 focus:outline-none focus:border-[#18392B] focus:ring-1 focus:ring-[#18392B]/20 transition"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202820] mb-1.5">
                University Email <span className="text-[#C77755]">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex.m@campus.edu"
                required
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-[#E7E8E1] bg-white text-[#202820] placeholder-[#72766F]/60 focus:outline-none focus:border-[#18392B] focus:ring-1 focus:ring-[#18392B]/20 transition"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-[#202820] mb-1.5">
              Password (min 6 characters) <span className="text-[#C77755]">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-[#E7E8E1] bg-white text-[#202820] placeholder-[#72766F]/60 focus:outline-none focus:border-[#18392B] focus:ring-1 focus:ring-[#18392B]/20 transition"
              disabled={loading}
            />
          </div>

          {/* Major & Semester */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#202820] mb-1.5">
                Major / Department
              </label>
              <input
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="e.g. Computer Science"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-[#E7E8E1] bg-white text-[#202820] placeholder-[#72766F]/60 focus:outline-none focus:border-[#18392B] focus:ring-1 focus:ring-[#18392B]/20 transition"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202820] mb-1.5">
                Current Semester
              </label>
              <input
                type="number"
                min={1}
                max={16}
                value={semester}
                onChange={(e) => setSemester(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-[#E7E8E1] bg-white text-[#202820] placeholder-[#72766F]/60 focus:outline-none focus:border-[#18392B] focus:ring-1 focus:ring-[#18392B]/20 transition tabular-nums"
                disabled={loading}
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-[#202820] mb-1.5">
              Student Biography
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe what services you offer, projects you like to work on, or coursework you need assistance with..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-[#E7E8E1] bg-white text-[#202820] placeholder-[#72766F]/60 focus:outline-none focus:border-[#18392B] focus:ring-1 focus:ring-[#18392B]/20 transition leading-relaxed"
              disabled={loading}
            />
          </div>

          {/* Skills Tag input */}
          <div>
            <label className="block text-xs font-semibold text-[#202820] mb-1.5">
              Skills & Expertise Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="e.g. Python, Figma, Linear Algebra"
                className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-[#E7E8E1] bg-white text-[#202820] focus:outline-none focus:border-[#18392B] focus:ring-1 focus:ring-[#18392B]/20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={handleAddSkill}
                disabled={loading}
                className="px-4 py-2 bg-[#FAF9F6] border border-[#E7E8E1] hover:bg-[#EBF0E8] text-xs font-medium text-[#202820] rounded-lg transition cursor-pointer"
              >
                Add Tag
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-[#FAF9F6] text-[#202820] font-medium border border-[#E7E8E1]"
                >
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(s)}
                    className="text-[#72766F] hover:text-[#C77755] cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="p-3 bg-[#FAF9F6] rounded-lg border border-[#E7E8E1] text-[11px] text-[#72766F] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#18392B] shrink-0" />
            <span>Registration automatically provisions a verified student profile with rating metrics.</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-[#18392B] hover:bg-[#23523E] text-[#FAF9F6] text-xs sm:text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-60 shadow-xs cursor-pointer"
          >
            <span>{loading ? 'Creating Account...' : 'Complete Profile & Register'}</span>
            {!loading && <ArrowRight className="w-4 h-4 text-[#A8B8A0]" />}
          </button>
        </form>

        {/* Link to Login */}
        <div className="pt-2 text-center text-xs text-[#72766F]">
          <span>Already registered? </span>
          <Link to="/login" className="font-semibold text-[#18392B] hover:underline">
            Sign in to existing account
          </Link>
        </div>
      </div>
    </div>
  );
};
