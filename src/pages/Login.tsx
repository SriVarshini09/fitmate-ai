import { useState, useEffect, useRef } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, AlertTriangle, Lock, LogIn, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import AuthLayout from "@/components/auth/AuthLayout";
import GlassInput from "@/components/auth/GlassInput";
import GlassButton from "@/components/auth/GlassButton";
import { AUTH, STORAGE_KEYS } from "@/lib/constants";

const MAX_ATTEMPTS = AUTH.MAX_LOGIN_ATTEMPTS;
const LOCKOUT_SECONDS = AUTH.LOCKOUT_SECONDS;
const ATTEMPT_KEY = STORAGE_KEYS.LOGIN_ATTEMPTS;

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

  useEffect(() => {
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
          } else setLockoutRemaining(r);
        }, 1000);
      } else {
        saveAttemptData({ count: 0, lockedUntil: null, lastAttempt: 0 });
      }
    }
    return () => { if (lockoutRef.current) clearInterval(lockoutRef.current); };
  }, []);

  if (!authLoading && session) return <Navigate to={from} replace />;

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!isValidEmail(email)) newErrors.email = "Enter a valid email address";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const attemptData = getAttemptData();
    if (attemptData.lockedUntil && Date.now() < attemptData.lockedUntil) {
      toast.error(`Too many failed attempts. Try again in ${Math.ceil((attemptData.lockedUntil - Date.now()) / 1000)}s.`);
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
        setErrors({ password: `Incorrect email or password — ${remaining} attempt${remaining !== 1 ? "s" : ""} left` });
      } else if (error.message.includes("Email not confirmed")) {
        toast.error("Please verify your email before signing in. Check your inbox.");
      } else {
        toast.error(error.message);
      }
      return;
    }

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
  };

  const isLocked = lockoutRemaining > 0;

  return (
    <AuthLayout splitLayout>
      <motion.div
        className="w-full max-w-sm space-y-7"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-display text-white mb-1">Welcome back</h1>
          <p className="text-white/45 font-body text-sm">Sign in to continue your journey</p>
        </div>

        {/* Lockout Banner */}
        <AnimatePresence>
          {isLocked && (
            <motion.div
              className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <Lock className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400 font-body">
                Locked — try again in <span className="font-bold">{lockoutRemaining}s</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4" autoComplete="on" noValidate>
          <GlassInput
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: undefined })); }}
            disabled={isLocked || loading}
            error={errors.email}
            icon={<Mail className="w-4 h-4" />}
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-white/60 tracking-wide uppercase font-body">Password</label>
              <Link to="/forgot-password" className="text-xs text-primary hover:text-primary/80 font-body transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(p => ({ ...p, password: undefined })); }}
                disabled={isLocked || loading}
                className={[
                  "w-full bg-white/5 border rounded-2xl py-3.5 pl-4 pr-11 text-sm text-white placeholder:text-white/25 outline-none transition-all duration-200 font-body disabled:opacity-50",
                  "focus:bg-white/8 focus:border-primary/60 focus:ring-2 focus:ring-primary/20",
                  errors.password ? "border-red-400/60" : "border-white/10",
                ].join(" ")}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <motion.p
                className="text-xs text-red-400 font-body flex items-center gap-1"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertTriangle className="w-3 h-3" /> {errors.password}
              </motion.p>
            )}
          </div>

          <GlassButton
            type="submit"
            loading={loading}
            disabled={isLocked}
            className="mt-2"
          >
            {isLocked ? (
              <><Lock className="w-4 h-4" /> Locked ({lockoutRemaining}s)</>
            ) : (
              <><LogIn className="w-4 h-4" /> Sign In</>
            )}
          </GlassButton>
        </form>

        <p className="text-center text-sm text-white/40 font-body">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">
            Create one free
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
};

export default Login;