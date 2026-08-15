import { createAdminSupabase } from './_supabaseAdmin.js';

function normalizeAnswer(value) {
  if (value === null || value === undefined) return '';
  let str = String(value).trim().toLowerCase();
  str = str.replace(/\s+/g, ' ');
  str = str.replace(/(\d+)\s+%/g, '$1%');
  str = str.replace(/(\d+),(\d+)/g, '$1$2');
  return str;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  const { session_id, answer } = req.body || {};
  if (!session_id || typeof answer !== 'string') return res.status(400).json({ error: 'Missing session_id or answer' });

  const supabase = createAdminSupabase();

  // Verify user
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) return res.status(401).json({ error: 'Invalid auth token' });
  const user = userData.user;

  try {
    // Load session and ensure belongs to this user's team
    const { data: session } = await supabase.from('competition_sessions').select('*').eq('id', session_id).single();
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const { data: team } = await supabase.from('teams').select('*').eq('id', session.team_id).single();
    if (!team) return res.status(403).json({ error: 'Team not found for session' });
    if (team.auth_uid !== user.id) return res.status(403).json({ error: 'Not authorized for this session' });

    if (session.status !== 'ACTIVE') return res.status(400).json({ error: 'Session is not active' });
    if (session.expires_at && new Date(session.expires_at) < new Date()) return res.status(400).json({ error: 'Session has expired' });

    // Find assignment for current level
    const { data: assignment } = await supabase.from('session_level_assignments').select('*').eq('session_id', session.id).eq('level', session.current_level).limit(1).maybeSingle();
    if (!assignment) return res.status(400).json({ error: 'No active assignment for current level' });

    // Fetch question canonical answer
    const { data: question } = await supabase.from('questions').select('id, canonical_answer, accepted_answers').eq('id', assignment.question_id).single();
    if (!question) return res.status(500).json({ error: 'Assigned question not found' });

    const normUser = normalizeAnswer(answer);
    const normCanonical = normalizeAnswer(question.canonical_answer);
    const normAlternatives = (question.accepted_answers || []).map(normalizeAnswer);

    // determine attempt number
    const { data: pastAttempts } = await supabase.from('attempts').select('attempt_number').eq('session_id', session.id).eq('level', session.current_level);
    const attemptNumber = (pastAttempts || []).length + 1;

    let isCorrect = false;
    if (normUser && (normUser === normCanonical || normAlternatives.includes(normUser))) {
      isCorrect = true;
    } else {
      const userNum = Number(normUser);
      if (!isNaN(userNum) && normUser.trim() !== '') {
        if (!isNaN(Number(normCanonical)) && Number(normCanonical) === userNum) isCorrect = true;
        for (const alt of normAlternatives) {
          if (!isNaN(Number(alt)) && Number(alt) === userNum) isCorrect = true;
        }
      }
    }

    // Record attempt
    await supabase.from('attempts').insert({ session_id: session.id, team_id: team.id, level: session.current_level, question_id: question.id, attempt_number: attemptNumber, submitted_answer: answer, is_correct: isCorrect });

    if (isCorrect) {
      // Mark assignment completed
      await supabase.from('session_level_assignments').update({ status: 'COMPLETED', completed_at: new Date().toISOString() }).eq('id', assignment.id);

      // Advance session
      const nextLevel = session.current_level + 1;
      const updates = { current_level: nextLevel };
      if (nextLevel > 5) {
        updates.status = 'COMPLETED';
        updates.completed_at = new Date().toISOString();
      }
      await supabase.from('competition_sessions').update(updates).eq('id', session.id);

      // Log event
      await supabase.from('competition_events').insert({ session_id: session.id, team_id: team.id, event_type: 'LEVEL_COMPLETED', metadata: { level: session.current_level } });

      // If not final, assign next question
      if (nextLevel <= 5) {
        const { data: qs } = await supabase.from('questions').select('id').eq('active', true);
        const pool = (qs || []).map((q) => q.id);
        const randomQ = pool[Math.floor(Math.random() * pool.length)];
        const { data: newAssign } = await supabase.from('session_level_assignments').insert({ session_id: session.id, level: nextLevel, question_id: randomQ, status: 'IN_PROGRESS' }).select().single();
        await supabase.from('competition_events').insert({ session_id: session.id, team_id: team.id, event_type: 'QUESTION_ASSIGNED', metadata: { level: nextLevel, question_id: randomQ } });
        return res.status(200).json({ result: 'correct', nextLevel, nextQuestionId: randomQ });
      }

      return res.status(200).json({ result: 'correct', nextLevel, completed: true });
    }

    // Incorrect
    // Increment attempts_used on assignment
    const newAttemptsUsed = (assignment.attempts_used || 0) + 1;
    await supabase.from('session_level_assignments').update({ attempts_used: newAttemptsUsed }).eq('id', assignment.id);
    await supabase.from('competition_events').insert({ session_id: session.id, team_id: team.id, event_type: 'WRONG_ANSWER', metadata: { level: session.current_level, attempt: attemptNumber } });

    const maxAttempts = 2; // later read from competition_settings
    if (newAttemptsUsed >= maxAttempts) {
      // Exhausted attempts — assign new question for same level
      const { data: qs } = await supabase.from('questions').select('id').eq('active', true);
      const pool = (qs || []).map((q) => q.id).filter((id) => id !== question.id);
      const newQ = pool.length ? pool[Math.floor(Math.random() * pool.length)] : question.id;
      // create new assignment row and mark previous as SKIPPED
      await supabase.from('session_level_assignments').update({ status: 'SKIPPED', completed_at: new Date().toISOString() }).eq('id', assignment.id);
      const { data: newAssign } = await supabase.from('session_level_assignments').insert({ session_id: session.id, level: session.current_level, question_id: newQ, attempts_used: 0, status: 'IN_PROGRESS' }).select().single();
      await supabase.from('competition_events').insert({ session_id: session.id, team_id: team.id, event_type: 'QUESTION_ASSIGNED', metadata: { level: session.current_level, question_id: newQ } });

      return res.status(200).json({ result: 'incorrect', attemptsRemaining: 0, newQuestionId: newQ });
    }

    return res.status(200).json({ result: 'incorrect', attemptsRemaining: maxAttempts - newAttemptsUsed });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
