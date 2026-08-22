import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage.jsx';
import { TasksPage } from './pages/TasksPage.jsx';
import { TaskDetailPage } from './pages/TaskDetailPage.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/tasks"
        element={<ProtectedRoute><TasksPage /></ProtectedRoute>}
      />
      <Route
        path="/tasks/:id"
        element={<ProtectedRoute><TaskDetailPage /></ProtectedRoute>}
      />
      <Route path="*" element={<Navigate to="/tasks" replace />} />
    </Routes>
  );
}
