import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RBACProvider, useRBAC } from './contexts/RBACContext';
import Login from './pages/Login';
import OTPVerification from './pages/OTPVerification';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import OperationalDashboard from './pages/OperationalDashboard';
import PerformanceDashboard from './pages/PerformanceDashboard';
import AlertsDashboard from './pages/AlertsDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import AccountManagement from './pages/AccountManagement';
import EmployeeManagement from './pages/EmployeeManagement';
import ToolManagement from './pages/ToolManagement';
import IssueManagement from './pages/IssueManagement';
import ProtectedRoute from './components/ProtectedRoute';

// Component to handle default route based on user role
const DefaultRoute = () => {
  const { isAdmin, hasRole } = useRBAC();
  
  if (isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  } else if (hasRole('Employee') && hasRole('Warehouse Manager')) {
    // User has both roles - default to employee dashboard but they can access both
    return <Navigate to="/employee-dashboard" replace />;
  } else if (hasRole('Warehouse Manager')) {
    return <Navigate to="/tool-management" replace />;
  } else if (hasRole('Employee')) {
    return <Navigate to="/employee-dashboard" replace />;
  } else {
    return <Navigate to="/employee-dashboard" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <RBACProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/otp-verification" element={<OTPVerification />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Employee-only route */}
              <Route path="/employee-dashboard" element={
                <ProtectedRoute employeeOnly={true}>
                  <EmployeeDashboard />
                </ProtectedRoute>
              } />

              {/* Warehouse Manager-only route */}
              <Route path="/tool-management" element={
                <ProtectedRoute warehouseManagerOnly={true}>
                  <ToolManagement />
                </ProtectedRoute>
              } />

              {/* Admin dashboard routes - accessible by admins */}
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <OperationalDashboard />
                </ProtectedRoute>
              } />

              <Route path="/performance-dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PerformanceDashboard />
                </ProtectedRoute>
              } />

              <Route path="/alerts-dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AlertsDashboard />
                </ProtectedRoute>
              } />

              <Route path="/executive-dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ExecutiveDashboard />
                </ProtectedRoute>
              } />
              
              {/* Admin management routes - accessible by admins */}
              <Route path="/account-management" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AccountManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/employee-management" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <EmployeeManagement />
                </ProtectedRoute>
              } />

              <Route path="/issue-management" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <IssueManagement />
                </ProtectedRoute>
              } />

              {/* Default redirect - based on user role */}
              <Route path="/" element={
                <ProtectedRoute>
                  <DefaultRoute />
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </Router>
      </RBACProvider>
    </AuthProvider>
  );
}

export default App;
