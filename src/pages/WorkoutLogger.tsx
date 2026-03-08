import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell, Plus, X, Check, ChevronRight, Clock, Flame, TrendingUp,
  RotateCcw, Play, Pause, Square, Trophy, Calendar
} from "lucide-react";

interface ExerciseSet {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
  isWarmup?: boolean;
}

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  sets: ExerciseSet[];
  notes?: string;
}

interface Workout {
  id: string;
  name: string;
  date: string;
  duration: number; // minutes
  exercises: Exercise[];
  totalVolume: number;
  isActive?: boolean;
}

const EXERCISE_LIBRARY = [
  { name: "Bench Press", group: "Chest", emoji: "🏋️" },
  { name: "Squat", group: "Legs", emoji: "🦵" },
  { name: "Deadlift", group: "Back", emoji: "💪" },
  { name: "Overhead Press", group: "Shoulders", emoji: "🙆" },
  { name: "Barbell Row", group: "Back", emoji: "🚣" },
  { name: "Pull-ups", group: "Back", emoji: "🧗" },
  { name: "Leg Press", group: "Legs", emoji: "🦵" },
  { name: "Bicep Curls", group: "Arms", emoji: "💪" },
  { name: "Tricep Dips", group: "Arms", emoji: "🤸" },
  { name: "Lunges", group: "Legs", emoji: "🏃" },
  { name: "Lat Pulldown", group: "Back", emoji: "🔽" },
  { name: "Cable Flyes", group: "Chest", emoji: "🦅" },
  { name: "Leg Curl", group: "Legs", emoji: "🦵" },
  { name: "Shoulder Lateral Raise", group: "Shoulders", emoji: "🤷" },
  { name: "Plank", group: "Core", emoji: "🧱" },
  { name: "Russian Twist", group: "Core", emoji: "🌀" },
];

const MUSCLE_GROUPS = ["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core"];

const sampleWorkouts: Workout[] = [
  {
    id: "1", name: "Push Day", date: "Today", duration: 58, totalVolume: 12450,
    exercises: [
      { id: "e1", name: "Bench Press", muscleGroup: "Chest", sets: [
        { id: "s1", weight: 80, reps: 8, completed: true },
        { id: "s2", weight: 85, reps: 6, completed: true },
        { id: "s3", weight: 85, reps: 6, completed: true },
        { id: "s4", weight: 80, reps: 8, completed: true },
      ]},
      { id: "e2", name: "Overhead Press", muscleGroup: "Shoulders", sets: [
        { id: "s5", weight: 50, reps: 8, completed: true },
        { id: "s6", weight: 55, reps: 6, completed: true },
        { id: "s7", weight: 55, reps: 5, completed: true },
      ]},
      { id: "e3", name: "Cable Flyes", muscleGroup: "Chest", sets: [
        { id: "s8", weight: 15, reps: 12, completed: true },
        { id: "s9", weight: 15, reps: 12, completed: true },
        { id: "s10", weight: 17.5, reps: 10, completed: true },
      ]},
    ],
  },
  {
    id: "2", name: "Pull Day", date: "Yesterday", duration: 62, totalVolume: 10800,
    exercises: [
      { id: "e4", name: "Deadlift", muscleGroup: "Back", sets: [
        { id: "s11", weight: 120, reps: 5, completed: true },
        { id: "s12", weight: 130, reps: 3, completed: true },
        { id: "s13", weight: 120, reps: 5, completed: true },
      ]},
      { id: "e5", name: "Barbell Row", muscleGroup: "Back", sets: [
        { id: "s14", weight: 70, reps: 8, completed: true },
        { id: "s15", weight: 75, reps: 6, completed: true },
        { id: "s16", weight: 70, reps: 8, completed: true },
      ]},
      { id: "e6", name: "Bicep Curls", muscleGroup: "Arms", sets: [
        { id: "s17", weight: 14, reps: 12, completed: true },
        { id: "s18", weight: 14, reps: 12, completed: true },
        { id: "s19", weight: 16, reps: 10, completed: true },
      ]},
    ],
  },
  {
    id: "3", name: "Leg Day", date: "Mar 5", duration: 72, totalVolume: 18500,
    exercises: [
      { id: "e7", name: "Squat", muscleGroup: "Legs", sets: [
        { id: "s20", weight: 100, reps: 8, completed: true },
        { id: "s21", weight: 110, reps: 6, completed: true },
        { id: "s22", weight: 110, reps: 5, completed: true },
        { id: "s23", weight: 100, reps: 8, completed: true },
      ]},
    ],
  },
];

const TEMPLATES = [
  { name: "Push Day", exercises: ["Bench Press", "Overhead Press", "Cable Flyes", "Tricep Dips"] },
  { name: "Pull Day", exercises: ["Deadlift", "Barbell Row", "Pull-ups", "Bicep Curls"] },
  { name: "Leg Day", exercises: ["Squat", "Leg Press", "Lunges", "Leg Curl"] },
  { name: "Upper Body", exercises: ["Bench Press", "Barbell Row", "Overhead Press", "Bicep Curls"] },
  { name: "Full Body", exercises: ["Squat", "Bench Press", "Deadlift", "Overhead Press"] },
];

