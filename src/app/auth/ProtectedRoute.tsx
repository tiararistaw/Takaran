
import { Navigate, Outlet } from "react-router";
import { useApp } from "../state";

export default function ProtectedRoute({
  allowedRoles,
}: {
  allowedRoles?: string[];
}) {
  const { isAuthenticated, profile, authLoading, profileLoading } = useApp();

  if (authLoading || (isAuthenticated && profileLoading)) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">
            <span className="auth-logo-mark">T</span>
            <span>takaran</span>
          </div>
          <p style={{ textAlign: "center", color: "var(--muted)" }}>
            Memeriksa akun...
          </p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.peran)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
