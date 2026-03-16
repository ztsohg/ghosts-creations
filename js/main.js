// =============================================
// GHOST'S CREATIONS — Main JS
// =============================================

// ── State ──────────────────────────────────
const State = {
  currentUser: null,
  currentPage: 'home',
  posts: [],
  projects: [],
  adminPanel: 'overview'
};

// ── DOM Ready ──────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initParticles();
  initNavbar();
  initRouter();
  initScrollReveal();
  loadState();
  renderAll();
});

// ============================================
// ROUTING
// ============================================
function initRouter() {
  document.querySelectorAll('[data-page]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(link.dataset.page);
    });
  });
  // Handle hash on load
  const hash = window.location.hash.replace('#', '') || 'home';
  navigateTo(hash, true);
}

function navigateTo(pageId, instant = false) {
  if (pageId === State.currentPage && !instant) return;

  // Admin guard
  if (pageId === 'admin') {
    if (!State.currentUser || !State.currentUser.isAdmin) {
      showToast('You need admin access for that!', 'error', '👻');
      openLoginModal();
      return;
    }
  }

  const transition = document.querySelector('.page-transition');

  const doNavigate = () => {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));

    // Show target
    const target = document.getElementById(`page-${pageId}`);
    if (target) {
      target.classList.remove('hidden');
      State.currentPage = pageId;
      window.location.hash = pageId;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Update nav active state
    document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
      a.classList.toggle('active', a.dataset.page === pageId);
    });
  };

  if (instant) {
    doNavigate();
  } else {
    transition.classList.add('in');
    setTimeout(() => {
      doNavigate();
      transition.classList.remove('in');
    }, 250);
  }
}

// ============================================
// STATE / PERSISTENCE
// ============================================
function loadState() {
  // Load user
  const savedUser = localStorage.getItem('gc_user');
  if (savedUser) {
    try { State.currentUser = JSON.parse(savedUser); } catch (_) {}
  }

  // Load posts
  const savedPosts = localStorage.getItem('gc_posts');
  if (savedPosts) {
    try { State.posts = JSON.parse(savedPosts); } catch (_) {}
  } else {
    State.posts = getDefaultPosts();
    savePosts();
  }

  // Load projects
  const savedProjects = localStorage.getItem('gc_projects');
  if (savedProjects) {
    try { State.projects = JSON.parse(savedProjects); } catch (_) {}
  } else {
    State.projects = getDefaultProjects();
    saveProjects();
  }
}

function savePosts()    { localStorage.setItem('gc_posts',    JSON.stringify(State.posts));    }
function saveProjects() { localStorage.setItem('gc_projects', JSON.stringify(State.projects)); }
function saveUser()     {
  if (State.currentUser) localStorage.setItem('gc_user', JSON.stringify(State.currentUser));
  else localStorage.removeItem('gc_user');
}

// ============================================
// RENDER ALL
// ============================================
function renderAll() {
  renderNavUser();
  renderHomePage();
  renderProjectsPage();
  renderPostsPage();
  renderAdminPage();
}

// ============================================
// NAVBAR
// ============================================
function initNavbar() {
  window.addEventListener('scroll', () => {
    document.querySelector('.navbar').classList.toggle('scrolled', window.scrollY > 30);
  });

  // Mobile hamburger
  const hamburger = document.querySelector('.hamburger');
  const navLinks  = document.querySelector('.nav-links');
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
    });
  }
}

function renderNavUser() {
  const navActions = document.getElementById('nav-actions');
  if (!navActions) return;

  if (State.currentUser) {
    navActions.innerHTML = `
      <div class="nav-user">
        <div class="avatar" title="${State.currentUser.username}">${State.currentUser.avatar || '👻'}</div>
        <span>${State.currentUser.username}</span>
        ${State.currentUser.isAdmin ? '<span class="tag tag-purple" style="margin:0">Admin</span>' : ''}
      </div>
      <button class="btn btn-ghost btn-sm" onclick="logout()">Log Out</button>
    `;
  } else {
    navActions.innerHTML = `
      <button class="btn btn-cyan btn-sm" onclick="openLoginModal()">👻 Sign In</button>
    `;
  }
}

