import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell, Plus, X, Check, ChevronRight, Clock, Flame, TrendingUp,
  RotateCcw, Play, Pause, Square, Trophy, Calendar
} from "lucide-react";
import WorkoutDetailCard from "@/components/workout/WorkoutDetailCard";
import { useCalorieTracker, estimateWeightExerciseCalories } from "@/hooks/useCalorieTracker";
import { toast } from "sonner";

interface ExerciseSet {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
  isWarmup?: boolean;
  rpe?: number;
}

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  sets: ExerciseSet[];
  notes?: string;
  caloriesBurned?: number;
}

interface Workout {
  id: string;
  name: string;
  date: string;
  duration: number;
  exercises: Exercise[];
  totalVolume: number;
  totalCalories?: number;
  avgHeartRate?: number;
  peakHeartRate?: number;
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

const WORKOUTS_KEY = "vitalflow_workouts";

function loadWorkouts(): Workout[] {
  try {
    const raw = localStorage.getItem(WORKOUTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveWorkouts(workouts: Workout[]) {
  localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
}

const TEMPLATES = [
  { name: "Push Day", exercises: ["Bench Press", "Overhead Press", "Cable Flyes", "Tricep Dips", "Shoulder Lateral Raise"] },
  { name: "Pull Day", exercises: ["Deadlift", "Barbell Row", "Lat Pulldown", "Bicep Curls", "Hammer Curls"] },
  { name: "Leg Day", exercises: ["Squat", "Leg Press", "Lunges", "Leg Curl", "Calf Raises"] },
  { name: "Upper Body", exercises: ["Bench Press", "Barbell Row", "Overhead Press", "Bicep Curls", "Tricep Pushdown"] },
  { name: "Full Body", exercises: ["Squat", "Bench Press", "Deadlift", "Overhead Press", "Pull-ups"] },
];

const WorkoutLogger = () => {
  const [workouts, setWorkouts] = useState<Workout[]>(loadWorkouts);
  const [showNewWorkout, setShowNewWorkout] = useState(false);
  const [showExerciseLib, setShowExerciseLib] = useState(false);
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [filterGroup, setFilterGroup] = useState("All");
  const [searchEx, setSearchEx] = useState("");
  const { logBurned, bodyWeight } = useCalorieTracker();

  // Active workout state
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [restTimer, setRestTimer] = useState(0);
  const [restRunning, setRestRunning] = useState(false);
  const [restDuration, setRestDuration] = useState(90);
  const [activeWorkoutSeconds, setActiveWorkoutSeconds] = useState(0);
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const workoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (restRunning && restTimer > 0) {
      restIntervalRef.current = setInterval(() => {
        setRestTimer((t) => {
          if (t <= 1) { setRestRunning(false); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (restIntervalRef.current) clearInterval(restIntervalRef.current); };
  }, [restRunning, restTimer]);

  useEffect(() => {
    if (activeWorkout) {
      workoutTimerRef.current = setInterval(() => {
        setActiveWorkoutSeconds((s) => s + 1);
      }, 1000);
    } else {
      setActiveWorkoutSeconds(0);
    }
    return () => { if (workoutTimerRef.current) clearInterval(workoutTimerRef.current); };
  }, [activeWorkout]);

  const startRest = () => { setRestTimer(restDuration); setRestRunning(true); };

  const startFromTemplate = (template: typeof TEMPLATES[0]) => {
    const exercises: Exercise[] = template.exercises.map((name, i) => ({
      id: `new-e-${i}`, name,
      muscleGroup: EXERCISE_LIBRARY.find((e) => e.name === name)?.group || "",
      sets: [
        { id: `new-s-${i}-1`, weight: 0, reps: 0, completed: false },
        { id: `new-s-${i}-2`, weight: 0, reps: 0, completed: false },
        { id: `new-s-${i}-3`, weight: 0, reps: 0, completed: false },
      ],
    }));
    setActiveWorkout({
      id: Date.now().toString(), name: template.name, date: "Now", duration: 0,
      exercises, totalVolume: 0, isActive: true,
    });
    setShowNewWorkout(false);
  };

  const toggleSet = (exId: string, setId: string) => {
    if (!activeWorkout) return;
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((ex) =>
        ex.id === exId
          ? { ...ex, sets: ex.sets.map((s) => s.id === setId ? { ...s, completed: !s.completed } : s) }
          : ex
      ),
    });
  };

  const updateSet = (exId: string, setId: string, field: "weight" | "reps", value: number) => {
    if (!activeWorkout) return;
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((ex) =>
        ex.id === exId
          ? { ...ex, sets: ex.sets.map((s) => s.id === setId ? { ...s, [field]: value } : s) }
          : ex
      ),
    });
  };

  const addSet = (exId: string) => {
    if (!activeWorkout) return;
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((ex) =>
        ex.id === exId
          ? { ...ex, sets: [...ex.sets, { id: `s-${Date.now()}`, weight: 0, reps: 0, completed: false }] }
          : ex
      ),
    });
  };

  // Compute PRs from real workout history
  const prData = (() => {
    const prMap: Record<string, { weight: number; reps: number; date: string }> = {};
    workouts.forEach((w) => {
      w.exercises?.forEach((ex) => {
        ex.sets?.forEach((s) => {
          if (s.completed && s.weight > 0) {
            const existing = prMap[ex.name];
            if (!existing || s.weight > existing.weight || (s.weight === existing.weight && s.reps > existing.reps)) {
              prMap[ex.name] = { weight: s.weight, reps: s.reps, date: w.date };
            }
          }
        });
      });
    });
    return Object.entries(prMap).map(([exercise, v]) => ({
      exercise,
      weight: `${v.weight} kg`,
      reps: `${v.reps}`,
      date: v.date,
    }));
  })();

  const totalWorkouts = workouts.length;
  const totalVolume = workouts.reduce((s, w) => s + w.totalVolume, 0);
  const totalCalories = workouts.reduce((s, w) => s + (w.totalCalories || 0), 0);

  const filteredExercises = EXERCISE_LIBRARY.filter((e) =>
    (filterGroup === "All" || e.group === filterGroup) &&
    e.name.toLowerCase().includes(searchEx.toLowerCase())
  );

  const formatActiveTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Calculate active workout stats
  const activeVolume = activeWorkout
    ? activeWorkout.exercises.reduce((sum, ex) =>
        sum + ex.sets.filter((s) => s.completed).reduce((s, set) => s + set.weight * set.reps, 0), 0)
    : 0;
  const activeCompletedSets = activeWorkout
    ? activeWorkout.exercises.reduce((sum, ex) => sum + ex.sets.filter((s) => s.completed).length, 0)
    : 0;
  const activeTotalSets = activeWorkout
    ? activeWorkout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
    : 0;
  const activeCalories = activeWorkout
    ? activeWorkout.exercises.reduce((sum, ex) => {
        const completedSetsData = ex.sets.filter(s => s.completed).map(s => ({ weight: s.weight, reps: s.reps }));
        return sum + (completedSetsData.length > 0 ? estimateWeightExerciseCalories(ex.name, completedSetsData, bodyWeight) : 0);
      }, 0)
    : 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Dumbbell className="w-5 h-5 text-warning" />
            <h1 className="text-2xl font-bold font-display text-foreground">Workouts</h1>
          </div>
          <p className="text-sm text-muted-foreground font-body">
            {totalWorkouts} this week · {(totalVolume / 1000).toFixed(1)}k kg · {totalCalories} kcal
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowExerciseLib(true)} className="w-10 h-10 rounded-xl glass-card flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-muted-foreground" />
          </button>
          <button onClick={() => setShowNewWorkout(true)} className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-primary">
            <Plus className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
      </motion.div>

