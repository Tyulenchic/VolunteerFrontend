import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './Spinner';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center p-20"><Spinner /></div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
export function AdminRoute() {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="flex justify-center p-20"><Spinner /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return isAdmin ? <Outlet /> : <Navigate to="/profile" replace />;
}
export function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center p-20"><Spinner /></div>;
  return user ? <Navigate to="/profile" replace /> : <Outlet />;
}
