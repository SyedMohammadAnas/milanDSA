'use client'

import { useRef } from "react"
import Image from "next/image"
import { ImageTrail } from "@/components/ui/image-trail"

export function Hero() {
  const ref = useRef<HTMLDivElement>(null)

  // Unsplash images that definitely exist
  const images = [
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
    "https://images.unsplash.com/photo-1426604966848-d7adac402bff",
    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e",
    "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d",
  ].map(url => `${url}?auto=format&fit=crop&w=800&q=80`)

  return (
    <div className="flex w-full h-screen justify-center items-center bg-white dark:bg-black relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full z-0" ref={ref}>
        <ImageTrail containerRef={ref}>
          {images.map((url, index) => (
            <div
              key={index}
              className="flex relative overflow-hidden w-70 h-70 rounded-lg"
            >
              <Image
                src={url}
                alt={`Trail image ${index + 1}`}
                fill
                className="object-cover hover:scale-110 transition-transform"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </div>
          ))}
        </ImageTrail>
      </div>
      <h1 className="text-center text-7xl md:text-9xl font-bold z-10 select-none bg-clip-text text-transparent bg-gradient-to-r from-neutral-950 to-neutral-500 dark:from-neutral-50 dark:to-neutral-400">
        Welcome to <br/>
        MILAN 26&apos;
      </h1>
    </div>
  )
}
