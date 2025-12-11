# Explore Page - New Circular Placement Implementation

## 🎯 Overview

The explore page has been completely revamped with a new circular placement system and an interactive draggable infinite canvas. Images are now displayed at their full size in concentric circles around a randomly selected center image.

## 🔄 What Changed

### Old System (Removed)
- ❌ Spiral coordinate system stored in database
- ❌ Fixed image dimensions (160x160px)
- ❌ Static spiral layout
- ❌ Hover effects showing name/hashtags
- ❌ `get_next_spiral_position()` database function
- ❌ `lib/spiral-utils.ts` utility file

### New System (Implemented)
- ✅ Dynamic circular placement algorithm
- ✅ Full-size images (uses actual image dimensions)
- ✅ Interactive draggable canvas
- ✅ Pan & zoom functionality
- ✅ Alternating clockwise/anticlockwise placement
- ✅ Intelligent overlap prevention
- ✅ Random center selection on each page load

## 🏗️ Architecture

### 1. Database Changes

**Migration**: `supabase/migrations/20241211100000_remove_spiral_system.sql`

```sql
-- Removed get_next_spiral_position() function
-- Made position column nullable (kept for backward compatibility)
-- Removed position validation constraint
```

**Updated Table**: `explore_posts_manager`
- `position` is now optional (nullable)
- No longer calculated or required during upload

### 2. New Components

#### `components/draggable-canvas.tsx`
Interactive canvas component with:
- **Mouse drag**: Click and drag to pan
- **Touch support**: Swipe to pan on mobile
- **Zoom**: Mouse wheel to zoom in/out (30%-300%)
- **Reset button**: Return to center view
- **Zoom indicator**: Shows current zoom percentage

#### `lib/circular-placement.ts`
Core placement algorithm with functions:

**`pickRandomCenter(posts)`**
- Selects random image as center point

**`loadImageDimensions(url)`**
- Loads actual image dimensions asynchronously
- Fallback to 400x400 if load fails

**`calculateCircularPlacement(posts, center, dimensions)`**
- Main algorithm for circular placement
- Creates concentric rings around center
- Alternates direction per ring (clockwise → anticlockwise → clockwise...)
- Prevents overlaps between images

**`preloadImageDimensions(posts)`**
- Batch loads all image dimensions before placement
- Returns Map of post ID → dimensions

### 3. Placement Algorithm

#### How It Works:

```
Step 1: Pick random center image → place at (0, 0)

Step 2: Calculate first ring radius
  - Based on center image size + average image size + spacing

Step 3: Place images on Ring 1 (CLOCKWISE)
  - Calculate how many images fit on circumference
  - Place images evenly around circle
  - Skip if overlap detected

Step 4: Place images on Ring 2 (ANTICLOCKWISE)
  - Increase radius
  - Alternate direction
  - Continue overlap checking

Step 5: Repeat until all images placed
```

#### Mathematical Details:

**Ring Radius Calculation:**
```typescript
radius = previousRadius + avgImageSize * 0.7 + 80px
```

**Images Per Ring:**
```typescript
circumference = 2 * π * radius
imagesPerRing = Math.floor(circumference / (avgImageSize + spacing))
// Min: 3, Max: 20
```

**Angular Position:**
```typescript
// Clockwise
angle = startAngle + (i * angleStep)

// Anticlockwise
angle = startAngle - (i * angleStep)

where angleStep = 2π / imagesPerRing
```

**Cartesian Coordinates:**
```typescript
x = cos(angle) * radius - imageWidth/2
y = sin(angle) * radius - imageHeight/2
```

**Overlap Detection:**
```typescript
rectanglesOverlap(img1, img2, padding = 30px)
// Returns true if bounding boxes intersect
```

## 🎨 UI Features

### Main Canvas
- **Infinite draggable space**: Pan in any direction
- **Zoom controls**: Wheel to zoom, button to reset
- **Full-size images**: Display at actual dimensions
- **Smooth animations**: Staggered fade-in effect
- **No hover effects**: Clean, minimal interaction

### Fixed UI Elements (unchanged)
- **Top Left**: Trending hashtags (clickable)
- **Top Right**: Total post count
- **Bottom Left**: Search bar
- **Bottom Right**: Upload button

