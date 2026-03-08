import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, CalendarDays, Droplets, Moon, Sun, Flower2, ChevronLeft, ChevronRight, Plus, X, AlertCircle } from "lucide-react";
import { format, addDays, differenceInDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, addMonths, subMonths, getDay } from "date-fns";

interface CycleLog {
  startDate: Date;
  endDate: Date;
}

interface Symptom {
  id: string;
  date: Date;
  type: string;
  severity: "mild" | "moderate" | "severe";
  note?: string;
}

const SYMPTOM_OPTIONS = [
  { type: "Cramps", icon: "😣" },
  { type: "Headache", icon: "🤕" },
  { type: "Bloating", icon: "😤" },
  { type: "Fatigue", icon: "😴" },
  { type: "Mood Swings", icon: "🎭" },
  { type: "Cravings", icon: "🍫" },
  { type: "Back Pain", icon: "💆" },
  { type: "Acne", icon: "✨" },
];

const PHASES = [
  { name: "Menstrual", color: "bg-destructive/20 text-destructive", icon: Droplets, days: "Days 1-5", tip: "Rest more, iron-rich foods recommended" },
  { name: "Follicular", color: "bg-info/20 text-info", icon: Sun, days: "Days 6-13", tip: "Energy rising — great for intense workouts" },
  { name: "Ovulation", color: "bg-primary/20 text-primary", icon: Flower2, days: "Days 14-16", tip: "Peak energy — ideal for strength training" },
  { name: "Luteal", color: "bg-warning/20 text-warning", icon: Moon, days: "Days 17-28", tip: "Energy drops — focus on yoga, walking" },
];

