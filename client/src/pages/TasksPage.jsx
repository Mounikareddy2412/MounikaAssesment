import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api.js';
import { useAuth } from '../auth.jsx';
import { TaskCard } from '../components/TaskCard.jsx';

export function TasksPage() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const draggedId = useRef(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        setError('');
        const result = await apiRequest(`/tasks?search=${encodeURIComponent(search)}`);
        if (active) setTasks(result.tasks);
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);

  async function toggleTask(task) {
    const original = tasks;
    const next = tasks.map((item) =>
      item.id === task.id ? { ...item, completed: !item.completed } : item
    );
    setTasks(next);

    try {
      await apiRequest(`/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...task, completed: !task.completed })
      });
    } catch (requestError) {
      setTasks(original);
      setError(requestError.message);
    }
  }

  async function dropOn(targetId) {
    const sourceId = draggedId.current;
    if (!sourceId || sourceId === targetId || search) return;

    const sourceIndex = tasks.findIndex((task) => task.id === sourceId);
    const targetIndex = tasks.findIndex((task) => task.id === targetId);
    const reordered = [...tasks];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setTasks(reordered);

    try {
      // I persist the complete order because it keeps the backend contract simple and deterministic.
      await apiRequest('/tasks/reorder', {
        method: 'PUT',
        body: JSON.stringify({ orderedIds: reordered.map((task) => task.id) })
      });
    } catch (requestError) {
      setError(requestError.message);
      const refreshed = await apiRequest('/tasks');
      setTasks(refreshed.tasks);
    } finally {
      draggedId.current = null;
    }
  }

  const openCount = tasks.filter((task) => !task.completed).length;

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/tasks"><span>✓</span> Focus List</Link>
        <div className="user-menu">
          <span>{user.name}</span>
          <button type="button" onClick={logout}>Sign out</button>
        </div>
      </header>

      <section className="content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">MY TASKS</p>
            <h1>Today</h1>
            <p className="muted">{openCount} open {openCount === 1 ? 'task' : 'tasks'}</p>
          </div>
          <Link className="primary-button button-link" to="/tasks/new">+ New task</Link>
        </div>

        <div className="search-wrap">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Search tasks"
            placeholder="Search tasks…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {search && <p className="sort-hint">Reordering is available when search is cleared.</p>}
        {error && <p className="form-error" role="alert">{error}</p>}

        {loading ? (
          <div className="empty-state"><p>Loading tasks…</p></div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✓</div>
            <h2>{search ? 'No matching tasks' : 'Your list is clear'}</h2>
            <p>{search ? 'Try a different search.' : 'Create a task when something needs your attention.'}</p>
          </div>
        ) : (
          <div className="task-list">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onDragStart={(id) => { draggedId.current = id; }}
                onDrop={dropOn}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
