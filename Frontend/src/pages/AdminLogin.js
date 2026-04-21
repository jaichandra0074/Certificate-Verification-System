import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse at 50% 40%, rgba(201,168,76,0.04) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Logo */}
        <div className="animate-in" style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64,
            background: 'linear-gradient(135deg, var(--gold), var(--gold-dim))',
            borderRadius: 16, margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 800, color: '#000', fontFamily: 'Cinzel, serif',
            boxShadow: 'var(--shadow-gold)'
          }}>C</div>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 24, color: 'var(--text-primary)', marginBottom: 8 }}>
            Admin Portal
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Sign in to manage certificates</p>
        </div>

        {/* Form Card */}
        <div className="card animate-in animate-delay-1" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="input-group">
              <label>Email Address</label>
              <input
                className="input-field"
                type="email"
                placeholder="admin@institution.edu"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input-field"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                  style={{ paddingRight: 42 }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16
                }}>{showPass ? '◉' : '○'}</button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ padding: '12px', fontSize: 15, justifyContent: 'center', marginTop: 4 }}
            >
              {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000' }} /> Signing in...</> : 'Sign In →'}
            </button>
          </form>

          <div className="divider" />

          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            Need an admin account?{' '}
            <Link to="/admin/register" style={{ color: 'var(--gold)', fontWeight: 500 }}>Register here</Link>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 13 }}>← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
