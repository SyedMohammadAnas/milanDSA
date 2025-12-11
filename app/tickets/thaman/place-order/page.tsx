'use client'

import Image from "next/image"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Script from "next/script"
import type { RazorpayError, RazorpayPaymentResponse } from "@/lib/razorpay"

const eventData = {
  name: "Thaman S",
  title: "Thaman S Live in Concert",
  images: [
    "/ProShowTickets/Thaman/ThamanMain.jpg",
    "/ProShowTickets/Thaman/Thaman1.jpg",
    "/ProShowTickets/Thaman/Thaman2.jpg",
  ],
  categories: ["Music", "Concert", "Pro Show"],
  description: "Experience the musical genius of Thaman S live on stage at MILAN 26. Known for his chart-topping compositions and electrifying performances, Thaman brings his signature sound to the festival.",
  fullDescription: "Experience the musical genius of Thaman S live on stage at MILAN 26. Known for his chart-topping compositions and electrifying performances, Thaman brings his signature sound to the festival. With over 2000+ songs in Telugu, Tamil, Hindi, and other languages, Thaman has redefined music composition in Indian cinema. His unique blend of classical music influences with modern beats creates an unforgettable concert experience that will leave you wanting more. Don't miss this once-in-a-lifetime opportunity to witness the maestro himself perform his greatest hits and new compositions live.",
  tips: [
    "Arrive early to get the best viewing positions",
    "Bring comfortable shoes as you'll be dancing all night",
    "Stay hydrated throughout the performance",
    "Keep your phone charged for capturing memories",
    "Follow venue rules and respect fellow attendees"
  ],
  date: "March 15, 2025",
  time: "8:00 PM",
  duration: "3 hours",
  ageGroup: "All Ages",
  languages: "Multiple (Hindi, Telugu, Tamil)",
  genres: "Film Music, Electronic, Fusion",
  location: "Main Stage, Milan Campus",
  price: 1499,
  bookingStatus: "Tickets selling fast! Limited seats available.",
  priceRange: "₹1,499",
  availability: "Filling Fast"
}

