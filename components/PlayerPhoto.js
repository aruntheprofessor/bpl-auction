// Shows a player photo, or the player's initials if there is no photo.
import { initials } from '@/lib/format';

export default function PlayerPhoto({ player }) {
  if (player.photo_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="photo" src={player.photo_url} alt={player.name} />;
  }
  return <div className="photo photo-fallback">{initials(player.name)}</div>;
}
