'use client';
// The main picture: the player on the block, the current bid and the leading team.
// The projector (/display) and the auctioneer screen (/auction) both use this component.
import { useEffect, useRef } from 'react';
import TeamLogo from './TeamLogo';
import PlayerPhoto from './PlayerPhoto';
import { money } from '@/lib/format';

function fireConfetti(color) {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  import('canvas-confetti').then((mod) => {
    const confetti = mod.default;
    const colors = [color || '#ffc83d', '#ffc83d', '#ffffff', '#4ade80'];
    const end = Date.now() + 1800;
    (function frame() {
      confetti({ particleCount: 6, angle: 60, spread: 65, origin: { x: 0, y: 0.8 }, colors });
      confetti({ particleCount: 6, angle: 120, spread: 65, origin: { x: 1, y: 0.8 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  });
}

export default function Stage({ data, mode = 'display', celebrate = false }) {
  const { state, players, categories, teams, bids, settings } = data;
  const player = players.find((p) => p.id === state.current_player_id);
  const category = player
    ? categories.find((c) => c.id === player.category_id)
    : categories.find((c) => c.id === state.current_category_id);
  const leader = teams.find((t) => t.id === state.current_team_id);
  const soldTeam = player && player.status === 'sold' ? teams.find((t) => t.id === player.team_id) : null;
  const trail = player ? bids.filter((b) => b.player_id === player.id).slice(-4).reverse() : [];

  // Fire confetti the moment a player becomes SOLD (not when the page first opens).
  const seen = useRef(null);
  const key = player ? `${player.id}:${player.status}` : '';
  useEffect(() => {
    if (seen.current === null) {
      seen.current = key;
      return;
    }
    if (key !== seen.current) {
      seen.current = key;
      if (celebrate && player && player.status === 'sold') fireConfetti(soldTeam?.color);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // ----- nothing on the block yet -----
  if (!player) {
    let title = settings.event_name;
    let lines = ['The auction will begin shortly'];
    if (state.phase === 'unsold') {
      title = 'Unsold round';
      lines = ['Players who did not sell get a second chance', 'Same base price as before'];
    } else if (category) {
      const waiting = players.filter((p) => p.category_id === category.id && p.status === 'pending').length;
      title = category.name;
      lines = [
        `${waiting} player${waiting === 1 ? '' : 's'} to go`,
        `Base price ${money(category.base_price)}, raised by ${money(category.increment)}`,
      ];
    }
    return (
      <section className={`stage idle ${mode}`}>
        <div className="idle-card" key={title}>
          <div className="idle-title">{title}</div>
          {lines.map((l) => (
            <div className="idle-sub" key={l}>
              {l}
            </div>
          ))}
        </div>
      </section>
    );
  }

  const hasBid = state.current_bid !== null && state.current_bid !== undefined;
  const shownBid = hasBid ? state.current_bid : category?.base_price;

  return (
    <section className={`stage ${mode}`}>
      <div className="stage-player">
        <div className="photo-frame">
          <PlayerPhoto player={player} fit="contain" />
        </div>
      </div>

      <div className="stage-bid">
        <div className="player-id">
          <h1 className="player-name">{player.name}</h1>
          <div className="chips">
            {category ? <span className="chip chip-accent">{category.name}</span> : null}
            {player.age ? <span className="chip">Age {player.age}</span> : null}
            {player.level ? <span className="chip">{player.level}</span> : null}
          </div>
        </div>
        <div className="bid-label">{hasBid ? 'Current bid' : 'Opening price'}</div>
        <div className="bid-number" key={shownBid}>
          {money(shownBid)}
        </div>
        <div className="bid-facts">
          <span>Base price {money(category?.base_price)}</span>
          <span>Raised by {money(category?.increment)}</span>
        </div>

        {leader ? (
          <div className="leader" key={`${leader.id}-${state.current_bid}`} style={{ '--team': leader.color }}>
            <TeamLogo team={leader} size={mode === 'display' ? undefined : 56} />
            <div>
              <div className="leader-label">Highest bidder</div>
              <div className="leader-name">{leader.name}</div>
            </div>
          </div>
        ) : (
          <div className="leader waiting">Waiting for the first bid</div>
        )}

        {trail.length > 1 ? (
          <div className="trail">
            {trail.map((b) => {
              const t = teams.find((x) => x.id === b.team_id);
              return (
                <span className="trail-item" key={b.id} style={{ '--team': t?.color }}>
                  {t?.name} {money(b.amount)}
                </span>
              );
            })}
          </div>
        ) : null}
      </div>

      {soldTeam ? (
        <div className="overlay sold" style={{ '--team': soldTeam.color }}>
          <div className="stamp">SOLD</div>
          <div className="overlay-row">
            <TeamLogo team={soldTeam} size={mode === 'display' ? 150 : 72} />
            <div>
              <div className="overlay-team">{soldTeam.name}</div>
              <div className="overlay-price">{money(player.sold_price)}</div>
            </div>
          </div>
          <div className="overlay-player">{player.name}</div>
        </div>
      ) : null}

      {player.status === 'unsold' && state.phase === 'main' ? (
        <div className="overlay unsold">
          <div className="stamp stamp-out">UNSOLD</div>
          <div className="overlay-player">{player.name} will come back in the unsold round</div>
        </div>
      ) : null}
    </section>
  );
}
