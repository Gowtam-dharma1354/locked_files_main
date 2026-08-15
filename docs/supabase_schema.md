Locked Files — Supabase schema overview

This document describes the initial Postgres schema and security approach for the Locked Files competition.

Tables created (see supabase/migrations/001_init.sql):
- questions
- teams
- team_members
- competition_settings
- competition_sessions
- session_level_assignments
- attempts
- competition_events

Auth model (proposed - Option A):
- Use Supabase Auth for teams and admins.
- Teams may be provisioned as Auth users (no password or magic link) and the `teams.auth_uid` field links to `auth.uid`.
- Admins use regular Supabase Auth accounts and are identified via an `is_admin` custom claim or an `admins` table linked to `auth.uid`.

Row Level Security (RLS):
- Enable RLS on sensitive tables (competition_sessions, attempts, session_level_assignments).
- Example policy: allow a row to be SELECTed/INSERTed/UPDATEed only if the `teams.auth_uid = auth.uid::uuid`.
- Admins must be granted access via a separate policy checking a claim or membership in `admins`.

Server-side considerations:
- All privileged operations (question assignment, canonical answer checking, disqualification, finalization) must run on server-side endpoints using `SUPABASE_SERVICE_ROLE_KEY` or using Postgres functions executed as a privileged role.
- Never place the service role key in client bundles.

Next steps after review:
1. Confirm auth approach (Option A: Supabase Auth for teams and admins).  
2. I will add serverless API templates (Vercel functions) to perform session creation, answer submission, and event logging.  
3. After you confirm, we can run the migration SQL in your Supabase project and seed the `questions` table with the 22 verified questions.

