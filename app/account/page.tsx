'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'
import TicketQRModal from '@/components/ticket-qr-modal'
import QRScannerModal from '@/components/qr-scanner-modal'
import { generateRSVPQRData } from '@/lib/rsvp-qr'

type StudentDatabaseRow = Database['public']['Tables']['student_database']['Row']
type TicketConfirmationRow = Database['public']['Tables']['ticket_confirmations']['Row']

export default function AccountPage() {
  const [student, setStudent] = useState<StudentDatabaseRow | null>(null)
  const [tickets, setTickets] = useState<TicketConfirmationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [ticketsLoading, setTicketsLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<TicketConfirmationRow | null>(null)
  const [rsvpScannerOpen, setRsvpScannerOpen] = useState(false)
  const router = useRouter()

  // Function to refresh student data from database
  const refreshStudentData = async () => {
    try {
      console.log('🔄 [ACCOUNT] Refreshing student data...')

      const studentEmail = localStorage.getItem('studentEmail')
      if (!studentEmail) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('student_database')
        .select('*')
        .eq('email', studentEmail)
        .single<StudentDatabaseRow>()

      if (error) {
        console.error('❌ [ACCOUNT] Error refreshing student data:', error)
        return
      }

      console.log('✅ [ACCOUNT] Student data refreshed')
      console.log('📱 [ACCOUNT] Phone number:', data?.phone_number)
      console.log('📧 [ACCOUNT] Personal email:', data?.personal_email)
      setStudent(data)
    } catch (err) {
      console.error('❌ [ACCOUNT] Error refreshing data:', err)
    }
  }

  const handleLogout = () => {
    // Clear session data
    localStorage.removeItem('studentEmail')
    // Clear student state
    setStudent(null)
    setTickets([])
    setDataLoaded(false)
    // Redirect to login
    router.push('/login')
  }

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        // Get student email from localStorage
        const studentEmail = localStorage.getItem('studentEmail')

        if (!studentEmail) {
          // No session found, redirect to login
          router.push('/login')
          return
        }

        console.log('📝 [ACCOUNT] Fetching student data for:', studentEmail)

        // Fetch student data from database
        const { data, error } = await supabase
          .from('student_database')
          .select('*')
          .eq('email', studentEmail)
          .single<StudentDatabaseRow>()

        if (error) {
          console.error('❌ [ACCOUNT] Error fetching student data:', error)
          router.push('/login')
          return
        }

        console.log('✅ [ACCOUNT] Student data loaded:', data?.full_name)
        console.log('📱 [ACCOUNT] Phone number:', data?.phone_number)
        console.log('📧 [ACCOUNT] Personal email:', data?.personal_email)
        setStudent(data)

        // Small delay to show the yellow box animation after data is loaded
        setTimeout(() => {
          setDataLoaded(true)
        }, 300)

        // Fetch tickets for this student
        console.log('📝 [ACCOUNT] Fetching tickets for:', studentEmail)
        const { data: ticketsData, error: ticketsError } = await supabase
          .from('ticket_confirmations')
          .select('*')
          .eq('email', studentEmail)
          .order('created_at', { ascending: false })

        if (ticketsError) {
          console.error('❌ [ACCOUNT] Error fetching tickets:', ticketsError)
        } else {
          console.log('✅ [ACCOUNT] Tickets loaded:', ticketsData?.length || 0)
          setTickets(ticketsData || [])
        }

        setTicketsLoading(false)
      } catch (err) {
        console.error('❌ [ACCOUNT] Error:', err)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchStudentData()
  }, [router])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Handle opening QR modal
  const handleViewQR = (ticket: TicketConfirmationRow) => {
    setSelectedTicket(ticket)
    setQrModalOpen(true)
  }

  // Handle RSVP - Open camera to scan QR code
  const handleRSVP = () => {
    console.log('📱 [ACCOUNT] RSVP button clicked - Opening QR scanner modal')
    setRsvpScannerOpen(true)
  }

  // Handle QR scan result
  const handleRSVPScan = (scannedData: string) => {
    console.log('📱 [ACCOUNT] QR scanned:', scannedData)

    // Check if the scanned QR is the valid RSVP QR
    const expectedQR = generateRSVPQRData()

    if (scannedData === expectedQR || scannedData.includes('/rsvp?source=station_qr')) {
      console.log('✅ [ACCOUNT] Valid RSVP QR scanned, redirecting to RSVP page')
      setRsvpScannerOpen(false)
      router.push('/rsvp?source=station_qr&scanned=true')
    } else {
      console.log('❌ [ACCOUNT] Invalid QR scanned')
      alert('Invalid QR code. Please scan the official RSVP QR code displayed at the station.')
      // Keep scanner open for another try
    }
  }

  // Handle updating student fields
  const handleUpdateField = async (field: 'phone_number' | 'personal_email', value: string) => {
    if (!student) return

    console.log('🔄 [ACCOUNT] Starting update for field:', field, 'with value:', value)
    setUpdating(true)
    try {
      console.log('📡 [ACCOUNT] Calling API to update student record with ID:', student.id)

      const response = await fetch('/api/update-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: student.id,
          field,
          value
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ [ACCOUNT] API error:', result.error)
        alert('Failed to update. Please try again.')
        return
      }

      console.log('✅ [ACCOUNT] API update successful, returned data:', result.data)

      // Update local state with the returned data
      if (result.data) {
        setStudent(result.data)
        console.log('✅ [ACCOUNT] Local state updated with API data')
      } else {
        // Fallback: refresh data from database
        console.log('⚠️ [ACCOUNT] No data returned, refreshing from database...')
        await refreshStudentData()
      }

      // Show success message
      const fieldName = field === 'phone_number' ? 'Phone number' : 'Personal email'
      alert(`${fieldName} updated successfully!`)
    } catch (err) {
      console.error('❌ [ACCOUNT] Error:', err)
      alert('Failed to update. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="min-h-screen relative">
      {/* Milan Logo in top left corner */}
      <div className="absolute top-6 right-20 z-50">
        <Image
          src="/Sprites/MilanLogo.png"
          alt="Milan Logo"
          width={300}
          height={240}
          className="object-contain"
        />
      </div>

      {/* Purple block with background image */}
      <div className="relative h-[100vh] w-full overflow-hidden">
        <Image
          src="/BackgroundImages/AccountBackground.png"
          alt="Account Background"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Yellow block with student data - overlapping purple block */}
      <div className="relative -mt-[70vh] mx-4 md:mx-8 lg:mx-70 z-10">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-yellow-200 rounded-tl-3xl rounded-tr-3xl rounded-bl-3xl rounded-br-3xl border-2 border-black p-8 md:p-12 shadow-lg"
            >
              <div className="flex items-center justify-center py-12">
                <div className="text-black text-xl font-semibold">Loading student data...</div>
              </div>
            </motion.div>
          ) : student && dataLoaded ? (
            <motion.div
              key="student-data"
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="bg-yellow-200 rounded-tl-3xl rounded-tr-3xl rounded-bl-3xl rounded-br-3xl border-2 border-black p-8 md:p-12 shadow-lg relative"
            >
              <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
                {/* Avatar placeholder circle */}
                <div className="w-20 h-20 rounded-full border-2 border-black bg-transparent flex-shrink-0"></div>

                {/* Student name and registration */}
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold text-black mb-2">
                    {student.full_name || 'Student Name'}
                  </h2>
                  <p className="text-lg md:text-xl text-black/80">
                    {student.registration_number || 'Registration Number'}
                  </p>
                </div>
              </div>

              {/* All other student data */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t-2 border-black/20">
                {/* Column 1 */}
                <div className="space-y-4">
                  {student.email && (
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-black/60 uppercase tracking-wide">Email : </p>
                      <p className="text-base md:text-md text-black font-medium">{student.email}</p>
                    </div>
                  )}

                  {student.program && (
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-black/60 uppercase tracking-wide">Program : </p>
                      <p className="text-base md:text-md text-black font-medium">{student.program}</p>
                    </div>
                  )}

                  {student.department && (
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-black/60 uppercase tracking-wide">Department : </p>
                      <p className="text-base md:text-md text-black font-medium">{student.department}</p>
                    </div>
                  )}
                </div>

                {/* Column 2 */}
                <div className="space-y-4">
                  {student.specialization && (
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-black/60 uppercase tracking-wide">Specialization : </p>
                      <p className="text-base md:text-md text-black font-medium">{student.specialization}</p>
                    </div>
                  )}

                  {student.semester && (
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-black/60 uppercase tracking-wide">Semester</p>
                      <p className="text-base md:text-md text-black font-medium">{student.semester}</p>
                    </div>
                  )}

                  {student.batch && (
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-black/60 uppercase tracking-wide">Batch : </p>
                      <p className="text-base md:text-md text-black font-medium">{student.batch}</p>
                    </div>
                  )}
                </div>

                {/* Column 3 - Editable fields */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-black/60 uppercase tracking-wide">Phone Number</p>
                    <div className="flex items-center gap-2">
                      <p className="text-base md:text-md text-black font-medium flex-1">
                        {student.phone_number || 'Not provided'}
                      </p>
                      <button
                        className="text-black/60 hover:text-black transition-colors disabled:opacity-50"
                        disabled={updating}
                        onClick={() => {
                          const newPhone = prompt('Enter your phone number (leave empty to clear):', student.phone_number || '');
                          if (newPhone !== null) {
                            if (newPhone.trim() === '') {
                              // Clear the field
                              handleUpdateField('phone_number', '');
                            } else {
                              // Basic phone number validation
                              if (!/^\+?[\d\s\-\(\)]+$/.test(newPhone.trim())) {
                                alert('Please enter a valid phone number');
                                return;
                              }
                              handleUpdateField('phone_number', newPhone);
                            }
                          }
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-black/60 uppercase tracking-wide">Personal Email</p>
                    <div className="flex items-center gap-2">
                      <p className="text-base md:text-md text-black font-medium flex-1">
                        {student.personal_email || 'Not provided'}
                      </p>
                      <button
                        className="text-black/60 hover:text-black transition-colors disabled:opacity-50"
                        disabled={updating}
                        onClick={() => {
                          const newEmail = prompt('Enter your personal email (leave empty to clear):', student.personal_email || '');
                          if (newEmail !== null) {
                            if (newEmail.trim() === '') {
                              // Clear the field
                              handleUpdateField('personal_email', '');
                            } else {
                              // Basic email validation
                              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
                                alert('Please enter a valid email address');
                                return;
                              }
                              handleUpdateField('personal_email', newEmail);
                            }
                          }
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logout button in bottom right corner */}
              <div className="absolute bottom-4 right-4">
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 shadow-md"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Tickets History Section */}
        {dataLoaded && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 bg-yellow-200 rounded-3xl border-2 border-black p-8 md:p-10 shadow-lg"
          >
            <h3 className="text-2xl font-bold text-black mb-6 flex items-center gap-3">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              Tickets History
            </h3>

            {ticketsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3">
                  <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-black font-medium">Loading tickets...</span>
                </div>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-black/30 rounded-2xl">
                <svg className="w-16 h-16 mx-auto text-black/40 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                <p className="text-black/60 font-medium text-lg">No tickets purchased yet</p>
                <p className="text-black/40 text-sm mt-2">Your purchased tickets will appear here</p>
                <a
                  href="/tickets"
                  className="inline-block mt-4 px-6 py-2 bg-black text-yellow-200 font-semibold rounded-full hover:bg-black/80 transition-colors"
                >
                  Browse Events
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket, index) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-white/80 backdrop-blur rounded-2xl border-2 border-black p-5 shadow-md hover:shadow-lg transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Event Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-bold text-black text-lg">{ticket.event_name}</h4>
                            <p className="text-black/60 text-sm">{ticket.event_date || 'Date TBA'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Booking Details */}
                      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                        <div className="text-left md:text-center">
                          <p className="text-xs text-black/50 uppercase tracking-wide font-semibold">Booking Ref</p>
                          <p className="font-mono font-bold text-black text-sm">{ticket.booking_reference}</p>
                        </div>
                        <div className="text-left md:text-center">
                          <p className="text-xs text-black/50 uppercase tracking-wide font-semibold">Price</p>
                          <p className="font-bold text-black">₹{ticket.ticket_price}</p>
                        </div>
                        <div className="text-left md:text-center">
                          <p className="text-xs text-black/50 uppercase tracking-wide font-semibold">Purchased</p>
                          <p className="text-black text-sm">{formatDate(ticket.created_at)}</p>
                        </div>
                      </div>

                      {/* Right: Status Badge and QR Button */}
                      <div className="flex-shrink-0 flex flex-col md:flex-row items-end md:items-center gap-3">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(ticket.payment_status)}`}>
                          {ticket.payment_status === 'completed' && (
                            <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                          {ticket.payment_status === 'pending' && (
                            <svg className="w-4 h-4 mr-1.5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          )}
                          {ticket.payment_status === 'failed' && (
                            <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                          {ticket.payment_status.charAt(0).toUpperCase() + ticket.payment_status.slice(1)}
                        </span>

                        {/* View QR Button - Only show for completed tickets */}
                        {ticket.payment_status === 'completed' && (
                          <button
                            onClick={() => handleViewQR(ticket)}
                            className="bg-black text-yellow-200 font-semibold py-2 px-4 rounded-full hover:bg-black/80 transition-colors duration-200 shadow-md text-sm"
                          >
                            View QR
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Payment ID (if completed) */}
                    {ticket.payment_status === 'completed' && ticket.razorpay_payment_id && (
                      <div className="mt-4 pt-4 border-t border-black/10">
                        <p className="text-xs text-black/40">
                          Payment ID: <span className="font-mono">{ticket.razorpay_payment_id}</span>
                        </p>
                      </div>
                    )}

                    {/* RSVP Button - Bottom right corner for completed tickets */}
                    {ticket.payment_status === 'completed' && (
                      <div className="-mt-4 flex justify-end">
                        <button
                          onClick={() => handleRSVP()}
                          className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-full hover:bg-blue-700 transition-all duration-200 shadow-md flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          RSVP
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Bottom padding */}
      <div className="h-20"></div>

      {/* QR Modal */}
      <TicketQRModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        ticket={selectedTicket}
        studentData={student ? {
          full_name: student.full_name,
          email: student.email,
          registration_number: student.registration_number,
          batch: student.batch,
          program: student.program,
          department: student.department,
          semester: student.semester,
          phone_number: student.phone_number,
          personal_email: student.personal_email,
        } : undefined}
      />

      {/* RSVP QR Scanner Modal */}
      <QRScannerModal
        isOpen={rsvpScannerOpen}
        onClose={() => setRsvpScannerOpen(false)}
        onScan={handleRSVPScan}
        title="Scan RSVP QR Code"
        description="Scan the official RSVP QR code displayed at the station"
      />
    </div>
  )
}
