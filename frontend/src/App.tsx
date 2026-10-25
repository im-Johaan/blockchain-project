import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { AppLayout } from "./layouts/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { AccessControlPage } from "./pages/AccessControlPage";
import { UserPortalPage } from "./pages/UserPortalPage";
import { ForensicsPage } from "./pages/ForensicsPage";
import { BlockchainExplorerPage } from "./pages/BlockchainExplorerPage";
import { AuditTimelinePage } from "./pages/AuditTimelinePage";

// Route guard for authenticated users
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({
  children,
  adminOnly = false,
}) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center text-xs text-slate-500">
        Loading session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/portal" replace />;
  }

  return <>{children}</>;
};

// Root index redirect based on role
const RootRedirect: React.FC = () => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={isAdmin ? "/admin" : "/portal"} replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RootRedirect />} />
            <Route
              path="admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="documents"
              element={
                <ProtectedRoute adminOnly>
                  <DocumentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="access"
              element={
                <ProtectedRoute adminOnly>
                  <AccessControlPage />
                </ProtectedRoute>
              }
            />
            <Route path="portal" element={<UserPortalPage />} />
            <Route
              path="forensics"
              element={
                <ProtectedRoute adminOnly>
                  <ForensicsPage />
                </ProtectedRoute>
              }
            />
            <Route path="explorer" element={<BlockchainExplorerPage />} />
            <Route path="audit" element={<AuditTimelinePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
