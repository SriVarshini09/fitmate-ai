/**
 * Centralized constants for the fitness app
 * All localStorage keys, default values, and magic numbers should be defined here
 */

// ── LocalStorage / SessionStorage Keys ──
export const STORAGE_KEYS = {
  ONBOARDING: "Cals Crumble Fit_onboarding",
  EATEN: "Cals Crumble Fit_eaten",
  BURNED: "Cals Crumble Fit_burned",
  FOODS: "Cals Crumble Fit_foods",
  STEPS: "Cals Crumble Fit_steps",
  WATER: "Cals Crumble Fit_water",
  WORKOUTS: "Cals Crumble Fit_workouts",
  LIFESTYLE: "Cals Crumble Fit_lifestyle",
  GOALS: "Cals Crumble Fit_goals",
  SLEEP_TIMER: "Cals Crumble Fit_sleepTimer",
  CHALLENGES: "Cals Crumble Fit_challenges",
  BADGES: "Cals Crumble Fit_badges",
  STREAK: "Cals Crumble Fit_streak",
  // Session-only (cleared on tab close)
  ONBOARDING_SESSION: "vf_onboarding_progress",
  LOGIN_ATTEMPTS: "vf_login_attempts",
} as const;

// ── Auth ──
export const AUTH = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_SECONDS: 60,
} as const;

// ── Default Fallback Values ──
export const DEFAULTS = {
  WEIGHT_KG: 70,
  HEIGHT_CM: 170,
  AGE: 25,
  ACTIVITY_LEVEL: "moderate",
  GOAL: "maintain",
  SEX: "male",
  STEPS_GOAL: 10000,
  WATER_GLASS_ML: 250,
  DAILY_WATER_GOAL_ML: 2000,
  TIMELINE_MONTHS: 3,
} as const;

// ── Activity Level Multipliers (Mifflin-St Jeor TDEE) ──
export const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
} as const;

// ── Nutrition Limits ──
export const NUTRITION = {
  KCAL_PER_KG_FAT: 7700,
  MIN_DAILY_CALORIES: 1200,
  MAX_DEFICIT_KCAL: 1000,
  MAX_SURPLUS_KCAL: 500,
  WATER_FACTOR_PER_KG: 0.033, // litres per kg of bodyweight
} as const;

// ── Steps Goal by Activity Level ──
export const ACTIVITY_STEPS_GOALS: Record<string, number> = {
  sedentary: 6000,
  light: 8000,
  moderate: 10000,
  active: 12000,
  very_active: 15000,
} as const;

// ── Step Tracker Sync Interval ──
export const STEP_SYNC_INTERVAL_MS = 5 * 60 * 1000;

// ── Calorie Adjustments by Goal (simple mode) ──
export const CALORIE_ADJUSTMENTS = {
  lose: -500,
  maintain: 0,
  gain: 300,
} as const;

// ── Macro Ratios by Goal (as % of calories) ──
export const MACRO_RATIOS = {
  lose: { protein: 0.35, carbs: 0.35, fat: 0.3 },
  maintain: { protein: 0.25, carbs: 0.45, fat: 0.3 },
  gain: { protein: 0.3, carbs: 0.45, fat: 0.25 },
} as const;

// ── Fiber Recommendations ──
export const FIBER_RECOMMENDATIONS = {
  PER_1000_KCAL: 14, // grams
  MIN_FEMALE: 25, // grams
  MIN_MALE: 38, // grams
} as const;

// ── MET Values for Exercise Calorie Estimation ──
export const EXERCISE_METS: Record<string, number> = {
  // Weights
  "Bench Press": 6.0,
  "Incline Dumbbell Press": 5.5,
  "Cable Flyes": 4.0,
  "Squat": 6.0,
  "Leg Press": 5.5,
  "Lunges": 5.0,
  "Leg Curl": 4.0,
  "Calf Raises": 3.5,
  "Deadlift": 6.5,
  "Barbell Row": 5.5,
  "Pull-ups": 8.0,
  "Lat Pulldown": 5.0,
  "Overhead Press": 5.5,
  "Shoulder Lateral Raise": 3.5,
  "Face Pulls": 3.5,
  "Bicep Curls": 3.5,
  "Hammer Curls": 3.5,
  "Tricep Dips": 5.0,
  "Tricep Pushdown": 3.5,
  "Plank": 3.8,
  "Russian Twist": 4.0,
  "Cable Crunch": 3.5,
  // Cardio
  run: 9.8,
  ride: 7.5,
  swim: 8.0,
  walk: 3.8,
  hike: 6.0,
} as const;

// ── UI Constants ──
export const UI = {
  MAX_TOAST_DURATION: 3000,
  ANIMATION_DURATION: 300,
  DEBOUNCE_MS: 800,
} as const;

// ── Date Helpers ──
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
