import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { ToastContainer } from './components/Toast.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { ExploreGigs } from './pages/ExploreGigs.tsx';
import { GigDetails } from './pages/GigDetails.tsx';
import { CreateGig } from './pages/CreateGig.tsx';
import { MyGigs } from './pages/MyGigs.tsx';
import { MyApplications } from './pages/MyApplications.tsx';
import { StudentProfile } from './pages/StudentProfile.tsx';
import { Login } from './pages/Login.tsx';
import { SignUp } from './pages/SignUp.tsx';
import { DiscoverTalent } from './pages/DiscoverTalent.tsx';
import { GraduationCap } from 'lucide-react';

function AppLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#202820] flex flex-col font-sans antialiased selection:bg-[#18392B] selection:text-[#FAF9F6]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/explore" element={<ExploreGigs />} />
          <Route path="/talent" element={<DiscoverTalent />} />
          <Route path="/gigs/:id" element={<GigDetails />} />

          {/* Protected Student Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <CreateGig />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-gigs"
            element={
              <ProtectedRoute>
                <MyGigs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-applications"
            element={
              <ProtectedRoute>
                <MyApplications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:id"
            element={<StudentProfile />}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Production Editorial Footer */}
      <footer className="mt-auto bg-white border-t border-[#E7E8E1] py-10 text-xs text-[#72766F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-[#E7E8E1]">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-[#18392B] text-[#FAF9F6] flex items-center justify-center font-bold text-xs">
                  <GraduationCap className="w-3.5 h-3.5 text-[#A8B8A0]" />
                </div>
                <span className="font-serif text-base font-medium text-[#202820]">CampusConnect</span>
              </div>
              <p className="text-[11px] text-[#72766F] max-w-md">
                The university student freelancing, peer tutoring, and skill-exchange portal.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-[#202820]">
              <Link to="/explore" className="hover:text-[#18392B] transition">Explore Gigs</Link>
              <Link to="/create" className="hover:text-[#18392B] transition">Post a Gig</Link>
              {isAuthenticated ? (
                <Link to="/dashboard" className="hover:text-[#18392B] transition">Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="hover:text-[#18392B] transition">Sign In</Link>
                  <Link to="/signup" className="hover:text-[#18392B] transition">Get Started</Link>
                </>
              )}
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#72766F]">
            <div>
              © {new Date().getFullYear()} CampusConnect. All campus rights reserved.
            </div>
            <div className="flex items-center space-x-4">
              <span className="hover:text-[#202820] cursor-pointer">Academic Honor Code</span>
              <span className="hover:text-[#202820] cursor-pointer">Community Standards</span>
              <span className="hover:text-[#202820] cursor-pointer">Privacy Policy</span>
            </div>
          </div>
        </div>
      </footer>

      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
