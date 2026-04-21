import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        padding: '20px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-light)',
        background: 'rgba(13,13,43,0.8)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40,
            background: 'linear-gradient(135deg, var(--gold), var(--gold-dim))',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Cinzel, serif', fontSize: 20, fontWeight: 700, color: '#000'
          }}>C</div>
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: 18, color: 'var(--gold)', fontWeight: 700 }}>CertVerify</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/verify')} style={{ fontSize: 13 }}>
            Verify Certificate
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/admin/login')} style={{ fontSize: 13 }}>
            Admin Login
          </button>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '80px 40px', textAlign: 'center'
      }}>
        {/* Glow orb */}
        <div style={{
          position: 'absolute', width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none', zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 20,
            background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)',
            color: 'var(--gold)', fontSize: 12, fontWeight: 500, marginBottom: 32,
            letterSpacing: '0.5px', textTransform: 'uppercase'
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block', animation: 'pulse-gold 2s infinite' }} />
            Secure Certificate Verification
          </div>

          <h1 style={{
            fontFamily: 'Cinzel, serif',
            fontSize: 'clamp(36px, 6vw, 72px)',
            fontWeight: 700, lineHeight: 1.1,
            color: 'var(--text-primary)', marginBottom: 24
          }}>
            Verify Academic{' '}
            <span style={{
              background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>Credentials</span>
            {' '}Instantly
          </h1>

          <p style={{
            fontSize: 18, color: 'var(--text-secondary)', maxWidth: 560,
            lineHeight: 1.7, marginBottom: 48
          }}>
            Tamper-proof certificate verification powered by cryptographic hashing.
            Verify authenticity, download originals, and trust with confidence.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('/verify')} style={{ padding: '14px 32px', fontSize: 15 }}>
              ◈ Verify a Certificate
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/login')} style={{ padding: '14px 32px', fontSize: 15 }}>
              Admin Portal →
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 40px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <h2 style={{ fontFamily: 'Cinzel, serif', textAlign: 'center', fontSize: 28, color: 'var(--gold)', marginBottom: 48 }}>
          How It Works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
          {[
            { icon: '⬡', title: 'Admin Uploads', desc: 'Admins bulk-import student certificates via Excel/CSV with validation and error reporting.' },
            { icon: '◈', title: 'Instant Verification', desc: 'Students verify certificates by ID or roll number. Cryptographic hash ensures tamper-proof results.' },
            { icon: '↓', title: 'Secure Download', desc: 'Download professionally generated PDF certificates with embedded QR codes for re-verification.' },
            { icon: '⊕', title: 'Real-time Tracking', desc: 'Admins track verification counts, revoke certificates, and manage all records from a unified dashboard.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="card animate-in" style={{ textAlign: 'center', padding: 32 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14, margin: '0 auto 20px',
                background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, color: 'var(--gold)'
              }}>{icon}</div>
              <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: 16, color: 'var(--text-primary)', marginBottom: 10 }}>{title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-light)',
        padding: '24px 40px', textAlign: 'center',
        color: 'var(--text-muted)', fontSize: 13
      }}>
        <span style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold-dim)' }}>CertVerify</span>
        {' '}— Secure Certificate Verification System
      </footer>
    </div>
  );
}
