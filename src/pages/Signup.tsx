import { useState, useRef } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, ArrowRight, ArrowLeft, User, Mail, Phone, Camera, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import AuthLayout from "@/components/auth/AuthLayout";
import GlassInput from "@/components/auth/GlassInput";
import GlassButton from "@/components/auth/GlassButton";
import PasswordStrength from "@/components/auth/PasswordStrength";

type Step = "credentials" | "profile";

const Signup = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>("credentials");
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);

  if (!authLoading && session) return <Navigate to="/dashboard" replace />;

  // Step 1: Credentials
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Profile
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return toast.error("Username is required");
    if (username.length < 3) return toast.error("Username must be at least 3 characters");
    if (!email.trim()) return toast.error("Email is required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return toast.error("Enter a valid email address");
    if (!password) return toast.error("Password is required");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirmPassword) return toast.error("Passwords don't match");
    setStep("profile");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!displayName.trim()) return toast.error("Name is required");

    submittingRef.current = true;
    setLoading(true);

    // 1. Sign up
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: displayName },
      },
    });

    if (authError) {
      submittingRef.current = false;
      setLoading(false);
      return toast.error(authError.message);
    }

    const userId = authData.user?.id;
    if (!userId) {
      submittingRef.current = false;
      setLoading(false);
      return toast.error("Signup failed. Please try again.");
    }

    // 2. Upload avatar if selected
    let avatarUrl: string | null = null;
    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const filePath = `${userId}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, { upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
        avatarUrl = urlData.publicUrl;
      }
    }

    // 3. Upsert profile (handles case where trigger row hasn't been created yet)
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        user_id: userId,
        username: username.toLowerCase().trim(),
        display_name: displayName.trim(),
        phone: phone.trim() || null,
        recovery_email: recoveryEmail.trim() || null,
        avatar_url: avatarUrl,
      });

    submittingRef.current = false;
    setLoading(false);

    if (profileError) {
      toast.error("Account created but profile update failed. You can update it later.");
    } else {
      toast.success("Account created! 🎉");
    }

    navigate("/onboarding");
  };

  return (
    <AuthLayout>
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="mb-7">
          <h1 className="text-3xl font-bold font-display text-white mb-1">
            {step === "credentials" ? "Create account" : "Your profile"}
          </h1>
          <p className="text-white/45 font-body text-sm">
            {step === "credentials" ? "Step 1 of 2 — Credentials" : "Step 2 of 2 — About you"}
          </p>
        </div>

        {/* Step progress */}
        <div className="flex gap-2 mb-7">
          <div className="h-1 flex-1 rounded-full bg-primary" />
          <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step === "profile" ? "bg-primary" : "bg-white/10"}`} />
        </div>

        <AnimatePresence mode="wait">
          {step === "credentials" ? (
            <motion.form
              key="credentials"
              onSubmit={handleCredentials}
              className="space-y-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <GlassInput
                label="Username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                icon={<User className="w-4 h-4" />}
                autoComplete="username"
              />
              <GlassInput
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                icon={<Mail className="w-4 h-4" />}
                autoComplete="email"
              />
              <div className="space-y-1.5">
                <div className="relative">
                  <GlassInput
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    suffix={
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-white/60 transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                </div>
                <PasswordStrength password={password} />
              </div>
              <GlassInput
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />

              <GlassButton type="submit" className="mt-2">
                Continue <ArrowRight className="w-4 h-4" />
              </GlassButton>

              <p className="text-center text-sm text-white/40 font-body pt-1">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                  Sign in
                </Link>
              </p>
            </motion.form>
          ) : (
            <motion.form
              key="profile"
              onSubmit={handleSignup}
              className="space-y-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Avatar upload */}
              <div className="flex justify-center mb-2">
                <label className="relative cursor-pointer group">
                  <div className="w-20 h-20 rounded-2xl bg-white/5 border-2 border-dashed border-white/10 group-hover:border-primary/50 flex items-center justify-center overflow-hidden transition-colors">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <Camera className="w-5 h-5 text-white/30 mx-auto mb-1" />
                        <span className="text-[9px] text-white/30 font-body">Photo</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-primary flex items-center justify-center shadow-lg">
                    {avatarPreview
                      ? <Check className="w-3 h-3 text-primary-foreground" />
                      : <Camera className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              </div>

              <GlassInput
                label="Full Name *"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                icon={<User className="w-4 h-4" />}
                autoComplete="name"
              />
              <GlassInput
                label="Phone (optional)"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                icon={<Phone className="w-4 h-4" />}
                autoComplete="tel"
              />
              <GlassInput
                label="Recovery Email (optional)"
                type="email"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                placeholder="backup@example.com"
                icon={<Mail className="w-4 h-4" />}
              />

              <div className="flex gap-3 mt-2">
                <GlassButton
                  type="button"
                  variant="secondary"
                  onClick={() => setStep("credentials")}
                  className="w-auto px-5 flex-shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </GlassButton>
                <GlassButton type="submit" loading={loading} className="flex-1">
                  {!loading && <>Create Account <ArrowRight className="w-4 h-4" /></>}
                </GlassButton>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </AuthLayout>
  );
};

export default Signup;
