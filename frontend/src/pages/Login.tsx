import { FormEvent, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'credentials' | 'totp'>('credentials');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      // Comprobar si hay un factor TOTP enrolado y verificado
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.find((f) => f.status === 'verified');
      if (totp) {
        const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: totp.id });
        if (cErr) throw cErr;
        setFactorId(totp.id);
        setChallengeId(challenge!.id);
        setStep('totp');
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err.message ?? 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  async function handleTotp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: factorId!,
        challengeId: challengeId!,
        code: otpCode,
      });
      if (vErr) throw vErr;
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message ?? 'Código inválido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login">
      <div className="login-card">
        <h1>☿ Freddy Hg</h1>
        <p className="tagline">Acceso autorizado para CARs, ONGs y Fiscalía</p>

        {step === 'credentials' && (
          <form onSubmit={handleSubmit}>
            <label>
              Correo institucional
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              Contraseña
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={loading}>
              {loading ? 'Iniciando…' : 'Iniciar sesión'}
            </button>
          </form>
        )}

        {step === 'totp' && (
          <form onSubmit={handleTotp}>
            <p>Ingresa el código de 6 dígitos de Google Authenticator.</p>
            <label>
              Código TOTP
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
              />
            </label>
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={loading}>
              Verificar
            </button>
          </form>
        )}

        <p className="footer-note">
          <a href="/public">Acceder a la vista pública (sin login)</a>
        </p>
      </div>
    </div>
  );
}
