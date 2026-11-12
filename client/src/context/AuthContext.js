import React, {createContext, useContext, useMemo, useState} from 'react';
import {loginRequest} from '../../api';

const AuthContext = createContext(null);

export function AuthProvider({children}) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token),
      login: async (username, password) => {
        setLoading(true);
        try {
          const result = await loginRequest(username, password);
          setToken(result.token);
          setUser(result.user);
          return result;
        } finally {
          setLoading(false);
        }
      },
      logout: () => {
        setToken(null);
        setUser(null);
      },
    }),
    [token, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
