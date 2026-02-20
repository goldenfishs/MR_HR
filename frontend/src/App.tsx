import { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import InterviewerRoute from './components/common/InterviewerRoute';
import MainLayout from './components/layout/MainLayout';
import PublicLayout from './components/layout/PublicLayout';

// Lazy load pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));

const HomePage = lazy(() => import('./pages/user/HomePage'));
const InterviewDetailPage = lazy(() => import('./pages/user/InterviewDetailPage'));
const MyRegistrationsPage = lazy(() => import('./pages/user/MyRegistrationsPage'));
const QuestionsPage = lazy(() => import('./pages/user/QuestionsPage'));
const ResourcesPage = lazy(() => import('./pages/user/ResourcesPage'));
const ProfilePage = lazy(() => import('./pages/user/ProfilePage'));

const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminInterviewsPage = lazy(() => import('./pages/admin/AdminInterviewsPage'));
const AdminInterviewFormPage = lazy(() => import('./pages/admin/AdminInterviewFormPage'));
const AdminRegistrationsPage = lazy(() => import('./pages/admin/AdminRegistrationsPage'));
const AdminQuestionsPage = lazy(() => import('./pages/admin/AdminQuestionsPage'));
const AdminClassroomsPage = lazy(() => import('./pages/admin/AdminClassroomsPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));

const InterviewerDashboardPage = lazy(() => import('./pages/interviewer/InterviewerDashboardPage'));
const InterviewerSlotsPage = lazy(() => import('./pages/interviewer/InterviewerSlotsPage'));
const InterviewerScoringPage = lazy(() => import('./pages/interviewer/InterviewerScoringPage'));

// Loading component - 使用简单的骨架屏样式
const PageLoading = () => (
  <div className="page-loading">
    <div className="skeleton-header" />
    <div className="skeleton-content">
      <div className="skeleton-card" />
      <div className="skeleton-card" />
      <div className="skeleton-card" />
    </div>
  </div>
);

// Avoid flashing loading UI for near-instant route transitions
function DelayedPageLoading({ delay = 180 }: { delay?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(true);
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [delay]);

  if (!visible) {
    return <div className="suspense-placeholder" />;
  }

  return <PageLoading />;
}

// Auto-scroll to top on route change with smooth transition
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 平滑滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
}

function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
    
    // 预加载常用页面（在空闲时）
    const preloadPages = () => {
      // 延迟预加载，避免影响首屏性能
      setTimeout(() => {
        import('./pages/user/HomePage');
        import('./pages/admin/AdminDashboardPage');
        import('./pages/admin/AdminInterviewsPage');
        import('./pages/admin/AdminRegistrationsPage');
      }, 1000);
    };
    
    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadPages);
    } else {
      preloadPages();
    }
  }, [initialize]);

  return (
    <div className="app-container">
      <Suspense fallback={<DelayedPageLoading />}>
        <ScrollToTop />
        <Routes>
        {/* Public routes */}
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Protected routes - User */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/interviews" element={<HomePage />} />
            <Route path="/interviews/:id" element={<InterviewDetailPage />} />
            <Route path="/my-registrations" element={<MyRegistrationsPage />} />
            <Route path="/questions" element={<QuestionsPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Admin routes */}
        <Route element={<AdminRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/interviews" element={<AdminInterviewsPage />} />
            <Route path="/admin/interviews/create" element={<AdminInterviewFormPage />} />
            <Route path="/admin/interviews/:id/edit" element={<AdminInterviewFormPage />} />
            <Route path="/admin/registrations" element={<AdminRegistrationsPage />} />
            <Route path="/admin/registrations/:id" element={<AdminRegistrationsPage />} />
            <Route path="/admin/questions" element={<AdminQuestionsPage />} />
            <Route path="/admin/classrooms" element={<AdminClassroomsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>
        </Route>

        {/* Interviewer routes */}
        <Route element={<InterviewerRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/interviewer" element={<InterviewerDashboardPage />} />
            <Route path="/interviewer/slots" element={<InterviewerSlotsPage />} />
            <Route path="/interviewer/registrations/:id/score" element={<InterviewerScoringPage />} />
          </Route>
        </Route>

        {/* Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  </div>
  );
}

export default App;
