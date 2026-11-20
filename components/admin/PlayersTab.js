'use client';
// Add, edit, delete players one by one, or paste a whole list at once.
import { useState } from 'react';
import { callApi } from '@/lib/api';
import PlayerPhoto from '@/components/PlayerPhoto';
import { money } from '@/lib/format';
import ImageField from './ImageField';

const EMPTY = { name: '', category_id: '', age: '', level: '', photo_url: '' };

export default function PlayersTab({ data, onChanged, notify }) {
  const { players, categories } = data;
  const [form, setForm] = useState(EMPTY);
  const [filter, setFilter] = useState('all');
  const [bulk, setBulk] = useState('');
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function save(e) {
    e.preventDefault();
    try {
      if (form.id) await callApi('/api/data/players', 'PUT', form);
      else await callApi('/api/data/players', 'POST', form);
      setForm({ ...EMPTY, category_id: form.category_id }); // keep the category to add the next player faster
      await onChanged();
      notify('Player saved');
    } catch (err) {
      notify(err.message, true);
    }
  }

  async function remove(p) {
    if (!window.confirm(`Delete the player "${p.name}"?`)) return;
    try {
      await callApi(`/api/data/players?id=${p.id}`, 'DELETE');
      await onChanged();
      notify('Player deleted');
    } catch (err) {
      notify(err.message, true);
    }
  }

  // Each line:  Name, Category, Age, Level   (age and level are optional)
  async function importBulk() {
    const rows = [];
    const problems = [];
    bulk
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((line, i) => {
        const [name, catName, age, level] = line.split(/[,\t]/).map((x) => x.trim());
        const cat = categories.find((c) => c.name.toLowerCase() === (catName || '').toLowerCase());
        if (!name || !cat) problems.push(`Line ${i + 1}: category "${catName || ''}" was not found`);
        else rows.push({ name, category_id: cat.id, age: age || null, level: level || null });
      });
    if (problems.length) return notify(problems.slice(0, 3).join('. '), true);
    if (!rows.length) return notify('Paste at least one line first.', true);
    try {
      await callApi('/api/data/players', 'POST', rows);
      setBulk('');
      await onChanged();
      notify(`${rows.length} players added`);
    } catch (err) {
      notify(err.message, true);
    }
  }

  const shown = players.filter((p) => filter === 'all' || p.category_id === filter);

  return (
    <div className="admin-grid">
      <div>
        <form className="panel" onSubmit={save}>
          <h2>{form.id ? 'Edit player' : 'Add a player'}</h2>
          {categories.length === 0 ? <p className="error-text">Add a category first.</p> : null}
          <div className="field">
            <label>Name</label>
            <input className="input" value={form.name} onChange={set('name')} required />
          </div>
          <div className="field">
            <label>Category</label>
            <select className="input" value={form.category_id} onChange={set('category_id')} required>
              <option value="">Choose a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Age</label>
              <input className="input" type="number" min="1" value={form.age ?? ''} onChange={set('age')} />
            </div>
            <div className="field">
              <label>Playing level</label>
              <input className="input" value={form.level ?? ''} onChange={set('level')} placeholder="Advanced" />
            </div>
          </div>
          <ImageField label="Photo" value={form.photo_url} onChange={(url) => setForm({ ...form, photo_url: url })} />
          <div className="button-row">
            <button className="btn btn-primary">{form.id ? 'Save changes' : 'Add player'}</button>
            {form.id ? (
              <button type="button" className="btn" onClick={() => setForm(EMPTY)}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        <div className="panel">
          <h2>Add many players at once</h2>
          <p className="hint">One player per line: Name, Category, Age, Level. Age and level are optional. Add photos afterwards.</p>
          <textarea
            className="input"
            rows={6}
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            placeholder={'Arun Kumar, Category A, 24, Advanced\nPriya S, Category B'}
          />
          <button className="btn" onClick={importBulk}>
            Add these players
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Players ({shown.length})</h2>
          <select className="input input-small" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {shown.length === 0 ? <p className="muted">No players here yet.</p> : null}
        <ul className="rows">
          {shown.map((p) => {
            const c = categories.find((x) => x.id === p.category_id);
            return (
              <li key={p.id} className="row">
                <div className="thumb">
                  <PlayerPhoto player={p} />
                </div>
                <div className="row-main">
                  <div className="row-title">{p.name}</div>
                  <div className="muted">
                    {c?.name}
                    {p.age ? `, age ${p.age}` : ''}
                    {p.level ? `, ${p.level}` : ''}
                    {p.status === 'sold' ? `, sold ${money(p.sold_price)}` : p.status === 'unsold' ? ', unsold' : ''}
                  </div>
                </div>
                <button
                  className="btn btn-sm"
                  onClick={() => setForm({ ...p, photo_url: p.photo_url || '', age: p.age ?? '', level: p.level ?? '' })}
                >
                  Edit
                </button>
                <button className="btn btn-sm btn-ghost" onClick={() => remove(p)}>
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
