"use client";

import SphereImageGrid, { ImageData } from "@/components/ui/img-sphere";
import React, { useState, useEffect } from 'react';
import Image from "next/image";
import { ChevronRight, X } from 'lucide-react';

// ==========================================
// IMAGE DATA CONFIGURATION
// ==========================================

const BASE_IMAGES: Omit<ImageData, 'id'>[] = [
  {
    src: "https://images.unsplash.com/photo-1758178309498-036c3d7d73b3?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=987",
    alt: "Image 1",
    title: "Mountain Landscape",
    description: "A beautiful landscape captured at golden hour with mountains in the background."
  },
  {
    src: "https://images.unsplash.com/photo-1757647016230-d6b42abc6cc9?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2072",
    alt: "Image 2",
    title: "Portrait Photography",
    description: "Stunning portrait photography showcasing natural lighting and composition."
  },
  {
    src: "https://images.unsplash.com/photo-1757906447358-f2b2cb23d5d8?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=987",
    alt: "Image 3",
    title: "Urban Architecture",
    description: "Modern architectural design featuring clean lines and geometric patterns."
  },
  {
    src: "https://images.unsplash.com/photo-1742201877377-03d18a323c18?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1064",
    alt: "Image 4",
    title: "Nature Scene",
    description: "Peaceful nature scene with vibrant colors and natural beauty."
  },
  {
    src: "https://images.unsplash.com/photo-1757081791153-3f48cd8c67ac?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=987",
    alt: "Image 5",
    title: "Abstract Art",
    description: "Creative abstract composition with bold colors and unique patterns."
  },
  {
    src: "https://images.unsplash.com/photo-1757626961383-be254afee9a0?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=987",
    alt: "Image 6",
    title: "Mountain Landscape",
    description: "A beautiful landscape captured at golden hour with mountains in the background."
  },
  {
    src: "https://images.unsplash.com/photo-1756748371390-099e4e6683ae?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=987",
    alt: "Image 7",
    title: "Portrait Photography",
    description: "Stunning portrait photography showcasing natural lighting and composition."
  },
  {
    src: "https://images.unsplash.com/photo-1755884405235-5c0213aa3374?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=987",
    alt: "Image 8",
    title: "Urban Architecture",
    description: "Modern architectural design featuring clean lines and geometric patterns."
  },
  {
    src: "https://images.unsplash.com/photo-1757495404191-e94ed7e70046?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=987",
    alt: "Image 9",
    title: "Nature Scene",
    description: "Peaceful nature scene with vibrant colors and natural beauty."
  },
  {
    src: "https://images.unsplash.com/photo-1756197256528-f9e6fcb82b04?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1064",
    alt: "Image 10",
    title: "Abstract Art",
    description: "Creative abstract composition with bold colors and unique patterns."
  },
  {
    src: "https://images.unsplash.com/photo-1534083220759-4c3c00112ea0?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=987",
    alt: "Image 11",
    title: "Abstract Art",
    description: "Creative abstract composition with bold colors and unique patterns."
  },
  {
    src: "https://images.unsplash.com/photo-1755278338891-e8d8481ff087?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1674",
    alt: "Image 12",
    title: "Abstract Art",
    description: "Creative abstract composition with bold colors and unique patterns."
  }
];

// Generate more images by repeating the base set
const IMAGES: ImageData[] = [];
for (let i = 0; i < 60; i++) {
  const baseIndex = i % BASE_IMAGES.length;
  const baseImage = BASE_IMAGES[baseIndex];
  IMAGES.push({
    id: `img-${i + 1}`,
    ...baseImage,
    alt: `${baseImage.alt} (${Math.floor(i / BASE_IMAGES.length) + 1})`
  });
}

// ==========================================
// TEAM SPHERE COMPONENT
// ==========================================

