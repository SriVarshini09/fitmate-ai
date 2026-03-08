import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Activity, Brain, Dumbbell, Flame, Heart, LineChart, Apple,
  ArrowRight, CheckCircle2, Star, Zap, Shield, Users, Timer,
  ChevronRight, Sparkles
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const features = [
  { icon: Flame, title: "Calorie Tracking", desc: "AI-powered food logging with barcode scanning and photo recognition", color: "text-orange-400", bg: "bg-orange-400/10" },
  { icon: Dumbbell, title: "Workout Plans", desc: "Personalized training programs that adapt to your progress", color: "text-primary", bg: "bg-primary/10" },
  { icon: Brain, title: "AI Coach", desc: "24/7 intelligent coaching powered by advanced AI models", color: "text-purple-400", bg: "bg-purple-400/10" },
  { icon: Heart, title: "Health Metrics", desc: "Track heart rate, sleep, steps and body composition", color: "text-red-400", bg: "bg-red-400/10" },
  { icon: LineChart, title: "Smart Insights", desc: "Data-driven analytics that reveal patterns in your health", color: "text-sky-400", bg: "bg-sky-400/10" },
  { icon: Timer, title: "Fasting Timer", desc: "Intermittent fasting protocols with guided timer and tracking", color: "text-emerald-400", bg: "bg-emerald-400/10" },
];

const stats = [
  { value: "50K+", label: "Active Users" },
  { value: "2M+", label: "Workouts Logged" },
  { value: "98%", label: "Satisfaction" },
  { value: "4.9★", label: "App Rating" },
];

const testimonials = [
  { name: "Sarah K.", role: "Lost 30 lbs", text: "This app completely changed my relationship with fitness. The AI coach keeps me motivated every single day.", avatar: "SK" },
  { name: "Marcus T.", role: "Marathon Runner", text: "The insights feature helped me optimize my nutrition for race day. My times improved dramatically.", avatar: "MT" },
  { name: "Priya D.", role: "Yoga Instructor", text: "I recommend this to all my students. The holistic approach to health tracking is unmatched.", avatar: "PD" },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{
        background: "hsl(80 8% 8% / 0.8)",
        backdropFilter: "blur(24px) saturate(1.3)",
        borderBottom: "1px solid hsl(80 5% 20% / 0.4)",
      }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-display text-gradient-primary">Cals Crumble Fit</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Results</a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition-all active:scale-95"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-6">
        {/* Background orbs */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

        <motion.div
          className="max-w-6xl mx-auto text-center"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">AI-Powered Health & Fitness Platform</span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl lg:text-8xl font-bold font-display leading-[0.95] mb-6 tracking-tight">
            Your Body.{" "}
            <span className="text-gradient-primary">Your Data.</span>
            <br />
            Your Best Self.
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-body leading-relaxed">
            Track nutrition, crush workouts, and unlock insights with an AI coach that learns your body. The smarter way to reach your health goals.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate("/signup")}
              className="group px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base hover:brightness-110 transition-all active:scale-95 flex items-center gap-2 glow-primary"
            >
              Start Free Today
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-8 py-4 rounded-2xl bg-secondary text-foreground font-semibold text-base hover:bg-secondary/80 transition-all border border-border"
            >
              View Dashboard Demo
            </button>
          </motion.div>

          {/* Hero visual - phone mockup */}
          <motion.div
            variants={fadeUp}
            className="mt-16 md:mt-24 relative max-w-4xl mx-auto"
          >
            <div className="relative rounded-3xl overflow-hidden border border-border/50 shadow-2xl shadow-primary/5">
              <div className="bg-card p-2">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 py-3 bg-secondary/50 rounded-xl mb-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                    <div className="w-3 h-3 rounded-full bg-green-400/60" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-muted rounded-lg py-1.5 px-4 text-xs text-muted-foreground text-center font-mono">
                      Cals Crumble Fit.app/dashboard
                    </div>
                  </div>
                </div>
                {/* Dashboard preview grid */}
                <div className="grid grid-cols-3 gap-2 p-4">
                  {/* Calorie card */}
                  <div className="glass-card-accent p-4 flex flex-col items-center gap-3">
                    <div className="w-20 h-20 rounded-full border-4 border-primary/30 flex items-center justify-center">
                      <span className="text-xl font-bold text-primary font-display">1240</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">Calories</span>
                  </div>
                  {/* Macros card */}
                  <div className="glass-card p-4 space-y-3">
                    <span className="text-xs font-semibold text-foreground">Macros</span>
                    {["Protein", "Carbs", "Fat"].map((m, i) => (
                      <div key={m} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[9px] text-muted-foreground">{m}</span>
                          <span className="text-[9px] text-muted-foreground">{[65, 120, 35][i]}g</span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${[43, 48, 50][i]}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Steps card */}
                  <div className="glass-card p-4 flex flex-col items-center gap-2">
                    <Activity className="w-6 h-6 text-primary" />
                    <span className="text-2xl font-bold text-foreground font-display">6,842</span>
                    <span className="text-[10px] text-muted-foreground">Steps Today</span>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: "68%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Glow behind mockup */}
            <div className="absolute inset-0 -z-10 bg-primary/5 blur-3xl rounded-full scale-110" />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-16 px-6 border-y border-border/30">
        <motion.div
          className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {stats.map((s) => (
            <motion.div key={s.label} variants={fadeUp} className="text-center">
              <p className="text-3xl md:text-4xl font-bold font-display text-gradient-primary">{s.value}</p>
              <p className="text-sm text-muted-foreground font-body mt-1">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.p variants={fadeUp} className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Features</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold font-display">
              Everything you need to{" "}
              <span className="text-gradient-primary">transform</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground mt-4 max-w-lg mx-auto font-body">
              A complete suite of tools designed to help you build lasting healthy habits.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="glass-card p-6 group hover:scale-[1.02] transition-transform cursor-default"
              >
                <div className={`w-12 h-12 rounded-2xl ${f.bg} flex items-center justify-center mb-4`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-lg font-bold font-display text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 md:py-32 px-6 bg-secondary/20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.p variants={fadeUp} className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Testimonials</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold font-display">
              Loved by <span className="text-gradient-primary">thousands</span>
            </motion.h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-5"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
          >
            {testimonials.map((t) => (
              <motion.div key={t.name} variants={fadeUp} className="glass-card p-6">
                <div className="flex gap-1 mb-4">
                  {Array(5).fill(0).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-foreground font-body leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{t.avatar}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground font-display">{t.name}</p>
                    <p className="text-xs text-muted-foreground font-body">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-32 px-6">
        <motion.div
          className="max-w-3xl mx-auto text-center glass-card-accent p-12 md:p-16 relative overflow-hidden"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
        >
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/10 blur-[80px] pointer-events-none" />
          <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold font-display mb-4 relative z-10">
            Ready to <span className="text-gradient-primary">level up</span>?
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground font-body mb-8 relative z-10">
            Join thousands who transformed their health with Cals Crumble Fit. Start free, no credit card required.
          </motion.p>
          <motion.button
            variants={fadeUp}
            onClick={() => navigate("/signup")}
            className="group px-10 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base hover:brightness-110 transition-all active:scale-95 inline-flex items-center gap-2 glow-primary relative z-10"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold font-display text-foreground">Cals Crumble Fit</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground font-body">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Support</a>
          </div>
          <p className="text-xs text-muted-foreground font-body">© 2026 Cals Crumble Fit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