// ============================================
// AUTHENTICATION
// ============================================
function openLoginModal() {
  document.getElementById('login-modal').classList.add('open');
}
function closeLoginModal() {
  document.getElementById('login-modal').classList.remove('open');
}

// Tab switching
function switchLoginTab(tab) {
  document.querySelectorAll('.login-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.login-form').forEach(f => f.classList.toggle('active', f.id === `form-${tab}`));
}

// Mock Roblox login
function loginWithRoblox() {
  const btn = document.getElementById('roblox-login-btn');
  btn.innerHTML = `<span class="loading-spinner"></span> Connecting to Roblox...`;
  btn.disabled = true;

  setTimeout(() => {
    // Mock successful Roblox OAuth
    State.currentUser = {
      id: 'rblx_' + Math.random().toString(36).substr(2, 8),
      username: 'RobloxPlayer_' + Math.floor(Math.random() * 9999),
      avatar: '🎮',
      isAdmin: false,
      loginMethod: 'roblox'
    };
    saveUser();
    closeLoginModal();
    renderAll();
    showToast(`Welcome, ${State.currentUser.username}!`, 'success', '👻');
    btn.innerHTML = `<span class="roblox-icon">🟩</span> Continue with Roblox`;
    btn.disabled = false;
  }, 1800);
}

// Admin login
function loginAsAdmin(e) {
  e.preventDefault();
  const username = document.getElementById('admin-username').value.trim();
  const password = document.getElementById('admin-password').value;

  if (!username || !password) {
    showToast('Please fill in all fields', 'error', '⚠️');
    return;
  }

  // Mock admin credentials (in production, verify against Deno KV)
  const admins = JSON.parse(localStorage.getItem('gc_admins') || '[]');
  const defaultAdmins = [{ username: 'Ghost', password: 'ghost123', avatar: '👻' }];
  const allAdmins = [...defaultAdmins, ...admins];
  const match = allAdmins.find(a => a.username === username && a.password === password);

  if (match) {
    State.currentUser = {
      id: 'admin_' + username.toLowerCase(),
      username: match.username,
      avatar: match.avatar || '👻',
      isAdmin: true,
      loginMethod: 'admin'
    };
    saveUser();
    closeLoginModal();
    renderAll();
    showToast(`Welcome back, ${State.currentUser.username}!`, 'success', '👻');
  } else {
    showToast('Invalid credentials', 'error', '🚫');
  }
}

function logout() {
  State.currentUser = null;
  saveUser();
  if (State.currentPage === 'admin') navigateTo('home');
  renderAll();
  showToast('Logged out. See you on the other side... 👻', 'info', '👋');
}

// ============================================
// HOME PAGE
// ============================================
function renderHomePage() {
  const latestPost = State.posts[0];
  const el = document.getElementById('home-latest-post');
  if (!el || !latestPost) return;

  el.innerHTML = `
    <div class="announcement-badge"><span class="dot"></span> Latest Announcement</div>
    <div class="card" style="max-width: 700px; margin: 0 auto; text-align:left;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:1rem;">
        <span class="post-category">${latestPost.category}</span>
        <span style="font-family: var(--font-mono); font-size:0.78rem; color:var(--muted);">${formatDate(latestPost.date)}</span>
      </div>
      <h3 class="post-title" style="margin-bottom:0.75rem;">${latestPost.title}</h3>
      <p class="post-content">${latestPost.content.substring(0, 200)}${latestPost.content.length > 200 ? '...' : ''}</p>
      <div style="margin-top:1.25rem;">
        <button class="btn btn-cyan btn-sm" onclick="navigateTo('posts')">Read More →</button>
      </div>
    </div>
  `;
}

