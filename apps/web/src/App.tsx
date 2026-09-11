import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import CasesPage from './pages/CasesPage';
import CaseCreatePage from './pages/CaseCreatePage';
import CaseDetailPage from './pages/CaseDetailPage';
import RulingDetailPage from './pages/RulingDetailPage';
import NewsPage from './pages/NewsPage';
import TemplatesPage from './pages/TemplatesPage';
import GoogleCallbackPage from './pages/GoogleCallbackPage';
import MainLayout from './components/layout/MainLayout';

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname, search]);
  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="cases" element={<CasesPage />} />
          <Route path="cases/new" element={<CaseCreatePage />} />
          <Route path="cases/:id" element={<CaseDetailPage />} />
          <Route path="rulings/:id" element={<RulingDetailPage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="integrations/google/callback" element={<GoogleCallbackPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
