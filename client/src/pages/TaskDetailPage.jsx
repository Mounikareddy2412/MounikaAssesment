import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../api.js';

export function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isNew) return;
    let active = true;

    apiRequest(`/tasks/${id}`)
      .then(({ task }) => {
        if (!active) return;
        setTitle(task.title);
        setDescription(task.description);
        setCompleted(task.completed);
      })
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [id, isNew]);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await apiRequest(isNew ? '/tasks' : `/tasks/${id}`, {
        method: isNew ? 'POST' : 'PUT',
        body: JSON.stringify({ title, description, completed })
      });
      navigate('/tasks');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    const confirmed = window.confirm('Delete this task?');
    if (!confirmed) return;

    try {
      await apiRequest(`/tasks/${id}`, { method: 'DELETE' });
      navigate('/tasks');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  if (loading) {
    return <main className="detail-shell"><div className="detail-card">Loading task…</div></main>;
  }

  return (
    <main className="detail-shell">
      <section className="detail-card">
        <Link className="back-link" to="/tasks">← Back to tasks</Link>
        <p className="eyebrow">{isNew ? 'NEW TASK' : 'TASK DETAILS'}</p>
        <h1>{isNew ? 'Add something to your list' : 'Edit task'}</h1>

        <form onSubmit={save}>
          <label>
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              autoFocus
              required
            />
          </label>
          <label>
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={2000}
              rows={7}
              placeholder="Add useful context…"
            />
          </label>
          {!isNew && (
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={completed}
                onChange={(event) => setCompleted(event.target.checked)}
              />
              Mark as complete
            </label>
          )}

          {error && <p className="form-error" role="alert">{error}</p>}

          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save task'}
            </button>
            {!isNew && <button className="danger-button" type="button" onClick={remove}>Delete</button>}
          </div>
        </form>
      </section>
    </main>
  );
}
