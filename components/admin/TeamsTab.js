'use client';
// Add, edit and delete teams (name, colour, logo).
import { useState } from 'react';
import { callApi } from '@/lib/api';
import TeamLogo from '@/components/TeamLogo';
import ImageField from './ImageField';

const EMPTY = { name: '', color: '#1e6fd9', logo_url: '' };

export default function TeamsTab({ data, onChanged, notify }) {
  const { teams } = data;
  const [form, setForm] = useState(EMPTY);

  async function save(e) {
    e.preventDefault();
    try {
      if (form.id) await callApi('/api/data/teams', 'PUT', form);
      else await callApi('/api/data/teams', 'POST', form);
      setForm(EMPTY);
      await onChanged();
      notify('Team saved');
    } catch (err) {
      notify(err.message, true);
    }
  }

  async function remove(t) {
    if (!window.confirm(`Delete the team "${t.name}"?`)) return;
    try {
      await callApi(`/api/data/teams?id=${t.id}`, 'DELETE');
      await onChanged();
      notify('Team deleted');
    } catch (err) {
      notify(err.message, true);
    }
  }

  return (
    <div className="admin-grid">
      <form className="panel" onSubmit={save}>
        <h2>{form.id ? 'Edit team' : 'Add a team'}</h2>
        <div className="field">
          <label>Team name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="field">
          <label>Team colour (used on the bid button)</label>
          <input
            className="input color-input"
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
          />
        </div>
        <ImageField label="Team logo" kind="logo" value={form.logo_url} onChange={(url) => setForm({ ...form, logo_url: url })} />
        <div className="button-row">
          <button className="btn btn-primary">{form.id ? 'Save changes' : 'Add team'}</button>
          {form.id ? (
            <button type="button" className="btn" onClick={() => setForm(EMPTY)}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="panel">
        <h2>Teams ({teams.length})</h2>
        {teams.length === 0 ? <p className="muted">No teams yet. Add your first one.</p> : null}
        <ul className="rows">
          {teams.map((t) => (
            <li key={t.id} className="row">
              <TeamLogo team={t} size={44} />
              <div className="row-main">
                <div className="row-title">{t.name}</div>
                <div className="muted">
                  <span className="swatch" style={{ background: t.color }} /> {t.color}
                </div>
              </div>
              <button className="btn btn-sm" onClick={() => setForm({ ...t, logo_url: t.logo_url || '' })}>
                Edit
              </button>
              <button className="btn btn-sm btn-ghost" onClick={() => remove(t)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
