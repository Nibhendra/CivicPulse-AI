import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppShell from '@/components/layout/AppShell';
import LoginPage from '@/pages/LoginPage';
import HomePage from '@/pages/HomePage';
import ReportIssuePage from '@/pages/ReportIssuePage';
import MapPage from '@/pages/MapPage';
import MyIssuesPage from '@/pages/MyIssuesPage';
import LeaderboardPage from '@/pages/LeaderboardPage';
import ProfilePage from '@/pages/ProfilePage';
import NotFoundPage from '@/pages/NotFoundPage';
import IssueDetailPage from '@/pages/IssueDetailPage';
import AuthorityDashboard from '@/pages/AuthorityDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes with app shell layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="/report" element={<ReportIssuePage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/my-issues" element={<MyIssuesPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/issue/:id" element={<IssueDetailPage />} />
              <Route path="/authority" element={<AuthorityDashboard />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
