import { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, ArrowRight, ArrowLeft, Zap, User, Mail, Phone, Camera } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type Step = "credentials" | "profile";

const Signup = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>("credentials");
  const [loading, setLoading] = useState(false);

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
    if (!password) return toast.error("Password is required");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirmPassword) return toast.error("Passwords don't match");
    setStep("profile");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return toast.error("Name is required");

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
      setLoading(false);
      return toast.error(authError.message);
    }

    const userId = authData.user?.id;
    if (!userId) {
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

    setLoading(false);

    if (profileError) {
      console.error("Profile update error:", profileError);
      toast.error("Account created but profile update failed. You can update it later.");
    } else {
      toast.success("Account created! 🎉");
    }

    navigate("/onboarding");
  };

  const fadeVariants = {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-accent/10 blur-3xl" />

      <motion.div
        className="w-full max-w-md space-y-8"
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
            <span className="text-xl font-bold font-display text-foreground">Cals Crumble Fit</span>
          </Link>
          <h1 className="text-3xl font-bold font-display text-foreground">
            {step === "credentials" ? "Create account" : "Your profile"}
          </h1>
          <p className="text-muted-foreground font-body mt-2">
            {step === "credentials" ? "Step 1 of 2 — Set up your credentials" : "Step 2 of 2 — Tell us about yourself"}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-2">
          <div className={`h-1 flex-1 rounded-full ${step === "credentials" ? "bg-primary" : "bg-primary"}`} />
          <div className={`h-1 flex-1 rounded-full ${step === "profile" ? "bg-primary" : "bg-secondary"}`} />
        </div>

        {step === "credentials" ? (
          <motion.form
            key="credentials"
            onSubmit={handleCredentials}
            className="space-y-4"
            variants={fadeVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground font-body">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="w-full bg-secondary rounded-xl pl-10 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground font-body">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-secondary rounded-xl pl-10 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground font-body">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-secondary rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body focus:ring-2 focus:ring-primary/50 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground font-body">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full bg-secondary rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <motion.button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold font-display flex items-center justify-center gap-2 glow-primary"
              whileTap={{ scale: 0.98 }}
            >
              Continue <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.form>
        ) : (
          <motion.form
            key="profile"
            onSubmit={handleSignup}
            className="space-y-4"
            variants={fadeVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.3 }}
          >
            {/* Avatar upload */}
            <div className="flex justify-center">
              <label className="relative cursor-pointer group">
                <div className="w-24 h-24 rounded-2xl bg-secondary flex items-center justify-center overflow-hidden border-2 border-dashed border-border group-hover:border-primary transition-colors">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <Camera className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                      <span className="text-[10px] text-muted-foreground font-body">Add photo</span>
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <Camera className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground font-body">Full Name *</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-secondary rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground font-body">
                Phone Number <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-secondary rounded-xl pl-10 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground font-body">
                Recovery Email <span className="text-muted-foreground text-xs">(optional, for account recovery)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="backup@example.com"
                  className="w-full bg-secondary rounded-xl pl-10 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("credentials")}
                className="px-4 py-3.5 rounded-xl bg-secondary text-foreground font-medium font-body flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <motion.button
                type="submit"
                disabled={loading}
                className="flex-1 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold font-display flex items-center justify-center gap-2 glow-primary disabled:opacity-50"
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>Create Account <ArrowRight className="w-4 h-4" /></>
                )}
              </motion.button>
            </div>
          </motion.form>
        )}

        <p className="text-center text-sm text-muted-foreground font-body">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;
