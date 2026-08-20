/**
 * Admin Component
 * Admin-only login plus registration tools for teams and questions.
 */

import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import ClubBrand from "./ClubBrand";
import AdminDashboard from "./Admin/AdminDashboard";
import AdminTeamDetails from "./Admin/AdminTeamDetails";
import "./TeamLogin.css";

const BATCH_OPTIONS = [
  { value: "PGDM_1", label: "PGDM 1st Year" },
  { value: "PGDM_2", label: "PGDM 2nd Year" },
  { value: "PGPISM", label: "PGPISM" },
  { value: "LLM", label: "LLM" }
];

const emptyMember = () => ({ name: "", email: "" });

const isValidEmail = (value = "") => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const redactSensitiveValues = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveValues(item));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).reduce((acc, [key, entryValue]) => {
      if (/password|secret|token|key/i.test(key)) {
        acc[key] = "[REDACTED]";
        return acc;
      }
      acc[key] = redactSensitiveValues(entryValue);
      return acc;
    }, {});
  }

  return value;
};

const logSupabaseInsertError = (tableName, payload, error) => {
  console.error(`[Supabase insert failed] table=${tableName}`, {
    table: tableName,
    message: error?.message ?? "Unknown Supabase error",
    code: error?.code ?? null,
    details: error?.details ?? null,
    hint: error?.hint ?? null,
    payload: redactSensitiveValues(payload)
  });
};

