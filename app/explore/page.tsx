'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Hash, Search, TrendingUp, Image as ImageIcon } from 'lucide-react'
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
  const [posts, setPosts] = useState<Post[]>([])
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
        setPosts(allPosts)
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
        setPosts(filteredPosts)

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

  return (
    <div className="min-h-screen bg-[#e9e9e9] text-black overflow-hidden">
      {/* Top Left - Trending Hashtags */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-6 left-6 z-10 bg-white/80 backdrop-blur-lg border border-gray-300 rounded-2xl p-4 group hover:max-w-xs transition-all duration-700"
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

      {/* Top Right - Total Posts - reduced height */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-6 right-6 z-10 bg-white/80 backdrop-blur-lg border border-gray-300 rounded-2xl px-5 py-2"
      >
        <div className="flex items-center gap-2 h-6">
          <span className="text-sm text-gray-700"> Total Posts</span>
          <span className="text-lg font-bold text-[#171717]">{totalPosts}</span>
        </div>
      </motion.div>

      {/* Bottom Left - Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-6 left-6 z-10 w-96" // increased width from w-80 to w-96
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

      {/* Bottom Right - Upload Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setUploadModalOpen(true)}
        className="fixed bottom-6 right-6 z-10 px-7 py-3 bg-[#171717] hover:bg-gray-800 text-white rounded-full flex items-center gap-2 transition-all"
      >
        <Upload className="w-4 h-4" />
        <span className="text-sm font-medium">Upload</span>
      </motion.button>

      {/* Draggable Canvas with Circular Image Display */}
      <DraggableCanvas className="w-full h-screen">
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

            {/* Placed images */}
            {placedImages.map((placed, index) => (
              <motion.div
                key={placed.post.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.6,
                  ease: 'easeOut'
                }}
                style={{
                  position: 'absolute',
                  left: `calc(50% + ${placed.x}px)`,
                  top: `calc(50% + ${placed.y}px)`,
                  width: `${placed.width}px`,
                  height: `${placed.height}px`,
                }}
                className="cursor-pointer select-none"
              >
                <div className="relative w-full h-full overflow-hidden border-2 border-gray-300 shadow-lg hover:shadow-xl transition-shadow">
                  <Image
                    src={placed.post.image_url}
                    alt={`Post by ${placed.post.posted_by}`}
                    fill
                    className="object-cover pointer-events-none"
                    sizes={`${placed.width}px`}
                    priority={index < 10}
                  />
                </div>
              </motion.div>
            ))}
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
