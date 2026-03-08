import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Smile, Brain, BedDouble, Plus, X, Play, Square, Timer } from "lucide-react";

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

const SLEEP_TIMER_KEY = "GetFit_sleep_timer";
const LIFESTYLE_KEY = "GetFit_lifestyle";
const TABS = ["Sleep", "Mood", "Stress"] as const;
type Tab = (typeof TABS)[number];

function loadEntries(): LifestyleEntry[] {
  try {
    const raw = localStorage.getItem(LIFESTYLE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveEntries(entries: LifestyleEntry[]) {
  localStorage.setItem(LIFESTYLE_KEY, JSON.stringify(entries));
}

function formatDuration(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatHoursMin(ms: number) {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}m`;
}

const Lifestyle = () => {
  const [entries, setEntries] = useState<LifestyleEntry[]>(loadEntries);
  const [activeTab, setActiveTab] = useState<Tab>("Sleep");
  const [todayMood, setTodayMood] = useState<number | null>(null);
  const [todayStress, setTodayStress] = useState<number | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [todayNote, setTodayNote] = useState("");
  const [todaySleep, setTodaySleep] = useState("");

  // Sleep timer state
  const [sleepStartTime, setSleepStartTime] = useState<number | null>(() => {
    const saved = localStorage.getItem(SLEEP_TIMER_KEY);
    return saved ? parseInt(saved) : null;
  });
  const [elapsed, setElapsed] = useState(0);
  const [lastSleepDuration, setLastSleepDuration] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isSleeping = sleepStartTime !== null;

  // Update elapsed time
  useEffect(() => {
    if (sleepStartTime) {
      setElapsed(Date.now() - sleepStartTime);
      intervalRef.current = setInterval(() => {
        setElapsed(Date.now() - sleepStartTime);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sleepStartTime]);

  const startSleep = () => {
    const now = Date.now();
    setSleepStartTime(now);
    localStorage.setItem(SLEEP_TIMER_KEY, now.toString());
    setLastSleepDuration(null);
  };

  const stopSleep = () => {
    if (sleepStartTime) {
      const duration = Date.now() - sleepStartTime;
      setLastSleepDuration(duration);
      setSleepStartTime(null);
      setElapsed(0);
      localStorage.removeItem(SLEEP_TIMER_KEY);
    }
  };

  const avgSleep = (entries.reduce((s, e) => s + e.sleepHours, 0) / entries.length).toFixed(1);
  const avgMood = (entries.reduce((s, e) => s + e.mood, 0) / entries.length).toFixed(1);

  const tabIcons: Record<Tab, React.ReactNode> = {
    Sleep: <Moon className="w-4 h-4" />,
    Mood: <Smile className="w-4 h-4" />,
    Stress: <Brain className="w-4 h-4" />,
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
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

      {/* Tab selector */}
      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium font-display flex items-center justify-center gap-2 transition-colors ${
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {tabIcons[tab]}
            {tab}
          </button>
        ))}
      </div>

      {/* ===== SLEEP TAB ===== */}
      {activeTab === "Sleep" && (
        <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Sleep Timer */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Timer className="w-4 h-4 text-info" />
              <h3 className="text-sm font-semibold font-display text-foreground">Sleep Timer</h3>
            </div>

            <div className="text-center space-y-4">
              {isSleeping ? (
                <>
                  <div className="relative">
                    <motion.div
                      className="w-36 h-36 mx-auto rounded-full border-4 border-info/30 flex items-center justify-center relative"
                      animate={{ boxShadow: ["0 0 20px hsl(var(--info) / 0.2)", "0 0 40px hsl(var(--info) / 0.4)", "0 0 20px hsl(var(--info) / 0.2)"] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <div>
                        <Moon className="w-6 h-6 text-info mx-auto mb-1" />
                        <p className="text-2xl font-bold font-display text-foreground">{formatDuration(elapsed)}</p>
                        <p className="text-xs text-muted-foreground font-body">sleeping...</p>
                      </div>
                    </motion.div>
                  </div>
                  <p className="text-xs text-muted-foreground font-body">
                    Started at {new Date(sleepStartTime!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <button
                    onClick={stopSleep}
                    className="w-full py-3 rounded-xl bg-destructive text-destructive-foreground font-semibold font-display flex items-center justify-center gap-2"
                  >
                    <Square className="w-4 h-4" />
                    Wake Up — Stop Timer
                  </button>
                </>
              ) : (
                <>
                  {lastSleepDuration && (
                    <div className="bg-info/10 rounded-xl p-4 mb-3">
                      <p className="text-xs text-muted-foreground font-body mb-1">Last sleep session</p>
                      <p className="text-xl font-bold font-display text-info">{formatHoursMin(lastSleepDuration)}</p>
                    </div>
                  )}
                  <div className="w-36 h-36 mx-auto rounded-full border-4 border-secondary flex items-center justify-center">
                    <div>
                      <BedDouble className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground font-body">Ready to sleep?</p>
                    </div>
                  </div>
                  <button
                    onClick={startSleep}
                    className="w-full py-3 rounded-xl bg-info text-info-foreground font-semibold font-display flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Start Sleep Timer
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Average sleep */}
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
        </motion.div>
      )}

      {/* ===== MOOD TAB ===== */}
      {activeTab === "Mood" && (
        <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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

          {/* Avg mood */}
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
        </motion.div>
      )}

      {/* ===== STRESS TAB ===== */}
      {activeTab === "Stress" && (
        <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Quick stress check */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold font-display text-foreground mb-3">How stressed are you?</h3>
            <div className="flex gap-2">
              {STRESS_LEVELS.map((s, i) => (
                <button
                  key={s}
                  onClick={() => setTodayStress(i)}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-medium font-body transition-colors ${
                    todayStress === i
                      ? i <= 1 ? "bg-primary/20 text-primary ring-1 ring-primary" : i <= 2 ? "bg-warning/20 text-warning ring-1 ring-warning" : "bg-destructive/20 text-destructive ring-1 ring-destructive"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Stress history */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold font-display text-foreground mb-3">Stress This Week</h3>
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
        </motion.div>
      )}

      {/* Log modal */}
      <AnimatePresence>
        {showLog && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLog(false)}>
            <motion.div className="w-full max-w-lg glass-card-strong p-6 rounded-t-3xl space-y-4"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25 }}
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

              <button onClick={() => {
                const today = new Date().toLocaleDateString("en-US", { weekday: "short" });
                const newEntry: LifestyleEntry = {
                  id: Date.now().toString(),
                  date: today,
                  sleepHours: parseFloat(todaySleep) || 0,
                  sleepQuality: 3,
                  mood: todayMood ?? 3,
                  stress: todayStress ?? 0,
                  notes: todayNote,
                };
                const updated = [newEntry, ...entries.filter(e => e.date !== today)];
                setEntries(updated);
                saveEntries(updated);
                setTodaySleep("");
                setTodayNote("");
                setShowLog(false);
              }}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold font-display glow-primary">
                Save Entry
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Lifestyle;
