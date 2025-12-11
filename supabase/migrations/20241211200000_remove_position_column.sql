-- Completely remove the position column from explore_posts_manager
-- This column is no longer needed with the new circular placement system

ALTER TABLE explore_posts_manager
DROP COLUMN IF EXISTS position;
