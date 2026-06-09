import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminLayout from './pages/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminDataView from './pages/AdminDataView';
import ImportTool from './components/admin/ImportTool';
import StudentApp from './pages/StudentApp';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<StudentApp />} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="data/:table" element={<AdminDataView />} />
          <Route path="import" element={<ImportTool />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
