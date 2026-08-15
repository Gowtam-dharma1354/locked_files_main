// Small helpers to call server APIs with an access token
export async function postSessionCreate(token, teamName) {
  const res = await fetch('/api/session_create', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ team_name: teamName })
  });
  return res;
}

export async function postAnswerSubmit(token, payload) {
  const res = await fetch('/api/answer_submit', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return res;
}
