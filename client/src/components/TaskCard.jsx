import { Link } from 'react-router-dom';

export function TaskCard({ task, onToggle, onDragStart, onDrop }) {
  return (
    <article
      className={`task-card ${task.completed ? 'task-card--done' : ''}`}
      draggable
      onDragStart={() => onDragStart(task.id)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => onDrop(task.id)}
      aria-label={`Task: ${task.title}`}
    >
      <button
        className="task-check"
        type="button"
        aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'}
        aria-pressed={task.completed}
        onClick={() => onToggle(task)}
      >
        {task.completed ? '✓' : ''}
      </button>

      <Link className="task-card__body" to={`/tasks/${task.id}`}>
        <strong>{task.title}</strong>
        {task.description && <span>{task.description}</span>}
      </Link>

      <span className="drag-handle" aria-hidden="true">⋮⋮</span>
    </article>
  );
}
