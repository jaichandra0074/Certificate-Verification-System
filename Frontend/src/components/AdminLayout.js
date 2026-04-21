import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/admin/dashboard', icon: '⬡', label: 'Dashboard' },
  { to: '/admin/certificates', icon: '◈', label: 'Certificates' },
  { to: '/admin/upload', icon: '⬆', label: 'Upload Excel' },
];

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 68 : 240,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-light)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s ease',
        position: 'fixed', top: 0, left: 0, height: '100vh',
        zIndex: 100,
        overflow: 'hidden'
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex', alignItems: 'center', gap: 12,
          minHeight: 72
        }}>
          <div style={{
            width: 36, height: 36, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--gold), var(--gold-dim))',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: '#000', fontFamily: 'Cinzel, serif'
          }}>C</div>
          {!collapsed && (
            <div>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: 14, color: 'var(--gold)', fontWeight: 700, lineHeight: 1 }}>CertVerify</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>Admin Portal</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 8, textDecoration: 'none',
              color: isActive ? 'var(--gold)' : 'var(--text-secondary)',
              background: isActive ? 'rgba(201,168,76,0.08)' : 'transparent',
              border: isActive ? '1px solid rgba(201,168,76,0.2)' : '1px solid transparent',
              fontSize: 14, fontWeight: 500, transition: 'all 0.15s',
              whiteSpace: 'nowrap', overflow: 'hidden'
            })}>
              <span style={{ fontSize: 16, flexShrink: 0, width: 20, textAlign: 'center' }}>{icon}</span>
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User + collapse */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border-light)' }}>
          {!collapsed && (
            <div style={{
              padding: '10px 12px', marginBottom: 8,
              background: 'var(--bg-card)', borderRadius: 8,
              border: '1px solid var(--border-light)'
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', truncate: 'ellipsis' }}>{admin?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{admin?.email}</div>
            </div>
          )}
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 8, width: '100%',
            background: 'transparent', border: '1px solid transparent',
            color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
            transition: 'all 0.15s', whiteSpace: 'nowrap', overflow: 'hidden'
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.borderColor = 'rgba(255,71,87,0.2)'; e.currentTarget.style.background = 'var(--error-bg)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ fontSize: 16, flexShrink: 0, width: 20, textAlign: 'center' }}>↩</span>
            {!collapsed && 'Logout'}
          </button>
          <button onClick={() => setCollapsed(!collapsed)} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 8, width: '100%',
            background: 'transparent', border: '1px solid transparent',
            color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
            marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden'
          }}>
            <span style={{ fontSize: 16, flexShrink: 0, width: 20, textAlign: 'center' }}>{collapsed ? '→' : '←'}</span>
            {!collapsed && 'Collapse'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1, marginLeft: collapsed ? 68 : 240,
        transition: 'margin-left 0.25s ease',
        minHeight: '100vh', padding: 32,
        background: 'var(--bg-primary)'
      }}>
        <Outlet />
      </main>
    </div>
  );
}
