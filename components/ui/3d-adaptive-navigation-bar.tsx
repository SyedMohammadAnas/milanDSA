'use client'

import React, { useState, useRef, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, useSpring, AnimatePresence } from 'framer-motion'

interface NavItem {
  label: string
  id: string
  path: string
}

/**

 * 3D Adaptive Navigation Pill

 * Smart navigation with scroll detection and hover expansion

 */

export const PillBase: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()

  const [expanded, setExpanded] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Check if user is logged in
  React.useEffect(() => {
    const checkLoginStatus = () => {
      const studentEmail = localStorage.getItem('studentEmail')
      setIsLoggedIn(!!studentEmail)
    }

    checkLoginStatus()
    // Listen for storage changes (e.g., when user logs in/out in another tab)
    window.addEventListener('storage', checkLoginStatus)

    return () => {
      window.removeEventListener('storage', checkLoginStatus)
    }
  }, [pathname]) // Also check when pathname changes (e.g., after login redirect)

  const navItems: NavItem[] = useMemo(() => {
    const baseItems: NavItem[] = [
      { label: 'Home', id: 'home', path: '/' },
      { label: 'Team', id: 'team', path: '/team' },
      { label: 'Gallery', id: 'gallery', path: '/gallery' },
      { label: 'Explore', id: 'explore', path: '/explore' },
      { label: 'Tickets', id: 'tickets', path: '/tickets' },
    ]

    // Add login/account item based on login status
    if (isLoggedIn) {
      baseItems.push({ label: 'Account', id: 'account', path: '/account' })
    } else {
      baseItems.push({ label: 'Log in', id: 'login', path: '/login' })
    }

    return baseItems
  }, [isLoggedIn])

  // Detect mobile screen size
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Get active section based on current pathname - use useMemo to derive state
  const activeSection = useMemo(() => {
    const currentItem = navItems.find(item => item.path === pathname)
    // Handle account page when logged in
    if (pathname === '/account' && isLoggedIn) {
      return 'account'
    }
    return currentItem?.id || 'home'
  }, [pathname, navItems, isLoggedIn])

  // Spring animations for smooth motion

  const pillWidth = useSpring(140, { stiffness: 220, damping: 25, mass: 1 })

  const pillShift = useSpring(0, { stiffness: 220, damping: 25, mass: 1 })

  // No scroll detection - purely click-based navigation

  // Handle hover expansion - use callback to avoid setState in effect
  React.useEffect(() => {
    if (hovering) {
      // Use requestAnimationFrame to defer state update
      requestAnimationFrame(() => {
        setExpanded(true)
      })
      // Use smaller width on mobile
      pillWidth.set(isMobile ? 300 : 600)

      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    } else {
      hoverTimeoutRef.current = setTimeout(() => {
        requestAnimationFrame(() => {
          setExpanded(false)
        })
        pillWidth.set(140)
      }, 600)
    }

    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [hovering, pillWidth, isMobile])

  const handleMouseEnter = () => {

    setHovering(true)

  }

  const handleMouseLeave = () => {

    setHovering(false)

  }

  const handleSectionClick = (item: NavItem) => {
    // Trigger transition state
    setIsTransitioning(true)

    // Navigate to the route
    router.push(item.path)

    // Collapse the pill after selection
    setHovering(false)
    setExpanded(false)

    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false)
    }, 400)
  }

  // Handle click on mobile to toggle expansion
  const handleClick = (e: React.MouseEvent) => {
    if (isMobile) {
      // If clicking on the nav container (not a button), toggle expansion
      const target = e.target as HTMLElement
      const isButton = target.closest('button') !== null

      if (!isButton && !expanded) {
        // Expand on click if not already expanded
        setHovering(true)
      }
    }
  }

  // Close navigation on scroll (mobile only)
  React.useEffect(() => {
    if (!isMobile || !expanded) return

    const handleScroll = () => {
      setHovering(false)
      setExpanded(false)
      pillWidth.set(140)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isMobile, expanded, pillWidth])

  // Close navigation when clicking outside (mobile only)
  React.useEffect(() => {
    if (!isMobile || !expanded) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setHovering(false)
        setExpanded(false)
        pillWidth.set(140)
      }
    }

    // Use a small delay to avoid closing immediately when opening
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isMobile, expanded, pillWidth])

  const activeItem = navItems.find(item => item.id === activeSection)

  // Don't render navigation on operator pages
  if (pathname?.startsWith('/operator')) {
    return null;
  }

  return (

    <motion.nav

      onMouseEnter={handleMouseEnter}

      onMouseLeave={handleMouseLeave}

      onClick={handleClick}

      className="relative rounded-full"

      style={{

        width: pillWidth,

        height: '56px',

        background: `

          linear-gradient(135deg,

            #fcfcfd 0%,

            #f8f8fa 15%,

            #f3f4f6 30%,

            #eeeff2 45%,

            #e9eaed 60%,

            #e4e5e8 75%,

            #dee0e3 90%,

            #e2e3e6 100%

          )

        `,

        boxShadow: expanded

          ? `

            0 2px 4px rgba(0, 0, 0, 0.08),

            0 6px 12px rgba(0, 0, 0, 0.12),

            0 12px 24px rgba(0, 0, 0, 0.14),

            0 24px 48px rgba(0, 0, 0, 0.10),

            inset 0 2px 2px rgba(255, 255, 255, 0.8),

            inset 0 -3px 8px rgba(0, 0, 0, 0.12),

            inset 3px 3px 8px rgba(0, 0, 0, 0.10),

            inset -3px 3px 8px rgba(0, 0, 0, 0.09),

            inset 0 -1px 2px rgba(0, 0, 0, 0.08)

          `

          : isTransitioning

          ? `

            0 3px 6px rgba(0, 0, 0, 0.10),

            0 8px 16px rgba(0, 0, 0, 0.08),

            0 16px 32px rgba(0, 0, 0, 0.06),

            0 1px 2px rgba(0, 0, 0, 0.10),

            inset 0 2px 1px rgba(255, 255, 255, 0.85),

            inset 0 -2px 6px rgba(0, 0, 0, 0.08),

            inset 2px 2px 8px rgba(0, 0, 0, 0.06),

            inset -2px 2px 8px rgba(0, 0, 0, 0.05),

            inset 0 0 1px rgba(0, 0, 0, 0.12),

            inset 0 0 20px rgba(255, 255, 255, 0.15)

          `

          : `

            0 3px 6px rgba(0, 0, 0, 0.12),

            0 8px 16px rgba(0, 0, 0, 0.10),

            0 16px 32px rgba(0, 0, 0, 0.08),

            0 1px 2px rgba(0, 0, 0, 0.12),

            inset 0 2px 1px rgba(255, 255, 255, 0.7),

            inset 0 -2px 6px rgba(0, 0, 0, 0.10),

            inset 2px 2px 8px rgba(0, 0, 0, 0.08),

            inset -2px 2px 8px rgba(0, 0, 0, 0.07),

            inset 0 0 1px rgba(0, 0, 0, 0.15)

          `,

        x: pillShift,

        overflow: 'hidden',

        transition: 'box-shadow 0.3s ease-out',

      }}

    >

      {/* Primary top edge ridge - ultra bright */}

      <div

        className="absolute inset-x-0 top-0 rounded-t-full pointer-events-none"

        style={{

          height: '2px',

          background: 'linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.95) 5%, rgba(255, 255, 255, 1) 15%, rgba(255, 255, 255, 1) 85%, rgba(255, 255, 255, 0.95) 95%, rgba(255, 255, 255, 0) 100%)',

          filter: 'blur(0.3px)',

        }}

      />



      {/* Top hemisphere light catch */}

      <div

        className="absolute inset-x-0 top-0 rounded-full pointer-events-none"

        style={{

          height: '55%',

          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.25) 30%, rgba(255, 255, 255, 0.10) 60%, rgba(255, 255, 255, 0) 100%)',

        }}

      />



      {/* Directional light - top left */}

      <div

        className="absolute inset-0 rounded-full pointer-events-none"

        style={{

          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.40) 0%, rgba(255, 255, 255, 0.20) 20%, rgba(255, 255, 255, 0.08) 40%, rgba(255, 255, 255, 0) 65%)',

        }}

      />



      {/* Premium gloss reflection - main */}

      <div

        className="absolute rounded-full pointer-events-none"

        style={{

          left: expanded ? '18%' : '15%',

          top: '16%',

          width: expanded ? '140px' : '60px',

          height: '14px',

          background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.70) 0%, rgba(255, 255, 255, 0.35) 40%, rgba(255, 255, 255, 0.10) 70%, rgba(255, 255, 255, 0) 100%)',

          filter: 'blur(4px)',

          transform: 'rotate(-12deg)',

          transition: 'all 0.3s ease',

        }}

      />



      {/* Secondary gloss accent - only show when expanded */}

      {expanded && (

        <div

          className="absolute rounded-full pointer-events-none"

          style={{

            right: '22%',

            top: '20%',

            width: '80px',

            height: '10px',

            background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.50) 0%, rgba(255, 255, 255, 0.15) 60%, rgba(255, 255, 255, 0) 100%)',

            filter: 'blur(3px)',

            transform: 'rotate(8deg)',

          }}

        />

      )}



      {/* Left edge illumination - only show when expanded */}

      {expanded && (

        <div

          className="absolute inset-y-0 left-0 rounded-l-full pointer-events-none"

          style={{

            width: '35%',

            background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.10) 40%, rgba(255, 255, 255, 0.03) 70%, rgba(255, 255, 255, 0) 100%)',

          }}

        />

      )}



      {/* Right edge shadow - only show when expanded */}

      {expanded && (

        <div

          className="absolute inset-y-0 right-0 rounded-r-full pointer-events-none"

          style={{

            width: '35%',

            background: 'linear-gradient(270deg, rgba(0, 0, 0, 0.10) 0%, rgba(0, 0, 0, 0.05) 40%, rgba(0, 0, 0, 0.02) 70%, rgba(0, 0, 0, 0) 100%)',

          }}

        />

      )}



      {/* Bottom curvature - deep shadow */}

      <div

        className="absolute inset-x-0 bottom-0 rounded-b-full pointer-events-none"

        style={{

          height: '50%',

          background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.14) 0%, rgba(0, 0, 0, 0.08) 25%, rgba(0, 0, 0, 0.03) 50%, rgba(0, 0, 0, 0) 100%)',

        }}

      />

      {/* Bottom edge contact shadow */}

      <div

        className="absolute inset-x-0 bottom-0 rounded-b-full pointer-events-none"

        style={{

          height: '20%',

          background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.20) 0%, rgba(0, 0, 0, 0) 100%)',

          filter: 'blur(2px)',

        }}

      />

      {/* Inner diffuse glow */}

      <div

        className="absolute inset-0 rounded-full pointer-events-none"

        style={{

          boxShadow: 'inset 0 0 40px rgba(255, 255, 255, 0.22)',

          opacity: 0.7,

        }}

      />



      {/* Micro edge definition */}

      <div

        className="absolute inset-0 rounded-full pointer-events-none"

        style={{

          boxShadow: 'inset 0 0 0 0.5px rgba(0, 0, 0, 0.10)',

        }}

      />

      {/* Navigation items container */}

      <div

        ref={containerRef}

        className="relative z-10 h-full flex items-center justify-center px-2 md:px-6"

        style={{

          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro", Poppins, sans-serif',

        }}

      >

        {/* Collapsed state - show only active section with smooth text transitions */}

        {!expanded && (

          <div className="flex items-center relative">

            <AnimatePresence mode="wait">

              {activeItem && (

                <motion.span

                  key={activeItem.id}

                  initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}

                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}

                  exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}

                  transition={{

                    duration: 0.35,

                    ease: [0.4, 0.0, 0.2, 1]

                  }}

                  style={{

                    fontSize: '15.5px',

                    fontWeight: 680,

                    color: '#1a1a1a',

                    letterSpacing: '0.45px',

                    whiteSpace: 'nowrap',

                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", Poppins, sans-serif',

                    WebkitFontSmoothing: 'antialiased',

                    MozOsxFontSmoothing: 'grayscale',

                    textShadow: `

                      0 1px 0 rgba(0, 0, 0, 0.35),

                      0 -1px 0 rgba(255, 255, 255, 0.8),

                      1px 1px 0 rgba(0, 0, 0, 0.18),

                      -1px 1px 0 rgba(0, 0, 0, 0.15)

                    `,

                  }}

                >

                  {activeItem.label}

                </motion.span>

              )}

            </AnimatePresence>

          </div>

        )}

        {/* Expanded state - show all sections with stagger */}

        {expanded && (

          <div className="flex items-center w-full">

            {navItems.map((item, index) => {

              const isActive = item.id === activeSection



              return (

                <motion.button

                  key={item.id}

                  initial={{ opacity: 0, x: -10 }}

                  animate={{ opacity: 1, x: 0 }}

                  exit={{ opacity: 0, x: -10 }}

                  transition={{

                    delay: index * 0.08,

                    duration: 0.25,

                    ease: 'easeOut'

                  }}

                  onClick={() => handleSectionClick(item)}

                  className="relative cursor-pointer transition-all duration-200 group flex-1"

                  style={{

                    fontSize: isActive ? '15.5px' : '15px',

                    fontWeight: isActive ? 680 : 510,

                    color: isActive ? '#1a1a1a' : '#656565',

                    textDecoration: 'none',

                    letterSpacing: '0.45px',

                    background: 'transparent',

                    border: 'none',

                    padding: isMobile ? '10px 8px' : '10px 16px',

                    outline: 'none',

                    whiteSpace: 'nowrap',

                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", Poppins, sans-serif',

                    WebkitFontSmoothing: 'antialiased',

                    MozOsxFontSmoothing: 'grayscale',

                    transform: isActive ? 'translateY(-1.5px)' : 'translateY(0)',

                    textShadow: isActive

                      ? `

                        0 1px 0 rgba(0, 0, 0, 0.35),

                        0 -1px 0 rgba(255, 255, 255, 0.8),

                        1px 1px 0 rgba(0, 0, 0, 0.18),

                        -1px 1px 0 rgba(0, 0, 0, 0.15)

                      `

                      : `

                        0 1px 0 rgba(0, 0, 0, 0.22),

                        0 -1px 0 rgba(255, 255, 255, 0.65),

                        1px 1px 0 rgba(0, 0, 0, 0.12),

                        -1px 1px 0 rgba(0, 0, 0, 0.10)

                      `,

                  }}

                  onMouseEnter={(e) => {
                    setHoveredItem(item.id)
                    if (!isActive) {

                      e.currentTarget.style.color = '#3a3a3a'

                      e.currentTarget.style.transform = 'translateY(-0.5px)'

                      e.currentTarget.style.textShadow = `

                        0 1px 0 rgba(0, 0, 0, 0.28),

                        0 -1px 0 rgba(255, 255, 255, 0.72),

                        1px 1px 0 rgba(0, 0, 0, 0.15),

                        -1px 1px 0 rgba(0, 0, 0, 0.12)

                      `

                    }

                  }}

                  onMouseLeave={(e) => {
                    setHoveredItem(null)
                    if (!isActive) {

                      e.currentTarget.style.color = '#656565'

                      e.currentTarget.style.transform = 'translateY(0)'

                      e.currentTarget.style.textShadow = `

                        0 1px 0 rgba(0, 0, 0, 0.22),

                        0 -1px 0 rgba(255, 255, 255, 0.65),

                        1px 1px 0 rgba(0, 0, 0, 0.12),

                        -1px 1px 0 rgba(0, 0, 0, 0.10)

                      `

                    }

                  }}

                >

                  {item.label}

                  {/* Animated underline */}
                  <motion.div
                    className="absolute bottom-0 h-[2px] bg-[#1a1a1a]"
                    initial={{ width: 0, left: '50%', x: '-50%' }}
                    animate={{
                      width: (hoveredItem === item.id || isActive) ? '70%' : 0,
                      left: '50%',
                      x: '-50%'
                    }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    style={{ opacity: isActive ? 1 : 0.6 }}
                  />
                </motion.button>

              )

            })}

          </div>

        )}

      </div>

    </motion.nav>

  )

}
