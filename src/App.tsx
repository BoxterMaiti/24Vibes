import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import HomePage from './pages/HomePage';
import CreateCardPage from './pages/CreateCardPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import OnboardingPage from './pages/OnboardingPage';
import ManagePeoplePage from './pages/ManagePeoplePage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { EmojiMenuProvider } from './contexts/EmojiMenuContext';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

// Admin route component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading, isAdmin } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
};

// Onboarding check component
const OnboardingCheck = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // Skip onboarding check for these paths
  const skipPaths = ['/onboarding', '/login'];
  if (skipPaths.includes(location.pathname)) {
    return <>{children}</>;
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (currentUser?.email?.endsWith('@24slides.com') && !currentUser.onboardingCompleted) {
    return <Navigate to="/onboarding" />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <OnboardingCheck>
              <HomePage />
            </OnboardingCheck>
          </ProtectedRoute>
        } />
        <Route path="/create" element={
          <ProtectedRoute>
            <OnboardingCheck>
              <CreateCardPage />
            </OnboardingCheck>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <OnboardingCheck>
              <ProfilePage />
            </OnboardingCheck>
          </ProtectedRoute>
        } />
        <Route path="/manage-people" element={
          <AdminRoute>
            <OnboardingCheck>
              <ManagePeoplePage />
            </OnboardingCheck>
          </AdminRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <EmojiMenuProvider>
          <AppRoutes />
        </EmojiMenuProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;