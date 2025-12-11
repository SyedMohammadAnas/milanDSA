import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';

    console.log('[RSVP LIST API] Fetching RSVP confirmations with search:', search);

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('rsvp_confirmations')
      .select('*')
      .eq('rsvp_status', 'ready')
      .order('created_at', { ascending: false });

    // Apply search filter if provided
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,registration_number.ilike.%${search}%,ticket_reference.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[RSVP LIST API] Error fetching RSVP confirmations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch RSVP confirmations' },
        { status: 500 }
      );
    }

    console.log('[RSVP LIST API] Found', data?.length || 0, 'RSVP confirmations');

    return NextResponse.json({ rsvps: data || [] });

  } catch (error) {
    console.error('[RSVP LIST API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

