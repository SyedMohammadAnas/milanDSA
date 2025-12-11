"use client";

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import Image from 'next/image';

interface TeamIntroAnimationProps {
  onComplete: () => void;
}

export function TeamIntroAnimation({ onComplete }: TeamIntroAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ourTextRef = useRef<HTMLHeadingElement>(null);
  const teamTextRef = useRef<HTMLHeadingElement>(null);
  const directorsTextRef = useRef<HTMLDivElement>(null);
  const managersTextRef = useRef<HTMLDivElement>(null);

  // Director image refs
  const nishaRef = useRef<HTMLDivElement>(null);
  const princeRef = useRef<HTMLDivElement>(null);
  const pradeepRef = useRef<HTMLDivElement>(null);

  // Manager image refs
  const dhandayuthapaniRef = useRef<HTMLDivElement>(null);
  const rajivRef = useRef<HTMLDivElement>(null);

  const [animationComplete, setAnimationComplete] = useState(false);
  const [isMounted] = useState(true); // Client-side only component

  useEffect(() => {
    if (!isMounted) return;

    const ctx = gsap.context(() => {
      // Ensure refs exist
      if (!ourTextRef.current || !teamTextRef.current || !containerRef.current) {
        console.warn("Animation refs not ready");
        return;
      }

      const tl = gsap.timeline({
        onComplete: () => {
          setAnimationComplete(true);
        }
      });

      // Initial setup - hide everything except Nisha and Directors text and OUR TEAM
      gsap.set([
        princeRef.current?.querySelector('img'),
        pradeepRef.current?.querySelector('img')
      ], {
        opacity: 0,
        scale: 0.8,
        x: 0,
        y: 0
      });

      gsap.set([
        managersTextRef.current,
        dhandayuthapaniRef.current?.querySelector('img'),
        rajivRef.current?.querySelector('img')
      ], {
        opacity: 0,
        y: 50
      });

      // Hide name/designation texts initially
      gsap.set([
        princeRef.current?.querySelector('.name-text'),
        pradeepRef.current?.querySelector('.name-text'),
        nishaRef.current?.querySelector('.name-text'),
        dhandayuthapaniRef.current?.querySelector('.name-text'),
        rajivRef.current?.querySelector('.name-text')
      ], {
        opacity: 0
      });

      // Set initial position for Our and Team text (top center, stacked vertically)
      gsap.set(ourTextRef.current, {
        top: "2%",
        left: "50%",
        x: "-50%",
        y: 0,
        opacity: 0
      });
      gsap.set(teamTextRef.current, {
        top: "13%",
        left: "50%",
        x: "-50%",
        y: 0,
        opacity: 0
      });

      // STAGE 1: OUR TEAM text and Nisha's picture in center with Directors text
      tl.to([ourTextRef.current, teamTextRef.current], {
        opacity: 1,
        duration: 1,
        ease: "power3.out",
        stagger: 0.1
      })
      .from(directorsTextRef.current, {
        opacity: 0,
        scale: 0.8,
        duration: 0.8,
        ease: "back.out(1.7)"
      }, "-=0.5")
      .from(nishaRef.current?.querySelector('img') || [], {
        opacity: 0,
        scale: 0.5,
        duration: 1,
        ease: "back.out(1.7)"
      }, "-=0.6")
      .to(nishaRef.current?.querySelector('.name-text') || [], {
        opacity: 1,
        duration: 0.5,
        ease: "power2.out"
      }, "-=0.3");

      // STAGE 2: Prince and Pradeep come from behind Nisha and position left/right
      const isMobileView = window.innerWidth < 768;
      const moveDistance = isMobileView ? -250 : -350;

      tl.to([
        princeRef.current?.querySelector('img'),
        pradeepRef.current?.querySelector('img')
      ], {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: "back.out(1.7)"
      }, "+=0.5")
      .to(princeRef.current, {
        x: moveDistance,
        duration: 0.8,
        ease: "power3.out"
      }, "-=0.5")
      .to(pradeepRef.current, {
        x: -moveDistance,
        duration: 0.8,
        ease: "power3.out"
      }, "-=0.8")
      .to([
        princeRef.current?.querySelector('.name-text'),
        pradeepRef.current?.querySelector('.name-text')
      ], {
        opacity: 1,
        duration: 0.5,
        ease: "power2.out"
      }, "-=0.4");

      // STAGE 3: Move directors up, show managers (reduced gap)
      tl.to([
        nishaRef.current,
        princeRef.current,
        pradeepRef.current,
        directorsTextRef.current
      ], {
        y: -180,
        duration: 1,
        ease: "power3.inOut"
      }, "+=0.5")
      // Simultaneously move OUR TEAM text to final position (matching team-sphere positions)
      .to(ourTextRef.current, {
        top: isMobileView ? "4.5rem" : "3.75rem", // top-18 mobile, top-15 desktop
        left: isMobileView ? "1rem" : "2.5rem", // left-4 mobile, left-10 desktop
        fontSize: isMobileView ? "3.75rem" : "10rem", // text-6xl mobile, text-[10rem] desktop
        x: 0,
        y: 0,
        clearProps: "transform",
        duration: 1,
        ease: "power3.inOut"
      }, "-=1")
      .to(teamTextRef.current, {
        top: isMobileView ? "7.5rem" : "11.5rem", // top-30 mobile, top-46 desktop
        left: isMobileView ? "1.25rem" : "3rem", // left-5 mobile, left-12 desktop
        fontSize: isMobileView ? "3.75rem" : "10rem", // text-6xl mobile, text-[10rem] desktop
        x: 0,
        y: 0,
        clearProps: "transform",
        duration: 1,
        ease: "power3.inOut"
      }, "-=1")
      .to(managersTextRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "back.out(1.7)"
      }, "-=0.5")
      .to([
        dhandayuthapaniRef.current?.querySelector('img'),
        rajivRef.current?.querySelector('img')
      ], {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "back.out(1.7)",
        stagger: 0.2
      }, "-=0.4")
      .to([
        dhandayuthapaniRef.current?.querySelector('.name-text'),
        rajivRef.current?.querySelector('.name-text')
      ], {
        opacity: 1,
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.1
      }, "-=0.3");

      // Hold for a moment before exit
      tl.to({}, { duration: 1 });

      // EXIT ANIMATION: White background vanishes like a veil, images collect and slide out
      tl.to(containerRef.current, {
        backgroundColor: "rgba(255, 255, 255, 0)",
        duration: 1,
        ease: "power2.inOut"
      })
      // First, hide all name texts
      .to([
        nishaRef.current?.querySelector('.name-text'),
        princeRef.current?.querySelector('.name-text'),
        pradeepRef.current?.querySelector('.name-text'),
        dhandayuthapaniRef.current?.querySelector('.name-text'),
        rajivRef.current?.querySelector('.name-text')
      ], {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in"
      }, "-=0.8")
      // Images collect together first (gather in center) - animate the container divs
      .to([nishaRef.current, princeRef.current, pradeepRef.current, dhandayuthapaniRef.current, rajivRef.current], {
        x: 0,
        y: 0,
        duration: 0.8,
        ease: "power2.inOut"
      }, "-=0.5")
      // Scale down images as they gather
      .to([
        nishaRef.current?.querySelector('img'),
        princeRef.current?.querySelector('img'),
        pradeepRef.current?.querySelector('img'),
        dhandayuthapaniRef.current?.querySelector('img'),
        rajivRef.current?.querySelector('img')
      ], {
        scale: 0.4,
        duration: 0.6,
        ease: "power2.inOut"
      }, "-=0.4")
      // Then slide to top right corner and fade out
      .to([nishaRef.current, princeRef.current, pradeepRef.current, dhandayuthapaniRef.current, rajivRef.current], {
        x: window.innerWidth * 1.2,
        y: -window.innerHeight * 0.8,
        duration: 0.8,
        ease: "power3.in",
        stagger: 0.05
      })
      .to([
        nishaRef.current?.querySelector('img'),
        princeRef.current?.querySelector('img'),
        pradeepRef.current?.querySelector('img'),
        dhandayuthapaniRef.current?.querySelector('img'),
        rajivRef.current?.querySelector('img')
      ], {
        scale: 0.1,
        opacity: 0,
        duration: 0.8,
        ease: "power3.in",
        stagger: 0.05
      }, "-=0.8")
      // Directors and Managers text vanish
      .to([directorsTextRef.current, managersTextRef.current], {
        opacity: 0,
        scale: 0.8,
        duration: 0.4,
        ease: "power2.in"
      }, "-=1.2")
      // OUR TEAM text stays visible - we just fade out the container background
      // The text will remain visible and be picked up by TeamSphere component
      .to(containerRef.current, {
        opacity: 0,
        pointerEvents: "none",
        duration: 0.6,
        ease: "power2.inOut",
        onComplete: () => {
          onComplete();
        }
      });

    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, [onComplete, isMounted]);

  // Don't render if animation is complete
  if (animationComplete) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-white flex items-center justify-center overflow-hidden"
    >
      {/* Skip button */}
      <button
        onClick={() => {
          setAnimationComplete(true);
          onComplete();
        }}
        className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[110] px-4 py-2 sm:px-6 sm:py-3 bg-gray-900 text-white rounded-full text-sm sm:text-base font-medium hover:bg-gray-800 transition-colors shadow-lg"
      >
        Skip Animation
      </button>

      {/* OUR TEAM text - split into "Our" and "Team" matching team-sphere structure */}
      <h1
        ref={ourTextRef}
        className="absolute text-6xl font-bold text-gray-900 tracking-tight md:text-[10rem] z-50"
      >
        Our
      </h1>
      <h1
        ref={teamTextRef}
        className="absolute text-6xl font-bold text-gray-900 tracking-tight md:text-[10rem] z-50"
      >
        Team
      </h1>

      {/* Directors Section */}
      <div className="absolute top-[48%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        {/* Directors Text */}
        <div ref={directorsTextRef} className="mb-6 md:mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
            Directors
          </h2>
        </div>

        {/* Directors Images Container */}
        <div className="relative flex items-center justify-center">
          {/* Prince - Left */}
          <div ref={princeRef} className="absolute flex flex-col items-center">
            <Image
              src="/Directors_Images/PrinceKalyanasundaram.png"
              alt="Prince Kalyanasundaram"
              width={256}
              height={256}
              className="w-32 h-32 sm:w-40 sm:h-40 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-full object-cover shadow-2xl border-2 md:border-4 border-white"
            />
            <div className="name-text mt-3 text-center px-2">
              <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">Dr. Prince Kalyanasundaram</p>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700">Deputy Director<br/>Directorate of Student Affairs</p>
            </div>
          </div>

          {/* Nisha - Center (on top) */}
          <div ref={nishaRef} className="flex flex-col items-center relative z-10">
            <Image
              src="/Directors_Images/NishaAshokan.png"
              alt="Nisha Ashokan"
              width={288}
              height={288}
              className="w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-72 lg:h-72 rounded-full object-cover shadow-2xl border-2 md:border-4 border-white"
            />
            <div className="name-text mt-3 text-center px-2">
              <p className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-900">Dr. Nisha Ashokan</p>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700">Director<br/>Directorate of Student Affairs</p>
            </div>
          </div>

          {/* Pradeep - Right */}
          <div ref={pradeepRef} className="absolute flex flex-col items-center">
            <Image
              src="/Directors_Images/SPradeep.png"
              alt="S Pradeep"
              width={256}
              height={256}
              className="w-32 h-32 sm:w-40 sm:h-40 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-full object-cover shadow-2xl border-2 md:border-4 border-white"
            />
            <div className="name-text mt-3 text-center px-2">
              <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">Dr. S. Pradeep</p>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700">Assistant Director<br/>Directorate of Student Affairs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Managers Section - moved closer to directors */}
      <div className="absolute top-[55%] left-1/2 transform -translate-x-1/2 flex flex-col items-center mt-4 md:mt-6">
        {/* Managers Text */}
        <div ref={managersTextRef} className="mb-4 md:mb-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
            Managers
          </h2>
        </div>

        {/* Managers Images */}
        <div className="flex gap-8 sm:gap-12 md:gap-16">
          <div ref={dhandayuthapaniRef} className="flex flex-col items-center">
            <Image
              src="/Managers_Images/Dhandayuthapani.png"
              alt="Dhandayuthapani"
              width={224}
              height={224}
              className="w-32 h-32 sm:w-36 sm:h-36 md:w-48 md:h-48 lg:w-56 lg:h-56 rounded-full object-cover shadow-2xl border-2 md:border-4 border-white"
            />
            <div className="name-text mt-3 text-center px-2">
              <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">Dhandayuthapani B</p>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700">Event Manager</p>
            </div>
          </div>
          <div ref={rajivRef} className="flex flex-col items-center">
            <Image
              src="/Managers_Images/RajivD.png"
              alt="Rajiv D"
              width={224}
              height={224}
              className="w-32 h-32 sm:w-36 sm:h-36 md:w-48 md:h-48 lg:w-56 lg:h-56 rounded-full object-cover shadow-2xl border-2 md:border-4 border-white"
            />
            <div className="name-text mt-3 text-center px-2">
              <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">Rajiv D</p>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700">Event Manager</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
