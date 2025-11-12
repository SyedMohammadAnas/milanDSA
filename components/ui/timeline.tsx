"use client";

import {
  useMotionValueEvent,
  useScroll,
  useTransform,
  motion,
} from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

interface TimelineProps {
  data: TimelineEntry[];
  onActiveIndexChange?: (index: number) => void;
  heading?: string;
  description?: string;
}

export const Timeline = ({ data, onActiveIndexChange, heading, description }: TimelineProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const updateHeight = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setHeight(rect.height);
      }
    };

    updateHeight();

    // Recalculate on resize
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [ref, data]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  // Calculate which timeline item is active based on scroll position
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (ref.current && data.length > 0 && height > 0) {
      // Divide scroll progress evenly across all items
      const progressPerItem = 1 / data.length;
      // Calculate which item we're currently in
      const newIndex = Math.min(
        Math.floor(latest / progressPerItem),
        data.length - 1
      );

      if (newIndex !== activeIndex && newIndex >= 0) {
        setActiveIndex(newIndex);
        onActiveIndexChange?.(newIndex);
      }
    }
  });

  return (
    <div
      className="w-full bg-white dark:bg-neutral-950 font-sans md:px-10"
      ref={containerRef}
    >
      <div className="max-w-7xl mx-auto py-20 px-4 md:px-8 lg:px-10">
        <h2 className="pt-12 text-3xl md:text-5xl lg:text-6xl mb-4 text-black dark:text-white font-bold max-w-4xl">
          {heading || "Changelog from my journey"}
        </h2>
        <p className="text-neutral-700 dark:text-neutral-300 text-base md:text-lg lg:text-xl max-w-2xl">
          {description || "I've been working on Aceternity for the past 2 years. Here's a timeline of my journey."}
        </p>
      </div>

      <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
        {data.map((item, index) => (
          <div
            key={index}
            className="relative pt-32 md:pt-80 min-h-[80vh] md:min-h-[120vh]"
          >
            <div className="sticky top-75 z-40 flex flex-col md:flex-row gap-4 md:gap-10 items-start">
              {/* Timeline dot and title section */}
              <div className="flex items-start gap-4 md:gap-0 flex-shrink-0">
                <div className="relative flex-shrink-0 w-10 h-10 flex items-center justify-center">
                  <div className="h-10 w-10 rounded-full bg-white dark:bg-black flex items-center justify-center">
                    <div className={`h-4 w-4 rounded-full border p-2 transition-colors ${
                      index === activeIndex
                        ? 'bg-purple-500 border-purple-600 dark:bg-purple-500 dark:border-purple-400'
                        : 'bg-neutral-200 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700'
                    }`} />
                  </div>
                </div>
                <h3 className="md:hidden text-2xl font-bold text-black dark:text-black pt-1">
                  {item.title}
                </h3>
                <h3 className="hidden md:block text-xl md:pl-20 md:text-5xl font-bold text-black dark:text-black md:pt-0">
                  {item.title}
                </h3>
              </div>

              {/* Content section - also sticky */}
              <div className="flex-1 pl-0 md:pl-4 py-8 md:py-0 md:-mt-1 md:flex md:items-start">
                <div className="w-full">
                  {item.content}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div
          style={{
            height: height + "px",
          }}
          className="absolute left-5 md:left-5 top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-neutral-200 dark:via-neutral-700 to-transparent to-[99%]  [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] "
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0  w-[2px] bg-gradient-to-t from-purple-500 via-blue-500 to-transparent from-[0%] via-[10%] rounded-full"
          />
        </div>
      </div>
    </div>
  );
};
