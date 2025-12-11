import Razorpay from 'razorpay'
import crypto from 'crypto'

// Razorpay instance (server-side only)
let razorpayInstance: Razorpay | null = null

/**
 * Get or create Razorpay instance (server-side only)
 */
export const getRazorpayInstance = (): Razorpay => {
  if (typeof window !== 'undefined') {
    throw new Error('Razorpay instance can only be created on the server side')
  }

  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required')
    }

    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })

    console.log('✅ [RAZORPAY] Instance created successfully')
  }

  return razorpayInstance
}

/**
 * Convert rupees to paise
 * @param rupees - Amount in rupees
 * @returns Amount in paise
 */
export const rupeesToPaise = (rupees: number): number => {
  return Math.round(rupees * 100)
}

/**
 * Convert paise to rupees
 * @param paise - Amount in paise
 * @returns Amount in rupees
 */
export const paiseToRupees = (paise: number): number => {
  return paise / 100
}

/**
 * Generate a unique booking reference
 * Format: MILAN-{EVENT_CODE}-{RANDOM_ID}
 */
export const generateBookingReference = (eventName: string): string => {
  const eventCode = eventName
    .split(' ')[0]
    .toUpperCase()
    .substring(0, 6)
  const randomId = crypto.randomBytes(4).toString('hex').toUpperCase()
  const timestamp = Date.now().toString(36).toUpperCase()
  return `MILAN-${eventCode}-${timestamp}${randomId}`
}

/**
 * Generate a unique receipt ID for Razorpay orders
 * Format: MILAN_{EVENT}_{TIMESTAMP}_{RANDOM}
 */
export const generateReceiptId = (eventName: string): string => {
  const eventCode = eventName.replace(/\s+/g, '_').substring(0, 10).toUpperCase()
  const timestamp = Date.now()
  const randomStr = crypto.randomBytes(3).toString('hex')
  return `MILAN_${eventCode}_${timestamp}_${randomStr}`
}

/**
 * Verify Razorpay payment signature using HMAC-SHA256
 * @param orderId - Razorpay order_id
 * @param paymentId - Razorpay payment_id
 * @param signature - Razorpay signature from callback
 * @returns boolean - true if signature is valid
 */
export const verifyPaymentSignature = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keySecret) {
    console.error('❌ [SECURITY] RAZORPAY_KEY_SECRET not found')
    return false
  }

  try {
    // Generate the expected signature
    const body = `${orderId}|${paymentId}`
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex')

    // Compare signatures
    const isValid = expectedSignature === signature

    if (isValid) {
      console.log('🔐 [SECURITY] Payment signature verification: PASSED')
    } else {
      console.warn('⚠️ [SECURITY] Payment signature verification: FAILED')
      console.warn(`   Expected: ${expectedSignature}`)
      console.warn(`   Received: ${signature}`)
    }

    return isValid
  } catch (error) {
    console.error('❌ [SECURITY] Error verifying signature:', error)
    return false
  }
}

/**
 * Verify Razorpay webhook signature
 * @param body - Raw request body (string)
 * @param signature - X-Razorpay-Signature header
 * @returns boolean - true if signature is valid
 */
export const verifyWebhookSignature = (
  body: string,
  signature: string
): boolean => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('❌ [SECURITY] RAZORPAY_WEBHOOK_SECRET not found')
    return false
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex')

    const isValid = expectedSignature === signature

    if (isValid) {
      console.log('🔐 [SECURITY] Webhook signature verification: PASSED')
    } else {
      console.warn('⚠️ [SECURITY] Webhook signature verification: FAILED')
    }

    return isValid
  } catch (error) {
    console.error('❌ [SECURITY] Error verifying webhook signature:', error)
    return false
  }
}

/**
 * Create a Razorpay order
 * @param amount - Amount in rupees
 * @param receiptId - Unique receipt ID
 * @param notes - Additional notes for the order
 */
export const createOrder = async (
  amount: number,
  receiptId: string,
  notes?: Record<string, string>
) => {
  const razorpay = getRazorpayInstance()
  const amountInPaise = rupeesToPaise(amount)

  console.log(`💰 [PAYMENT] Creating order: Amount ₹${amount} (${amountInPaise} paise)`)
  console.log(`📝 [INFO] Receipt ID: ${receiptId}`)

  try {
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: receiptId,
      notes: notes || {},
    })

    console.log(`✅ [SUCCESS] Order created: ${order.id}`)
    return order
  } catch (error) {
    console.error('❌ [ERROR] Failed to create order:', error)
    throw error
  }
}

/**
 * Format timestamp for logging
 */
export const getLogTimestamp = (): string => {
  return new Date().toISOString()
}

/**
 * Logger utility with emojis and timestamps
 */
export const paymentLogger = {
  info: (message: string, data?: unknown) => {
    console.log(`📝 [INFO] [${getLogTimestamp()}] ${message}`, data || '')
  },
  success: (message: string, data?: unknown) => {
    console.log(`✅ [SUCCESS] [${getLogTimestamp()}] ${message}`, data || '')
  },
  warning: (message: string, data?: unknown) => {
    console.warn(`⚠️ [WARNING] [${getLogTimestamp()}] ${message}`, data || '')
  },
  error: (message: string, data?: unknown) => {
    console.error(`❌ [ERROR] [${getLogTimestamp()}] ${message}`, data || '')
  },
  security: (message: string, data?: unknown) => {
    console.log(`🔐 [SECURITY] [${getLogTimestamp()}] ${message}`, data || '')
  },
  payment: (message: string, data?: unknown) => {
    console.log(`💰 [PAYMENT] [${getLogTimestamp()}] ${message}`, data || '')
  },
}

// Type definitions for Razorpay checkout options
export interface RazorpayCheckoutOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  image?: string
  order_id: string
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  notes?: Record<string, string>
  theme?: {
    color?: string
  }
  handler: (response: RazorpayPaymentResponse) => void
  modal?: {
    ondismiss?: () => void
    escape?: boolean
    backdropclose?: boolean
    confirm_close?: boolean
  }
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export interface RazorpayError {
  code: string
  description: string
  source: string
  step: string
  reason: string
  metadata: {
    order_id: string
    payment_id?: string
  }
}

// Declare Razorpay global for TypeScript
declare global {
  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => {
      open: () => void
      close: () => void
      on: (event: string, callback: (response: RazorpayError) => void) => void
    }
  }
}
