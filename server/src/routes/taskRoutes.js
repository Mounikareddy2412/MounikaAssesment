import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { HttpError } from '../utils/httpError.js';

function validateTaskInput(body) {
  const title = String(body?.title ?? '').trim();
  const description = String(body?.description ?? '').trim();

  if (!title) throw new HttpError(400, 'Title is required');
  if (title.length > 120) throw new HttpError(400, 'Title must be 120 characters or fewer');
  if (description.length > 2000) {
    throw new HttpError(400, 'Description must be 2000 characters or fewer');
  }

  return { title, description };
}

function findOwnedTask(data, taskId, userId) {
  const task = data.tasks.find((candidate) => candidate.id === taskId);
  if (!task) throw new HttpError(404, 'Task not found');

  // I return 404 for another user's task so the API does not reveal that it exists.
  if (task.userId !== userId) throw new HttpError(404, 'Task not found');
  return task;
}

export function createTaskRouter({ store }) {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      const search = String(req.query.search ?? '').trim().toLowerCase();
      const data = await store.read();
      const tasks = data.tasks
        .filter((task) => task.userId === req.user.sub)
        .filter((task) => {
          if (!search) return true;
          return `${task.title} ${task.description}`.toLowerCase().includes(search);
        })
        .sort((left, right) => left.position - right.position);

      res.json({ tasks });
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const data = await store.read();
      res.json({ task: findOwnedTask(data, req.params.id, req.user.sub) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const input = validateTaskInput(req.body);
      const task = await store.update((data) => {
        const ownedTasks = data.tasks.filter((item) => item.userId === req.user.sub);
        const now = new Date().toISOString();
        const created = {
          id: randomUUID(),
          userId: req.user.sub,
          ...input,
          completed: Boolean(req.body?.completed),
          position: ownedTasks.length,
          createdAt: now,
          updatedAt: now
        };
        data.tasks.push(created);
        return created;
      });

      res.status(201).json({ task });
    } catch (error) {
      next(error);
    }
  });

  router.put('/reorder', async (req, res, next) => {
    try {
      const orderedIds = req.body?.orderedIds;
      if (!Array.isArray(orderedIds)) {
        throw new HttpError(400, 'orderedIds must be an array');
      }

      const tasks = await store.update((data) => {
        const ownedTasks = data.tasks.filter((task) => task.userId === req.user.sub);
        const ownedIds = new Set(ownedTasks.map((task) => task.id));

        if (
          orderedIds.length !== ownedTasks.length ||
          new Set(orderedIds).size !== orderedIds.length ||
          orderedIds.some((id) => !ownedIds.has(id))
        ) {
          throw new HttpError(400, 'orderedIds must contain every task exactly once');
        }

        const order = new Map(orderedIds.map((id, index) => [id, index]));
        const now = new Date().toISOString();
        ownedTasks.forEach((task) => {
          task.position = order.get(task.id);
          task.updatedAt = now;
        });

        return ownedTasks.sort((a, b) => a.position - b.position);
      });

      res.json({ tasks });
    } catch (error) {
      next(error);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const input = validateTaskInput(req.body);
      const task = await store.update((data) => {
        const existing = findOwnedTask(data, req.params.id, req.user.sub);
        existing.title = input.title;
        existing.description = input.description;
        existing.completed = Boolean(req.body?.completed);
        existing.updatedAt = new Date().toISOString();
        return existing;
      });

      res.json({ task });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      await store.update((data) => {
        findOwnedTask(data, req.params.id, req.user.sub);
        data.tasks = data.tasks.filter((task) => task.id !== req.params.id);

        data.tasks
          .filter((task) => task.userId === req.user.sub)
          .sort((a, b) => a.position - b.position)
          .forEach((task, index) => {
            task.position = index;
          });
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