      {/* PRs */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold font-display text-foreground mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-badge-gold" /> Strength PRs
        </h3>
        <div className="space-y-2">
          {prData.map((pr) => (
            <div key={pr.exercise} className="flex items-center justify-between p-2 rounded-lg bg-secondary/40">
              <span className="text-sm font-medium text-foreground font-body">{pr.exercise}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold font-display text-primary">{pr.weight} × {pr.reps}</span>
                <span className="text-[10px] text-muted-foreground font-body">{pr.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rest Timer */}
      {restTimer > 0 && (
        <motion.div className="glass-card p-4 flex items-center justify-between ring-1 ring-primary/30"
          initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground font-body">Rest Timer</p>
              <p className="text-2xl font-bold font-display text-foreground tabular-nums">
                {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, "0")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setRestRunning(!restRunning)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              {restRunning ? <Pause className="w-4 h-4 text-foreground" /> : <Play className="w-4 h-4 text-foreground" />}
            </button>
            <button onClick={() => { setRestTimer(0); setRestRunning(false); }} className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center">
              <X className="w-4 h-4 text-destructive" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Active workout */}
      {activeWorkout && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold font-display text-primary flex items-center gap-2">
              <Play className="w-4 h-4" /> {activeWorkout.name} — Active
            </h3>
            <button onClick={() => {
              const durationMins = Math.round(activeWorkoutSeconds / 60);
              const totalCals = activeWorkout.exercises.reduce((sum, ex) => {
                const completedSets = ex.sets.filter(s => s.completed).map(s => ({ weight: s.weight, reps: s.reps }));
                return sum + (completedSets.length > 0 ? estimateWeightExerciseCalories(ex.name, completedSets, bodyWeight) : 0);
              }, 0);
              const totalVol = activeWorkout.exercises.reduce((sum, ex) =>
                sum + ex.sets.filter(s => s.completed).reduce((s, set) => s + set.weight * set.reps, 0), 0);
              const finished = {
                ...activeWorkout,
                date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                duration: durationMins,
                totalVolume: totalVol,
                totalCalories: totalCals,
                isActive: false,
              };
              setWorkouts(prev => {
                const updated = [finished, ...prev];
                saveWorkouts(updated);
                return updated;
              });
              logBurned({
                source: "workout",
                name: activeWorkout.name,
                calories: totalCals || activeCalories,
                duration: durationMins,
              });
              toast.success(`${activeWorkout.name} complete! ${totalCals} kcal burned 🔥`);
              setActiveWorkout(null);
            }} className="text-xs text-primary font-body hover:underline">
              Finish
            </button>
          </div>

          {/* Active workout live stats */}
          <div className="glass-card p-4 ring-1 ring-primary/20">
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center">
                <Clock className="w-3.5 h-3.5 text-primary mx-auto mb-0.5" />
                <p className="text-sm font-bold font-display text-foreground tabular-nums">{formatActiveTime(activeWorkoutSeconds)}</p>
                <p className="text-[8px] text-muted-foreground font-body">Duration</p>
              </div>
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

          {activeWorkout.exercises.map((ex) => (
            <div key={ex.id} className="glass-card p-4 ring-1 ring-primary/20">
              <p className="text-sm font-semibold font-display text-foreground mb-3">{ex.name}</p>
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-[10px] text-muted-foreground font-body px-1">
                  <span className="col-span-1">Set</span>
                  <span className="col-span-4">Weight (kg)</span>
                  <span className="col-span-4">Reps</span>
                  <span className="col-span-3 text-center">Done</span>
                </div>
                {ex.sets.map((set, si) => (
                  <div key={set.id} className={`grid grid-cols-12 gap-2 items-center ${set.completed ? "opacity-60" : ""}`}>
                    <span className="col-span-1 text-xs text-muted-foreground font-body">{si + 1}</span>
                    <input type="number" value={set.weight || ""}
                      onChange={(e) => updateSet(ex.id, set.id, "weight", parseFloat(e.target.value) || 0)}
                      className="col-span-4 bg-secondary rounded-lg px-2 py-2 text-sm text-foreground outline-none font-body text-center" placeholder="0" />
                    <input type="number" value={set.reps || ""}
                      onChange={(e) => updateSet(ex.id, set.id, "reps", parseInt(e.target.value) || 0)}
                      className="col-span-4 bg-secondary rounded-lg px-2 py-2 text-sm text-foreground outline-none font-body text-center" placeholder="0" />
                    <div className="col-span-3 flex justify-center">
                      <button
                        onClick={() => { toggleSet(ex.id, set.id); if (!set.completed) startRest(); }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          set.completed ? "bg-primary/20" : "bg-secondary"
                        }`}
                      >
                        <Check className={`w-4 h-4 ${set.completed ? "text-primary" : "text-muted-foreground"}`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => addSet(ex.id)} className="mt-2 text-xs text-primary font-body hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add Set
              </button>
            </div>
          ))}

          <div className="flex gap-2">
            {[60, 90, 120, 180].map((s) => (
              <button key={s}
                onClick={() => { setRestDuration(s); setRestTimer(s); setRestRunning(true); }}
                className={`flex-1 py-2 rounded-xl text-xs font-body transition-colors ${
                  restDuration === s ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                }`}>
                {s < 120 ? `${s}s` : `${s / 60}m`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Workout history with detailed cards */}
      <div>
        <h3 className="text-sm font-semibold font-display text-foreground mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" /> History
        </h3>
        <div className="space-y-3">
          {workouts.map((workout, i) => (
            <WorkoutDetailCard
              key={workout.id}
              workout={workout}
              isExpanded={expandedWorkout === workout.id}
              onToggle={() => setExpandedWorkout(expandedWorkout === workout.id ? null : workout.id)}
              onRepeat={(w) => startFromTemplate({ name: w.name, exercises: w.exercises.map((e) => e.name) })}
              index={i}
            />
          ))}
        </div>
      </div>

      {/* New Workout Modal */}
      <AnimatePresence>
        {showNewWorkout && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNewWorkout(false)}>
            <motion.div className="w-full max-w-lg glass-card-strong p-6 rounded-t-3xl space-y-4"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-display text-foreground">Start Workout</h2>
                <button onClick={() => setShowNewWorkout(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <p className="text-xs text-muted-foreground font-body">Choose a template or start empty</p>
              <div className="space-y-2">
                {TEMPLATES.map((t) => (
                  <button key={t.name} onClick={() => startFromTemplate(t)}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                    <div className="text-left">
                      <p className="text-sm font-semibold font-display text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground font-body">{t.exercises.join(", ")}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
              <button onClick={() => startFromTemplate({ name: "Custom Workout", exercises: [] })}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold font-display glow-primary">
                Empty Workout
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise Library Modal */}
      <AnimatePresence>
        {showExerciseLib && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowExerciseLib(false)}>
            <motion.div className="w-full max-w-lg glass-card-strong p-6 rounded-t-3xl space-y-4 max-h-[80vh] overflow-y-auto scrollbar-hide"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-display text-foreground">Exercise Library</h2>
                <button onClick={() => setShowExerciseLib(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <input value={searchEx} onChange={(e) => setSearchEx(e.target.value)} placeholder="Search exercises..."
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body" />
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                {MUSCLE_GROUPS.map((g) => (
                  <button key={g} onClick={() => setFilterGroup(g)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap font-body transition-colors ${
                      filterGroup === g ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}>{g}</button>
                ))}
              </div>
              <div className="space-y-1.5">
                {filteredExercises.map((ex) => (
                  <div key={ex.name} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40">
                    <span className="text-lg">{ex.emoji}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground font-body">{ex.name}</p>
                      <p className="text-[10px] text-muted-foreground font-body">{ex.group}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkoutLogger;
