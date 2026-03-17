import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const ONBOARDING_KEY = "Cals Crumble Fit_onboarding";

function hasCompletedOnboarding(): boolean {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    return !!(data.name && data.weight && data.height && data.age);
  } catch { return false; }
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to onboarding if profile not set up yet
  // Allow edit-profile to bypass so users can fix it
  const isEditProfile = location.pathname === "/dashboard/edit-profile";
  if (!hasCompletedOnboarding() && !isEditProfile) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
