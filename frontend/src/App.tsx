import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AlertDetail from './pages/AlertDetail';
import AdminPanel from './pages/Admin';
import PublicView from './pages/Public';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Cargando Freddy Hg…</div>;
  }

  return (
    <Routes>
      <Route path="/public" element={<PublicView />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
      <Route path="/alert/:id" element={user ? <AlertDetail /> : <Navigate to="/login" replace />} />
      <Route path="/admin" element={user ? <AdminPanel /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
