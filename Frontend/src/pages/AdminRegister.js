import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminRegister() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', adminCode: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.adminCode) return toast.error('Please fill all fields');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.adminCode);
      toast.success('Account created successfully!');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440, position: 'relative' }}>
        <div className="animate-in" style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 60, height: 60,
            background: 'linear-gradient(135deg, var(--gold), var(--gold-dim))',
            borderRadius: 14, margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 800, color: '#000', fontFamily: 'Cinzel, serif'
          }}>C</div>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 22, color: 'var(--text-primary)', marginBottom: 6 }}>Create Admin Account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Requires an admin registration code</p>
        </div>

        <div className="card animate-in animate-delay-1" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="input-group">
              <label>Full Name</label>
              <input className="input-field" placeholder="Dr. John Smith" value={form.name} onChange={set('name')} />
            </div>
            <div className="input-group">
              <label>Email Address</label>
              <input className="input-field" type="email" placeholder="admin@institution.edu" value={form.email} onChange={set('email')} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="input-group">
                <label>Password</label>
                <input className="input-field" type="password" placeholder="Min 6 chars" value={form.password} onChange={set('password')} />
              </div>
              <div className="input-group">
                <label>Confirm Password</label>
                <input className="input-field" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={set('confirmPassword')} />
              </div>
            </div>
            <div className="input-group">
              <label>Admin Registration Code</label>
              <input className="input-field" type="password" placeholder="Secret code from system admin" value={form.adminCode} onChange={set('adminCode')} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Default: <code style={{ color: 'var(--gold-dim)', background: 'var(--bg-secondary)', padding: '1px 6px', borderRadius: 4 }}>ADMIN2024SECRET</code>
              </span>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ padding: '12px', fontSize: 15, justifyContent: 'center', marginTop: 4 }}>
              {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000' }} /> Creating...</> : 'Create Account →'}
            </button>
          </form>

          <div className="divider" />
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            Already have an account? <Link to="/admin/login" style={{ color: 'var(--gold)', fontWeight: 500 }}>Sign in</Link>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 13 }}>← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
