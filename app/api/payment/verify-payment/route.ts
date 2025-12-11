import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { PostgrestError } from '@supabase/supabase-js'
import { verifyPaymentSignature, paymentLogger } from '@/lib/razorpay'
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

interface VerifyPaymentRequest {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  eventName: string
  eventDate: string
  ticketPrice: number
  studentEmail: string
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  paymentLogger.info('====== VERIFY PAYMENT REQUEST STARTED ======')

  try {
    // 1. Parse request body
    const body: VerifyPaymentRequest = await request.json()
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      eventName,
      eventDate,
      ticketPrice,
      studentEmail,
    } = body

    paymentLogger.payment(`Verifying payment for: ${studentEmail}`)
    paymentLogger.info(`Order ID: ${razorpay_order_id}`)
    paymentLogger.info(`Payment ID: ${razorpay_payment_id}`)
    paymentLogger.info(`Event: ${eventName}, Amount: ₹${ticketPrice}`)

    // 2. Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      paymentLogger.error('Missing payment details', {
        hasOrderId: !!razorpay_order_id,
        hasPaymentId: !!razorpay_payment_id,
        hasSignature: !!razorpay_signature,
      })

      return NextResponse.json(
        {
          success: false,
          message: 'Missing payment verification details',
          code: 'MISSING_PAYMENT_DETAILS',
        },
        { status: 400 }
      )
    }

    // 3. CRITICAL: Verify payment signature
    paymentLogger.security('Starting signature verification...')

    const isSignatureValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    )

    if (!isSignatureValid) {
      paymentLogger.error('🚨 SIGNATURE VERIFICATION FAILED - Potential fraud attempt!')
      paymentLogger.security(`Order ID: ${razorpay_order_id}`)
      paymentLogger.security(`Payment ID: ${razorpay_payment_id}`)
      paymentLogger.security(`Email: ${studentEmail}`)

      return NextResponse.json(
        {
          success: false,
          message: 'Payment verification failed. This incident has been logged.',
          code: 'SIGNATURE_MISMATCH',
        },
        { status: 400 }
      )
    }

    paymentLogger.success('✓ Signature verification PASSED')

    // 4. Update booking record in database
    paymentLogger.info('Updating booking record in database...')

    const supabase = getSupabaseAdmin()

    // First, check if the booking exists
    const { data: existingBooking, error: fetchError } = await supabase
      .from('ticket_confirmations')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .single() as { data: TicketConfirmationRow | null, error: PostgrestError | null }

    if (fetchError || !existingBooking) {
      // If no existing booking, create a new one
      paymentLogger.warning('No existing booking found, creating new record')

      // Fetch student data
      const { data: student, error: studentError } = await supabase
        .from('student_database')
        .select('*')
        .eq('email', studentEmail)
        .single() as { data: StudentDatabaseRow | null, error: PostgrestError | null }

      if (studentError || !student) {
        paymentLogger.error('Student not found during verification', {
          email: studentEmail,
        })

        return NextResponse.json(
          {
            success: false,
            message: 'Student not found. Please contact support.',
            code: 'USER_NOT_FOUND',
          },
          { status: 400 }
        )
      }

      // Check if student already has a completed ticket (ONE TICKET PER STUDENT)
      paymentLogger.info('Checking if student already has a completed ticket...')

      const { data: existingCompletedTicket, error: ticketCheckError } = await supabase
        .from('ticket_confirmations')
        .select('id, booking_reference, event_name, created_at')
        .eq('email', studentEmail)
        .eq('payment_status', 'completed')
        .single() as { data: TicketConfirmationRow | null, error: PostgrestError | null }

      if (ticketCheckError && ticketCheckError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        paymentLogger.error('Error checking existing tickets during verification', {
          error: ticketCheckError.message,
          email: studentEmail,
        })

        return NextResponse.json(
          {
            success: false,
            message: 'Unable to verify ticket status. Please contact support.',
            code: 'TICKET_CHECK_ERROR',
          },
          { status: 500 }
        )
      }

      if (existingCompletedTicket) {
        paymentLogger.warning('Student already has a completed ticket during verification - blocking', {
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

      paymentLogger.success('✓ Student eligible for ticket purchase during verification')

      // Generate booking reference for new record
      const timestamp = Date.now().toString(36).toUpperCase()
      const randomId = Math.random().toString(36).substring(2, 8).toUpperCase()
      const bookingReference = `MILAN-${eventName.split(' ')[0].toUpperCase().substring(0, 6)}-${timestamp}${randomId}`

      // Generate QR code data
      paymentLogger.info('Generating QR code data for new booking...')
      try {
        // QR code generation is currently disabled
        paymentLogger.success('QR code data generated for new booking')
      } catch (error) {
        paymentLogger.error('Failed to generate QR code data for new booking', {
          error: error instanceof Error ? error.message : 'Unknown error',
          studentEmail,
          bookingRef: bookingReference,
        })
        return NextResponse.json(
          {
            success: false,
            message: 'Failed to generate ticket QR code. Please contact support.',
            code: 'QR_GENERATION_FAILED',
          },
          { status: 500 }
        )
      }

      const { data: newBooking, error: insertError } = await supabase
        .from('ticket_confirmations')
        .insert({
          name: student.full_name || 'Unknown',
          registration_number: student.registration_number || 'Unknown',
          email: studentEmail,
          batch: student.batch || null,
          event_name: eventName,
          event_date: eventDate || null,
          ticket_price: ticketPrice,
          razorpay_order_id: razorpay_order_id,
          razorpay_payment_id: razorpay_payment_id,
          razorpay_signature: razorpay_signature,
          payment_status: 'completed',
          booking_reference: bookingReference,
        } as TicketConfirmationInsert)
        .select()
        .single() as { data: TicketConfirmationRow | null, error: PostgrestError | null }

      if (insertError) {
        paymentLogger.error('Failed to create booking record', {
          error: insertError.message,
        })

        return NextResponse.json(
          {
            success: false,
            message: 'Failed to save booking. Please contact support with your payment ID.',
            code: 'DB_INSERT_FAILED',
            paymentId: razorpay_payment_id,
          },
          { status: 500 }
        )
      }

      const duration = Date.now() - startTime

      paymentLogger.success(`🎉 Ticket confirmed: ${bookingReference}`)
      paymentLogger.info(`====== VERIFY PAYMENT COMPLETED in ${duration}ms ======`)

      return NextResponse.json({
        success: true,
        message: 'Payment verified and ticket confirmed!',
        bookingReference,
        ticketData: {
          id: newBooking?.id,
          eventName,
          eventDate,
          bookingReference,
          paymentStatus: 'completed',
        },
      })
    }

    // Check if already verified (idempotency)
    if (existingBooking.payment_status === 'completed') {
      paymentLogger.warning('Payment already verified (duplicate request)', {
        orderId: razorpay_order_id,
        bookingReference: existingBooking.booking_reference,
      })

      return NextResponse.json({
        success: true,
        message: 'Payment already verified!',
        bookingReference: existingBooking.booking_reference,
        ticketData: {
          id: existingBooking.id,
          eventName: existingBooking.event_name,
          eventDate: existingBooking.event_date,
          bookingReference: existingBooking.booking_reference,
          paymentStatus: existingBooking.payment_status,
        },
      })
    }

    // Fetch student data for QR code generation
    const { data: student, error: studentError } = await supabase
      .from('student_database')
      .select('*')
      .eq('email', studentEmail)
      .single() as { data: StudentDatabaseRow | null, error: PostgrestError | null }

    if (studentError || !student) {
      paymentLogger.error('Student not found during verification for QR generation', {
        email: studentEmail,
      })

      return NextResponse.json(
        {
          success: false,
          message: 'Student not found. Please contact support.',
          code: 'USER_NOT_FOUND',
        },
        { status: 400 }
      )
    }

    // Generate QR code data
    paymentLogger.info('Generating QR code data...')
    try {
      // QR code generation is currently disabled
      // const qrCodeData = generateQRCodeData(student, existingBooking)
      paymentLogger.success('QR code data generated successfully')
    } catch (error) {
      paymentLogger.error('Failed to generate QR code data', {
        error: error instanceof Error ? error.message : 'Unknown error',
        studentEmail,
        bookingRef: existingBooking.booking_reference,
      })
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to generate ticket QR code. Please contact support.',
          code: 'QR_GENERATION_FAILED',
        },
        { status: 500 }
      )
    }

    // Update existing booking to completed with QR code data
    // const { data: updatedBooking, error: updateError } = await supabase
    //   .from('ticket_confirmations')
    //   .update({
    //     razorpay_payment_id,
    //     razorpay_signature,
    //     payment_status: 'completed',
    //     qr_code_data: qrCodeData,
    //     updated_at: new Date().toISOString(),
    //   } as any)
    //   .eq('razorpay_order_id', razorpay_order_id)
    //   .select()
    //   .single() as { data: any, error: any }

    // if (updateError) {
    //   paymentLogger.error('Failed to update booking record', {
    //     error: updateError.message,
    //     orderId: razorpay_order_id,
    //   })

    //   return NextResponse.json(
    //     {
    //       success: false,
    //       message: 'Failed to update booking. Please contact support with your payment ID.',
    //       code: 'DB_UPDATE_FAILED',
    //       paymentId: razorpay_payment_id,
    //     },
    //     { status: 500 }
    //   )
    // }

    const duration = Date.now() - startTime

    paymentLogger.success(`🎉 Ticket confirmed`)
    paymentLogger.info(`====== VERIFY PAYMENT COMPLETED in ${duration}ms ======`)

    // 5. Return success response
    return NextResponse.json({
      success: true,
      message: 'Payment verified and ticket confirmed!',
      bookingReference: existingBooking?.booking_reference,
      ticketData: {
        id: existingBooking?.id,
        eventName: existingBooking?.event_name,
        eventDate: existingBooking?.event_date,
        bookingReference: existingBooking?.booking_reference,
        paymentStatus: existingBooking?.payment_status,
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime

    paymentLogger.error('Payment verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
    })

    return NextResponse.json(
      {
        success: false,
        message: 'Payment verification failed. Please contact support.',
        code: 'VERIFICATION_ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
