import { useState, useEffect, useCallback } from "react";
import { STORAGE_KEYS, DEFAULTS, EXERCISE_METS } from "@/lib/constants";
import { calcBMR, calcTDEE, calcTargetCalories, calcMacros } from "@/lib/fitnessCalc";

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

const DEFAULT_MET = 5.0;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Estimate calories burned using MET formula: Cal = MET × weight(kg) × duration(hours) */
export function estimateCalories(
  exerciseName: string,
  durationMinutes: number,
  bodyWeightKg: number
): number {
  const met = EXERCISE_METS[exerciseName] ?? DEFAULT_MET;
  return Math.round(met * bodyWeightKg * (durationMinutes / 60));
}

/** Estimate calories for a weight-training exercise based on volume + duration */
export function estimateWeightExerciseCalories(
  exerciseName: string,
  sets: { weight: number; reps: number }[],
  bodyWeightKg: number
): number {
  const totalReps = sets.reduce((sum, s) => sum + s.reps, 0);
  const estimatedMinutes = (totalReps * 0.5 + sets.length * 1) / 60 * 10;
  const met = EXERCISE_METS[exerciseName] ?? DEFAULT_MET;
  const volume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
  const metCals = met * bodyWeightKg * (estimatedMinutes / 60);
  const volCals = volume * 0.015 + sets.length * 8;
  return Math.round((metCals + volCals) / 2);
}

export function estimateActivityCalories(
  type: string,
  durationMinutes: number,
  bodyWeightKg: number
): number {
  const met = EXERCISE_METS[type] ?? DEFAULT_MET;
  return Math.round(met * bodyWeightKg * (durationMinutes / 60));
}

// ── LocalStorage helpers ──
const BURNED_KEY = STORAGE_KEYS.BURNED;
const EATEN_KEY = STORAGE_KEYS.EATEN;
const ONBOARDING_KEY = STORAGE_KEYS.ONBOARDING;

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
      const weight = parseFloat(data.weight) || DEFAULTS.WEIGHT_KG;
      const height = parseFloat(data.height) || DEFAULTS.HEIGHT_CM;
      const age = parseInt(data.age) || DEFAULTS.AGE;
      const sex = data.sex || DEFAULTS.SEX;
      const goal = data.goal || DEFAULTS.GOAL;
      const activityLevel = data.activityLevel || DEFAULTS.ACTIVITY_LEVEL;
      const goalWeight = parseFloat(data.goalWeight) || weight;
      const timelineMonths = parseFloat(data.timelineMonths) || DEFAULTS.TIMELINE_MONTHS;

      const bmr = calcBMR(sex, weight, height, age);
      const tdee = calcTDEE(bmr, activityLevel);
      const targetCalories = calcTargetCalories(tdee, goal, weight, goalWeight, timelineMonths);

      setProfile({
        name: data.name || "User",
        sex, weight, height, age,
        goal,
        goalWeight,
        activityLevel,
        tdee,
        targetCalories,
        macros: calcMacros(targetCalories, goal, sex),
      });
    } catch { /* ignore */ }
  }, []);

  // Load today's burned & eaten, and listen for cross-component updates
  useEffect(() => {
    const today = todayISO();
    setBurnedToday(getEntries(BURNED_KEY, today));

    const readEaten = () => {
      try {
        const eatenRaw = localStorage.getItem(EATEN_KEY);
        const eatenData = eatenRaw ? JSON.parse(eatenRaw) : {};
        setEatenToday(eatenData[today] || 0);
      } catch {
        setEatenToday(0);
      }
    };

    readEaten();

    // Re-read whenever FoodLog writes to localStorage
    window.addEventListener("storage", readEaten);
    // Also poll every 10s in case same-tab writes don't fire storage events
    const interval = setInterval(readEaten, 10000);
    return () => {
      window.removeEventListener("storage", readEaten);
      clearInterval(interval);
    };
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
    bodyWeight: profile?.weight ?? DEFAULTS.WEIGHT_KG,
  };
}
