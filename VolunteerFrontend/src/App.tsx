import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Navigate, Routes, Route } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { FeedbackProvider } from './context/FeedbackContext';
import { Layout } from './components/Layout';
import { Spinner } from './components/Spinner';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AfishaLayout } from './components/afisha/AfishaLayout';
import { ProtectedRoute, AdminRoute, GuestRoute, OrganizerRoute } from './components/ProtectedRoute';
import { SiteContentProvider } from './context/SiteContentContext';

import { Link } from 'react-router-dom';


// Страницы грузятся по требованию: первый заход скачивает только каркас, а не весь сайт и админку целиком.
const OrganizerDashboard = lazy(() => import('./pages/organizer/OrganizerDashboard').then(m => ({ default: m.OrganizerDashboard })));
const OrganizerApplicationsPage = lazy(() => import('./pages/organizer/OrganizerApplicationsPage').then(m => ({ default: m.OrganizerApplicationsPage })));
const OrganizerParticipationsPage = lazy(() => import('./pages/organizer/OrganizerParticipationsPage').then(m => ({ default: m.OrganizerParticipationsPage })));
const OrganizerEventsPage = lazy(() => import('./pages/organizer/OrganizerEventsPage').then(m => ({ default: m.OrganizerEventsPage })));
const OrganizerPostsPage = lazy(() => import('./pages/organizer/OrganizerPostsPage').then(m => ({ default: m.OrganizerPostsPage })));
const OrganizerVideosPage = lazy(() => import('./pages/organizer/OrganizerVideosPage').then(m => ({ default: m.OrganizerVideosPage })));
const OrganizerOrganizationsPage = lazy(() => import('./pages/organizer/OrganizerOrganizationPage').then(m => ({ default: m.OrganizerOrganizationsPage })));
const OrganizerOrganizationPage = lazy(() => import('./pages/organizer/OrganizerOrganizationPage').then(m => ({ default: m.OrganizerOrganizationPage })));
const AdminOrganizationsPage = lazy(() => import('./pages/admin/AdminOrganizationsPage').then(m => ({ default: m.AdminOrganizationsPage })));
const AdminModerationPage = lazy(() => import('./pages/admin/AdminModerationPage').then(m => ({ default: m.AdminModerationPage })));
const AdminFeedbackPage = lazy(() => import('./pages/admin/AdminFeedbackPage').then(m => ({ default: m.AdminFeedbackPage })));
const AdminContentPage = lazy(() => import('./pages/admin/AdminContentPage').then(m => ({ default: m.AdminContentPage })));
const HomePage = lazy(() => import('./pages/home/HomePage').then(m => ({ default: m.HomePage })));
const NewsPage = lazy(() => import('./pages/news/NewsPage').then(m => ({ default: m.NewsPage })));
const NewsDetailPage = lazy(() => import('./pages/news/NewsDetailPage').then(m => ({ default: m.NewsDetailPage })));
const EventsPage = lazy(() => import('./pages/events/EventsPage').then(m => ({ default: m.EventsPage })));
const EventDetailPage = lazy(() => import('./pages/events/EventDetailPage').then(m => ({ default: m.EventDetailPage })));
const OrganizationsPage = lazy(() => import('./pages/organizations/OrganizationsPage').then(m => ({ default: m.OrganizationsPage })));
const OrganizationFeedPage = lazy(() => import('./pages/organizations/OrganizationFeedPage').then(m => ({ default: m.OrganizationFeedPage })));
const VideosPage = lazy(() => import('./pages/videos/VideosPage').then(m => ({ default: m.VideosPage })));
const OrganizationDetailPage = lazy(() => import('./pages/organizations/OrganizationDetailPage').then(m => ({ default: m.OrganizationDetailPage })));
const OrganizersPage = lazy(() => import('./pages/organizers/OrganizersPage').then(m => ({ default: m.OrganizersPage })));
const VolunteersPage = lazy(() => import('./pages/volunteers/VolunteersPage').then(m => ({ default: m.VolunteersPage })));
const AboutPage = lazy(() => import('./pages/about/AboutPage').then(m => ({ default: m.AboutPage })));
const FaqPage = lazy(() => import('./pages/faq/FaqPage').then(m => ({ default: m.FaqPage })));
const SiteRulesPage = lazy(() => import('./pages/rules/SiteRulesPage').then(m => ({ default: m.SiteRulesPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/privacy/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const ConfirmEmailPage = lazy(() => import('./pages/auth/ConfirmEmailPage').then(m => ({ default: m.ConfirmEmailPage })));
const ResendConfirmationPage = lazy(() => import('./pages/auth/ResendConfirmationPage').then(m => ({ default: m.ResendConfirmationPage })));
const UserProfilePage = lazy(() => import('./pages/profile/UserProfilePage').then(m => ({ default: m.UserProfilePage })));
const ProfileRedirect = lazy(() => import('./pages/profile/ProfileRedirect').then(m => ({ default: m.ProfileRedirect })));
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
const AdminEventsPage = lazy(() => import('./pages/admin/AdminEventsPage').then(m => ({ default: m.AdminEventsPage })));
const AdminParticipationsPage = lazy(() => import('./pages/admin/AdminParticipationsPage').then(m => ({ default: m.AdminParticipationsPage })));
const AdminNewsPage = lazy(() => import('./pages/admin/AdminNewsPage').then(m => ({ default: m.AdminNewsPage })));
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage').then(m => ({ default: m.AdminAnalyticsPage })));
const AdminAuditLogPage = lazy(() => import('./pages/admin/AdminAuditLogPage').then(m => ({ default: m.AdminAuditLogPage })));
const MyFeedPage = lazy(() => import('./pages/feed/MyFeedPage').then(m => ({ default: m.MyFeedPage })));
const AdminVideoLinksPage = lazy(() => import('./pages/admin/AdminVideoLinksPage').then(m => ({ default: m.AdminVideoLinksPage })));

function PageFallback() {
  return <div className="min-h-[60vh] flex items-center justify-center"><Spinner /></div>;
}

function WL({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>;
}
function WAL({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}

function WOL({ children }: { children: React.ReactNode }) {
  return <AdminLayout variant="organizer">{children}</AdminLayout>;
}

function NotFound() {
  return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-8xl font-bold text-primary/20 mb-4">404</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Страница не найдена
        </h1>
        <p className="text-gray-600 mb-8 max-w-md">
          К сожалению, запрашиваемая страница не существует.
        </p>

        <Link
            to="/"
            className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition shadow-lg"
            style={{ textDecoration: 'none' }}
        >
          <i className="fas fa-home mr-2" />
          На главную
        </Link>
      </div>
  );
}

// Компонент для прокрутки в верх при смене маршрута
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
      <HashRouter>
      <ScrollToTop />
      <NotificationProvider>
        <FeedbackProvider>
        <AuthProvider>
        <SiteContentProvider>
          <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* ── Auth standalone (no navbar/footer) ─────────── */}
            <Route element={<GuestRoute />}>
              <Route path="/login"           element={<LoginPage />} />
              <Route path="/register"        element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Route>
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/confirm-email"  element={<ConfirmEmailPage />} />
            <Route path="/resend-confirmation" element={<ResendConfirmationPage />} />

            {/* ── Public pages ────────────────────────────────── */}
            <Route path="/"              element={<AfishaLayout><HomePage /></AfishaLayout>} />
            <Route path="/news"          element={<WL><NewsPage /></WL>} />
            <Route path="/news/:id"      element={<WL><NewsDetailPage /></WL>} />
            <Route path="/events"        element={<AfishaLayout><EventsPage /></AfishaLayout>} />
            <Route path="/events/:id"    element={<WL><EventDetailPage /></WL>} />
            <Route path="/organizations" element={<WL><OrganizationsPage /></WL>} />
            <Route path="/organizations-feed" element={<WL><OrganizationFeedPage /></WL>} />
            <Route path="/videos" element={<AfishaLayout><VideosPage /></AfishaLayout>} />
            {/* Прежний адрес «Как это было» ведёт на страницу видео. */}
            <Route path="/events-past" element={<Navigate to="/videos" replace />} />
            <Route path="/organizers"    element={<WL><OrganizersPage /></WL>} />
            <Route path="/volunteers"    element={<WL><VolunteersPage /></WL>} />
            <Route path="/users/:id"     element={<WL><UserProfilePage /></WL>} />
            <Route path="/about"         element={<WL><AboutPage /></WL>} />
            <Route path="/faq"           element={<WL><FaqPage /></WL>} />
            <Route path="/rules"         element={<WL><SiteRulesPage /></WL>} />
            <Route path="/privacy"       element={<WL><PrivacyPolicyPage /></WL>} />
              <Route path="/organizations/:id" element={<WL><OrganizationDetailPage /></WL>} />

            {/* ── Volunteer-protected ─────────────────────────── */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<WL><ProfileRedirect /></WL>} />
                <Route path="/feed" element={<WL><MyFeedPage /></WL>} />
                <Route path="/notifications" element={<WL><NotificationsPage /></WL>} />
            </Route>

            {/* ── Кабинет организатора (организатор или администратор) ── */}
            <Route element={<OrganizerRoute />}>
              <Route path="/organizer"                 element={<WOL><OrganizerDashboard /></WOL>} />
              <Route path="/organizer/applications"   element={<WOL><OrganizerApplicationsPage /></WOL>} />
              <Route path="/organizer/participations" element={<WOL><OrganizerParticipationsPage /></WOL>} />
              <Route path="/organizer/events"         element={<WOL><OrganizerEventsPage /></WOL>} />
              <Route path="/organizer/posts"          element={<WOL><OrganizerPostsPage /></WOL>} />
              <Route path="/organizer/videos"         element={<WOL><OrganizerVideosPage /></WOL>} />
              <Route path="/organizer/organizations" element={<WOL><OrganizerOrganizationsPage /></WOL>} />
              <Route path="/organizer/organizations/:id" element={<WOL><OrganizerOrganizationPage /></WOL>} />
            </Route>

            {/* ── Admin panel ─────────────────────────────────── */}
            <Route element={<AdminRoute />}>
              <Route path="/admin"                 element={<WAL><AdminDashboard /></WAL>} />
              <Route path="/admin/users"           element={<WAL><AdminUsersPage /></WAL>} />
              <Route path="/admin/organizations"   element={<WAL><AdminOrganizationsPage /></WAL>} />
              <Route path="/admin/moderation"      element={<WAL><AdminModerationPage /></WAL>} />
              <Route path="/admin/feedback"        element={<WAL><AdminFeedbackPage /></WAL>} />
              <Route path="/admin/content"         element={<WAL><AdminContentPage /></WAL>} />
              <Route path="/admin/events"          element={<WAL><AdminEventsPage /></WAL>} />
              <Route path="/admin/news"            element={<WAL><AdminNewsPage /></WAL>} />
              <Route path="/admin/participations"  element={<WAL><AdminParticipationsPage /></WAL>} />
              <Route path="/admin/videos"          element={<WAL><AdminVideoLinksPage /></WAL>} />
              <Route path="/admin/analytics"       element={<WAL><AdminAnalyticsPage /></WAL>} />
              <Route path="/admin/audit-log"       element={<WAL><AdminAuditLogPage /></WAL>} />
            </Route>

            {/* ── 404 ─────────────────────────────────────────── */}
            <Route path="*" element={<WL><NotFound /></WL>} />
          </Routes>
          </Suspense>
        </SiteContentProvider>
        </AuthProvider>
        </FeedbackProvider>
      </NotificationProvider>
      </HashRouter>
  );
}
