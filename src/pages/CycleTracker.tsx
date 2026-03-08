import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import cycleComfortImg from "@/assets/cycle-comfort.png";
import {
  Heart, CalendarDays, Droplets, Moon, Sun, Flower2,
  ChevronLeft, ChevronRight, Plus, X, AlertCircle,
  Calendar, Clock, ChevronDown, Trash2
} from "lucide-react";
import {
  format, addDays, differenceInDays, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameDay, isWithinInterval, addMonths,
  subMonths, getDay, isBefore, isAfter
} from "date-fns";
import { toast } from "sonner";

// ── Types ──
interface CycleLog {
  id: string;
  startDate: string; // ISO string for localStorage
  endDate: string;
  duration: number;
  bloodFlow: "light" | "moderate" | "heavy";
  painLevel: "none" | "mild" | "moderate" | "severe";
  notes: string;
}

interface Symptom {
  id: string;
  date: string;
  type: string;
  severity: "mild" | "moderate" | "severe";
  note?: string;
}

// ── Storage keys ──
const CYCLES_KEY = "Cals Crumble Fit_cycles";
const SYMPTOMS_KEY = "Cals Crumble Fit_symptoms";

function loadCycles(): CycleLog[] {
  try {
    const raw = localStorage.getItem(CYCLES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveCycles(c: CycleLog[]) { localStorage.setItem(CYCLES_KEY, JSON.stringify(c)); }

function loadSymptoms(): Symptom[] {
  try {
    const raw = localStorage.getItem(SYMPTOMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveSymptoms(s: Symptom[]) { localStorage.setItem(SYMPTOMS_KEY, JSON.stringify(s)); }

// ── Constants ──
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

const BLOOD_FLOW_OPTIONS: { key: CycleLog["bloodFlow"]; label: string; emoji: string; color: string }[] = [
  { key: "light", label: "Light", emoji: "💧", color: "bg-info/15 text-info" },
  { key: "moderate", label: "Moderate", emoji: "💧💧", color: "bg-warning/15 text-warning" },
  { key: "heavy", label: "Heavy", emoji: "💧💧💧", color: "bg-destructive/15 text-destructive" },
];

const PAIN_OPTIONS: { key: CycleLog["painLevel"]; label: string; emoji: string; color: string }[] = [
  { key: "none", label: "None", emoji: "😊", color: "bg-primary/15 text-primary" },
  { key: "mild", label: "Mild", emoji: "😐", color: "bg-info/15 text-info" },
  { key: "moderate", label: "Moderate", emoji: "😣", color: "bg-warning/15 text-warning" },
  { key: "severe", label: "Severe", emoji: "😰", color: "bg-destructive/15 text-destructive" },
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// ── Component ──
const CycleTracker = () => {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today);
  const [showLogPeriod, setShowLogPeriod] = useState(false);
  const [showSymptom, setShowSymptom] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [cycles, setCycles] = useState<CycleLog[]>(loadCycles);
  const [symptoms, setSymptoms] = useState<Symptom[]>(loadSymptoms);

  // Log period form state
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [bloodFlow, setBloodFlow] = useState<CycleLog["bloodFlow"]>("moderate");
  const [painLevel, setPainLevel] = useState<CycleLog["painLevel"]>("mild");
  const [periodNotes, setPeriodNotes] = useState("");

  // Symptom form state
  const [selectedSymptom, setSelectedSymptom] = useState("");
  const [symptomSeverity, setSymptomSeverity] = useState<"mild" | "moderate" | "severe">("mild");
  const [symptomNote, setSymptomNote] = useState("");

  // Persist
  useEffect(() => { saveCycles(cycles); }, [cycles]);
  useEffect(() => { saveSymptoms(symptoms); }, [symptoms]);

  // ── Calculations ──
  const sortedCycles = [...cycles].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  const lastCycle = sortedCycles[0];

  // Average cycle length from logged data
  const avgCycleLength = sortedCycles.length >= 2
    ? Math.round(
        sortedCycles.slice(0, -1).reduce((sum, c, i) => {
          const next = sortedCycles[i + 1];
          return sum + differenceInDays(new Date(c.startDate), new Date(next.startDate));
        }, 0) / (sortedCycles.length - 1)
      )
    : 28;

  const daysSinceLastPeriod = lastCycle ? differenceInDays(today, new Date(lastCycle.startDate)) : 0;
  const currentCycleDay = lastCycle ? Math.max(1, daysSinceLastPeriod) : 0;
  const nextPeriodDate = lastCycle ? addDays(new Date(lastCycle.startDate), avgCycleLength) : today;
  const daysUntilNextPeriod = Math.max(0, differenceInDays(nextPeriodDate, today));

  const getCurrentPhase = () => {
    if (!lastCycle) return 0;
    if (currentCycleDay <= 5) return 0;
    if (currentCycleDay <= 13) return 1;
    if (currentCycleDay <= 16) return 2;
    return 3;
  };
  const currentPhaseIndex = getCurrentPhase();
  const currentPhase = PHASES[currentPhaseIndex];

  // Calendar
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const isDuringPeriod = (date: Date) =>
    cycles.some((c) => isWithinInterval(date, { start: new Date(c.startDate), end: new Date(c.endDate) }));

  // Predict future periods (next 3 cycles)
  const getPredictedPeriods = () => {
    if (!lastCycle) return [];
    const predictions: { start: Date; end: Date }[] = [];
    for (let i = 1; i <= 3; i++) {
      const start = addDays(new Date(lastCycle.startDate), avgCycleLength * i);
      const avgDuration = cycles.length > 0
        ? Math.round(cycles.reduce((s, c) => s + c.duration, 0) / cycles.length)
        : 5;
      predictions.push({ start, end: addDays(start, avgDuration - 1) });
    }
    return predictions;
  };
  const predictedPeriods = getPredictedPeriods();

  const isPredictedPeriod = (date: Date) =>
    predictedPeriods.some((p) => isWithinInterval(date, { start: p.start, end: p.end }));

  const hasSymptom = (date: Date) => symptoms.some((s) => isSameDay(new Date(s.date), date));

  // ── Actions ──
  const logPeriod = () => {
    if (!periodStart || !periodEnd) return;
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    if (isAfter(start, end)) {
      toast.error("Start date must be before end date");
      return;
    }
    const duration = differenceInDays(end, start) + 1;
    const newCycle: CycleLog = {
      id: Date.now().toString(),
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      duration,
      bloodFlow,
      painLevel,
      notes: periodNotes,
    };
    setCycles((prev) => [newCycle, ...prev]);
    setShowLogPeriod(false);
    resetPeriodForm();
    toast.success("🩸 Period logged", { description: `${duration} days · ${format(start, "MMM d")} – ${format(end, "MMM d")}` });
  };

  const resetPeriodForm = () => {
    setPeriodStart("");
    setPeriodEnd("");
    setBloodFlow("moderate");
    setPainLevel("mild");
    setPeriodNotes("");
  };

  const deleteCycle = (id: string) => {
    setCycles((prev) => prev.filter((c) => c.id !== id));
    toast("Period log removed");
  };

  const logSymptomFn = () => {
    if (!selectedSymptom) return;
    setSymptoms((prev) => [
      ...prev,
      { id: Date.now().toString(), date: today.toISOString(), type: selectedSymptom, severity: symptomSeverity, note: symptomNote || undefined },
    ]);
    setShowSymptom(false);
    setSelectedSymptom("");
    setSymptomNote("");
    toast.success("Symptom logged");
  };

  const todaySymptoms = symptoms.filter((s) => isSameDay(new Date(s.date), today));

  // Generate twinkling stars — use useMemo-like pattern with useState to keep stable across renders
  const [stars] = useState(() => {
    const colors = [
      "hsl(45 100% 88%)",
      "hsl(210 60% 90%)",
      "hsl(30 80% 85%)",
      "hsl(0 0% 95%)",
      "hsl(50 90% 80%)",
    ];
    return Array.from({ length: 70 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 10 + 6,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2,
      rotation: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-28 relative min-h-screen">
      {/* Twinkling stars background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              filter: `drop-shadow(0 0 ${star.size * 0.4}px ${star.color})`,
              transform: `rotate(${star.rotation}deg)`,
            }}
            animate={{
              opacity: [0.1, 1, 0.1],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: star.duration,
              delay: star.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <svg viewBox="0 0 24 24" width={star.size} height={star.size} fill={star.color}>
              <path d="M12 0l3.09 6.26L22 7.27l-5 4.87L18.18 19 12 15.77 5.82 19 7 12.14l-5-4.87 6.91-1.01z" />
            </svg>
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 space-y-5">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.img
              src={cycleComfortImg}
              alt="Comfort illustration"
              className="w-14 h-14 object-contain"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <div>
              <h1 className="text-xl font-bold font-display text-foreground">Cycle Tracker</h1>
              <p className="text-xs text-muted-foreground font-body">Track your menstrual cycle & understand your body</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogPeriod(true)}
            className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center hover:bg-destructive/25 transition-colors"
          >
            <Calendar className="w-5 h-5 text-destructive" />
          </button>
        </div>
      </motion.div>

      {/* Current status card */}
      {lastCycle ? (
        <motion.div className="glass-card p-5 relative overflow-hidden" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <div className="absolute -top-6 -right-6 opacity-5">
            <currentPhase.icon className="w-32 h-32 text-foreground" />
          </div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] text-muted-foreground font-body mb-1">Current Phase</p>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold font-body ${currentPhase.color}`}>
                  {currentPhase.name}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold font-display text-foreground">Day {currentCycleDay}</p>
              <p className="text-[10px] text-muted-foreground font-body">of {avgCycleLength}-day cycle</p>
            </div>
          </div>

          {/* Phase bar */}
          <div className="flex gap-1 mb-3">
            {PHASES.map((phase, i) => (
              <div key={phase.name} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-full h-2 rounded-full transition-colors ${i <= currentPhaseIndex ? phase.color.split(" ")[0] : "bg-secondary"}`} />
                <span className="text-[8px] text-muted-foreground font-body">{phase.name.slice(0, 4)}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/50 mb-4">
            <AlertCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <p className="text-[10px] text-muted-foreground font-body">{currentPhase.tip}</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2.5 rounded-xl bg-secondary/40">
              <p className="text-base font-bold font-display text-foreground">{daysUntilNextPeriod}</p>
              <p className="text-[8px] text-muted-foreground font-body">Days to next</p>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-secondary/40">
              <p className="text-base font-bold font-display text-foreground">{avgCycleLength}d</p>
              <p className="text-[8px] text-muted-foreground font-body">Avg cycle</p>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-secondary/40">
              <p className="text-base font-bold font-display text-foreground">{cycles.length}</p>
              <p className="text-[8px] text-muted-foreground font-body">Logged</p>
            </div>
          </div>

          {/* Next predicted period */}
          {predictedPeriods.length > 0 && (
            <div className="mt-3 p-3 rounded-xl bg-destructive/5 border border-destructive/10">
              <p className="text-[10px] text-muted-foreground font-body mb-1">Next predicted period</p>
              <p className="text-xs font-semibold text-foreground font-display">
                {format(predictedPeriods[0].start, "MMM d")} – {format(predictedPeriods[0].end, "MMM d, yyyy")}
              </p>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div className="glass-card-accent p-8 flex flex-col items-center text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-base font-semibold font-display text-foreground mb-1">Log your first period</h3>
          <p className="text-xs text-muted-foreground font-body max-w-[240px]">
            Tap the <span className="text-destructive font-semibold">calendar</span> icon above to log your period dates, blood flow, and pain level.
          </p>
        </motion.div>
      )}


      {/* Today's symptoms */}
      {todaySymptoms.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold font-display text-foreground mb-3">Today's Symptoms</h3>
          <div className="flex flex-wrap gap-2">
            {todaySymptoms.map((s) => (
              <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50">
                <span className="text-sm">{SYMPTOM_OPTIONS.find((o) => o.type === s.type)?.icon}</span>
                <span className="text-xs text-foreground font-body">{s.type}</span>
                <span className={`text-[8px] px-1.5 py-0.5 rounded font-body ${
                  s.severity === "severe" ? "bg-destructive/15 text-destructive" :
                  s.severity === "moderate" ? "bg-warning/15 text-warning" :
                  "bg-primary/15 text-primary"
                }`}>{s.severity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cycle History */}
      {sortedCycles.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold font-display text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" /> Period History
            </h3>
            {sortedCycles.length > 3 && (
              <button onClick={() => setShowHistory(!showHistory)} className="text-[10px] text-primary font-body">
                {showHistory ? "Show less" : `View all (${sortedCycles.length})`}
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {(showHistory ? sortedCycles : sortedCycles.slice(0, 3)).map((cycle, i) => {
              const start = new Date(cycle.startDate);
              const end = new Date(cycle.endDate);
              // Calculate gap from previous cycle
              const nextCycle = sortedCycles[i + 1];
              const cycleGap = nextCycle ? differenceInDays(start, new Date(nextCycle.startDate)) : null;

              return (
                <motion.div
                  key={cycle.id}
                  className="p-3.5 rounded-xl bg-secondary/30 space-y-2.5"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-destructive/15 flex items-center justify-center">
                        <Droplets className="w-4 h-4 text-destructive" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold font-display text-foreground">
                          {format(start, "MMM d")} – {format(end, "MMM d, yyyy")}
                        </p>
                        <p className="text-[9px] text-muted-foreground font-body">
                          {cycle.duration} days {cycleGap ? `· ${cycleGap}-day cycle` : ""}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => deleteCycle(cycle.id)} className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors">
                      <Trash2 className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 rounded-lg bg-secondary/40">
                      <p className="text-[10px] font-bold font-display text-foreground">{cycle.duration}d</p>
                      <p className="text-[7px] text-muted-foreground font-body">Duration</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-secondary/40">
                      <p className="text-[10px] font-bold font-display text-foreground capitalize">{cycle.bloodFlow}</p>
                      <p className="text-[7px] text-muted-foreground font-body">Flow</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-secondary/40">
                      <p className="text-[10px] font-bold font-display text-foreground capitalize">{cycle.painLevel}</p>
                      <p className="text-[7px] text-muted-foreground font-body">Pain</p>
                    </div>
                  </div>

                  {cycle.notes && (
                    <p className="text-[9px] text-muted-foreground font-body italic px-1">"{cycle.notes}"</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cycle Phases */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold font-display text-foreground mb-3">Cycle Phases</h3>
        <div className="space-y-2">
          {PHASES.map((phase, i) => (
            <div
              key={phase.name}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                i === currentPhaseIndex && lastCycle ? "bg-secondary/80 ring-1 ring-primary/20" : "bg-secondary/30"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${phase.color}`}>
                <phase.icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-foreground font-body">{phase.name}</p>
                  {i === currentPhaseIndex && lastCycle && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-body">Current</span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground font-body">{phase.tip}</p>
              </div>
              <span className="text-[9px] text-muted-foreground font-body">{phase.days}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Log Period Modal ── */}
      <AnimatePresence>
        {showLogPeriod && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { setShowLogPeriod(false); resetPeriodForm(); }}
          >
            <motion.div
              className="w-full max-w-lg glass-card-strong p-6 rounded-t-3xl space-y-5"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mb-4" />
                <div className="flex items-center justify-between w-full">
                  <h2 className="text-lg font-bold font-display text-foreground">Log Period</h2>
                  <button onClick={() => { setShowLogPeriod(false); resetPeriodForm(); }} className="w-8 h-8 rounded-lg bg-secondary/60 flex items-center justify-center">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground font-body mb-1.5 block">Start Date</label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full bg-secondary/60 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none font-body focus:ring-1 focus:ring-destructive/30 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-body mb-1.5 block">End Date</label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full bg-secondary/60 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none font-body focus:ring-1 focus:ring-destructive/30 transition-all"
                  />
                </div>
              </div>

              {periodStart && periodEnd && (
                <div className="text-center py-1">
                  <span className="text-xs text-muted-foreground font-body">
                    Duration: <span className="text-foreground font-semibold">{Math.max(1, differenceInDays(new Date(periodEnd), new Date(periodStart)) + 1)} days</span>
                  </span>
                </div>
              )}

              {/* Blood Flow */}
              <div>
                <label className="text-[10px] text-muted-foreground font-body mb-1.5 block">Blood Flow</label>
                <div className="grid grid-cols-3 gap-2">
                  {BLOOD_FLOW_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setBloodFlow(opt.key)}
                      className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-body transition-all ${
                        bloodFlow === opt.key ? `${opt.color} ring-1 ring-current` : "bg-secondary/60 text-muted-foreground"
                      }`}
                    >
                      <span className="text-base">{opt.emoji}</span>
                      <span className="text-[10px]">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pain Level */}
              <div>
                <label className="text-[10px] text-muted-foreground font-body mb-1.5 block">Pain Level</label>
                <div className="grid grid-cols-4 gap-2">
                  {PAIN_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setPainLevel(opt.key)}
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-body transition-all ${
                        painLevel === opt.key ? `${opt.color} ring-1 ring-current` : "bg-secondary/60 text-muted-foreground"
                      }`}
                    >
                      <span className="text-base">{opt.emoji}</span>
                      <span className="text-[9px]">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[10px] text-muted-foreground font-body mb-1.5 block">Notes (optional)</label>
                <input
                  value={periodNotes}
                  onChange={(e) => setPeriodNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  className="w-full bg-secondary/60 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none font-body focus:ring-1 focus:ring-destructive/30 transition-all"
                />
              </div>

              <button
                onClick={logPeriod}
                disabled={!periodStart || !periodEnd}
                className="w-full py-3.5 rounded-xl bg-destructive text-destructive-foreground font-semibold font-display disabled:opacity-30 active:scale-[0.98] transition-all"
              >
                Save Period
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Log Symptom Modal ── */}
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
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mb-4" />
                <div className="flex items-center justify-between w-full">
                  <h2 className="text-lg font-bold font-display text-foreground">Log Symptom</h2>
                  <button onClick={() => setShowSymptom(false)} className="w-8 h-8 rounded-lg bg-secondary/60 flex items-center justify-center">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {SYMPTOM_OPTIONS.map((opt) => (
                  <button
                    key={opt.type}
                    onClick={() => setSelectedSymptom(opt.type)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                      selectedSymptom === opt.type ? "bg-primary/15 ring-1 ring-primary" : "bg-secondary/60"
                    }`}
                  >
                    <span className="text-lg">{opt.icon}</span>
                    <span className="text-[8px] text-muted-foreground font-body">{opt.type}</span>
                  </button>
                ))}
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground font-body mb-1.5 block">Severity</label>
                <div className="flex gap-2">
                  {(["mild", "moderate", "severe"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSymptomSeverity(s)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-medium font-body capitalize transition-all ${
                        symptomSeverity === s
                          ? s === "severe" ? "bg-destructive/20 text-destructive ring-1 ring-destructive/30" : s === "moderate" ? "bg-warning/20 text-warning ring-1 ring-warning/30" : "bg-primary/20 text-primary ring-1 ring-primary/30"
                          : "bg-secondary/60 text-muted-foreground"
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
                className="w-full bg-secondary/60 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none font-body focus:ring-1 focus:ring-warning/30 transition-all"
              />

              <button
                onClick={logSymptomFn}
                disabled={!selectedSymptom}
                className="w-full py-3.5 rounded-xl bg-warning text-primary-foreground font-semibold font-display disabled:opacity-30 active:scale-[0.98] transition-all"
              >
                Log Symptom
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </div>{/* end z-10 content wrapper */}
    </div>
  );
};

export default CycleTracker;
