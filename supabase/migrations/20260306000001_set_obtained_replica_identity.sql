-- Required for Supabase Realtime DELETE events with non-PK filters.
-- Without FULL, payload.old only contains the PK (id), so the
-- user_id=eq.X filter on the DELETE subscription never matches.
ALTER TABLE obtained_eureka REPLICA IDENTITY FULL;
