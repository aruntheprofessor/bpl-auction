// Row (or grid) of all teams with purse left and how many squad slots are filled.
import TeamLogo from './TeamLogo';
import { getTeamStats } from '@/lib/rules';
import { money } from '@/lib/format';

export default function TeamBoard({ data, leadingTeamId, variant = 'strip' }) {
  const { teams, players, categories, settings } = data;
  return (
    <div className={`team-board ${variant}`}>
      {teams.map((team) => {
        const s = getTeamStats(team, players, categories, settings.starting_purse);
        return (
          <div
            key={team.id}
            className={`team-chip ${leadingTeamId === team.id ? 'leading' : ''}`}
            style={{ '--team': team.color }}
          >
            <TeamLogo team={team} size={variant === 'strip' ? 44 : 56} />
            <div className="team-chip-text">
              <div className="team-chip-name">{team.name}</div>
              <div className="team-chip-purse">{money(s.purseLeft)}</div>
            </div>
            <div className="slots" title={`${s.slotsFilled} of ${s.slotsTotal} players`}>
              {categories.map((c) => (
                <span key={c.id} className={`slot ${s.filled.has(c.id) ? 'on' : ''}`} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
