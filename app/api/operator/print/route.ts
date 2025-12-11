import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { Database } from '@/lib/database.types';

export async function POST(request: NextRequest) {
  try {
    console.log('[PRINT API] Starting print process');

    const body = await request.json();
    const { operatorId, ticketReferences } = body;

    console.log('[PRINT API] Operator ID:', operatorId);
    console.log('[PRINT API] Ticket references to print:', ticketReferences);

    if (!operatorId || !ticketReferences || ticketReferences.length === 0) {
      console.log('[PRINT API] Missing required data');
      return NextResponse.json(
        { error: 'Operator ID and ticket references are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Update RSVP confirmations to 'printed' status
    console.log('[PRINT API] Updating RSVP confirmations to printed status');
    const { error: updateError } = await supabase
      .from('rsvp_confirmations')
      // @ts-expect-error - Supabase typing issues with update
      .update({
        rsvp_status: 'printed',
        printed_by: operatorId,
        printed_at: new Date().toISOString()
      })
      .in('ticket_reference', ticketReferences);

    if (updateError) {
      console.error('[PRINT API] Error updating RSVP confirmations:', updateError);
      return NextResponse.json(
        { error: 'Failed to update RSVP confirmations' },
        { status: 500 }
      );
    }

    // Increment printed_tickets count for operator
    console.log('[PRINT API] Incrementing printed tickets count for operator');
    const { data: operator, error: operatorError } = await supabase
      .from('operator_data')
      .select('printed_tickets')
      .eq('id', operatorId)
      .single<Database['public']['Tables']['operator_data']['Row']>();

    if (operatorError) {
      console.error('[PRINT API] Error fetching operator data:', operatorError);
      return NextResponse.json(
        { error: 'Failed to fetch operator data' },
        { status: 500 }
      );
    }

    const newCount = (operator.printed_tickets || 0) + ticketReferences.length;

    const { error: incrementError } = await supabase
      .from('operator_data')
      // @ts-expect-error - Supabase typing issues with update
      .update({
        printed_tickets: newCount
      })
      .eq('id', operatorId);

    if (incrementError) {
      console.error('[PRINT API] Error updating operator printed tickets:', incrementError);
      return NextResponse.json(
        { error: 'Failed to update operator data' },
        { status: 500 }
      );
    }

    console.log('[PRINT API] Print process completed successfully');
    console.log('[PRINT API] Total tickets printed by operator:', newCount);

    return NextResponse.json({
      success: true,
      printedCount: ticketReferences.length,
      totalPrinted: newCount
    });

  } catch (error) {
    console.error('[PRINT API] Error during print process:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
