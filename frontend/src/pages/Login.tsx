/**
 * ☿ FREDDY Hg — Login
 * Spec: FRONTEND_SPEC_COMPLETO.md § Pantalla 1.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconMail, IconLock, IconEye, IconEyeOff, IconAlertTriangle } from '@tabler/icons-react';
import Wordmark from '../components/brand/Wordmark';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Input';
import { supabase } from '../supabaseClient';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (signInError) {
      setError(
        signInError.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos. Verifica tus datos.'
          : signInError.message,
      );
      return;
    }
    navigate('/dashboard', { replace: true });
  };

  return (
    <main className="auth-shell">
      <div className="auth-shell__content">
        <div className="auth-shell__brand">
          <Wordmark variant="large" />
          <div className="auth-shell__tagline">Sistema de Alerta Temprana Satelital</div>
        </div>

        {error && (
          <div
            className="alert-box alert-box--critical"
            style={{ width: '100%' }}
            role="alert"
          >
            <span className="alert-box__icon">
              <IconAlertTriangle size={16} stroke={1.5} />
            </span>
            <div className="alert-box__content">{error}</div>
          </div>
        )}

        <div className="auth-card">
          <h1 className="auth-card__title">Iniciar sesión</h1>

          <form onSubmit={handleSubmit} noValidate>
            <Field label="Correo electrónico">
              <Input
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="correo@corpoamazonia.gov.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                iconLeft={<IconMail size={16} stroke={1.5} />}
              />
            </Field>

            <Field label="Contraseña">
              <Input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                iconLeft={<IconLock size={16} stroke={1.5} />}
                iconRight={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'inline-flex',
                    }}
                  >
                    {showPassword ? (
                      <IconEyeOff size={16} stroke={1.5} />
                    ) : (
                      <IconEye size={16} stroke={1.5} />
                    )}
                  </button>
                }
              />
            </Field>

            <button type="button" className="auth-card__forgot">
              ¿Olvidaste tu contraseña?
            </button>

            <Button type="submit" variant="primary" block loading={loading}>
              {loading ? 'Verificando' : 'Iniciar sesión'}
            </Button>

            <div className="auth-card__divider">
              <span>o</span>
            </div>

            <Link to="/public" className="auth-card__public-link">
              Acceso público para periodistas →
            </Link>
          </form>
        </div>

        <div className="auth-footer">
          Freddy Hg · 2026 · github.com/ByZocar/Freddy-Hg
        </div>
      </div>
    </main>
  );
}
