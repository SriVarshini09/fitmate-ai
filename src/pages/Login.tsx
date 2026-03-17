import { useState, useEffect, useRef } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Zap, AlertTriangle, Lock, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 60;
const ATTEMPT_KEY = "vf_login_attempts";

interface AttemptData {
  count: number;
  lockedUntil: number | null;
  lastAttempt: number;
}

function getAttemptData(): AttemptData {
  try {
    const raw = sessionStorage.getItem(ATTEMPT_KEY);
    if (!raw) return { count: 0, lockedUntil: null, lastAttempt: 0 };
    return JSON.parse(raw);
  } catch { return { count: 0, lockedUntil: null, lastAttempt: 0 }; }
}

function saveAttemptData(data: AttemptData) {
  sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(data));
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

const Login = () => {
  const { session, loading: authLoading } = useAuth();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const lockoutRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check lockout on mount and tick countdown
  useEffect(() => {
    const check = () => {
      const data = getAttemptData();
      if (data.lockedUntil) {
        const remaining = Math.ceil((data.lockedUntil - Date.now()) / 1000);
        if (remaining > 0) {
          setLockoutRemaining(remaining);
          lockoutRef.current = setInterval(() => {
            const r = Math.ceil((data.lockedUntil! - Date.now()) / 1000);
            if (r <= 0) {
              setLockoutRemaining(0);
              clearInterval(lockoutRef.current!);
              saveAttemptData({ count: 0, lockedUntil: null, lastAttempt: 0 });
            } else {
              setLockoutRemaining(r);
            }
          }, 1000);
        } else {
          saveAttemptData({ count: 0, lockedUntil: null, lastAttempt: 0 });
        }
      }
    };
    check();
    return () => { if (lockoutRef.current) clearInterval(lockoutRef.current); };
  }, []);

  // If already authenticated, redirect to intended page or dashboard
  if (!authLoading && session) return <Navigate to={from} replace />;

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(email)) {
      newErrors.email = "Enter a valid email address";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    // Check lockout
    const attemptData = getAttemptData();
    if (attemptData.lockedUntil && Date.now() < attemptData.lockedUntil) {
      const remaining = Math.ceil((attemptData.lockedUntil - Date.now()) / 1000);
      toast.error(`Too many failed attempts. Try again in ${remaining}s.`);
      return;
    }

    setLoading(true);
    setErrors({});

    const { error, data } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setLoading(false);

      // Track failed attempt
      const current = getAttemptData();
      const newCount = current.count + 1;
      const lockedUntil = newCount >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_SECONDS * 1000 : null;
      saveAttemptData({ count: newCount, lockedUntil, lastAttempt: Date.now() });

      if (lockedUntil) {
        setLockoutRemaining(LOCKOUT_SECONDS);
        lockoutRef.current = setInterval(() => {
          const r = Math.ceil((lockedUntil - Date.now()) / 1000);
          if (r <= 0) {
            setLockoutRemaining(0);
            clearInterval(lockoutRef.current!);
            saveAttemptData({ count: 0, lockedUntil: null, lastAttempt: 0 });
          } else setLockoutRemaining(r);
        }, 1000);
        toast.error(`Account locked for ${LOCKOUT_SECONDS}s after ${MAX_ATTEMPTS} failed attempts`);
        return;
      }

      const remaining = MAX_ATTEMPTS - newCount;
      if (error.message.includes("Invalid login credentials") || error.message.includes("invalid_credentials")) {
        toast.error(`Incorrect email or password. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`);
        setErrors({ password: "Incorrect email or password" });
      } else if (error.message.includes("Email not confirmed")) {
        toast.error("Please verify your email before signing in. Check your inbox.");
      } else {
        toast.error(error.message);
      }
      return;
    }

    // Success — reset attempts
    saveAttemptData({ count: 0, lockedUntil: null, lastAttempt: 0 });

    const userId = data.user?.id;
    let displayName = "there";
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, username")
        .eq("user_id", userId)
        .single();
      if (profile?.display_name) displayName = profile.display_name;
      else if (profile?.username) displayName = profile.username;
    }
    setLoading(false);
    toast.success(`Welcome back, ${displayName}! 💪`);
    // Navigation is handled by the Navigate component above when session changes
  };

  const isLocked = lockoutRemaining > 0;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      <motion.div
        className="w-full max-w-md space-y-8 relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-display text-foreground">VitalFlow</span>
          </Link>
          <h1 className="text-3xl font-bold font-display text-foreground">Welcome back</h1>
          <p className="text-muted-foreground font-body mt-2">Sign in to continue your journey</p>
        </div>

        {/* Lockout Banner */}
        <AnimatePresence>
          {isLocked && (
            <motion.div
              className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Lock className="w-5 h-5 text-destructive shrink-0" />
              <div>
                <p className="text-sm font-semibold text-destructive font-display">Account temporarily locked</p>
                <p className="text-xs text-destructive/80 font-body">
                  Too many failed attempts. Try again in <span className="font-bold">{lockoutRemaining}s</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5" autoComplete="on" noValidate>
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="text-sm font-medium text-foreground font-body">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
              }}
              placeholder="you@example.com"
              disabled={isLocked || loading}
              className={`w-full bg-secondary rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body transition-all disabled:opacity-50 ${
                errors.email
                  ? "ring-2 ring-destructive/50 bg-destructive/5"
                  : "focus:ring-2 focus:ring-primary/50"
              }`}
            />
            <AnimatePresence>
              {errors.email && (
                <motion.p
                  className="flex items-center gap-1 text-xs text-destructive font-body"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <AlertTriangle className="w-3 h-3" /> {errors.email}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="text-sm font-medium text-foreground font-body">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs text-primary font-body hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                }}
                placeholder="••••••••"
                disabled={isLocked || loading}
                className={`w-full bg-secondary rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body transition-all disabled:opacity-50 pr-12 ${
                  errors.password
                    ? "ring-2 ring-destructive/50 bg-destructive/5"
                    : "focus:ring-2 focus:ring-primary/50"
                }`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <AnimatePresence>
              {errors.password && (
                <motion.p
                  className="flex items-center gap-1 text-xs text-destructive font-body"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <AlertTriangle className="w-3 h-3" /> {errors.password}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            type="submit"
            disabled={loading || isLocked}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold font-display flex items-center justify-center gap-2 glow-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            whileTap={!loading && !isLocked ? { scale: 0.98 } : {}}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Signing in...
              </>
            ) : isLocked ? (
              <>
                <Lock className="w-4 h-4" /> Locked ({lockoutRemaining}s)
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Sign In
              </>
            )}
          </motion.button>
        </form>

        <p className="text-center text-sm text-muted-foreground font-body">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary font-medium hover:underline">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;