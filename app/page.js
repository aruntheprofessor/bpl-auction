import Link from 'next/link';

// Home page: three doors into the app.
export default function Home() {
  return (
    <main className="home">
      <h1 className="home-title">Badminton Premier League Auction</h1>
      <p className="muted">Pick where you want to go.</p>
      <div className="home-grid">
        <Link href="/auction" className="home-card">
          <span className="home-card-title">Auction screen</span>
          <span className="muted">For the auctioneer. Password needed.</span>
        </Link>
        <Link href="/display" className="home-card">
          <span className="home-card-title">Projector view</span>
          <span className="muted">Open this on the big screen. Anyone can view it.</span>
        </Link>
        <Link href="/admin" className="home-card">
          <span className="home-card-title">Admin</span>
          <span className="muted">Add categories, teams and players. Password needed.</span>
        </Link>
      </div>
    </main>
  );
}
