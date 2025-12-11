import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import type { PostgrestError } from '@supabase/supabase-js';

type TicketConfirmationRow = Database['public']['Tables']['ticket_confirmations']['Row'];
type RsvpConfirmationRow = Database['public']['Tables']['rsvp_confirmations']['Row'];
type RsvpConfirmationInsert = Database['public']['Tables']['rsvp_confirmations']['Insert'];

export async function POST(request: NextRequest) {
  try {
    console.log('[RSVP CONFIRM API] Starting RSVP confirmation process');

    const body = await request.json();
    const { email } = body;

    console.log('[RSVP CONFIRM API] RSVP request for email:', email);

    if (!email) {
      console.log('[RSVP CONFIRM API] Missing email');
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get student's ticket from ticket_confirmations
    console.log('[RSVP CONFIRM API] Fetching ticket for student');
    const { data: ticket, error: ticketError } = await supabase
      .from('ticket_confirmations')
      .select('*')
      .eq('email', email)
      .eq('payment_status', 'completed')
      .single() as { data: TicketConfirmationRow | null, error: PostgrestError | null };

    if (ticketError || !ticket) {
      console.log('[RSVP CONFIRM API] No completed ticket found for student');
      return NextResponse.json(
        { error: 'No completed ticket found for this student' },
        { status: 404 }
      );
    }

    console.log('[RSVP CONFIRM API] Ticket found:', ticket.booking_reference);

    // Check if RSVP already exists
    const { data: existingRsvp } = await supabase
      .from('rsvp_confirmations')
      .select('*')
      .eq('ticket_reference', ticket.booking_reference)
      .single() as { data: RsvpConfirmationRow | null, error: PostgrestError | null };

    if (existingRsvp) {
      console.log('[RSVP CONFIRM API] RSVP already exists for this ticket');
      return NextResponse.json(
        { error: 'You have already completed RSVP for this ticket' },
        { status: 400 }
      );
    }

    // Create RSVP confirmation
    console.log('[RSVP CONFIRM API] Creating RSVP confirmation');
    const { error: insertError } = await supabase
      .from('rsvp_confirmations')
      .insert({
        full_name: ticket.name,
        registration_number: ticket.registration_number,
        email: ticket.email,
        ticket_reference: ticket.booking_reference,
        event_name: ticket.event_name,
        rsvp_status: 'ready'
      } as RsvpConfirmationInsert);

    if (insertError) {
      console.error('[RSVP CONFIRM API] Error creating RSVP:', insertError);
      return NextResponse.json(
        { error: 'Failed to create RSVP confirmation' },
        { status: 500 }
      );
    }

    console.log('[RSVP CONFIRM API] RSVP confirmation created successfully');

    return NextResponse.json({
      success: true,
      message: 'RSVP confirmed successfully',
      ticket: {
        name: ticket.name,
        event_name: ticket.event_name,
        booking_reference: ticket.booking_reference
      }
    });

  } catch (error) {
    console.error('[RSVP CONFIRM API] Error during RSVP confirmation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
