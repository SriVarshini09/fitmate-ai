import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, Square, Clock, Flame, TrendingUp,
  ChevronRight, Bike, Waves, Footprints, Mountain, X, Plus,
  Dumbbell, Check, Timer, Zap
} from "lucide-react";
import WorkoutDetailCard from "@/components/workout/WorkoutDetailCard";
import { useCalorieTracker, estimateActivityCalories, estimateWeightExerciseCalories } from "@/hooks/useCalorieTracker";
import { toast } from "sonner";

// ── Types ──
type SessionCategory = "cardio" | "strength";

interface SessionType {
  key: string;
  label: string;
  icon: React.ElementType;
  category: SessionCategory;
  color: string;
}

const SESSION_TYPES: SessionType[] = [
  { key: "run", label: "Running", icon: Footprints, category: "cardio", color: "bg-primary/15 text-primary" },
  { key: "walk", label: "Walking", icon: Footprints, category: "cardio", color: "bg-success/15 text-success" },
  { key: "ride", label: "Cycling", icon: Bike, category: "cardio", color: "bg-warning/15 text-warning" },
  { key: "swim", label: "Pool", icon: Waves, category: "cardio", color: "bg-info/15 text-info" },
  { key: "hike", label: "Hiking", icon: Mountain, category: "cardio", color: "bg-badge-bronze/15 text-badge-bronze" },
  { key: "interval", label: "Intervals", icon: Timer, category: "cardio", color: "bg-destructive/15 text-destructive" },
  { key: "strength", label: "Strength", icon: Dumbbell, category: "strength", color: "bg-warning/15 text-warning" },
];

interface Activity {
  id: string; type: string; title: string; date: string;
  distance: number; duration: number; calories: number;
  pace?: string; isPR?: boolean;
}

interface ExerciseSet {
  id: string; weight: number; reps: number; completed: boolean;
  isWarmup?: boolean; rpe?: number;
}

interface Exercise {
  id: string; name: string; muscleGroup: string;
  sets: ExerciseSet[]; notes?: string; caloriesBurned?: number;
}

interface Workout {
  id: string; name: string; date: string; duration: number;
  exercises: Exercise[]; totalVolume: number;
  totalCalories?: number; avgHeartRate?: number; peakHeartRate?: number;
  muscleGroupsHit?: string[];
  intensity?: "Light" | "Moderate" | "Intense" | "Max Effort";
  isActive?: boolean;
}

const EXERCISE_LIBRARY = [
  { name: "Bench Press", group: "Chest", emoji: "🏋️" },
  { name: "Incline Dumbbell Press", group: "Chest", emoji: "🏋️" },
  { name: "Cable Flyes", group: "Chest", emoji: "🦅" },
  { name: "Squat", group: "Legs", emoji: "🦵" },
  { name: "Leg Press", group: "Legs", emoji: "🦵" },
  { name: "Lunges", group: "Legs", emoji: "🏃" },
  { name: "Leg Curl", group: "Legs", emoji: "🦵" },
  { name: "Calf Raises", group: "Legs", emoji: "🦵" },
  { name: "Deadlift", group: "Back", emoji: "💪" },
  { name: "Barbell Row", group: "Back", emoji: "🚣" },
  { name: "Pull-ups", group: "Back", emoji: "🧗" },
  { name: "Lat Pulldown", group: "Back", emoji: "🔽" },
  { name: "Overhead Press", group: "Shoulders", emoji: "🙆" },
  { name: "Shoulder Lateral Raise", group: "Shoulders", emoji: "🤷" },
  { name: "Face Pulls", group: "Shoulders", emoji: "🎯" },
  { name: "Bicep Curls", group: "Arms", emoji: "💪" },
  { name: "Hammer Curls", group: "Arms", emoji: "🔨" },
  { name: "Tricep Dips", group: "Arms", emoji: "🤸" },
  { name: "Tricep Pushdown", group: "Arms", emoji: "⬇️" },
  { name: "Plank", group: "Core", emoji: "🧱" },
  { name: "Russian Twist", group: "Core", emoji: "🌀" },
  { name: "Cable Crunch", group: "Core", emoji: "🔄" },
];

const MUSCLE_GROUPS = ["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core"];

