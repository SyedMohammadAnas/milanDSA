"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export function KineticCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const morphingRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [cursorText, setCursorText] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isMorphing, setIsMorphing] = useState(false);
  const [morphDimensions, setMorphDimensions] = useState({ width: 0, height: 0, x: 0, y: 0 });

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 700 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Only show cursor on devices with mouse (not touch devices)
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
      return;
    }

    // Use requestAnimationFrame to defer state update
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    window.addEventListener("mousemove", moveCursor);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
    };
  }, [cursorX, cursorY]);

  // Effect to handle morphing for buttons and links
  useEffect(() => {
    let currentInteractiveElement: HTMLElement | null = null;

    const updateMorphDimensions = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      setMorphDimensions({
        width: rect.width + 8,
        height: rect.height + 6,
        x: rect.left - 4,
        y: rect.top - 3,
      });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Check if the element or its parents have the no-morph attribute
      const noMorphElement = target.closest("[data-no-cursor-morph]");

      // Find the actual interactive element (button or link)
      const button = target.closest("button");
      const link = target.closest("a");
      const interactiveElement = button || link;

      // If hovering over a button or link and NOT in a no-morph area, morph the cursor
      if (interactiveElement && !noMorphElement) {
        currentInteractiveElement = interactiveElement;
        updateMorphDimensions(interactiveElement);
        setIsMorphing(true);
        setIsHovering(true);

        // Set cursor text for links
        if (link) {
          setCursorText(link.textContent?.trim() || "");
        } else {
          setCursorText("");
        }
      } else {
        currentInteractiveElement = null;
        setIsMorphing(false);
        setIsHovering(false);
        setCursorText("");
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      // If currently morphing, check if mouse is still within expanded tolerance area
      if (currentInteractiveElement && isMorphing) {
        const rect = currentInteractiveElement.getBoundingClientRect();

        // Expanded tolerance zone (30px buffer around the element)
        const tolerance = 30;
        const expandedRect = {
          left: rect.left - tolerance,
          right: rect.right + tolerance,
          top: rect.top - tolerance,
          bottom: rect.bottom + tolerance,
        };

        // Check if mouse is within the expanded tolerance area
        const isWithinTolerance =
          mouseX >= expandedRect.left &&
          mouseX <= expandedRect.right &&
          mouseY >= expandedRect.top &&
          mouseY <= expandedRect.bottom;

        // If still within tolerance, keep morphing and update dimensions
        if (isWithinTolerance) {
          updateMorphDimensions(currentInteractiveElement);
        } else {
          // Mouse moved out of tolerance area, stop morphing
          setIsMorphing(false);
          setIsHovering(false);
          setCursorText("");
          currentInteractiveElement = null;
        }
      }
    };

    // Handle scroll events to update morph dimensions when page scrolls
    const handleScroll = () => {
      if (currentInteractiveElement && isMorphing) {
        updateMorphDimensions(currentInteractiveElement);
      }
    };

    // Add event listeners
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    // Cleanup
    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isMorphing]);

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Morphing cursor - appears when hovering over buttons or links */}
      {isMorphing && (
        <motion.div
          ref={morphingRef}
          className="fixed pointer-events-none z-[9999] bg-white mix-blend-difference"
          animate={{
            width: morphDimensions.width,
            height: morphDimensions.height,
            x: morphDimensions.x,
            y: morphDimensions.y,
            borderRadius: Math.min(morphDimensions.height / 2, 50),
          }}
          initial={{
            width: 32,
            height: 32,
            x: cursorX.get() - 16,
            y: cursorY.get() - 16,
            borderRadius: 16,
          }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 25,
          }}
        />
      )}

      {/* Regular circular cursor - shows when NOT morphing */}
      {!isMorphing && (
        <motion.div
          ref={cursorRef}
          className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
          style={{
            x: cursorXSpring,
            y: cursorYSpring,
            translateX: "-50%",
            translateY: "-50%",
          }}
        >
          <motion.div
            className="rounded-full bg-white"
            animate={{
              width: isHovering ? 64 : 32,
              height: isHovering ? 64 : 32,
            }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 28,
            }}
          />
        </motion.div>
      )}

      {/* Cursor text */}
      {cursorText && (
        <motion.div
          className="fixed top-0 left-0 pointer-events-none z-[9999] text-white text-sm font-medium whitespace-nowrap mix-blend-difference"
          style={{
            x: cursorXSpring,
            y: cursorYSpring,
            translateX: "-50%",
            translateY: "-50%",
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          {cursorText}
        </motion.div>
      )}
    </>
  );
}
