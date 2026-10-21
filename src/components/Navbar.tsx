import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import {
  GraduationCap,
  PlusCircle,
  Briefcase,
  FileCheck2,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E7E8E1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Brand Wordmark */}
          <Link
            to="/"
            className="flex items-center gap-2.5 text-lg font-serif font-medium tracking-tight text-[#202820] hover:text-[#18392B] transition whitespace-nowrap shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-[#18392B] flex items-center justify-center text-[#FAF9F6] shadow-xs">
              <GraduationCap className="w-4 h-4 text-[#A8B8A0]" />
            </div>
            <span>CampusConnect</span>
          </Link>

          {/* Zone 2: Navigation Links (single-line, concise) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#72766F]">
            <Link
              to="/explore"
              className={`hover:text-[#18392B] transition-colors whitespace-nowrap shrink-0 relative py-1 ${
                isActive('/explore') ? 'text-[#18392B] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#18392B]' : ''
              }`}
            >
              Explore Gigs
            </Link>

            <Link
              to="/talent"
              className={`hover:text-[#18392B] transition-colors whitespace-nowrap shrink-0 relative py-1 ${
                isActive('/talent') ? 'text-[#18392B] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#18392B]' : ''
              }`}
            >
              Find Talent
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  className={`hover:text-[#18392B] transition-colors whitespace-nowrap shrink-0 ${
                    isActive('/dashboard') ? 'text-[#18392B] font-semibold' : ''
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/my-gigs"
                  className={`hover:text-[#18392B] transition-colors whitespace-nowrap shrink-0 ${
                    isActive('/my-gigs') ? 'text-[#18392B] font-semibold' : ''
                  }`}
                >
                  My Gigs
                </Link>
                <Link
                  to="/my-applications"
                  className={`hover:text-[#18392B] transition-colors whitespace-nowrap shrink-0 ${
                    isActive('/my-applications') ? 'text-[#18392B] font-semibold' : ''
                  }`}
                >
                  Applications
                </Link>
              </>
            )}
          </nav>

          {/* Zone 3: Primary Action & User Profile */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {isAuthenticated ? (
              <>
                <Link
                  to="/create"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#18392B] hover:bg-[#23523E] text-[#FAF9F6] text-xs font-medium transition shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-[#A8B8A0]" />
                  <span>Post a Gig</span>
                </Link>

                {/* User Menu Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 pr-2.5 rounded-lg border border-[#E7E8E1] hover:bg-[#FAF9F6] transition cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#18392B] text-[#FAF9F6] flex items-center justify-center font-bold text-[11px]">
                      {currentUser?.name?.charAt(0) || 'U'}
                    </div>
                    <span className="font-medium text-xs text-[#202820] max-w-[100px] truncate leading-tight">
                      {currentUser?.name}
                    </span>
                    <ChevronDown className="w-3 h-3 text-[#72766F]" />
                  </button>

                  {userDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E7E8E1] rounded-xl shadow-lg z-50 py-1 divide-y divide-[#E7E8E1]">
                        <div className="px-3.5 py-2.5 text-xs">
                          <div className="font-medium text-[#202820]">{currentUser?.name}</div>
                          <div className="text-[11px] text-[#72766F] truncate">{currentUser?.email}</div>
                          <div className="text-[11px] text-[#18392B] font-medium mt-0.5">
                            {currentUser?.major} · Sem {currentUser?.semester}
                          </div>
                        </div>

                        <div className="py-1 text-xs">
                          <Link
                            to={`/profile/${currentUser?.id}`}
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3.5 py-2 text-[#202820] hover:bg-[#FAF9F6] transition"
                          >
                            <UserIcon className="w-3.5 h-3.5 text-[#72766F]" />
                            <span>My Profile & Reviews</span>
                          </Link>
                          <Link
                            to="/my-gigs"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3.5 py-2 text-[#202820] hover:bg-[#FAF9F6] transition"
                          >
                            <Briefcase className="w-3.5 h-3.5 text-[#72766F]" />
                            <span>My Posted Gigs</span>
                          </Link>
                          <Link
                            to="/my-applications"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3.5 py-2 text-[#202820] hover:bg-[#FAF9F6] transition"
                          >
                            <FileCheck2 className="w-3.5 h-3.5 text-[#72766F]" />
                            <span>My Applications</span>
                          </Link>
                        </div>

                        <div className="py-1 text-xs">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-[#C77755] hover:bg-[#FAF2EE] transition text-left cursor-pointer"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 text-xs font-medium text-[#202820] hover:text-[#18392B] transition whitespace-nowrap shrink-0"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-[#18392B] hover:bg-[#23523E] text-[#FAF9F6] text-xs font-medium rounded-lg transition shadow-xs whitespace-nowrap shrink-0"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-[#E7E8E1] text-[#202820] hover:bg-[#FAF9F6]"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E7E8E1] bg-white px-4 pt-3 pb-5 space-y-2">
          <Link
            to="/explore"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-[#202820]"
          >
            Explore Gigs
          </Link>
          <Link
            to="/talent"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-[#202820]"
          >
            Find Talent
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-[#202820]"
              >
                Dashboard
              </Link>
              <Link
                to="/create"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-[#18392B]"
              >
                + Post a Gig
              </Link>
              <Link
                to="/my-gigs"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-[#202820]"
              >
                My Gigs
              </Link>
              <Link
                to="/my-applications"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-[#202820]"
              >
                My Applications
              </Link>
              <Link
                to={`/profile/${currentUser?.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-[#202820]"
              >
                My Profile ({currentUser?.name})
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-sm font-medium text-[#C77755]"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-2 border-t border-[#E7E8E1] flex gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 text-center text-xs font-medium border border-[#E7E8E1] rounded-lg text-[#202820]"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 text-center text-xs font-medium bg-[#18392B] text-white rounded-lg"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
