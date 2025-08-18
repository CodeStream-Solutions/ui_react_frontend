import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RBACProvider } from './contexts/RBACContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
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

function App() {
  return (
    <AuthProvider>
      <RBACProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/otp-verification" element={<OTPVerification />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <OperationalDashboard />
                </ProtectedRoute>
              } />

              <Route path="/performance-dashboard" element={
                <ProtectedRoute>
                  <PerformanceDashboard />
                </ProtectedRoute>
              } />

              <Route path="/alerts-dashboard" element={
                <ProtectedRoute>
                  <AlertsDashboard />
                </ProtectedRoute>
              } />

              <Route path="/employee-dashboard" element={
                <ProtectedRoute>
                  <EmployeeDashboard />
                </ProtectedRoute>
              } />

              <Route path="/executive-dashboard" element={
                <ProtectedRoute>
                  <ExecutiveDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/account-management" element={
                <ProtectedRoute>
                  <AccountManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/employee-management" element={
                <ProtectedRoute>
                  <EmployeeManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/tool-management" element={
                <ProtectedRoute>
                  <ToolManagement />
                </ProtectedRoute>
              } />

              <Route path="/issue-management" element={
                <ProtectedRoute>
                  <IssueManagement />
                </ProtectedRoute>
              } />

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/employee-dashboard" replace />} />
            </Routes>
          </div>
        </Router>
      </RBACProvider>
    </AuthProvider>
  );
}

export default App;
