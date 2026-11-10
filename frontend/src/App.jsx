import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Background3D from './components/common/Background3D';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import QuizCreatorPage from './pages/QuizCreatorPage';
import HostGamePage from './pages/HostGamePage';
import PlayGamePage from './pages/PlayGamePage';
import PracticePage from './pages/PracticePage';
import TournamentsPage from './pages/TournamentsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ExplorePage from './pages/ExplorePage';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <div className="text-center py-32 text-slate-400">Loading your profile...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === 'teacher') return <Navigate to="/teacher" replace />;
    if (role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/student" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GameProvider>
          <div className="relative min-h-screen flex flex-col bg-background text-slate-100">
            <Background3D />
            <Navbar />
            <main className="flex-1 relative z-10">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/tournaments" element={<TournamentsPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/practice/:id" element={<PracticePage />} />
                <Route path="/play" element={<PlayGamePage />} />

                {/* Role Protected Routes */}
                <Route
                  path="/student"
                  element={
                    <ProtectedRoute allowedRoles={['student', 'admin']}>
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher"
                  element={
                    <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                      <TeacherDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/create-quiz"
                  element={
                    <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                      <QuizCreatorPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/host"
                  element={
                    <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                      <HostGamePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </GameProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

