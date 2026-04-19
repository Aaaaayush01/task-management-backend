/* ═══════════════════════════════════════
═══════════════════════════════════════ */
const BASE_URL = "https://task-management-backend-uw8d.onrender.com";
'use strict';

// ── STATE ──────────────────────────────
let state = {
  projects: [],
  tasks: [],
  activeProjectId: null,
  searchQuery: '',
  filterPriority: 'all',
  dragTaskId: null,
  editingTaskId: null,
  theme: 'dark',
};

const token = localStorage.getItem("token");

// ── DOM REFS ───────────────────────────
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

// ── PERSISTENCE ────────────────────────
function save() {
  localStorage.setItem('taskforge_state', JSON.stringify({
    projects: state.projects,
    tasks:    state.tasks,
    activeProjectId: state.activeProjectId,
    theme:    state.theme,
  }));
}

function load() {
  try {
    const raw = localStorage.getItem('taskforge_state');
    if (!raw) return seedDemo();
    const saved = JSON.parse(raw);
    state.projects       = saved.projects       || [];
    state.tasks          = saved.tasks          || [];
    state.activeProjectId = saved.activeProjectId || null;
    state.theme          = saved.theme          || 'dark';
  } catch {
    seedDemo();
  }
}

function seedDemo() {
  const pid = uid();
  state.projects = [
    { id: pid,   name: 'My First Project', color: '#F59E0B' },
    { id: uid(), name: 'Personal Tasks',   color: '#8B5CF6' },
  ];
  state.tasks = [
    { id: uid(), projectId: pid, title: 'Audit current site structure',   desc: 'Review IA, heuristics, and analytics.', priority: 'high',   status: 'done',       due: '', subtasks: [] },
    { id: uid(), projectId: pid, title: 'Create new component library',   desc: 'Design system tokens, buttons, cards.',  priority: 'high',   status: 'inprogress', due: '', subtasks: [
      { id: uid(), text: 'Typography scale', done: true },
      { id: uid(), text: 'Color tokens',     done: true },
      { id: uid(), text: 'Button variants',  done: false },
    ]},
    { id: uid(), projectId: pid, title: 'Write copy for homepage hero',   desc: 'Headline, subhead, and CTA copy.',       priority: 'medium', status: 'inprogress', due: '', subtasks: [] },
    { id: uid(), projectId: pid, title: 'Responsive QA across devices',   desc: 'Test on iOS, Android, and all breakpoints.', priority: 'medium', status: 'pending', due: '', subtasks: [] },
    { id: uid(), projectId: pid, title: 'SEO meta tags & sitemap',        desc: 'Ensure all pages have proper meta.',     priority: 'low',    status: 'pending',    due: '', subtasks: [] },
  ];
  state.activeProjectId = pid;
}

// ── UTILS ──────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDue(str) {
  if (!str) return '';
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day:'numeric', month:'short' });
}

function isOverdue(str) {
  if (!str) return false;
  return new Date(str + 'T00:00:00') < new Date(new Date().toDateString());
}

// ── THEME ──────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  $('themeToggle').querySelector('.theme-icon').textContent = theme === 'dark' ? '◑' : '◐';
}

// ── PROJECTS ───────────────────────────
function renderProjects() {
  const list = $('projectsList');
  if (!state.projects.length) {
    list.innerHTML = '<p style="font-size:0.78rem;color:var(--text-3);padding:0.5rem 0.25rem">No projects yet.</p>';
    return;
  }
  list.innerHTML = state.projects.map(p => `
    <div class="project-item ${p.id === state.activeProjectId ? 'active' : ''}"
         style="--project-color:${p.color}"
         data-pid="${p.id}"
         onclick="selectProject('${p.id}')">
      <span class="project-dot"></span>
      <span class="project-name">${escHtml(p.name)}</span>
      <button class="project-delete" title="Delete project"
              onclick="event.stopPropagation();deleteProject('${p.id}')">✕</button>
    </div>
  `).join('');
}

