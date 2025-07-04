import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import './index.css';
import { supabase } from './supabaseClient';

// COMPONENTS
function Sidebar({ user, onNavigate, activePage, onSignOut }) {
  return (
    <aside className="sidebar">
      <h2 className="sidebar__title">Task Planner</h2>
      <nav className="sidebar__nav">
        <button className={activePage === 'list' ? "nav-btn active" : "nav-btn"} onClick={() => onNavigate('list')}>All Tasks</button>
        <button className={activePage === 'add' ? "nav-btn active" : "nav-btn"} onClick={() => onNavigate('add')}>Add Task</button>
        {user && <button className="nav-btn logout" onClick={onSignOut}>Log out</button>}
      </nav>
    </aside>
  );
}

function Auth({ onAuthSuccess }) {
  const [view, setView] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // PUBLIC_INTERFACE
  /**
   * Handles user sign in/up.
   * On success, calls onAuthSuccess callback.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (view === 'signin') {
        let { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        let { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
      onAuthSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-form__container">
      <form className="auth-form" onSubmit={handleSubmit} autoComplete="off">
        <h2>{view === 'signin' ? "Sign In" : "Sign Up"}</h2>
        <input
          className="input"
          type="email" required
          placeholder="Email"
          autoComplete="username"
          value={email} onChange={e => setEmail(e.target.value)}
        />
        <input
          className="input"
          type="password" required
          placeholder="Password"
          autoComplete="current-password"
          value={password} onChange={e => setPassword(e.target.value)}
        />
        {error && <div className="auth-form__error">{error}</div>}
        <button className="btn primary" type="submit">{view === 'signin' ? "Sign In" : "Sign Up"}</button>
        <div className="auth-form__footer">
          {view === 'signin'
            ? <span>Don't have an account? <button type="button" className="link-btn" onClick={() => setView('signup')}>Sign up</button></span>
            : <span>Already have an account? <button type="button" className="link-btn" onClick={() => setView('signin')}>Sign in</button></span>
          }
        </div>
      </form>
    </div>
  );
}

/** Task List item */
function TaskItem({ task, onToggle, onEdit, onView, onDelete }) {
  return (
    <div className={`task-list-item${task.completed ? ' completed' : ''}`}>
      <input type="checkbox" checked={task.completed} onChange={() => onToggle(task)} />
      <div className="task-list-info" onClick={() => onView(task)}>
        <strong className="task-title">{task.title}</strong>
        <span className="task-duedate">{task.due_date ? (new Date(task.due_date)).toLocaleDateString() : ""}</span>
        {task.priority && <span className={`priority pr-${task.priority}`}>Priority: {task.priority}</span>}
      </div>
      <div className="task-list-actions">
        <button className="btn small" onClick={() => onEdit(task)}>Edit</button>
        <button className="btn small secondary" onClick={() => onDelete(task)}>Delete</button>
      </div>
    </div>
  );
}

// Task List: supports search/filter/minimal grouping
function TaskList({ tasks, onToggle, onEdit, onView, onDelete, search, setSearch, filters, setFilters }) {
  // Search and filtering
  const filterTasks = () => {
    let t = tasks;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      t = t.filter(task => (task.title + task.description).toLowerCase().includes(q));
    }
    if (filters.onlyIncomplete) t = t.filter(task => !task.completed);
    if (filters.priority) t = t.filter(task => task.priority === filters.priority);
    return t.sort((a, b) => new Date(a.due_date||0) - new Date(b.due_date||0));
  };

  return (
    <div className="task-list">
      <div className="task-list-toolbar">
        <input className="input search"
          type="text" placeholder="Search tasks..." value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input" value={filters.priority || ''} onChange={e => setFilters(f => ({...f, priority: e.target.value ? parseInt(e.target.value): null}))}>
          <option value="">All Priorities</option>
          <option value="1">High</option><option value="2">Medium</option><option value="3">Low</option>
        </select>
        <label className="inline-chk">
          <input type="checkbox" checked={filters.onlyIncomplete} onChange={e => setFilters(f=>({...f, onlyIncomplete: e.target.checked}))}/>
          Incomplete Only
        </label>
      </div>
      {filterTasks().length > 0 ? filterTasks().map(task =>
        <TaskItem key={task.id} task={task}
          onToggle={onToggle} onEdit={onEdit} onView={onView} onDelete={onDelete} />
      ) : <div className="task-list-empty">No tasks found.</div>}
    </div>
  );
}

// Single task details
function TaskView({ task, onEdit, onBack }) {
  if (!task) return null;
  return (
    <div className="task-view">
      <button className="btn back" onClick={onBack}>&larr; Back to List</button>
      <h2>{task.title}</h2>
      <div>
        <span><b>Status:</b> {task.completed ? 'Completed' : 'Incomplete'}</span>
        <span><b>Due:</b> {task.due_date ? new Date(task.due_date).toLocaleDateString() : "None"}</span>
        <span><b>Priority:</b> {(['', 'High', 'Medium', 'Low'])[task.priority] || 'N/A'}</span>
      </div>
      <p>{task.description}</p>
      <button className="btn" onClick={()=>onEdit(task)}>Edit</button>
    </div>
  );
}