export default function Admin() {
  const [session, setSession] = useState(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [view, setView] = useState("dashboard");
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  const [teamName, setTeamName] = useState("");
  const [batch, setBatch] = useState("");
  const [members, setMembers] = useState([emptyMember()]);
  const [teamError, setTeamError] = useState("");
  const [teamSuccess, setTeamSuccess] = useState("");
  const [teamLoading, setTeamLoading] = useState(false);

  const [questionId, setQuestionId] = useState("");
  const [questionCategory, setQuestionCategory] = useState("Finance");
  const [questionText, setQuestionText] = useState("");
  const [canonicalAnswer, setCanonicalAnswer] = useState("");
  const [acceptedAnswers, setAcceptedAnswers] = useState("");
  const [questionError, setQuestionError] = useState("");
  const [questionSuccess, setQuestionSuccess] = useState("");
  const [questionLoading, setQuestionLoading] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
    };
    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
    });

    return () => listener?.subscription?.unsubscribe?.();
  }, []);

  const signInAdmin = async (e) => {
    e.preventDefault();
    setAuthMessage("");
    if (!adminEmail.trim() || !adminPassword) {
      setAuthMessage("Enter your admin email and password.");
      return;
    }

    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: adminEmail.trim(),
      password: adminPassword
    });
    setAuthLoading(false);

    if (error) {
      setAuthMessage(error.message || "Unable to sign in with those credentials.");
      return;
    }
    setAuthMessage("");
  };

  const signOutAdmin = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setAuthMessage("");
    setView("dashboard");
    setSelectedTeamId(null);
  };

  const handleTeamClick = (teamId) => {
    setSelectedTeamId(teamId);
    setView("team-details");
  };

  const handleBackToDashboard = () => {
    setView("dashboard");
    setSelectedTeamId(null);
  };

  const generateUniqueTeamCode = async () => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = new Uint8Array(6);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i += 1) {
        bytes[i] = Math.floor(Math.random() * 255);
      }
    }

    const code = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
    const candidate = `LF-${code}`;

    const { data: existing } = await supabase
      .from("teams")
      .select("id")
      .eq("team_code", candidate)
      .maybeSingle();

    if (!existing) return candidate;
    return generateUniqueTeamCode();
  };

  const handleMemberChange = (index, field, value) => {
    setMembers((current) =>
      current.map((member, memberIndex) =>
        memberIndex === index ? { ...member, [field]: value } : member
      )
    );
  };

  const handleAddMember = () => {
    setMembers((current) => {
      if (current.length >= 4) return current;
      return [...current, emptyMember()];
    });
  };

  const handleRemoveMember = (index) => {
    setMembers((current) => {
      if (current.length === 1) return [emptyMember()];
      return current.filter((_, memberIndex) => memberIndex !== index);
    });
  };

  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    setTeamError("");
    setTeamSuccess("");

    const trimmedName = teamName.trim();
    if (!trimmedName) {
      setTeamError("Team name is required.");
      return;
    }
    if (!batch) {
      setTeamError("Please select a batch.");
      return;
    }

    const validMembers = members
      .map((member) => ({
        name: member.name.trim(),
        email: member.email.trim()
      }))
      .filter((member) => member.name || member.email);

    for (const member of validMembers) {
      if (member.email && !isValidEmail(member.email)) {
        setTeamError(`Please enter a valid email for ${member.name || "a team member"}.`);
        return;
      }
    }

    setTeamLoading(true);

    try {
      const teamCode = await generateUniqueTeamCode();
      const teamPayload = {
        team_name: trimmedName,
        team_code: teamCode,
        batch,
        status: "NOT_STARTED"
      };

      console.info("[Supabase insert payload] table=teams", {
        table: "teams",
        payload: redactSensitiveValues(teamPayload)
      });

      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert(teamPayload)
        .select("id, team_name, team_code, batch, status")
        .single();

      if (teamError) {
        logSupabaseInsertError("teams", teamPayload, teamError);
        throw teamError;
      }

      const teamMemberRows = validMembers.map((member) => ({
        team_id: team.id,
        name: member.name,
        email: member.email
      }));

      if (teamMemberRows.length > 0) {
        console.info("[Supabase insert payload] table=team_members", {
          table: "team_members",
          payload: redactSensitiveValues(teamMemberRows)
        });

        const { error: membersError } = await supabase.from("team_members").insert(teamMemberRows);
        if (membersError) {
          logSupabaseInsertError("team_members", teamMemberRows, membersError);
          throw membersError;
        }
      }

      await supabase.from("competition_events").insert({
        team_id: team.id,
        event_type: "TEAM_REGISTERED",
        metadata: {
          team_name: team.team_name,
          batch: team.batch,
          team_code: team.team_code
        }
      });

      setTeamSuccess(`Team registered successfully. Team code: ${team.team_code}`);
      setTeamName("");
      setBatch("");
      setMembers([emptyMember()]);
    } catch (error) {
      console.error("Admin team registration failed:", error);
      console.error("[Supabase catch]", {
        message: error?.message ?? "Unknown Supabase error",
        code: error?.code ?? null,
        details: error?.details ?? null,
        hint: error?.hint ?? null,
        table: "teams"
      });
      setTeamError("Unable to register the team. Check the Supabase schema and try again.");
    } finally {
      setTeamLoading(false);
    }
  };

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    setQuestionError("");
    setQuestionSuccess("");

    const trimmedId = questionId.trim();
    const trimmedQuestion = questionText.trim();
    const trimmedAnswer = canonicalAnswer.trim();

    if (!trimmedId || !trimmedQuestion || !trimmedAnswer) {
      setQuestionError("Question ID, question text, and canonical answer are required.");
      return;
    }

    let parsedAccepted = [];
    if (acceptedAnswers.trim()) {
      try {
        parsedAccepted = JSON.parse(acceptedAnswers);
      } catch (error) {
        setQuestionError("Accepted answers must be valid JSON, for example: [\"42\", \"20%\"]");
        return;
      }
    }

    setQuestionLoading(true);

    try {
      const { error } = await supabase.from("questions").insert({
        id: trimmedId,
        category: questionCategory,
        question_text: trimmedQuestion,
        canonical_answer: trimmedAnswer,
        accepted_answers: parsedAccepted,
        active: true
      });

      if (error) throw error;

      setQuestionSuccess(`Question ${trimmedId} saved successfully.`);
      setQuestionId("");
      setQuestionCategory("Finance");
      setQuestionText("");
      setCanonicalAnswer("");
      setAcceptedAnswers("");
    } catch (error) {
      console.error("Admin question save failed:", error);
      setQuestionError("Unable to save the question. Please verify the schema and table values.");
    } finally {
      setQuestionLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="team-login">
        <div className="login-content">
          <div className="login-header">
            <ClubBrand className="login-brand" />
          </div>

          <div className="login-form-section admin-auth-card">
            <h2 className="form-title">ADMIN LOGIN</h2>
            <p className="form-description">Sign in to register teams and questions.</p>

            <form onSubmit={signInAdmin} className="team-form">
              <div className="form-group">
                <label htmlFor="admin-email">ADMIN ID / EMAIL</label>
                <input
                  id="admin-email"
                  type="email"
                  className="form-input"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@domain.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="admin-password">PASSWORD</label>
                <input
                  id="admin-password"
                  type="password"
                  className="form-input"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                />
              </div>

              {authMessage && <div className="error-message">{authMessage}</div>}

              <button type="submit" className="primary-btn submit-btn" disabled={authLoading}>
                {authLoading ? "SIGNING IN..." : "ADMIN SIGN IN"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (view === "team-details" && selectedTeamId) {
    return (
      <div className="team-login admin-panel-shell">
        <div className="login-content admin-panel-content">
          <div className="login-header admin-header-row">
            <ClubBrand className="login-brand" />
            <button className="back-btn" onClick={signOutAdmin} aria-label="Sign out">
              SIGN OUT
            </button>
          </div>
          <AdminTeamDetails teamId={selectedTeamId} onClose={handleBackToDashboard} />
        </div>
      </div>
    );
  }

  return (
    <div className="team-login admin-panel-shell">
      <div className="login-content admin-panel-content">
        <div className="login-header admin-header-row">
          <ClubBrand className="login-brand" />
          <button className="back-btn" onClick={signOutAdmin} aria-label="Sign out">
            SIGN OUT
          </button>
        </div>

        <AdminDashboard onTeamClick={handleTeamClick} />

        <div className="login-form-section admin-panel-block">
          <h2 className="form-title">ADMIN: REGISTER TEAM</h2>

          <form onSubmit={handleTeamSubmit} className="team-form">
            <div className="form-group">
              <label htmlFor="admin-team-name">TEAM NAME</label>
              <input
                id="admin-team-name"
                type="text"
                className="form-input"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="admin-batch">BATCH</label>
              <select
                id="admin-batch"
                className="form-select"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
              >
                <option value="">Select Batch</option>
                {BATCH_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="member-list">
              {members.map((member, index) => (
                <div key={`admin-member-${index}`} className="member-card">
                  <div className="member-header-row">
                    <span className="member-title">TEAM MEMBER {index + 1}</span>
                    {members.length > 1 && (
                      <button type="button" className="remove-member-btn" onClick={() => handleRemoveMember(index)}>
                        REMOVE
                      </button>
                    )}
                  </div>

                  <div className="form-group compact-group">
                    <label htmlFor={`admin-member-name-${index}`}>NAME</label>
                    <input
                      id={`admin-member-name-${index}`}
                      type="text"
                      className="form-input"
                      value={member.name}
                      onChange={(e) => handleMemberChange(index, "name", e.target.value)}
                      placeholder="Name"
                    />
                  </div>

                  <div className="form-group compact-group">
                    <label htmlFor={`admin-member-email-${index}`}>EMAIL</label>
                    <input
                      id={`admin-member-email-${index}`}
                      type="email"
                      className="form-input"
                      value={member.email}
                      onChange={(e) => handleMemberChange(index, "email", e.target.value)}
                      placeholder="Email"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button type="button" className="secondary-btn" onClick={handleAddMember} disabled={members.length >= 4}>
              + ADD TEAM MEMBER
            </button>

            {teamError && <div className="error-message" role="alert">{teamError}</div>}
            {teamSuccess && <div className="success-inline">{teamSuccess}</div>}

            <button type="submit" className="primary-btn submit-btn" disabled={teamLoading}>
              {teamLoading ? "REGISTERING..." : "REGISTER TEAM"}
            </button>
          </form>
        </div>

        <div className="login-form-section admin-panel-block">
          <h2 className="form-title">ADMIN: ADD QUESTION</h2>

          <form onSubmit={handleQuestionSubmit} className="team-form">
            <div className="form-group">
              <label htmlFor="question-id">QUESTION ID</label>
              <input
                id="question-id"
                type="text"
                className="form-input"
                value={questionId}
                onChange={(e) => setQuestionId(e.target.value)}
                placeholder="Q001"
              />
            </div>

            <div className="form-group">
              <label htmlFor="question-category">CATEGORY</label>
              <select
                id="question-category"
                className="form-select"
                value={questionCategory}
                onChange={(e) => setQuestionCategory(e.target.value)}
              >
                <option value="Finance">Finance</option>
                <option value="Business">Business</option>
                <option value="Quant">Quant</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="question-text">QUESTION TEXT</label>
              <textarea
                id="question-text"
                className="form-input textarea-input"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Enter the full question text"
              />
            </div>

            <div className="form-group">
              <label htmlFor="canonical-answer">CANONICAL ANSWER</label>
              <input
                id="canonical-answer"
                type="text"
                className="form-input"
                value={canonicalAnswer}
                onChange={(e) => setCanonicalAnswer(e.target.value)}
                placeholder="42"
              />
            </div>

            <div className="form-group">
              <label htmlFor="accepted-answers">ACCEPTED ANSWERS (JSON)</label>
              <input
                id="accepted-answers"
                type="text"
                className="form-input"
                value={acceptedAnswers}
                onChange={(e) => setAcceptedAnswers(e.target.value)}
                placeholder='["42", "20%"]'
              />
            </div>

            {questionError && <div className="error-message" role="alert">{questionError}</div>}
            {questionSuccess && <div className="success-inline">{questionSuccess}</div>}

            <button type="submit" className="primary-btn submit-btn" disabled={questionLoading}>
              {questionLoading ? "SAVING..." : "SAVE QUESTION"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
