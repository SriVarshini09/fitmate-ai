import { useState } from "react";
import { motion } from "framer-motion";
import { User, Save, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCalorieTracker } from "@/hooks/useCalorieTracker";

const ONBOARDING_KEY = "Cals Crumble Fit_onboarding";

function loadOnboarding() {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

const ACTIVITY_OPTIONS = [
  { key: "sedentary", label: "Sedentary", desc: "Desk job, little/no exercise" },
  { key: "light", label: "Light", desc: "Exercise 1-3x/week" },
  { key: "moderate", label: "Moderate", desc: "Exercise 3-5x/week" },
  { key: "active", label: "Active", desc: "Exercise 6-7x/week" },
  { key: "very_active", label: "Very Active", desc: "Intense daily exercise" },
];

const GOAL_OPTIONS = [
  { key: "lose", label: "Lose Weight", emoji: "📉" },
  { key: "maintain", label: "Maintain", emoji: "⚖️" },
  { key: "gain", label: "Gain Muscle", emoji: "💪" },
];

const EditProfile = () => {
  const navigate = useNavigate();
  const { profile } = useCalorieTracker();
  const saved = loadOnboarding();

  const [form, setForm] = useState({
    name: saved.name || profile?.name || "",
    sex: saved.sex || profile?.sex || "male",
    age: saved.age || String(profile?.age || ""),
    weight: saved.weight || String(profile?.weight || ""),
    height: saved.height || String(profile?.height || ""),
    goalWeight: saved.goalWeight || String(profile?.goalWeight || ""),
    activityLevel: saved.activityLevel || profile?.activityLevel || "moderate",
    goal: saved.goal || profile?.goal || "maintain",
    timelineMonths: saved.timelineMonths || "3",
    stepsGoal: saved.stepsGoal || "10000",
  });

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const save = () => {
    if (!form.name || !form.age || !form.weight || !form.height) {
      toast.error("Please fill in all required fields");
      return;
    }
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(form));
    toast.success("Profile updated! 🎉");
    // Force useCalorieTracker to reread by triggering storage event
    window.dispatchEvent(new StorageEvent("storage", { key: ONBOARDING_KEY }));
    navigate("/dashboard");
  };

  return (
    <motion.div
      className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-28"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold font-display text-foreground">Edit Profile</h1>
          <p className="text-xs text-muted-foreground font-body">Update your fitness data</p>
        </div>
      </div>

      {/* Name & Sex */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <User className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold font-display text-foreground">Personal</h3>
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-body mb-1.5 block">Name *</label>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Your name"
            className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-body mb-1.5 block">Sex</label>
          <div className="flex gap-2">
            {["male", "female"].map((s) => (
              <button
                key={s}
                onClick={() => set("sex", s)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium font-display capitalize transition-colors ${
                  form.sex === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {s === "male" ? "♂ Male" : "♀ Female"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground font-body mb-1.5 block">Age *</label>
            <input
              type="number"
              value={form.age}
              onChange={(e) => set("age", e.target.value)}
              placeholder="25"
              className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-body mb-1.5 block">Height (cm) *</label>
            <input
              type="number"
              value={form.height}
              onChange={(e) => set("height", e.target.value)}
              placeholder="170"
              className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground font-body mb-1.5 block">Weight (kg) *</label>
            <input
              type="number"
              value={form.weight}
              onChange={(e) => set("weight", e.target.value)}
              placeholder="70"
              className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-body mb-1.5 block">Goal Weight (kg)</label>
            <input
              type="number"
              value={form.goalWeight}
              onChange={(e) => set("goalWeight", e.target.value)}
              placeholder="65"
              className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body"
            />
          </div>
        </div>
      </div>

      {/* Goal */}
      <div className="glass-card p-5 space-y-3">
        <h3 className="text-sm font-semibold font-display text-foreground">Fitness Goal</h3>
        <div className="grid grid-cols-3 gap-2">
          {GOAL_OPTIONS.map((g) => (
            <button
              key={g.key}
              onClick={() => set("goal", g.key)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors ${
                form.goal === g.key ? "bg-primary/15 ring-1 ring-primary/40" : "bg-secondary"
              }`}
            >
              <span className="text-2xl">{g.emoji}</span>
              <span className={`text-xs font-medium font-display ${form.goal === g.key ? "text-primary" : "text-muted-foreground"}`}>
                {g.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Activity Level */}
      <div className="glass-card p-5 space-y-3">
        <h3 className="text-sm font-semibold font-display text-foreground">Activity Level</h3>
        <div className="space-y-2">
          {ACTIVITY_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => set("activityLevel", opt.key)}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors ${
                form.activityLevel === opt.key ? "bg-primary/15 ring-1 ring-primary/40" : "bg-secondary"
              }`}
            >
              <div>
                <p className={`text-sm font-medium font-display ${form.activityLevel === opt.key ? "text-primary" : "text-foreground"}`}>
                  {opt.label}
                </p>
                <p className="text-xs text-muted-foreground font-body">{opt.desc}</p>
              </div>
              {form.activityLevel === opt.key && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="glass-card p-5 space-y-3">
        <h3 className="text-sm font-semibold font-display text-foreground">Timeline to Goal</h3>
        <input
          type="number"
          value={form.timelineMonths}
          onChange={(e) => set("timelineMonths", e.target.value)}
          placeholder="3"
          className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body"
        />
        <p className="text-xs text-muted-foreground font-body">How many months to reach your goal weight?</p>
      </div>

      {/* Steps goal */}
      <div className="glass-card p-5 space-y-3">
        <h3 className="text-sm font-semibold font-display text-foreground">Daily Steps Goal</h3>
        <input
          type="number"
          value={form.stepsGoal}
          onChange={(e) => set("stepsGoal", e.target.value)}
          placeholder="10000"
          className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body"
        />
        <p className="text-xs text-muted-foreground font-body">Recommended: 7,000–10,000 steps/day</p>
      </div>

      {/* Save */}
      <button
        onClick={save}
        className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold font-display text-base flex items-center justify-center gap-2 glow-primary active:scale-95 transition-transform"
      >
        <Save className="w-5 h-5" />
        Save Profile
      </button>
    </motion.div>
  );
};

export default EditProfile;
