import { useState } from "react";
import { motion } from "framer-motion";
import { Moon, Smile, Brain, BedDouble, Plus, X } from "lucide-react";

const MOODS = [
  { emoji: "😄", label: "Great", value: 5 },
  { emoji: "🙂", label: "Good", value: 4 },
  { emoji: "😐", label: "Okay", value: 3 },
  { emoji: "😔", label: "Low", value: 2 },
  { emoji: "😩", label: "Bad", value: 1 },
];

const STRESS_LEVELS = ["Calm", "Mild", "Moderate", "High", "Overwhelming"];

interface LifestyleEntry {
  id: string;
  date: string;
  sleepHours: number;
  sleepQuality: number;
  mood: number;
  stress: number;
  notes: string;
}

const weekData: LifestyleEntry[] = [
  { id: "1", date: "Mon", sleepHours: 7.5, sleepQuality: 4, mood: 4, stress: 1, notes: "" },
  { id: "2", date: "Tue", sleepHours: 6, sleepQuality: 2, mood: 3, stress: 3, notes: "Slept late" },
  { id: "3", date: "Wed", sleepHours: 8, sleepQuality: 5, mood: 5, stress: 0, notes: "" },
  { id: "4", date: "Thu", sleepHours: 7, sleepQuality: 3, mood: 3, stress: 2, notes: "" },
  { id: "5", date: "Fri", sleepHours: 6.5, sleepQuality: 3, mood: 4, stress: 2, notes: "" },
  { id: "6", date: "Sat", sleepHours: 9, sleepQuality: 5, mood: 5, stress: 0, notes: "" },
  { id: "7", date: "Sun", sleepHours: 7, sleepQuality: 4, mood: 4, stress: 1, notes: "" },
];

const Lifestyle = () => {
  const [entries] = useState(weekData);
  const [todayMood, setTodayMood] = useState<number | null>(null);
  const [todaySleep, setTodaySleep] = useState("");
  const [todayStress, setTodayStress] = useState<number | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [todayNote, setTodayNote] = useState("");

  const avgSleep = (entries.reduce((s, e) => s + e.sleepHours, 0) / entries.length).toFixed(1);
  const avgMood = (entries.reduce((s, e) => s + e.mood, 0) / entries.length).toFixed(1);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-5 h-5 text-info" />
            <h1 className="text-2xl font-bold font-display text-foreground">Lifestyle</h1>
          </div>
          <p className="text-sm text-muted-foreground font-body">Sleep, mood & stress tracking</p>
        </div>
        <button onClick={() => setShowLog(true)} className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-primary">
          <Plus className="w-5 h-5 text-primary-foreground" />
        </button>
      </motion.div>

      {/* Quick mood check */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold font-display text-foreground mb-3">How are you feeling?</h3>
        <div className="flex gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setTodayMood(m.value)}
              className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                todayMood === m.value ? "bg-primary/15 ring-1 ring-primary scale-105" : "bg-secondary"
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-[9px] text-muted-foreground font-body">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Averages */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-info/15 flex items-center justify-center">
              <BedDouble className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-body">Avg Sleep</p>
              <p className="text-xl font-bold font-display text-foreground">{avgSleep}h</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-body">
            {parseFloat(avgSleep) >= 7 ? "✅ On track" : "⚠️ Below 7h target"}
          </p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center">
              <Smile className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-body">Avg Mood</p>
              <p className="text-xl font-bold font-display text-foreground">{avgMood}/5</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-body">
            {parseFloat(avgMood) >= 4 ? "😊 Feeling good" : "💛 Room to improve"}
          </p>
        </div>
      </div>

      {/* Weekly sleep bars */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold font-display text-foreground mb-3">Sleep This Week</h3>
        <div className="flex items-end gap-2 h-32">
          {entries.map((e) => {
            const pct = Math.min((e.sleepHours / 10) * 100, 100);
            return (
              <div key={e.id} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground font-body">{e.sleepHours}h</span>
                <motion.div
                  className={`w-full rounded-t-lg ${e.sleepHours >= 7 ? "bg-info" : e.sleepHours >= 6 ? "bg-warning" : "bg-destructive"}`}
                  initial={{ height: 0 }}
                  animate={{ height: `${pct}%` }}
                  transition={{ duration: 0.6, delay: entries.indexOf(e) * 0.05 }}
                />
                <span className="text-[10px] text-muted-foreground font-body">{e.date}</span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-info" /><span className="text-[10px] text-muted-foreground font-body">7h+</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-warning" /><span className="text-[10px] text-muted-foreground font-body">6-7h</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-destructive" /><span className="text-[10px] text-muted-foreground font-body">&lt;6h</span></div>
        </div>
      </div>

      {/* Mood history */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold font-display text-foreground mb-3">Mood This Week</h3>
        <div className="flex gap-2">
          {entries.map((e) => (
            <div key={e.id} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xl">{MOODS.find((m) => m.value === e.mood)?.emoji}</span>
              <span className="text-[10px] text-muted-foreground font-body">{e.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stress history */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold font-display text-foreground mb-3">Stress Levels</h3>
        <div className="space-y-2">
          {entries.map((e) => (
            <div key={e.id} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-body w-8">{e.date}</span>
              <div className="flex-1 flex gap-1">
                {[0, 1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`flex-1 h-3 rounded-full ${
                      level <= e.stress
                        ? e.stress <= 1 ? "bg-primary" : e.stress <= 2 ? "bg-warning" : "bg-destructive"
                        : "bg-secondary"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground font-body w-16 text-right">{STRESS_LEVELS[e.stress]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Log modal */}
      {showLog && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowLog(false)}>
          <motion.div className="w-full max-w-lg glass-card-strong p-6 rounded-t-3xl space-y-4"
            initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ type: "spring", damping: 25 }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-display text-foreground">Log Today</h2>
              <button onClick={() => setShowLog(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-body mb-2 block">Sleep (hours)</label>
              <input type="number" step="0.5" value={todaySleep} onChange={(e) => setTodaySleep(e.target.value)}
                placeholder="e.g. 7.5" className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-body mb-2 block">Mood</label>
              <div className="flex gap-2">
                {MOODS.map((m) => (
                  <button key={m.value} onClick={() => setTodayMood(m.value)}
                    className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                      todayMood === m.value ? "bg-primary/15 ring-1 ring-primary" : "bg-secondary"
                    }`}>
                    <span className="text-lg">{m.emoji}</span>
                    <span className="text-[8px] text-muted-foreground font-body">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-body mb-2 block">Stress Level</label>
              <div className="flex gap-2">
                {STRESS_LEVELS.map((s, i) => (
                  <button key={s} onClick={() => setTodayStress(i)}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-medium font-body transition-colors ${
                      todayStress === i ? (i <= 1 ? "bg-primary/20 text-primary" : i <= 2 ? "bg-warning/20 text-warning" : "bg-destructive/20 text-destructive") : "bg-secondary text-muted-foreground"
                    }`}>{s}</button>
                ))}
              </div>
            </div>

            <input value={todayNote} onChange={(e) => setTodayNote(e.target.value)}
              placeholder="Any notes for today..." className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body" />

            <button onClick={() => setShowLog(false)}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold font-display glow-primary">
              Save Entry
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Lifestyle;
