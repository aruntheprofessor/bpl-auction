// All teams with their full name and purse left, big enough to read from far away.
// The boxes sit in equal rows (8 teams = 4 + 4).
import TeamLogo from './TeamLogo';
import { getTeamStats } from '@/lib/rules';
import { money } from '@/lib/format';
import { balancedColumns } from '@/lib/layout';

export default function TeamBoard({ data, leadingTeamId, variant = 'strip' }) {
  const { teams, players, categories, settings } = data;
  const columns = balancedColumns(teams.length, teams.length <= 8 ? 4 : 5);

  return (
    <div className={`team-board ${variant}`} style={{ '--cols': columns }}>
      {teams.map((team) => {
        const s = getTeamStats(team, players, categories, settings.starting_purse);
        return (
          <div
            key={team.id}
            className={`team-chip ${leadingTeamId === team.id ? 'leading' : ''}`}
            style={{ '--team': team.color }}
          >
            <TeamLogo team={team} size={variant === 'strip' ? undefined : 56} />
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
