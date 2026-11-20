'use client';
// The final screen: every team and the squad it bought.
import { useRef } from 'react';
import TeamLogo from './TeamLogo';
import { getTeamStats } from '@/lib/rules';
import { money } from '@/lib/format';
import { useAutoScroll } from '@/lib/useAutoScroll';

export default function FinalBoard({ data, autoScroll = false }) {
  const { teams, players, categories, settings } = data;
  const sold = players.filter((p) => p.status === 'sold').sort((a, b) => b.sold_price - a.sold_price);
  const top = sold[0];
  const topTeam = top ? teams.find((t) => t.id === top.team_id) : null;
  const unsold = players.filter((p) => p.status === 'unsold').length;

  const ref = useRef(null);
  useAutoScroll(ref, autoScroll, [teams.length, sold.length]);

  return (
    <section className="final">
      <header className="results-head">
        <h1>Final squads</h1>
        <div className="results-stats">
          <span><b>{sold.length}</b> players sold</span>
          <span><b>{unsold}</b> unsold</span>
          {top ? (
            <span>
              Highest bid <b>{top.name}</b> {money(top.sold_price)} to {topTeam?.name}
            </span>
          ) : null}
        </div>
      </header>

      <div className="final-grid" ref={ref}>
        {teams.map((team, i) => {
          const s = getTeamStats(team, players, categories, settings.starting_purse);
          return (
            <article
              className="final-card"
              key={team.id}
              style={{ '--team': team.color, animationDelay: `${i * 120}ms` }}
            >
              <div className="final-card-head">
                <TeamLogo team={team} size={56} />
                <div>
                  <div className="final-team">{team.name}</div>
                  <div className="final-money">
                    Spent {money(s.spent)}, left {money(s.purseLeft)}
                  </div>
                </div>
              </div>
              <ul className="squad">
                {categories.map((c) => {
                  const p = s.sold.find((x) => x.category_id === c.id);
                  return (
                    <li key={c.id} className={p ? '' : 'empty'}>
                      <span className="squad-cat">{c.name}</span>
                      <span className="squad-name">{p ? p.name : 'Not filled'}</span>
                      <span className="squad-price">{p ? money(p.sold_price) : ''}</span>
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
