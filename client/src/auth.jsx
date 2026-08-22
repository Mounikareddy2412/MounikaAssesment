import { createContext, useContext, useMemo, useState } from 'react';
import { apiRequest } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('todo_user');
    return saved ? JSON.parse(saved) : null;
  });

  const value = useMemo(
    () => ({
      user,
      async login(email, password) {
        const result = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        localStorage.setItem('todo_token', result.token);
        localStorage.setItem('todo_user', JSON.stringify(result.user));
        setUser(result.user);
      },
      logout() {
        localStorage.removeItem('todo_token');
        localStorage.removeItem('todo_user');
        setUser(null);
      }
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
