import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Timer, Power, X, Flame, TrendingUp,
  Clock, Zap, Trophy, BarChart3, UtensilsCrossed, Moon, Target
} from "lucide-react";
import { toast } from "sonner";

interface FastingLog {
  id: string;
  startTime: Date;
  endTime?: Date;
  targetHours: number;
  actualHours: number;
  completed: boolean;
  caloriesBurned: number;
}

const FASTING_STAGES = [
  { hours: 0, name: "Fed State", icon: "🍽️", description: "Blood sugar elevated, insulin active", color: "text-info" },
  { hours: 4, name: "Post-absorptive", icon: "⏳", description: "Blood sugar dropping, fat oxidation begins", color: "text-success" },
  { hours: 8, name: "Fasting State", icon: "🔥", description: "Glycogen depleting, fat burning increases", color: "text-warning" },
  { hours: 12, name: "Fat Burning", icon: "⚡", description: "Growth hormone spikes, ketone production", color: "text-primary" },
  { hours: 16, name: "Autophagy", icon: "♻️", description: "Cellular cleanup & repair activated", color: "text-primary" },
  { hours: 20, name: "Deep Ketosis", icon: "🧬", description: "Peak fat oxidation & mental clarity", color: "text-badge-gold" },
  { hours: 24, name: "Extended Fast", icon: "🏆", description: "Maximum autophagy & immune reset", color: "text-badge-gold" },
];

const formatDateShort = (d: Date) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = today.getTime() - dateDay.getTime();
  const h = d.getHours();
  const m = d.getMinutes();
  const time = `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  if (diff === 0) return `Today ${time}`;
  if (diff === 86400000) return `Yesterday ${time}`;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${time}`;
};

const sampleLogs: FastingLog[] = [];

const FASTING_STATE_KEY = "vitalflow_fasting_state";
const FASTING_LOGS_KEY = "vitalflow_fasting_logs";

