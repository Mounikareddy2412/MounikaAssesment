import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth.jsx';
import { TasksPage } from './TasksPage.jsx';

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('todo_user', JSON.stringify({ id: '1', name: 'Alex', email: 'alex@example.com' }));
  localStorage.setItem('todo_token', 'token');
  vi.restoreAllMocks();
});

describe('TasksPage', () => {
  it('renders tasks loaded from the API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        tasks: [{
          id: 't1', userId: '1', title: 'Review pull request', description: 'Check edge cases',
          completed: false, position: 0
        }]
      })
    }));

    render(
      <MemoryRouter>
        <AuthProvider>
          <TasksPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Review pull request')).toBeInTheDocument();
    expect(screen.getByText('Check edge cases')).toBeInTheDocument();
  });
});
