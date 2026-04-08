-- Allow service role and coaches to upsert via the existing INSERT/UPDATE policies
-- The existing policies already cover coaches for INSERT and UPDATE on match_team_stats
-- We just need to ensure the anon/public role can also insert for the edge case where
-- the upsert runs through the authenticated client

-- No changes needed - existing policies already cover this