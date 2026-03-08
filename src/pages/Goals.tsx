import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Plus, X, Check, TrendingDown, TrendingUp, Minus, Trophy, ChevronRight } from "lucide-react";

interface Goal {
  id: string;
  title: string;
  categories: string[];
  target: number;
  current: number;
  unit: string;
  direction: "increase" | "decrease" | "maintain";
  deadline: string;
  milestones: { value: number; label: string; reached: boolean }[];
}

const CATEGORIES = [
  { key: "weight", label: "Weight", icon: "⚖️" },
  { key: "nutrition", label: "Nutrition", icon: "🥗" },
  { key: "fitness", label: "Fitness", icon: "💪" },
  { key: "steps", label: "Steps", icon: "👟" },
  { key: "water", label: "Water", icon: "💧" },
  { key: "custom", label: "Custom", icon: "⭐" },
];

const sampleGoals: Goal[] = [];

const Goals = () => {
  const [goals, setGoals] = useState<Goal[]>(sampleGoals);
  const [showAdd, setShowAdd] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState<{
    title: string; categories: string[]; target: string; current: string; unit: string; direction: "decrease" | "increase" | "maintain"; deadline: string;
  }>({
    title: "", categories: [], target: "", current: "", unit: "", direction: "decrease", deadline: "",
  });

  const addGoal = () => {
    if (!newGoal.title || !newGoal.target) return;
    setGoals([
      ...goals,
      {
        id: Date.now().toString(), title: newGoal.title, category: newGoal.category,
        target: parseFloat(newGoal.target), current: parseFloat(newGoal.current) || 0,
        unit: newGoal.unit, direction: newGoal.direction, deadline: newGoal.deadline,
        milestones: [],
      },
    ]);
    setNewGoal({ title: "", category: "weight", target: "", current: "", unit: "", direction: "decrease", deadline: "" });
    setShowAdd(false);
  };

  const updateProgress = (id: string, newValue: number) => {
    setGoals(goals.map((g) => (g.id === id ? { ...g, current: newValue } : g)));
  };

  const completedGoals = goals.filter((g) => {
    if (g.direction === "decrease") return g.current <= g.target;
    if (g.direction === "increase") return g.current >= g.target;
    return g.current === g.target;
  }).length;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Goals</h1>
          <p className="text-sm text-muted-foreground font-body">{completedGoals}/{goals.length} completed</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-primary">
          <Plus className="w-5 h-5 text-primary-foreground" />
        </button>
      </motion.div>

      {/* Overview */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold font-display text-foreground">Overall Progress</p>
            <p className="text-xs text-muted-foreground font-body">{Math.round((completedGoals / goals.length) * 100)}% of goals achieved</p>
          </div>
        </div>
        <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(completedGoals / goals.length) * 100}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      </div>

      {/* Goal cards */}
      <div className="space-y-3">
        {goals.map((goal, i) => {
          const isExpanded = expandedGoal === goal.id;
          const progress = goal.direction === "decrease"
            ? Math.min(((parseFloat(sampleGoals.find(g => g.id === goal.id)?.current?.toString() || goal.current.toString()) - goal.current) / (parseFloat(sampleGoals.find(g => g.id === goal.id)?.current?.toString() || goal.current.toString()) - goal.target)) * 100, 100)
            : Math.min((goal.current / goal.target) * 100, 100);
          const pct = Math.max(0, Math.min(progress, 100));
          const isComplete = pct >= 100;
          const DirectionIcon = goal.direction === "decrease" ? TrendingDown : goal.direction === "increase" ? TrendingUp : Minus;
          const catEmoji = CATEGORIES.find((c) => c.key === goal.category)?.icon || "⭐";

          return (
            <motion.div
              key={goal.id}
              className={`glass-card overflow-hidden ${isComplete ? "ring-1 ring-primary/30" : ""}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <button
                onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                className="w-full p-5 text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">{catEmoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold font-display text-foreground truncate">{goal.title}</p>
                      {isComplete && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <DirectionIcon className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-body">
                        {goal.current} / {goal.target} {goal.unit}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold font-display text-primary">{Math.round(pct)}%</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${isComplete ? "bg-primary" : "bg-primary/70"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    className="px-5 pb-5 space-y-4"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Update progress */}
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={goal.current}
                        onChange={(e) => updateProgress(goal.id, parseFloat(e.target.value) || 0)}
                        className="flex-1 bg-secondary rounded-xl px-4 py-2.5 text-sm text-foreground outline-none font-body"
                      />
                      <span className="text-xs text-muted-foreground font-body">{goal.unit}</span>
                    </div>

                    {/* Milestones */}
                    {goal.milestones.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground font-body mb-2">Milestones</p>
                        <div className="space-y-1.5">
                          {goal.milestones.map((m, mi) => (
                            <div key={mi} className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                m.reached ? "bg-primary/20" : "bg-secondary"
                              }`}>
                                {m.reached ? <Check className="w-3 h-3 text-primary" /> : <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
                              </div>
                              <span className={`text-xs font-body ${m.reached ? "text-foreground" : "text-muted-foreground"}`}>
                                {m.label} — {m.value} {goal.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {goal.deadline && (
                      <p className="text-xs text-muted-foreground font-body">Deadline: {goal.deadline}</p>
                    )}
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
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdd(false)}>
            <motion.div className="w-full max-w-lg glass-card-strong p-6 rounded-t-3xl space-y-4"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-display text-foreground">New Goal</h2>
                <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>

              <input value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                placeholder="Goal title (e.g. Lose 5kg)" className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body" />

              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button key={cat.key} onClick={() => setNewGoal({ ...newGoal, category: cat.key })}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-body transition-colors ${
                      newGoal.category === cat.key ? "bg-primary/15 ring-1 ring-primary text-foreground" : "bg-secondary text-muted-foreground"
                    }`}>
                    <span>{cat.icon}</span>{cat.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                {(["decrease", "increase", "maintain"] as const).map((d) => (
                  <button key={d} onClick={() => setNewGoal({ ...newGoal, direction: d })}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium font-body capitalize transition-colors ${
                      newGoal.direction === d ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}>{d}</button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <input value={newGoal.current} onChange={(e) => setNewGoal({ ...newGoal, current: e.target.value })}
                  placeholder="Current" type="number" className="bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body" />
                <input value={newGoal.target} onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                  placeholder="Target" type="number" className="bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body" />
                <input value={newGoal.unit} onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                  placeholder="Unit" className="bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body" />
              </div>

              <input type="date" onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground outline-none font-body" />

              <button onClick={addGoal} disabled={!newGoal.title || !newGoal.target}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold font-display glow-primary disabled:opacity-40">
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
