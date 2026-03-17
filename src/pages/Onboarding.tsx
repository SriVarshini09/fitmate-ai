import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Ruler, Weight, Target, Dumbbell, UtensilsCrossed,
  ArrowRight, ArrowLeft, Activity, Sparkles, Check, Flame,
  Heart, Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// ── Types ──
interface OnboardingData {
  name: string;
  age: string;
  sex: "male" | "female" | "";
  height: string;
  weight: string;
  goalWeight: string;
  timelineMonths: string;
  goal: string;
  activityLevel: string;
  eatingHabit: string;
  exerciseFrequency: string;
}

const initialData: OnboardingData = {
  name: "",
  age: "",
  sex: "",
  height: "",
  weight: "",
  goalWeight: "",
  timelineMonths: "",
  goal: "",
  activityLevel: "",
  eatingHabit: "",
  exerciseFrequency: "",
};

// ── Calculation helpers ──
function calcBMR(sex: string, weight: number, height: number, age: number) {
  if (sex === "female") return 10 * weight + 6.25 * height - 5 * age - 161;
  return 10 * weight + 6.25 * height - 5 * age + 5;
}

const activityMultipliers: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

function calcTDEE(bmr: number, activity: string) {
  return Math.round(bmr * (activityMultipliers[activity] || 1.55));
}

function calcTargetCalories(tdee: number, goal: string, currentWeight: number, goalWeight: number, timelineMonths: number) {
  if (goal === "maintain") return tdee;
  
  const weightDiff = Math.abs(currentWeight - goalWeight);
  const totalDays = timelineMonths * 30;
  const dailyWeightChange = weightDiff / totalDays;
  
  // 1 kg fat = ~7700 kcal, so daily deficit/surplus needed
  const dailyCalorieChange = Math.round(dailyWeightChange * 7700);
  
  if (goal === "lose") {
    const deficit = Math.min(dailyCalorieChange, 1000); // Max 1000 kcal deficit for safety
    return Math.max(Math.round(tdee - deficit), 1200); // Minimum 1200 kcal
  }
  
  if (goal === "gain") {
    const surplus = Math.min(dailyCalorieChange, 500); // Max 500 kcal surplus
    return Math.round(tdee + surplus);
  }
  
  return tdee;
}

function calcFiber(calories: number, sex: string) {
  const byCalorie = Math.round((calories / 1000) * 14);
  const minimum = sex === "female" ? 25 : 38;
  return Math.max(byCalorie, minimum);
}

function calcMacros(calories: number, goal: string, sex: string = "male") {
  const fiber = calcFiber(calories, sex);
  if (goal === "lose") {
    const protein = Math.round((calories * 0.35) / 4);
    const fat = Math.round((calories * 0.3) / 9);
    const carbs = Math.round((calories * 0.35) / 4);
    return { protein, fat, carbs, fiber };
  }
  if (goal === "gain") {
    const protein = Math.round((calories * 0.3) / 4);
    const fat = Math.round((calories * 0.25) / 9);
    const carbs = Math.round((calories * 0.45) / 4);
    return { protein, fat, carbs, fiber };
  }
  const protein = Math.round((calories * 0.25) / 4);
  const fat = Math.round((calories * 0.3) / 9);
  const carbs = Math.round((calories * 0.45) / 4);
  return { protein, fat, carbs, fiber };
}

function weeksToGoal(currentWeight: number, goalWeight: number, goal: string) {
  const diff = Math.abs(currentWeight - goalWeight);
  const ratePerWeek = goal === "lose" ? 0.5 : goal === "gain" ? 0.3 : 0;
  if (ratePerWeek === 0) return 0;
  return Math.ceil(diff / ratePerWeek);
}

// ── Step components ──
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

// Step 1: Name
function StepName({ data, update }: { data: OnboardingData; update: (d: Partial<OnboardingData>) => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold font-display text-white">What's your name?</h2>
        <p className="text-white/45 font-body text-sm">Let's personalize your experience</p>
      </div>
      <input
        type="text"
        placeholder="Enter your name"
        value={data.name}
        onChange={(e) => update({ name: e.target.value })}
        className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-lg font-body placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
        autoFocus
      />
    </div>
  );
}

