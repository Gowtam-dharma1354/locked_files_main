import { createAdminSupabase } from '../_supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  const supabase = createAdminSupabase();

  try {
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return res.status(401).json({ error: 'Invalid auth token' });
    const email = userData.user.email || '';
    const admins = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!admins.includes(email)) return res.status(403).json({ error: 'Not an admin' });

    const [{ count: sessions }] = await supabase.rpc('count_rows', { table_name: 'competition_sessions' }).catch(() => [{ count: 0 }]);

    // fallback simple counts
    const { count: teamsCount } = await supabase.from('teams').select('*', { count: 'exact' });
    const { count: attemptsCount } = await supabase.from('attempts').select('*', { count: 'exact' });
    const { count: questionsCount } = await supabase.from('questions').select('*', { count: 'exact' });

    return res.status(200).json({ sessions: sessions || 0, teams: teamsCount || 0, attempts: attemptsCount || 0, questions: questionsCount || 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
