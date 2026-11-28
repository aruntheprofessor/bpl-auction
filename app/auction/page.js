'use client';
// The AUCTIONEER screen: pick a category, show a player, click the team buttons to raise the bid.
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthGate from '@/components/AuthGate';
import Stage from '@/components/Stage';
import TeamButton from '@/components/TeamButton';
import { useAuctionData } from '@/lib/useAuctionData';
import { auctionAction, callApi } from '@/lib/api';
import { checkTeamCanBid, getTeamStats } from '@/lib/rules';
import { money } from '@/lib/format';
import { balancedColumns } from '@/lib/layout';

export default function AuctionPage() {
  return (
    <AuthGate>
      <AuctionScreen />
    </AuthGate>
  );
}

function AuctionScreen() {
  const router = useRouter();
  const { data, error, reload } = useAuctionData();
  const [message, setMessage] = useState('');
  const lock = useRef(false); // stops accidental double clicks
  const hotkeyRef = useRef(() => {});

  // Run one auction action (bid, sold, next player...) and refresh the screen.
  const act = useCallback(
    async (action, extra) => {
      if (lock.current) return;
      lock.current = true;
      setMessage('');
      try {
        await auctionAction(action, extra);
        await reload();
      } catch (e) {
        setMessage(e.message);
      } finally {
        lock.current = false;
      }
    },
    [reload]
  );

  // Keyboard shortcut: press 1, 2, 3... to bid for the 1st, 2nd, 3rd team.
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target && e.target.closest && e.target.closest('input, textarea, select')) return;
      hotkeyRef.current(e.key);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!data) {
    return (
      <main className="center-screen">
        <p className="muted">{error || 'Loading the auction…'}</p>
      </main>
    );
  }

  const { state, categories, teams, players, settings, bids } = data;
  const phase = state.phase;
  const category = categories.find((c) => c.id === state.current_category_id);
  const player = players.find((p) => p.id === state.current_player_id);
  const live =
    !!player && ((phase === 'main' && player.status === 'pending') || (phase === 'unsold' && player.status === 'unsold'));
  const playerCategory = player ? categories.find((c) => c.id === player.category_id) : null;
  const leader = teams.find((t) => t.id === state.current_team_id);
  const playerBids = player ? bids.filter((b) => b.player_id === player.id) : [];
  const pending = category ? players.filter((p) => p.category_id === category.id && p.status === 'pending') : [];
  const unsoldList = players.filter((p) => p.status === 'unsold');

  // Work out, for every team, whether its button can be clicked right now.
  const checks = {};
  const purses = {};
  teams.forEach((t) => {
    purses[t.id] = getTeamStats(t, players, categories, settings.starting_purse).purseLeft;
    checks[t.id] =
      live && playerCategory
        ? checkTeamCanBid({
            team: t,
            category: playerCategory,
            categories,
            players,
            startingPurse: settings.starting_purse,
            currentBid: state.current_bid,
            leadingTeamId: state.current_team_id,
          })
        : null;
  });

  hotkeyRef.current = (key) => {
    const index = Number(key) - 1;
    if (!Number.isInteger(index) || index < 0 || index >= teams.length) return;
    const team = teams[index];
    if (checks[team.id]?.ok) act('bid', { teamId: team.id });
  };

  const pickRandom = () => pending[Math.floor(Math.random() * pending.length)];
  const projectorNote =
    state.screen === 'results'
      ? 'The projector is showing results.'
      : state.screen === 'final'
      ? 'The projector is showing the final squads.'
      : '';

  async function logout() {
    await callApi('/api/logout', 'POST').catch(() => {});
    router.push('/login');
  }

  return (
    <main className="control">
      <header className="control-head">
        <div className="brand">{settings.event_name}</div>
        <div className="head-actions">
          <button className="btn btn-sm" onClick={() => act('showResults', { categoryId: null })}>
            Results so far
          </button>
          <button className="btn btn-sm" onClick={() => act('showFinal')}>
            Final squads
          </button>
          <button className="btn btn-sm" onClick={() => act('setTheme', { theme: state.theme === 'dark' ? 'light' : 'dark' })}>
            {state.theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          </button>
          <Link className="btn btn-sm" href="/admin">
            Admin
          </Link>
          <a className="btn btn-sm" href="/display" target="_blank" rel="noreferrer">
            Open projector view
          </a>
          <button className="btn btn-sm btn-ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      {error ? <div className="banner bad">{error}</div> : null}
      {message ? <div className="banner bad">{message}</div> : null}
      {projectorNote ? (
        <div className="banner">
          {projectorNote}
          <button className="btn btn-sm btn-primary" onClick={() => act('showAuction')}>
            Show the auction again
          </button>
        </div>
      ) : null}

      <div className="control-body">
        <section className="control-main">
          {phase === 'main' && !category ? (
            <CategoryPicker
              categories={categories}
              players={players}
              unsoldCount={unsoldList.length}
              act={act}
            />
          ) : (
            <>
              <Stage data={data} mode="control" />

              <div className="action-row">
                {live ? (
                  <>
                    <button className="btn btn-good btn-big" disabled={!leader} onClick={() => act('sold')}>
                      {leader ? `Sold to ${leader.name} for ${money(state.current_bid)}` : 'Sold'}
                    </button>
                    <button
                      className="btn btn-bad btn-big"
                      onClick={() => {
                        if (!leader || window.confirm(`Mark ${player.name} as UNSOLD? The current bid will be cleared.`))
                          act('noSale');
                      }}
                    >
                      No sale
                    </button>
                    <button className="btn btn-big" disabled={playerBids.length === 0} onClick={() => act('undoBid')}>
                      Undo last bid
                    </button>
                  </>
                ) : (
                  <>
                    {player && player.status === 'sold' ? (
                      <button
                        className="btn btn-big"
                        onClick={() => {
                          if (window.confirm(`Take back the sale of ${player.name} and reopen bidding?`)) act('undoSale');
                        }}
                      >
                        Undo sale
                      </button>
                    ) : null}
                    {phase === 'main' && category && pending.length > 0 ? (
                      <button className="btn btn-primary btn-big" onClick={() => act('setPlayer', { playerId: pending[0].id })}>
                        Next player
                      </button>
                    ) : null}
                    {phase === 'main' && category && pending.length === 0 ? (
                      <button className="btn btn-primary btn-big" onClick={() => act('finishCategory')}>
                        Finish category and show results
                      </button>
                    ) : null}
                    {phase === 'unsold' ? <span className="muted">Pick a player from the unsold list.</span> : null}
                  </>
                )}
              </div>

              <div className="team-buttons" style={{ '--cols': balancedColumns(teams.length, 5) }}>
                {teams.map((team, i) => (
                  <TeamButton
                    key={team.id}
                    team={team}
                    check={checks[team.id]}
                    purseLeft={purses[team.id]}
                    hotkey={i < 9 ? String(i + 1) : ''}
                    enabled={live}
                    onBid={() => act('bid', { teamId: team.id })}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        <aside className="control-side">
          {phase === 'main' && category ? (
            <>
              <h2 className="side-title">{category.name}</h2>
              <p className="muted">
                {pending.length} waiting. Base price {money(category.base_price)}, raised by {money(category.increment)}.
              </p>
              {pending.length > 0 ? (
                <>
                  <button className="btn btn-sm" onClick={() => act('setPlayer', { playerId: pickRandom().id })}>
                    Pick a random player
                  </button>
                  <div className="side-list">
                    {pending.map((p) => (
                      <button key={p.id} className="side-item" onClick={() => act('setPlayer', { playerId: p.id })}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  if (!live || window.confirm('A player is still on the block. Leave this category anyway?'))
                    act('leaveCategory');
                }}
              >
                Back to categories
              </button>
            </>
          ) : null}

          {phase === 'unsold' ? (
            <>
              <h2 className="side-title">Unsold round</h2>
              <p className="muted">Only teams that still miss a category can bid. Base prices stay the same.</p>
              <div className="side-list">
                {unsoldList.length === 0 ? <p className="muted">No unsold players left.</p> : null}
                {unsoldList.map((p) => {
                  const c = categories.find((x) => x.id === p.category_id);
                  return (
                    <button key={p.id} className="side-item" onClick={() => act('setPlayer', { playerId: p.id })}>
                      {p.name}
                      <span className="muted"> {c?.name}, {money(c?.base_price)}</span>
                    </button>
                  );
                })}
              </div>
              <button className="btn btn-sm btn-ghost" onClick={() => act('backToMain')}>
                Back to categories
              </button>
            </>
          ) : null}

          {phase === 'main' && !category ? (
            <>
              <h2 className="side-title">Tips</h2>
              <p className="muted">Pick the category the chief guest drew. Press 1 to 9 to bid for a team.</p>
            </>
          ) : null}
        </aside>
      </div>
    </main>
  );
}

// Shown when no category is selected: the chief guest draws one, the auctioneer clicks it.
function CategoryPicker({ categories, players, unsoldCount, act }) {
  if (categories.length === 0) {
    return (
      <div className="picker">
        <h2>No categories yet</h2>
        <p className="muted">Open the Admin page and add your categories, teams and players first.</p>
        <Link className="btn btn-primary" href="/admin">
          Go to Admin
        </Link>
      </div>
    );
  }
  return (
    <div className="picker">
      <h2>Choose the next category</h2>
      <div className="picker-grid">
        {categories.map((c) => {
          const all = players.filter((p) => p.category_id === c.id);
          const waiting = all.filter((p) => p.status === 'pending').length;
          const done = c.status === 'done' || (all.length > 0 && waiting === 0);
          return (
            <button
              key={c.id}
              className={`picker-card ${done ? 'done' : ''}`}
              onClick={() => act('startCategory', { categoryId: c.id })}
            >
              <span className="picker-name">{c.name}</span>
              <span className="muted">
                {all.length - waiting} of {all.length} players done
              </span>
              <span className="muted">
                Base {money(c.base_price)}, step {money(c.increment)}
              </span>
              {done ? <span className="badge">Done</span> : null}
            </button>
          );
        })}
      </div>

      <div className="picker-actions">
        {unsoldCount > 0 ? (
          <button className="btn btn-primary" onClick={() => act('startUnsoldRound')}>
            Start unsold round ({unsoldCount} players)
          </button>
        ) : null}
        {categories
          .filter((c) => players.some((p) => p.category_id === c.id && p.status === 'sold'))
          .map((c) => (
            <button key={c.id} className="btn btn-sm" onClick={() => act('showResults', { categoryId: c.id })}>
              Show {c.name} results
            </button>
          ))}
      </div>
    </div>
  );
}
