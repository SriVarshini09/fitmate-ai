import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Target, RefreshCw, CheckCircle2, Flame } from "lucide-react";

const CHALLENGES_KEY = "Cals Crumble Fit_challenges";

function loadChallengeProgress(): Record<string, number> {
  try {
    const raw = localStorage.getItem(CHALLENGES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveChallengeProgress(progress: Record<string, number>) {
  localStorage.setItem(CHALLENGES_KEY, JSON.stringify(progress));
}

function calcRealProgress(): Record<string, number> {
  const today = new Date().toISOString().slice(0, 10);

  // Steps: count last 7 days that hit 10000
  let stepsGoalDays = 0;
  try {
    const raw = localStorage.getItem("Cals Crumble Fit_steps");
    if (raw) {
      const data: Record<string, number> = JSON.parse(raw);
      for (let i = 0; i < 7; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        if ((data[key] || 0) >= 10000) stepsGoalDays++;
      }
    }
  } catch {}

  // Water: count last 7 days that had entries (we persist as key=date, value=ml total)
  let waterGoalDays = 0;
  try {
    const raw = localStorage.getItem("Cals Crumble Fit_water");
    if (raw) {
      const data: Record<string, number> = JSON.parse(raw);
      for (let i = 0; i < 7; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        if ((data[key] || 0) >= 2000) waterGoalDays++;
      }
    }
  } catch {}

  // Workouts: count last 7 days with a completed workout
  let workoutDays = 0;
  try {
    const raw = localStorage.getItem("Cals Crumble Fit_workouts");
    if (raw) {
      const workouts: Array<{ date: string }> = JSON.parse(raw);
      const datesSet = new Set(workouts.map((w) => w.date));
      for (let i = 0; i < 7; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        if (datesSet.has(key)) workoutDays++;
      }
    }
  } catch {}

  // Sleep: count last 7 lifestyle entries with mood logged (proxy for consistency)
  let sleepLogDays = 0;
  try {
    const raw = localStorage.getItem("Cals Crumble Fit_lifestyle");
    if (raw) {
      const entries: Array<{ date: string; sleepHours: number }> = JSON.parse(raw);
      const recent = entries.filter((e) => {
        const d = new Date(e.date);
        const diff = (new Date(today).getTime() - d.getTime()) / 86400000;
        return diff >= 0 && diff < 7;
      });
      sleepLogDays = recent.filter((e) => e.sleepHours >= 7).length;
    }
  } catch {}

  // Food: count last 7 days with food logged
  let foodDays = 0;
  try {
    const raw = localStorage.getItem("Cals Crumble Fit_foods");
    if (raw) {
      const foods: Array<{ date: string }> = JSON.parse(raw);
      const datesSet = new Set(foods.map((f) => f.date));
      for (let i = 0; i < 7; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        if (datesSet.has(key)) foodDays++;
      }
    }
  } catch {}

  return {
    "1": stepsGoalDays,
    "2": foodDays,
    "3": waterGoalDays,
    "4": sleepLogDays,
    "5": workoutDays,
  };
}

const QUOTES = [
  { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
  { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
  { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Your body can stand almost anything. It's your mind you have to convince.", author: "Unknown" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
];

interface Challenge {
  id: string;
  title: string;
  description: string;
  duration: string;
  progress: number;
  total: number;
  category: string;
  emoji: string;
  active: boolean;
}

const CHALLENGE_DEFS = [
  { id: "1", title: "10K Steps Challenge", description: "Walk 10,000 steps every day for 7 days", duration: "7 days", total: 7, category: "Steps", emoji: "👟" },
  { id: "2", title: "Food Log Streak", description: "Log your food every day for 7 days", duration: "7 days", total: 7, category: "Nutrition", emoji: "�" },
  { id: "3", title: "Hydration Hero", description: "Drink 2L of water daily for 7 days", duration: "7 days", total: 7, category: "Water", emoji: "💧" },
  { id: "4", title: "Sleep 7+ Hours", description: "Get 7+ hours of sleep for 7 days", duration: "7 days", total: 7, category: "Sleep", emoji: "🌅" },
  { id: "5", title: "Workout Week", description: "Complete a workout every day for 7 days", duration: "7 days", total: 7, category: "Fitness", emoji: "�" },
];


const Motivation = () => {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [manualProgress, setManualProgress] = useState<Record<string, number>>(() => loadChallengeProgress());
  const [realProgress, setRealProgress] = useState<Record<string, number>>({});

  // Calculate real progress only once on mount
  useEffect(() => {
    setRealProgress(calcRealProgress());
  }, []);

  const activeChallenges: Challenge[] = CHALLENGE_DEFS.map((def) => ({
    ...def,
    // Use whichever is higher: real computed or manually tapped
    progress: Math.max(realProgress[def.id] ?? 0, manualProgress[def.id] ?? 0),
    active: true,
  }));

  useEffect(() => {
    setQuoteIndex(Math.floor(Math.random() * QUOTES.length));
  }, []);

  const nextQuote = () => setQuoteIndex((quoteIndex + 1) % QUOTES.length);
  const quote = QUOTES[quoteIndex];

  const completeDay = (id: string) => {
    const current = activeChallenges.find((c) => c.id === id)?.progress ?? 0;
    const next = Math.min(current + 1, 7);
    const updated = { ...manualProgress, [id]: next };
    setManualProgress(updated);
    saveChallengeProgress(updated);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-5 h-5 text-warning" />
          <h1 className="text-2xl font-bold font-display text-foreground">Motivation</h1>
        </div>
        <p className="text-sm text-muted-foreground font-body">Stay inspired, stay on track</p>
      </motion.div>

      {/* Daily quote */}
      <motion.div className="glass-card p-6 relative overflow-hidden" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="absolute -top-4 -left-4 text-6xl opacity-10 select-none">"</div>
        <AnimatePresence mode="wait">
          <motion.div key={quoteIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <p className="text-base font-medium text-foreground font-body leading-relaxed mb-2 italic">"{quote.text}"</p>
            <p className="text-xs text-primary font-body">— {quote.author}</p>
          </motion.div>
        </AnimatePresence>
        <button onClick={nextQuote} className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </button>
      </motion.div>

      {/* Active challenges */}
      <div>
        <h3 className="text-sm font-semibold font-display text-foreground mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" /> Active Challenges
        </h3>
        <div className="space-y-3">
          {activeChallenges.map((challenge, i) => {
            const pct = (challenge.progress / challenge.total) * 100;
            const isComplete = pct >= 100;
            return (
              <motion.div
                key={challenge.id}
                className={`glass-card p-4 ${isComplete ? "ring-1 ring-primary/30" : ""}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{challenge.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold font-display text-foreground">{challenge.title}</p>
                      {isComplete && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">{challenge.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${isComplete ? "bg-primary" : "bg-primary/70"}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-body whitespace-nowrap">{challenge.progress}/{challenge.total}</span>
                    </div>
                  </div>
                  {!isComplete && (
                    <button
                      onClick={() => completeDay(challenge.id)}
                      className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center hover:bg-primary/25 transition-colors flex-shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="glass-card p-5 bg-gradient-to-br from-card/60 to-primary/5">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="w-4 h-4 text-warning" />
          <h3 className="text-sm font-semibold font-display text-foreground">Today's Tip</h3>
        </div>
        <p className="text-sm text-foreground/80 font-body leading-relaxed">
          Try eating a high-protein breakfast within an hour of waking up. It helps regulate appetite, stabilize blood sugar, and can reduce cravings later in the day. Aim for 25-30g of protein! 🥚
        </p>
      </div>
    </div>
  );
};

export default Motivation;
