import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { PostgrestError } from '@supabase/supabase-js'
import {
  createOrder,
  generateReceiptId,
  generateBookingReference,
  paymentLogger,
} from '@/lib/razorpay'
import { Database } from '@/lib/database.types'

type StudentDatabaseRow = Database['public']['Tables']['student_database']['Row']
type TicketConfirmationRow = Database['public']['Tables']['ticket_confirmations']['Row']

// Create Supabase admin client for server-side operations
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

interface CreateOrderRequest {
  eventName: string
  eventDate: string
  ticketPrice: number
  studentEmail: string
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  paymentLogger.info('====== CREATE ORDER REQUEST STARTED ======')

  try {
    // 1. Parse request body
    const body: CreateOrderRequest = await request.json()
    const { eventName, eventDate, ticketPrice, studentEmail } = body

    paymentLogger.payment(`Creating order for: ${studentEmail}`)
    paymentLogger.info(`Event: ${eventName}, Amount: ₹${ticketPrice}`)

    // 2. Validate required fields
    if (!eventName || !ticketPrice || !studentEmail) {
      paymentLogger.error('Missing required fields', {
        eventName: !!eventName,
        ticketPrice: !!ticketPrice,
        studentEmail: !!studentEmail,
      })

      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: eventName, ticketPrice, studentEmail',
          code: 'MISSING_FIELDS',
        },
        { status: 400 }
      )
    }

    // 3. Validate student session and fetch student data
    paymentLogger.info('Fetching student data from database...')

    const supabase = getSupabaseAdmin()
    const { data: student, error: studentError } = await supabase
      .from('student_database')
      .select('*')
      .eq('email', studentEmail)
      .single() as { data: StudentDatabaseRow | null, error: PostgrestError | null }

    if (studentError || !student) {
      paymentLogger.error('Student not found in database', {
        email: studentEmail,
        error: studentError?.message,
      })

      return NextResponse.json(
        {
          success: false,
          message: 'Student not found. Please log in again.',
          code: 'USER_NOT_FOUND',
        },
        { status: 401 }
      )
    }

    paymentLogger.success(`Student found: ${student.full_name || 'Unknown'}`)

    // 4. Check if student already has a completed ticket (ONE TICKET PER STUDENT)
    paymentLogger.info('Checking if student already has a completed ticket...')

    const { data: existingCompletedTicket, error: ticketCheckError } = await supabase
      .from('ticket_confirmations')
      .select('id, booking_reference, event_name, created_at')
      .eq('email', studentEmail)
      .eq('payment_status', 'completed')
      .single() as { data: TicketConfirmationRow | null, error: PostgrestError | null }

    if (ticketCheckError && ticketCheckError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      paymentLogger.error('Error checking existing tickets', {
        error: ticketCheckError.message,
        email: studentEmail,
      })

      return NextResponse.json(
        {
          success: false,
          message: 'Unable to verify ticket status. Please try again.',
          code: 'TICKET_CHECK_ERROR',
        },
        { status: 500 }
      )
    }

    if (existingCompletedTicket) {
      paymentLogger.warning('Student already has a completed ticket - blocking new purchase', {
        email: studentEmail,
        existingBookingRef: existingCompletedTicket.booking_reference,
        existingEvent: existingCompletedTicket.event_name,
        existingPurchaseDate: existingCompletedTicket.created_at,
      })

      return NextResponse.json(
        {
          success: false,
          message: 'You have already purchased a ticket for MILAN 26\'. Only one ticket per student is allowed.',
          code: 'ALREADY_HAS_TICKET',
          existingTicket: {
            bookingReference: existingCompletedTicket.booking_reference,
            eventName: existingCompletedTicket.event_name,
            purchaseDate: existingCompletedTicket.created_at,
          },
        },
        { status: 400 }
      )
    }

    paymentLogger.success('✓ Student eligible for ticket purchase')

    // 6. Generate unique identifiers
    const receiptId = generateReceiptId(eventName)
    const bookingReference = generateBookingReference(eventName)

    paymentLogger.info(`Receipt ID: ${receiptId}`)
    paymentLogger.info(`Booking Reference: ${bookingReference}`)

    // 7. Create Razorpay order
    const notes = {
      event_name: eventName,
      event_date: eventDate || '',
      student_email: studentEmail,
      student_name: student.full_name || '',
      registration_number: student.registration_number || '',
      booking_reference: bookingReference,
    }

    paymentLogger.payment(`Creating Razorpay order...`)

    const order = await createOrder(ticketPrice, receiptId, notes)

    paymentLogger.success(`Razorpay order created: ${order.id}`)

    // 8. Create initial booking record in database (status: pending)
    paymentLogger.info('Creating initial booking record...')

    const { data: booking, error: bookingError } = await supabase
      .from('ticket_confirmations')
      .insert({
        name: student.full_name || 'Unknown',
        registration_number: student.registration_number || 'Unknown',
        email: studentEmail,
        batch: student.batch || null,
        event_name: eventName,
        event_date: eventDate || null,
        ticket_price: ticketPrice,
        razorpay_order_id: order.id,
        payment_status: 'pending',
        booking_reference: bookingReference,
      } as TicketConfirmationInsert)
      .select()
      .single() as { data: TicketConfirmationRow | null, error: PostgrestError | null }

    if (bookingError) {
      paymentLogger.error('Failed to create initial booking record', {
        error: bookingError.message,
      })
      // Don't fail the request, as the order is already created
      // The payment can still proceed and be verified
    } else {
      paymentLogger.success(`Initial booking record created: ${booking?.id}`)
    }

    const duration = Date.now() - startTime

    paymentLogger.info(`====== CREATE ORDER COMPLETED in ${duration}ms ======`)

    // 9. Return success response
    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      bookingReference,
      studentData: {
        name: student.full_name || 'Unknown',
        email: student.email,
        registrationNumber: student.registration_number || '',
        batch: student.batch || '',
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime

    paymentLogger.error('Order creation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
    })

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create order. Please try again.',
        code: 'ORDER_CREATION_FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
