-- Create explore_posts_manager table
CREATE TABLE explore_posts_manager (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  posted_by TEXT NOT NULL,
  hashtags JSONB NOT NULL DEFAULT '[]'::jsonb,
  position JSONB NOT NULL, -- {x: number, y: number}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_position CHECK (
    jsonb_typeof(position) = 'object' AND
    position ? 'x' AND
    position ? 'y'
  )
);

-- Create index on hashtags for faster searches
CREATE INDEX idx_explore_hashtags ON explore_posts_manager USING gin(hashtags);

-- Create index on created_at for faster sorting
CREATE INDEX idx_explore_created_at ON explore_posts_manager(created_at DESC);

-- Create storage bucket for explore posts
INSERT INTO storage.buckets (id, name, public)
VALUES ('explore_posts', 'explore_posts', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for explore_posts bucket
CREATE POLICY "Anyone can view explore posts"
ON storage.objects FOR SELECT
USING (bucket_id = 'explore_posts');

CREATE POLICY "Authenticated users can upload explore posts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'explore_posts');

CREATE POLICY "Users can delete their own posts"
ON storage.objects FOR DELETE
USING (bucket_id = 'explore_posts');

-- Create a function to get trending hashtags
CREATE OR REPLACE FUNCTION get_trending_hashtags(limit_count INTEGER DEFAULT 5)
RETURNS TABLE(hashtag TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    jsonb_array_elements_text(hashtags) as hashtag,
    COUNT(*) as count
  FROM explore_posts_manager
  GROUP BY jsonb_array_elements_text(hashtags)
  ORDER BY count DESC, hashtag ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get next spiral position
CREATE OR REPLACE FUNCTION get_next_spiral_position()
RETURNS JSONB AS $$
DECLARE
  post_count INTEGER;
  n INTEGER;
  k INTEGER;
  x INTEGER;
  y INTEGER;
  leg INTEGER;
  position_in_leg INTEGER;
BEGIN
  -- Get current count of posts
  SELECT COUNT(*) INTO post_count FROM explore_posts_manager;

  -- If first post, return (0, 0)
  IF post_count = 0 THEN
    RETURN jsonb_build_object('x', 0, 'y', 0);
  END IF;

  -- Calculate spiral position using Ulam spiral algorithm
  n := post_count;

  -- Determine which "ring" we're in
  k := FLOOR((SQRT(n) + 1) / 2)::INTEGER;

  -- Calculate position based on spiral pattern
  -- This creates a square spiral pattern
  IF n <= k * k THEN
    x := k;
    y := k - (k * k - n);
  ELSIF n <= (k + 1) * (k + 1) - k THEN
    x := k - (n - k * k);
    y := -k;
  ELSIF n <= (k + 1) * (k + 1) THEN
    x := -k;
    y := -k + (n - ((k + 1) * (k + 1) - 2 * k - 1));
  ELSE
    x := -k + (n - (k + 1) * (k + 1));
    y := k;
  END IF;

  RETURN jsonb_build_object('x', x, 'y', y);
END;
$$ LANGUAGE plpgsql;
