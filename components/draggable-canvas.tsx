'use client'

import { useRef, useState, useCallback, useEffect, ReactNode, WheelEvent, MouseEvent, TouchEvent } from 'react'

interface DraggableCanvasProps {
  children: ReactNode;
  className?: string;
  onClickOutside?: () => void;
  isSelectionMode?: boolean;
  targetZoom?: number;
}

export default function DraggableCanvas({ children, className = '', onClickOutside, isSelectionMode = false, targetZoom }: DraggableCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(0.3)

  // Update scale when targetZoom changes
  useEffect(() => {
    if (targetZoom !== undefined) {
      setScale(targetZoom)
    }
  }, [targetZoom])
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Handle mouse down
  const handleMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
    // Only drag with left mouse button
    if (e.button !== 0) return

    setIsDragging(true)
    setDragStart({
      x: e.clientX - pan.x,
      y: e.clientY - pan.y
    })
    e.preventDefault()
  }, [pan])

  // Handle mouse move
  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return

    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }, [isDragging, dragStart])

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y
      })
    }
  }, [pan])

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (!isDragging || e.touches.length !== 1) return

    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    })
    e.preventDefault()
  }, [isDragging, dragStart])

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Handle wheel for zooming
  const handleWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault()

    const delta = e.deltaY * -0.001
    const newScale = Math.min(Math.max(0.3, scale + delta), 3)

    setScale(newScale)
  }, [scale])

  // Reset view
  const resetView = useCallback(() => {
    setPan({ x: 0, y: 0 })
    setScale(1)
  }, [])

  // Handle canvas click
  const handleCanvasClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    // Only handle if in selection mode and clicked on the canvas background
    if (isSelectionMode && onClickOutside && e.target === e.currentTarget) {
      onClickOutside()
    }
  }, [isSelectionMode, onClickOutside])

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      onClick={handleCanvasClick}
      style={{
        cursor: isDragging ? 'grabbing' : (isSelectionMode ? 'default' : 'grab'),
        touchAction: 'none'
      }}
    >
      {/* Canvas content with transform */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          willChange: 'transform',
          width: '100%',
          height: '100%',
          position: 'relative'
        }}
      >
        {/* Invisible overlay for click outside when in selection mode */}
        {isSelectionMode && (
          <div
            className="absolute inset-0 z-10"
            onClick={onClickOutside}
            style={{ pointerEvents: 'auto' }}
          />
        )}
        {children}
      </div>

      {/* Zoom indicator / Reset button */}
      <button
        onMouseEnter={(e) => {
          const target = e.target as HTMLElement;
          target.textContent = 'Reset View';
        }}
        onMouseLeave={(e) => {
          const target = e.target as HTMLElement;
          target.textContent = `${Math.round(scale * 100)}%`;
        }}
        onClick={resetView}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 bg-white/80 backdrop-blur-lg border border-gray-300 rounded-lg text-xs font-medium text-black hover:bg-white transition-colors"
      >
        {Math.round(scale * 100)}%
      </button>
    </div>
  )
}
