import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import VerifyPage from './pages/VerifyPage';
import AdminLogin from './pages/AdminLogin';
import AdminRegister from './pages/AdminRegister';
import AdminDashboard from './pages/AdminDashboard';
import AdminCertificates from './pages/AdminCertificates';
import AdminUpload from './pages/AdminUpload';
import AdminLayout from './components/AdminLayout';
import LoadingScreen from './components/LoadingScreen';

const ProtectedRoute = ({ children }) => {
  const { admin, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!admin) return <Navigate to="/admin/login" replace />;
  return children;
};

const PublicAdminRoute = ({ children }) => {
  const { admin, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (admin) return <Navigate to="/admin/dashboard" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/verify/:certificateId" element={<VerifyPage />} />

      {/* Admin Auth */}
      <Route path="/admin/login" element={<PublicAdminRoute><AdminLogin /></PublicAdminRoute>} />
      <Route path="/admin/register" element={<PublicAdminRoute><AdminRegister /></PublicAdminRoute>} />

      {/* Admin Protected */}
      <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="certificates" element={<AdminCertificates />} />
        <Route path="upload" element={<AdminUpload />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#111130',
              color: '#f0f0ff',
              border: '1px solid #2a2a6a',
              fontFamily: 'Outfit, sans-serif'
            },
            success: { iconTheme: { primary: '#2ed573', secondary: '#111130' } },
            error: { iconTheme: { primary: '#ff4757', secondary: '#111130' } }
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