function TaskForm({ initial, onSave, onCancel, loading }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [due, setDue] = useState(initial?.due_date ? initial.due_date.substring(0, 10) : '');
  const [priority, setPriority] = useState(initial?.priority || '');
  const [error, setError] = useState('');

  // PUBLIC_INTERFACE
  /**
   * Handles task creation/upsertion
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return setError("Title required.");
    onSave({
      ...initial,
      title: title.trim(),
      description,
      due_date: due ? new Date(due + 'T23:59:59Z').toISOString() : null,
      priority: priority ? parseInt(priority) : null,
    });
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <h2>{initial?.id ? "Edit Task" : "New Task"}</h2>
      <input className="input" type="text" value={title}
        placeholder="Title" maxLength={100}
        onChange={e => setTitle(e.target.value)} required
      />
      <textarea className="input" value={description}
        placeholder="Description" rows={3}
        onChange={e => setDescription(e.target.value)}
      />
      <div className="task-form-row">
        <label>
          Due Date:<br/>
          <input className="input" type="date" value={due}
            onChange={e => setDue(e.target.value)}
          />
        </label>
        <label>
          Priority:<br/>
          <select className="input" value={priority || ""} onChange={e => setPriority(e.target.value)}>
            <option value="">None</option>
            <option value="1">High</option>
            <option value="2">Medium</option>
            <option value="3">Low</option>
          </select>
        </label>
      </div>
      {error&& <div className="error">{error}</div>}
      <div className="task-form-actions">
        <button className="btn primary" type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</button>
        <button className="btn secondary" type="button" onClick={onCancel} disabled={loading}>Cancel</button>
      </div>
    </form>
  );
}

// Main App Implementation
// PUBLIC_INTERFACE
function App() {
  // THEME
  const [theme, setTheme] = useState('light');
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  // AUTH
  const [user, setUser] = useState(null);
  // UI Navigation
  const [activePage, setActivePage] = useState('list'); // 'list' | 'add' | 'edit' | 'view'
  const [editingTask, setEditingTask] = useState(null);
  const [viewTask, setViewTask] = useState(null);

  // TASKS State
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  // Search/filter state
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ onlyIncomplete: false, priority: null });

  // AUTH HELPER
  const fetchAuthSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
  }, []);

  useEffect(() => { fetchAuthSession(); }, [fetchAuthSession]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (!session) setTasks([]);
    });
    return () => { authListener.subscription.unsubscribe(); };
  }, []);

  // Fetch tasks for logged-in user
  const fetchTasks = useCallback(async () => {
    if (!user) return setTasks([]);
    setLoading(true);
    const { data, error } = await supabase.from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true });
    setLoading(false);
    if (error) return; // TODO show error somewhere
    setTasks(data || []);
  }, [user]);

  useEffect(() => { if (user) fetchTasks(); }, [user, fetchTasks]);

  // ---- TASK CRUD HANDLERS ----- //
  // PUBLIC_INTERFACE
  /** Toggle a task's completion state */
  const handleToggle = async (task) => {
    await supabase.from('tasks').update({ completed: !task.completed }).eq('id', task.id);
    fetchTasks();
  };
  // PUBLIC_INTERFACE
  /** Save (create/update) a task */
  const handleSave = async (taskFields) => {
    setLoading(true);
    if (taskFields.id) {
      await supabase.from('tasks').update({
        title: taskFields.title,
        description: taskFields.description,
        due_date: taskFields.due_date,
        priority: taskFields.priority,
        updated_at: new Date().toISOString(),
      }).eq('id', taskFields.id);
    } else {
      await supabase.from('tasks').insert({
        user_id: user.id,
        title: taskFields.title,
        description: taskFields.description,
        due_date: taskFields.due_date,
        priority: taskFields.priority,
        completed: false,
      });
    }
    setActivePage('list');
    setEditingTask(null);
    setViewTask(null);
    fetchTasks();
    setLoading(false);
  };
  // PUBLIC_INTERFACE
  /** Delete a task */
  const handleDelete = async (task) => {
    if (!window.confirm("Delete this task?")) return;
    setLoading(true);
    await supabase.from('tasks').delete().eq('id', task.id);
    fetchTasks();
    setLoading(false);
  };
  // NAVIGATION
  const handleEdit = (task) => {
    setEditingTask(task);
    setActivePage('edit');
    setViewTask(null);
  };
  const handleView = (task) => {
    setViewTask(task);
    setActivePage('view');
    setEditingTask(null);
  };
  // LOGOUT
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setTasks([]);
    setActivePage('list');
  };

  // APP LAYOUT
  return (
    <div className="App minimal-theme">
      <Sidebar user={user} onNavigate={(page)=>{setActivePage(page); setEditingTask(null); setViewTask(null);}}
               activePage={activePage}
               onSignOut={handleSignOut}
      />
      <header className="main-header">
        <button
          className="theme-toggle"
          onClick={() => setTheme(t => t === "light" ? "dark" : "light")}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
        {user && (
          <span className="user-email">Signed in as {user.email}</span>
        )}
      </header>
      <main className="main-content">
        {!user ? (
          <Auth onAuthSuccess={fetchAuthSession} />
        ) : loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {(activePage === 'list') && (
              <TaskList
                tasks={tasks}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onView={handleView}
                onDelete={handleDelete}
                search={search}
                setSearch={setSearch}
                filters={filters}
                setFilters={setFilters}
              />
            )}
            {(activePage === 'add') && (
              <TaskForm initial={null} onSave={handleSave} onCancel={()=>setActivePage('list')} loading={loading} />
            )}
            {(activePage === 'edit') && (
              <TaskForm initial={editingTask} onSave={handleSave} onCancel={()=>setActivePage('list')} loading={loading} />
            )}
            {(activePage === 'view') && (
              <TaskView task={viewTask} onEdit={handleEdit} onBack={()=>setActivePage('list')} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
