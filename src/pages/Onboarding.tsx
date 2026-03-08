import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Ruler, Weight, Target, Dumbbell, UtensilsCrossed,
  ArrowRight, ArrowLeft, Activity, Sparkles, Check, Flame,
  Heart, Brain, Zap, ChevronRight
} from "lucide-react";

// ── Types ──
interface OnboardingData {
  name: string;
  age: string;
  sex: "male" | "female" | "";
  height: string;
  weight: string;
  goalWeight: string;
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

function calcTargetCalories(tdee: number, goal: string) {
  if (goal === "lose") return Math.round(tdee - 500);
  if (goal === "gain") return Math.round(tdee + 300);
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
        <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground">What's your name?</h2>
        <p className="text-muted-foreground font-body text-sm">Let's personalize your experience</p>
      </div>
      <input
        type="text"
        placeholder="Enter your name"
        value={data.name}
        onChange={(e) => update({ name: e.target.value })}
        className="w-full px-5 py-4 rounded-2xl bg-secondary border border-border text-foreground text-lg font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
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
        <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground">About you</h2>
        <p className="text-muted-foreground font-body text-sm">This helps us calculate your needs accurately</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground font-body mb-1.5 block">Age</label>
          <input
            type="number"
            placeholder="e.g. 25"
            value={data.age}
            onChange={(e) => update({ age: e.target.value })}
            className="w-full px-5 py-4 rounded-2xl bg-secondary border border-border text-foreground text-lg font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-body mb-2 block">Biological sex</label>
          <div className="grid grid-cols-2 gap-3">
            {([["male", "Male"], ["female", "Female"]] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => update({ sex: val })}
                className={`px-5 py-4 rounded-2xl font-body font-semibold text-sm transition-all border ${
                  data.sex === val
                    ? "bg-primary/15 border-primary/40 text-primary ring-1 ring-primary/20"
                    : "bg-secondary border-border text-foreground hover:bg-secondary/80"
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
        <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground">Your measurements</h2>
        <p className="text-muted-foreground font-body text-sm">We'll use this to calculate your daily needs</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground font-body mb-1.5 block">Height (cm)</label>
          <input
            type="number"
            placeholder="e.g. 175"
            value={data.height}
            onChange={(e) => update({ height: e.target.value })}
            className="w-full px-5 py-4 rounded-2xl bg-secondary border border-border text-foreground text-lg font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-body mb-1.5 block">Weight (kg)</label>
          <input
            type="number"
            placeholder="e.g. 70"
            value={data.weight}
            onChange={(e) => update({ weight: e.target.value })}
            className="w-full px-5 py-4 rounded-2xl bg-secondary border border-border text-foreground text-lg font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
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
        <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground">What's your goal?</h2>
        <p className="text-muted-foreground font-body text-sm">We'll customize your plan accordingly</p>
      </div>
      <div className="space-y-3">
        {goals.map((g) => (
          <button
            key={g.key}
            onClick={() => update({ goal: g.key })}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all text-left ${
              data.goal === g.key
                ? "bg-primary/10 border-primary/40 ring-1 ring-primary/20"
                : "bg-secondary border-border hover:bg-secondary/80"
            }`}
          >
            <div className={`w-12 h-12 rounded-xl bg-secondary flex items-center justify-center ${data.goal === g.key ? "bg-primary/15" : ""}`}>
              <g.icon className={`w-6 h-6 ${data.goal === g.key ? "text-primary" : g.color}`} />
            </div>
            <div>
              <p className="font-semibold text-foreground font-display text-sm">{g.label}</p>
              <p className="text-xs text-muted-foreground font-body">{g.desc}</p>
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
        <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground">Goal weight</h2>
        <p className="text-muted-foreground font-body text-sm">
          {data.goal === "maintain" ? "Your target to maintain" : data.goal === "lose" ? "What weight do you want to reach?" : "What's your target weight?"}
        </p>
      </div>
      <input
        type="number"
        placeholder="e.g. 65"
        value={data.goalWeight}
        onChange={(e) => update({ goalWeight: e.target.value })}
        className="w-full px-5 py-4 rounded-2xl bg-secondary border border-border text-foreground text-lg font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-center"
      />
      {data.weight && data.goalWeight && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground font-body">
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
        <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground">Activity level</h2>
        <p className="text-muted-foreground font-body text-sm">How active are you on a typical week?</p>
      </div>
      <div className="space-y-2">
        {levels.map((l) => (
          <button
            key={l.key}
            onClick={() => update({ activityLevel: l.key })}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all text-left ${
              data.activityLevel === l.key
                ? "bg-primary/10 border-primary/40 ring-1 ring-primary/20"
                : "bg-secondary border-border hover:bg-secondary/80"
            }`}
          >
            <span className="text-xl">{l.emoji}</span>
            <div className="flex-1">
              <p className="font-semibold text-foreground font-display text-sm">{l.label}</p>
              <p className="text-[11px] text-muted-foreground font-body">{l.desc}</p>
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
        <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground">Eating habits</h2>
        <p className="text-muted-foreground font-body text-sm">How would you describe your current diet?</p>
      </div>
      <div className="space-y-2">
        {habits.map((h) => (
          <button
            key={h.key}
            onClick={() => update({ eatingHabit: h.key })}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all text-left ${
              data.eatingHabit === h.key
                ? "bg-primary/10 border-primary/40 ring-1 ring-primary/20"
                : "bg-secondary border-border hover:bg-secondary/80"
            }`}
          >
            <span className="text-xl">{h.emoji}</span>
            <div className="flex-1">
              <p className="font-semibold text-foreground font-display text-sm">{h.label}</p>
              <p className="text-[11px] text-muted-foreground font-body">{h.desc}</p>
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
        <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground">Exercise frequency</h2>
        <p className="text-muted-foreground font-body text-sm">How often do you work out?</p>
      </div>
      <div className="space-y-2">
        {freqs.map((f) => (
          <button
            key={f.key}
            onClick={() => update({ exerciseFrequency: f.key })}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all text-left ${
              data.exerciseFrequency === f.key
                ? "bg-primary/10 border-primary/40 ring-1 ring-primary/20"
                : "bg-secondary border-border hover:bg-secondary/80"
            }`}
          >
            <span className="text-xl">{f.emoji}</span>
            <div className="flex-1">
              <p className="font-semibold text-foreground font-display text-sm">{f.label}</p>
              <p className="text-[11px] text-muted-foreground font-body">{f.desc}</p>
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
  const targetCal = calcTargetCalories(tdee, goal);
  const macros = calcMacros(targetCal, goal, sex);
  const weeks = weeksToGoal(w, gw, goal);

  const deficit = goal === "lose" ? tdee - targetCal : goal === "gain" ? targetCal - tdee : 0;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground">
          Your plan is ready, <span className="text-gradient-primary">{data.name || "champ"}</span>!
        </h2>
        <p className="text-muted-foreground font-body text-sm">Here's your personalized daily target</p>
      </div>

      {/* Main calorie target */}
      <div className="glass-card-accent p-6 text-center space-y-2">
        <p className="text-xs text-muted-foreground font-body uppercase tracking-widest">Daily Calorie Target</p>
        <p className="text-5xl font-bold font-display text-gradient-primary">{targetCal}</p>
        <p className="text-sm text-muted-foreground font-body">kcal / day</p>
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
          { label: "Carbs", value: macros.carbs, unit: "g", color: "text-info" },
          { label: "Fat", value: macros.fat, unit: "g", color: "text-peach" },
          { label: "Fiber", value: macros.fiber, unit: "g", color: "text-success" },
        ].map((m) => (
          <div key={m.label} className="glass-card p-4 text-center">
            <p className={`text-2xl font-bold font-display ${m.color}`}>{m.value}{m.unit}</p>
            <p className="text-[10px] text-muted-foreground font-body mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Timeline */}
      {weeks > 0 && (
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground font-display">
              {w > gw ? `${(w - gw).toFixed(1)} kg to lose` : `${(gw - w).toFixed(1)} kg to gain`}
            </p>
            <p className="text-xs text-muted-foreground font-body">
              Estimated ~{weeks} weeks to reach {gw} kg
            </p>
          </div>
        </div>
      )}

      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-3 text-center">
          <p className="text-lg font-bold text-foreground font-display">{Math.round(bmr)}</p>
          <p className="text-[10px] text-muted-foreground font-body">BMR (kcal)</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-lg font-bold text-foreground font-display">{tdee}</p>
          <p className="text-[10px] text-muted-foreground font-body">TDEE (kcal)</p>
        </div>
      </div>
    </div>
  );
}

// ── Steps config ──
const TOTAL_STEPS = 9; // 0..7 = questions, 8 = results

function canContinue(step: number, data: OnboardingData): boolean {
  switch (step) {
    case 0: return data.name.trim().length > 0;
    case 1: return data.age !== "" && data.sex !== "";
    case 2: return data.height !== "" && data.weight !== "";
    case 3: return data.goal !== "";
    case 4: return data.goalWeight !== "";
    case 5: return data.activityLevel !== "";
    case 6: return data.eatingHabit !== "";
    case 7: return data.exerciseFrequency !== "";
    default: return true;
  }
}

// ── Main component ──
const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [data, setData] = useState<OnboardingData>(initialData);

  const update = (partial: Partial<OnboardingData>) => setData((prev) => ({ ...prev, ...partial }));

  const next = () => {
    if (step < TOTAL_STEPS - 1) {
      setDir(1);
      setStep(step + 1);
    }
  };
  const prev = () => {
    if (step > 0) {
      setDir(-1);
      setStep(step - 1);
    }
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
      case 5: return <StepActivity data={data} update={update} />;
      case 6: return <StepEating data={data} update={update} />;
      case 7: return <StepExercise data={data} update={update} />;
      case 8: return <StepResults data={data} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-20 left-1/4 w-[400px] h-[400px] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[300px] h-[300px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <span className="font-bold font-display text-gradient-primary text-sm">VitalFlow</span>
            </div>
            <span className="text-xs text-muted-foreground font-body">
              {step + 1} / {TOTAL_STEPS}
            </span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="glass-card p-6 md:p-8 min-h-[420px] flex flex-col">
          <div className="flex-1">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={step}
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/30">
            {step > 0 ? (
              <button
                onClick={prev}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div />
            )}

            {isResults ? (
              <button
                onClick={() => {
                  localStorage.setItem("vitalflow_onboarding", JSON.stringify(data));

                  // Auto-generate goals from onboarding data
                  const goals: any[] = [];
                  const now = new Date().toISOString();
                  const w = Number(data.weight) || 70;
                  const gw = Number(data.goalWeight) || w;
                  const sex = data.sex || "male";
                  const goal = data.goal || "maintain";
                  const activity = data.activityLevel || "moderate";
                  const bmr = calcBMR(sex, w, Number(data.height) || 170, Number(data.age) || 25);
                  const tdee = calcTDEE(bmr, activity);
                  const targetCal = calcTargetCalories(tdee, goal);

                  // Weight goal
                  if (w !== gw) {
                    goals.push({
                      id: Date.now().toString(),
                      title: goal === "lose" ? `Lose ${(w - gw).toFixed(1)} kg` : `Gain ${(gw - w).toFixed(1)} kg`,
                      categories: ["weight"],
                      target: gw,
                      current: w,
                      unit: "kg",
                      direction: goal === "lose" ? "decrease" : goal === "gain" ? "increase" : "maintain",
                      deadline: "",
                      createdAt: now,
                    });
                  }

                  // Calorie target goal
                  goals.push({
                    id: (Date.now() + 1).toString(),
                    title: `Hit ${targetCal} kcal daily`,
                    categories: ["nutrition"],
                    target: targetCal,
                    current: 0,
                    unit: "kcal",
                    direction: "maintain",
                    deadline: "",
                    createdAt: now,
                  });

                  // Water goal
                  const waterTarget = Math.round(w * 0.033 * 10) / 10;
                  goals.push({
                    id: (Date.now() + 2).toString(),
                    title: `Drink ${waterTarget}L water daily`,
                    categories: ["water"],
                    target: waterTarget,
                    current: 0,
                    unit: "L",
                    direction: "increase",
                    deadline: "",
                    createdAt: now,
                  });

                  // Steps goal
                  const stepsTarget = activity === "sedentary" ? 6000 : activity === "light" ? 8000 : 10000;
                  goals.push({
                    id: (Date.now() + 3).toString(),
                    title: `Walk ${stepsTarget.toLocaleString()} steps daily`,
                    categories: ["steps"],
                    target: stepsTarget,
                    current: 0,
                    unit: "steps",
                    direction: "increase",
                    deadline: "",
                    createdAt: now,
                  });

                  // Only save if no existing goals (don't overwrite)
                  const existing = localStorage.getItem("vitalflow_goals");
                  if (!existing || JSON.parse(existing).length === 0) {
                    localStorage.setItem("vitalflow_goals", JSON.stringify(goals));
                  }

                  navigate("/dashboard");
                }}
                className="group px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 transition-all active:scale-95 flex items-center gap-2 glow-primary"
              >
                Let's Train Now
                <Dumbbell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </button>
            ) : (
              <button
                onClick={next}
                disabled={!canContinue(step, data)}
                className="group px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:brightness-100"
              >
                Continue
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
