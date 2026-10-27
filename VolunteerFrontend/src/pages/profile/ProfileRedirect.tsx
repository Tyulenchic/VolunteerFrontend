import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/** Старый адрес /profile: ведёт на личную страницу /users/{мой id}. */
export function ProfileRedirect() {
  const { user } = useAuth();
  return user ? <Navigate to={`/users/${user.id}`} replace /> : null;
}
