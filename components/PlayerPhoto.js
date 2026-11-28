// Shows a player photo, or the player's initials if there is no photo.
// fit="contain" shows the WHOLE photo in its own shape (nothing cropped, no bars) - used on the auction stage.
// The default fit="cover" fills the frame and may crop the edges (good for small round thumbnails).
import { initials } from '@/lib/format';

export default function PlayerPhoto({ player, fit = 'cover' }) {
  if (!player.photo_url) {
    return <div className="photo photo-fallback">{initials(player.name)}</div>;
  }
  const className = fit === 'contain' ? 'photo photo-main' : 'photo';
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src={player.photo_url} alt={player.name} />;
}
