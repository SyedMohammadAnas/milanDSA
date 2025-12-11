import { Database } from './database.types'

type StudentDatabaseRow = Database['public']['Tables']['student_database']['Row']
type TicketConfirmationRow = Database['public']['Tables']['ticket_confirmations']['Row']

export interface QRCodeData {
  // Student Information
  student: {
    name: string
    email: string
    registration_number: string
    batch?: string | null
    program?: string | null
    department?: string | null
    semester?: string | null
    phone_number?: string | null
    personal_email?: string | null
  }

  // Ticket Information
  ticket: {
    id: string
    event_name: string
    event_date?: string | null
    booking_reference: string
    ticket_price: number
    payment_status: 'pending' | 'completed' | 'failed'
    created_at: string
  }

  // Transaction Information
  transaction: {
    razorpay_order_id: string
    razorpay_payment_id?: string | null
    razorpay_signature?: string | null
  }

  // Metadata
  metadata: {
    event: string
    generated_at: string
    version: string
  }
}

/**
 * Generate QR code data containing all student, ticket, and transaction information
 */
export function generateQRCodeData(
  student: StudentDatabaseRow,
  ticket: TicketConfirmationRow
): QRCodeData {
  return {
    student: {
      name: student.full_name || 'Unknown',
      email: student.email,
      registration_number: student.registration_number || 'Unknown',
      batch: student.batch,
      program: student.program,
      department: student.department,
      semester: student.semester,
      phone_number: student.phone_number,
      personal_email: student.personal_email,
    },
    ticket: {
      id: ticket.id,
      event_name: ticket.event_name,
      event_date: ticket.event_date,
      booking_reference: ticket.booking_reference,
      ticket_price: ticket.ticket_price,
      payment_status: ticket.payment_status,
      created_at: ticket.created_at,
    },
    transaction: {
      razorpay_order_id: ticket.razorpay_order_id,
      razorpay_payment_id: ticket.razorpay_payment_id,
      razorpay_signature: ticket.razorpay_signature,
    },
    metadata: {
      event: 'MILAN 26\'',
      generated_at: new Date().toISOString(),
      version: '1.0',
    },
  }
}

/**
 * Convert QR code data to JSON string for QR code generation
 */
export function qrCodeDataToString(data: QRCodeData): string {
  return JSON.stringify(data, null, 2)
}

/**
 * Generate a unique QR code identifier for the ticket
 */
export function generateQRCodeId(ticketId: string): string {
  return `MILAN26-${ticketId.slice(-8).toUpperCase()}`
}

/**
 * Validate QR code data structure
 */
export function validateQRCodeData(data: unknown): data is QRCodeData {
  return (
    data !== null &&
    typeof data === 'object' &&
    'student' in data &&
    'ticket' in data &&
    'transaction' in data &&
    'metadata' in data &&
    typeof (data as QRCodeData).metadata === 'object' &&
    (data as QRCodeData).metadata.event === 'MILAN 26\''
  )
}
