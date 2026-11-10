import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('quizhub_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('quizhub_access_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('quizhub_user', JSON.stringify(res.data.user));
        } catch (err) {
          console.warn('Failed to verify existing session:', err);
          setUser(null);
          localStorage.removeItem('quizhub_access_token');
          localStorage.removeItem('quizhub_refresh_token');
          localStorage.removeItem('quizhub_user');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: loggedInUser, access_token, refresh_token } = res.data;
    localStorage.setItem('quizhub_access_token', access_token);
    localStorage.setItem('quizhub_refresh_token', refresh_token);
    localStorage.setItem('quizhub_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    const { user: registeredUser, access_token, refresh_token } = res.data;
    localStorage.setItem('quizhub_access_token', access_token);
    localStorage.setItem('quizhub_refresh_token', refresh_token);
    localStorage.setItem('quizhub_user', JSON.stringify(registeredUser));
    setUser(registeredUser);
    return registeredUser;
  };

  const logout = () => {
    localStorage.removeItem('quizhub_access_token');
    localStorage.removeItem('quizhub_refresh_token');
    localStorage.removeItem('quizhub_user');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('quizhub_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;

