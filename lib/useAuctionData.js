'use client';
// One hook that loads EVERYTHING the screens need and keeps it live.
// It refreshes when the database changes (realtime) and every 4 seconds as a safety net.
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabaseBrowser';

export function useAuctionData() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const lastJson = useRef('');
  const timer = useRef(null);

  const load = useCallback(async () => {
    if (!supabase) {
      setError('Supabase keys are missing. Check your .env.local file and restart the app.');
      return;
    }
    try {
      const [s, c, t, p, a, b] = await Promise.all([
        supabase.from('settings').select('*').eq('id', 1).single(),
        supabase.from('categories').select('*').order('sort_order').order('created_at'),
        supabase.from('teams').select('*').order('created_at'),
        supabase.from('players').select('*').order('created_at'),
        supabase.from('auction_state').select('*').eq('id', 1).single(),
        supabase.from('bids').select('*').eq('cancelled', false).order('created_at'),
      ]);
      const failed = [s, c, t, p, a, b].find((r) => r.error);
      if (failed) throw new Error(failed.error.message);
      const next = {
        settings: s.data,
        categories: c.data,
        teams: t.data,
        players: p.data,
        state: a.data,
        bids: b.data,
      };
      const json = JSON.stringify(next);
      if (json !== lastJson.current) {
        lastJson.current = json;
        setData(next);
      }
      setError('');
    } catch (e) {
      setError(e.message || 'Could not load data');
    }
  }, []);

  useEffect(() => {
    load();
    if (!supabase) return undefined;
    const refreshSoon = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(load, 120);
    };
    const channel = supabase
      .channel('auction-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, refreshSoon)
      .subscribe();
    const poll = setInterval(load, 4000);
    return () => {
      clearTimeout(timer.current);
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [load]);

  // Apply the dark / light mode chosen by the auctioneer.
  const theme = data?.state?.theme;
  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme;
  }, [theme]);

  return { data, error, reload: load };
}
