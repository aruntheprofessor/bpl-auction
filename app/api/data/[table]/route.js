// Create / edit / delete for categories, teams, players and settings.
// Only the logged-in auctioneer can use it.
import { NextResponse } from 'next/server';
import { db } from '@/lib/supabaseServer';
import { isLoggedIn } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Which columns each table is allowed to receive from the screens.
const FIELDS = {
  categories: ['name', 'base_price', 'increment', 'sort_order'],
  teams: ['name', 'logo_url', 'color'],
  players: ['name', 'photo_url', 'category_id', 'age', 'level'],
  settings: ['event_name', 'starting_purse'],
};
const NUMBERS = ['base_price', 'increment', 'sort_order', 'age', 'starting_purse'];
const REQUIRED = {
  categories: ['name', 'base_price', 'increment'],
  teams: ['name'],
  players: ['name', 'category_id'],
  settings: [],
};

const fail = (message, status = 400) => NextResponse.json({ error: message }, { status });

function clean(table, body) {
  const out = {};
  for (const key of FIELDS[table]) {
    if (!(key in body)) continue;
    let value = body[key];
    if (typeof value === 'string') value = value.trim();
    if (value === '') value = null;
    if (NUMBERS.includes(key) && value !== null) {
      value = Number(value);
      if (!Number.isFinite(value)) throw new Error(`${key} must be a number`);
    }
    out[key] = value;
  }
  return out;
}

function friendly(error) {
  if (error.code === '23505') return 'That name already exists.';
  if (error.code === '23503')
    return 'This item is still in use, so it cannot be deleted. Reset the auction or remove the linked items first.';
  if (error.code === '23514') return 'One of the numbers is not allowed (prices must be above zero).';
  return error.message;
}

export async function POST(req, { params }) {
  if (!isLoggedIn()) return fail('Please log in first.', 401);
  const table = params.table;
  if (!FIELDS[table] || table === 'settings') return fail('Unknown table');
  try {
    const body = await req.json();
    const sb = db();
    const items = Array.isArray(body) ? body : [body];
    const rows = items.map((item) => clean(table, item));
    for (const row of rows) {
      for (const key of REQUIRED[table]) {
        if (row[key] === null || row[key] === undefined) return fail(`${key} is required`);
      }
    }
    if (table === 'categories') {
      const { data: last } = await sb
        .from('categories')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1);
      let next = (last?.[0]?.sort_order ?? 0) + 1;
      rows.forEach((row) => {
        if (row.sort_order === null || row.sort_order === undefined) row.sort_order = next++;
      });
    }
    const { data, error } = await sb.from(table).insert(rows).select();
    if (error) return fail(friendly(error));
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return fail(e.message);
  }
}

export async function PUT(req, { params }) {
  if (!isLoggedIn()) return fail('Please log in first.', 401);
  const table = params.table;
  if (!FIELDS[table]) return fail('Unknown table');
  try {
    const body = await req.json();
    const id = table === 'settings' ? 1 : body.id;
    if (!id) return fail('id is missing');
    const patch = clean(table, body);
    for (const key of REQUIRED[table]) {
      if (key in patch && patch[key] === null) return fail(`${key} is required`);
    }
    const { error } = await db().from(table).update(patch).eq('id', id);
    if (error) return fail(friendly(error));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e.message);
  }
}

export async function DELETE(req, { params }) {
  if (!isLoggedIn()) return fail('Please log in first.', 401);
  const table = params.table;
  if (!FIELDS[table] || table === 'settings') return fail('Unknown table');
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return fail('id is missing');
  const { error } = await db().from(table).delete().eq('id', id);
  if (error) return fail(friendly(error));
  return NextResponse.json({ ok: true });
}
