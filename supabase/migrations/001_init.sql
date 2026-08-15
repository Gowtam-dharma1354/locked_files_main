-- 001_init.sql
-- Initial schema for Locked Files competition
-- Review and run these statements in Supabase SQL editor. Do NOT run service-role key commands in client contexts.

-- Enable extensions if needed
-- create extension if not exists "pgcrypto";

-- QUESTIONS
CREATE TABLE IF NOT EXISTS public.questions (
  id text PRIMARY KEY,
  category text NOT NULL,
  question_text text NOT NULL,
  canonical_answer text NOT NULL,
  accepted_answers jsonb DEFAULT '[]'::jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- TEAMS
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid uuid NULL, -- optional link to Supabase Auth user when using Auth for teams
  team_code text UNIQUE NOT NULL,
  team_name text,
  status text DEFAULT 'PENDING',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- TEAM MEMBERS (optional)
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  name text,
  email text,
  created_at timestamptz DEFAULT now()
);

-- COMPETITION SETTINGS
CREATE TABLE IF NOT EXISTS public.competition_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_name text,
  duration_seconds integer DEFAULT 3600,
  max_attempts_per_question integer DEFAULT 2,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- SESSIONS
CREATE TABLE IF NOT EXISTS public.competition_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  status text DEFAULT 'ACTIVE',
  started_at timestamptz,
  expires_at timestamptz,
  current_level integer DEFAULT 1,
  score integer DEFAULT 0,
  failed_attempts_total integer DEFAULT 0,
  fullscreen_violations integer DEFAULT 0,
  disqualified_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ASSIGNMENTS: which question was assigned for a session+level
CREATE TABLE IF NOT EXISTS public.session_level_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.competition_sessions(id) ON DELETE CASCADE,
  level integer NOT NULL,
  question_id text REFERENCES public.questions(id),
  attempts_used integer DEFAULT 0,
  status text DEFAULT 'PENDING',
  assigned_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- ATTEMPTS
CREATE TABLE IF NOT EXISTS public.attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.competition_sessions(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  level integer NOT NULL,
  question_id text REFERENCES public.questions(id),
  attempt_number integer NOT NULL,
  submitted_answer text,
  is_correct boolean,
  created_at timestamptz DEFAULT now()
);

-- EVENTS / AUDIT LOG
CREATE TABLE IF NOT EXISTS public.competition_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NULL,
  team_id uuid NULL,
  event_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Example RLS templates (commented). Review before enabling.
-- ALTER TABLE public.competition_sessions ENABLE ROW LEVEL SECURITY;
--
-- -- Allow team to select their own session when auth.uid matches teams.auth_uid
-- CREATE POLICY "teams_select_own_sessions" ON public.competition_sessions
-- FOR SELECT USING (
--   exists (select 1 from public.teams t where t.id = team_id and t.auth_uid = auth.uid::uuid)
-- );
--
-- -- Allow authenticated server role (via function) to bypass for admin operations
-- -- For more complex policies, create Postgres functions that encapsulate logic.

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_team ON public.competition_sessions(team_id);
CREATE INDEX IF NOT EXISTS idx_attempts_session ON public.attempts(session_id);

-- Seed questions from the existing frontend (you can paste the 22 rows here)
-- Example insert (uncomment and replace values):
-- INSERT INTO public.questions (id, category, question_text, canonical_answer, accepted_answers)
-- VALUES ('Q01','Finance','Find the next number: 2, 6, 12, 20, 30, ?','42','[]'::jsonb)
-- ON CONFLICT (id) DO NOTHING;

-- End of migration
