import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

interface Organization {
  id: string;
  name: string;
  type: string;
}

export default function AdminPanel() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [phone, setPhone] = useState('');
  const [orgId, setOrgId] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/organizations`)
      .then((r) => r.json())
      .then((d) => setOrgs(d.organizations ?? []))
      .catch(() => setOrgs([]));
  }, []);

  async function handleAddRecipient(e: FormEvent) {
    e.preventDefault();
    const r = await fetch(`${BACKEND_URL}/api/recipients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organization_id: orgId, phone_number: phone, basin_ids: [] }),
    });
    if (r.ok) {
      setMessage('✅ Destinatario añadido (hash registrado, número nunca almacenado en claro).');
      setPhone('');
    } else {
      setMessage('⚠️ Error al añadir destinatario.');
    }
  }

  return (
    <div className="admin">
      <header className="topbar">
        <div className="brand">☿ Freddy Hg — Admin</div>
        <nav>
          <Link to="/dashboard">Mapa</Link>
        </nav>
      </header>

      <section className="card">
        <h2>Añadir destinatario WhatsApp</h2>
        <p>
          El número se hashea (SHA-256) antes de almacenarse. El número en claro
          nunca toca la base de datos.
        </p>
        <form onSubmit={handleAddRecipient}>
          <label>
            Organización
            <select value={orgId} onChange={(e) => setOrgId(e.target.value)} required>
              <option value="">— elige —</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.type})
                </option>
              ))}
            </select>
          </label>
          <label>
            Teléfono (formato internacional)
            <input
              type="tel"
              placeholder="+573153350984"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </label>
          <button type="submit">Añadir</button>
        </form>
        {message && <div className="info">{message}</div>}
      </section>

      <section className="card">
        <h2>Organizaciones registradas</h2>
        <ul>
          {orgs.map((o) => (
            <li key={o.id}>
              <strong>{o.name}</strong> — {o.type}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
