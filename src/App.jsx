import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { CompanyProvider } from '@/lib/CompanyContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import PermissionRoute from '@/components/PermissionRoute';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import Absensi from '@/pages/Absensi';
import Kunjungan from '@/pages/Kunjungan';
import MasterData from '@/pages/MasterData';
import DataKaryawan from '@/pages/DataKaryawan';
import IzinCuti from '@/pages/IzinCuti';
import Lembur from '@/pages/Lembur';
import Pinjaman from '@/pages/Pinjaman';
import Payrolls from '@/pages/Payrolls';
import Pengumuman from '@/pages/Pengumuman';
import Laporan from '@/pages/Laporan';
import Pengaturan from '@/pages/Pengaturan';
import Administrator from '@/pages/Administrator';
import MasterPerusahaan from '@/pages/MasterPerusahaan';
import TitikAbsensi from '@/pages/TitikAbsensi';
import { Navigate } from 'react-router-dom';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<Layout />}>
          <Route path="/" element={<PermissionRoute permission="dashboard"><Dashboard /></PermissionRoute>} />
          <Route path="/absensi" element={<PermissionRoute permission="absensi"><Absensi /></PermissionRoute>} />
          <Route path="/kunjungan" element={<PermissionRoute permission="kunjungan"><Kunjungan /></PermissionRoute>} />
          <Route path="/master-data" element={<PermissionRoute permission="master_data"><MasterData /></PermissionRoute>} />
          <Route path="/karyawan" element={<PermissionRoute permission="data_karyawan"><DataKaryawan /></PermissionRoute>} />
          <Route path="/izin-cuti" element={<PermissionRoute permission="izin_cuti"><IzinCuti /></PermissionRoute>} />
          <Route path="/lembur" element={<PermissionRoute permission="lembur"><Lembur /></PermissionRoute>} />
          <Route path="/pinjaman" element={<PermissionRoute permission="pinjaman"><Pinjaman /></PermissionRoute>} />
          <Route path="/payrolls" element={<PermissionRoute permission="payroll"><Payrolls /></PermissionRoute>} />
          <Route path="/pengumuman" element={<PermissionRoute permission="pengumuman"><Pengumuman /></PermissionRoute>} />
          <Route path="/laporan" element={<PermissionRoute permission="laporan"><Laporan /></PermissionRoute>} />
          <Route path="/pengaturan" element={<PermissionRoute permission="pengaturan"><Pengaturan /></PermissionRoute>} />
          <Route path="/administrator" element={<PermissionRoute permission="administrator"><Administrator /></PermissionRoute>} />
          <Route path="/master-data/perusahaan" element={<PermissionRoute permission="master_perusahaan"><MasterPerusahaan /></PermissionRoute>} />
          <Route path="/master-data/titik-absensi" element={<PermissionRoute permission="titik_absensi"><TitikAbsensi /></PermissionRoute>} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <CompanyProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </CompanyProvider>
    </AuthProvider>
  )
}

export default App
