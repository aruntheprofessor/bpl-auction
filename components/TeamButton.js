'use client';
// The big bid button for one team. It looks like the team: its logo and its colour.
import TeamLogo from './TeamLogo';
import { money } from '@/lib/format';

export default function TeamButton({ team, check, purseLeft, hotkey, enabled, onBid }) {
  const leading = check?.leading;
  const canClick = enabled && check?.ok;
  let note = 'Waiting for a player';
  if (enabled && check) note = check.ok ? money(check.amount) : leading ? 'Leading' : check.reason;

  return (
    <button
      type="button"
      className={`team-btn ${leading ? 'is-leading' : ''} ${canClick ? '' : 'is-off'}`}
      style={{ '--team': team.color }}
      disabled={!canClick}
      onClick={onBid}
    >
      {hotkey ? <span className="team-btn-key">{hotkey}</span> : null}
      <TeamLogo team={team} size={64} />
      <span className="team-btn-name">{team.name}</span>
      <span className="team-btn-purse">Purse {money(purseLeft)}</span>
      <span className={`team-btn-bid ${canClick ? 'go' : ''}`}>{note}</span>
    </button>
  );
}