export function TeamSphere() {
  const [dimensions, setDimensions] = useState({ width: 800, height: 800 });
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [hoveredConvenor, setHoveredConvenor] = useState<string | null>(null);
  const [selectedConvenor, setSelectedConvenor] = useState<ImageData | null>(null);
  const [selectedSphereImage, setSelectedSphereImage] = useState<ImageData | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const convenorRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    // Calculate dimensions based on viewport
    const updateDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Use the smaller dimension to ensure sphere fits in viewport
      const size = Math.min(width, height) * 0.9;

      setDimensions({
        width: size,
        height: size
      });
    };

    // Initial calculation
    updateDimensions();

    // Update on resize
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Sphere configuration - adjusted for larger viewport
  const sphereRadius = dimensions.width * 0.45;
  const baseImageScale = 0.20;

  // Toggle expanded state - only one item can be expanded at a time
  const toggleItem = (itemId: string) => {
    setExpandedItems(prev => {
      // If clicking the same item that's already expanded, collapse it
      if (prev.has(itemId)) {
        return new Set();
      }
      // Otherwise, close all others and open only this one
      return new Set([itemId]);
    });
  };

  // Core Team Convenors data
  const coreTeamRoles = [
    'Cultural Secretary',
    'Joint Secretary',
    'Operations & Resources',
    'Tech Team',
    'Hospitality',
    'Public Relations',
    'Publicity & Social Media',
    'Transport & Accomodation',
    'Content',
    'EMCEE',
    'Media',
    'Certificate & Prize Distribution',
    'Sponsorship',
    'Treasurer'
  ];

  // Club Convenors data
  const clubConvenors = [
    'Music Club',
    'Dance Club',
    'Astrophilia Club',
    'Sports Club',
    'Quiz Club',
    'Creative Arts Club',
    'Gaming Club',
    'Self Defence Club',
    'Fashion Club',
    'Movie & Dramatics Club',
    'Rubiks Cube Club',
    'Social Club',
    'Literary Club',
    'Rotaract Club'
  ];

  // Get random image from sphere for convenor
  const getRandomImage = (convenorId: string): ImageData => {
    // Use convenorId as seed to get consistent image per convenor
    const hash = convenorId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = hash % IMAGES.length;
    return IMAGES[index];
  };

  // Render expandable item
  const renderExpandableItem = (item: string, category: 'core' | 'club') => {
    const itemId = `${category}-${item}`;
    const isExpanded = expandedItems.has(itemId);

    return (
      <div key={itemId} className="mb-2">
        <button
          onClick={() => toggleItem(itemId)}
          className="flex items-center gap-2 w-full text-left hover:text-gray-900 transition-colors group"
        >
          <div className="transition-transform duration-300 ease-in-out" style={{
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
          }}>
            <ChevronRight
              size={16}
              className="text-gray-600 group-hover:text-gray-900 transition-colors"
            />
          </div>
          <span className="text-gray-700 text-sm">{item}</span>
        </button>
        <div
          className={`overflow-visible transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
          }`}
          style={{
            overflow: isExpanded ? 'visible' : 'hidden'
          }}
        >
          <div className="pl-6 pt-2 space-y-2">
            {['Convenor 1', 'Convenor 2'].map((convenorName, idx) => {
              const convenorId = `${itemId}-${idx}`;
              const convenorImage = getRandomImage(convenorId);

              const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setPopupPosition({
                  x: rect.left - 120, // Position to the left (96px image + 24px margin)
                  y: rect.top + rect.height / 2
                });
                setHoveredConvenor(convenorId);
              };

              const handleMouseLeave = () => {
                setHoveredConvenor(null);
                setPopupPosition(null);
              };

              return (
                <div
                  key={convenorId}
                  ref={(el) => {
                    convenorRefs.current[convenorId] = el;
                  }}
                  className="relative flex items-center min-h-[1.5rem]"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <div
                    className="text-gray-600 text-sm cursor-pointer hover:text-gray-900 transition-colors flex items-center"
                    onClick={() => {
                      // Close any previously opened modal and open new one
                      if (selectedConvenor?.id === convenorImage.id) {
                        setSelectedConvenor(null);
                      } else {
                        setSelectedConvenor(convenorImage);
                        // Close sphere modal when convenor is clicked
                        setSelectedSphereImage(null);
                      }
                    }}
                  >
                    <span className="mr-2">⤷</span>
                    <span>Person Name ( {convenorName} )</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };


  // Render modal for selected convenor
  const renderConvenorModal = () => {
    if (!selectedConvenor) return null;

    return (
      <div className="fixed bottom-6 left-6 z-50">
        <div
          className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-2xl border-2 border-gray-200"
          style={{
            animation: 'scaleIn 0.3s ease-out'
          }}
        >
          <div className="relative aspect-square">
            <Image
              src={selectedConvenor.src}
              alt={selectedConvenor.alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
            />
            <button
              onClick={() => setSelectedConvenor(null)}
              className="absolute top-2 right-2 w-8 h-8 bg-black bg-opacity-50 rounded-full text-white flex items-center justify-center hover:bg-opacity-70 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {(selectedConvenor.title || selectedConvenor.description) && (
            <div className="p-6">
              {selectedConvenor.title && (
                <h3 className="text-xl font-bold mb-2">{selectedConvenor.title}</h3>
              )}
              {selectedConvenor.description && (
                <p className="text-gray-600">{selectedConvenor.description}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <main className="w-full min-h-screen flex justify-center items-start bg-gradient-to-br from-gray-50 to-gray-100 pt-22 relative">
        <h1 className="absolute top-6 left-10 text-[10rem] font-bold text-gray-900 tracking-tight">Our</h1>
        <h1 className="absolute top-37 left-12 text-[10rem] font-bold text-gray-900 tracking-tight">Team</h1>
      <div className="flex flex-col items-center gap-8">

        <SphereImageGrid
          images={IMAGES}
          containerSize={dimensions.width}
          sphereRadius={sphereRadius}
          dragSensitivity={0.8}
          momentumDecay={0.96}
          maxRotationSpeed={6}
          baseImageScale={baseImageScale}
          hoverScale={1.3}
          perspective={1000}
          autoRotate={true}
          autoRotateSpeed={0.2}
          selectedImage={selectedSphereImage}
          onImageSelect={(image) => {
            setSelectedSphereImage(image);
            // When sphere image is selected, close convenor modal
            if (image) {
              setSelectedConvenor(null);
            }
          }}
        />
      </div>

      {/* Core Team Convenors & Club Convenors */}
      <div className="fixed bottom-30 right-6 flex flex-col gap-8 max-w-md" style={{ transformOrigin: 'bottom right' }}>
        {/* Core Team Convenors */}
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Core Team Convenors</h2>
          <div className="space-y-0">
            {coreTeamRoles.map(role => renderExpandableItem(role, 'core'))}
          </div>
        </div>

        {/* Club Convenors */}
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Club Convenors</h2>
          <div className="space-y-0">
            {clubConvenors.map(club => renderExpandableItem(club, 'club'))}
          </div>
        </div>
      </div>

      {/* Hover Popup - Rendered outside container */}
      {hoveredConvenor && popupPosition && (
        <div
          className="fixed z-50 pointer-events-none transition-all duration-300 ease-out"
          style={{
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y}px`,
            transform: 'translateY(-50%)',
            opacity: hoveredConvenor ? 1 : 0
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-24 h-24 border-2 border-gray-200 relative">
            <Image
              src={getRandomImage(hoveredConvenor).src}
              alt={getRandomImage(hoveredConvenor).alt}
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
        </div>
      )}

      {/* Convenor Modal */}
      {renderConvenorModal()}
      </main>
    </>
  );
}
