import { createAdminSupabase } from '../_supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  const supabase = createAdminSupabase();

  // verify calling user is admin by email list in env
  try {
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return res.status(401).json({ error: 'Invalid auth token' });
    const email = userData.user.email || '';
    const admins = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!admins.includes(email)) return res.status(403).json({ error: 'Not an admin' });

    const { data } = await supabase
      .from('competition_sessions')
      .select('id,team_id,status,started_at,expires_at,current_level,score,created_at,teams(team_name,team_code)')
      .order('created_at', { ascending: false });

    return res.status(200).json({ sessions: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
