import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Plus, X, Check, TrendingDown, TrendingUp, Minus,
  Trophy, ChevronDown, Calendar, Flame, Footprints, Droplets,
  Dumbbell, Star, Scale, Trash2, Pencil
} from "lucide-react";
import { toast } from "sonner";

interface Goal {
  id: string;
  title: string;
  categories: string[];
  target: number;
  current: number;
  unit: string;
  direction: "increase" | "decrease" | "maintain";
  deadline: string;
  createdAt: string;
}

const CATEGORIES = [
  { key: "weight", label: "Weight", icon: Scale, emoji: "⚖️" },
  { key: "nutrition", label: "Nutrition", icon: Flame, emoji: "🥗" },
  { key: "fitness", label: "Fitness", icon: Dumbbell, emoji: "💪" },
  { key: "steps", label: "Steps", icon: Footprints, emoji: "👟" },
  { key: "water", label: "Water", icon: Droplets, emoji: "💧" },
  { key: "custom", label: "Custom", icon: Star, emoji: "⭐" },
];

const GOALS_KEY = "vitalflow_goals";

function loadGoals(): Goal[] {
  try {
    const raw = localStorage.getItem(GOALS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveGoals(goals: Goal[]) {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

const Goals = () => {
  const [goals, setGoals] = useState<Goal[]>(loadGoals);
  const [showAdd, setShowAdd] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: "",
    categories: [] as string[],
    target: "",
    current: "",
    unit: "",
    direction: "decrease" as "decrease" | "increase" | "maintain",
    deadline: "",
  });

  const resetForm = () => {
    setNewGoal({ title: "", categories: [], target: "", current: "", unit: "", direction: "decrease", deadline: "" });
  };

  const addGoal = () => {
    if (!newGoal.title || !newGoal.target || newGoal.categories.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }
    const updated = [
      ...goals,
      {
        id: Date.now().toString(),
        title: newGoal.title,
        categories: newGoal.categories,
        target: parseFloat(newGoal.target),
        current: parseFloat(newGoal.current) || 0,
        unit: newGoal.unit,
        direction: newGoal.direction,
        deadline: newGoal.deadline,
        createdAt: new Date().toISOString(),
      },
    ];
    setGoals(updated);
    saveGoals(updated);
    resetForm();
    setShowAdd(false);
    toast.success("🎯 Goal created!");
  };

  const deleteGoal = (id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    setGoals(updated);
    saveGoals(updated);
    setExpandedGoal(null);
    toast("Goal removed");
  };

  const toggleCategory = (key: string) => {
    setNewGoal((prev) => ({
      ...prev,
      categories: prev.categories.includes(key)
        ? prev.categories.filter((c) => c !== key)
        : [...prev.categories, key],
    }));
  };

  const updateProgress = (id: string, newValue: number) => {
    const updated = goals.map((g) => (g.id === id ? { ...g, current: newValue } : g));
    setGoals(updated);
    saveGoals(updated);
  };

  const getProgress = (goal: Goal) => {
    if (goal.target === 0) return 0;
    if (goal.direction === "decrease") {
      if (goal.current <= goal.target) return 100;
      const initialDiff = Math.max(goal.current, goal.target * 1.5) - goal.target;
      return Math.max(0, Math.min(100, ((initialDiff - (goal.current - goal.target)) / initialDiff) * 100));
    }
    return Math.min(100, (goal.current / goal.target) * 100);
  };

  const completedGoals = goals.filter((g) => getProgress(g) >= 100).length;
  const overallPct = goals.length > 0 ? Math.round(goals.reduce((sum, g) => sum + getProgress(g), 0) / goals.length) : 0;

  const DirectionIcons = { decrease: TrendingDown, increase: TrendingUp, maintain: Minus };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-28">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display text-foreground">Goals</h1>
          <p className="text-xs text-muted-foreground font-body">
            {goals.length > 0 ? `${completedGoals} of ${goals.length} achieved` : "Set your first goal"}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-primary active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5 text-primary-foreground" />
        </button>
      </motion.div>

      {/* Empty State */}
      {goals.length === 0 && (
        <motion.div
          className="glass-card-accent p-8 flex flex-col items-center text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-base font-semibold font-display text-foreground mb-1">No goals yet</h3>
          <p className="text-xs text-muted-foreground font-body mb-5 max-w-[240px]">
            Start by creating your first goal. Track weight, nutrition, fitness and more.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold font-display glow-primary active:scale-95 transition-transform"
          >
            Create First Goal
          </button>
        </motion.div>
      )}

      {/* Overview Card */}
      {goals.length > 0 && (
        <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold font-display text-foreground">Overall Progress</p>
                <p className="text-[10px] text-muted-foreground font-body">
                  {completedGoals}/{goals.length} completed
                </p>
              </div>
            </div>
            <p className="text-2xl font-bold font-display text-gradient-primary">{overallPct}%</p>
          </div>
          <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${overallPct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      )}

      {/* Goal Cards */}
      <div className="space-y-3">
        {goals.map((goal, i) => {
          const isExpanded = expandedGoal === goal.id;
          const pct = Math.round(getProgress(goal));
          const isComplete = pct >= 100;
          const DirIcon = DirectionIcons[goal.direction];
          const catIcons = goal.categories
            .map((c) => CATEGORIES.find((cat) => cat.key === c))
            .filter(Boolean);

          return (
            <motion.div
              key={goal.id}
              layout
              className={`glass-card overflow-hidden transition-all ${isComplete ? "ring-1 ring-primary/20" : ""}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <button
                onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start gap-3">
                  {/* Category badge */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isComplete ? "bg-primary/15" : "bg-secondary/60"}`}>
                    {(() => {
                      const CatIcon = catIcons.length === 1 && catIcons[0] ? catIcons[0].icon : Target;
                      return <CatIcon className={`w-5 h-5 ${isComplete ? "text-primary" : "text-muted-foreground"}`} />;
                    })()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold font-display text-foreground truncate">{goal.title}</p>
                      {isComplete && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-primary/15 text-primary flex-shrink-0">✓ Done</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DirIcon className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground font-body capitalize">{goal.direction}</span>
                      <span className="text-[10px] text-muted-foreground font-body">·</span>
                      <span className="text-[10px] text-muted-foreground font-body">
                        {goal.current} / {goal.target} {goal.unit}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${isComplete ? "bg-primary" : "bg-primary/60"}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                      <span className={`text-xs font-bold font-display tabular-nums ${isComplete ? "text-primary" : "text-foreground"}`}>
                        {pct}%
                      </span>
                    </div>
                  </div>

                  <ChevronDown className={`w-4 h-4 text-muted-foreground mt-1 transition-transform duration-200 flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
                </div>

                {/* Category pills */}
                {catIcons.length > 1 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pl-[52px]">
                    {catIcons.map((cat) =>
                      cat ? (
                        <span key={cat.key} className="px-2 py-0.5 rounded-lg bg-secondary/50 text-[9px] text-muted-foreground font-body">
                          {cat.emoji} {cat.label}
                        </span>
                      ) : null
                    )}
                  </div>
                )}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    className="px-4 pb-4 space-y-3"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="h-px bg-border/50" />

                    {/* Quick update */}
                    <div>
                      <p className="text-[10px] text-muted-foreground font-body mb-1.5">Update Progress</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={goal.current}
                          onChange={(e) => updateProgress(goal.id, parseFloat(e.target.value) || 0)}
                          className="flex-1 bg-secondary rounded-xl px-3 py-2 text-sm text-foreground outline-none font-body focus:ring-1 focus:ring-primary/30 transition-all"
                        />
                        <span className="text-xs text-muted-foreground font-body min-w-[30px]">{goal.unit}</span>
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="grid grid-cols-2 gap-2">
                      {goal.deadline && (
                        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-secondary/30">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground font-body">{goal.deadline}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 p-2 rounded-lg bg-secondary/30">
                        <DirIcon className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground font-body capitalize">{goal.direction}</span>
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="flex items-center gap-1.5 text-[10px] text-destructive font-body hover:text-destructive/80 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Remove Goal
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Add Goal Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowAdd(false); resetForm(); }}
          >
            <motion.div
              className="w-full max-w-lg glass-card-strong p-6 rounded-t-3xl space-y-5"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal drag handle */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mb-4" />
                <div className="flex items-center justify-between w-full">
                  <h2 className="text-lg font-bold font-display text-foreground">New Goal</h2>
                  <button onClick={() => { setShowAdd(false); resetForm(); }} className="w-8 h-8 rounded-lg bg-secondary/60 flex items-center justify-center">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-[10px] text-muted-foreground font-body mb-1.5 block">Goal Title</label>
                <input
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="e.g. Lose 5kg, Run a marathon..."
                  className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none font-body focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>

              {/* Categories */}
              <div>
                <label className="text-[10px] text-muted-foreground font-body mb-1.5 block">
                  Categories <span className="text-primary">(select one or more)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => {
                    const isSelected = newGoal.categories.includes(cat.key);
                    return (
                      <button
                        key={cat.key}
                        onClick={() => toggleCategory(cat.key)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-body transition-all duration-200 ${
                          isSelected
                            ? "bg-primary/15 ring-1 ring-primary text-foreground"
                            : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        <cat.icon className={`w-3.5 h-3.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Direction */}
              <div>
                <label className="text-[10px] text-muted-foreground font-body mb-1.5 block">Direction</label>
                <div className="flex gap-2">
                  {(["decrease", "increase", "maintain"] as const).map((d) => {
                    const DIcon = DirectionIcons[d];
                    const isSelected = newGoal.direction === d;
                    return (
                      <button
                        key={d}
                        onClick={() => setNewGoal({ ...newGoal, direction: d })}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-medium font-body capitalize transition-all duration-200 flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        <DIcon className="w-3.5 h-3.5" />
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Values */}
              <div>
                <label className="text-[10px] text-muted-foreground font-body mb-1.5 block">Values</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    value={newGoal.current}
                    onChange={(e) => setNewGoal({ ...newGoal, current: e.target.value })}
                    placeholder="Current"
                    type="number"
                    className="bg-secondary/60 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none font-body focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                  <input
                    value={newGoal.target}
                    onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                    placeholder="Target"
                    type="number"
                    className="bg-secondary/60 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none font-body focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                  <input
                    value={newGoal.unit}
                    onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                    placeholder="Unit (kg, L...)"
                    className="bg-secondary/60 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none font-body focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                </div>
              </div>

              {/* Deadline */}
              <div>
                <label className="text-[10px] text-muted-foreground font-body mb-1.5 block">Deadline (optional)</label>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none font-body focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>

              {/* Submit */}
              <button
                onClick={addGoal}
                disabled={!newGoal.title || !newGoal.target || newGoal.categories.length === 0}
                className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold font-display glow-primary disabled:opacity-30 disabled:glow-none active:scale-[0.98] transition-all"
              >
                Create Goal
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Goals;
