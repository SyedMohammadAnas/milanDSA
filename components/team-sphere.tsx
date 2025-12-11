    "use client";

import SphereImageGrid, { ImageData } from "@/components/ui/img-sphere";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronRight, ChevronDown, ChevronUp, X, RefreshCw } from 'lucide-react';

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
  const [isMobile, setIsMobile] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [hoveredConvenor, setHoveredConvenor] = useState<string | null>(null);
  const [selectedConvenor, setSelectedConvenor] = useState<ImageData | null>(null);
  const [selectedSphereImage, setSelectedSphereImage] = useState<ImageData | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const convenorRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Mobile pagination state - EDIT HERE: Change 5 to adjust items per page
  const [corePage, setCorePage] = useState(0);
  const [clubPage, setClubPage] = useState(0);
  const [mobileView, setMobileView] = useState<'club' | 'core' | 'directors' | 'managers'>('directors'); // Toggle between club, core, directors, and managers views
  const itemsPerPage = 5;

  useEffect(() => {
    // Calculate dimensions based on viewport
    const updateDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // MOBILE: Use viewport dimensions, ensure no overflow
      // For mobile, use a smaller multiplier to fit better
      const mobile = width < 768; // Tailwind's md breakpoint
      setIsMobile(mobile);

      const size = mobile
        ? Math.min(width, height) * 0.85  // Slightly smaller for mobile
        : Math.min(width, height) * 0.9;  // Desktop size

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

  // Sphere configuration - EDIT HERE to adjust sphere radius
  // Current: 0.50 for mobile, 0.45 for desktop
  // Increase value for larger sphere, decrease for smaller
  const sphereRadius = dimensions.width * (isMobile ? 0.40 : 0.45);

  // Image scale configuration - EDIT HERE to adjust team member image sizes
  // Current: 0.28 for mobile (larger images), 0.20 for desktop
  // Increase value for larger images, decrease for smaller
  // Mobile images are larger to improve visibility on small screens
  const baseImageScale = isMobile ? 0.60 : 0.20;

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
    'Transport & Acc',
    'Content',
    'EMCEE',
    'Media',
    'Certificate & Prizes',
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

  // Directors data
  const directors = [
    {
      name: 'Nisha Ashokan',
      role: 'Director - Directorate Student Affairs',
      image: '/Directors_Images/NishaAshokan.png'
    },
    {
      name: 'Prince Kalyanasundaram',
      role: 'Deputy Director',
      image: '/Directors_Images/PrinceKalyanasundaram.png'
    },
    {
      name: 'S Pradeep',
      role: 'Assistant Director',
      image: '/Directors_Images/SPradeep.png'
    }
  ];

  // Managers data
  const managers = [
    {
      name: 'Dhandayuthapani B',
      role: 'Event Manager',
      image: '/Managers_Images/Dhandayuthapani.png'
    },
    {
      name: 'Rajiv D',
      role: 'Assistant Manager',
      image: '/Managers_Images/RajivD.png'
    }
  ];

  // Get random image from sphere for convenor
  const getRandomImage = (convenorId: string): ImageData => {
    // Use convenorId as seed to get consistent image per convenor
    const hash = convenorId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = hash % IMAGES.length;
    return IMAGES[index];
  };

  // Render expandable item - Desktop version with hover
  const renderExpandableItem = (item: string, category: 'core' | 'club', disableHover: boolean = false) => {
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
          <span className="text-gray-700 text-base">{item}</span>
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
                if (disableHover) return; // Disable hover on mobile
                const rect = e.currentTarget.getBoundingClientRect();
                setPopupPosition({
                  x: rect.left - 120, // Position to the left (96px image + 24px margin)
                  y: rect.top + rect.height / 2
                });
                setHoveredConvenor(convenorId);
              };

              const handleMouseLeave = () => {
                if (disableHover) return; // Disable hover on mobile
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
                  onMouseEnter={disableHover ? undefined : handleMouseEnter}
                  onMouseLeave={disableHover ? undefined : handleMouseLeave}
                >
                  <div
                    className="text-gray-600 text-base cursor-pointer hover:text-gray-900 transition-colors flex items-center"
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
                    <span>Person Name</span>
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

    // EDIT HERE: Modal positioning - bottom-4 for mobile, bottom-6 for desktop
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:bottom-6 md:left-6 md:right-auto md:max-w-md">
        <div
          className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border-2 border-gray-200"
          style={{
            animation: 'scaleIn 0.3s ease-out'
          }}
        >
          <div className="relative aspect-square">
            <Image
              src={selectedConvenor.src}
              alt={selectedConvenor.alt}
              width={400}
              height={400}
              className="w-full h-full object-cover"
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
        /* Hide scrollbar for Chrome, Safari and Opera */
        .overflow-y-auto::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .overflow-y-auto {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        /* MOBILE: Prevent scrolling - EDIT HERE if you need to adjust scroll behavior */
        @media (max-width: 767px) {
          html, body {
            overflow: hidden !important;
            height: 100vh;
            width: 100vw;
            position: relative;
          }
        }
        /* Smooth pagination transitions */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeOutDown {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-10px);
          }
        }
        .pagination-item-enter {
          animation: fadeInUp 0.3s ease-out forwards;
        }
        .pagination-item-exit {
          animation: fadeOutDown 0.2s ease-in forwards;
        }
        .arrow-transition {
          transition: transform 0.3s ease-out, opacity 0.2s ease-out;
        }
        /* View toggle transitions */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(-10px);
          }
        }
        .view-content-enter {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .view-content-exit {
          animation: fadeOut 0.2s ease-in forwards;
        }
        .refresh-icon {
          transition: transform 0.3s ease-out;
        }
        .refresh-icon:hover {
          transform: rotate(180deg);
        }
      `}</style>
      {/* MOBILE VIEW: Fixed container, no scrolling */}
      <main className="w-full h-screen flex flex-col justify-end items-center bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden md:min-h-screen md:justify-center md:items-center md:pt-22 animate-in fade-in duration-1000">
        {/* EDIT HERE: Text sizes for "Our" and "Team" */}
        {/* Mobile: text-5xl (reduced from 10rem), Desktop: text-[10rem] */}
        {/* Adjust text-5xl value to make text smaller/larger on mobile */}
        <h1 className="absolute top-18 left-4 text-6xl font-bold text-gray-900 tracking-tight md:top-15 md:left-10 md:text-[10rem] z-50 animate-in fade-in duration-1000">Our</h1>
        <h1 className="absolute top-30 left-5 text-6xl font-bold text-gray-900 tracking-tight md:top-46 md:left-12 md:text-[10rem] z-50 animate-in fade-in duration-1000">Team</h1>

      {/* MOBILE: Convenor Lists - Toggle between Club and Core views */}
      {/* EDIT HERE: Adjust itemsPerPage (line 115) to change how many items show per page */}
      {/* EDIT HERE: Adjust mt-24 and mb-0 to change vertical spacing */}
      <div className="flex md:hidden w-full px-4 mt-24 mb-0 justify-end">
        {/* Single column that toggles between views - Right aligned */}
        <div className="flex flex-col items-end max-w-[50%]">
          {/* Small dim indicator text above heading */}
          <div className="text-xs font-medium text-gray-400 mb-1 mr-3">
            {mobileView === 'directors' ? 'Open Managers ⤵' : mobileView === 'managers' ? 'Open Core team ⤵' : mobileView === 'core' ? 'Open Clubs ⤵' : 'Open Directors ⤵'}
          </div>

          {/* Header with toggle icon - switches between Directors, Managers, Core and Club headings */}
          <div className="flex items-center gap-2 mb-2">
            {mobileView === 'directors' ? (
              <h2 className="text-base font-bold text-gray-900">Directors</h2>
            ) : mobileView === 'managers' ? (
              <h2 className="text-base font-bold text-gray-900">Managers</h2>
            ) : mobileView === 'core' ? (
              <h2 className="text-base font-bold text-gray-900">Core Team Convenors</h2>
            ) : (
              <h2 className="text-base font-bold text-gray-900">Club Convenors</h2>
            )}
            <button
              onClick={() => {
                setIsViewTransitioning(true);
                setTimeout(() => {
                  setMobileView(prev => {
                    if (prev === 'directors') return 'managers';
                    if (prev === 'managers') return 'core';
                    if (prev === 'core') return 'club';
                    return 'directors';
                  });
                  setTimeout(() => {
                    setIsViewTransitioning(false);
                  }, 50);
                }, 200);
              }}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="Toggle between Directors, Managers, Core and Club views"
            >
              <RefreshCw size={16} className="text-gray-600 refresh-icon" />
            </button>
          </div>

          {/* Content area with smooth transitions - Right aligned */}
          <div className="space-y-1 relative min-h-[200px] w-full">
            {mobileView === 'directors' ? (
              <div key="directors-view" className="view-content-enter">
                {directors.map((director, index) => {
                  const directorId = `mobile-director-${index}`;
                  return (
                    <div key={directorId} className="pagination-item-enter mb-3" style={{ animationDelay: `${index * 0.03}s` }}>
                      <div
                        className="text-gray-600 text-base cursor-pointer hover:text-gray-900 transition-colors flex items-center"
                        onClick={() => {
                          // Create a mock ImageData object for the modal
                          const directorImageData = {
                            id: directorId,
                            src: director.image,
                            alt: director.name,
                            title: director.name,
                            description: director.role
                          };
                          // Close any previously opened modal and open new one
                          if (selectedConvenor?.id === directorImageData.id) {
                            setSelectedConvenor(null);
                          } else {
                            setSelectedConvenor(directorImageData);
                            // Close sphere modal when director is clicked
                            setSelectedSphereImage(null);
                          }
                        }}
                      >
                        <span className="mr-2">⤷</span>
                        <span>{director.role}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : mobileView === 'managers' ? (
              <div key="managers-view" className="view-content-enter">
                {managers.map((manager, index) => {
                  const managerId = `mobile-manager-${index}`;
                  return (
                    <div key={managerId} className="pagination-item-enter mb-3" style={{ animationDelay: `${index * 0.03}s` }}>
                      <div
                        className="text-gray-600 text-base cursor-pointer hover:text-gray-900 transition-colors flex items-center"
                        onClick={() => {
                          // Create a mock ImageData object for the modal
                          const managerImageData = {
                            id: managerId,
                            src: manager.image,
                            alt: manager.name,
                            title: manager.name,
                            description: manager.role
                          };
                          // Close any previously opened modal and open new one
                          if (selectedConvenor?.id === managerImageData.id) {
                            setSelectedConvenor(null);
                          } else {
                            setSelectedConvenor(managerImageData);
                            // Close sphere modal when manager is clicked
                            setSelectedSphereImage(null);
                          }
                        }}
                      >
                        <span className="mr-2">⤷</span>
                        <span>{manager.role}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : mobileView === 'club' ? (
              <div key="club-view" className="view-content-enter">
                {clubConvenors
                  .slice(clubPage * itemsPerPage, (clubPage + 1) * itemsPerPage)
                  .map((club, index) => (
                    <div key={`${clubPage}-${club}`} className="pagination-item-enter" style={{ animationDelay: `${index * 0.03}s` }}>
                      {renderExpandableItem(club, 'club', true)}
                    </div>
                  ))}
              </div>
            ) : (
              <div key="core-view" className="view-content-enter">
                {coreTeamRoles
                  .slice(corePage * itemsPerPage, (corePage + 1) * itemsPerPage)
                  .map((role, index) => (
                    <div key={`${corePage}-${role}`} className="pagination-item-enter" style={{ animationDelay: `${index * 0.03}s` }}>
                      {renderExpandableItem(role, 'core', true)}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Pagination button - shows for active view, right aligned */}
          {mobileView === 'club' && clubConvenors.length > itemsPerPage && (
            <button
              onClick={() => {
                const maxPage = Math.ceil(clubConvenors.length / itemsPerPage) - 1;
                setIsTransitioning(prev => ({ ...prev, club: true }));
                setTimeout(() => {
                  if (clubPage < maxPage) {
                    setClubPage(prev => prev + 1);
                  } else {
                    setClubPage(0);
                  }
                  setTimeout(() => {
                    setIsTransitioning(prev => ({ ...prev, club: false }));
                  }, 50);
                }, 200);
              }}
              className="mt-2 flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors text-sm self-end"
            >
              <span className="arrow-transition">{clubPage < Math.ceil(clubConvenors.length / itemsPerPage) - 1 ? 'More' : 'Back'}</span>
              <div className="arrow-transition inline-flex">
                {clubPage < Math.ceil(clubConvenors.length / itemsPerPage) - 1 ? (
                  <ChevronDown size={14} className="arrow-transition" />
                ) : (
                  <ChevronUp size={14} className="arrow-transition" />
                )}
              </div>
            </button>
          )}

          {mobileView === 'core' && coreTeamRoles.length > itemsPerPage && (
            <button
              onClick={() => {
                const maxPage = Math.ceil(coreTeamRoles.length / itemsPerPage) - 1;
                setIsTransitioning(prev => ({ ...prev, core: true }));
                setTimeout(() => {
                  if (corePage < maxPage) {
                    setCorePage(prev => prev + 1);
                  } else {
                    setCorePage(0);
                  }
                  setTimeout(() => {
                    setIsTransitioning(prev => ({ ...prev, core: false }));
                  }, 50);
                }, 200);
              }}
              className="mt-2 flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors text-sm self-end"
            >
              <span className="arrow-transition">{corePage < Math.ceil(coreTeamRoles.length / itemsPerPage) - 1 ? 'More' : 'Back'}</span>
              <div className="arrow-transition inline-flex">
                {corePage < Math.ceil(coreTeamRoles.length / itemsPerPage) - 1 ? (
                  <ChevronDown size={14} className="arrow-transition" />
                ) : (
                  <ChevronUp size={14} className="arrow-transition" />
                )}
              </div>
            </button>
          )}
        </div>
      </div>

      {/* MOBILE: Sphere positioned above bottom, Desktop: centered */}
      <div className="flex flex-col items-center justify-center gap-8 pb-0 md:pb-0 md:w-full">

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

      {/* Directors, Managers, Core Team Convenors & Club Convenors - DESKTOP VIEW ONLY */}
      {/* Desktop: Fixed position on right side with hover preview */}
      {/* EDIT HERE: Adjust maxHeight values to change container size if needed */}
      <div className="hidden md:flex fixed right-6 top-1/2 -translate-y-1/2 flex-row gap-12 max-w-2xl" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
        {/* Directors & Managers */}
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex-shrink-0">Directors</h2>
          <div className="space-y-2 mb-10">
            {directors.map((director, index) => {
              const directorId = `director-${index}`;

              const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setPopupPosition({
                  x: rect.left - 120, // Position to the left (96px image + 24px margin)
                  y: rect.top + rect.height / 2
                });
                setHoveredConvenor(directorId);
              };

              const handleMouseLeave = () => {
                setHoveredConvenor(null);
                setPopupPosition(null);
              };

              return (
                <div
                  key={directorId}
                  ref={(el) => {
                    convenorRefs.current[directorId] = el;
                  }}
                  className="relative flex items-center min-h-[1.5rem]"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <div
                    className="text-gray-600 text-base cursor-pointer hover:text-gray-900 transition-colors flex items-center"
                    onClick={() => {
                      // Create a mock ImageData object for the modal
                      const directorImageData = {
                        id: directorId,
                        src: director.image,
                        alt: director.name,
                        title: director.name,
                        description: director.role
                      };
                      // Close any previously opened modal and open new one
                      if (selectedConvenor?.id === directorImageData.id) {
                        setSelectedConvenor(null);
                      } else {
                        setSelectedConvenor(directorImageData);
                        // Close sphere modal when director is clicked
                        setSelectedSphereImage(null);
                      }
                    }}
                  >
                    <span className="mr-2">⤷</span>
                    <span>{director.role}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 ml-25 flex-shrink-0">Managers</h2>
          <div className="space-y-2 ml-25">
            {managers.map((manager, index) => {
              const managerId = `manager-${index}`;

              const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setPopupPosition({
                  x: rect.left - 120, // Position to the left (96px image + 24px margin)
                  y: rect.top + rect.height / 2
                });
                setHoveredConvenor(managerId);
              };

              const handleMouseLeave = () => {
                setHoveredConvenor(null);
                setPopupPosition(null);
              };

              return (
                <div
                  key={managerId}
                  ref={(el) => {
                    convenorRefs.current[managerId] = el;
                  }}
                  className="relative flex items-center min-h-[1.5rem]"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <div
                    className="text-gray-600 text-base cursor-pointer hover:text-gray-900 transition-colors flex items-center"
                    onClick={() => {
                      // Create a mock ImageData object for the modal
                      const managerImageData = {
                        id: managerId,
                        src: manager.image,
                        alt: manager.name,
                        title: manager.name,
                        description: manager.role
                      };
                      // Close any previously opened modal and open new one
                      if (selectedConvenor?.id === managerImageData.id) {
                        setSelectedConvenor(null);
                      } else {
                        setSelectedConvenor(managerImageData);
                        // Close sphere modal when manager is clicked
                        setSelectedSphereImage(null);
                      }
                    }}
                  >
                    <span className="mr-2">⤷</span>
                    <span>{manager.role}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Core Team Convenors & Club Convenors */}
        <div className="flex flex-col gap-6">
          {/* Core Team Convenors */}
          <div className="flex flex-col" style={{ maxHeight: 'calc(50vh - 2rem)' }}>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex-shrink-0">Core Team Convenors</h2>
            <div
              className="space-y-0 overflow-y-auto pr-2"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {coreTeamRoles.map(role => renderExpandableItem(role, 'core', false))}
            </div>
          </div>

          {/* Club Convenors */}
          <div className="flex flex-col" style={{ maxHeight: 'calc(50vh - 2rem)' }}>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex-shrink-0">Club Convenors</h2>
            <div
              className="space-y-0 overflow-y-auto pr-2"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {clubConvenors.map(club => renderExpandableItem(club, 'club', false))}
            </div>
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
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-24 h-24 border-2 border-gray-200">
            <Image
              src={getRandomImage(hoveredConvenor).src}
              alt={getRandomImage(hoveredConvenor).alt}
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Convenor Modal - Responsive positioning */}
      {/* EDIT HERE: Adjust bottom-6 and left-6 values to change modal position on mobile */}
      {renderConvenorModal()}
      </main>
    </>
  );
}
