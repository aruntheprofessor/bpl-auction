// Shows a team logo. If the team has no logo yet, shows its initials in the team colour.
// "size" is optional: when it is left out, the CSS decides how big the logo is.
import { initials } from '@/lib/format';

export default function TeamLogo({ team, size }) {
  if (!team) return null;
  const hasSize = typeof size === 'number';
  const style = hasSize ? { width: size, height: size, '--team': team.color } : { '--team': team.color };
  if (team.logo_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="team-logo" style={style} src={team.logo_url} alt={team.name} />;
  }
  const fallbackStyle = hasSize ? { ...style, fontSize: size * 0.38 } : style;
  return (
    <div className="team-logo team-logo-fallback" style={fallbackStyle}>
      {initials(team.name)}
    </div>
  );
}
