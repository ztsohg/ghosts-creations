// =============================================
// GHOST'S CREATIONS — API Client
// js/api.js
//
// Update API_BASE with your Deno Deploy URL after deploying server.ts
// Example: https://ghosts-creations.deno.dev
// =============================================

const API_BASE = 'https://YOUR_PROJECT.deno.dev'; // ← Update this!

// Set to true to use localStorage fallback (for local development)
const USE_LOCAL = true;

// ── Auth Token ──────────────────────────────
function getAuthToken() {
  const user = JSON.parse(localStorage.getItem('gc_user') || 'null');
  if (!user || !user.isAdmin) return null;
  // Token is stored on login
  return localStorage.getItem('gc_admin_token') || null;
}

function authHeaders() {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// ── API Wrapper ─────────────────────────────
async function apiRequest(method, path, body = null) {
  if (USE_LOCAL) return null; // Use localStorage mode

  try {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API_BASE}${path}`, opts);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (e) {
    console.warn('API Error:', e.message);
    return null;
  }
}

// ── Posts ────────────────────────────────────
export async function fetchPosts() {
  return apiRequest('GET', '/api/posts');
}

export async function createPost(post) {
  return apiRequest('POST', '/api/posts', post);
}

export async function updatePost(id, updates) {
  return apiRequest('PUT', `/api/posts/${id}`, updates);
}

export async function deletePost(id) {
  return apiRequest('DELETE', `/api/posts/${id}`);
}

export async function votePost(postId, userId, type) {
  return apiRequest('POST', `/api/posts/${postId}/vote`, { userId, type });
}

// ── Projects ────────────────────────────────
export async function fetchProjects() {
  return apiRequest('GET', '/api/projects');
}

export async function createProject(project) {
  return apiRequest('POST', '/api/projects', project);
}

export async function updateProject(id, updates) {
  return apiRequest('PUT', `/api/projects/${id}`, updates);
}

export async function deleteProjectAPI(id) {
  return apiRequest('DELETE', `/api/projects/${id}`);
}

// ── Auth ─────────────────────────────────────
export async function loginAdmin(username, password) {
  const res = await apiRequest('POST', '/api/auth/admin', { username, password });
  if (res?.token) {
    localStorage.setItem('gc_admin_token', res.token);
  }
  return res;
}

export async function loginRoblox() {
  return apiRequest('POST', '/api/auth/roblox');
}

export async function addAdminAPI(username, password, avatar) {
  return apiRequest('POST', '/api/admins', { username, password, avatar });
}