import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getCertificates, revokeCertificate, activateCertificate, deleteCertificate, downloadCertificate, createCertificate, updateCertificate } from '../utils/api';
import { format } from 'date-fns';

const STATUS_OPTS = ['', 'active', 'revoked', 'expired'];
const TYPE_OPTS = ['', 'completion', 'achievement', 'participation', 'merit', 'degree'];

const EMPTY_FORM = {
  studentName: '', studentEmail: '', rollNumber: '', courseName: '',
  courseCode: '', grade: '', percentage: '', issueDate: '', expiryDate: '',
  institution: '', department: '', certificateType: 'completion'
};

export default function AdminCertificates() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [filters, setFilters] = useState({ search: '', status: '', certificateType: '', page: 1 });
  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'view' | 'delete'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchCerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCertificates({ ...filters, limit: 15 });
      setCerts(res.data.certificates);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchCerts(); }, [fetchCerts]);

  const fmtDate = (d) => { try { return format(new Date(d), 'dd MMM yyyy'); } catch { return '—'; } };

  const openEdit = (cert) => {
    setSelected(cert);
    setForm({
      studentName: cert.studentName || '',
      studentEmail: cert.studentEmail || '',
      rollNumber: cert.rollNumber || '',
      courseName: cert.courseName || '',
      courseCode: cert.courseCode || '',
      grade: cert.grade || '',
      percentage: cert.percentage || '',
      issueDate: cert.issueDate ? cert.issueDate.split('T')[0] : '',
      expiryDate: cert.expiryDate ? cert.expiryDate.split('T')[0] : '',
      institution: cert.institution || '',
      department: cert.department || '',
      certificateType: cert.certificateType || 'completion'
    });
    setModal('edit');
  };

  const openCreate = () => {
    setSelected(null);
    setForm(EMPTY_FORM);
    setModal('create');
  };

  const handleSave = async () => {
    if (!form.studentName || !form.studentEmail || !form.rollNumber || !form.courseName || !form.issueDate || !form.institution)
      return toast.error('Please fill all required fields');
    setSaving(true);
    try {
      if (modal === 'create') {
        await createCertificate(form);
        toast.success('Certificate created!');
      } else {
        await updateCertificate(selected._id, form);
        toast.success('Certificate updated!');
      }
      setModal(null);
      fetchCerts();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (cert) => {
    try {
      await revokeCertificate(cert._id);
      toast.success('Certificate revoked');
      fetchCerts();
    } catch (err) { toast.error(err.message); }
  };

  const handleActivate = async (cert) => {
    try {
      await activateCertificate(cert._id);
      toast.success('Certificate activated');
      fetchCerts();
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = async () => {
    try {
      await deleteCertificate(selected._id);
      toast.success('Certificate deleted');
      setModal(null);
      fetchCerts();
    } catch (err) { toast.error(err.message); }
  };

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }));
  const setF = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const FormField = ({ label, name, type = 'text', required, options }) => (
    <div className="input-group">
      <label>{label}{required && <span style={{ color: 'var(--error)', marginLeft: 3 }}>*</span>}</label>
      {options ? (
        <select className="input-field" value={form[name]} onChange={setF(name)}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input className="input-field" type={type} value={form[name]} onChange={setF(name)} />
      )}
    </div>
  );

  return (
    <div className="animate-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 24, color: 'var(--text-primary)' }}>Certificates</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{pagination.total} total records</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ New Certificate</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            className="input-field" placeholder="Search by name, ID, roll, course..."
            value={filters.search} onChange={e => setFilter('search', e.target.value)}
            style={{ flex: '1 1 260px', minWidth: 200 }}
          />
          <select className="input-field" value={filters.status} onChange={e => setFilter('status', e.target.value)} style={{ width: 140 }}>
            <option value="">All Status</option>
            {STATUS_OPTS.filter(Boolean).map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select className="input-field" value={filters.certificateType} onChange={e => setFilter('certificateType', e.target.value)} style={{ width: 160 }}>
            <option value="">All Types</option>
            {TYPE_OPTS.filter(Boolean).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          {(filters.search || filters.status || filters.certificateType) && (
            <button className="btn btn-secondary" onClick={() => setFilters({ search: '', status: '', certificateType: '', page: 1 })} style={{ fontSize: 12 }}>Clear</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
          </div>
        ) : certs.length === 0 ? (
          <div className="empty-state">
            <div className="icon">◈</div>
            <h3>No certificates found</h3>
            <p>Try adjusting your filters or add a new certificate</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Certificate ID</th>
                    <th>Student</th>
                    <th>Roll No.</th>
                    <th>Course</th>
                    <th>Type</th>
                    <th>Issue Date</th>
                    <th>Status</th>
                    <th>Verifications</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {certs.map(cert => (
                    <tr key={cert._id}>
                      <td>
                        <code style={{ fontSize: 11, color: 'var(--gold)', background: 'rgba(201,168,76,0.08)', padding: '2px 8px', borderRadius: 4 }}>
                          {cert.certificateId}
                        </code>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{cert.studentName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cert.studentEmail}</div>
                      </td>
                      <td style={{ fontSize: 13 }}>{cert.rollNumber}</td>
                      <td style={{ fontSize: 13, maxWidth: 160 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cert.courseName}</div>
                        {cert.grade && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Grade: {cert.grade}</div>}
                      </td>
                      <td>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{cert.certificateType}</span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{fmtDate(cert.issueDate)}</td>
                      <td><span className={`badge badge-${cert.status}`}>{cert.status}</span></td>
                      <td style={{ textAlign: 'center', color: cert.verificationCount > 0 ? 'var(--gold)' : 'var(--text-muted)', fontWeight: cert.verificationCount > 0 ? 600 : 400 }}>
                        {cert.verificationCount}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button title="Edit" className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => openEdit(cert)}>✎</button>
                          {cert.status === 'active' ? (
                            <button title="Revoke" className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => handleRevoke(cert)}>⊗</button>
                          ) : (
                            <button title="Activate" className="btn btn-success" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => handleActivate(cert)}>⊕</button>
                          )}
                          {cert.status === 'active' && (
                            <button title="Download" className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => downloadCertificate(cert.certificateId)}>↓</button>
                          )}
                          <button title="Delete" className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => { setSelected(cert); setModal('delete'); }}>✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '16px 20px', borderTop: '1px solid var(--border-light)' }}>
                <button className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: 12 }}
                  disabled={filters.page <= 1} onClick={() => setFilter('page', filters.page - 1)}>← Prev</button>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Page {pagination.page} of {pagination.pages}</span>
                <button className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: 12 }}
                  disabled={filters.page >= pagination.pages} onClick={() => setFilter('page', filters.page + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal: Create / Edit */}
      {(modal === 'create' || modal === 'edit') && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          backdropFilter: 'blur(4px)'
        }} onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 32, width: '100%', maxWidth: 640,
            maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 18, color: 'var(--text-primary)' }}>
                {modal === 'create' ? 'Create Certificate' : 'Edit Certificate'}
              </h2>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FormField label="Student Name" name="studentName" required />
              <FormField label="Student Email" name="studentEmail" type="email" required />
              <FormField label="Roll Number" name="rollNumber" required />
              <FormField label="Institution" name="institution" required />
              <FormField label="Course Name" name="courseName" required />
              <FormField label="Course Code" name="courseCode" />
              <FormField label="Grade" name="grade" />
              <FormField label="Percentage / Score" name="percentage" type="number" />
              <FormField label="Issue Date" name="issueDate" type="date" required />
              <FormField label="Expiry Date" name="expiryDate" type="date" />
              <FormField label="Department" name="department" />
              <FormField label="Certificate Type" name="certificateType" options={TYPE_OPTS.filter(Boolean).map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))} />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
                {saving ? <><div className="spinner" style={{ width: 14, height: 14, borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000' }} /> Saving...</> : 'Save Certificate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete */}
      {modal === 'delete' && selected && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid rgba(255,71,87,0.3)',
            borderRadius: 16, padding: 32, width: '100%', maxWidth: 420, textAlign: 'center'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠</div>
            <h2 style={{ fontSize: 18, color: 'var(--text-primary)', marginBottom: 8 }}>Delete Certificate?</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>
              This action cannot be undone. Certificate <code style={{ color: 'var(--gold)' }}>{selected.certificateId}</code> will be permanently deleted.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>{selected.studentName} — {selected.courseName}</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} style={{ padding: '10px 24px' }}>Delete Permanently</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
