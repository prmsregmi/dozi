import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { initApiClient } from '@dozi/api-client';
import HomePage from './pages/HomePage';
import SessionPage from './pages/SessionPage';
import SettingsPage from './pages/SettingsPage';
import ConversationSummaryPage from './pages/ConversationSummaryPage';
import LoginPage from './pages/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import PickleCoachOnboardingPage from './pages/PickleCoachOnboardingPage';
import CameraPlaceholderPage from './pages/CameraPlaceholderPage';
import ProtectedRoute from './components/ProtectedRoute';
import { supabase } from './lib/supabase';

// Initialize API client with auth before any component renders
initApiClient(supabase);

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/onboarding" element={<PickleCoachOnboardingPage />} />
        <Route path="/camera" element={<CameraPlaceholderPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/session/:conversationId"
          element={
            <ProtectedRoute>
              <SessionPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/conversations/:id"
          element={
            <ProtectedRoute>
              <ConversationSummaryPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
