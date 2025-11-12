'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

import { motion, useMotionValue, animate } from 'framer-motion';

export interface CarouselItem {
  id: number;
  url: string;
  title: string;
}

interface FramerCarouselProps {
  items: CarouselItem[];
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
}

export function FramerCarousel({ items, currentIndex = 0, onIndexChange }: FramerCarouselProps) {
  const [index, setIndex] = useState(currentIndex);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevIndexRef = useRef(currentIndex);

  const x = useMotionValue(0);

  // Sync with external currentIndex prop - use ref to track previous value
  useEffect(() => {
    if (currentIndex !== prevIndexRef.current) {
      prevIndexRef.current = currentIndex;
      // Use requestAnimationFrame to defer state update
      requestAnimationFrame(() => {
        setIndex(currentIndex);
      });
    }
  }, [currentIndex]);

  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth || 1;
      const targetX = -index * containerWidth;

      animate(x, targetX, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      });
    }
  }, [index, x]);

  const handleIndexChange = (newIndex: number) => {
    setIndex(newIndex);
    onIndexChange?.(newIndex);
  };

  return (
    <div className='lg:p-10 sm:p-4 p-2 w-full'>
      <div className='flex flex-col gap-3'>
        <div className='relative overflow-hidden rounded-lg' ref={containerRef}>
          <motion.div className='flex' style={{ x }}>
            {items.map((item) => (
              <div key={item.id} className='shrink-0 w-full aspect-video relative'>
                <Image
                  src={item.url}
                  alt={item.title}
                  fill
                  className='object-contain rounded-lg select-none pointer-events-none bg-neutral-100 dark:bg-neutral-900'
                  draggable={false}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            ))}
          </motion.div>

          {/* Navigation Buttons */}
          <motion.button
            disabled={index === 0}
            onClick={() => handleIndexChange(Math.max(0, index - 1))}
            className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform z-10
              ${
                index === 0
                  ? 'opacity-40 cursor-not-allowed'
                  : 'bg-white hover:scale-110 hover:opacity-100 opacity-70'
              }`}
          >
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 19l-7-7 7-7'
              />
            </svg>
          </motion.button>

          {/* Next Button */}
          <motion.button
            disabled={index === items.length - 1}
            onClick={() => handleIndexChange(Math.min(items.length - 1, index + 1))}
            className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform z-10
              ${
                index === items.length - 1
                  ? 'opacity-40 cursor-not-allowed'
                  : 'bg-white hover:scale-110 hover:opacity-100 opacity-70'
              }`}
          >
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 5l7 7-7 7'
              />
            </svg>
          </motion.button>
          {/* Progress Indicator */}
          <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-white/20 rounded-xl border border-white/30'>
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => handleIndexChange(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? 'w-8 bg-white' : 'w-2 bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
