import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AdminDashboard() {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const chartData = data?.monthlyData?.map(d => ({
    month: MONTHS[d._id.month - 1],
    count: d.count
  })) || [];

  const StatCard = ({ label, value, sub, color = 'var(--gold)' }) => (
    <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
      <div style={{ fontSize: 36, fontWeight: 700, color, fontFamily: 'Cinzel, serif', lineHeight: 1 }}>{value ?? '—'}</div>
      <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, marginTop: 8 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );

  const fmtDate = (d) => { try { return format(new Date(d), 'dd MMM yyyy'); } catch { return '—'; } };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
    </div>
  );

  return (
    <div className="animate-in">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 26, color: 'var(--text-primary)' }}>
          Good day, <span style={{ color: 'var(--gold)' }}>{admin?.name?.split(' ')[0]}</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Here's what's happening with your certificates</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Certificates" value={data?.stats?.total} sub="All time" />
        <StatCard label="Active" value={data?.stats?.active} color="var(--success)" sub="Verified & valid" />
        <StatCard label="Revoked" value={data?.stats?.revoked} color="var(--error)" sub="Manually revoked" />
        <StatCard label="Expired" value={data?.stats?.expired} color="var(--warning)" sub="Past expiry date" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Certificates Issued</h2>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Last 6 months</span>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
                  cursor={{ fill: 'rgba(201,168,76,0.05)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={i === chartData.length - 1 ? 'var(--gold)' : 'var(--border)'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No data yet
            </div>
          )}
        </div>

        {/* Top Verified */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Most Verified</h2>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>By count</span>
          </div>
          {data?.topVerified?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.topVerified.map((cert, i) => (
                <div key={cert.certificateId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: i === 0 ? 'rgba(201,168,76,0.15)' : 'var(--bg-secondary)',
                    border: `1px solid ${i === 0 ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: i === 0 ? 'var(--gold)' : 'var(--text-muted)'
                  }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cert.studentName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cert.certificateId}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>×{cert.verificationCount}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '40px 0' }}>No verifications yet</div>
          )}
        </div>
      </div>

      {/* Recent Certificates */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Recent Certificates</h2>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/certificates')} style={{ fontSize: 12, padding: '6px 14px' }}>View All →</button>
        </div>
        {data?.recentCerts?.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Certificate ID</th>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentCerts.map(cert => (
                  <tr key={cert.certificateId}>
                    <td><code style={{ fontSize: 12, color: 'var(--gold)', background: 'rgba(201,168,76,0.08)', padding: '2px 8px', borderRadius: 4 }}>{cert.certificateId}</code></td>
                    <td style={{ fontWeight: 500 }}>{cert.studentName}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{cert.courseName}</td>
                    <td><span className={`badge badge-${cert.status}`}>{cert.status}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{fmtDate(cert.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="icon">◈</div>
            <h3>No certificates yet</h3>
            <p>Upload your first batch using the Excel uploader</p>
            <button className="btn btn-primary" onClick={() => navigate('/admin/upload')} style={{ marginTop: 16 }}>Upload Now</button>
          </div>
        )}
      </div>
    </div>
  );
}