function selectProject(id) {
  state.activeProjectId = id;
  save();
  renderProjects();
  renderBoard();
  updateBreadcrumb();
  updateStats();
}

function deleteProject(id) {
  if (!confirm('Delete this project and all its tasks?')) return;
  state.projects = state.projects.filter(p => p.id !== id);
  state.tasks    = state.tasks.filter(t => t.projectId !== id);
  if (state.activeProjectId === id) {
    state.activeProjectId = state.projects[0]?.id || null;
  }
  save();
  renderProjects();
  renderBoard();
  updateBreadcrumb();
  updateStats();
  toast('Project deleted', 'info', '🗂️');
}

function updateBreadcrumb() {
  const p = state.projects.find(p => p.id === state.activeProjectId);
  $('breadcrumbProject').textContent = p ? p.name : 'Select a project';
}

// ── BOARD ──────────────────────────────
function getFilteredTasks() {
  const pid = state.activeProjectId;
  if (!pid) return [];
  return state.tasks.filter(t => {
    if (t.projectId !== pid) return false;
    if (state.filterPriority !== 'all' && t.priority !== state.filterPriority) return false;
    const q = state.searchQuery.toLowerCase();
    if (q) {
      const match = t.title.toLowerCase().includes(q)
                 || t.desc.toLowerCase().includes(q)
                 || t.priority.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}

function renderBoard() {
  const hasProject = !!state.activeProjectId;
  $('board').classList.toggle('hidden', !hasProject);
  $('emptyState').classList.toggle('visible', !hasProject);

  if (!hasProject) return;

  const tasks = getFilteredTasks();
  const statuses = ['pending','inprogress','done'];

  statuses.forEach(status => {
    const col = tasks.filter(t => t.status === status);
    const listEl = $('list-' + status);
    const countEl = $('count-' + status);

    countEl.textContent = col.length;
    listEl.innerHTML = col.length
      ? col.map(t => buildCardHTML(t)).join('')
      : `<div style="color:var(--text-3);font-size:0.78rem;text-align:center;padding:1.5rem 0;opacity:0.5">No tasks</div>`;
  });
}

function buildCardHTML(t) {
  const sub = t.subtasks || [];
  const doneSub = sub.filter(s => s.done).length;
  const subPct  = sub.length ? Math.round(doneSub / sub.length * 100) : 0;
  const subtaskBar = sub.length ? `
    <div class="subtask-mini">
      <div class="subtask-mini-bar">
        <div class="subtask-mini-fill" style="width:${subPct}%"></div>
      </div>
      <span class="subtask-mini-label">${doneSub}/${sub.length}</span>
    </div>` : '';

  const dueTxt = t.due ? `
    <span class="task-due ${isOverdue(t.due) && t.status !== 'done' ? 'overdue' : ''}">
      📅 ${formatDue(t.due)}
    </span>` : '';

  return `
    <div class="task-card ${t.status === 'done' ? 'done-card' : ''}"
         data-id="${t.id}" data-priority="${t.priority}"
         draggable="true"
         ondragstart="handleDragStart(event, '${t.id}')"
         ondragend="handleDragEnd(event)">
      <div class="task-card-top">
        <span class="task-title">${escHtml(t.title)}</span>
        <div class="task-actions">
          <button class="task-btn done-btn" title="${t.status === 'done' ? 'Mark pending' : 'Mark done'}"
                  onclick="toggleDone('${t.id}')">
            ${t.status === 'done' ? '↩' : '✓'}
          </button>
          <button class="task-btn edit-btn" title="Edit task"
                  onclick="openEditTask('${t.id}')">✏</button>
          <button class="task-btn delete-btn" title="Delete task"
                  onclick="deleteTask('${t.id}')">✕</button>
        </div>
      </div>
      ${t.desc ? `<p class="task-desc">${escHtml(t.desc)}</p>` : ''}
      <div class="task-meta">
        <div class="task-tags">
          <span class="priority-tag ${t.priority}">${t.priority.toUpperCase()}</span>
        </div>
        ${dueTxt}
      </div>
      ${subtaskBar}
    </div>`;
}

// ── DRAG & DROP ─────────────────────────
function handleDragStart(e, id) {
  state.dragTaskId = id;
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  $$('.task-list').forEach(el => el.classList.remove('drag-over'));
}

function handleDragEnter(e) {
  e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e, newStatus) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  if (!state.dragTaskId) return;
  const task = state.tasks.find(t => t.id === state.dragTaskId);
  if (!task || task.status === newStatus) return;
  task.status = newStatus;
  state.dragTaskId = null;
  save();
  renderBoard();
  updateStats();
  const labels = { pending: 'Backlog', inprogress: 'In Progress', done: 'Done' };
  toast(`Moved to "${labels[newStatus]}"`, 'success', '✦');
}

// ── TASKS CRUD ─────────────────────────
function openNewTask(defaultStatus = 'pending') {
  if (!state.activeProjectId) {
    toast('Select a project first!', 'error', '⚠️');
    return;
  }
  state.editingTaskId = null;
  $('taskModalTitle').textContent = 'New Task';
  $('taskTitleInput').value = '';
  $('taskDescInput').value  = '';
  $('taskDueInput').value   = '';
  $('btnDeleteTask').style.display = 'none';

  setActivePriority('medium');
  setActiveStatus(defaultStatus);
  renderSubtaskList([]);
  openModal('modalTask');
  setTimeout(() => $('taskTitleInput').focus(), 200);
}

function openEditTask(id) {
  const t = state.tasks.find(t => t.id === id);
  if (!t) return;
  state.editingTaskId = id;
  $('taskModalTitle').textContent = 'Edit Task';
  $('taskTitleInput').value = t.title;
  $('taskDescInput').value  = t.desc || '';
  $('taskDueInput').value   = t.due  || '';
  $('btnDeleteTask').style.display = 'inline-flex';

  setActivePriority(t.priority);
  setActiveStatus(t.status);
  renderSubtaskList(t.subtasks || []);
  openModal('modalTask');
  setTimeout(() => $('taskTitleInput').focus(), 200);
}

function saveTask() {
  const title = $('taskTitleInput').value.trim();
  if (!title) {
    $('taskTitleInput').focus();
    $('taskTitleInput').classList.add('shake');
    setTimeout(() => $('taskTitleInput').classList.remove('shake'), 500);
    toast('Task title is required', 'error', '⚠️');
    return;
  }

  const priority = document.querySelector('#prioritySelector .priority-btn.active')?.dataset.priority || 'medium';
  const status   = document.querySelector('#statusSelector .status-btn.active')?.dataset.status || 'pending';
  const due      = $('taskDueInput').value;

  // Collect subtasks from DOM
  const subtasks = [...$$('#subtaskList .subtask-item')].map(el => ({
    id:   el.dataset.sid,
    text: el.querySelector('.subtask-text').textContent,
    done: el.querySelector('.subtask-checkbox').checked,
  }));

  if (state.editingTaskId) {
    const idx = state.tasks.findIndex(t => t.id === state.editingTaskId);
    if (idx !== -1) {
      state.tasks[idx] = { ...state.tasks[idx], title, desc: $('taskDescInput').value.trim(), priority, status, due, subtasks };
    }
    toast('Task updated', 'success', '✦');
  } else {
    state.tasks.push({
      id: uid(),
      projectId: state.activeProjectId,
      title,
      desc: $('taskDescInput').value.trim(),
      priority,
      status,
      due,
      subtasks,
    });
    toast('Task created', 'success', '✦');
  }

  save();
  closeModal('modalTask');
  renderBoard();
  updateStats();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  save();
  renderBoard();
  updateStats();
  closeModal('modalTask');
  toast('Task deleted', 'info', '🗑️');
}

function toggleDone(id) {
  const t = state.tasks.find(t => t.id === id);
  if (!t) return;
  t.status = t.status === 'done' ? 'pending' : 'done';
  save();
  renderBoard();
  updateStats();
}


fetch(`${BASE_URL}/dashboard`, {
  headers: {
    Authorization: token
  }
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.log(err));

// ── SUBTASKS ──────────────────────────
function renderSubtaskList(subtasks) {
  const list = $('subtaskList');
  list.innerHTML = subtasks.map(s => buildSubtaskItemHTML(s)).join('');
}

function buildSubtaskItemHTML(s) {
  return `
    <div class="subtask-item" data-sid="${s.id}">
      <input type="checkbox" class="subtask-checkbox" ${s.done ? 'checked' : ''}
             onchange="this.closest('.subtask-item').querySelector('.subtask-text').classList.toggle('done',this.checked)">
      <span class="subtask-text ${s.done ? 'done' : ''}">${escHtml(s.text)}</span>
      <button class="subtask-remove" onclick="this.closest('.subtask-item').remove()" title="Remove">✕</button>
    </div>`;
}

function addSubtask() {
  const input = $('subtaskInput');
  const text  = input.value.trim();
  if (!text) return;
  const s = { id: uid(), text, done: false };
  const item = document.createElement('div');
  item.innerHTML = buildSubtaskItemHTML(s);
  $('subtaskList').appendChild(item.firstElementChild);
  input.value = '';
  input.focus();
}

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "../auth/login.html";
  });
}

