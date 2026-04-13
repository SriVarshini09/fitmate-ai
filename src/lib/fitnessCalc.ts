/**
 * fitnessCalc.ts — single source of truth for BMR / TDEE / macro calculations.
 * All Onboarding, useCalorieTracker and any future consumers should import from here.
 */
import {
  ACTIVITY_MULTIPLIERS,
  ACTIVITY_STEPS_GOALS,
  DEFAULTS,
  FIBER_RECOMMENDATIONS,
  MACRO_RATIOS,
  NUTRITION,
} from "./constants";

export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

/** Mifflin-St Jeor BMR */
export function calcBMR(
  sex: string,
  weightKg: number,
  heightCm: number,
  age: number
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "female" ? base - 161 : base + 5;
}

/** Total Daily Energy Expenditure */
export function calcTDEE(bmr: number, activityLevel: string): number {
  return Math.round(bmr * (ACTIVITY_MULTIPLIERS[activityLevel] ?? ACTIVITY_MULTIPLIERS[DEFAULTS.ACTIVITY_LEVEL]));
}

/** Timeline-aware target calories */
export function calcTargetCalories(
  tdee: number,
  goal: string,
  currentWeightKg: number,
  goalWeightKg: number,
  timelineMonths: number
): number {
  if (goal === "maintain") return tdee;
  const weightDiff = Math.abs(currentWeightKg - goalWeightKg);
  const totalDays = timelineMonths * 30;
  const dailyCalorieChange = Math.round((weightDiff / totalDays) * NUTRITION.KCAL_PER_KG_FAT);
  if (goal === "lose") {
    const deficit = Math.min(dailyCalorieChange, NUTRITION.MAX_DEFICIT_KCAL);
    return Math.max(Math.round(tdee - deficit), NUTRITION.MIN_DAILY_CALORIES);
  }
  const surplus = Math.min(dailyCalorieChange, NUTRITION.MAX_SURPLUS_KCAL);
  return Math.round(tdee + surplus);
}

/** Fiber recommendation in grams */
export function calcFiber(calories: number, sex: string): number {
  const byCalorie = Math.round((calories / 1000) * FIBER_RECOMMENDATIONS.PER_1000_KCAL);
  const minimum = sex === "female" ? FIBER_RECOMMENDATIONS.MIN_FEMALE : FIBER_RECOMMENDATIONS.MIN_MALE;
  return Math.max(byCalorie, minimum);
}

/** Daily macro breakdown in grams */
export function calcMacros(calories: number, goal: string, sex: string = DEFAULTS.SEX): Macros {
  const ratios = MACRO_RATIOS[goal as keyof typeof MACRO_RATIOS] ?? MACRO_RATIOS.maintain;
  const fiber = calcFiber(calories, sex);
  return {
    protein: Math.round((calories * ratios.protein) / 4),
    carbs: Math.round((calories * ratios.carbs) / 4),
    fat: Math.round((calories * ratios.fat) / 9),
    fiber,
  };
}

/** Estimated weeks to reach goal weight */
export function weeksToGoal(currentKg: number, goalKg: number, goal: string): number {
  const diff = Math.abs(currentKg - goalKg);
  const ratePerWeek = goal === "lose" ? 0.5 : goal === "gain" ? 0.3 : 0;
  if (ratePerWeek === 0) return 0;
  return Math.ceil(diff / ratePerWeek);
}

/** Recommended daily water intake in litres */
export function calcWaterGoal(weightKg: number): number {
  return Math.round(weightKg * NUTRITION.WATER_FACTOR_PER_KG * 10) / 10;
}

/** Steps goal from activity level */
export function calcStepsGoal(activityLevel: string): number {
  return ACTIVITY_STEPS_GOALS[activityLevel] ?? DEFAULTS.STEPS_GOAL;
}
