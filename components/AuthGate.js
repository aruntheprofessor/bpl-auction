'use client';
// Wrap a page with this and only the logged-in auctioneer can see it.
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthGate({ children }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    fetch('/api/auth', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => (j.ok ? setOk(true) : router.replace('/login')))
      .catch(() => router.replace('/login'));
  }, [router]);

  if (!ok) {
    return (
      <div className="center-screen">
        <p className="muted">Checking password…</p>
      </div>
    );
  }
  return children;
}
