"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

// Enhanced custom cursor component with morphing effect for buttons and links
const CustomCursor = () => {
  // State to track mouse position with smooth animation
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring animation for smooth cursor movement
  const springConfig = { damping: 25, stiffness: 700 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  // Trailing cursor with slower spring
  const trailingSpringConfig = { damping: 30, stiffness: 400 };
  const trailingX = useSpring(mouseX, trailingSpringConfig);
  const trailingY = useSpring(mouseY, trailingSpringConfig);

  // State to track cursor effects and morphing
  const [cursorVariant, setCursorVariant] = useState("default");
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMorphing, setIsMorphing] = useState(false);
  const [morphDimensions, setMorphDimensions] = useState({ width: 0, height: 0, x: 0, y: 0 });

  // Ref for performance optimization
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailingRef = useRef<HTMLDivElement>(null);
  const morphingRef = useRef<HTMLDivElement>(null);

  // Mouse position tracking effect
  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      // Show cursor when mouse moves
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    // Add event listeners for mouse movement
    window.addEventListener("mousemove", updateMousePosition);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("mouseenter", handleMouseEnter);

    // Cleanup event listeners
    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [mouseX, mouseY, isVisible]);

  // Effect to handle cursor variants and morphing effect
  useEffect(() => {
    let currentInteractiveElement: HTMLElement | null = null;

    const updateMorphDimensions = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();

      // Set morph dimensions with minimal padding for links to make capsules fit content
      setMorphDimensions({
        width: rect.width + 8, // Reduced padding for links
        height: rect.height + 6,
        x: rect.left - 4, // Reduced offset
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
        setCursorVariant("morphing");
      } else {
        // Regular cursor behavior for other elements
        currentInteractiveElement = null;
        setIsMorphing(false);

        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
          setCursorVariant("input");
        } else if (target.classList.contains("cursor-text")) {
          setCursorVariant("text");
        } else {
          setCursorVariant("default");
        }
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
           currentInteractiveElement = null;
         }
       }
     };

     // Handle scroll events to update morph dimensions when page scrolls
     const handleScroll = () => {
       // If currently morphing, update the cursor position to match the element's new position
       if (currentInteractiveElement && isMorphing) {
         updateMorphDimensions(currentInteractiveElement);
       }
     };

     const handleMouseDown = () => setIsClicking(true);
     const handleMouseUp = () => setIsClicking(false);

     // Add event listeners
     document.addEventListener("mouseover", handleMouseOver);
     document.addEventListener("mousemove", handleMouseMove);
     document.addEventListener("mousedown", handleMouseDown);
     document.addEventListener("mouseup", handleMouseUp);
     window.addEventListener("scroll", handleScroll, { passive: true });
     window.addEventListener("resize", handleScroll, { passive: true });

     // Cleanup
     return () => {
       document.removeEventListener("mouseover", handleMouseOver);
       document.removeEventListener("mousemove", handleMouseMove);
       document.removeEventListener("mousedown", handleMouseDown);
       document.removeEventListener("mouseup", handleMouseUp);
       window.removeEventListener("scroll", handleScroll);
       window.removeEventListener("resize", handleScroll);
     };
  }, [isMorphing]);

  // Cursor variants for different effects
  const cursorVariants = {
    default: {
      width: 32,
      height: 32,
      backgroundColor: "#ffffff",
      scale: 1,
      mixBlendMode: "difference" as const,
      opacity: 1,
    },
    morphing: {
      backgroundColor: "#ffffff",
      scale: 1,
      mixBlendMode: "difference" as const,
      opacity: 1,
    },
    input: {
      width: 12,
      height: 12,
      backgroundColor: "#10b981",
      scale: 1,
      mixBlendMode: "difference" as const,
      opacity: 1,
    },
    text: {
      width: 4,
      height: 16,
      backgroundColor: "#000000",
      scale: 1,
      mixBlendMode: "difference" as const,
      opacity: 1,
    },
    clicking: {
      scale: 0.7,
      backgroundColor: "#ef4444",
      opacity: 1,
    },
  };

  // Trailing cursor variants - only for non-morphing state
  const trailingVariants = {
    default: {
      width: 16,
      height: 16,
      scale: 1,
      opacity: 0.5,
      mixBlendMode: "difference" as const,
    },
    input: {
      width: 6,
      height: 6,
      backgroundColor: "#10b981",
      scale: 1,
      opacity: 0.5,
    },
    text: {
      width: 2,
      height: 8,
      backgroundColor: "#000000",
      scale: 1,
      opacity: 0.5,
    },
    clicking: {
      scale: 0.5,
      backgroundColor: "#ef4444",
      opacity: 0.6,
    },
  };

  return (
    <>
      {/* Morphing cursor - appears when hovering over buttons or links */}
      {isMorphing && (
        <motion.div
          ref={morphingRef}
          className="fixed pointer-events-none z-[100] bg-white"
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
          style={{
            mixBlendMode: "difference" as const,
            opacity: isVisible ? 1 : 0,
          }}
        />
      )}

      {/* Regular circular cursor - shows when NOT morphing */}
      {!isMorphing && (
        <>
          {/* Main cursor */}
          <motion.div
            ref={cursorRef}
            className="fixed pointer-events-none z-[100] rounded-full"
            animate={isClicking ? "clicking" : cursorVariant}
            variants={cursorVariants}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 28,
              mass: 0.5,
            }}
            style={{
              x: cursorX,
              y: cursorY,
              translateX: "-50%",
              translateY: "-50%",
              opacity: isVisible ? 1 : 0,
            }}
            initial={{ opacity: 0 }}
          />

          {/* Trailing cursor */}
          <motion.div
            ref={trailingRef}
            className="fixed pointer-events-none z-[90] rounded-full"
            animate={isClicking ? "clicking" : cursorVariant}
            variants={trailingVariants}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 35,
              mass: 0.8,
            }}
            style={{
              x: trailingX,
              y: trailingY,
              translateX: "-50%",
              translateY: "-50%",
              opacity: isVisible ? 1 : 0,
            }}
            initial={{ opacity: 0 }}
          />
        </>
      )}
    </>
  );
};

export default CustomCursor;
