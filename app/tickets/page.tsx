'use client'

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { useRouter } from "next/navigation"

export default function Tickets() {
  const router = useRouter()
  const thamanTicketRef = useRef<HTMLDivElement>(null)
  const thripleTicketRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [showBookButton, setShowBookButton] = useState(false)
  const thamanAudioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    // Preload audio immediately for faster loading
    if (thamanAudioRef.current) {
      thamanAudioRef.current.load()
    }

    // Enable audio playback on first user interaction
    const enableAudio = () => {
      if (thamanAudioRef.current) {
        thamanAudioRef.current.muted = false
        thamanAudioRef.current.volume = 1
      }
      // Remove listeners after first interaction
      document.removeEventListener('click', enableAudio)
      document.removeEventListener('keydown', enableAudio)
      document.removeEventListener('touchstart', enableAudio)
    }

    // Add listeners for user interaction
    document.addEventListener('click', enableAudio)
    document.addEventListener('keydown', enableAudio)
    document.addEventListener('touchstart', enableAudio)

    // Mouse movement tracking for cursor-following button
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)

    // Thaman ticket animations
    const thamanLeft = thamanTicketRef.current?.querySelector('.thaman-left') as HTMLElement
    const thamanRight = thamanTicketRef.current?.querySelector('.thaman-right') as HTMLElement
    const thamanCd = thamanTicketRef.current?.querySelector('.thaman-cd') as HTMLElement

    if (thamanLeft && thamanRight && thamanCd) {
      // Set initial transform origins and positions immediately to prevent glitching
      // Use immediateRender: true to set values instantly without animation
      // force3D: true helps with performance and prevents glitching
      gsap.set(thamanLeft, { transformOrigin: "0% 100%", immediateRender: true })
      gsap.set(thamanRight, { transformOrigin: "100% 100%", immediateRender: true })
      gsap.set(thamanCd, {
        transformOrigin: "0% 100%",
        x: -400,
        y: 0,
        rotation: 0,
        opacity: 0,
        immediateRender: true,
        force3D: true
      })

      // CD hover handlers for book button and audio
      thamanCd.addEventListener('mouseenter', async () => {
        setShowBookButton(true)
        try {
          await thamanAudioRef.current?.play()
        } catch {
          // Handle autoplay restriction - audio will play on user interaction
          console.log('Audio autoplay blocked - will play on user interaction')
        }
      })
      thamanCd.addEventListener('mouseleave', () => {
        setShowBookButton(false)
        thamanAudioRef.current?.pause()
        if (thamanAudioRef.current) {
          thamanAudioRef.current.currentTime = 0 // Reset to beginning
        }
      })
      // CD click handler to navigate to place order page
      thamanCd.addEventListener('click', () => {
        router.push('/tickets/thaman/place-order')
      })

      // Track if CD has been shown for the first time
      let thamanCdShown = false

      // Add hover animations
      thamanTicketRef.current?.addEventListener('mouseenter', () => {
        gsap.to(thamanLeft, { rotation: -10, duration: 0.5, ease: "power2.out" })
        gsap.to(thamanRight, { rotation: 15, duration: 0.5, ease: "power2.out" })
        if (!thamanCdShown) {
          gsap.to(thamanCd, { opacity: 1, duration: 0.3, ease: "power2.out" })
          thamanCdShown = true
        }
        gsap.to(thamanCd, { x: -225, y: -438, rotation: -10, duration: 0.5, ease: "power2.out" })
        // Start continuous rotation after initial animation
        gsap.to(thamanCd, {
          rotation: "+=360",
          duration: 2.5,
          ease: "none",
          repeat: -1,
          delay: 0.5,
          transformOrigin: "50% 50%"
        })
      })

      thamanTicketRef.current?.addEventListener('mouseleave', () => {
        gsap.to(thamanLeft, { rotation: 0, duration: 0.5, ease: "power2.out" })
        gsap.to(thamanRight, { rotation: 0, duration: 0.5, ease: "power2.out" })
        gsap.to(thamanCd, { x: -400, y: -250, rotation: 0, duration: 0.5, ease: "power2.out" })
        // Kill continuous rotation
        gsap.killTweensOf(thamanCd, "rotation")
        setShowBookButton(false)
        // Stop audio when leaving ticket area
        thamanAudioRef.current?.pause()
        if (thamanAudioRef.current) {
          thamanAudioRef.current.currentTime = 0
        }
      })
    }

    // Thriple ticket animations
    const thripleLeft = thripleTicketRef.current?.querySelector('.thriple-left') as HTMLElement
    const thripleRight = thripleTicketRef.current?.querySelector('.thriple-right') as HTMLElement
    const thripleCd = thripleTicketRef.current?.querySelector('.thriple-cd') as HTMLElement

    if (thripleLeft && thripleRight && thripleCd) {
      // Set initial transform origins and positions immediately to prevent glitching
      // Use immediateRender: true to set values instantly without animation
      // force3D: true helps with performance and prevents glitching
      gsap.set(thripleLeft, { transformOrigin: "0% 100%", immediateRender: true })
      gsap.set(thripleRight, { transformOrigin: "100% 100%", immediateRender: true })
      gsap.set(thripleCd, {
        transformOrigin: "0% 100%",
        x: -400,
        y: 0,
        rotation: 0,
        opacity: 0,
        immediateRender: true,
        force3D: true
      })

      // CD hover handlers for book button
      thripleCd.addEventListener('mouseenter', () => setShowBookButton(true))
      thripleCd.addEventListener('mouseleave', () => setShowBookButton(false))
      // CD click handler to navigate to place order page
      thripleCd.addEventListener('click', () => {
        router.push('/tickets/thriple/place-order')
      })

      // Track if CD has been shown for the first time
      let thripleCdShown = false

      // Add hover animations
      thripleTicketRef.current?.addEventListener('mouseenter', () => {
        gsap.to(thripleLeft, { rotation: -10, duration: 0.5, ease: "power2.out" })
        gsap.to(thripleRight, { rotation: 15, duration: 0.5, ease: "power2.out" })
        if (!thripleCdShown) {
          gsap.to(thripleCd, { opacity: 1, duration: 0.3, ease: "power2.out" })
          thripleCdShown = true
        }
        gsap.to(thripleCd, { x: -225, y: -438, rotation: -10, duration: 0.5, ease: "power2.out" })
        // Start continuous rotation after initial animation
        gsap.to(thripleCd, {
          rotation: "+=360",
          duration: 2.5,
          ease: "none",
          repeat: -1,
          delay: 0.5,
          transformOrigin: "50% 50%"
        })
      })

      thripleTicketRef.current?.addEventListener('mouseleave', () => {
        gsap.to(thripleLeft, { rotation: 0, duration: 0.5, ease: "power2.out" })
        gsap.to(thripleRight, { rotation: 0, duration: 0.5, ease: "power2.out" })
        gsap.to(thripleCd, { x: -400, y: -250, rotation: 0, duration: 0.5, ease: "power2.out" })
        // Kill continuous rotation
        gsap.killTweensOf(thripleCd, "rotation")
        setShowBookButton(false)
      })
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('click', enableAudio)
      document.removeEventListener('keydown', enableAudio)
      document.removeEventListener('touchstart', enableAudio)
    }
  }, [router])

  return (
    <div className="relative w-full min-h-screen">
      {/* Hero Section with Background Image */}
      <div className="relative w-full h-screen overflow-hidden">
        <Image
          src="/BackgroundImages/TicketBackgroundImage.png"
          alt="Ticket Background"
          fill
          className="object-contain object-top"
          priority
        />

        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white z-10">
            <h1 className="text-6xl md:text-8xl font-bold mb-6 drop-shadow-2xl">
              Tickets
            </h1>
            <p className="text-xl md:text-3xl mb-8 drop-shadow-xl opacity-95">
              Get your tickets for MILAN 26&apos;
            </p>
            <button className="bg-white text-black px-8 py-4 text-lg font-semibold rounded-full hover:bg-gray-100 transition-colors drop-shadow-xl">
              Purchase Tickets
            </button>
          </div>
        </div>
      </div>

      {/* Pro Show Tickets Section */}
      <div className="relative w-full py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold text-center text-black mb-50 drop-shadow-xl">
            Pro Show Tickets
          </h2>

          <div className="space-y-50">
            {/* Thaman Ticket */}
            <div ref={thamanTicketRef} className="flex justify-center items-center -ml-30 cursor-pointer">
              <div className="relative flex">
                <Image
                  src="/ProShowTickets/Thaman/ThamanLeft1.png"
                  alt="Thaman Ticket Left"
                  width={1100}
                  height={1300}
                  className="object-contain thaman-left relative z-30"
                />
                <Image
                  src="/ProShowTickets/Thaman/ThamanCD.png"
                  alt="Thaman CD"
                  width={500}
                  height={500}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 object-contain thaman-cd z-20"
                  style={{ left: '1000px' }}
                />
                <Image
                  src="/ProShowTickets/Thaman/ThamanRight1.png"
                  alt="Thaman Ticket Right"
                  width={320}
                  height={420}
                  className="object-contain thaman-right relative z-10"
                />
              </div>
            </div>

            {/* Thriple Ticket */}
            <div ref={thripleTicketRef} className="flex justify-center items-center -ml-30 cursor-pointer">
              <div className="relative flex">
                <Image
                  src="/ProShowTickets/Thriple/ThripleLeft1.png"
                  alt="Thriple Ticket Left"
                  width={1100}
                  height={1300}
                  className="object-contain thriple-left relative z-30"
                />
                <Image
                  src="/ProShowTickets/Thriple/ThripleCD.png"
                  alt="Thriple CD"
                  width={500}
                  height={500}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 object-contain thriple-cd z-20"
                  style={{ left: '1000px' }}
                />
                <Image
                  src="/ProShowTickets/Thriple/ThripleRight1.png"
                  alt="Thriple Ticket Right"
                  width={320}
                  height={420}
                  className="object-contain thriple-right relative z-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Cursor-following Book Now Button */}
        {showBookButton && (
          <div
            className="fixed pointer-events-none z-50"
            style={{
              left: mousePosition.x + 20,
              top: mousePosition.y - 40,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <Image
              src="/Sprites/BookNowButton.png"
              alt="Book Now"
              width={400}
              height={150}
              className="object-contain drop-shadow-lg"
            />
          </div>
        )}

        {/* Hidden audio element for Thaman CD - Preload for faster loading */}
        <audio
          ref={thamanAudioRef}
          src="/Audios/DumMasala.mp3"
          preload="auto"
          loop
          muted
        />
      </div>
    </div>
  )
}
