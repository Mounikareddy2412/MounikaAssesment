import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth.jsx';
import { LoginPage } from './LoginPage.jsx';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('LoginPage', () => {
  it('signs in with the supplied credentials', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        token: 'token-123',
        user: { id: '1', name: 'Alex', email: 'alex@example.com' }
      })
    }));

    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(fetch).toHaveBeenCalledOnce();
    expect(localStorage.getItem('todo_token')).toBe('token-123');
  });

  it('shows a friendly error returned by the API', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid email or password' })
    }));

    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
  });
});