const WorkoutLogger = () => {
  const [workouts] = useState(sampleWorkouts);
  const [showNewWorkout, setShowNewWorkout] = useState(false);
  const [showExerciseLib, setShowExerciseLib] = useState(false);
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [filterGroup, setFilterGroup] = useState("All");
  const [searchEx, setSearchEx] = useState("");

  // Active workout state
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [restTimer, setRestTimer] = useState(0);
  const [restRunning, setRestRunning] = useState(false);
  const [restDuration, setRestDuration] = useState(90);
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (restRunning && restTimer > 0) {
      restIntervalRef.current = setInterval(() => {
        setRestTimer((t) => {
          if (t <= 1) {
            setRestRunning(false);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (restIntervalRef.current) clearInterval(restIntervalRef.current); };
  }, [restRunning, restTimer]);

  const startRest = () => {
    setRestTimer(restDuration);
    setRestRunning(true);
  };

  const startFromTemplate = (template: typeof TEMPLATES[0]) => {
    const exercises: Exercise[] = template.exercises.map((name, i) => ({
      id: `new-e-${i}`,
      name,
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

  // PR data
  const prData = [
    { exercise: "Bench Press", weight: "85 kg", reps: "6", date: "Today" },
    { exercise: "Squat", weight: "110 kg", reps: "6", date: "Mar 5" },
    { exercise: "Deadlift", weight: "130 kg", reps: "3", date: "Yesterday" },
  ];

  const totalWorkouts = workouts.length;
  const totalVolume = workouts.reduce((s, w) => s + w.totalVolume, 0);

  const filteredExercises = EXERCISE_LIBRARY.filter((e) =>
    (filterGroup === "All" || e.group === filterGroup) &&
    e.name.toLowerCase().includes(searchEx.toLowerCase())
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Dumbbell className="w-5 h-5 text-warning" />
            <h1 className="text-2xl font-bold font-display text-foreground">Workouts</h1>
          </div>
          <p className="text-sm text-muted-foreground font-body">{totalWorkouts} this week · {(totalVolume / 1000).toFixed(1)}k kg volume</p>
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

      {/* Rest Timer (if active) */}
      {restTimer > 0 && (
        <motion.div
          className="glass-card p-4 flex items-center justify-between ring-1 ring-primary/30"
          initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        >
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
            <button onClick={() => setActiveWorkout(null)} className="text-xs text-primary font-body hover:underline">
              Finish
            </button>
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
                    <input
                      type="number"
                      value={set.weight || ""}
                      onChange={(e) => updateSet(ex.id, set.id, "weight", parseFloat(e.target.value) || 0)}
                      className="col-span-4 bg-secondary rounded-lg px-2 py-2 text-sm text-foreground outline-none font-body text-center"
                      placeholder="0"
                    />
                    <input
                      type="number"
                      value={set.reps || ""}
                      onChange={(e) => updateSet(ex.id, set.id, "reps", parseInt(e.target.value) || 0)}
                      className="col-span-4 bg-secondary rounded-lg px-2 py-2 text-sm text-foreground outline-none font-body text-center"
                      placeholder="0"
                    />
                    <div className="col-span-3 flex justify-center">
                      <button
                        onClick={() => {
                          toggleSet(ex.id, set.id);
                          if (!set.completed) startRest();
                        }}
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

          {/* Rest timer buttons */}
          <div className="flex gap-2">
            {[60, 90, 120, 180].map((s) => (
              <button
                key={s}
                onClick={() => { setRestDuration(s); setRestTimer(s); setRestRunning(true); }}
                className={`flex-1 py-2 rounded-xl text-xs font-body transition-colors ${
                  restDuration === s ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                }`}
              >
                {s < 120 ? `${s}s` : `${s / 60}m`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Workout history */}
      <div>
        <h3 className="text-sm font-semibold font-display text-foreground mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" /> History
        </h3>
        <div className="space-y-3">
          {workouts.map((workout, i) => {
            const isExpanded = expandedWorkout === workout.id;
            return (
              <motion.div
                key={workout.id}
                className="glass-card overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <button onClick={() => setExpandedWorkout(isExpanded ? null : workout.id)} className="w-full p-4 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center">
                        <Dumbbell className="w-5 h-5 text-warning" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold font-display text-foreground">{workout.name}</p>
                        <p className="text-xs text-muted-foreground font-body">{workout.date} · {workout.duration}m · {workout.exercises.length} exercises</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-body">{(workout.totalVolume / 1000).toFixed(1)}k kg</span>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      className="px-4 pb-4 space-y-3"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      {workout.exercises.map((ex) => (
                        <div key={ex.id} className="p-3 rounded-xl bg-secondary/40">
                          <p className="text-xs font-semibold text-foreground font-display mb-2">{ex.name}</p>
                          <div className="space-y-1">
                            {ex.sets.map((set, si) => (
                              <div key={set.id} className="flex items-center gap-2 text-xs text-muted-foreground font-body">
                                <span className="w-6">#{si + 1}</span>
                                <span className="font-medium text-foreground">{set.weight} kg</span>
                                <span>×</span>
                                <span className="font-medium text-foreground">{set.reps} reps</span>
                                {set.completed && <Check className="w-3 h-3 text-primary ml-auto" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => startFromTemplate({ name: workout.name, exercises: workout.exercises.map((e) => e.name) })}
                        className="w-full py-2 rounded-xl bg-primary/10 text-primary text-xs font-medium font-body flex items-center justify-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Repeat Workout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* New Workout Modal (Templates) */}
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
                  <button
                    key={t.name}
                    onClick={() => startFromTemplate(t)}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="text-left">
                      <p className="text-sm font-semibold font-display text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground font-body">{t.exercises.join(", ")}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
              <button
                onClick={() => startFromTemplate({ name: "Custom Workout", exercises: [] })}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold font-display glow-primary"
              >
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

              <input
                value={searchEx}
                onChange={(e) => setSearchEx(e.target.value)}
                placeholder="Search exercises..."
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body"
              />

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
