import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { BusinessProvider, useBusiness } from './context/BusinessContext.jsx';
import { ConfigProvider } from './context/ConfigContext.jsx';
import Login from './pages/Login.jsx';
import BusinessSelect from './pages/BusinessSelect.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Inventory from './pages/Inventory.jsx';
import POSBilling from './pages/POSBilling.jsx';
import Reports from './pages/Reports.jsx';
import BulkUpload from './pages/BulkUpload.jsx';
import Settings from './pages/Settings.jsx';
import SuperAdmin from './pages/SuperAdmin.jsx';
import SuperAdminLogin from './pages/SuperAdminLogin.jsx';

function PrivateRoute({ children, requireBusiness = true }) {
  const { isAuthenticated } = useAuth();
  const { business } = useBusiness();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireBusiness && !business) return <Navigate to="/select-business" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BusinessProvider>
        <ConfigProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/select-business" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/select-business" element={<BusinessSelect />} />
            <Route path="/super-admin/login" element={<SuperAdminLogin />} />
            <Route path="/super-admin" element={<PrivateRoute requireBusiness={false}><SuperAdmin /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/inventory" element={<PrivateRoute><Inventory /></PrivateRoute>} />
            <Route path="/pos" element={<PrivateRoute><POSBilling /></PrivateRoute>} />
            <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
            <Route path="/bulk-upload" element={<PrivateRoute><BulkUpload /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        </ConfigProvider>
      </BusinessProvider>
    </AuthProvider>
  );
}
