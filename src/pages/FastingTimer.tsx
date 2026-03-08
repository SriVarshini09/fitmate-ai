import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Timer, Power, X, ChevronRight, Flame, TrendingUp,
  Clock, Zap, Trophy, BarChart3, UtensilsCrossed, Moon, Target
} from "lucide-react";
import { toast } from "sonner";

type FastingProtocol = "16:8" | "18:6" | "20:4" | "OMAD" | "Custom";



interface FastingWindow {
  protocol: FastingProtocol;
  fastHours: number;
  eatHours: number;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
}

interface FastingLog {
  id: string;
  protocol: FastingProtocol;
  startTime: Date;
  endTime?: Date;
  targetHours: number;
  actualHours: number;
  completed: boolean;
  caloriesBurned: number;
}

const PROTOCOLS: FastingWindow[] = [
  { protocol: "16:8", fastHours: 16, eatHours: 8, description: "Most popular. Fast 16h, eat in 8h window.", difficulty: "Beginner" },
  { protocol: "18:6", fastHours: 18, eatHours: 6, description: "Extended fast. Eat in a 6h window.", difficulty: "Intermediate" },
  { protocol: "20:4", fastHours: 20, eatHours: 4, description: "Warrior diet. 20h fast, 4h eating.", difficulty: "Advanced" },
  { protocol: "OMAD", fastHours: 23, eatHours: 1, description: "One Meal A Day. Maximum fasting.", difficulty: "Expert" },
];

const difficultyColor: Record<string, string> = {
  Beginner: "bg-success/15 text-success",
  Intermediate: "bg-info/15 text-info",
  Advanced: "bg-warning/15 text-warning",
  Expert: "bg-destructive/15 text-destructive",
};

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

// Sample history
const sampleLogs: FastingLog[] = [
  { id: "1", protocol: "16:8", startTime: new Date(Date.now() - 36 * 3600000), endTime: new Date(Date.now() - 20 * 3600000), targetHours: 16, actualHours: 16, completed: true, caloriesBurned: 180 },
  { id: "2", protocol: "18:6", startTime: new Date(Date.now() - 60 * 3600000), endTime: new Date(Date.now() - 42 * 3600000), targetHours: 18, actualHours: 18, completed: true, caloriesBurned: 220 },
  { id: "3", protocol: "16:8", startTime: new Date(Date.now() - 84 * 3600000), endTime: new Date(Date.now() - 70 * 3600000), targetHours: 16, actualHours: 14, completed: false, caloriesBurned: 155 },
];

