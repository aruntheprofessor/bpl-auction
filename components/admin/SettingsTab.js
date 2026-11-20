'use client';
// Event name, starting purse, and the "start over" button.
import { useState } from 'react';
import { callApi, auctionAction } from '@/lib/api';
import { money } from '@/lib/format';

export default function SettingsTab({ data, onChanged, notify }) {
  const { settings, categories } = data;
  const [eventName, setEventName] = useState(settings.event_name);
  const [purse, setPurse] = useState(String(settings.starting_purse));
  const [confirm, setConfirm] = useState('');
  const minimum = categories.reduce((sum, c) => sum + c.base_price, 0);

  async function save(e) {
    e.preventDefault();
    try {
      await callApi('/api/data/settings', 'PUT', { event_name: eventName, starting_purse: purse });
      await onChanged();
      notify('Settings saved');
    } catch (err) {
      notify(err.message, true);
    }
  }

  async function reset() {
    try {
      await auctionAction('resetAuction', { confirm });
      setConfirm('');
      await onChanged();
      notify('Auction reset. All players are waiting again.');
    } catch (err) {
      notify(err.message, true);
    }
  }

  return (
    <div className="admin-grid">
      <form className="panel" onSubmit={save}>
        <h2>Event settings</h2>
        <div className="field">
          <label>Event name</label>
          <input className="input" value={eventName} onChange={(e) => setEventName(e.target.value)} required />
        </div>
        <div className="field">
          <label>Starting purse for every team</label>
          <input
            className="input"
            type="number"
            min="1"
            value={purse}
            onChange={(e) => setPurse(e.target.value)}
            required
          />
          <p className="hint">
            Each team needs at least {money(minimum)} to be able to buy one player in every category at base price.
          </p>
          {Number(purse) < minimum ? (
            <p className="error-text">This purse is too small for the current base prices.</p>
          ) : null}
        </div>
        <button className="btn btn-primary">Save settings</button>
      </form>

      <div className="panel danger">
        <h2>Start over</h2>
        <p className="muted">
          Use this after your rehearsal. It removes every bid and sale and puts all players back in the waiting list.
          Players, teams and categories are kept.
        </p>
        <div className="field">
          <label>Type RESET to confirm</label>
          <input className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <button className="btn btn-bad" disabled={confirm !== 'RESET'} onClick={reset}>
          Reset the auction
        </button>
      </div>
    </div>
  );
}
