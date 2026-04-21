import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { uploadExcel, downloadTemplate } from '../utils/api';

export default function AdminUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      toast.error('Only Excel (.xlsx, .xls) and CSV files are accepted');
      return;
    }
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadExcel(formData, (progressEvent) => {
        const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(pct);
      });
      setResult(res.data);
      toast.success(`Import complete: ${res.data.summary.imported} certificates added`);
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => { setFile(null); setResult(null); setProgress(0); };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 24, color: 'var(--text-primary)' }}>Upload Certificates</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Import certificates in bulk from an Excel or CSV file</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Main upload */}
        <div>
          {/* Template Download */}
          <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Download Template</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Use the official template to ensure correct column headers</div>
            </div>
            <button className="btn btn-secondary" onClick={downloadTemplate}>
              ↓ Excel Template
            </button>
          </div>

          {/* Dropzone */}
          {!result && (
            <div
              {...getRootProps()}
              style={{
                border: `2px dashed ${isDragActive ? 'var(--gold)' : file ? 'rgba(46,213,115,0.5)' : 'var(--border)'}`,
                borderRadius: 16, padding: '60px 40px', textAlign: 'center', cursor: 'pointer',
                background: isDragActive ? 'rgba(201,168,76,0.04)' : file ? 'rgba(46,213,115,0.03)' : 'var(--bg-card)',
                transition: 'all 0.2s', marginBottom: 20
              }}
            >
              <input {...getInputProps()} />
              <div style={{
                width: 72, height: 72, borderRadius: 18, margin: '0 auto 20px',
                background: file ? 'rgba(46,213,115,0.1)' : isDragActive ? 'rgba(201,168,76,0.1)' : 'var(--bg-secondary)',
                border: `1px solid ${file ? 'rgba(46,213,115,0.3)' : isDragActive ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, color: file ? 'var(--success)' : isDragActive ? 'var(--gold)' : 'var(--text-muted)'
              }}>
                {file ? '✓' : isDragActive ? '↓' : '⬡'}
              </div>

              {file ? (
                <>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--success)', marginBottom: 8 }}>File Ready</div>
                  <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 4 }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatSize(file.size)}</div>
                  <button onClick={(e) => { e.stopPropagation(); reset(); }} style={{
                    marginTop: 16, background: 'none', border: '1px solid var(--border)', borderRadius: 8,
                    color: 'var(--text-muted)', padding: '6px 16px', fontSize: 12, cursor: 'pointer'
                  }}>Change File</button>
                </>
              ) : isDragActive ? (
                <>
                  <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--gold)', marginBottom: 8 }}>Drop it here!</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Release to select this file</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Drag & Drop your Excel file</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>or click to browse your files</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Supports .xlsx, .xls, .csv · Max 10MB</div>
                </>
              )}
            </div>
          )}

          {/* Upload button + progress */}
          {file && !result && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button className="btn btn-primary" disabled={uploading} onClick={handleUpload}
                style={{ flex: 1, padding: '13px', fontSize: 15, justifyContent: 'center' }}>
                {uploading
                  ? <><div className="spinner" style={{ width: 16, height: 16, borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000' }} /> Importing...</>
                  : '⬆ Import Certificates'}
              </button>
            </div>
          )}

          {uploading && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                <span>Uploading & processing...</span>
                <span>{progress}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3, width: `${progress}%`,
                  background: 'linear-gradient(90deg, var(--gold-dim), var(--gold))',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="animate-in">
              {/* Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Total Rows', value: result.summary.total, color: 'var(--text-primary)' },
                  { label: 'Imported', value: result.summary.imported, color: 'var(--success)' },
                  { label: 'Errors', value: result.summary.errors, color: 'var(--error)' },
                  { label: 'Skipped', value: result.summary.skipped, color: 'var(--warning)' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: 'Cinzel, serif' }}>{value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Batch ID: <code style={{ color: 'var(--gold)', fontSize: 13 }}>{result.batchId}</code></div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Import completed successfully</div>
                </div>
                <button className="btn btn-secondary" onClick={reset}>Upload Another</button>
              </div>

              {/* Errors */}
              {result.results.errors.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--error)', marginBottom: 8 }}>
                    ✕ {result.results.errors.length} Errors
                  </div>
                  <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {result.results.errors.map((e, i) => (
                      <div key={i} style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--error-bg)', border: '1px solid rgba(255,71,87,0.2)', fontSize: 13 }}>
                        <span style={{ color: 'var(--error)', fontWeight: 600 }}>Row {e.row}:</span>
                        <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>{e.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skipped */}
              {result.results.skipped.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--warning)', marginBottom: 8 }}>
                    ⚠ {result.results.skipped.length} Skipped (Duplicates)
                  </div>
                  <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {result.results.skipped.map((s, i) => (
                      <div key={i} style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--warning-bg)', border: '1px solid rgba(255,165,2,0.2)', fontSize: 13 }}>
                        <span style={{ color: 'var(--warning)', fontWeight: 600 }}>Row {s.row}:</span>
                        <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>{s.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Side panel: Instructions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Required Columns</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['studentName', 'Full name of student', true],
                ['studentEmail', 'Student email address', true],
                ['rollNumber', 'Unique roll/enrollment no.', true],
                ['courseName', 'Name of the course', true],
                ['issueDate', 'Date (YYYY-MM-DD)', true],
                ['institution', 'Institution name', true],
                ['courseCode', 'Short course code', false],
                ['grade', 'Grade (A, B+, etc.)', false],
                ['percentage', 'Score in %', false],
                ['department', 'Department name', false],
                ['expiryDate', 'Expiry date if any', false],
                ['certificateType', 'completion/achievement/etc.', false],
              ].map(([col, desc, req]) => (
                <div key={col} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: req ? 'var(--error)' : 'var(--success)', fontSize: 12, flexShrink: 0, marginTop: 2 }}>{req ? '✱' : '○'}</span>
                  <div>
                    <code style={{ fontSize: 11, color: 'var(--gold)', background: 'rgba(201,168,76,0.08)', padding: '1px 6px', borderRadius: 4 }}>{col}</code>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 11, color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--error)' }}>✱</span> = Required &nbsp; <span style={{ color: 'var(--success)' }}>○</span> = Optional
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Tips</h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Download and use the official template for best results',
                'Dates should be in YYYY-MM-DD format (e.g. 2024-12-15)',
                'Duplicate roll numbers in the same course will be skipped',
                'Max file size is 10MB — split larger files into batches',
                'All imported certs get a unique ID and QR code automatically',
              ].map((tip, i) => (
                <li key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--gold-dim)', flexShrink: 0 }}>◈</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