const FastingTimer = () => {
  const [isFasting, setIsFasting] = useState(false);
  const [fastStartTime, setFastStartTime] = useState<Date | null>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<FastingWindow>(PROTOCOLS[0]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showProtocolPicker, setShowProtocolPicker] = useState(false);
  const [logs, setLogs] = useState<FastingLog[]>(sampleLogs);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [customHours, setCustomHours] = useState(16);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tick every second while fasting
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
      // START fasting
      const now = new Date();
      setFastStartTime(now);
      setElapsedSeconds(0);
      setIsFasting(true);
      toast.success("⏱️ Fasting started!", {
        description: `${selectedProtocol.protocol} fast began at ${formatDateShort(now)}`,
      });
    } else {
      // STOP fasting — show confirm
      setShowEndConfirm(true);
    }
  };

  const confirmEndFast = () => {
    if (!fastStartTime) return;
    const endTime = new Date();
    const actualHours = parseFloat(((endTime.getTime() - fastStartTime.getTime()) / 3600000).toFixed(1));
    const caloriesBurned = Math.round(actualHours > 4 ? (actualHours - 4) * 70 + 4 * 50 : actualHours * 50);
    const completed = actualHours >= activeFastHours;

    const newLog: FastingLog = {
      id: Date.now().toString(),
      protocol: selectedProtocol.protocol === "Custom" ? "Custom" : selectedProtocol.protocol,
      startTime: fastStartTime,
      endTime,
      targetHours: activeFastHours,
      actualHours,
      completed,
      caloriesBurned,
    };

    setLogs([newLog, ...logs]);
    setIsFasting(false);
    setFastStartTime(null);
    setElapsedSeconds(0);
    setShowEndConfirm(false);

    if (completed) {
      toast.success(`🎉 ${activeFastHours}h fast completed!`, {
        description: `${actualHours}h fasted · ${caloriesBurned} kcal burned`,
      });
    } else {
      toast(`Fast ended early at ${actualHours}h`, {
        description: `Target was ${activeFastHours}h · ${caloriesBurned} kcal burned`,
      });
    }
  };

  const activeFastHours = selectedProtocol.protocol === "Custom" ? customHours : selectedProtocol.fastHours;
  const activeEatHours = 24 - activeFastHours;
  const totalTargetSeconds = activeFastHours * 3600;
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

  // Weekly stats from logs
  const thisWeekLogs = logs.filter((l) => l.endTime && Date.now() - l.endTime.getTime() < 7 * 86400000);
  const weeklyStats = {
    totalFasts: thisWeekLogs.length,
    avgDuration: thisWeekLogs.length > 0 ? (thisWeekLogs.reduce((s, l) => s + l.actualHours, 0) / thisWeekLogs.length).toFixed(1) + "h" : "0h",
    longestFast: thisWeekLogs.length > 0 ? Math.max(...thisWeekLogs.map((l) => l.actualHours)).toFixed(1) + "h" : "0h",
    completionRate: thisWeekLogs.length > 0 ? Math.round((thisWeekLogs.filter((l) => l.completed).length / thisWeekLogs.length) * 100) + "%" : "0%",
    totalCaloriesBurned: thisWeekLogs.reduce((s, l) => s + l.caloriesBurned, 0),
    currentStreak: thisWeekLogs.filter((l) => l.completed).length,
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Timer className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold font-display text-foreground">Fasting</h1>
          </div>
          <p className="text-sm text-muted-foreground font-body">
            {isFasting ? `Fasting since ${fastStartTime ? formatDateShort(fastStartTime) : ""}` : "Tap the button to start fasting"}
          </p>
        </div>
        <button
          onClick={() => setShowProtocolPicker(true)}
          className="px-4 py-2 rounded-xl glass-card text-xs font-medium text-foreground font-body flex items-center gap-1.5"
        >
          {selectedProtocol.protocol}
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        </button>
      </motion.div>

      {/* Main Timer + Big Toggle */}
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
                <p className="text-4xl font-bold font-display text-foreground">{activeFastHours}h</p>
                <p className="text-sm text-muted-foreground font-body mt-1">
                  {selectedProtocol.protocol === "Custom" ? "Custom Fast" : `${selectedProtocol.protocol} Fast`}
                </p>
                <p className="text-xs text-muted-foreground font-body mt-1">Tap below to start</p>
              </>
            )}
          </div>
        </div>

        {/* Single ON/OFF Toggle Button */}
        <button
          onClick={toggleFasting}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
            isFasting
              ? "bg-destructive glow-primary ring-2 ring-destructive/30"
              : "bg-primary glow-primary"
          }`}
        >
          <Power className={`w-8 h-8 ${isFasting ? "text-destructive-foreground" : "text-primary-foreground"}`} />
        </button>
        <p className={`text-xs font-medium mt-3 font-body ${isFasting ? "text-destructive" : "text-primary"}`}>
          {isFasting ? "Tap to end fast" : "Tap to start fast"}
        </p>

        {/* Live stats during fast */}
        {isFasting && (
          <motion.div className="grid grid-cols-3 gap-4 mt-6 w-full" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center p-3 rounded-xl bg-secondary/40">
              <Flame className="w-4 h-4 text-warning mx-auto mb-1" />
              <p className="text-sm font-bold font-display text-foreground">{estimatedCalories}</p>
              <p className="text-[9px] text-muted-foreground font-body">kcal burned</p>
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

        {/* Start time info */}
        {isFasting && fastStartTime && (
          <p className="text-[10px] text-muted-foreground font-body mt-3">
            Started: {formatDateShort(fastStartTime)}
          </p>
        )}
      </motion.div>

      {/* Fasting stages timeline */}
      {isFasting && (
        <motion.div className="glass-card p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 className="text-sm font-semibold font-display text-foreground mb-3">Fasting Stages</h3>
          <div className="space-y-2">
            {FASTING_STAGES.filter((s) => s.hours <= Math.max(selectedProtocol.fastHours, 24)).map((stage) => {
              const reached = elapsedHours >= stage.hours;
              const isCurrent = currentStage.hours === stage.hours;
              return (
                <div key={stage.hours} className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                  isCurrent ? "bg-primary/10 ring-1 ring-primary/20" : reached ? "bg-secondary/30" : "opacity-40"
                }`}>
                  <span className="text-lg">{stage.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-xs font-semibold font-display ${reached ? "text-foreground" : "text-muted-foreground"}`}>{stage.name}</p>
                      <span className="text-[9px] text-muted-foreground font-body">{stage.hours}h+</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-body truncate">{stage.description}</p>
                  </div>
                  {reached && <Zap className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Eating / Fasting window visual (when not fasting) */}
      {!isFasting && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold font-display text-foreground mb-3">Schedule</h3>
          
          {/* Custom hours slider */}
          {selectedProtocol.protocol === "Custom" && (
            <div className="mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground font-body">Fasting Duration</span>
                <span className="text-sm font-bold font-display text-primary">{customHours}h</span>
              </div>
              <input
                type="range"
                min={1}
                max={23}
                value={customHours}
                onChange={(e) => setCustomHours(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none bg-secondary accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-muted-foreground font-body">
                <span>1h</span>
                <span>12h</span>
                <span>23h</span>
              </div>
            </div>
          )}

          <div className="h-6 rounded-full bg-secondary overflow-hidden flex mb-2">
            <div className="h-full bg-primary/30 flex items-center justify-center" style={{ width: `${(activeFastHours / 24) * 100}%` }}>
              <span className="text-[9px] font-bold text-primary font-body">FASTING</span>
            </div>
            <div className="h-full bg-success/20 flex items-center justify-center" style={{ width: `${(activeEatHours / 24) * 100}%` }}>
              <span className="text-[9px] font-bold text-success font-body">EAT</span>
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground font-body">
            <span className="flex items-center gap-1"><Moon className="w-3 h-3" /> Fast: {activeFastHours}h</span>
            <span className="flex items-center gap-1"><UtensilsCrossed className="w-3 h-3" /> Eat: {activeEatHours}h</span>
          </div>
        </div>
      )}

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

      {/* Fasting History */}
      <div>
        <h3 className="text-sm font-semibold font-display text-foreground mb-3">History</h3>
        <div className="space-y-2">
          {logs.map((log) => (
            <motion.div key={log.id} className="glass-card p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${log.completed ? "bg-success/15" : "bg-warning/15"}`}>
                    {log.completed ? <Trophy className="w-4 h-4 text-success" /> : <Clock className="w-4 h-4 text-warning" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold font-display text-foreground">{log.protocol} Fast</p>
                      {log.completed && <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-success/15 text-success">✓ Complete</span>}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-body">{formatDateShort(log.startTime)} → {log.endTime ? formatDateShort(log.endTime) : "..."}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold font-display text-foreground">{log.actualHours}h</p>
                  <p className="text-[9px] text-muted-foreground font-body">{log.caloriesBurned} kcal</p>
                </div>
              </div>
              <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${log.completed ? "bg-success/60" : "bg-warning/60"}`}
                  style={{ width: `${Math.min(100, (log.actualHours / log.targetHours) * 100)}%` }} />
              </div>
            </motion.div>
          ))}
        </div>
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
                  : ` ${(100 - progressPct).toFixed(0)}% remaining to reach your ${activeFastHours}h target.`
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

      {/* Protocol Picker Modal */}
      <AnimatePresence>
        {showProtocolPicker && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProtocolPicker(false)}>
            <motion.div className="w-full max-w-lg glass-card-strong p-6 rounded-t-3xl space-y-4"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-display text-foreground">Choose Protocol</h2>
                <button onClick={() => setShowProtocolPicker(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <div className="space-y-2">
                {PROTOCOLS.map((p) => (
                  <button key={p.protocol}
                    onClick={() => { setSelectedProtocol(p); setShowProtocolPicker(false); }}
                    className={`w-full p-4 rounded-xl text-left transition-colors ${
                      selectedProtocol.protocol === p.protocol ? "bg-primary/10 ring-1 ring-primary/30" : "bg-secondary/50 hover:bg-secondary"
                    }`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold font-display text-foreground">{p.protocol}</p>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${difficultyColor[p.difficulty]}`}>{p.difficulty}</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-body">{p.fastHours}h : {p.eatHours}h</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-body">{p.description}</p>
                  </button>
                ))}

                {/* Custom option */}
                <button
                  onClick={() => {
                    setSelectedProtocol({ protocol: "Custom", fastHours: customHours, eatHours: 24 - customHours, description: "Set your own fasting duration.", difficulty: "Beginner" });
                    setShowProtocolPicker(false);
                  }}
                  className={`w-full p-4 rounded-xl text-left transition-colors ${
                    selectedProtocol.protocol === "Custom" ? "bg-primary/10 ring-1 ring-primary/30" : "bg-secondary/50 hover:bg-secondary"
                  }`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold font-display text-foreground">Custom</p>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/15 text-primary">Flexible</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-body">{customHours}h : {24 - customHours}h</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-body">Set your own fasting hours with the slider.</p>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FastingTimer;
