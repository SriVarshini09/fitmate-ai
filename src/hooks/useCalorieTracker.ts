import { useState, useEffect, useCallback } from "react";

// ── Types ──
export interface BurnedEntry {
  id: string;
  source: "workout" | "activity";
  name: string;
  calories: number;
  duration: number; // minutes
  date: string; // ISO date string (YYYY-MM-DD)
}

export interface UserProfile {
  name: string;
  sex: string;
  weight: number;
  height: number;
  age: number;
  goal: string;
  goalWeight: number;
  activityLevel: string;
  tdee: number;
  targetCalories: number;
  macros: { protein: number; carbs: number; fat: number; fiber: number };
}

const BURNED_KEY = "Cals Crumble Fit_burned";
const EATEN_KEY = "Cals Crumble Fit_eaten";
const ONBOARDING_KEY = "Cals Crumble Fit_onboarding";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ── MET values for calorie estimation ──
const EXERCISE_METS: Record<string, number> = {
  // Weights
  "Bench Press": 6.0, "Incline Dumbbell Press": 5.5, "Cable Flyes": 4.0,
  "Squat": 6.0, "Leg Press": 5.5, "Lunges": 5.0, "Leg Curl": 4.0, "Calf Raises": 3.5,
  "Deadlift": 6.5, "Barbell Row": 5.5, "Pull-ups": 8.0, "Lat Pulldown": 5.0,
  "Overhead Press": 5.5, "Shoulder Lateral Raise": 3.5, "Face Pulls": 3.5,
  "Bicep Curls": 3.5, "Hammer Curls": 3.5, "Tricep Dips": 5.0, "Tricep Pushdown": 3.5,
  "Plank": 3.8, "Russian Twist": 4.0, "Cable Crunch": 3.5,
  // Cardio
  run: 9.8, ride: 7.5, swim: 8.0, walk: 3.8, hike: 6.0,
};

/** Estimate calories burned using MET formula: Cal = MET × weight(kg) × duration(hours) */
export function estimateCalories(
  exerciseName: string,
  durationMinutes: number,
  bodyWeightKg: number
): number {
  const met = EXERCISE_METS[exerciseName] || 5.0;
  return Math.round(met * bodyWeightKg * (durationMinutes / 60));
}

/** Estimate calories for a weight-training exercise based on volume + duration */
export function estimateWeightExerciseCalories(
  exerciseName: string,
  sets: { weight: number; reps: number }[],
  bodyWeightKg: number
): number {
  // Estimate ~30s per rep + 60s rest per set
  const totalReps = sets.reduce((sum, s) => sum + s.reps, 0);
  const estimatedMinutes = (totalReps * 0.5 + sets.length * 1) / 60 * 10; // rough
  const met = EXERCISE_METS[exerciseName] || 5.0;
  const volume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
  // Blend MET-based and volume-based estimate
  const metCals = met * bodyWeightKg * (estimatedMinutes / 60);
  const volCals = volume * 0.015 + sets.length * 8;
  return Math.round((metCals + volCals) / 2);
}

export function estimateActivityCalories(
  type: string,
  durationMinutes: number,
  bodyWeightKg: number
): number {
  const met = EXERCISE_METS[type] || 5.0;
  return Math.round(met * bodyWeightKg * (durationMinutes / 60));
}

// ── LocalStorage helpers ──
function getEntries(key: string, date?: string): BurnedEntry[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const entries: BurnedEntry[] = JSON.parse(raw);
    if (date) return entries.filter((e) => e.date === date);
    return entries;
  } catch {
    return [];
  }
}

function saveEntries(key: string, entries: BurnedEntry[]) {
  localStorage.setItem(key, JSON.stringify(entries));
}

// ── Hook ──
export function useCalorieTracker() {
  const [burnedToday, setBurnedToday] = useState<BurnedEntry[]>([]);
  const [eatenToday, setEatenToday] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Load profile from onboarding
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ONBOARDING_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      const weight = parseFloat(data.weight) || 70;
      const height = parseFloat(data.height) || 170;
      const age = parseInt(data.age) || 25;
      const sex = data.sex || "male";

      const bmr = sex === "female"
        ? 10 * weight + 6.25 * height - 5 * age - 161
        : 10 * weight + 6.25 * height - 5 * age + 5;

      const actMulti: Record<string, number> = {
        sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
      };
      const tdee = Math.round(bmr * (actMulti[data.activityLevel] || 1.55));

      let targetCalories = tdee;
      if (data.goal === "lose") targetCalories = Math.round(tdee - 500);
      if (data.goal === "gain") targetCalories = Math.round(tdee + 300);

      // Fiber recommendation: ~14g per 1000 kcal, min 25g women / 38g men
      const calcFiber = (cal: number, userSex: string) => {
        const byCalorie = Math.round((cal / 1000) * 14);
        const minimum = userSex === "female" ? 25 : 38;
        return Math.max(byCalorie, minimum);
      };

      const calcMacros = (cal: number, goal: string, userSex: string) => {
        const fiber = calcFiber(cal, userSex);
        if (goal === "lose") return { protein: Math.round((cal * 0.35) / 4), carbs: Math.round((cal * 0.35) / 4), fat: Math.round((cal * 0.3) / 9), fiber };
        if (goal === "gain") return { protein: Math.round((cal * 0.3) / 4), carbs: Math.round((cal * 0.45) / 4), fat: Math.round((cal * 0.25) / 9), fiber };
        return { protein: Math.round((cal * 0.25) / 4), carbs: Math.round((cal * 0.45) / 4), fat: Math.round((cal * 0.3) / 9), fiber };
      };

      setProfile({
        name: data.name || "User",
        sex, weight, height, age,
        goal: data.goal || "maintain",
        goalWeight: parseFloat(data.goalWeight) || weight,
        activityLevel: data.activityLevel || "moderate",
        tdee,
        targetCalories,
        macros: calcMacros(targetCalories, data.goal, sex),
      });
    } catch { /* ignore */ }
  }, []);

  // Load today's burned & eaten
  useEffect(() => {
    const today = todayISO();
    setBurnedToday(getEntries(BURNED_KEY, today));
    const eatenRaw = localStorage.getItem(EATEN_KEY);
    try {
      const eatenData = eatenRaw ? JSON.parse(eatenRaw) : {};
      setEatenToday(eatenData[today] || 0);
    } catch {
      setEatenToday(0);
    }
  }, []);

  const totalBurnedToday = burnedToday.reduce((sum, e) => sum + e.calories, 0);

  const logBurned = useCallback((entry: Omit<BurnedEntry, "id" | "date">) => {
    const today = todayISO();
    const newEntry: BurnedEntry = { ...entry, id: crypto.randomUUID(), date: today };
    const all = getEntries(BURNED_KEY);
    all.push(newEntry);
    saveEntries(BURNED_KEY, all);
    setBurnedToday(all.filter((e) => e.date === today));
  }, []);

  const logEaten = useCallback((calories: number) => {
    const today = todayISO();
    const eatenRaw = localStorage.getItem(EATEN_KEY);
    const eatenData = eatenRaw ? JSON.parse(eatenRaw) : {};
    eatenData[today] = (eatenData[today] || 0) + calories;
    localStorage.setItem(EATEN_KEY, JSON.stringify(eatenData));
    setEatenToday(eatenData[today]);
  }, []);

  return {
    profile,
    burnedToday,
    totalBurnedToday,
    eatenToday,
    logBurned,
    logEaten,
    bodyWeight: profile?.weight || 70,
  };
}
