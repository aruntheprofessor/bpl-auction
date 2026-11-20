'use client';
// The PROJECTOR view. Public and read-only. It follows whatever the auctioneer does, live.
import { useEffect, useState } from 'react';
import { useAuctionData } from '@/lib/useAuctionData';
import Stage from '@/components/Stage';
import TeamBoard from '@/components/TeamBoard';
import ResultsBoard from '@/components/ResultsBoard';
import FinalBoard from '@/components/FinalBoard';

export default function DisplayPage() {
  const { data, error } = useAuctionData();
  const [full, setFull] = useState(false);

  useEffect(() => {
    const onChange = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  }

  if (!data) {
    return (
      <main className="center-screen">
        <p className="muted">{error || 'Loading the auction…'}</p>
      </main>
    );
  }

  const { state, settings, categories } = data;
  const category = categories.find((c) => c.id === state.current_category_id);

  return (
    <main className="display">
      <header className="display-head">
        <div className="brand">{settings.event_name}</div>
        <div className="head-right">
          {state.screen === 'auction' && state.phase === 'unsold' ? (
            <span className="chip chip-accent">Unsold round</span>
          ) : null}
          {state.screen === 'auction' && category ? <span className="chip chip-accent">{category.name}</span> : null}
          {!full ? (
            <button className="btn btn-sm btn-ghost" onClick={toggleFullscreen}>
              Full screen
            </button>
          ) : null}
        </div>
      </header>

      <div className="display-body">
        {state.screen === 'results' ? (
          <ResultsBoard data={data} categoryId={state.results_category_id} autoScroll />
        ) : state.screen === 'final' ? (
          <FinalBoard data={data} autoScroll />
        ) : (
          <Stage data={data} mode="display" celebrate />
        )}
      </div>

      {state.screen === 'auction' ? (
        <TeamBoard data={data} leadingTeamId={state.current_team_id} variant="strip" />
      ) : null}
    </main>
  );
}