const TEMPLATES = [
  { name: "Push Day", exercises: ["Bench Press", "Overhead Press", "Cable Flyes", "Tricep Dips", "Shoulder Lateral Raise"] },
  { name: "Pull Day", exercises: ["Deadlift", "Barbell Row", "Lat Pulldown", "Bicep Curls", "Hammer Curls"] },
  { name: "Leg Day", exercises: ["Squat", "Leg Press", "Lunges", "Leg Curl", "Calf Raises"] },
  { name: "Upper Body", exercises: ["Bench Press", "Barbell Row", "Overhead Press", "Bicep Curls", "Tricep Pushdown"] },
  { name: "Full Body", exercises: ["Squat", "Bench Press", "Deadlift", "Overhead Press", "Pull-ups"] },
];

const sampleActivities: Activity[] = [
  { id: "a1", type: "run", title: "Morning Run", date: "Today, 7:15 AM", distance: 5.2, duration: 28, calories: 420, pace: "5:23/km", isPR: true },
  { id: "a2", type: "ride", title: "Evening Cycle", date: "Yesterday, 6:00 PM", distance: 22.5, duration: 55, calories: 580, pace: "24.5 km/h" },
  { id: "a3", type: "swim", title: "Pool Session", date: "Mar 6, 12:00 PM", distance: 1.5, duration: 40, calories: 350, pace: "2:40/100m" },
];

const sampleWorkouts: Workout[] = [
  { id: "w1", name: "Push Day", date: "Today", duration: 58, totalVolume: 12450, totalCalories: 380, intensity: "Intense", muscleGroupsHit: ["Chest", "Shoulders", "Arms"], exercises: [
    { id: "e1", name: "Bench Press", muscleGroup: "Chest", caloriesBurned: 120, sets: [{ id: "s1", weight: 80, reps: 8, completed: true, rpe: 7 }, { id: "s2", weight: 85, reps: 6, completed: true, rpe: 8 }, { id: "s3", weight: 85, reps: 6, completed: true, rpe: 9 }] },
    { id: "e2", name: "Overhead Press", muscleGroup: "Shoulders", caloriesBurned: 95, sets: [{ id: "s5", weight: 50, reps: 8, completed: true, rpe: 7 }, { id: "s6", weight: 55, reps: 6, completed: true, rpe: 8 }] },
  ]},
  { id: "w2", name: "Pull Day", date: "Yesterday", duration: 62, totalVolume: 10800, totalCalories: 410, intensity: "Intense", muscleGroupsHit: ["Back", "Arms"], exercises: [
    { id: "e4", name: "Deadlift", muscleGroup: "Back", caloriesBurned: 150, sets: [{ id: "s11", weight: 120, reps: 5, completed: true, rpe: 8 }, { id: "s12", weight: 130, reps: 3, completed: true, rpe: 9 }] },
    { id: "e5", name: "Barbell Row", muscleGroup: "Back", caloriesBurned: 110, sets: [{ id: "s14", weight: 70, reps: 8, completed: true, rpe: 7 }] },
  ]},
];