// Step 2: Age & Sex
function StepAgeSex({ data, update }: { data: OnboardingData; update: (d: Partial<OnboardingData>) => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold font-display text-white">About you</h2>
        <p className="text-white/45 font-body text-sm">This helps us calculate your needs accurately</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-white/40 font-body mb-1.5 block">Age</label>
          <input
            type="number"
            placeholder="e.g. 25"
            value={data.age}
            onChange={(e) => update({ age: e.target.value })}
            className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-lg font-body placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
          />
        </div>
        <div>
          <label className="text-xs text-white/40 font-body mb-2 block">Biological sex</label>
          <div className="grid grid-cols-2 gap-3">
            {([["male", "Male"], ["female", "Female"]] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => update({ sex: val })}
                className={`px-5 py-4 rounded-2xl font-body font-semibold text-sm transition-all border ${
                  data.sex === val
                    ? "bg-primary/15 border-primary/50 text-primary ring-1 ring-primary/20"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/8 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 3: Height & Weight
function StepBody({ data, update }: { data: OnboardingData; update: (d: Partial<OnboardingData>) => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
          <Ruler className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold font-display text-white">Your measurements</h2>
        <p className="text-white/45 font-body text-sm">We'll use this to calculate your daily needs</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-white/40 font-body mb-1.5 block">Height (cm)</label>
          <input
            type="number"
            placeholder="e.g. 175"
            value={data.height}
            onChange={(e) => update({ height: e.target.value })}
            className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-lg font-body placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
          />
        </div>
        <div>
          <label className="text-xs text-white/40 font-body mb-1.5 block">Weight (kg)</label>
          <input
            type="number"
            placeholder="e.g. 70"
            value={data.weight}
            onChange={(e) => update({ weight: e.target.value })}
            className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-lg font-body placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
          />
        </div>
      </div>
    </div>
  );
}

// Step 4: Goal
function StepGoal({ data, update }: { data: OnboardingData; update: (d: Partial<OnboardingData>) => void }) {
  const goals = [
    { key: "lose", label: "Lose Weight", desc: "Burn fat and get lean", icon: Flame, color: "text-orange-400" },
    { key: "maintain", label: "Maintain", desc: "Stay at my current weight", icon: Target, color: "text-primary" },
    { key: "gain", label: "Build Muscle", desc: "Gain muscle and strength", icon: Dumbbell, color: "text-sky-400" },
  ];
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold font-display text-white">What's your goal?</h2>
        <p className="text-white/45 font-body text-sm">We'll customize your plan accordingly</p>
      </div>
      <div className="space-y-3">
        {goals.map((g) => (
          <button
            key={g.key}
            onClick={() => update({ goal: g.key })}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all text-left ${
              data.goal === g.key
                ? "bg-primary/10 border-primary/50 ring-1 ring-primary/20"
                : "bg-white/5 border-white/10 hover:bg-white/8"
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${data.goal === g.key ? "bg-primary/15" : "bg-white/5"}`}>
              <g.icon className={`w-6 h-6 ${data.goal === g.key ? "text-primary" : g.color}`} />
            </div>
            <div>
              <p className={`font-semibold font-display text-sm ${data.goal === g.key ? "text-white" : "text-white/70"}`}>{g.label}</p>
              <p className="text-xs text-white/40 font-body">{g.desc}</p>
            </div>
            {data.goal === g.key && <Check className="w-5 h-5 text-primary ml-auto" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// Step 5: Goal Weight
function StepGoalWeight({ data, update }: { data: OnboardingData; update: (d: Partial<OnboardingData>) => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
          <Weight className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold font-display text-white">Goal weight</h2>
        <p className="text-white/45 font-body text-sm">
          {data.goal === "maintain" ? "Your target to maintain" : data.goal === "lose" ? "What weight do you want to reach?" : "What's your target weight?"}
        </p>
      </div>
      <input
        type="number"
        placeholder="e.g. 65"
        value={data.goalWeight}
        onChange={(e) => update({ goalWeight: e.target.value })}
        className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-lg font-body placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all text-center"
      />
      {data.weight && data.goalWeight && (
        <div className="text-center">
          <p className="text-xs text-white/40 font-body">
            {Number(data.goalWeight) < Number(data.weight)
              ? `You'll need to lose ${(Number(data.weight) - Number(data.goalWeight)).toFixed(1)} kg`
              : Number(data.goalWeight) > Number(data.weight)
              ? `You'll need to gain ${(Number(data.goalWeight) - Number(data.weight)).toFixed(1)} kg`
              : "You're already at your goal weight! 🎉"}
          </p>
        </div>
      )}
    </div>
  );
}

// Step 5.5: Timeline
function StepTimeline({ data, update }: { data: OnboardingData; update: (d: Partial<OnboardingData>) => void }) {
  const weightDiff = Math.abs(Number(data.weight) - Number(data.goalWeight));
  const recommendedMonths = data.goal === "lose" 
    ? Math.ceil(weightDiff / 2) // ~0.5kg/week = 2kg/month
    : Math.ceil(weightDiff / 1.2); // ~0.3kg/week for muscle gain
  
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold font-display text-white">Timeline</h2>
        <p className="text-white/45 font-body text-sm">
          In how many months do you want to reach {data.goalWeight}kg?
        </p>
      </div>
      <input
        type="number"
        placeholder="e.g. 3"
        value={data.timelineMonths}
        onChange={(e) => update({ timelineMonths: e.target.value })}
        className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-lg font-body placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all text-center"
      />
      <div className="rounded-2xl p-4 space-y-2" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
        <p className="text-xs font-semibold text-primary font-display">💡 Recommended: {recommendedMonths} months</p>
        <p className="text-xs text-white/40 font-body">
          {data.goal === "lose" 
            ? "Safe weight loss is 0.5-1kg per week. Too fast can be unhealthy!"
            : "Healthy muscle gain is 0.25-0.5kg per week with proper training."}
        </p>
      </div>
    </div>
  );
}

// Step 6: Activity & Exercise
function StepActivity({ data, update }: { data: OnboardingData; update: (d: Partial<OnboardingData>) => void }) {
  const levels = [
    { key: "sedentary", label: "Sedentary", desc: "Desk job, little to no exercise", emoji: "🪑" },
    { key: "light", label: "Lightly Active", desc: "Light exercise 1-3 days/week", emoji: "🚶" },
    { key: "moderate", label: "Moderately Active", desc: "Exercise 3-5 days/week", emoji: "🏃" },
    { key: "active", label: "Very Active", desc: "Hard exercise 6-7 days/week", emoji: "💪" },
    { key: "very_active", label: "Athlete", desc: "Intense training twice a day", emoji: "🏋️" },
  ];
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
          <Dumbbell className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold font-display text-white">Activity level</h2>
        <p className="text-white/45 font-body text-sm">How active are you on a typical week?</p>
      </div>
      <div className="space-y-2">
        {levels.map((l) => (
          <button
            key={l.key}
            onClick={() => update({ activityLevel: l.key })}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all text-left ${
              data.activityLevel === l.key
                ? "bg-primary/10 border-primary/50 ring-1 ring-primary/20"
                : "bg-white/5 border-white/10 hover:bg-white/8"
            }`}
          >
            <span className="text-xl">{l.emoji}</span>
            <div className="flex-1">
              <p className={`font-semibold font-display text-sm ${data.activityLevel === l.key ? "text-white" : "text-white/70"}`}>{l.label}</p>
              <p className="text-[11px] text-white/35 font-body">{l.desc}</p>
            </div>
            {data.activityLevel === l.key && <Check className="w-4 h-4 text-primary" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// Step 7: Eating habits
function StepEating({ data, update }: { data: OnboardingData; update: (d: Partial<OnboardingData>) => void }) {
  const habits = [
    { key: "clean", label: "Clean Eater", desc: "Mostly whole foods, home-cooked meals", emoji: "🥗" },
    { key: "mixed", label: "Mixed Diet", desc: "Some home cooking, some eating out", emoji: "🍽️" },
    { key: "frequent_out", label: "Frequent Dining Out", desc: "Mostly restaurants and takeout", emoji: "🍔" },
    { key: "snacker", label: "Snacker", desc: "I snack a lot throughout the day", emoji: "🍿" },
  ];
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
          <UtensilsCrossed className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold font-display text-white">Eating habits</h2>
        <p className="text-white/45 font-body text-sm">How would you describe your current diet?</p>
      </div>
      <div className="space-y-2">
        {habits.map((h) => (
          <button
            key={h.key}
            onClick={() => update({ eatingHabit: h.key })}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all text-left ${
              data.eatingHabit === h.key
                ? "bg-primary/10 border-primary/50 ring-1 ring-primary/20"
                : "bg-white/5 border-white/10 hover:bg-white/8"
            }`}
          >
            <span className="text-xl">{h.emoji}</span>
            <div className="flex-1">
              <p className={`font-semibold font-display text-sm ${data.eatingHabit === h.key ? "text-white" : "text-white/70"}`}>{h.label}</p>
              <p className="text-[11px] text-white/35 font-body">{h.desc}</p>
            </div>
            {data.eatingHabit === h.key && <Check className="w-4 h-4 text-primary" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// Step 8: Exercise frequency
function StepExercise({ data, update }: { data: OnboardingData; update: (d: Partial<OnboardingData>) => void }) {
  const freqs = [
    { key: "never", label: "Never", desc: "I don't exercise currently", emoji: "😴" },
    { key: "1-2", label: "1-2 times/week", desc: "Just getting started", emoji: "🌱" },
    { key: "3-4", label: "3-4 times/week", desc: "Consistent routine", emoji: "⚡" },
    { key: "5-6", label: "5-6 times/week", desc: "Dedicated athlete", emoji: "🔥" },
    { key: "daily", label: "Every day", desc: "Can't skip a day", emoji: "🏆" },
  ];
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold font-display text-white">Exercise frequency</h2>
        <p className="text-white/45 font-body text-sm">How often do you work out?</p>
      </div>
      <div className="space-y-2">
        {freqs.map((f) => (
          <button
            key={f.key}
            onClick={() => update({ exerciseFrequency: f.key })}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all text-left ${
              data.exerciseFrequency === f.key
                ? "bg-primary/10 border-primary/50 ring-1 ring-primary/20"
                : "bg-white/5 border-white/10 hover:bg-white/8"
            }`}
          >
            <span className="text-xl">{f.emoji}</span>
            <div className="flex-1">
              <p className={`font-semibold font-display text-sm ${data.exerciseFrequency === f.key ? "text-white" : "text-white/70"}`}>{f.label}</p>
              <p className="text-[11px] text-white/35 font-body">{f.desc}</p>
            </div>
            {data.exerciseFrequency === f.key && <Check className="w-4 h-4 text-primary" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Results step ──
function StepResults({ data }: { data: OnboardingData }) {
  const w = Number(data.weight) || 70;
  const h = Number(data.height) || 170;
  const a = Number(data.age) || 25;
  const gw = Number(data.goalWeight) || w;
  const sex = data.sex || "male";
  const goal = data.goal || "maintain";
  const activity = data.activityLevel || "moderate";

  const bmr = calcBMR(sex, w, h, a);
  const tdee = calcTDEE(bmr, activity);
  const timelineMonths = Number(data.timelineMonths) || 3;
  const targetCal = calcTargetCalories(tdee, goal, w, gw, timelineMonths);
  const macros = calcMacros(targetCal, goal, sex);
  const weeks = weeksToGoal(w, gw, goal);

  const deficit = goal === "lose" ? tdee - targetCal : goal === "gain" ? targetCal - tdee : 0;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold font-display text-white">
          Your plan is ready, <span className="text-gradient-primary">{data.name || "champ"}</span>!
        </h2>
        <p className="text-white/45 font-body text-sm">Here's your personalized daily target</p>
      </div>

      {/* Main calorie target */}
      <div className="rounded-2xl p-6 text-center space-y-2" style={{background:'rgba(130,200,80,0.08)',border:'1px solid rgba(130,200,80,0.2)'}}>
        <p className="text-xs text-white/40 font-body uppercase tracking-widest">Daily Calorie Target</p>
        <p className="text-5xl font-bold font-display text-gradient-primary">{targetCal}</p>
        <p className="text-sm text-white/40 font-body">kcal / day</p>
        {deficit > 0 && (
          <p className="text-xs text-primary font-body mt-1">
            {goal === "lose" ? `${deficit} kcal deficit from your TDEE of ${tdee}` : `${deficit} kcal surplus from your TDEE of ${tdee}`}
          </p>
        )}
      </div>
      {/* Macros */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Protein", value: macros.protein, unit: "g", color: "text-primary" },
          { label: "Carbs", value: macros.carbs, unit: "g", color: "text-blue-400" },
          { label: "Fat", value: macros.fat, unit: "g", color: "text-orange-400" },
          { label: "Fiber", value: macros.fiber, unit: "g", color: "text-green-400" },
        ].map((m) => (
          <div key={m.label} className="rounded-2xl p-4 text-center" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
            <p className={`text-2xl font-bold font-display ${m.color}`}>{m.value}{m.unit}</p>
            <p className="text-[10px] text-white/40 font-body mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Timeline */}
      {weeks > 0 && (
        <div className="rounded-2xl p-4 flex items-center gap-4" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white font-display">
              {w > gw ? `${(w - gw).toFixed(1)} kg to lose` : `${(gw - w).toFixed(1)} kg to gain`}
            </p>
            <p className="text-xs text-white/40 font-body">
              Estimated ~{weeks} weeks to reach {gw} kg
            </p>
          </div>
        </div>
      )}

      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-3 text-center" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
          <p className="text-lg font-bold text-white font-display">{Math.round(bmr)}</p>
          <p className="text-[10px] text-white/40 font-body">BMR (kcal)</p>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
          <p className="text-lg font-bold text-white font-display">{tdee}</p>
          <p className="text-[10px] text-white/40 font-body">TDEE (kcal)</p>
        </div>
      </div>
    </div>
  );
}

// ── Steps config ──
const TOTAL_STEPS = 10;
const SESSION_KEY = "vf_onboarding_progress";

function canContinue(step: number, data: OnboardingData): boolean {
  switch (step) {
    case 0: return data.name.trim().length > 0;
    case 1: return data.age !== "" && data.sex !== "";
    case 2: return data.height !== "" && data.weight !== "";
    case 3: return data.goal !== "";
    case 4: return data.goalWeight !== "";
    case 5: return data.timelineMonths !== "" && Number(data.timelineMonths) > 0;
    case 6: return data.activityLevel !== "";
    case 7: return data.eatingHabit !== "";
    case 8: return data.exerciseFrequency !== "";
    default: return true;
  }
}

function loadSavedProgress(): { step: number; data: OnboardingData } {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { step: 0, data: initialData };
}

// ── Main component ──
const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const saved = loadSavedProgress();
  const [step, setStep] = useState(saved.step);
  const [dir, setDir] = useState(1);
  const [data, setData] = useState<OnboardingData>(saved.data);
  const [saving, setSaving] = useState(false);

  const update = useCallback((partial: Partial<OnboardingData>) => {
    setData((prev) => {
      const next = { ...prev, ...partial };
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ step, data: next })); } catch { /* ignore */ }
      return next;
    });
  }, [step]);

  const next = () => {
    const nextStep = Math.min(step + 1, TOTAL_STEPS - 1);
    setDir(1);
    setStep(nextStep);
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ step: nextStep, data })); } catch { /* ignore */ }
  };

  const prev = () => {
    const prevStep = Math.max(step - 1, 0);
    setDir(-1);
    setStep(prevStep);
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ step: prevStep, data })); } catch { /* ignore */ }
  };

  const handleLaunch = async () => {
    setSaving(true);
    const w = Number(data.weight) || 70;
    const gw = Number(data.goalWeight) || w;
    const h = Number(data.height) || 170;
    const a = Number(data.age) || 25;
    const sex = data.sex || "male";
    const goal = data.goal || "maintain";
    const activity = data.activityLevel || "moderate";
    const timelineMonths = Number(data.timelineMonths) || 3;
    const bmr = calcBMR(sex, w, h, a);
    const tdee = calcTDEE(bmr, activity);
    const targetCal = calcTargetCalories(tdee, goal, w, gw, timelineMonths);
    const macros = calcMacros(targetCal, goal, sex);
    const stepsGoal = activity === "sedentary" ? 6000 : activity === "light" ? 8000 : 10000;
    const waterGoal = Math.round(w * 0.033 * 10) / 10;

    const fitnessProfile = {
      ...data,
      bmr: Math.round(bmr),
      tdee,
      targetCalories: targetCal,
      macros,
      stepsGoal,
      waterGoal,
      onboardingComplete: true,
    };

    // 1. Save to localStorage (cache for fast reads)
    localStorage.setItem("Cals Crumble Fit_onboarding", JSON.stringify(fitnessProfile));

    // 2. Auto-generate initial goals
    const now = new Date().toISOString();
    const goals: any[] = [];
    if (w !== gw) {
      goals.push({
        id: Date.now().toString(),
        title: goal === "lose" ? `Lose ${(w - gw).toFixed(1)} kg` : `Gain ${(gw - w).toFixed(1)} kg`,
        categories: ["weight"], target: gw, current: w, unit: "kg",
        direction: goal === "lose" ? "decrease" : "increase", deadline: "", createdAt: now,
      });
    }
    goals.push({
      id: (Date.now() + 1).toString(), title: `Hit ${targetCal} kcal daily`,
      categories: ["nutrition"], target: targetCal, current: 0, unit: "kcal",
      direction: "maintain", deadline: "", createdAt: now,
    });
    goals.push({
      id: (Date.now() + 2).toString(), title: `Drink ${waterGoal}L water daily`,
      categories: ["water"], target: waterGoal, current: 0, unit: "L",
      direction: "increase", deadline: "", createdAt: now,
    });
    goals.push({
      id: (Date.now() + 3).toString(), title: `Walk ${stepsGoal.toLocaleString()} steps daily`,
      categories: ["steps"], target: stepsGoal, current: 0, unit: "steps",
      direction: "increase", deadline: "", createdAt: now,
    });
    const existing = localStorage.getItem("Cals Crumble Fit_goals");
    if (!existing || JSON.parse(existing).length === 0) {
      localStorage.setItem("Cals Crumble Fit_goals", JSON.stringify(goals));
    }

    // 3. Sync to Supabase user_metadata (no schema change needed)
    if (user) {
      try {
        await supabase.auth.updateUser({ data: fitnessProfile });
        await supabase.from("profiles").update({ display_name: data.name || undefined })
          .eq("user_id", user.id);
      } catch { /* non-blocking — data is already in localStorage */ }
    }

    // 4. Clear sessionStorage draft
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }

    setSaving(false);
    toast.success(`Welcome to VitalFlow, ${data.name || "champ"}! 🎉`);
    navigate("/dashboard");
  };

  const isResults = step === TOTAL_STEPS - 1;
  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  const renderStep = () => {
    switch (step) {
      case 0: return <StepName data={data} update={update} />;
      case 1: return <StepAgeSex data={data} update={update} />;
      case 2: return <StepBody data={data} update={update} />;
      case 3: return <StepGoal data={data} update={update} />;
      case 4: return <StepGoalWeight data={data} update={update} />;
      case 5: return <StepTimeline data={data} update={update} />;
      case 6: return <StepActivity data={data} update={update} />;
      case 7: return <StepEating data={data} update={update} />;
      case 8: return <StepExercise data={data} update={update} />;
      case 9: return <StepResults data={data} />;
      default: return null;
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%, hsl(82 60% 15% / 0.35), transparent), #0a0a0f" }}
    >
      <div className="absolute top-20 left-1/4 w-[400px] h-[400px] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[300px] h-[300px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Activity className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold font-display text-white text-sm">VitalFlow</span>
            </div>
            <span className="text-xs text-white/30 font-body tabular-nums">
              {step + 1} / {TOTAL_STEPS}
            </span>
          </div>
          <div className="h-1 bg-white/8 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-6 md:p-8 min-h-[460px] flex flex-col"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(24px)" }}
        >
          <div className="flex-1">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={step}
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-white/8">
            {step > 0 ? (
              <button
                onClick={prev}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/70 transition-colors font-body disabled:opacity-30"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}

            {isResults ? (
              <motion.button
                onClick={handleLaunch}
                disabled={saving}
                className="group px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-60 disabled:cursor-not-allowed"
                whileTap={{ scale: saving ? 1 : 0.97 }}
              >
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Saving...</>
                ) : (
                  <>Let's Train Now <Dumbbell className="w-4 h-4 group-hover:rotate-12 transition-transform" /></>
                )}
              </motion.button>
            ) : (
              <motion.button
                onClick={next}
                disabled={!canContinue(step, data)}
                className="group px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
                whileTap={{ scale: canContinue(step, data) ? 0.97 : 1 }}
              >
                Continue <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
