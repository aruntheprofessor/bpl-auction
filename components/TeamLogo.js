// Shows a team logo. If the team has no logo yet, shows its initials in the team colour.
import { initials } from '@/lib/format';

export default function TeamLogo({ team, size = 48 }) {
  if (!team) return null;
  const style = { width: size, height: size, '--team': team.color };
  if (team.logo_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="team-logo" style={style} src={team.logo_url} alt={team.name} />;
  }
  return (
    <div className="team-logo team-logo-fallback" style={{ ...style, fontSize: size * 0.38 }}>
      {initials(team.name)}
    </div>
  );
}