const formatDuration = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const Training = () => {
  const { logBurned, bodyWeight } = useCalorieTracker();

  // ── State ──
  const [showSessionPicker, setShowSessionPicker] = useState(false);
  const [activities] = useState(sampleActivities);
  const [showTimer, setShowTimer] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerType, setTimerType] = useState("run");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [workouts] = useState(sampleWorkouts);
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [showNewWorkout, setShowNewWorkout] = useState(false);
  const [showExerciseLib, setShowExerciseLib] = useState(false);
  const [filterGroup, setFilterGroup] = useState("All");
  const [searchEx, setSearchEx] = useState("");
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [restTimer, setRestTimer] = useState(0);
  const [restRunning, setRestRunning] = useState(false);
  const [restDuration, setRestDuration] = useState(90);
  const [activeWorkoutSeconds, setActiveWorkoutSeconds] = useState(0);
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const workoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [tab, setTab] = useState<"cardio" | "strength">("strength");

  // ── Effects ──
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  useEffect(() => {
    if (restRunning && restTimer > 0) {
      restIntervalRef.current = setInterval(() => {
        setRestTimer(t => { if (t <= 1) { setRestRunning(false); return 0; } return t - 1; });
      }, 1000);
    }
    return () => { if (restIntervalRef.current) clearInterval(restIntervalRef.current); };
  }, [restRunning, restTimer]);

  useEffect(() => {
    if (activeWorkout) {
      workoutTimerRef.current = setInterval(() => setActiveWorkoutSeconds(s => s + 1), 1000);
    } else { setActiveWorkoutSeconds(0); }
    return () => { if (workoutTimerRef.current) clearInterval(workoutTimerRef.current); };
  }, [activeWorkout]);

  // ── Handlers ──
  const handleSessionSelect = (key: string) => {
    const session = SESSION_TYPES.find(s => s.key === key);
    if (!session) return;
    setShowSessionPicker(false);
    if (session.category === "strength") {
      setShowNewWorkout(true);
    } else {
      setTimerType(key);
      setTimerSeconds(0);
      setTimerRunning(false);
      setShowTimer(true);
    }
  };

  const stopCardioTimer = () => {
    const durationMinutes = Math.round(timerSeconds / 60);
    if (durationMinutes > 0) {
      const calories = estimateActivityCalories(timerType, durationMinutes, bodyWeight);
      const typeLabel = SESSION_TYPES.find(a => a.key === timerType)?.label || timerType;
      logBurned({ source: "activity", name: typeLabel, calories, duration: durationMinutes });
      toast.success(`${typeLabel} complete! ${calories} kcal burned 🔥`);
    }
    setTimerRunning(false);
    setTimerSeconds(0);
    setShowTimer(false);
  };

  const startFromTemplate = (template: typeof TEMPLATES[0]) => {
    const exercises: Exercise[] = template.exercises.map((name, i) => ({
      id: `new-e-${i}`, name,
      muscleGroup: EXERCISE_LIBRARY.find(e => e.name === name)?.group || "",
      sets: [
        { id: `new-s-${i}-1`, weight: 0, reps: 0, completed: false },
        { id: `new-s-${i}-2`, weight: 0, reps: 0, completed: false },
        { id: `new-s-${i}-3`, weight: 0, reps: 0, completed: false },
      ],
    }));
    setActiveWorkout({ id: Date.now().toString(), name: template.name, date: "Now", duration: 0, exercises, totalVolume: 0, isActive: true });
    setShowNewWorkout(false);
  };

  const toggleSet = (exId: string, setId: string) => {
    if (!activeWorkout) return;
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map(ex =>
        ex.id === exId ? { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, completed: !s.completed } : s) } : ex
      ),
    });
  };

  const updateSet = (exId: string, setId: string, field: "weight" | "reps", value: number) => {
    if (!activeWorkout) return;
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map(ex =>
        ex.id === exId ? { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s) } : ex
      ),
    });
  };

  const addSet = (exId: string) => {
    if (!activeWorkout) return;
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map(ex =>
        ex.id === exId ? { ...ex, sets: [...ex.sets, { id: `s-${Date.now()}`, weight: 0, reps: 0, completed: false }] } : ex
      ),
    });
  };

  const addExerciseToWorkout = (exerciseName: string) => {
    if (!activeWorkout) return;
    const lib = EXERCISE_LIBRARY.find(e => e.name === exerciseName);
    const newEx: Exercise = {
      id: `ex-${Date.now()}`, name: exerciseName,
      muscleGroup: lib?.group || "",
      sets: [
        { id: `s-${Date.now()}-1`, weight: 0, reps: 0, completed: false },
        { id: `s-${Date.now()}-2`, weight: 0, reps: 0, completed: false },
        { id: `s-${Date.now()}-3`, weight: 0, reps: 0, completed: false },
      ],
    };
    setActiveWorkout({ ...activeWorkout, exercises: [...activeWorkout.exercises, newEx] });
    setShowExerciseLib(false);
  };

  const finishWorkout = () => {
    if (!activeWorkout) return;
    const totalCals = activeWorkout.exercises.reduce((sum, ex) => {
      const completedSets = ex.sets.filter(s => s.completed).map(s => ({ weight: s.weight, reps: s.reps }));
      return sum + (completedSets.length > 0 ? estimateWeightExerciseCalories(ex.name, completedSets, bodyWeight) : 0);
    }, 0);
    logBurned({ source: "workout", name: activeWorkout.name, calories: totalCals, duration: Math.round(activeWorkoutSeconds / 60) });
    toast.success(`${activeWorkout.name} complete! ${totalCals} kcal burned 🔥`);
    setActiveWorkout(null);
  };

  const startRest = () => { setRestTimer(restDuration); setRestRunning(true); };

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const activeVolume = activeWorkout
    ? activeWorkout.exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).reduce((s, set) => s + set.weight * set.reps, 0), 0) : 0;
  const activeCompletedSets = activeWorkout ? activeWorkout.exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0) : 0;
  const activeTotalSets = activeWorkout ? activeWorkout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0) : 0;
  const activeCalories = activeWorkout
    ? activeWorkout.exercises.reduce((sum, ex) => {
        const cs = ex.sets.filter(s => s.completed).map(s => ({ weight: s.weight, reps: s.reps }));
        return sum + (cs.length > 0 ? estimateWeightExerciseCalories(ex.name, cs, bodyWeight) : 0);
      }, 0) : 0;

  const filteredExercises = EXERCISE_LIBRARY.filter(e =>
    (filterGroup === "All" || e.group === filterGroup) && e.name.toLowerCase().includes(searchEx.toLowerCase())
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display text-foreground">Training</h1>
          <p className="text-xs text-muted-foreground font-body">Track your workouts</p>
        </div>
        <button onClick={() => setShowSessionPicker(true)} className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center glow-primary">
          <Plus className="w-5 h-5 text-primary-foreground" />
        </button>
      </motion.div>

      {/* Simple tab switch */}
      <div className="flex rounded-xl bg-secondary/50 p-1">
        {(["strength", "cardio"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-lg text-xs font-medium font-body transition-all capitalize ${
              tab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
            }`}>
            {t === "strength" ? "🏋️ Strength" : "🏃 Cardio"}
          </button>
        ))}
      </div>

      {/* Rest Timer (floating) */}
      <AnimatePresence>
        {restTimer > 0 && (
          <motion.div className="glass-card p-3 flex items-center justify-between ring-1 ring-primary/20"
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-primary" />
              <div>
                <p className="text-[10px] text-muted-foreground font-body">Rest</p>
                <p className="text-lg font-bold font-display text-foreground tabular-nums">
                  {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, "0")}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setRestRunning(!restRunning)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                {restRunning ? <Pause className="w-3.5 h-3.5 text-foreground" /> : <Play className="w-3.5 h-3.5 text-foreground" />}
              </button>
              <button onClick={() => { setRestTimer(0); setRestRunning(false); }} className="w-9 h-9 rounded-xl bg-destructive/15 flex items-center justify-center">
                <X className="w-3.5 h-3.5 text-destructive" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ STRENGTH TAB ═══ */}
      {tab === "strength" && (
        <div className="space-y-4">
          {/* Active Workout */}
          {activeWorkout && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold font-display text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  {activeWorkout.name}
                </p>
                <button onClick={finishWorkout} className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium font-body">
                  Finish
                </button>
              </div>

              {/* Live stats */}
              <div className="glass-card p-3 ring-1 ring-primary/15">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <Dumbbell className="w-3.5 h-3.5 text-warning mx-auto mb-0.5" />
                    <p className="text-sm font-bold font-display text-foreground">{(activeVolume / 1000).toFixed(1)}k</p>
                    <p className="text-[8px] text-muted-foreground font-body">Volume</p>
                  </div>
                  <div className="text-center">
                    <Flame className="w-3.5 h-3.5 text-destructive mx-auto mb-0.5" />
                    <p className="text-sm font-bold font-display text-foreground">{activeCalories}</p>
                    <p className="text-[8px] text-muted-foreground font-body">kcal</p>
                  </div>
                  <div className="text-center">
                    <TrendingUp className="w-3.5 h-3.5 text-success mx-auto mb-0.5" />
                    <p className="text-sm font-bold font-display text-foreground">{activeCompletedSets}/{activeTotalSets}</p>
                    <p className="text-[8px] text-muted-foreground font-body">Sets</p>
                  </div>
                </div>
              </div>

              {/* Exercise cards — clean & simple */}
              {activeWorkout.exercises.map(ex => (
                <div key={ex.id} className="glass-card p-4 space-y-3">
                  <p className="text-sm font-semibold font-display text-foreground">{ex.name}</p>
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-[10px] text-muted-foreground font-body px-1">
                      <span className="col-span-1">#</span>
                      <span className="col-span-4">kg</span>
                      <span className="col-span-4">Reps</span>
                      <span className="col-span-3 text-center">✓</span>
                    </div>
                    {ex.sets.map((set, si) => (
                      <div key={set.id} className={`grid grid-cols-12 gap-2 items-center ${set.completed ? "opacity-50" : ""}`}>
                        <span className="col-span-1 text-xs text-muted-foreground font-body">{si + 1}</span>
                        <input type="number" value={set.weight || ""} onChange={e => updateSet(ex.id, set.id, "weight", parseFloat(e.target.value) || 0)}
                          className="col-span-4 bg-secondary rounded-lg px-2 py-2 text-sm text-foreground outline-none font-body text-center" placeholder="0" />
                        <input type="number" value={set.reps || ""} onChange={e => updateSet(ex.id, set.id, "reps", parseInt(e.target.value) || 0)}
                          className="col-span-4 bg-secondary rounded-lg px-2 py-2 text-sm text-foreground outline-none font-body text-center" placeholder="0" />
                        <div className="col-span-3 flex justify-center">
                          <button onClick={() => { toggleSet(ex.id, set.id); if (!set.completed) startRest(); }}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${set.completed ? "bg-primary/20" : "bg-secondary"}`}>
                            <Check className={`w-4 h-4 ${set.completed ? "text-primary" : "text-muted-foreground"}`} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => addSet(ex.id)} className="text-xs text-primary font-body flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Set
                  </button>
                </div>
              ))}

              <button onClick={() => setShowExerciseLib(true)} className="w-full py-3 rounded-xl bg-secondary/60 text-foreground font-medium font-body text-sm flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Exercise
              </button>

              {/* Quick rest presets */}
              <div className="flex gap-2">
                {[60, 90, 120, 180].map(s => (
                  <button key={s} onClick={() => { setRestDuration(s); setRestTimer(s); setRestRunning(true); }}
                    className={`flex-1 py-2 rounded-xl text-xs font-body transition-colors ${restDuration === s ? "bg-primary/15 text-primary" : "bg-secondary/50 text-muted-foreground"}`}>
                    {s < 120 ? `${s}s` : `${s / 60}m`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Strength history — only when no active workout */}
          {!activeWorkout && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground font-body uppercase tracking-wider">Recent Workouts</p>
              {workouts.map((workout, i) => (
                <WorkoutDetailCard key={workout.id} workout={workout} isExpanded={expandedWorkout === workout.id}
                  onToggle={() => setExpandedWorkout(expandedWorkout === workout.id ? null : workout.id)}
                  onRepeat={w => startFromTemplate({ name: w.name, exercises: w.exercises.map(e => e.name) })}
                  index={i} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ CARDIO TAB ═══ */}
      {tab === "cardio" && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground font-body uppercase tracking-wider">Recent Activities</p>
          {activities.map((activity, i) => {
            const typeInfo = SESSION_TYPES.find(t => t.key === activity.type);
            return (
              <motion.div key={activity.id} className={`glass-card p-4 ${activity.isPR ? "ring-1 ring-badge-gold/30" : ""}`}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${typeInfo?.color || "bg-secondary"} flex items-center justify-center shrink-0`}>
                    {typeInfo && <typeInfo.icon className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold font-display text-foreground truncate">{activity.title}</p>
                      {activity.isPR && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-badge-gold/15 text-badge-gold">PR</span>}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-body">{activity.date}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-3">
                  <div className="text-center p-2 rounded-lg bg-secondary/40">
                    <p className="text-xs font-bold font-display text-foreground">{activity.distance}</p>
                    <p className="text-[8px] text-muted-foreground font-body">km</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-secondary/40">
                    <p className="text-xs font-bold font-display text-foreground">{formatDuration(activity.duration)}</p>
                    <p className="text-[8px] text-muted-foreground font-body">time</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-secondary/40">
                    <p className="text-xs font-bold font-display text-foreground">{activity.pace || "--"}</p>
                    <p className="text-[8px] text-muted-foreground font-body">pace</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-secondary/40">
                    <p className="text-xs font-bold font-display text-foreground">{activity.calories}</p>
                    <p className="text-[8px] text-muted-foreground font-body">kcal</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Session Picker ── */}
      <AnimatePresence>
        {showSessionPicker && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSessionPicker(false)}>
            <motion.div className="w-full max-w-lg glass-card-strong p-6 rounded-t-3xl space-y-5"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-display text-foreground">Start Session</h2>
                <button onClick={() => setShowSessionPicker(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>

              <div>
                <p className="text-[10px] font-medium text-muted-foreground font-body mb-2 uppercase tracking-wider">Cardio</p>
                <div className="grid grid-cols-3 gap-2">
                  {SESSION_TYPES.filter(s => s.category === "cardio").map(s => (
                    <button key={s.key} onClick={() => handleSessionSelect(s.key)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                      <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}>
                        <s.icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-medium text-foreground font-body">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-medium text-muted-foreground font-body mb-2 uppercase tracking-wider">Strength</p>
                <button onClick={() => handleSessionSelect("strength")}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-warning" />
                  </div>
                  <span className="text-sm font-medium text-foreground font-body">Start Strength Workout</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cardio Timer Overlay ── */}
      <AnimatePresence>
        {showTimer && (
          <motion.div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button onClick={stopCardioTimer} className="absolute top-6 right-6"><X className="w-6 h-6 text-muted-foreground" /></button>

            <p className="text-sm text-muted-foreground font-body mb-4 capitalize">{SESSION_TYPES.find(s => s.key === timerType)?.label}</p>

            <motion.p className="text-6xl font-bold font-display text-foreground mb-8 tabular-nums"
              animate={{ scale: timerRunning ? [1, 1.02, 1] : 1 }}
              transition={{ duration: 1, repeat: timerRunning ? Infinity : 0 }}>
              {formatTimer(timerSeconds)}
            </motion.p>

            <div className="flex gap-6">
              <button onClick={() => setTimerRunning(!timerRunning)}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-primary-foreground ${timerRunning ? "bg-warning" : "bg-primary glow-primary"}`}>
                {timerRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
              </button>
              {timerSeconds > 0 && (
                <button onClick={stopCardioTimer} className="w-20 h-20 rounded-full bg-destructive flex items-center justify-center">
                  <Square className="w-7 h-7 text-destructive-foreground" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Template Picker ── */}
      <AnimatePresence>
        {showNewWorkout && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNewWorkout(false)}>
            <motion.div className="w-full max-w-lg glass-card-strong p-6 rounded-t-3xl space-y-4"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-display text-foreground">Choose Workout</h2>
                <button onClick={() => setShowNewWorkout(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <div className="space-y-2">
                {TEMPLATES.map(t => (
                  <button key={t.name} onClick={() => startFromTemplate(t)}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                    <div className="text-left">
                      <p className="text-sm font-semibold font-display text-foreground">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground font-body mt-0.5">{t.exercises.length} exercises</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
              <button onClick={() => startFromTemplate({ name: "Custom Workout", exercises: [] })}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold font-display text-sm glow-primary">
                Empty Workout
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Exercise Library ── */}
      <AnimatePresence>
        {showExerciseLib && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowExerciseLib(false)}>
            <motion.div className="w-full max-w-lg glass-card-strong p-6 rounded-t-3xl space-y-4 max-h-[80vh] overflow-y-auto scrollbar-hide"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-display text-foreground">Add Exercise</h2>
                <button onClick={() => setShowExerciseLib(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <input value={searchEx} onChange={e => setSearchEx(e.target.value)} placeholder="Search exercises..."
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body" />
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                {MUSCLE_GROUPS.map(g => (
                  <button key={g} onClick={() => setFilterGroup(g)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap font-body transition-colors ${
                      filterGroup === g ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}>{g}</button>
                ))}
              </div>
              <div className="space-y-1.5">
                {filteredExercises.map(ex => (
                  <button key={ex.name} onClick={() => addExerciseToWorkout(ex.name)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/40 hover:bg-secondary transition-colors text-left">
                    <span className="text-lg">{ex.emoji}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground font-body">{ex.name}</p>
                      <p className="text-[10px] text-muted-foreground font-body">{ex.group}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Training;
