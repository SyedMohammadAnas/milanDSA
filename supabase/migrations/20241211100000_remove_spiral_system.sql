-- Remove the spiral position system

-- Drop the get_next_spiral_position function
DROP FUNCTION IF EXISTS get_next_spiral_position();

-- Make position column nullable (for existing data)
ALTER TABLE explore_posts_manager
ALTER COLUMN position DROP NOT NULL;

-- Drop the position constraint
ALTER TABLE explore_posts_manager
DROP CONSTRAINT IF EXISTS valid_position;

-- We keep the column for backward compatibility but it won't be used
-- in the new circular placement system
