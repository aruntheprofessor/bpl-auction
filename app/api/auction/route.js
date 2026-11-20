// The BRAIN of the auction. Every button on the auction screen ends up here.
// The server double-checks every rule, so a wrong click can never break the auction.
import { NextResponse } from 'next/server';
import { db } from '@/lib/supabaseServer';
import { isLoggedIn } from '@/lib/auth';
import { checkTeamCanBid } from '@/lib/rules';

export const dynamic = 'force-dynamic';

const ZERO_ID = '00000000-0000-0000-0000-000000000000';
const CLEAR_STAGE = { current_player_id: null, current_bid: null, current_team_id: null };

class Problem extends Error {} // a message that is safe to show to the auctioneer

const fail = (message, status = 400) => NextResponse.json({ error: message }, { status });

// Runs a database command and stops with a clear message if it fails.
async function run(query) {
  const { error } = await query;
  if (error) throw new Problem(error.message);
}

async function loadEverything(sb) {
  const [s, c, t, p, a] = await Promise.all([
    sb.from('settings').select('*').eq('id', 1).single(),
    sb.from('categories').select('*').order('sort_order'),
    sb.from('teams').select('*').order('created_at'),
    sb.from('players').select('*').order('created_at'),
    sb.from('auction_state').select('*').eq('id', 1).single(),
  ]);
  const failed = [s, c, t, p, a].find((r) => r.error);
  if (failed) throw new Problem('Database not ready: ' + failed.error.message);
  return { settings: s.data, categories: c.data, teams: t.data, players: p.data, state: a.data };
}

