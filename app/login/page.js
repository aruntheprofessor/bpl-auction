'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { callApi } from '@/lib/api';

// Auctioneer password page.
export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await callApi('/api/login', 'POST', { password });
      router.push('/auction');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <main className="center-screen">
      <form className="login-card" onSubmit={submit}>
        <h1>Auctioneer login</h1>
        <p className="muted">Enter the password to open the auction screen and admin pages.</p>
        <input
          type="password"
          className="input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {error ? <div className="error-text">{error}</div> : null}
        <button className="btn btn-primary btn-big" disabled={busy || !password}>
          {busy ? 'Checking…' : 'Log in'}
        </button>
      </form>
    </main>
  );
}