### Upload Modal (unchanged functionality)
- Image selection with preview
- Hashtag management
- Trending suggestions
- Plain color scheme (#e9e9e9 background, #171717 buttons)

## 🚀 Setup Instructions

### 1. Run New Migration

```bash
# Option A: Manual (Supabase Dashboard)
# Copy contents of: supabase/migrations/20241211100000_remove_spiral_system.sql
# Execute in SQL Editor

# Option B: CLI
supabase db push
```

### 2. Restart Development Server

```bash
npm run dev
```

The configuration changes require a server restart.

### 3. Clear Existing Data (Optional)

If you want to start fresh:

```sql
DELETE FROM explore_posts_manager;
```

## 📊 Performance Optimizations

### Image Loading
- Preloads all image dimensions before placement
- Uses Next.js Image component for optimization
- Priority loading for first 10 images
- Lazy loading for remaining images

### Canvas Rendering
- GPU-accelerated transforms for pan/zoom
- `will-change` CSS property for smooth animations
- No re-calculations during drag (pure CSS transforms)
- Efficient overlap detection algorithm

### Memory Management
- Dimensions cached in Map structure
- Only visible images rendered with Next.js optimization
- Touch events use `passive: false` to prevent scroll

## 🎮 User Interactions

### Canvas Controls
| Action | Method |
|--------|--------|
| Pan | Click & drag / Touch & swipe |
| Zoom In | Scroll up |
| Zoom Out | Scroll down |
| Reset View | Click "Reset View" button |

### Zoom Limits
- **Minimum**: 30% (0.3x)
- **Maximum**: 300% (3x)
- **Smooth scaling**: Prevented jarring jumps

## 🔍 Technical Details

### Coordinate System
```
Canvas Center: (50%, 50%)
Image positions: Relative to center
Transform: translate(x, y) from center point
```

### Image Placement
```
Position = {
  x: centerX + offsetX,
  y: centerY + offsetY,
  width: actualWidth,
  height: actualHeight
}
```

### Ring Direction
```
Ring 1: Clockwise (CW)
Ring 2: Counter-clockwise (CCW)
Ring 3: Clockwise (CW)
Ring 4: Counter-clockwise (CCW)
...
```

## 🐛 Troubleshooting

### Images Not Showing
1. Check browser console for image loading errors
2. Verify Supabase storage bucket is public
3. Check `next.config.ts` includes `*.supabase.co` domain

### Canvas Not Draggable
1. Ensure `DraggableCanvas` is properly imported
2. Check browser console for JavaScript errors
3. Clear browser cache and reload

### Images Overlapping
1. Algorithm includes 30px padding by default
2. If overlap occurs, increase `minSpacing` parameter
3. Check image dimensions are loading correctly

### Poor Performance
1. Reduce number of images loaded
2. Check image file sizes (optimize before upload)
3. Disable animations temporarily for debugging

## 🔮 Future Enhancements

Potential improvements:

- [ ] Virtual viewport rendering (only render visible images)
- [ ] Image compression on upload
- [ ] Pinch-to-zoom on mobile
- [ ] Double-click to focus on image
- [ ] Minimap showing canvas overview
- [ ] Save/share canvas layout
- [ ] Animation toggle option
- [ ] Dark mode support
- [ ] Keyboard navigation (arrow keys to pan)
- [ ] Custom zoom levels (fit all, 100%, etc.)

## 📝 API Changes

### Upload Endpoint (`/api/explore/upload`)

**Before:**
```typescript
// Required position calculation
const positionData = await supabase.rpc('get_next_spiral_position')
```

**After:**
```typescript
// No position needed
await supabase.from('explore_posts_manager').insert({
  image_url,
  posted_by,
  hashtags
  // position removed
})
```

### Posts Endpoint (`/api/explore/posts`)
- No changes required
- Still returns all post data
- Position field ignored if present

## 🎓 Learning Resources

### Circular Placement Algorithm
- Based on circle packing principles
- Adapted from astronomy star chart layouts
- Similar to force-directed graph layouts

### Canvas Interaction
- Uses standard HTML5 drag events
- Transform-based positioning (no reflow)
- Optimized for 60fps interaction

## 📄 Files Modified

1. ✅ `supabase/migrations/20241211100000_remove_spiral_system.sql` - NEW
2. ✅ `lib/circular-placement.ts` - NEW
3. ✅ `components/draggable-canvas.tsx` - NEW
4. ✅ `app/explore/page.tsx` - REWRITTEN
5. ✅ `app/api/explore/upload/route.ts` - UPDATED
6. ✅ `lib/database.types.ts` - UPDATED
7. ❌ `lib/spiral-utils.ts` - DELETED

## ✨ Summary

The new implementation provides:
- **Better visual experience**: Full-size images in circular layout
- **Interactive exploration**: Drag, pan, zoom canvas
- **Improved performance**: Efficient placement algorithm
- **Cleaner code**: Removed database-side positioning logic
- **More flexibility**: Easy to adjust placement parameters

Enjoy exploring! 🎉
