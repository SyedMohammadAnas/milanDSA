import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import type { PostgrestError } from '@supabase/supabase-js';

type TicketConfirmation = Database['public']['Tables']['ticket_confirmations']['Row'];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ticketRef = searchParams.get('ticketRef');

    console.log('[VERIFY TICKET API] Searching tickets with reference:', ticketRef);

    if (!ticketRef || ticketRef.length < 2) {
      return NextResponse.json({ tickets: [] });
    }

    const supabase = getSupabaseAdmin();

    // Search in ticket_confirmations with case-insensitive partial matching
    const { data: tickets, error: ticketError } = await supabase
      .from('ticket_confirmations')
      .select('id, name, registration_number, email, booking_reference, event_name, ticket_price')
      .ilike('booking_reference', `%${ticketRef}%`)
      .eq('payment_status', 'completed')
      .limit(10) as { data: TicketConfirmation[] | null, error: PostgrestError | null };

    if (ticketError) {
      console.error('[VERIFY TICKET API] Error searching tickets:', ticketError);
      return NextResponse.json(
        { error: 'Failed to search tickets' },
        { status: 500 }
      );
    }

    if (!tickets || tickets.length === 0) {
      console.log('[VERIFY TICKET API] No tickets found');
      return NextResponse.json({ tickets: [] });
    }

    // Get booking references to check RSVP status
    const bookingRefs = tickets.map(ticket => ticket.booking_reference);

    // Check RSVP status for these tickets
    const { data: rsvpData, error: rsvpError } = await supabase
      .from('rsvp_confirmations')
      .select('ticket_reference, rsvp_status')
      .in('ticket_reference', bookingRefs) as { data: { ticket_reference: string, rsvp_status: string }[] | null, error: PostgrestError | null };

    // Create a map of ticket_reference -> rsvp_status
    const rsvpStatusMap: Record<string, string> = {};
    if (!rsvpError && rsvpData) {
      rsvpData.forEach(rsvp => {
        rsvpStatusMap[rsvp.ticket_reference] = rsvp.rsvp_status;
      });
    }

    // Add RSVP status to each ticket
    const ticketsWithStatus = tickets.map(ticket => ({
      ...ticket,
      rsvp_status: rsvpStatusMap[ticket.booking_reference] || 'not_started'
    }));

    console.log('[VERIFY TICKET API] Found', ticketsWithStatus.length, 'tickets');

    return NextResponse.json({ tickets: ticketsWithStatus });

  } catch (error) {
    console.error('[VERIFY TICKET API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[VERIFY TICKET API] Adding stranded student to selection');

    const body = await request.json();
    const { ticketReference } = body;

    console.log('[VERIFY TICKET API] Ticket reference:', ticketReference);

    if (!ticketReference) {
      return NextResponse.json(
        { error: 'Ticket reference is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get ticket data
    const { data: ticket, error: ticketError } = await supabase
      .from('ticket_confirmations')
      .select('*')
      .eq('booking_reference', ticketReference)
      .eq('payment_status', 'completed')
      .single() as { data: TicketConfirmation | null, error: PostgrestError | null };

    if (ticketError || !ticket) {
      console.log('[VERIFY TICKET API] Ticket not found');
      return NextResponse.json(
        { error: 'Ticket not found or payment not completed' },
        { status: 404 }
      );
    }

    // Check if RSVP already exists
    const { data: existingRsvp } = await supabase
      .from('rsvp_confirmations')
      .select('*')
      .eq('ticket_reference', ticketReference)
      .single();

    if (existingRsvp) {
      console.log('[VERIFY TICKET API] RSVP already exists for this ticket');
      return NextResponse.json({
        success: true,
        message: 'Student already in RSVP list',
        alreadyExists: true
      });
    }

    // Create RSVP confirmation for stranded student
    console.log('[VERIFY TICKET API] Creating RSVP confirmation for stranded student');
    const rsvpQuery = supabase
      .from('rsvp_confirmations')
      // @ts-expect-error - TypeScript type inference issue with insert
      .insert({
        full_name: ticket.name,
        registration_number: ticket.registration_number,
        email: ticket.email,
        ticket_reference: ticket.booking_reference,
        event_name: ticket.event_name,
        rsvp_status: 'ready'
      })

    const { error: insertError } = await rsvpQuery;

    if (insertError) {
      console.error('[VERIFY TICKET API] Error creating RSVP:', insertError);
      return NextResponse.json(
        { error: 'Failed to add student to RSVP list' },
        { status: 500 }
      );
    }

    console.log('[VERIFY TICKET API] Stranded student added to RSVP list successfully');

    return NextResponse.json({
      success: true,
      message: 'Student added to RSVP list'
    });

  } catch (error) {
    console.error('[VERIFY TICKET API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

