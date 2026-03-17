import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const ONBOARDING_KEY = "Cals Crumble Fit_onboarding";
// Max ms to wait for auth before treating as unauthenticated
const AUTH_TIMEOUT_MS = 5000;

function hasCompletedOnboarding(): boolean {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    return !!(data.name && data.weight && data.height && data.age);
  } catch { return false; }
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If true, skip the onboarding-completion check (used for /onboarding itself) */
  onboardingBypass?: boolean;
}

const ProtectedRoute = ({ children, onboardingBypass = false }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [timedOut, setTimedOut] = useState(false);

  // Safety net: if Supabase takes too long, stop spinning and redirect to login
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setTimedOut(true), AUTH_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [loading]);

  // Still waiting for Supabase session check
  if (loading && !timedOut) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground font-body">Checking session…</p>
      </div>
    );
  }

  // No authenticated user → send to login, preserving intended destination
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // For /onboarding route: only check that user is logged in, not onboarding completion
  if (onboardingBypass) {
    return <>{children}</>;
  }

  // Redirect to onboarding if profile not set up yet
  // Allow edit-profile to bypass so users can fix broken profiles
  const isEditProfile = location.pathname === "/dashboard/edit-profile";
  if (!hasCompletedOnboarding() && !isEditProfile) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
