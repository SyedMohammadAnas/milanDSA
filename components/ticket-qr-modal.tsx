'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'react-qr-code'
import { X, Download, Copy, Check } from 'lucide-react'
import { QRCodeData, qrCodeDataToString, generateQRCodeId } from '@/lib/qr-code'
import { Database } from '@/lib/database.types'

type TicketConfirmationRow = Database['public']['Tables']['ticket_confirmations']['Row']

interface TicketQRModalProps {
  isOpen: boolean
  onClose: () => void
  ticket: TicketConfirmationRow | null
  studentData?: {
    full_name?: string | null
    email: string
    registration_number?: string | null
    batch?: string | null
    program?: string | null
    department?: string | null
    semester?: string | null
    phone_number?: string | null
    personal_email?: string | null
  }
}

export default function TicketQRModal({
  isOpen,
  onClose,
  ticket,
  studentData
}: TicketQRModalProps) {
  const [copied, setCopied] = useState(false)

  const qrData = useMemo(() => {
    if (!ticket || !studentData) return null

    // Create QR code data from ticket and student information
    const qrCodeData: QRCodeData = {
      student: {
        name: studentData?.full_name || 'Unknown',
        email: studentData?.email || 'Unknown',
        registration_number: studentData?.registration_number || 'Unknown',
        batch: studentData?.batch,
        program: studentData?.program,
        department: studentData?.department,
        semester: studentData?.semester,
        phone_number: studentData?.phone_number,
        personal_email: studentData?.personal_email,
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
    return qrCodeData
  }, [ticket, studentData])

  const handleCopyBookingRef = async () => {
    if (ticket?.booking_reference) {
      await navigator.clipboard.writeText(ticket.booking_reference)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownloadQR = () => {
    if (!qrData) return

    // Create a temporary link to download the QR code as SVG
    const svgElement = document.querySelector('.qr-code-svg') as SVGElement
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement)
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const svgUrl = URL.createObjectURL(svgBlob)

      const downloadLink = document.createElement('a')
      downloadLink.href = svgUrl
      downloadLink.download = `MILAN26-${ticket?.booking_reference || 'QR'}.svg`
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
      URL.revokeObjectURL(svgUrl)
    }
  }

  if (!ticket || !qrData) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-yellow-200 rounded-3xl border-2 border-black p-6 md:p-8 max-w-2xl w-full max-h-full overflow-y-auto shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black">
                    Ticket QR Code
                  </h2>
                  <p className="text-black/70 mt-1">
                    MILAN 26&apos; - Event Entry Pass
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-black/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-black" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* QR Code Section */}
                <div className="flex flex-col items-center">
                  <div className="bg-white p-4 rounded-2xl border-2 border-black shadow-lg">
                    <QRCode
                      value={qrCodeDataToString(qrData)}
                      size={200}
                      className="qr-code-svg"
                    />
                  </div>

                  {/* QR Code ID */}
                  <div className="mt-4 text-center">
                    <p className="text-sm text-black/60 uppercase tracking-wide font-semibold">
                      QR ID
                    </p>
                    <p className="font-mono font-bold text-black text-sm">
                      {generateQRCodeId(ticket.id)}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleDownloadQR}
                      className="flex items-center gap-2 px-4 py-2 bg-black text-yellow-200 font-semibold rounded-full hover:bg-black/80 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button
                      onClick={handleCopyBookingRef}
                      className="flex items-center gap-2 px-4 py-2 bg-black/20 text-black font-semibold rounded-full hover:bg-black/30 transition-colors"
                    >
                      {copied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      {copied ? 'Copied!' : 'Copy Ref'}
                    </button>
                  </div>
                </div>

                {/* Ticket Details Section */}
                <div className="space-y-6">
                  {/* Event Info */}
                  <div className="bg-white/80 rounded-2xl border-2 border-black p-4">
                    <h3 className="font-bold text-black text-lg mb-3">Event Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-black/60">Event:</span>
                        <span className="font-semibold text-black">{ticket.event_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-black/60">Date:</span>
                        <span className="font-semibold text-black">
                          {ticket.event_date ? new Date(ticket.event_date).toLocaleDateString('en-IN') : 'TBA'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-black/60">Price:</span>
                        <span className="font-semibold text-black">₹{ticket.ticket_price}</span>
                      </div>
                    </div>
                  </div>

                  {/* Student Info */}
                  <div className="bg-white/80 rounded-2xl border-2 border-black p-4">
                    <h3 className="font-bold text-black text-lg mb-3">Student Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-black/60">Name:</span>
                        <span className="font-semibold text-black">{studentData?.full_name || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-black/60">Registration:</span>
                        <span className="font-semibold text-black">{studentData?.registration_number || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-black/60">Email:</span>
                        <span className="font-semibold text-black text-xs">{studentData?.email || 'Unknown'}</span>
                      </div>
                      {studentData?.batch && (
                        <div className="flex justify-between">
                          <span className="text-black/60">Batch:</span>
                          <span className="font-semibold text-black">{studentData.batch}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Transaction Info */}
                  <div className="bg-white/80 rounded-2xl border-2 border-black p-4">
                    <h3 className="font-bold text-black text-lg mb-3">Transaction Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-black/60">Booking Ref:</span>
                        <span className="font-mono font-semibold text-black text-xs">{ticket.booking_reference}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-black/60">Status:</span>
                        <span className={`font-semibold px-2 py-1 rounded-full text-xs ${
                          ticket.payment_status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : ticket.payment_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {ticket.payment_status.charAt(0).toUpperCase() + ticket.payment_status.slice(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-black/60">Purchased:</span>
                        <span className="font-semibold text-black text-xs">
                          {new Date(ticket.created_at).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="mt-8 p-4 bg-black/10 rounded-2xl border border-black/20">
                <p className="text-black/70 text-sm text-center">
                  This QR code contains all your ticket and personal information.
                  Present this at the event entrance for verification.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
