import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Auth({ onSignIn }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setUser(data?.session?.user ?? null);
      } catch (err) {
        // ignore
      }
    };
    load();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      try {
        listener?.subscription?.unsubscribe?.();
      } catch (e) {}
    };
  }, []);

  const sendMagicLink = async (e) => {
    e.preventDefault();
    if (!email) return alert("Enter an email");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) return alert(error.message);
    alert("Check your email for a magic link to sign in.");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const createSession = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) return alert("Sign in first");
    const teamName = user?.email ? `Team-${user.email.split('@')[0]}` : "Team";
    const res = await fetch('/api/session_create', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ team_name: teamName })
    });
    if (!res.ok) {
      const text = await res.text();
      return alert('Session creation failed: ' + text);
    }
    const json = await res.json();
    alert('Session created: ' + (json.session?.id || 'ok'));
    if (onSignIn) onSignIn(json);
  };

  return (
    <div className="auth-widget" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {user ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12 }}>{user.email}</span>
          <button onClick={createSession} style={{ padding: '6px 8px' }}>Create Session</button>
          <button onClick={signOut} style={{ padding: '6px 8px' }}>Sign out</button>
        </div>
      ) : (
        <form onSubmit={sendMagicLink} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="email"
            placeholder="team@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: '6px 8px' }}
          />
          <button type="submit" disabled={loading} style={{ padding: '6px 8px' }}>
            {loading ? 'Sending…' : 'Magic link'}
          </button>
        </form>
      )}
    </div>
  );
}
