import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Layout } from './components/Layout';
import { AdminLayout } from './pages/admin/AdminLayout';
import { ProtectedRoute, AdminRoute, GuestRoute } from './components/ProtectedRoute';

import { HomePage }              from './pages/home/HomePage';
import { NewsPage }              from './pages/news/NewsPage';
import { NewsDetailPage }        from './pages/news/NewsDetailPage';
import { EventsPage }            from './pages/events/EventsPage';
import { EventDetailPage }       from './pages/events/EventDetailPage';
import { OrganizationsPage }     from './pages/organizations/OrganizationsPage';
import { OrganizersPage }        from './pages/organizers/OrganizersPage';
import { VolunteersPage }        from './pages/volunteers/VolunteersPage';
import { AboutPage }             from './pages/about/AboutPage';
import { FaqPage }               from './pages/faq/FaqPage';
import { SiteRulesPage }         from './pages/rules/SiteRulesPage';
import { PrivacyPolicyPage }     from './pages/privacy/PrivacyPolicyPage';
import { LoginPage }             from './pages/auth/LoginPage';
import { RegisterPage }          from './pages/auth/RegisterPage';
import { ForgotPasswordPage }    from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage }     from './pages/auth/ResetPasswordPage';
import { ProfilePage }           from './pages/profile/ProfilePage';
import { AdminDashboard }        from './pages/admin/AdminDashboard';
import { AdminUsersPage }        from './pages/admin/AdminUsersPage';
import { AdminEventsPage }       from './pages/admin/AdminEventsPage';
import { AdminParticipationsPage } from './pages/admin/AdminParticipationsPage';
import { AdminNewsPage }         from './pages/admin/AdminNewsPage';
import { AdminAnalyticsPage }    from './pages/admin/AdminAnalyticsPage';
import { AdminAuditLogPage }     from './pages/admin/AdminAuditLogPage';
import { Link } from 'react-router-dom';

function WL({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>;
}
function WAL({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
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

export default function App() {
  return (
      <HashRouter>
      <NotificationProvider>
        <AuthProvider>
          <Routes>
            {/* ── Auth standalone (no navbar/footer) ─────────── */}
            <Route element={<GuestRoute />}>
              <Route path="/login"           element={<LoginPage />} />
              <Route path="/register"        element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Route>
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* ── Public pages ────────────────────────────────── */}
            <Route path="/"              element={<WL><HomePage /></WL>} />
            <Route path="/news"          element={<WL><NewsPage /></WL>} />
            <Route path="/news/:id"      element={<WL><NewsDetailPage /></WL>} />
            <Route path="/events"        element={<WL><EventsPage /></WL>} />
            <Route path="/events/:id"    element={<WL><EventDetailPage /></WL>} />
            <Route path="/organizations" element={<WL><OrganizationsPage /></WL>} />
            <Route path="/organizers"    element={<WL><OrganizersPage /></WL>} />
            <Route path="/volunteers"    element={<WL><VolunteersPage /></WL>} />
            <Route path="/about"         element={<WL><AboutPage /></WL>} />
            <Route path="/faq"           element={<WL><FaqPage /></WL>} />
            <Route path="/rules"         element={<WL><SiteRulesPage /></WL>} />
            <Route path="/privacy"       element={<WL><PrivacyPolicyPage /></WL>} />

            {/* ── Volunteer-protected ─────────────────────────── */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<WL><ProfilePage /></WL>} />
            </Route>

            {/* ── Admin panel ─────────────────────────────────── */}
            <Route element={<AdminRoute />}>
              <Route path="/admin"                 element={<WAL><AdminDashboard /></WAL>} />
              <Route path="/admin/users"           element={<WAL><AdminUsersPage /></WAL>} />
              <Route path="/admin/events"          element={<WAL><AdminEventsPage /></WAL>} />
              <Route path="/admin/news"            element={<WAL><AdminNewsPage /></WAL>} />
              <Route path="/admin/participations"  element={<WAL><AdminParticipationsPage /></WAL>} />
              <Route path="/admin/analytics"       element={<WAL><AdminAnalyticsPage /></WAL>} />
              <Route path="/admin/audit-log"       element={<WAL><AdminAuditLogPage /></WAL>} />
            </Route>

            {/* ── 404 ─────────────────────────────────────────── */}
            <Route path="*" element={<WL><NotFound /></WL>} />
          </Routes>
        </AuthProvider>
      </NotificationProvider>
      </HashRouter>
  );
}
