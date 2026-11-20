'use client';
// Results for one category (or for the whole auction so far). Made to look good on the projector.
import { useRef } from 'react';
import TeamLogo from './TeamLogo';
import PlayerPhoto from './PlayerPhoto';
import TeamBoard from './TeamBoard';
import { money } from '@/lib/format';
import { useAutoScroll } from '@/lib/useAutoScroll';

export default function ResultsBoard({ data, categoryId = null, autoScroll = false }) {
  const { players, categories, teams } = data;
  const category = categories.find((c) => c.id === categoryId);
  const scope = category ? players.filter((p) => p.category_id === category.id) : players;
  const sold = scope.filter((p) => p.status === 'sold').sort((a, b) => b.sold_price - a.sold_price);
  const unsold = scope.filter((p) => p.status === 'unsold');
  const top = sold[0];
  const topTeam = top ? teams.find((t) => t.id === top.team_id) : null;
  const total = sold.reduce((sum, p) => sum + p.sold_price, 0);
  const rest = sold.slice(1);

  const listRef = useRef(null);
  useAutoScroll(listRef, autoScroll, [rest.length]);

  return (
    <section className="results" key={categoryId || 'all'}>
      <header className="results-head">
        <h1>{category ? `${category.name} results` : 'Auction so far'}</h1>
        <div className="results-stats">
          <span><b>{sold.length}</b> sold</span>
          <span><b>{unsold.length}</b> unsold</span>
          <span><b>{money(total)}</b> spent</span>
        </div>
      </header>

      <div className="results-body">
        <aside className="results-side">
          {top ? (
            <div className="spotlight" style={{ '--team': topTeam?.color }}>
              <div className="spotlight-label">Highest bid</div>
              <div className="spotlight-photo">
                <PlayerPhoto player={top} />
              </div>
              <div className="spotlight-name">{top.name}</div>
              <div className="spotlight-price">{money(top.sold_price)}</div>
              <div className="spotlight-team">
                <TeamLogo team={topTeam} size={44} />
                <span>{topTeam?.name}</span>
              </div>
            </div>
          ) : (
            <div className="spotlight empty">No player has been sold yet.</div>
          )}

          {unsold.length > 0 ? (
            <div className="unsold-box">
              <div className="unsold-title">Unsold</div>
              <div className="chips">
                {unsold.map((p) => (
                  <span className="chip" key={p.id}>{p.name}</span>
                ))}
              </div>
            </div>
          ) : null}
        </aside>

        <div className="results-list" ref={listRef}>
          <div className="sold-grid">
            {rest.map((p, i) => {
              const t = teams.find((x) => x.id === p.team_id);
              const cat = categories.find((c) => c.id === p.category_id);
              return (
                <article
                  className="sold-card"
                  key={p.id}
                  style={{ '--team': t?.color, animationDelay: `${Math.min(i, 24) * 90}ms` }}
                >
                  <div className="sold-card-photo">
                    <PlayerPhoto player={p} />
                  </div>
                  <div className="sold-card-info">
                    <div className="sold-card-name">{p.name}</div>
                    {!category && cat ? <div className="sold-card-cat">{cat.name}</div> : null}
                    <div className="sold-card-team">
                      <TeamLogo team={t} size={24} />
                      <span>{t?.name}</span>
                    </div>
                  </div>
                  <div className="sold-card-price">{money(p.sold_price)}</div>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      <TeamBoard data={data} variant="strip" />
    </section>
  );
}
