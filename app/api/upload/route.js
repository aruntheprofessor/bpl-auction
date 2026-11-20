// Saves a player photo or team logo into Supabase Storage and returns its public link.
import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/supabaseServer';
import { isLoggedIn } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const fail = (message, status = 400) => NextResponse.json({ error: message }, { status });

export async function POST(req) {
  if (!isLoggedIn()) return fail('Please log in first.', 401);
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') return fail('No image received.');
    if (file.size > 4 * 1024 * 1024) return fail('Image is too large (max 4 MB).');

    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const sb = db();
    const { error } = await sb.storage
      .from('images')
      .upload(path, buffer, { contentType: file.type || 'image/jpeg', upsert: false });
    if (error) return fail(error.message);

    const { data } = sb.storage.from('images').getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (e) {
    return fail(e.message, 500);
  }
}
