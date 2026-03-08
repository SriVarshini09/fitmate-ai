import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ChevronRight, Dumbbell, Clock, Flame, TrendingUp, RotateCcw,
  Heart, Zap, BarChart3, Target
} from "lucide-react";

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
  restTime?: number;
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

interface Props {
  workout: Workout;
  isExpanded: boolean;
  onToggle: () => void;
  onRepeat: (workout: Workout) => void;
  index: number;
}

const intensityColor: Record<string, string> = {
  Light: "bg-success/15 text-success",
  Moderate: "bg-info/15 text-info",
  Intense: "bg-warning/15 text-warning",
  "Max Effort": "bg-destructive/15 text-destructive",
};

const muscleGroupEmoji: Record<string, string> = {
  Chest: "🫁", Back: "🔙", Legs: "🦵", Shoulders: "🤷", Arms: "💪", Core: "🧱", Cardio: "❤️",
};

const WorkoutDetailCard = ({ workout, isExpanded, onToggle, onRepeat, index }: Props) => {
  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const completedSets = workout.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length, 0
  );
  const totalReps = workout.exercises.reduce(
    (sum, ex) => sum + ex.sets.reduce((s, set) => s + set.reps, 0), 0
  );
  const calories = workout.totalCalories || Math.round(workout.duration * 6.5);
  const muscleGroups = workout.muscleGroupsHit || [...new Set(workout.exercises.map((e) => e.muscleGroup))];
  const intensity = workout.intensity || (workout.duration > 60 ? "Intense" : "Moderate");

  return (
    <motion.div
      className="glass-card overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <button onClick={onToggle} className="w-full p-4 text-left">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-warning" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold font-display text-foreground">{workout.name}</p>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${intensityColor[intensity]}`}>
                  {intensity}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-body">{workout.date}</p>
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-5 gap-1.5">
          {[
            { icon: Clock, label: "Duration", value: `${workout.duration}m` },
            { icon: Dumbbell, label: "Volume", value: `${(workout.totalVolume / 1000).toFixed(1)}k` },
            { icon: Flame, label: "Calories", value: `${calories}` },
            { icon: BarChart3, label: "Sets", value: `${completedSets}/${totalSets}` },
            { icon: Target, label: "Reps", value: `${totalReps}` },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-2 rounded-lg bg-secondary/40">
              <stat.icon className="w-3 h-3 text-muted-foreground mx-auto mb-0.5" />
              <p className="text-xs font-bold font-display text-foreground">{stat.value}</p>
              <p className="text-[8px] text-muted-foreground font-body">{stat.label}</p>
            </div>
          ))}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="px-4 pb-4 space-y-4"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {/* Muscle groups hit */}
            <div>
              <p className="text-[10px] text-muted-foreground font-body mb-2 uppercase tracking-wider">Muscles Targeted</p>
              <div className="flex flex-wrap gap-1.5">
                {muscleGroups.map((mg) => (
                  <span key={mg} className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-medium font-body flex items-center gap-1">
                    {muscleGroupEmoji[mg] || "🏋️"} {mg}
                  </span>
                ))}
              </div>
            </div>

            {/* Heart rate if available */}
            {workout.avgHeartRate && (
              <div className="flex gap-3">
                <div className="flex-1 p-3 rounded-xl bg-destructive/10 text-center">
                  <Heart className="w-4 h-4 text-destructive mx-auto mb-1" />
                  <p className="text-sm font-bold font-display text-foreground">{workout.avgHeartRate}</p>
                  <p className="text-[9px] text-muted-foreground font-body">Avg HR</p>
                </div>
                <div className="flex-1 p-3 rounded-xl bg-destructive/10 text-center">
                  <Heart className="w-4 h-4 text-destructive mx-auto mb-1" />
                  <p className="text-sm font-bold font-display text-foreground">{workout.peakHeartRate}</p>
                  <p className="text-[9px] text-muted-foreground font-body">Peak HR</p>
                </div>
                <div className="flex-1 p-3 rounded-xl bg-warning/10 text-center">
                  <Zap className="w-4 h-4 text-warning mx-auto mb-1" />
                  <p className="text-sm font-bold font-display text-foreground">{calories}</p>
                  <p className="text-[9px] text-muted-foreground font-body">kcal</p>
                </div>
              </div>
            )}

            {/* Detailed exercises */}
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">Exercise Breakdown</p>
              {workout.exercises.map((ex) => {
                const exVolume = ex.sets.reduce((s, set) => s + set.weight * set.reps, 0);
                const exCalories = ex.caloriesBurned || Math.round(exVolume * 0.015 + ex.sets.length * 8);
                const bestSet = [...ex.sets].sort((a, b) => b.weight * b.reps - a.weight * a.reps)[0];
                const totalExReps = ex.sets.reduce((s, set) => s + set.reps, 0);

                return (
                  <div key={ex.id} className="p-3 rounded-xl bg-secondary/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{muscleGroupEmoji[ex.muscleGroup] || "🏋️"}</span>
                        <div>
                          <p className="text-xs font-semibold text-foreground font-display">{ex.name}</p>
                          <p className="text-[10px] text-muted-foreground font-body">{ex.muscleGroup}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-warning font-display">{exCalories} kcal</p>
                        <p className="text-[9px] text-muted-foreground font-body">{(exVolume / 1000).toFixed(1)}k kg vol</p>
                      </div>
                    </div>

                    {/* Summary stats for this exercise */}
                    <div className="grid grid-cols-4 gap-1.5">
                      <div className="text-center p-1.5 rounded-lg bg-background/40">
                        <p className="text-[10px] font-bold text-foreground font-display">{ex.sets.length}</p>
                        <p className="text-[8px] text-muted-foreground font-body">Sets</p>
                      </div>
                      <div className="text-center p-1.5 rounded-lg bg-background/40">
                        <p className="text-[10px] font-bold text-foreground font-display">{totalExReps}</p>
                        <p className="text-[8px] text-muted-foreground font-body">Total Reps</p>
                      </div>
                      <div className="text-center p-1.5 rounded-lg bg-background/40">
                        <p className="text-[10px] font-bold text-foreground font-display">{bestSet?.weight || 0}kg</p>
                        <p className="text-[8px] text-muted-foreground font-body">Best Weight</p>
                      </div>
                      <div className="text-center p-1.5 rounded-lg bg-background/40">
                        <p className="text-[10px] font-bold text-foreground font-display">{bestSet?.reps || 0}</p>
                        <p className="text-[8px] text-muted-foreground font-body">Best Reps</p>
                      </div>
                    </div>

                    {/* Set by set detail */}
                    <div className="space-y-1">
                      <div className="grid grid-cols-12 gap-1 text-[9px] text-muted-foreground font-body px-1 uppercase tracking-wider">
                        <span className="col-span-1">Set</span>
                        <span className="col-span-3">Weight</span>
                        <span className="col-span-2">Reps</span>
                        <span className="col-span-3">Volume</span>
                        <span className="col-span-3 text-right">Status</span>
                      </div>
                      {ex.sets.map((set, si) => (
                        <div key={set.id} className={`grid grid-cols-12 gap-1 items-center py-1 px-1 rounded-md ${
                          set.completed ? "bg-primary/5" : ""
                        }`}>
                          <span className="col-span-1 text-[10px] text-muted-foreground font-body">
                            {set.isWarmup ? "W" : si + 1}
                          </span>
                          <span className="col-span-3 text-[10px] font-medium text-foreground font-body">
                            {set.weight} kg
                          </span>
                          <span className="col-span-2 text-[10px] font-medium text-foreground font-body">
                            × {set.reps}
                          </span>
                          <span className="col-span-3 text-[10px] text-muted-foreground font-body">
                            {(set.weight * set.reps).toLocaleString()} kg
                          </span>
                          <div className="col-span-3 flex items-center justify-end gap-1">
                            {set.rpe && (
                              <span className="text-[8px] px-1 py-0.5 rounded bg-warning/10 text-warning font-bold">
                                RPE {set.rpe}
                              </span>
                            )}
                            {set.completed && <Check className="w-3 h-3 text-primary" />}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Volume bar */}
                    <div className="h-1.5 bg-background/40 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary/60 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (exVolume / (workout.totalVolume || 1)) * 100 * workout.exercises.length)}%` }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Workout summary */}
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-[10px] text-primary font-body mb-2 uppercase tracking-wider font-medium">Workout Summary</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-lg font-bold font-display text-foreground">{workout.exercises.length}</p>
                  <p className="text-[9px] text-muted-foreground font-body">Exercises</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold font-display text-foreground">{totalSets}</p>
                  <p className="text-[9px] text-muted-foreground font-body">Total Sets</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold font-display text-foreground">{totalReps}</p>
                  <p className="text-[9px] text-muted-foreground font-body">Total Reps</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold font-display text-foreground">{(workout.totalVolume / 1000).toFixed(1)}k</p>
                  <p className="text-[9px] text-muted-foreground font-body">Volume (kg)</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold font-display text-warning">{calories}</p>
                  <p className="text-[9px] text-muted-foreground font-body">Calories</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold font-display text-foreground">{workout.duration}m</p>
                  <p className="text-[9px] text-muted-foreground font-body">Duration</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => onRepeat(workout)}
              className="w-full py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-medium font-body flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Repeat Workout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WorkoutDetailCard;
