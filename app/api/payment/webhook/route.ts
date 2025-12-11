import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { PostgrestError } from '@supabase/supabase-js'
import { verifyWebhookSignature, paymentLogger } from '@/lib/razorpay'
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

interface RazorpayWebhookPayload {
  entity: string
  account_id: string
  event: string
  contains: string[]
  payload: {
    payment?: {
      entity: {
        id: string
        entity: string
        amount: number
        currency: string
        status: string
        order_id: string
        invoice_id: string | null
        international: boolean
        method: string
        amount_refunded: number
        refund_status: string | null
        captured: boolean
        description: string
        card_id: string | null
        bank: string | null
        wallet: string | null
        vpa: string | null
        email: string
        contact: string
        notes: Record<string, string>
        fee: number
        tax: number
        error_code: string | null
        error_description: string | null
        error_source: string | null
        error_step: string | null
        error_reason: string | null
        acquirer_data: Record<string, string>
        created_at: number
      }
    }
    order?: {
      entity: {
        id: string
        entity: string
        amount: number
        amount_paid: number
        amount_due: number
        currency: string
        receipt: string
        offer_id: string | null
        status: string
        attempts: number
        notes: Record<string, string>
        created_at: number
      }
    }
  }
  created_at: number
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  paymentLogger.info('====== WEBHOOK REQUEST RECEIVED ======')

  try {
    // 1. Get raw body for signature verification
    const rawBody = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    paymentLogger.info('Webhook signature received:', !!signature)

    // 2. Verify webhook signature (if webhook secret is configured)
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

    if (webhookSecret && signature) {
      paymentLogger.security('Verifying webhook signature...')

      const isValid = verifyWebhookSignature(rawBody, signature)

      if (!isValid) {
        paymentLogger.error('🚨 WEBHOOK SIGNATURE VERIFICATION FAILED!')
        return NextResponse.json(
          { success: false, message: 'Invalid webhook signature' },
          { status: 401 }
        )
      }

      paymentLogger.success('✓ Webhook signature verification PASSED')
    } else {
      paymentLogger.warning('Webhook secret not configured, skipping signature verification')
    }

    // 3. Parse webhook payload
    const payload: RazorpayWebhookPayload = JSON.parse(rawBody)
    const eventType = payload.event

    paymentLogger.info(`Webhook event type: ${eventType}`)
    paymentLogger.info(`Account ID: ${payload.account_id}`)

    // 4. Handle different event types
    switch (eventType) {
      case 'payment.captured':
        await handlePaymentCaptured(payload)
        break

      case 'payment.failed':
        await handlePaymentFailed(payload)
        break

      case 'payment.authorized':
        paymentLogger.info('Payment authorized (auto-capture enabled, waiting for capture)')
        break

      case 'order.paid':
        paymentLogger.info('Order paid event received')
        break

      default:
        paymentLogger.warning(`Unhandled webhook event: ${eventType}`)
    }

    const duration = Date.now() - startTime

    paymentLogger.info(`====== WEBHOOK PROCESSED in ${duration}ms ======`)

    return NextResponse.json({ success: true, message: 'Webhook processed' })
  } catch (error) {
    const duration = Date.now() - startTime

    paymentLogger.error('Webhook processing failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
    })

    // Return 200 to prevent Razorpay from retrying
    // Log the error for investigation
    return NextResponse.json({ success: false, message: 'Webhook processing error' })
  }
}

