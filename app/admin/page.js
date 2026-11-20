'use client';
// ADMIN: add and edit categories, teams, players and settings.
import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import AuthGate from '@/components/AuthGate';
import { useAuctionData } from '@/lib/useAuctionData';
import CategoriesTab from '@/components/admin/CategoriesTab';
import TeamsTab from '@/components/admin/TeamsTab';
import PlayersTab from '@/components/admin/PlayersTab';
import SettingsTab from '@/components/admin/SettingsTab';

const TABS = [
  ['categories', 'Categories'],
  ['teams', 'Teams'],
  ['players', 'Players'],
  ['settings', 'Settings'],
];

export default function AdminPage() {
  return (
    <AuthGate>
      <Admin />
    </AuthGate>
  );
}

function Admin() {
  const { data, error, reload } = useAuctionData();
  const [tab, setTab] = useState('categories');
  const [notice, setNotice] = useState(null);
  const timer = useRef(null);

  const notify = useCallback((text, bad = false) => {
    setNotice({ text, bad });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(null), 4500);
  }, []);

  if (!data) {
    return (
      <main className="center-screen">
        <p className="muted">{error || 'Loading…'}</p>
      </main>
    );
  }

  const props = { data, onChanged: reload, notify };

  return (
    <main className="admin">
      <header className="control-head">
        <div className="brand">Admin</div>
        <div className="head-actions">
          <Link className="btn btn-sm btn-primary" href="/auction">
            Go to the auction screen
          </Link>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map(([id, label]) => (
          <button key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>

      {notice ? <div className={`banner ${notice.bad ? 'bad' : 'good'}`}>{notice.text}</div> : null}

      <div className="admin-body">
        {tab === 'categories' ? <CategoriesTab {...props} /> : null}
        {tab === 'teams' ? <TeamsTab {...props} /> : null}
        {tab === 'players' ? <PlayersTab {...props} /> : null}
        {tab === 'settings' ? <SettingsTab {...props} /> : null}
      </div>
    </main>
  );
}
