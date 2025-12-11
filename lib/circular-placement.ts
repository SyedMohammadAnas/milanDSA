export interface Post {
  id: string;
  image_url: string;
  posted_by: string;
  hashtags: string[];
  created_at: string;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface PlacedImage {
  post: Post;
  x: number;
  y: number;
  width: number;
  height: number;
  ringIndex: number;
  angleOnRing: number;
}

/**
 * Pick a random post to serve as the center
 */
export function pickRandomCenter(posts: Post[]): Post | null {
  if (posts.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * posts.length);
  return posts[randomIndex];
}

/**
 * Load image and get its natural dimensions
 */
export async function loadImageDimensions(url: string): Promise<ImageDimensions> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      // Fallback dimensions if image fails to load
      resolve({ width: 400, height: 400 });
    };
    img.src = url;
  });
}

/**
 * Calculate maximum dimension (diagonal) of an image
 */
function getMaxDimension(width: number, height: number): number {
  return Math.sqrt(width * width + height * height);
}

/**
 * Calculate how many images can fit on a ring without overlapping
 */
function calculateImagesPerRing(
  ringRadius: number,
  avgImageSize: number,
  minSpacing: number = 50
): number {
  // Circumference of the ring
  const circumference = 2 * Math.PI * ringRadius;

  // Each image needs its size plus spacing
  const spacePerImage = avgImageSize + minSpacing;

  // How many can fit
  const count = Math.floor(circumference / spacePerImage);

  // Minimum 3 images per ring, maximum 20
  return Math.max(3, Math.min(count, 20));
}

/**
 * Check if two rectangles overlap (with padding)
 */
function rectanglesOverlap(
  x1: number, y1: number, w1: number, h1: number,
  x2: number, y2: number, w2: number, h2: number,
  padding: number = 30
): boolean {
  return !(
    x1 + w1 + padding < x2 ||
    x2 + w2 + padding < x1 ||
    y1 + h1 + padding < y2 ||
    y2 + h2 + padding < y1
  );
}

/**
 * Calculate circular placement for all posts
 */
export async function calculateCircularPlacement(
  posts: Post[],
  centerPost: Post,
  imageDimensions: Map<string, ImageDimensions>
): Promise<PlacedImage[]> {
  if (posts.length === 0) return [];

  const placedImages: PlacedImage[] = [];
  const remainingPosts = posts.filter(p => p.id !== centerPost.id);

  // Get center image dimensions
  const centerDims = imageDimensions.get(centerPost.id) || { width: 400, height: 400 };

  // Place center image at origin
  placedImages.push({
    post: centerPost,
    x: -centerDims.width / 2,
    y: -centerDims.height / 2,
    width: centerDims.width,
    height: centerDims.height,
    ringIndex: 0,
    angleOnRing: 0
  });

  // Calculate average image size for spacing
  let totalSize = 0;
  let count = 0;
  imageDimensions.forEach(dims => {
    totalSize += getMaxDimension(dims.width, dims.height);
    count++;
  });
  const avgImageSize = count > 0 ? totalSize / count : 400;

  // Start with initial ring radius (based on center image size)
  const centerMaxDim = getMaxDimension(centerDims.width, centerDims.height);
  let currentRadius = centerMaxDim / 2 + avgImageSize / 2 + 100;

  let ringIndex = 1;
  let postIndex = 0;
  let isClockwise = true; // First ring clockwise, then alternate

  while (postIndex < remainingPosts.length) {
    const imagesForThisRing = calculateImagesPerRing(currentRadius, avgImageSize);
    const angleStep = (2 * Math.PI) / imagesForThisRing;
    const startAngle = isClockwise ? 0 : Math.PI; // Offset for variety

    let placedOnThisRing = 0;
    let attempts = 0;
    const maxAttempts = imagesForThisRing * 2;

    for (let i = 0; i < imagesForThisRing && postIndex < remainingPosts.length && attempts < maxAttempts; i++) {
      const post = remainingPosts[postIndex];
      const dims = imageDimensions.get(post.id) || { width: 400, height: 400 };

      // Calculate angle based on direction
      const angleOffset = isClockwise ? i * angleStep : -i * angleStep;
      const angle = startAngle + angleOffset;

      // Calculate position on the ring
      const x = Math.cos(angle) * currentRadius - dims.width / 2;
      const y = Math.sin(angle) * currentRadius - dims.height / 2;

      // Check for overlaps with already placed images
      let hasOverlap = false;
      for (const placed of placedImages) {
        if (rectanglesOverlap(
          x, y, dims.width, dims.height,
          placed.x, placed.y, placed.width, placed.height
        )) {
          hasOverlap = true;
          break;
        }
      }

      if (!hasOverlap) {
        // Place the image
        placedImages.push({
          post,
          x,
          y,
          width: dims.width,
          height: dims.height,
          ringIndex,
          angleOnRing: angle
        });
        placedOnThisRing++;
        postIndex++;
      }

      attempts++;
    }

    // Move to next ring
    if (placedOnThisRing === 0) {
      // If we couldn't place any images, increase radius more
      currentRadius += avgImageSize * 0.8;
    } else {
      // Normal radius increment
      currentRadius += avgImageSize * 0.7 + 80;
    }

    ringIndex++;
    isClockwise = !isClockwise; // Alternate direction
  }

  return placedImages;
}

/**
 * Preload all image dimensions
 */
export async function preloadImageDimensions(posts: Post[]): Promise<Map<string, ImageDimensions>> {
  const dimensionsMap = new Map<string, ImageDimensions>();

  await Promise.all(
    posts.map(async (post) => {
      try {
        const dims = await loadImageDimensions(post.image_url);
        dimensionsMap.set(post.id, dims);
      } catch (error) {
        console.error(`Failed to load dimensions for ${post.id}`, error);
        // Use fallback dimensions
        dimensionsMap.set(post.id, { width: 400, height: 400 });
      }
    })
  );

  return dimensionsMap;
}