// ── SELECTORS ─────────────────────────
function setActivePriority(p) {
  $$('#prioritySelector .priority-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.priority === p);
  });
}

function setActiveStatus(s) {
  $$('#statusSelector .status-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.status === s);
  });
}

// ── MODALS ────────────────────────────
function openModal(id) {
  $(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  $(id).classList.remove('open');
  document.body.style.overflow = '';
}

// ── STATS ─────────────────────────────
function updateStats() {
  const pid   = state.activeProjectId;
  const tasks = pid ? state.tasks.filter(t => t.projectId === pid) : state.tasks;
  const total = tasks.length;
  const done  = tasks.filter(t => t.status === 'done').length;
  const pct   = total ? Math.round(done / total * 100) : 0;

  $('statTotal').textContent = total;
  $('statDone').textContent  = done;
  $('statPct').textContent   = pct + '%';
  $('progressFill').style.width = pct + '%';
}

// ── TOAST ─────────────────────────────
function toast(msg, type = 'info', icon = 'ℹ️') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icon}</span><span>${escHtml(msg)}</span>`;
  $('toastContainer').appendChild(el);
  setTimeout(() => {
    el.classList.add('removing');
    el.addEventListener('animationend', () => el.remove());
  }, 3000);
}

// ── PROJECT MODAL ─────────────────────
let selectedProjectColor = '#F59E0B';

function openNewProjectModal() {
  $('projectNameInput').value = '';
  selectedProjectColor = '#F59E0B';
  $$('#projectColorPicker .color-swatch').forEach(sw => {
    sw.classList.toggle('active', sw.dataset.color === selectedProjectColor);
  });
  openModal('modalProject');
  setTimeout(() => $('projectNameInput').focus(), 200);
}

function createProject() {
  const name = $('projectNameInput').value.trim();
  if (!name) {
    $('projectNameInput').focus();
    toast('Project name is required', 'error', '⚠️');
    return;
  }
  const p = { id: uid(), name, color: selectedProjectColor };
  state.projects.push(p);
  state.activeProjectId = p.id;
  save();
  closeModal('modalProject');
  renderProjects();
  renderBoard();
  updateBreadcrumb();
  updateStats();
  toast(`"${name}" created`, 'success', '✦');
}

// ── KEYBOARD SHORTCUTS ────────────────
document.addEventListener('keydown', e => {
  // / to focus search
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    e.preventDefault();
    $('searchInput').focus();
  }
  // ESC close modals
  if (e.key === 'Escape') {
    $$('.modal-backdrop.open').forEach(m => closeModal(m.id));
  }
  // Ctrl/Cmd+N new task
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    openNewTask();
  }
});

// ── EVENT WIRING ──────────────────────
function init() {
  load();
  applyTheme(state.theme);
  renderProjects();
  renderBoard();
  updateBreadcrumb();
  updateStats();

  // Sidebar toggle
  $('sidebarToggle').addEventListener('click', () => {
    const sidebar = $('sidebar');
    const main    = $('main');
    const w = window.innerWidth;
    if (w <= 640) {
      sidebar.classList.toggle('mobile-open');
    } else {
      sidebar.classList.toggle('collapsed');
      main.classList.toggle('expanded');
    }
  });

  // Theme toggle
  $('themeToggle').addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(state.theme);
    save();
  });

  // New project button
  $('btnNewProject').addEventListener('click', openNewProjectModal);
  $('btnEmptyCreate').addEventListener('click', openNewProjectModal);

  // Create project
  $('btnCreateProject').addEventListener('click', createProject);
  $('projectNameInput').addEventListener('keydown', e => { if (e.key === 'Enter') createProject(); });

  // Color picker
  $$('#projectColorPicker .color-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      selectedProjectColor = sw.dataset.color;
      $$('#projectColorPicker .color-swatch').forEach(s => s.classList.toggle('active', s === sw));
    });
  });

  // Add task top button
  $('btnAddTask').addEventListener('click', () => openNewTask());

  // Col add buttons
  $$('.col-add-btn').forEach(btn => {
    btn.addEventListener('click', () => openNewTask(btn.dataset.status));
  });

  // Save task
  $('btnSaveTask').addEventListener('click', saveTask);
  $('btnDeleteTask').addEventListener('click', () => { if (state.editingTaskId) deleteTask(state.editingTaskId); });

  // Add subtask
  $('btnAddSubtask').addEventListener('click', addSubtask);
  $('subtaskInput').addEventListener('keydown', e => { if (e.key === 'Enter') addSubtask(); });

  // Priority selector
  $$('#prioritySelector .priority-btn').forEach(btn => {
    btn.addEventListener('click', () => setActivePriority(btn.dataset.priority));
  });

  // Status selector
  $$('#statusSelector .status-btn').forEach(btn => {
    btn.addEventListener('click', () => setActiveStatus(btn.dataset.status));
  });

  // Search
  $('searchInput').addEventListener('input', e => {
    state.searchQuery = e.target.value;
    renderBoard();
  });

  // Filter
  $$('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filterPriority = btn.dataset.filter;
      renderBoard();
    });
  });

  // Modal close via backdrop or [data-close]
  $$('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', e => {
      if (e.target === backdrop) closeModal(backdrop.id);
    });
  });

  $$('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  // Due date notifications check
  checkDueDates();
}

// ── DUE DATE REMINDERS ────────────────
function checkDueDates() {
  const today = new Date(new Date().toDateString());
  const soon  = new Date(today); soon.setDate(soon.getDate() + 2);

  const pid = state.activeProjectId;
  if (!pid) return;

  state.tasks
    .filter(t => t.projectId === pid && t.due && t.status !== 'done')
    .forEach(t => {
      const d = new Date(t.due + 'T00:00:00');
      if (d <= today) {
        setTimeout(() => toast(`"${t.title}" is overdue!`, 'error', '⏰'), 1500);
      } else if (d <= soon) {
        setTimeout(() => toast(`"${t.title}" is due soon`, 'info', '📅'), 2000);
      }
    });
}


function addTask(text) {
  fetch("http://localhost:5000/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token
    },
    body: JSON.stringify({ text })
  })
    .then(res => res.json())
    .then(data => {
      console.log(data);
      alert("Task added");
    });
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "../auth/login.html";
});


// ── BOOT ──────────────────────────────
document.addEventListener('DOMContentLoaded', init);
