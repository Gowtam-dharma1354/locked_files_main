-- RLS policies for Locked Files competition
-- Review before running. The service_role key bypasses RLS; these policies allow authenticated team owners to access their data.

-- Enable RLS on tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_level_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_events ENABLE ROW LEVEL SECURITY;

-- TEAMS: allow authenticated users to manage their own team row when auth_uid is set
CREATE POLICY teams_select_own ON public.teams
  FOR SELECT USING (auth_uid = auth.uid::uuid);

CREATE POLICY teams_insert_self ON public.teams
  FOR INSERT WITH CHECK (auth_uid = auth.uid::uuid);

CREATE POLICY teams_update_own ON public.teams
  FOR UPDATE USING (auth_uid = auth.uid::uuid) WITH CHECK (auth_uid = auth.uid::uuid);

CREATE POLICY teams_delete_own ON public.teams
  FOR DELETE USING (auth_uid = auth.uid::uuid);

-- COMPETITION_SESSIONS: allow team owners to select/insert/update sessions that belong to their team
CREATE POLICY sessions_select_own ON public.competition_sessions
  FOR SELECT USING (
    exists (
      select 1 from public.teams t where t.id = public.competition_sessions.team_id and t.auth_uid = auth.uid::uuid
    )
  );

CREATE POLICY sessions_insert_own ON public.competition_sessions
  FOR INSERT WITH CHECK (
    exists (
      select 1 from public.teams t where t.id = team_id and t.auth_uid = auth.uid::uuid
    )
  );

CREATE POLICY sessions_update_own ON public.competition_sessions
  FOR UPDATE USING (
    exists (
      select 1 from public.teams t where t.id = public.competition_sessions.team_id and t.auth_uid = auth.uid::uuid
    )
  ) WITH CHECK (
    exists (
      select 1 from public.teams t where t.id = team_id and t.auth_uid = auth.uid::uuid
    )
  );

-- SESSION_LEVEL_ASSIGNMENTS: allow owners to view assignments for sessions owned by them
CREATE POLICY assignments_select_own ON public.session_level_assignments
  FOR SELECT USING (
    exists (
      select 1 from public.competition_sessions s
      join public.teams t on s.team_id = t.id
      where s.id = public.session_level_assignments.session_id and t.auth_uid = auth.uid::uuid
    )
  );

-- ATTEMPTS: allow team owners to insert/select attempts for their sessions
CREATE POLICY attempts_select_own ON public.attempts
  FOR SELECT USING (
    exists (
      select 1 from public.competition_sessions s
      join public.teams t on s.team_id = t.id
      where s.id = public.attempts.session_id and t.auth_uid = auth.uid::uuid
    )
  );

CREATE POLICY attempts_insert_own ON public.attempts
  FOR INSERT WITH CHECK (
    exists (
      select 1 from public.competition_sessions s
      join public.teams t on s.team_id = t.id
      where s.id = session_id and t.auth_uid = auth.uid::uuid
    )
  );

-- EVENTS: allow owners to view events for their sessions
CREATE POLICY events_select_own ON public.competition_events
  FOR SELECT USING (
    (session_id IS NULL AND team_id = (
       select t.id from public.teams t where t.auth_uid = auth.uid::uuid limit 1
    ))
    OR exists (
      select 1 from public.competition_sessions s
      join public.teams t on s.team_id = t.id
      where s.id = public.competition_events.session_id and t.auth_uid = auth.uid::uuid
    )
  );

-- Notes:
-- 1) The service role (server) bypasses RLS and should be used for admin operations or server-driven session management.
-- 2) Test these policies in a non-production environment before enabling in production.
-- 3) If you use team codes (public join codes), you may need a supplemental policy allowing SELECT on teams by team_code for pre-join flows.

-- Example: allow public SELECT on teams by `team_code` to support join-by-code flows.
-- Uncomment and adapt if you need to let unauthenticated users look up a team by code.
-- CREATE POLICY teams_select_by_code ON public.teams
--   FOR SELECT USING (team_code = current_setting('jwt.claims.team_code', true) OR team_code IS NOT NULL);

-- End of RLS policies