// ============================================
// PROJECTS PAGE
// ============================================
function renderProjectsPage() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  grid.innerHTML = State.projects.map(p => `
    <div class="project-card reveal">
      <div class="project-thumbnail">
        <div class="thumb-glow"></div>
        <span style="position:relative; z-index:1;">${p.icon}</span>
      </div>
      <div class="project-body">
        <h3 class="project-title">${p.title}</h3>
        <p class="project-desc">${p.description}</p>
        <div class="project-tags">
          ${p.tags.map(t => `<span class="tag tag-${t.style}">${t.label}</span>`).join('')}
        </div>
        <div class="project-footer">
          <span class="project-status">
            <span class="status-dot ${p.status}"></span>
            ${p.statusLabel}
          </span>
          ${p.robloxUrl ? `<a href="${p.robloxUrl}" target="_blank" class="btn btn-sm btn-primary">▶ Play</a>` : ''}
        </div>
      </div>
    </div>
  `).join('');

  observeReveal();
}

// ============================================
// POSTS PAGE
// ============================================
function renderPostsPage() {
  const list = document.getElementById('posts-list');
  if (!list) return;

  if (State.posts.length === 0) {
    list.innerHTML = `<div class="card" style="text-align:center; padding:3rem;">
      <div style="font-size:3rem; margin-bottom:1rem;">👻</div>
      <p style="color:var(--muted);">No announcements yet. Check back soon!</p>
    </div>`;
    return;
  }

  list.innerHTML = State.posts.map(post => {
    const vote = getVote(post.id);
    return `
    <div class="post-card reveal" id="post-${post.id}">
      <div class="post-header">
        <div class="post-meta">
          <div class="post-author-avatar">${post.authorAvatar || '👻'}</div>
          <div>
            <div class="post-author-name">${post.author}</div>
            <div class="post-date">${formatDate(post.date)}</div>
          </div>
        </div>
        <span class="post-category">${post.category}</span>
      </div>
      <div class="post-body">
        <h2 class="post-title">${post.title}</h2>
        <p class="post-content">${post.content}</p>
      </div>
      <div class="post-footer">
        <button class="vote-btn ${vote === 'like' ? 'liked' : ''}"
          onclick="castVote('${post.id}', 'like')" id="like-btn-${post.id}">
          <span class="vote-icon">👍</span>
          <span id="like-count-${post.id}">${post.likes}</span>
        </button>
        <button class="vote-btn ${vote === 'dislike' ? 'disliked' : ''}"
          onclick="castVote('${post.id}', 'dislike')" id="dislike-btn-${post.id}">
          <span class="vote-icon">👎</span>
          <span id="dislike-count-${post.id}">${post.dislikes}</span>
        </button>
      </div>
    </div>
  `}).join('');

  observeReveal();
}

// ── Voting ──
function getVote(postId) {
  const votes = JSON.parse(localStorage.getItem('gc_votes') || '{}');
  const userId = State.currentUser?.id || 'guest';
  return votes[`${userId}_${postId}`] || null;
}

function castVote(postId, type) {
  if (!State.currentUser) {
    showToast('Sign in to vote!', 'info', '👻');
    openLoginModal();
    return;
  }

  const votes = JSON.parse(localStorage.getItem('gc_votes') || '{}');
  const userId = State.currentUser.id;
  const key = `${userId}_${postId}`;
  const existing = votes[key];
  const post = State.posts.find(p => p.id === postId);
  if (!post) return;

  if (existing === type) {
    // Toggle off
    delete votes[key];
    if (type === 'like') post.likes = Math.max(0, post.likes - 1);
    else post.dislikes = Math.max(0, post.dislikes - 1);
  } else {
    if (existing) {
      if (existing === 'like') post.likes = Math.max(0, post.likes - 1);
      else post.dislikes = Math.max(0, post.dislikes - 1);
    }
    votes[key] = type;
    if (type === 'like') post.likes++;
    else post.dislikes++;
  }

  localStorage.setItem('gc_votes', JSON.stringify(votes));
  savePosts();

  // Update UI without full re-render
  const newVote = votes[key] || null;
  const likeBtn = document.getElementById(`like-btn-${postId}`);
  const dislikeBtn = document.getElementById(`dislike-btn-${postId}`);
  const likeCount = document.getElementById(`like-count-${postId}`);
  const dislikeCount = document.getElementById(`dislike-count-${postId}`);

  if (likeBtn) likeBtn.className = `vote-btn ${newVote === 'like' ? 'liked' : ''}`;
  if (dislikeBtn) dislikeBtn.className = `vote-btn ${newVote === 'dislike' ? 'disliked' : ''}`;
  if (likeCount) likeCount.textContent = post.likes;
  if (dislikeCount) dislikeCount.textContent = post.dislikes;
}

