import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { verifyCertificate, verifyByRoll, downloadCertificate } from '../utils/api';
import { format } from 'date-fns';

export default function VerifyPage() {
  const navigate = useNavigate();
  const { certificateId: paramId } = useParams();
  const [mode, setMode] = useState('id'); // 'id' | 'roll'
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [multiResults, setMultiResults] = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (paramId) {
      setQuery(paramId);
      handleVerify(null, paramId);
    }
  }, [paramId]);

  const handleVerify = async (e, overrideId) => {
    if (e) e.preventDefault();
    const q = (overrideId || query).trim().toUpperCase();
    if (!q) return;
    setLoading(true);
    setResult(null);
    setMultiResults(null);
    setError('');
    try {
      if (mode === 'id') {
        const res = await verifyCertificate(q);
        setResult(res.data);
      } else {
        const res = await verifyByRoll(q);
        setMultiResults(res.data);
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certId) => {
    setDownloading(certId);
    downloadCertificate(certId);
    setTimeout(() => setDownloading(false), 2000);
  };

  const fmtDate = (d) => {
    try { return format(new Date(d), 'dd MMM yyyy'); } catch { return d; }
  };

  const StatusBadge = ({ status }) => (
    <span className={`badge badge-${status}`} style={{ fontSize: 12, padding: '5px 14px' }}>
      {status === 'active' ? '✓ Verified & Active' : status === 'revoked' ? '✗ Revoked' : '⚠ Expired'}
    </span>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        padding: '18px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-light)', background: 'rgba(13,13,43,0.8)', backdropFilter: 'blur(12px)'
      }}>
        <button onClick={() => navigate('/')} style={{
          display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none',
          color: 'var(--gold)', cursor: 'pointer', fontFamily: 'Cinzel, serif', fontSize: 16, fontWeight: 700
        }}>
          <div style={{
            width: 34, height: 34, background: 'linear-gradient(135deg, var(--gold), var(--gold-dim))',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: '#000', fontWeight: 800
          }}>C</div>
          CertVerify
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/admin/login')} style={{ fontSize: 13 }}>
          Admin Login
        </button>
      </header>

      <div style={{ flex: 1, padding: '60px 40px', maxWidth: 780, margin: '0 auto', width: '100%' }}>
        {/* Title */}
        <div className="animate-in" style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 36, color: 'var(--text-primary)', marginBottom: 12 }}>
            Verify Your <span style={{ color: 'var(--gold)' }}>Certificate</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
            Enter your Certificate ID or Roll Number to verify authenticity
          </p>
        </div>

        {/* Search Card */}
        <div className="card animate-in animate-delay-1">
          {/* Mode Toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: 'var(--bg-secondary)', padding: 4, borderRadius: 10 }}>
            {[['id', '◈ Certificate ID'], ['roll', '# Roll Number']].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setResult(null); setMultiResults(null); setError(''); setQuery(''); }} style={{
                flex: 1, padding: '9px 16px', borderRadius: 7,
                background: mode === m ? 'var(--bg-card)' : 'transparent',
                border: mode === m ? '1px solid var(--border)' : '1px solid transparent',
                color: mode === m ? 'var(--gold)' : 'var(--text-muted)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s'
              }}>{label}</button>
            ))}
          </div>

          <form onSubmit={handleVerify} style={{ display: 'flex', gap: 12 }}>
            <input
              className="input-field"
              value={query}
              onChange={e => setQuery(e.target.value.toUpperCase())}
              placeholder={mode === 'id' ? 'e.g. CERT-LXZ4K-A3F7' : 'e.g. CS2024001'}
              style={{ flex: 1, fontSize: 15 }}
            />
            <button type="submit" className="btn btn-primary" disabled={loading || !query.trim()} style={{ padding: '10px 24px', flexShrink: 0 }}>
              {loading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : 'Verify →'}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="animate-in" style={{
            marginTop: 24, padding: 20, borderRadius: 12,
            background: 'var(--error-bg)', border: '1px solid rgba(255,71,87,0.3)',
            display: 'flex', gap: 14, alignItems: 'flex-start'
          }}>
            <span style={{ fontSize: 22 }}>✗</span>
            <div>
              <div style={{ color: 'var(--error)', fontWeight: 600, marginBottom: 4 }}>Verification Failed</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{error}</div>
            </div>
          </div>
        )}

        {/* Single Certificate Result */}
        {result && (
          <div className="animate-in" style={{ marginTop: 24 }}>
            {/* Status banner */}
            <div style={{
              padding: 20, borderRadius: '12px 12px 0 0',
              background: result.verified ? 'rgba(46,213,115,0.06)' : 'var(--error-bg)',
              border: `1px solid ${result.verified ? 'rgba(46,213,115,0.3)' : 'rgba(255,71,87,0.3)'}`,
              borderBottom: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: result.verified ? 'rgba(46,213,115,0.15)' : 'rgba(255,71,87,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, color: result.verified ? 'var(--success)' : 'var(--error)'
                }}>{result.verified ? '✓' : '✗'}</div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: result.verified ? 'var(--success)' : 'var(--error)' }}>
                    {result.verified ? 'Certificate Verified' : 'Verification Failed'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {result.verified ? 'This certificate is authentic and unmodified' : `Status: ${result.status}`}
                  </div>
                </div>
              </div>
              <StatusBadge status={result.status} />
            </div>

            {/* Details */}
            <div className="card" style={{ borderRadius: '0 0 12px 12px', borderTop: 'none' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 24 }}>
                {[
                  ['Certificate ID', result.certificate?.certificateId],
                  ['Student Name', result.certificate?.studentName],
                  ['Roll Number', result.certificate?.rollNumber],
                  ['Email', result.certificate?.studentEmail],
                  ['Course', result.certificate?.courseName],
                  ['Course Code', result.certificate?.courseCode || '—'],
                  ['Grade', result.certificate?.grade || '—'],
                  ['Score', result.certificate?.percentage ? `${result.certificate.percentage}%` : '—'],
                  ['Institution', result.certificate?.institution],
                  ['Department', result.certificate?.department || '—'],
                  ['Issue Date', result.certificate?.issueDate ? fmtDate(result.certificate.issueDate) : '—'],
                  ['Verified', `${result.certificate?.verificationCount || 0} times`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{value || '—'}</div>
                  </div>
                ))}
              </div>

              {/* Integrity Check */}
              <div style={{
                padding: '12px 16px', borderRadius: 8,
                background: result.integrityCheck ? 'rgba(46,213,115,0.05)' : 'var(--error-bg)',
                border: `1px solid ${result.integrityCheck ? 'rgba(46,213,115,0.2)' : 'rgba(255,71,87,0.2)'}`,
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20
              }}>
                <span style={{ fontSize: 16, color: result.integrityCheck ? 'var(--success)' : 'var(--error)' }}>
                  {result.integrityCheck ? '⊕' : '⊗'}
                </span>
                <div style={{ fontSize: 13, color: result.integrityCheck ? 'var(--success)' : 'var(--error)' }}>
                  {result.integrityCheck ? 'Cryptographic integrity verified — document is unmodified' : 'Integrity check failed — document may have been tampered'}
                </div>
              </div>

              {result.verified && (
                <button
                  className="btn btn-primary"
                  disabled={downloading === result.certificate?.certificateId}
                  onClick={() => handleDownload(result.certificate?.certificateId)}
                  style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15 }}
                >
                  {downloading === result.certificate?.certificateId
                    ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Generating PDF...</>
                    : '↓ Download Certificate PDF'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Multiple Results (roll number search) */}
        {multiResults && (
          <div className="animate-in" style={{ marginTop: 24 }}>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: 'var(--success)', fontSize: 18 }}>✓</span>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 16 }}>
                Found <span style={{ color: 'var(--gold)' }}>{multiResults.count}</span> certificate{multiResults.count > 1 ? 's' : ''}
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {multiResults.certificates?.map(cert => (
                <div key={cert.certificateId} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>{cert.courseName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cert.certificateId} · {cert.institution}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Issued: {fmtDate(cert.issueDate)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <StatusBadge status={cert.status} />
                    {cert.status === 'active' && (
                      <button className="btn btn-secondary" style={{ fontSize: 12, padding: '7px 14px' }}
                        onClick={() => { setMode('id'); setQuery(cert.certificateId); handleVerify(null, cert.certificateId); setMultiResults(null); }}>
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
