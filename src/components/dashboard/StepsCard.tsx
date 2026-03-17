import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Footprints, Pencil, Check } from "lucide-react";

const STEPS_KEY = "Cals Crumble Fit_steps";
const ONBOARDING_KEY = "Cals Crumble Fit_onboarding";

function todayISO() { return new Date().toISOString().slice(0, 10); }

function loadStepsGoal(): number {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    if (!raw) return 10000;
    const data = JSON.parse(raw);
    return parseInt(data.stepsGoal) || 10000;
  } catch { return 10000; }
}

function loadTodaySteps(): number {
  try {
    const raw = localStorage.getItem(STEPS_KEY);
    if (!raw) return 0;
    const data: Record<string, number> = JSON.parse(raw);
    return data[todayISO()] || 0;
  } catch { return 0; }
}

function saveTodaySteps(steps: number) {
  try {
    const raw = localStorage.getItem(STEPS_KEY);
    const data: Record<string, number> = raw ? JSON.parse(raw) : {};
    data[todayISO()] = steps;
    localStorage.setItem(STEPS_KEY, JSON.stringify(data));
  } catch {}
}

const StepsCard = () => {
  const [steps, setSteps] = useState(() => loadTodaySteps());
  const [goal] = useState(() => loadStepsGoal());
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");

  const percentage = Math.min((steps / goal) * 100, 100);

  const confirm = () => {
    const val = parseInt(input);
    if (!isNaN(val) && val >= 0) {
      setSteps(val);
      saveTodaySteps(val);
    }
    setEditing(false);
    setInput("");
  };

  return (
    <div className="glass-card p-5 gradient-border relative overflow-hidden">
      <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-primary/8 blur-xl" />
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Footprints className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">Steps</p>
          <AnimatePresence mode="wait">
            {editing ? (
              <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 mt-0.5">
                <input
                  autoFocus
                  type="number"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirm()}
                  placeholder={steps.toString()}
                  className="w-24 bg-secondary/60 text-foreground text-sm font-bold font-display rounded-lg px-2 py-0.5 outline-none border border-primary/40"
                />
                <button onClick={confirm} className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </button>
              </motion.div>
            ) : (
              <motion.div key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                <p className="text-xl font-bold font-display text-foreground">{steps.toLocaleString()}</p>
                <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-primary transition-colors">
                  <Pencil className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, hsl(66, 85%, 50%), hsl(66, 90%, 65%))" }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground mt-2 font-body">{goal.toLocaleString()} goal</p>
    </div>
  );
};

export default StepsCard;