async function handlePaymentCaptured(payload: RazorpayWebhookPayload) {
  paymentLogger.payment('Processing payment.captured webhook')

  const payment = payload.payload.payment?.entity
  if (!payment) {
    paymentLogger.error('No payment entity in webhook payload')
    return
  }

  const paymentId = payment.id
  const orderId = payment.order_id
  const amount = payment.amount
  const status = payment.status

  paymentLogger.info(`Payment ID: ${paymentId}`)
  paymentLogger.info(`Order ID: ${orderId}`)
  paymentLogger.info(`Amount: ₹${amount / 100}`)
  paymentLogger.info(`Status: ${status}`)

  // Check if booking already exists and is completed
  const supabase = getSupabaseAdmin()

  const { data: existingBooking, error: fetchError } = await supabase
    .from('ticket_confirmations')
    .select('*')
    .eq('razorpay_order_id', orderId)
    .single() as { data: TicketConfirmationRow | null, error: PostgrestError | null }

  if (fetchError) {
    paymentLogger.warning('No existing booking found for order', { orderId })

    // Try to create a new booking from webhook data
    const notes = payment.notes || {}
    const studentEmail = notes.student_email || payment.email

    if (!studentEmail) {
      paymentLogger.error('Cannot create booking: no student email found')
      return
    }

    // Fetch student data
    const { data: student, error: studentError } = await supabase
      .from('student_database')
      .select('*')
      .eq('email', studentEmail)
      .single() as { data: StudentDatabaseRow | null, error: PostgrestError | null }

    if (studentError || !student) {
      paymentLogger.error('Student not found for webhook booking', { email: studentEmail })
      return
    }

    // Generate booking reference
    const eventName = notes.event_name || 'MILAN Event'
    const timestamp = Date.now().toString(36).toUpperCase()
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase()
    const bookingReference = `MILAN-${eventName.split(' ')[0].toUpperCase().substring(0, 6)}-${timestamp}${randomId}`

    const webhookQuery = supabase.from('ticket_confirmations')
      // @ts-expect-error - TypeScript type inference issue with insert
      .insert({
        name: student.full_name || notes.student_name || 'Unknown',
        registration_number: student.registration_number || notes.registration_number || 'Unknown',
        email: studentEmail,
        batch: student.batch || null,
        event_name: eventName,
        event_date: notes.event_date || null,
        ticket_price: amount / 100,
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        payment_status: 'completed',
        booking_reference: bookingReference,
      })

    const { error: insertError } = await webhookQuery

    if (insertError) {
      paymentLogger.error('Failed to create booking from webhook', {
        error: insertError.message,
      })
    } else {
      paymentLogger.success(`Created booking from webhook: ${bookingReference}`)
    }

    return
  }

  // Booking exists - check if already completed
  if (existingBooking && existingBooking.payment_status === 'completed') {
    paymentLogger.info('Booking already completed, skipping update', {
      bookingReference: existingBooking.booking_reference,
    })
    return
  }

  // Update existing booking to completed
  const updateQuery = supabase
    .from('ticket_confirmations')
    // @ts-expect-error - TypeScript type inference issue with update
    .update({
      razorpay_payment_id: paymentId,
      payment_status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_order_id', orderId)

  const { error: updateError } = await updateQuery

  if (updateError) {
    paymentLogger.error('Failed to update booking from webhook', {
      error: updateError.message,
      orderId,
    })
  } else {
    paymentLogger.success(`Updated booking from webhook: ${existingBooking?.booking_reference}`)
  }
}

async function handlePaymentFailed(payload: RazorpayWebhookPayload) {
  paymentLogger.payment('Processing payment.failed webhook')

  const payment = payload.payload.payment?.entity
  if (!payment) {
    paymentLogger.error('No payment entity in webhook payload')
    return
  }

  const paymentId = payment.id
  const orderId = payment.order_id
  const errorCode = payment.error_code
  const errorDescription = payment.error_description

  paymentLogger.error(`Payment failed: ${paymentId}`)
  paymentLogger.error(`Order ID: ${orderId}`)
  paymentLogger.error(`Error Code: ${errorCode}`)
  paymentLogger.error(`Error Description: ${errorDescription}`)

  // Update booking status to failed
  const supabase = getSupabaseAdmin()

  const failedUpdateQuery = supabase
    .from('ticket_confirmations')
    // @ts-expect-error - TypeScript type inference issue with update
    .update({
      razorpay_payment_id: paymentId,
      payment_status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_order_id', orderId)

  const { error: updateError } = await failedUpdateQuery

  if (updateError) {
    paymentLogger.error('Failed to update booking status to failed', {
      error: updateError.message,
      orderId,
    })
  } else {
    paymentLogger.info('Updated booking status to failed')
  }
}

// Handle GET request (for webhook verification)
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Razorpay webhook endpoint is active',
    timestamp: new Date().toISOString(),
  })
}
