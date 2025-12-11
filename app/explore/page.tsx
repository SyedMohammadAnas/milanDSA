'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Hash, Search, TrendingUp, RotateCcw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import DraggableCanvas from '@/components/draggable-canvas'
import {
  Post,
  PlacedImage,
  pickRandomCenter,
  calculateCircularPlacement,
  preloadImageDimensions,
  ImageDimensions
} from '@/lib/circular-placement'

interface TrendingHashtag {
  hashtag: string
  count: number
}

export default function ExplorePage() {
  const router = useRouter()
  const [student, setStudent] = useState<{ full_name: string } | null>(null)
  const [placedImages, setPlacedImages] = useState<PlacedImage[]>([])
  const [imageDimensions, setImageDimensions] = useState<Map<string, ImageDimensions>>(new Map())
  const [totalPosts, setTotalPosts] = useState(0)
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Upload modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [hashtags, setHashtags] = useState<string[]>([])
  const [hashtagInput, setHashtagInput] = useState('')
  const [uploading, setUploading] = useState(false)

  // Mobile trending toggle state
  const [mobileTrendingOpen, setMobileTrendingOpen] = useState(false)

  // Image selection states
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [isImageSelected, setIsImageSelected] = useState(false)
  const [isExitingSelection, setIsExitingSelection] = useState(false)
  const [selectedDisplayPositions, setSelectedDisplayPositions] = useState<PlacedImage[]>([])
  const [shouldResetPan, setShouldResetPan] = useState(false)

  // Check authentication
  useEffect(() => {
    const studentEmail = localStorage.getItem('studentEmail')
    if (!studentEmail) {
      router.push('/login')
      return
    }

    // Fetch student data
    const fetchStudent = async () => {
      const { data, error } = await supabase
        .from('student_database')
        .select('full_name')
        .eq('email', studentEmail)
        .single()

      if (error || !data) {
        console.error('Error fetching student:', error)
        router.push('/login')
        return
      }

      setStudent(data)
    }

    fetchStudent()
  }, [router])

  // Fetch posts and calculate circular placement
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch all posts
      const postsResponse = await fetch('/api/explore/posts')
      const postsData = await postsResponse.json()

      if (postsData.success) {
        const allPosts = postsData.posts
        setTotalPosts(postsData.total_count)

        // Preload image dimensions and calculate placement
        if (allPosts.length > 0) {
          const dimensions = await preloadImageDimensions(allPosts)
          setImageDimensions(dimensions)

          // Pick random center and calculate circular placement
          const center = pickRandomCenter(allPosts)
          if (center) {
            const placed = await calculateCircularPlacement(allPosts, center, dimensions)
            setPlacedImages(placed)
          }
        }
      }

      // Fetch trending hashtags
      const trendingResponse = await fetch('/api/explore/trending?limit=5')
      const trendingData = await trendingResponse.json()

      if (trendingData.success) {
        setTrendingHashtags(trendingData.trending)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Add hashtag
  const addHashtag = (tag: string) => {
    const cleanTag = tag.trim().replace(/^#/, '').toLowerCase()
    if (cleanTag && !hashtags.includes(cleanTag)) {
      setHashtags([...hashtags, cleanTag])
      setHashtagInput('')
    }
  }

  // Remove hashtag
  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter(t => t !== tag))
  }

  // Handle upload
  const handleUpload = async () => {
    if (!selectedImage || !student) return

    try {
      setUploading(true)

      const formData = new FormData()
      formData.append('image', selectedImage)
      formData.append('hashtags', JSON.stringify(hashtags))
      formData.append('posted_by', student.full_name)

      const response = await fetch('/api/explore/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        // Reset form
        setSelectedImage(null)
        setImagePreview('')
        setHashtags([])
        setUploadModalOpen(false)

        // Refresh posts
        await fetchPosts()
      } else {
        alert('Failed to upload image: ' + data.error)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchPosts()
      return
    }

    try {
      const response = await fetch(`/api/explore/posts?hashtag=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      if (data.success) {
        const filteredPosts = data.posts

        if (filteredPosts.length > 0) {
          const dimensions = await preloadImageDimensions(filteredPosts)
          setImageDimensions(dimensions)

          const center = pickRandomCenter(filteredPosts)
          if (center) {
            const placed = await calculateCircularPlacement(filteredPosts, center, dimensions)
            setPlacedImages(placed)
          }
        } else {
          setPlacedImages([])
        }
      }
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  // Handle trending hashtag click
  const handleTrendingClick = (hashtag: string) => {
    setSearchQuery(hashtag)
  }

  // Handle reset zoom
  const handleResetZoom = () => {
    if (isImageSelected) {
      handleExitSelection()
    }
    // The DraggableCanvas will handle the actual zoom reset
  }


  // Helper function for overlap detection
  const rectanglesOverlap = (
    x1: number, y1: number, w1: number, h1: number,
    x2: number, y2: number, w2: number, h2: number,
    padding: number = 30
  ): boolean => {
    return !(
      x1 + w1 + padding < x2 ||
      x2 + w2 + padding < x1 ||
      y1 + h1 + padding < y2 ||
      y2 + h2 + padding < y1
    )
  }

  // Handle post click for selection
  const handlePostClick = (post: Post) => {
    if (isImageSelected && selectedPost?.id === post.id) {
      // Clicking same image, do nothing
      return
    }

    setIsImageSelected(true)
    setSelectedPost(post)
    setShouldResetPan(true) // Reset pan to center the view

    // Reset the flag after animation
    setTimeout(() => setShouldResetPan(false), 100)

    // Check if the clicked image is already the center
    const centerImage = placedImages[0]
    if (centerImage.post.id === post.id) {
      // Already the center, just zoom in and show hashtags - no layout change needed
      setSelectedDisplayPositions(placedImages)
      return
    }

    // Different image clicked - create new layout
    const selectedImageData = placedImages.find(p => p.post.id === post.id)
    if (!selectedImageData) return

    const newPositions: PlacedImage[] = []

    // 1. Place selected image in center
    const selectedDims = imageDimensions.get(post.id) || { width: 400, height: 400 }
    newPositions.push({
      post,
      x: -selectedDims.width / 2,
      y: -selectedDims.height / 2,
      width: selectedDims.width,
      height: selectedDims.height,
      ringIndex: 0,
      angleOnRing: 0
    })

    // 2. Move previous center image to where the selected image was
    const centerDims = imageDimensions.get(centerImage.post.id) || { width: 400, height: 400 }
    newPositions.push({
      ...centerImage,
      x: selectedImageData.x,
      y: selectedImageData.y,
      width: centerDims.width * 0.2,
      height: centerDims.height * 0.2
    })

    // 3. Add all other images (shrunk to 20% size) avoiding overlaps
    const otherImages = placedImages.filter(p =>
      p.post.id !== post.id && p.post.id !== centerImage.post.id
    )

    for (const img of otherImages) {
      const shrunkWidth = img.width * 0.2
      const shrunkHeight = img.height * 0.2

      let placed = false
      let attempts = 0
      const maxAttempts = 50

      while (!placed && attempts < maxAttempts) {
        // Try original position first, then random positions
        const testX = attempts === 0 ? img.x : (Math.random() - 0.5) * 1200
        const testY = attempts === 0 ? img.y : (Math.random() - 0.5) * 900

        // Check overlap with all placed images
        let hasOverlap = false
        for (const placedImg of newPositions) {
          if (rectanglesOverlap(
            testX, testY, shrunkWidth, shrunkHeight,
            placedImg.x, placedImg.y, placedImg.width, placedImg.height,
            30
          )) {
            hasOverlap = true
            break
          }
        }

        if (!hasOverlap) {
          newPositions.push({
            ...img,
            x: testX,
            y: testY,
            width: shrunkWidth,
            height: shrunkHeight
          })
          placed = true
        }
        attempts++
      }

      // If couldn't place after max attempts, place it anyway (far away)
      if (!placed) {
        newPositions.push({
          ...img,
          x: img.x,
          y: img.y,
          width: shrunkWidth,
          height: shrunkHeight
        })
      }
    }

    setSelectedDisplayPositions(newPositions)
  }

  // Handle click outside to exit selection
  const handleExitSelection = () => {
    // Set exiting state for faster animation
    setIsExitingSelection(true)

    // Update the main placedImages with the current selected layout
    if (selectedDisplayPositions.length > 0) {
      // Restore full sizes for all images
      const restoredPositions = selectedDisplayPositions.map(placed => {
        const originalDims = imageDimensions.get(placed.post.id) || { width: 400, height: 400 }
        return {
          ...placed,
          width: originalDims.width,
          height: originalDims.height
        }
      })
      setPlacedImages(restoredPositions)
    }

    setIsImageSelected(false)
    setSelectedPost(null)
    setSelectedDisplayPositions([])

    // Reset exiting state after animation completes
    setTimeout(() => {
      setIsExitingSelection(false)
    }, 1000) // Slightly longer than the animation duration
  }

  return (
    <div className="min-h-screen bg-[#e9e9e9] text-black overflow-hidden">
      {/* Desktop Top Left - Trending Hashtags */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden md:block fixed top-6 left-6 z-10 bg-white/80 backdrop-blur-lg border border-gray-300 rounded-2xl p-4 group hover:max-w-xs transition-all duration-700"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 mb-2 text-[#171717]" />
          <h3 className="text-sm font-semibold mb-2 text-[#171717]">Trending Hashtags</h3>
        </div>
        <div className="space-y-2 max-h-0 overflow-hidden group-hover:max-h-96 transition-all duration-700">
          {trendingHashtags.slice(0, 3).map((item, index) => (
            <motion.button
              key={item.hashtag}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleTrendingClick(item.hashtag)}
              className="w-full flex items-center justify-between text-left hover:bg-gray-100 rounded-lg p-2 transition-colors"
            >
              <span className="text-sm text-gray-700">#{item.hashtag}</span>
              <span className="text-xs text-gray-500">{item.count}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Mobile Top Left - Trending Icon */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => setMobileTrendingOpen(!mobileTrendingOpen)}
        className="md:hidden fixed top-6 left-6 z-10 bg-white/80 backdrop-blur-lg border border-gray-300 rounded-2xl p-3"
      >
        <TrendingUp className="w-6 h-6 text-[#171717]" />
      </motion.button>

      {/* Mobile Trending Hashtags Dropdown */}
      <AnimatePresence>
        {mobileTrendingOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -20 }}
            className="md:hidden fixed top-20 left-6 z-10 bg-white/80 backdrop-blur-lg border border-gray-300 rounded-2xl p-4 min-w-48"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#171717]">Trending</h3>
              <button
                onClick={() => setMobileTrendingOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {trendingHashtags.slice(0, 5).map((item, index) => (
                <motion.button
                  key={item.hashtag}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    handleTrendingClick(item.hashtag)
                    setMobileTrendingOpen(false)
                  }}
                  className="w-full flex items-center justify-between text-left hover:bg-gray-100 rounded-lg p-2 transition-colors"
                >
                  <span className="text-sm text-gray-700">#{item.hashtag}</span>
                  <span className="text-xs text-gray-500">{item.count}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Top Right - Total Posts */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden md:block fixed top-10 md:top-6 right-6 z-10 bg-white/80 backdrop-blur-lg border border-gray-300 rounded-2xl px-5 py-2"
      >
        <div className="flex items-center gap-2 h-6">
          <span className="text-sm text-gray-700"> Total Posts</span>
          <span className="text-lg font-bold text-[#171717]">{totalPosts}</span>
        </div>
      </motion.div>

      {/* Mobile Top Right - Posts */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="md:hidden fixed top-6 right-6 z-10 bg-white/80 backdrop-blur-lg border border-gray-300 rounded-2xl px-4 py-2"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">posts</span>
          <span className="text-lg font-bold text-[#171717]">{totalPosts}</span>
        </div>
      </motion.div>

      {/* Mobile Reset Zoom Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleResetZoom}
        className="md:hidden fixed bottom-20 left-14 z-10 p-2 bg-white/80 backdrop-blur-lg border border-gray-300 rounded-full hover:bg-white transition-colors"
      >
        <RotateCcw className="w-5 h-5 text-[#171717]" />
      </motion.button>

      {/* Desktop Bottom Left - Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hidden md:block fixed bottom-6 left-6 z-10 w-96"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" /> {/* increased icon left padding and size */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search hashtags..."
            className="w-full pl-12 pr-20 py-3 bg-white/80 backdrop-blur-lg border border-gray-300 rounded-2xl text-base text-black placeholder-gray-500 focus:outline-none focus:border-[#171717] transition-colors"
          /> {/* increased padding, font size, and border radius */}
          <button
            onClick={handleSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-[#171717] hover:bg-gray-800 text-white rounded-xl text-xs font-medium transition-colors"
          > {/* increased button padding, rounded, and font size */}
            Search
          </button>
        </div>
      </motion.div>

      {/* Mobile Bottom Center - Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-10 w-80"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search hashtags..."
            className="w-full pl-12 pr-20 py-3 bg-white/80 backdrop-blur-lg border border-gray-300 rounded-2xl text-base text-black placeholder-gray-500 focus:outline-none focus:border-[#171717] transition-colors"
          />
          <button
            onClick={handleSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-[#171717] hover:bg-gray-800 text-white rounded-xl text-xs font-medium transition-colors"
          >
            Search
          </button>
        </div>
      </motion.div>

      {/* Bottom Right - Upload Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setUploadModalOpen(true)}
        className="fixed bottom-20 md:bottom-6 md:right-6 right-14 z-10 md:px-7 px-4 md:py-3 py-2 bg-[#171717] hover:bg-gray-800 text-white rounded-full flex items-center gap-2 transition-all"
      >
        <Upload className="w-4 h-4" />
        <span className="text-sm font-medium">Upload</span>
      </motion.button>

      {/* Draggable Canvas with Circular Image Display */}
      <DraggableCanvas
        className="w-full h-screen"
        onClickOutside={handleExitSelection}
        isSelectionMode={isImageSelected}
        targetZoom={isImageSelected ? 2.0 : 0.3}
        onResetZoom={handleResetZoom}
        resetPan={shouldResetPan}
        panOffset={isImageSelected ? { x: 0, y: -40 } : { x: 0, y: 0 }}
      >
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-[#171717] border-t-transparent rounded-full"
            />
          </div>
        ) : placedImages.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-600 text-lg">No posts found</p>
          </div>
        ) : (
          <div className="relative w-full h-full">
            {/* Center marker (optional, for debugging) */}
            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-0" />

            {/* Desktop Hashtags beside selected image */}
            <AnimatePresence>
              {isImageSelected && selectedPost && selectedDisplayPositions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="hidden md:block absolute z-30"
                  style={{
                    left: `calc(50% + ${selectedDisplayPositions[0].width / 2 + 20}px)`,
                    top: `calc(50% + ${-selectedDisplayPositions[0].height / 2}px)`,
                  }}
                >
                  <div className="flex flex-col gap-2">
                    {selectedPost.hashtags.map((hashtag, index) => (
                      <motion.div
                        key={hashtag}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-[#171717] text-white px-3 py-1 rounded-full text-sm font-medium"
                      >
                        #{hashtag}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile Hashtags below selected image */}
            <AnimatePresence>
              {isImageSelected && selectedPost && selectedDisplayPositions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="md:hidden absolute z-30"
                  style={{
                    left: `calc(50% - ${selectedDisplayPositions[0].width / 2}px)`,
                    top: `calc(50% + ${selectedDisplayPositions[0].height / 2 + 15}px)`,
                  }}
                >
                  <div className="flex flex-row flex-wrap gap-1.5 justify-start max-w-xs">
                    {selectedPost.hashtags.map((hashtag, index) => (
                      <motion.div
                        key={hashtag}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-[#171717] text-white px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                      >
                        #{hashtag}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Placed images */}
            {(isImageSelected ? selectedDisplayPositions : placedImages).map((placed, index) => {
              const isSelected = isImageSelected && selectedPost?.id === placed.post.id;
              const uniqueKey = `${placed.post.id}-${isImageSelected ? 'selected' : 'normal'}-${index}`;

              return (
                <motion.div
                  key={uniqueKey}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: isImageSelected ? 0 : (isExitingSelection ? index * 0.02 : index * 0.1),
                    duration: isImageSelected ? 0.4 : (isExitingSelection ? 0.3 : 0.6),
                    ease: 'easeOut'
                  }}
                  style={{
                    position: 'absolute',
                    left: `calc(50% + ${placed.x}px)`,
                    top: `calc(50% + ${placed.y}px)`,
                    width: `${placed.width}px`,
                    height: `${placed.height}px`,
                    zIndex: 20 // Ensure images are above the overlay
                  }}
                  className="cursor-pointer select-none group"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isImageSelected) {
                      // Not in selection mode, select this image
                      handlePostClick(placed.post);
                    } else if (isImageSelected && !isSelected) {
                      // In selection mode but clicked different image, select the new one
                      handlePostClick(placed.post);
                    }
                    // If clicked on selected image, do nothing (already selected)
                  }}
                >
                  <div className="relative w-full h-full">
                    {/* Main image container */}
                    <div
                      className={`absolute inset-0 overflow-hidden border-2 shadow-lg transition-all duration-300 ${
                        isSelected
                          ? 'border-[#ecff13]'
                          : 'border-gray-300 group-hover:shadow-xl'
                      }`}
                    >
                      <Image
                        src={placed.post.image_url}
                        alt={`Post by ${placed.post.posted_by}`}
                        fill
                        className="object-cover pointer-events-none"
                        sizes={`${placed.width}px`}
                        priority={index < 10}
                      />
                    </div>

                    {/* Yellow outline effect on hover */}
                    {!isSelected && (
                      <div
                        className="absolute inset-0 border-4 rounded-lg border-[#ecff13] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                          margin: '-6px'
                        }}
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </DraggableCanvas>

      {/* Upload Modal */}
      <AnimatePresence>
        {uploadModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => !uploading && setUploadModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-gray-300 rounded-3xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-black">Upload Post</h2>
                <button
                  onClick={() => !uploading && setUploadModalOpen(false)}
                  disabled={uploading}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Image Upload */}
              {!selectedImage ? (
                <label className="block w-full h-64 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-[#171717] transition-colors bg-gray-50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center h-full">
                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">Click to upload image</p>
                  </div>
                </label>
              ) : (
                imagePreview ? (
                  <div className="relative w-full h-64 rounded-2xl overflow-hidden mb-4">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      onClick={() => {
                        setSelectedImage(null)
                        setImagePreview('')
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : null
              )}

              {/* Hashtag Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium mt-2 mb-2 text-black">Add Hashtags</label>
                <div className="flex gap-2 mb-3">
                  <div className="relative flex-1">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={hashtagInput}
                      onChange={(e) => setHashtagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addHashtag(hashtagInput)
                        }
                      }}
                      placeholder="Type hashtag..."
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black placeholder-gray-500 focus:outline-none focus:border-[#171717]"
                    />
                  </div>
                  <button
                    onClick={() => addHashtag(hashtagInput)}
                    className="px-4 py-2 bg-[#171717] hover:bg-gray-800 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>

                {/* Selected Hashtags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {hashtags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 bg-[#171717]/10 border border-[#171717]/20 px-3 py-1 rounded-full text-sm text-black"
                    >
                      #{tag}
                      <button
                        onClick={() => removeHashtag(tag)}
                        className="hover:text-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Trending Suggestions */}
                {trendingHashtags.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-600 mb-2">Trending:</p>
                    <div className="flex flex-wrap gap-2">
                      {trendingHashtags.map(item => (
                        <button
                          key={item.hashtag}
                          onClick={() => addHashtag(item.hashtag)}
                          disabled={hashtags.includes(item.hashtag)}
                          className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-black"
                        >
                          #{item.hashtag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={!selectedImage || uploading}
                className="w-full py-3 bg-[#171717] hover:bg-gray-800 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {uploading ? 'Uploading...' : 'Upload Post'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