// ============================================
// ADMIN PAGE
// ============================================
function renderAdminPage() {
  renderAdminOverview();
  renderAdminPostsTable();
  renderAdminProjectsTable();
}

function switchAdminPanel(panelId) {
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.admin-nav-item').forEach(n => n.classList.remove('active'));
  const panel = document.getElementById(`admin-panel-${panelId}`);
  if (panel) panel.classList.add('active');
  document.querySelectorAll(`.admin-nav-item[data-panel="${panelId}"]`).forEach(el => el.classList.add('active'));
  State.adminPanel = panelId;
}

function renderAdminOverview() {
  const el = document.getElementById('admin-stats');
  if (!el) return;
  el.innerHTML = `
    <div class="stat-card"><span class="stat-number">${State.posts.length}</span><span class="stat-label">Posts</span></div>
    <div class="stat-card"><span class="stat-number">${State.projects.length}</span><span class="stat-label">Projects</span></div>
    <div class="stat-card"><span class="stat-number">${State.posts.reduce((a,p) => a+p.likes, 0)}</span><span class="stat-label">Total Likes</span></div>
    <div class="stat-card"><span class="stat-number">${JSON.parse(localStorage.getItem('gc_admins') || '[]').length + 1}</span><span class="stat-label">Admins</span></div>
  `;
}

