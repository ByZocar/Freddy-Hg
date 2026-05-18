/**
 * ☿ FREDDY Hg — App router
 * Spec: FRONTEND_SPEC_COMPLETO.md (todas las pantallas).
 */
import { Navigate, Route, Routes } from 'react-router-dom';
import Wordmark from './components/brand/Wordmark';
import { ToastProvider } from './hooks/useToast';
import { useAuth } from './hooks/useAuth';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AlertDetail from './pages/AlertDetail';
import AdminPanel from './pages/Admin';
import PublicView from './pages/Public';
import Settings from './pages/Settings';
import Accuracy from './pages/docs/Accuracy';
import PublicPolicy from './pages/docs/PublicPolicy';

function AppLoading() {
  return (
    <div className="app-loading">
      <Wordmark variant="large" />
      <div className="app-loading__text">Cargando…</div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <AppLoading />;
  }

  return (
    <ToastProvider>
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Landing />} />
        <Route path="/public" element={<PublicView />} />
        <Route path="/docs/accuracy" element={<Accuracy />} />
        <Route path="/docs/public-policy" element={<PublicPolicy />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />

        {/* Privadas */}
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/alert/:id"
          element={user ? <AlertDetail /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin"
          element={user ? <AdminPanel /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/settings"
          element={user ? <Settings /> : <Navigate to="/login" replace />}
        />

        {/* Default — 404 a la landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}
