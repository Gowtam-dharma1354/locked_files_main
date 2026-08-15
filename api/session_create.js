import { createAdminSupabase } from './_supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  const supabase = createAdminSupabase();

  // Verify token and get user
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) {
    return res.status(401).json({ error: 'Invalid auth token' });
  }

  const user = userData.user;

  try {
    // Find or create team linked to this auth user
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('*')
      .eq('auth_uid', user.id)
      .limit(1)
      .maybeSingle();

    let team = existingTeam;
    if (!team) {
      const teamCode = `T${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const { data: newTeam, error: insertErr } = await supabase
        .from('teams')
        .insert({ auth_uid: user.id, team_code: teamCode, team_name: user.user_metadata?.name || null })
        .select()
        .single();
      if (insertErr) throw insertErr;
      team = newTeam;
    }

    // Prevent multiple active sessions
    const { data: activeSession } = await supabase
      .from('competition_sessions')
      .select('*')
      .eq('team_id', team.id)
      .in('status', ['ACTIVE'])
      .limit(1)
      .maybeSingle();

    if (activeSession) {
      return res.status(200).json({ session: activeSession });
    }

    // Create new session
    const durationSeconds = 3600; // placeholder; later pull from competition_settings
    const startedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + durationSeconds * 1000).toISOString();

    const { data: newSession, error: sessErr } = await supabase
      .from('competition_sessions')
      .insert({ team_id: team.id, status: 'ACTIVE', started_at: startedAt, expires_at: expiresAt, current_level: 1 })
      .select()
      .single();
    if (sessErr) throw sessErr;

    // Assign a question for level 1
    // Choose a random active question
    const { data: questions } = await supabase
      .from('questions')
      .select('id')
      .eq('active', true);

    const qPool = (questions || []).map((q) => q.id);
    if (qPool.length === 0) {
      return res.status(500).json({ error: 'No questions available' });
    }
    const randomQ = qPool[Math.floor(Math.random() * qPool.length)];

    const { data: assignment, error: assignErr } = await supabase
      .from('session_level_assignments')
      .insert({ session_id: newSession.id, level: 1, question_id: randomQ, status: 'IN_PROGRESS' })
      .select()
      .single();
    if (assignErr) throw assignErr;

    // Log event
    await supabase.from('competition_events').insert({ session_id: newSession.id, team_id: team.id, event_type: 'SESSION_STARTED', metadata: { level: 1 } });

    // Fetch question text to return (without answers)
    const { data: questionRow } = await supabase.from('questions').select('id, category, question_text').eq('id', randomQ).single();

    return res.status(201).json({ session: newSession, currentQuestion: questionRow });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