function renderAdminPostsTable() {
  const tbody = document.getElementById('admin-posts-tbody');
  if (!tbody) return;
  tbody.innerHTML = State.posts.map(p => `
    <tr>
      <td style="color:var(--white); font-weight:600;">${p.title}</td>
      <td><span class="post-category" style="font-size:0.72rem;">${p.category}</span></td>
      <td style="color:var(--muted); font-size:0.82rem;">${formatDate(p.date)}</td>
      <td style="color:var(--cyan);">👍 ${p.likes} / 👎 ${p.dislikes}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="editPost('${p.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" style="margin-left:0.5rem;" onclick="deletePost('${p.id}')">Delete</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="5" style="color:var(--muted); text-align:center; padding:2rem;">No posts yet</td></tr>';
}

function renderAdminProjectsTable() {
  const tbody = document.getElementById('admin-projects-tbody');
  if (!tbody) return;
  tbody.innerHTML = State.projects.map(p => `
    <tr>
      <td style="font-size:1.5rem;">${p.icon}</td>
      <td style="color:var(--white); font-weight:600;">${p.title}</td>
      <td><span class="status-dot ${p.status}" style="display:inline-block;"></span> ${p.statusLabel}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="editProject('${p.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" style="margin-left:0.5rem;" onclick="deleteProject('${p.id}')">Delete</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="4" style="color:var(--muted); text-align:center; padding:2rem;">No projects yet</td></tr>';
}

// ── Create Post ──
function submitNewPost(e) {
  e.preventDefault();
  const title    = document.getElementById('post-title-input').value.trim();
  const content  = document.getElementById('post-content-input').value.trim();
  const category = document.getElementById('post-category-input').value;

  if (!title || !content) { showToast('Please fill in all fields', 'error', '⚠️'); return; }

  const post = {
    id: 'post_' + Date.now(),
    title, content, category,
    author: State.currentUser.username,
    authorAvatar: State.currentUser.avatar,
    date: new Date().toISOString(),
    likes: 0, dislikes: 0
  };

  State.posts.unshift(post);
  savePosts();
  document.getElementById('new-post-form').reset();
  renderPostsPage();
  renderHomePage();
  renderAdminPostsTable();
  renderAdminOverview();
  showToast('Announcement posted!', 'success', '📣');
}

// ── Edit/Delete Post ──
function editPost(id) {
  const post = State.posts.find(p => p.id === id);
  if (!post) return;
  switchAdminPanel('new-post');
  document.getElementById('post-title-input').value   = post.title;
  document.getElementById('post-content-input').value = post.content;
  document.getElementById('post-category-input').value = post.category;

  const form = document.getElementById('new-post-form');
  form.dataset.editId = id;
  document.getElementById('post-submit-btn').textContent = 'Update Announcement';
}

function deletePost(id) {
  if (!confirm('Delete this announcement?')) return;
  State.posts = State.posts.filter(p => p.id !== id);
  savePosts();
  renderPostsPage();
  renderHomePage();
  renderAdminPostsTable();
  renderAdminOverview();
  showToast('Post deleted', 'info', '🗑️');
}

// ── Create Project ──
function submitNewProject(e) {
  e.preventDefault();
  const title       = document.getElementById('proj-title-input').value.trim();
  const description = document.getElementById('proj-desc-input').value.trim();
  const icon        = document.getElementById('proj-icon-input').value.trim() || '🎮';
  const statusVal   = document.getElementById('proj-status-input').value;
  const robloxUrl   = document.getElementById('proj-url-input').value.trim();

  if (!title || !description) { showToast('Please fill in required fields', 'error', '⚠️'); return; }

  const statusLabels = { active: 'Active', dev: 'In Development', hiatus: 'On Hiatus' };
  const project = {
    id: 'proj_' + Date.now(),
    title, description, icon,
    status: statusVal,
    statusLabel: statusLabels[statusVal],
    robloxUrl,
    tags: [{ label: 'Roblox', style: 'purple' }, { label: 'Game', style: 'cyan' }]
  };

  State.projects.push(project);
  saveProjects();
  document.getElementById('new-project-form').reset();
  renderProjectsPage();
  renderAdminProjectsTable();
  renderAdminOverview();
  showToast('Project added!', 'success', '🎮');
}

function editProject(id) {
  const proj = State.projects.find(p => p.id === id);
  if (!proj) return;
  switchAdminPanel('new-project');
  document.getElementById('proj-title-input').value  = proj.title;
  document.getElementById('proj-desc-input').value   = proj.description;
  document.getElementById('proj-icon-input').value   = proj.icon;
  document.getElementById('proj-status-input').value = proj.status;
  document.getElementById('proj-url-input').value    = proj.robloxUrl || '';
}

function deleteProject(id) {
  if (!confirm('Delete this project?')) return;
  State.projects = State.projects.filter(p => p.id !== id);
  saveProjects();
  renderProjectsPage();
  renderAdminProjectsTable();
  renderAdminOverview();
  showToast('Project deleted', 'info', '🗑️');
}

// ── Add Admin ──
function addAdmin(e) {
  e.preventDefault();
  const username = document.getElementById('new-admin-username').value.trim();
  const password = document.getElementById('new-admin-password').value;

  if (!username || !password) { showToast('Please fill in all fields', 'error', '⚠️'); return; }

  const admins = JSON.parse(localStorage.getItem('gc_admins') || '[]');
  if (admins.find(a => a.username === username)) {
    showToast('That username already exists', 'error', '⚠️');
    return;
  }

  admins.push({ username, password, avatar: '👤' });
  localStorage.setItem('gc_admins', JSON.stringify(admins));
  document.getElementById('add-admin-form').reset();
  showToast(`Admin "${username}" added`, 'success', '✅');
  renderAdminOverview();
}

// ============================================
// UTILITIES
// ============================================
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function showToast(message, type = 'info', icon = '👻') {
  const container = document.querySelector('.toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

// ============================================
// SCROLL REVEAL
// ============================================
function initScrollReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  window._revealObserver = observer;
}

function observeReveal() {
  if (!window._revealObserver) return;
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
    window._revealObserver.observe(el);
  });
}

