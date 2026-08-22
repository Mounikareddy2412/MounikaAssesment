import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}
