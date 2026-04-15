const API_BASE = 'http://localhost:8000';

export async function fetchReels(page = 1, limit = 10) {
  const res = await fetch(`${API_BASE}/api/reels?page=${page}&limit=${limit}`);
  return res.json();
}

export async function fetchReel(id) {
  const res = await fetch(`${API_BASE}/api/reels/${id}`);
  return res.json();
}

export async function toggleLike(reelId, username = 'guest_user') {
  const res = await fetch(`${API_BASE}/api/reels/${reelId}/like?username=${username}`, {
    method: 'POST',
  });
  return res.json();
}

export async function fetchComments(reelId) {
  const res = await fetch(`${API_BASE}/api/reels/${reelId}/comments`);
  return res.json();
}

export async function addComment(reelId, username, text) {
  const res = await fetch(`${API_BASE}/api/reels/${reelId}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, text }),
  });
  return res.json();
}

export async function investInReel(reelId, username, amount) {
  const res = await fetch(`${API_BASE}/api/reels/${reelId}/invest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, amount }),
  });
  return res.json();
}

export async function fetchMarket() {
  const res = await fetch(`${API_BASE}/api/market`);
  return res.json();
}

export async function fetchUser(userId) {
  const res = await fetch(`${API_BASE}/api/users/${userId}`);
  return res.json();
}