const CycleTracker = () => {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today);
  const [showLogPeriod, setShowLogPeriod] = useState(false);
  const [showSymptom, setShowSymptom] = useState(false);

  const [cycles, setCycles] = useState<CycleLog[]>([]);

  const [symptoms, setSymptoms] = useState<Symptom[]>([]);

  const [periodStart, setPeriodStart] = useState<Date | null>(null);
  const [periodEnd, setPeriodEnd] = useState<Date | null>(null);
  const [selectedSymptom, setSelectedSymptom] = useState<string>("");
  const [symptomSeverity, setSymptomSeverity] = useState<"mild" | "moderate" | "severe">("mild");
  const [symptomNote, setSymptomNote] = useState("");

  // Calculate current cycle info
  const lastCycle = cycles[0];
  const avgCycleLength = 28;
  const daysSinceLastPeriod = lastCycle ? differenceInDays(today, lastCycle.startDate) : 0;
  const currentCycleDay = daysSinceLastPeriod;
  const nextPeriodDate = lastCycle ? addDays(lastCycle.startDate, avgCycleLength) : today;
  const daysUntilNextPeriod = Math.max(0, differenceInDays(nextPeriodDate, today));

  // Determine current phase
  const getCurrentPhase = () => {
    if (currentCycleDay <= 5) return 0;
    if (currentCycleDay <= 13) return 1;
    if (currentCycleDay <= 16) return 2;
    return 3;
  };
  const currentPhaseIndex = getCurrentPhase();
  const currentPhase = PHASES[currentPhaseIndex];

  // Calendar helpers
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart); // 0 = Sun

  const isDuringPeriod = (date: Date) =>
    cycles.some((c) => isWithinInterval(date, { start: c.startDate, end: c.endDate }));

  const isPredictedPeriod = (date: Date) => {
    if (!lastCycle) return false;
    const nextStart = addDays(lastCycle.startDate, avgCycleLength);
    const nextEnd = addDays(nextStart, 4);
    return isWithinInterval(date, { start: nextStart, end: nextEnd });
  };

  const hasSymptom = (date: Date) => symptoms.some((s) => isSameDay(s.date, date));

  const logPeriod = () => {
    if (!periodStart || !periodEnd) return;
    setCycles([{ startDate: periodStart, endDate: periodEnd }, ...cycles]);
    setShowLogPeriod(false);
    setPeriodStart(null);
    setPeriodEnd(null);
  };

  const logSymptom = () => {
    if (!selectedSymptom) return;
    setSymptoms([
      ...symptoms,
      { id: Date.now().toString(), date: today, type: selectedSymptom, severity: symptomSeverity, note: symptomNote || undefined },
    ]);
    setShowSymptom(false);
    setSelectedSymptom("");
    setSymptomNote("");
  };

  const todaySymptoms = symptoms.filter((s) => isSameDay(s.date, today));

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <Heart className="w-5 h-5 text-destructive" />
          <h1 className="text-2xl font-bold font-display text-foreground">Cycle Tracker</h1>
        </div>
        <p className="text-sm text-muted-foreground font-body">Track your cycle, understand your body</p>
      </motion.div>

      {/* Current status card */}
      <motion.div
        className="glass-card p-6 relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute -top-6 -right-6 opacity-5">
          <currentPhase.icon className="w-32 h-32 text-foreground" />
        </div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground font-body mb-1">Current Phase</p>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-lg text-xs font-semibold font-body ${currentPhase.color}`}>
                {currentPhase.name}
              </span>
              <span className="text-xs text-muted-foreground font-body">{currentPhase.days}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold font-display text-foreground">Day {currentCycleDay}</p>
            <p className="text-xs text-muted-foreground font-body">of cycle</p>
          </div>
        </div>

        {/* Phase progress */}
        <div className="flex gap-1 mb-3">
          {PHASES.map((phase, i) => (
            <div key={phase.name} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-full h-2 rounded-full ${i <= currentPhaseIndex ? phase.color.split(" ")[0] : "bg-secondary"}`} />
              <span className="text-[9px] text-muted-foreground font-body">{phase.name.slice(0, 4)}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50">
          <AlertCircle className="w-4 h-4 text-primary flex-shrink-0" />
          <p className="text-xs text-muted-foreground font-body">{currentPhase.tip}</p>
        </div>

        <div className="flex gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex-1 text-center">
            <p className="text-lg font-bold font-display text-foreground">{daysUntilNextPeriod}</p>
            <p className="text-[10px] text-muted-foreground font-body">Days until next period</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-lg font-bold font-display text-foreground">{avgCycleLength}</p>
            <p className="text-[10px] text-muted-foreground font-body">Avg cycle length</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-lg font-bold font-display text-foreground">{cycles.length}</p>
            <p className="text-[10px] text-muted-foreground font-body">Cycles logged</p>
          </div>
        </div>
      </motion.div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowLogPeriod(true)}
          className="glass-card p-4 flex items-center gap-3 hover:border-destructive/30 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-destructive" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold font-display text-foreground">Log Period</p>
            <p className="text-[10px] text-muted-foreground font-body">Record start & end</p>
          </div>
        </button>
        <button
          onClick={() => setShowSymptom(true)}
          className="glass-card p-4 flex items-center gap-3 hover:border-warning/30 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center">
            <Plus className="w-5 h-5 text-warning" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold font-display text-foreground">Log Symptom</p>
            <p className="text-[10px] text-muted-foreground font-body">Track how you feel</p>
          </div>
        </button>
      </div>

      {/* Calendar */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setViewMonth(subMonths(viewMonth, 1))} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <h3 className="text-sm font-semibold font-display text-foreground">{format(viewMonth, "MMMM yyyy")}</h3>
          <button onClick={() => setViewMonth(addMonths(viewMonth, 1))} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="text-center text-[10px] text-muted-foreground font-body py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {monthDays.map((day) => {
            const isToday = isSameDay(day, today);
            const isPeriod = isDuringPeriod(day);
            const isPredicted = isPredictedPeriod(day);
            const hasSym = hasSymptom(day);

            return (
              <div
                key={day.toISOString()}
                className={`relative aspect-square flex items-center justify-center rounded-lg text-xs font-medium font-body transition-colors
                  ${isToday ? "ring-1 ring-primary" : ""}
                  ${isPeriod ? "bg-destructive/25 text-destructive" : isPredicted ? "bg-destructive/10 text-destructive/60 border border-dashed border-destructive/30" : "text-foreground/70 hover:bg-secondary"}
                `}
              >
                {format(day, "d")}
                {hasSym && (
                  <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-warning" />
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-destructive/25" />
            <span className="text-[10px] text-muted-foreground font-body">Period</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border border-dashed border-destructive/30 bg-destructive/10" />
            <span className="text-[10px] text-muted-foreground font-body">Predicted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-warning" />
            <span className="text-[10px] text-muted-foreground font-body">Symptom</span>
          </div>
        </div>
      </div>

      {/* Today's symptoms */}
      {todaySymptoms.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold font-display text-foreground mb-3">Today's Symptoms</h3>
          <div className="flex flex-wrap gap-2">
            {todaySymptoms.map((s) => (
              <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50">
                <span className="text-sm">{SYMPTOM_OPTIONS.find((o) => o.type === s.type)?.icon}</span>
                <span className="text-xs text-foreground font-body">{s.type}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-body ${
                  s.severity === "severe" ? "bg-destructive/15 text-destructive" :
                  s.severity === "moderate" ? "bg-warning/15 text-warning" :
                  "bg-primary/15 text-primary"
                }`}>{s.severity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cycle phases info */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold font-display text-foreground mb-3">Cycle Phases</h3>
        <div className="space-y-3">
          {PHASES.map((phase, i) => (
            <div
              key={phase.name}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                i === currentPhaseIndex ? "bg-secondary/80 ring-1 ring-primary/20" : "bg-secondary/30"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${phase.color}`}>
                <phase.icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground font-body">{phase.name}</p>
                  {i === currentPhaseIndex && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-body">Current</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-body">{phase.tip}</p>
              </div>
              <span className="text-[10px] text-muted-foreground font-body">{phase.days}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Log Period Modal */}
      <AnimatePresence>
        {showLogPeriod && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowLogPeriod(false)}
          >
            <motion.div
              className="w-full max-w-lg glass-card-strong p-6 rounded-t-3xl space-y-4"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-display text-foreground">Log Period</h2>
                <button onClick={() => setShowLogPeriod(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground font-body mb-1 block">Start Date</label>
                  <input
                    type="date"
                    onChange={(e) => setPeriodStart(e.target.value ? new Date(e.target.value) : null)}
                    className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground outline-none font-body"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-body mb-1 block">End Date</label>
                  <input
                    type="date"
                    onChange={(e) => setPeriodEnd(e.target.value ? new Date(e.target.value) : null)}
                    className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground outline-none font-body"
                  />
                </div>
              </div>

              <button
                onClick={logPeriod}
                disabled={!periodStart || !periodEnd}
                className="w-full py-3 rounded-xl bg-destructive text-destructive-foreground font-semibold font-display disabled:opacity-40 transition-opacity"
              >
                Save Period
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log Symptom Modal */}
      <AnimatePresence>
        {showSymptom && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowSymptom(false)}
          >
            <motion.div
              className="w-full max-w-lg glass-card-strong p-6 rounded-t-3xl space-y-4"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-display text-foreground">Log Symptom</h2>
                <button onClick={() => setShowSymptom(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {SYMPTOM_OPTIONS.map((opt) => (
                  <button
                    key={opt.type}
                    onClick={() => setSelectedSymptom(opt.type)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
                      selectedSymptom === opt.type ? "bg-primary/15 ring-1 ring-primary" : "bg-secondary"
                    }`}
                  >
                    <span className="text-lg">{opt.icon}</span>
                    <span className="text-[9px] text-muted-foreground font-body">{opt.type}</span>
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-body mb-2 block">Severity</label>
                <div className="flex gap-2">
                  {(["mild", "moderate", "severe"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSymptomSeverity(s)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium font-body capitalize transition-colors ${
                        symptomSeverity === s
                          ? s === "severe" ? "bg-destructive/20 text-destructive" : s === "moderate" ? "bg-warning/20 text-warning" : "bg-primary/20 text-primary"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <input
                value={symptomNote}
                onChange={(e) => setSymptomNote(e.target.value)}
                placeholder="Add a note (optional)"
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body"
              />

              <button
                onClick={logSymptom}
                disabled={!selectedSymptom}
                className="w-full py-3 rounded-xl bg-warning text-primary-foreground font-semibold font-display disabled:opacity-40 transition-opacity"
              >
                Log Symptom
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CycleTracker;