export async function POST(req) {
  if (!isLoggedIn()) return fail('Please log in first.', 401);
  try {
    const body = await req.json();
    const sb = db();
    const { settings, categories, teams, players, state } = await loadEverything(sb);

    const setState = (patch) => run(sb.from('auction_state').update(patch).eq('id', 1));
    const currentPlayer = players.find((p) => p.id === state.current_player_id);
    // A player is "live" when the auctioneer can still take bids for him/her.
    const isLive = (p) =>
      p &&
      ((state.phase === 'main' && p.status === 'pending') ||
        (state.phase === 'unsold' && p.status === 'unsold'));

    switch (body.action) {
      // ----- choosing what to auction -----
      case 'startCategory': {
        const cat = categories.find((c) => c.id === body.categoryId);
        if (!cat) throw new Problem('Category not found.');
        await run(sb.from('categories').update({ status: 'active' }).eq('id', cat.id));
        await setState({
          phase: 'main',
          screen: 'auction',
          current_category_id: cat.id,
          results_category_id: null,
          ...CLEAR_STAGE,
        });
        break;
      }
      case 'leaveCategory': {
        await setState({ phase: 'main', screen: 'auction', current_category_id: null, ...CLEAR_STAGE });
        break;
      }
      case 'setPlayer': {
        const p = players.find((x) => x.id === body.playerId);
        if (!p) throw new Problem('Player not found.');
        if (state.phase === 'main') {
          if (p.status !== 'pending' || p.category_id !== state.current_category_id)
            throw new Problem('That player is not available in this category.');
        } else if (p.status !== 'unsold') {
          throw new Problem('That player is not in the unsold list.');
        }
        await run(sb.from('bids').update({ cancelled: true }).eq('player_id', p.id).eq('cancelled', false));
        await setState({ current_player_id: p.id, current_bid: null, current_team_id: null, screen: 'auction' });
        break;
      }

      // ----- bidding -----
      case 'bid': {
        if (!isLive(currentPlayer)) throw new Problem('Choose the next player first.');
        const team = teams.find((t) => t.id === body.teamId);
        if (!team) throw new Problem('Team not found.');
        const category = categories.find((c) => c.id === currentPlayer.category_id);
        const check = checkTeamCanBid({
          team,
          category,
          categories,
          players,
          startingPurse: settings.starting_purse,
          currentBid: state.current_bid,
          leadingTeamId: state.current_team_id,
        });
        if (!check.ok) throw new Problem(`${team.name}: ${check.reason}`);
        await run(
          sb.from('bids').insert({ player_id: currentPlayer.id, team_id: team.id, amount: check.amount })
        );
        await setState({ current_bid: check.amount, current_team_id: team.id });
        break;
      }
      case 'undoBid': {
        if (!isLive(currentPlayer)) throw new Problem('There is no live player.');
        const { data: list } = await sb
          .from('bids')
          .select('*')
          .eq('player_id', currentPlayer.id)
          .eq('cancelled', false)
          .order('created_at', { ascending: false });
        if (!list || list.length === 0) throw new Problem('There is no bid to undo.');
        await run(sb.from('bids').update({ cancelled: true }).eq('id', list[0].id));
        const previous = list[1];
        await setState({
          current_bid: previous ? previous.amount : null,
          current_team_id: previous ? previous.team_id : null,
        });
        break;
      }

      // ----- result of a player -----
      case 'sold': {
        if (!isLive(currentPlayer)) throw new Problem('There is no live player.');
        if (!state.current_team_id || state.current_bid === null)
          throw new Problem('No bid yet. Click a team to place the first bid.');
        const { error } = await sb
          .from('players')
          .update({
            status: 'sold',
            team_id: state.current_team_id,
            sold_price: state.current_bid,
            sold_at: new Date().toISOString(),
          })
          .eq('id', currentPlayer.id);
        if (error)
          throw new Problem(
            error.code === '23505' ? 'That team already has a player in this category.' : error.message
          );
        break;
      }
      case 'noSale': {
        if (!isLive(currentPlayer)) throw new Problem('There is no live player.');
        await run(
          sb.from('bids').update({ cancelled: true }).eq('player_id', currentPlayer.id).eq('cancelled', false)
        );
        if (state.phase === 'main') {
          await run(sb.from('players').update({ status: 'unsold' }).eq('id', currentPlayer.id));
          await setState({ current_bid: null, current_team_id: null });
        } else {
          await setState({ ...CLEAR_STAGE }); // stays in the unsold list
        }
        break;
      }
      case 'undoSale': {
        // Oops button: takes back the sale that is on the screen and reopens the bidding.
        if (!currentPlayer || currentPlayer.status !== 'sold')
          throw new Problem('The player on screen has not been sold.');
        await run(
          sb
            .from('players')
            .update({
              status: state.phase === 'unsold' ? 'unsold' : 'pending',
              team_id: null,
              sold_price: null,
              sold_at: null,
            })
            .eq('id', currentPlayer.id)
        );
        const { data: list } = await sb
          .from('bids')
          .select('*')
          .eq('player_id', currentPlayer.id)
          .eq('cancelled', false)
          .order('created_at', { ascending: false });
        const last = list && list[0];
        await setState({
          current_bid: last ? last.amount : null,
          current_team_id: last ? last.team_id : null,
        });
        break;
      }

      // ----- categories and rounds -----
      case 'finishCategory': {
        const cat = categories.find((c) => c.id === state.current_category_id);
        if (!cat) throw new Problem('No category is selected.');
        const waiting = players.filter((p) => p.category_id === cat.id && p.status === 'pending');
        if (waiting.length > 0) throw new Problem(`${waiting.length} player(s) are still waiting in this category.`);
        await run(sb.from('categories').update({ status: 'done' }).eq('id', cat.id));
        await setState({
          screen: 'results',
          results_category_id: cat.id,
          current_category_id: null,
          ...CLEAR_STAGE,
        });
        break;
      }
      case 'startUnsoldRound': {
        if (!players.some((p) => p.status === 'unsold')) throw new Problem('There are no unsold players.');
        await setState({
          phase: 'unsold',
          screen: 'auction',
          current_category_id: null,
          results_category_id: null,
          ...CLEAR_STAGE,
        });
        break;
      }
      case 'backToMain': {
        await setState({ phase: 'main', screen: 'auction', ...CLEAR_STAGE });
        break;
      }

      // ----- what the projector shows -----
      case 'showResults':
        await setState({ screen: 'results', results_category_id: body.categoryId || null });
        break;
      case 'showAuction':
        await setState({ screen: 'auction' });
        break;
      case 'showFinal':
        await setState({ screen: 'final' });
        break;
      case 'setTheme':
        if (!['dark', 'light'].includes(body.theme)) throw new Problem('Unknown theme.');
        await setState({ theme: body.theme });
        break;

      // ----- start over (use it after your rehearsal!) -----
      case 'resetAuction': {
        if (body.confirm !== 'RESET') throw new Problem('Type RESET to confirm.');
        await run(sb.from('bids').delete().neq('id', ZERO_ID));
        await run(
          sb
            .from('players')
            .update({ status: 'pending', team_id: null, sold_price: null, sold_at: null })
            .neq('id', ZERO_ID)
        );
        await run(sb.from('categories').update({ status: 'pending' }).neq('id', ZERO_ID));
        await setState({
          phase: 'main',
          screen: 'auction',
          current_category_id: null,
          results_category_id: null,
          ...CLEAR_STAGE,
        });
        break;
      }

      default:
        throw new Problem('Unknown action.');
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Problem) return fail(e.message);
    return fail(e.message || 'Server error', 500);
  }
}
