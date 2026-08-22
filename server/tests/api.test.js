import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createApp } from '../src/app.js';
import { FileStore } from '../src/store/fileStore.js';

let directory;
let app;

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'todo-api-'));
  const store = new FileStore(join(directory, 'data.json'));
  await store.init();
  app = createApp({ store, jwtSecret: 'test-secret' });
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

async function login(email = 'alex@example.com') {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'demo1234' });
  return response.body.token;
}

describe('To Do API', () => {
  it('rejects protected routes without authentication', async () => {
    const response = await request(app).get('/api/tasks');
    expect(response.status).toBe(401);
  });

  it('creates, reads, updates, searches and deletes a task', async () => {
    const token = await login();

    const created = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Book flights', description: 'Compare refundable fares' });

    expect(created.status).toBe(201);
    expect(created.body.task.title).toBe('Book flights');

    const taskId = created.body.task.id;
    const searched = await request(app)
      .get('/api/tasks?search=flights')
      .set('Authorization', `Bearer ${token}`);
    expect(searched.body.tasks).toHaveLength(1);

    const updated = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Book flights', description: 'Done', completed: true });
    expect(updated.body.task.completed).toBe(true);

    const deleted = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleted.status).toBe(204);
  });

  it('keeps each user isolated from the other user tasks', async () => {
    const alexToken = await login('alex@example.com');
    const samToken = await login('sam@example.com');

    const created = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${alexToken}`)
      .send({ title: 'Private task', description: '' });

    const response = await request(app)
      .get(`/api/tasks/${created.body.task.id}`)
      .set('Authorization', `Bearer ${samToken}`);

    expect(response.status).toBe(404);
  });

  it('persists a reordered task list', async () => {
    const token = await login();
    const first = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'First', description: '' });
    const second = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Second', description: '' });

    const reordered = await request(app)
      .put('/api/tasks/reorder')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderedIds: [second.body.task.id, first.body.task.id] });

    expect(reordered.status).toBe(200);
    expect(reordered.body.tasks.map((task) => task.title)).toEqual(['Second', 'First']);
  });
});
