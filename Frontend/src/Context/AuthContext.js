import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cert_admin_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/api/auth/me')
        .then(res => setAdmin(res.data.admin))
        .catch(() => {
          localStorage.removeItem('cert_admin_token');
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const { token, admin: adminData } = res.data;
    localStorage.setItem('cert_admin_token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setAdmin(adminData);
    return adminData;
  };

  const logout = () => {
    localStorage.removeItem('cert_admin_token');
    delete axios.defaults.headers.common['Authorization'];
    setAdmin(null);
  };

  const register = async (name, email, password, adminCode) => {
    const res = await axios.post('/api/auth/register', { name, email, password, adminCode });
    const { token, admin: adminData } = res.data;
    localStorage.setItem('cert_admin_token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setAdmin(adminData);
    return adminData;
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
