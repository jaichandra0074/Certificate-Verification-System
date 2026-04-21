import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('cert_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    const message = err.response?.data?.message || err.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

export const verifyCertificate = (id) => api.get(`/certificates/verify/${id}`);
export const verifyByRoll = (rollNumber) => api.get(`/certificates/verify-by-roll/${rollNumber}`);
export const getDashboard = () => api.get('/admin/dashboard');
export const getCertificates = (params) => api.get('/admin/certificates', { params });
export const getCertificate = (id) => api.get(`/admin/certificates/${id}`);
export const createCertificate = (data) => api.post('/admin/certificates', data);
export const updateCertificate = (id, data) => api.put(`/admin/certificates/${id}`, data);
export const revokeCertificate = (id) => api.patch(`/admin/certificates/${id}/revoke`);
export const activateCertificate = (id) => api.patch(`/admin/certificates/${id}/activate`);
export const deleteCertificate = (id) => api.delete(`/admin/certificates/${id}`);
export const uploadExcel = (formData, onProgress) => api.post('/admin/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  onUploadProgress: onProgress
});
export const downloadTemplate = () => window.open('/api/admin/template', '_blank');
export const downloadCertificate = (certId) => window.open(`/api/certificates/download/${certId}`, '_blank');

export default api;