// ============================================
// CUSTOM CURSOR
// ============================================
function initCursor() {
  const dot  = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if (!dot || !ring) return;

  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left  = mx + 'px';
    dot.style.top   = my + 'px';
  });

  function animateRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();
}

// ============================================
// PARTICLES
// ============================================
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W = canvas.width  = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  });

  const PARTICLE_COUNT = 60;
  const particles = Array.from({ length: PARTICLE_COUNT }, () => makeParticle(W, H));

  function makeParticle(W, H) {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.8 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.4 - 0.1,
      alpha: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.5 ? '#7b2fff' : '#00f5ff'
    };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -5) { Object.assign(p, makeParticle(W, H)); p.y = H + 5; }
      if (p.x < 0 || p.x > W) p.vx *= -1;
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  draw();
}

// ============================================
// DEFAULT DATA
// ============================================
function getDefaultPosts() {
  return [
    {
      id: 'post_1',
      title: 'Welcome to Ghost\'s Creations!',
      content: 'We\'re thrilled to launch our official studio website! Ghost\'s Creations is a Roblox game development studio dedicated to crafting immersive, spooky, and unforgettable experiences. Stay tuned for updates on our upcoming projects, behind-the-scenes content, and exclusive announcements. The void is full of wonders — and we\'re just getting started. 👻',
      category: 'General',
      author: 'Ghost',
      authorAvatar: '👻',
      date: new Date().toISOString(),
      likes: 12,
      dislikes: 0
    },
    {
      id: 'post_2',
      title: 'New Project Announcement: Project Phantom',
      content: 'We\'re excited to reveal our next major game: Project Phantom — a paranormal horror experience unlike anything on the Roblox platform. Explore haunted locations, uncover dark secrets, and survive the night. Development is currently underway and we\'ll be sharing more details soon. Keep watching this space!',
      category: 'New Project',
      author: 'Ghost',
      authorAvatar: '👻',
      date: new Date(Date.now() - 86400000 * 3).toISOString(),
      likes: 34,
      dislikes: 2
    }
  ];
}

function getDefaultProjects() {
  return [
    {
      id: 'proj_1',
      title: 'Project Phantom',
      description: 'A paranormal horror survival experience. Explore haunted mansions, solve eerie puzzles, and survive the night against forces you can\'t explain.',
      icon: '👁️',
      status: 'dev',
      statusLabel: 'In Development',
      robloxUrl: '',
      tags: [{ label: 'Horror', style: 'purple' }, { label: 'Survival', style: 'cyan' }, { label: 'Roblox', style: 'ghost' }]
    },
    {
      id: 'proj_2',
      title: 'Ghost Town',
      description: 'Wander through an abandoned ghost town filled with secrets, riddles, and restless spirits. A mystery-adventure game with stunning atmosphere.',
      icon: '🏚️',
      status: 'active',
      statusLabel: 'Active',
      robloxUrl: 'https://www.roblox.com',
      tags: [{ label: 'Mystery', style: 'purple' }, { label: 'Adventure', style: 'cyan' }]
    },
    {
      id: 'proj_3',
      title: 'Spectral Arena',
      description: 'Fast-paced PvP ghost battles across haunted arenas. Collect souls, upgrade your powers, and rise to the top of the leaderboard.',
      icon: '⚔️',
      status: 'hiatus',
      statusLabel: 'On Hiatus',
      robloxUrl: '',
      tags: [{ label: 'PvP', style: 'cyan' }, { label: 'Battle', style: 'purple' }]
    }
  ];
}