function loadFastingState() {
  try {
    const raw = localStorage.getItem(FASTING_STATE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return { startTime: new Date(data.startTime), targetHours: data.targetHours as number };
  } catch { return null; }
}

function saveFastingState(startTime: Date, targetHours: number) {
  localStorage.setItem(FASTING_STATE_KEY, JSON.stringify({ startTime: startTime.toISOString(), targetHours }));
}

function clearFastingState() {
  localStorage.removeItem(FASTING_STATE_KEY);
}

function loadLogs(): FastingLog[] {
  try {
    const raw = localStorage.getItem(FASTING_LOGS_KEY);
    if (!raw) return sampleLogs;
    const parsed = JSON.parse(raw);
    return parsed.map((l: any) => ({ ...l, startTime: new Date(l.startTime), endTime: l.endTime ? new Date(l.endTime) : undefined }));
  } catch { return sampleLogs; }
}

function saveLogs(logs: FastingLog[]) {
  localStorage.setItem(FASTING_LOGS_KEY, JSON.stringify(logs));
}

const FastingTimer = () => {
  // Restore state from localStorage on mount (lazy initialisers — run once)
  const [isFasting, setIsFasting] = useState(() => !!loadFastingState());
  const [fastStartTime, setFastStartTime] = useState<Date | null>(() => loadFastingState()?.startTime || null);
  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    const saved = loadFastingState();
    return saved ? Math.floor((Date.now() - saved.startTime.getTime()) / 1000) : 0;
  });
  const [showHourPicker, setShowHourPicker] = useState(false);
  const [logs, setLogs] = useState<FastingLog[]>(loadLogs);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [fastingHours, setFastingHours] = useState(() => loadFastingState()?.targetHours || 16);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isFasting && fastStartTime) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - fastStartTime.getTime()) / 1000));
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isFasting, fastStartTime]);

  const toggleFasting = () => {
    if (!isFasting) {
      const now = new Date();
      setFastStartTime(now);
      setElapsedSeconds(0);
      setIsFasting(true);
      saveFastingState(now, fastingHours);
      toast.success("⏱️ Fasting started!", {
        description: `${fastingHours}h fast began at ${formatDateShort(now)}`,
      });
    } else {
      setShowEndConfirm(true);
    }
  };

  const confirmEndFast = () => {
    if (!fastStartTime) return;
    const endTime = new Date();
    const actualHours = parseFloat(((endTime.getTime() - fastStartTime.getTime()) / 3600000).toFixed(1));
    const caloriesBurned = Math.round(actualHours > 4 ? (actualHours - 4) * 70 + 4 * 50 : actualHours * 50);
    const completed = actualHours >= fastingHours;

    const newLog: FastingLog = {
      id: Date.now().toString(),
      startTime: fastStartTime,
      endTime,
      targetHours: fastingHours,
      actualHours,
      completed,
      caloriesBurned,
    };

    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    saveLogs(updatedLogs);
    setIsFasting(false);
    setFastStartTime(null);
    setElapsedSeconds(0);
    setShowEndConfirm(false);
    clearFastingState();

    if (completed) {
      toast.success(`🎉 ${fastingHours}h fast completed!`, {
        description: `${actualHours}h fasted · ${caloriesBurned} kcal burned`,
      });
    } else {
      toast(`Fast ended early at ${actualHours}h`, {
        description: `Target was ${fastingHours}h · ${caloriesBurned} kcal burned`,
      });
    }
  };

  const eatHours = 24 - fastingHours;
  const totalTargetSeconds = fastingHours * 3600;
  const progressPct = Math.min(100, (elapsedSeconds / totalTargetSeconds) * 100);
  const elapsedHours = elapsedSeconds / 3600;
  const remainingSeconds = Math.max(0, totalTargetSeconds - elapsedSeconds);
  const currentStage = [...FASTING_STAGES].reverse().find((s) => elapsedHours >= s.hours) || FASTING_STAGES[0];
  const estimatedCalories = Math.round(elapsedHours > 4 ? (elapsedHours - 4) * 70 + 4 * 50 : elapsedHours * 50);
  const circumference = 2 * Math.PI * 110;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  const formatTime = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatHM = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const thisWeekLogs = logs.filter((l) => l.endTime && Date.now() - l.endTime.getTime() < 7 * 86400000);
  const weeklyStats = {
    totalFasts: thisWeekLogs.length,
    avgDuration: thisWeekLogs.length > 0 ? (thisWeekLogs.reduce((s, l) => s + l.actualHours, 0) / thisWeekLogs.length).toFixed(1) + "h" : "0h",
    longestFast: thisWeekLogs.length > 0 ? Math.max(...thisWeekLogs.map((l) => l.actualHours)).toFixed(1) + "h" : "0h",
    completionRate: thisWeekLogs.length > 0 ? Math.round((thisWeekLogs.filter((l) => l.completed).length / thisWeekLogs.length) * 100) + "%" : "0%",
    totalCaloriesBurned: thisWeekLogs.reduce((s, l) => s + l.caloriesBurned, 0),
    currentStreak: thisWeekLogs.filter((l) => l.completed).length,
  };

  // Generate hour marks for the clock-style picker
  const hourMarks = Array.from({ length: 23 }, (_, i) => i + 1);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display text-foreground">Fasting</h1>
          <p className="text-xs text-muted-foreground font-body">
            {isFasting ? `Since ${fastStartTime ? formatDateShort(fastStartTime) : ""}` : "Set your goal & start"}
          </p>
        </div>
        {!isFasting && (
          <button onClick={() => setShowHourPicker(true)}
            className="px-4 py-2 rounded-xl glass-card text-sm font-bold text-primary font-display flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> {fastingHours}h
          </button>
        )}
      </motion.div>

      {/* Main Timer Ring */}
      <motion.div className="glass-card p-6 flex flex-col items-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="relative w-60 h-60 flex items-center justify-center mb-4">
          <svg className="w-full h-full progress-ring" viewBox="0 0 240 240">
            <circle cx="120" cy="120" r="110" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
            <motion.circle cx="120" cy="120" r="110" fill="none"
              stroke={isFasting ? "hsl(var(--primary))" : "hsl(var(--secondary))"}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: isFasting ? strokeDashoffset : circumference }}
              transition={{ duration: 0.5 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isFasting ? (
              <>
                <p className="text-3xl font-bold font-display text-foreground tabular-nums">{formatTime(elapsedSeconds)}</p>
                <p className="text-xs text-muted-foreground font-body mt-1">
                  {remainingSeconds > 0 ? `${formatHM(remainingSeconds)} remaining` : "🎉 Goal reached!"}
                </p>
                <p className={`text-xs font-medium mt-2 ${currentStage.color} font-body`}>
                  {currentStage.icon} {currentStage.name}
                </p>
              </>
            ) : (
              <>
                <p className="text-4xl font-bold font-display text-foreground">{fastingHours}h</p>
                <p className="text-xs text-muted-foreground font-body mt-1">Tap below to start</p>
              </>
            )}
          </div>
        </div>

        <button onClick={toggleFasting}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
            isFasting ? "bg-destructive ring-2 ring-destructive/30" : "bg-primary glow-primary"
          }`}>
          <Power className={`w-8 h-8 ${isFasting ? "text-destructive-foreground" : "text-primary-foreground"}`} />
        </button>
        <p className={`text-xs font-medium mt-3 font-body ${isFasting ? "text-destructive" : "text-primary"}`}>
          {isFasting ? "Tap to end fast" : "Tap to start fast"}
        </p>

        {/* Live stats */}
        {isFasting && (
          <motion.div className="grid grid-cols-3 gap-4 mt-6 w-full" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center p-3 rounded-xl bg-secondary/40">
              <Flame className="w-4 h-4 text-warning mx-auto mb-1" />
              <p className="text-sm font-bold font-display text-foreground">{estimatedCalories}</p>
              <p className="text-[9px] text-muted-foreground font-body">kcal</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-secondary/40">
              <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-sm font-bold font-display text-foreground">{progressPct.toFixed(0)}%</p>
              <p className="text-[9px] text-muted-foreground font-body">complete</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-secondary/40">
              <Clock className="w-4 h-4 text-info mx-auto mb-1" />
              <p className="text-sm font-bold font-display text-foreground">{elapsedHours.toFixed(1)}h</p>
              <p className="text-[9px] text-muted-foreground font-body">elapsed</p>
            </div>
          </motion.div>
        )}
      </motion.div>



      {/* Weekly Stats */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold font-display text-foreground mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-muted-foreground" /> This Week
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Fasts", value: weeklyStats.totalFasts.toString(), icon: Timer },
            { label: "Avg Duration", value: weeklyStats.avgDuration, icon: Clock },
            { label: "Longest", value: weeklyStats.longestFast, icon: Trophy },
            { label: "Completion", value: weeklyStats.completionRate, icon: Target },
            { label: "Calories", value: weeklyStats.totalCaloriesBurned.toString(), icon: Flame },
            { label: "Streak", value: `${weeklyStats.currentStreak} days`, icon: Zap },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-3 rounded-xl bg-secondary/40">
              <stat.icon className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
              <p className="text-sm font-bold font-display text-foreground">{stat.value}</p>
              <p className="text-[8px] text-muted-foreground font-body">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* History — show max 3 */}
      <div>
        <h3 className="text-sm font-semibold font-display text-foreground mb-3">History</h3>
        <div className="space-y-2">
          {(showAllHistory ? logs : logs.slice(0, 3)).map((log) => (
            <motion.div key={log.id} className="glass-card p-4 space-y-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${log.completed ? "bg-success/15" : "bg-warning/15"}`}>
                    {log.completed ? <Trophy className="w-4 h-4 text-success" /> : <Clock className="w-4 h-4 text-warning" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold font-display text-foreground">{log.targetHours}h Fast</p>
                      {log.completed && <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-success/15 text-success">✓ Complete</span>}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-body">{formatDateShort(log.startTime)}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-lg bg-secondary/40">
                  <p className="text-xs font-bold font-display text-foreground">{log.actualHours}h</p>
                  <p className="text-[8px] text-muted-foreground font-body">Duration</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-secondary/40">
                  <p className="text-xs font-bold font-display text-warning">{log.caloriesBurned}</p>
                  <p className="text-[8px] text-muted-foreground font-body">kcal Burned</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-secondary/40">
                  <p className="text-xs font-bold font-display text-primary">{Math.min(100, Math.round((log.actualHours / log.targetHours) * 100))}%</p>
                  <p className="text-[8px] text-muted-foreground font-body">Completed</p>
                </div>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${log.completed ? "bg-success/60" : "bg-warning/60"}`}
                  style={{ width: `${Math.min(100, (log.actualHours / log.targetHours) * 100)}%` }} />
              </div>
            </motion.div>
          ))}
        </div>
        {logs.length > 3 && (
          <button onClick={() => setShowAllHistory(!showAllHistory)}
            className="w-full mt-3 py-2.5 rounded-xl bg-secondary/50 text-xs font-medium text-muted-foreground font-body hover:text-foreground transition-colors">
            {showAllHistory ? "Show Less" : `View All History (${logs.length})`}
          </button>
        )}
      </div>

      {/* End Fast Confirmation */}
      <AnimatePresence>
        {showEndConfirm && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEndConfirm(false)}>
            <motion.div className="w-80 glass-card-strong p-6 rounded-2xl space-y-4 text-center"
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()}>
              <Timer className="w-10 h-10 text-primary mx-auto" />
              <h2 className="text-lg font-bold font-display text-foreground">End Fast?</h2>
              <p className="text-sm text-muted-foreground font-body">
                You've been fasting for <span className="font-bold text-foreground">{formatHM(elapsedSeconds)}</span>.
                {progressPct >= 100
                  ? " 🎉 You've reached your goal!"
                  : ` ${(100 - progressPct).toFixed(0)}% remaining to reach your ${fastingHours}h target.`
                }
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowEndConfirm(false)}
                  className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-medium font-body text-sm">
                  Continue
                </button>
                <button onClick={confirmEndFast}
                  className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground font-medium font-body text-sm">
                  End Fast
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hour Picker — Clock-style dial */}
      <AnimatePresence>
        {showHourPicker && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHourPicker(false)}>
            <motion.div className="w-full max-w-lg glass-card-strong p-6 rounded-t-3xl space-y-5"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-display text-foreground">Set Fasting Hours</h2>
                <button onClick={() => setShowHourPicker(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>

              {/* Clock dial — HTML buttons */}
              <div className="flex flex-col items-center">
                <div className="relative w-64 h-64">
                  {/* Background ring */}
                  <svg viewBox="0 0 260 260" className="absolute inset-0 w-full h-full pointer-events-none">
                    <circle cx="130" cy="130" r="115" fill="none" stroke="hsl(var(--secondary))" strokeWidth="2" />
                    <circle cx="130" cy="130" r="115" fill="none"
                      stroke="hsl(var(--primary))" strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 115}
                      strokeDashoffset={2 * Math.PI * 115 * (1 - fastingHours / 24)}
                      transform="rotate(-90 130 130)" opacity="0.3" />
                  </svg>
                  {/* Hour buttons */}
                  {hourMarks.map((h) => {
                    const angle = (h / 24) * 360 - 90;
                    const rad = (angle * Math.PI) / 180;
                    const isSelected = h === fastingHours;
                    const r = 42; // percent from center
                    const left = 50 + r * Math.cos(rad);
                    const top = 50 + r * Math.sin(rad);
                    return (
                      <button key={h} onClick={() => setFastingHours(h)}
                        className={`absolute z-10 rounded-full flex items-center justify-center transition-all duration-150 ${
                          isSelected
                            ? "w-9 h-9 bg-primary text-primary-foreground font-bold text-xs"
                            : h <= fastingHours
                              ? "w-7 h-7 bg-primary/20 text-primary text-[10px] font-medium"
                              : "w-7 h-7 bg-secondary/60 text-muted-foreground text-[10px]"
                        }`}
                        style={{ left: `${left}%`, top: `${top}%`, transform: "translate(-50%, -50%)" }}>
                        {h}
                      </button>
                    );
                  })}
                  {/* Center display */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-3xl font-bold font-display text-foreground">{fastingHours}h</p>
                    <p className="text-[10px] text-muted-foreground font-body">fasting</p>
                  </div>
                </div>

                {/* Quick summary */}
                <div className="flex gap-6 mt-4">
                  <div className="text-center">
                    <p className="text-sm font-bold font-display text-primary">{fastingHours}h</p>
                    <p className="text-[9px] text-muted-foreground font-body">Fasting</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold font-display text-success">{24 - fastingHours}h</p>
                    <p className="text-[9px] text-muted-foreground font-body">Eating</p>
                  </div>
                </div>
              </div>

              <button onClick={() => setShowHourPicker(false)}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold font-display text-sm glow-primary">
                Set {fastingHours}h Fast
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FastingTimer;