export default function ThamanPlaceOrder() {
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [showFullTips, setShowFullTips] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isLoggedIn] = useState(() => {
    // Initialize login status from localStorage
    const studentEmail = localStorage.getItem('studentEmail')
    const loggedIn = !!studentEmail
    console.log('📝 [AUTH] Login status checked:', loggedIn)
    return loggedIn
  })
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const router = useRouter()

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % eventData.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + eventData.images.length) % eventData.images.length)
  }

  // Payment handler
  const handleBookNow = async () => {
    console.log('💰 [PAYMENT] Book Now clicked')
    setPaymentError(null)

    // Check if user is logged in
    const studentEmail = localStorage.getItem('studentEmail')
    if (!studentEmail) {
      console.log('❌ [AUTH] User not logged in, redirecting to login')
      router.push('/login')
      return
    }

    // Check if Razorpay is loaded
    if (!razorpayLoaded || typeof window === 'undefined' || !window.Razorpay) {
      console.log('⏳ [PAYMENT] Razorpay not loaded yet, waiting...')
      setPaymentError('Payment gateway is loading. Please wait and try again.')
      return
    }

    setIsLoading(true)
    console.log('📝 [PAYMENT] Creating order for:', studentEmail)

    try {
      // Step 1: Create order on backend
      console.log('🔄 [PAYMENT] Calling create-order API...')
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: eventData.name,
          eventDate: eventData.date,
          ticketPrice: eventData.price,
          studentEmail,
        }),
      })

      const orderData = await orderResponse.json()
      console.log('📝 [PAYMENT] Order response:', orderData)

      if (!orderData.success) {
        console.error('❌ [PAYMENT] Order creation failed:', orderData.message)
        setPaymentError(orderData.message || 'Failed to create order')
        setIsLoading(false)
        return
      }

      console.log('✅ [PAYMENT] Order created:', orderData.orderId)

      // Step 2: Validate Razorpay key configuration
      const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      if (!razorpayKeyId) {
        console.error('❌ [PAYMENT] Razorpay key not configured. Please set NEXT_PUBLIC_RAZORPAY_KEY_ID in .env.local')
        setPaymentError('Payment gateway is not properly configured. Please contact support.')
        setIsLoading(false)
        return
      }

      // Step 3: Configure Razorpay options
      const options = {
        key: razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'MILAN 26',
        description: `${eventData.name} Ticket`,
        image: '/Sprites/MilanLogo.png',
        order_id: orderData.orderId,
        prefill: {
          name: orderData.studentData?.name || '',
          email: orderData.studentData?.email || studentEmail,
        },
        notes: {
          event_name: eventData.name,
          booking_reference: orderData.bookingReference,
        },
        theme: {
          color: '#EAB308',
        },
        handler: async function (response: RazorpayPaymentResponse) {
          console.log('✅ [PAYMENT] Payment successful, verifying...')
          console.log('📝 [PAYMENT] Payment ID:', response.razorpay_payment_id)
          console.log('📝 [PAYMENT] Order ID:', response.razorpay_order_id)

          // Step 3: Verify payment on backend
          try {
            console.log('🔄 [PAYMENT] Calling verify-payment API...')
            const verifyResponse = await fetch('/api/payment/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                eventName: eventData.name,
                eventDate: eventData.date,
                ticketPrice: eventData.price,
                studentEmail,
              }),
            })

            const verifyData = await verifyResponse.json()
            console.log('📝 [PAYMENT] Verify response:', verifyData)

            if (verifyData.success) {
              console.log('🎉 [PAYMENT] Payment verified! Booking Reference:', verifyData.bookingReference)
              alert(`🎉 Payment Successful!\n\nBooking Reference: ${verifyData.bookingReference}\n\nYou can view your ticket in your account page.`)
              router.push('/account')
            } else {
              console.error('❌ [PAYMENT] Verification failed:', verifyData.message)
              setPaymentError(verifyData.message || 'Payment verification failed')
            }
          } catch (error) {
            console.error('❌ [PAYMENT] Verification error:', error)
            setPaymentError('Payment verification failed. Please contact support.')
          }

          setIsLoading(false)
        },
        modal: {
          ondismiss: function () {
            console.log('⚠️ [PAYMENT] Payment modal closed by user')
            setIsLoading(false)
          },
          escape: true,
          backdropclose: false,
        },
      }

      // Step 5: Open Razorpay checkout
      console.log('🔓 [PAYMENT] Opening Razorpay checkout...')
      const razorpay = new window.Razorpay(options)

      razorpay.on('payment.failed', function (response: RazorpayError) {
        console.error('❌ [PAYMENT] Payment failed:', response)
        setPaymentError(`Payment failed: ${response.description}`)
        setIsLoading(false)
      })

      razorpay.open()
    } catch (error) {
      console.error('❌ [PAYMENT] Error:', error)
      setPaymentError('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Load Razorpay Script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onLoad={() => {
          console.log('✅ [RAZORPAY] Checkout script loaded')
          setRazorpayLoaded(true)
        }}
        onError={() => {
          console.error('❌ [RAZORPAY] Failed to load checkout script')
          setPaymentError('Failed to load payment gateway. Please refresh the page.')
        }}
      />

      {/* Header with Share Icon - Add padding top to avoid header overlap */}
      <div className="container mx-auto px-4 py-6 pt-24">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-4">
            <Link href="/tickets" className="text-blue-600" data-no-cursor-text>
              ← Back to Tickets
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-black">{eventData.title}</h1>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Event Banner and Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Banner with Carousel */}
            <div className="relative w-full rounded-lg overflow-hidden bg-gray-100">
              <div className="relative w-full flex items-center justify-center" style={{ minHeight: '600px' }}>
                <Image
                  src={eventData.images[currentImageIndex]}
                  alt={`${eventData.name} - Image ${currentImageIndex + 1}`}
                  width={1200}
                  height={800}
                  className="object-contain w-full h-auto max-h-[800px]"
                  priority={currentImageIndex === 0}
                  sizes="(max-width: 768px) 100vw, 66vw"
                />
              </div>

              {/* Navigation Arrows */}
              {eventData.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors z-10"
                    aria-label="Previous image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors z-10"
                    aria-label="Next image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Carousel Dots */}
              {eventData.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {eventData.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentImageIndex ? 'bg-white w-8' : 'bg-white/50'
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Category Tags */}
            <div className="flex flex-wrap gap-3">
              {eventData.categories.map((category, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 cursor-pointer transition-colors"
                >
                  {category}
                </span>
              ))}
            </div>

            {/* About The Event */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-black">About The Event</h2>
              <p className="text-gray-700 leading-relaxed">
                {showFullDescription ? eventData.fullDescription : eventData.description}
                {!showFullDescription && eventData.fullDescription.length > eventData.description.length && (
                  <span>...</span>
                )}
              </p>
              {eventData.fullDescription.length > eventData.description.length && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {showFullDescription ? "Read Less" : "Read More"}
                </button>
              )}
            </div>

            {/* You Should Know */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-black">You Should Know</h2>
              <div className="space-y-3">
                {eventData.tips.slice(0, showFullTips ? eventData.tips.length : 1).map((tip, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                    <p className="text-gray-700">{tip}</p>
                  </div>
                ))}
              </div>
              {eventData.tips.length > 1 && (
                <button
                  onClick={() => setShowFullTips(!showFullTips)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {showFullTips ? "See Less" : "See More"}
                </button>
              )}
            </div>
          </div>

          {/* Right Column - Booking Information */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-white border border-gray-200 rounded-lg p-6 shadow-lg space-y-6">
              {/* Event Details */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Date</p>
                  <p className="text-lg font-semibold text-black">{eventData.date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Time</p>
                  <p className="text-lg font-semibold text-black">{eventData.time}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Duration</p>
                  <p className="text-lg font-semibold text-black">{eventData.duration}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Age Group</p>
                  <p className="text-lg font-semibold text-black">{eventData.ageGroup}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Languages</p>
                  <p className="text-lg font-semibold text-black">{eventData.languages}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Genres</p>
                  <p className="text-lg font-semibold text-black">{eventData.genres}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Location</p>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-lg font-semibold text-black">{eventData.location}</p>
                    <button className="ml-2 p-1 hover:bg-gray-100 rounded">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Booking Status */}
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-yellow-800">{eventData.bookingStatus}</p>
              </div>

              {/* Pass Option */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold text-black mb-2">Buy All Days Pass Now</h3>
                <p className="text-sm text-gray-600 mb-4">Enjoy the event across all days!</p>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-black">{eventData.priceRange}</span>
                  </div>
                  <p className={`text-sm font-medium ${eventData.availability === "Filling Fast" ? "text-orange-600" : "text-green-600"}`}>
                    {eventData.availability}
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {paymentError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-800">{paymentError}</p>
                </div>
              )}

              {/* Login Prompt */}
              {!isLoggedIn && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-blue-800">Please <Link href="/login" className="underline font-medium">login</Link> to book tickets.</p>
                </div>
              )}

              {/* Book Now Button */}
              <button
                onClick={handleBookNow}
                disabled={isLoading}
                className={`w-full font-bold py-4 px-6 rounded-full text-lg transition-all shadow-lg ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white hover:shadow-xl'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Book Now'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
