'use client';
// Add, edit and delete categories (name, base price, bid step, order).
import { useState } from 'react';
import { callApi } from '@/lib/api';
import { money } from '@/lib/format';

const EMPTY = { name: '', base_price: '', increment: '', sort_order: '' };

export default function CategoriesTab({ data, onChanged, notify }) {
  const { categories, players } = data;
  const [form, setForm] = useState(EMPTY);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function save(e) {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (payload.sort_order === '') delete payload.sort_order;
      if (form.id) await callApi('/api/data/categories', 'PUT', payload);
      else await callApi('/api/data/categories', 'POST', payload);
      setForm(EMPTY);
      await onChanged();
      notify('Category saved');
    } catch (err) {
      notify(err.message, true);
    }
  }

  async function remove(c) {
    if (!window.confirm(`Delete the category "${c.name}"?`)) return;
    try {
      await callApi(`/api/data/categories?id=${c.id}`, 'DELETE');
      await onChanged();
      notify('Category deleted');
    } catch (err) {
      notify(err.message, true);
    }
  }

  return (
    <div className="admin-grid">
      <form className="panel" onSubmit={save}>
        <h2>{form.id ? 'Edit category' : 'Add a category'}</h2>
        <div className="field">
          <label>Name</label>
          <input className="input" value={form.name} onChange={set('name')} placeholder="Category A" required />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Base price</label>
            <input className="input" type="number" min="1" value={form.base_price} onChange={set('base_price')} placeholder="5000" required />
          </div>
          <div className="field">
            <label>Bid step</label>
            <input className="input" type="number" min="1" value={form.increment} onChange={set('increment')} placeholder="1000" required />
          </div>
        </div>
        {form.id ? (
          <div className="field">
            <label>Order in the list</label>
            <input className="input" type="number" value={form.sort_order} onChange={set('sort_order')} />
          </div>
        ) : null}
        <div className="button-row">
          <button className="btn btn-primary">{form.id ? 'Save changes' : 'Add category'}</button>
          {form.id ? (
            <button type="button" className="btn" onClick={() => setForm(EMPTY)}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="panel">
        <h2>Categories ({categories.length})</h2>
        {categories.length === 0 ? <p className="muted">No categories yet. Add your first one.</p> : null}
        <ul className="rows">
          {categories.map((c) => (
            <li key={c.id} className="row">
              <div className="row-main">
                <div className="row-title">{c.name}</div>
                <div className="muted">
                  Base {money(c.base_price)}, step {money(c.increment)},{' '}
                  {players.filter((p) => p.category_id === c.id).length} players
                </div>
              </div>
              <button className="btn btn-sm" onClick={() => setForm({ ...c })}>
                Edit
              </button>
              <button className="btn btn-sm btn-ghost" onClick={() => remove(c)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
