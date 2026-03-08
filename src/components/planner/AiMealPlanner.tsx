import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, ChevronDown, ChevronUp, UtensilsCrossed, Check, Flame, Target, User, Scale, Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserProfile } from "@/hooks/useCalorieTracker";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEALS = ["Breakfast", "Lunch", "Snack", "Dinner"] as const;

interface MealItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface DayPlan {
  day: string;
  meals: Record<string, MealItem[]>;
}

interface AiMealPlannerProps {
  profile: UserProfile | null;
  onApplyPlan: (plan: Record<string, Record<string, MealItem[]>>) => void;
}

type PlanType = "week" | "day-ideas";

const AiMealPlanner = ({ profile, onApplyPlan }: AiMealPlannerProps) => {
  const [ingredients, setIngredients] = useState("");
  const [dietaryPrefs, setDietaryPrefs] = useState("");
  const [planType, setPlanType] = useState<PlanType>("week");
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<DayPlan[] | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const calorieGoal = profile?.targetCalories || 2100;
  const macros = profile?.macros || { protein: 150, carbs: 250, fat: 70, fiber: 30 };
  const goalLabel = profile?.goal === "lose" ? "Weight Loss" : profile?.goal === "gain" ? "Muscle Gain" : "Maintain Weight";

  const generatePlan = async () => {
    if (!ingredients.trim()) {
      toast.error("Please enter your available ingredients");
      return;
    }

    setLoading(true);
    setGeneratedPlan(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-meal-plan", {
        body: {
          ingredients: ingredients.trim(),
          calorieGoal,
          goal: profile?.goal || "maintain",
          macros: profile?.macros || null,
          dietaryPreferences: dietaryPrefs.trim() || null,
          planType,
          userDetails: {
            weight: profile?.weight || 70,
            height: profile?.height || 170,
            age: profile?.age || 25,
            sex: profile?.sex || "male",
            activityLevel: profile?.activityLevel || "moderate",
          },
        },
      });

      if (error) {
        console.warn("AI meal plan error:", error.message);
        toast.error("Failed to generate meal plan. Please try again.");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.days && Array.isArray(data.days)) {
        setGeneratedPlan(data.days);
        setExpandedDay(data.days[0]?.day || null);
        toast.success("Meal plan generated!");
      } else {
        toast.error("Invalid meal plan format. Please try again.");
      }
    } catch (e) {
      console.warn("Meal plan generation failed:", e);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const applyPlan = () => {
    if (!generatedPlan) return;
    const weekPlan: Record<string, Record<string, MealItem[]>> = {};
    for (const dayPlan of generatedPlan) {
      weekPlan[dayPlan.day] = {};
      for (const meal of MEALS) {
        weekPlan[dayPlan.day][meal] = (dayPlan.meals[meal] || []).map((item) => ({
          ...item,
          id: Date.now().toString() + Math.random().toString(36).slice(2),
        }));
      }
    }
    onApplyPlan(weekPlan);
    toast.success("Meal plan applied to your planner!");
  };

  // Calculate day macro totals
  const getDayMacros = (dayPlan: DayPlan) => {
    let calories = 0, protein = 0, carbs = 0, fat = 0;
    for (const meal of MEALS) {
      for (const item of dayPlan.meals[meal] || []) {
        calories += item.calories;
        protein += item.protein;
        carbs += item.carbs;
        fat += item.fat;
      }
    }
    return { calories, protein, carbs, fat };
  };

  return (
    <div className="space-y-5">
      {/* Your Profile Summary */}
      <motion.div className="glass-card p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold font-display text-foreground">Your Profile</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-secondary/50 rounded-xl p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Target className="w-3 h-3 text-primary" />
              <span className="text-[10px] text-muted-foreground font-body">Goal</span>
            </div>
            <p className="text-xs font-semibold text-foreground font-display">{goalLabel}</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Flame className="w-3 h-3 text-primary" />
              <span className="text-[10px] text-muted-foreground font-body">Daily Target</span>
            </div>
            <p className="text-xs font-semibold text-foreground font-display">{calorieGoal} kcal</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-2">
          {[
            { label: "Protein", value: macros.protein, color: "text-success" },
            { label: "Carbs", value: macros.carbs, color: "text-info" },
            { label: "Fat", value: macros.fat, color: "text-warning" },
            { label: "Fiber", value: macros.fiber, color: "text-success" },
          ].map((m) => (
            <div key={m.label} className="bg-secondary/50 rounded-xl p-2 text-center">
              <p className="text-[10px] text-muted-foreground font-body">{m.label}</p>
              <p className={`text-xs font-bold font-display ${m.color}`}>{m.value}g</p>
            </div>
          ))}
        </div>
        {profile && (
          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground font-body">
            <span className="flex items-center gap-1"><Scale className="w-3 h-3" />{profile.weight}kg</span>
            <span>{profile.height}cm</span>
            <span>{profile.age}y</span>
            <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3" />{profile.activityLevel}</span>
          </div>
        )}
      </motion.div>

      {/* Input section */}
      <motion.div className="glass-card p-5 space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-base font-bold font-display text-foreground">AI Meal Plan Generator</h2>
        </div>
        <p className="text-xs text-muted-foreground font-body">
          The AI will create a plan tailored to your {calorieGoal} kcal goal with balanced macros: P:{macros.protein}g · C:{macros.carbs}g · F:{macros.fat}g · Fiber:{macros.fiber}g
        </p>

        {/* Plan type selector */}
        <div>
          <label className="text-xs font-medium text-foreground font-body mb-1.5 block">
            What do you need?
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setPlanType("week")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-medium font-body transition-colors ${
                planType === "week" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              📅 Full Week Meal Prep
            </button>
            <button
              onClick={() => setPlanType("day-ideas")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-medium font-body transition-colors ${
                planType === "day-ideas" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              💡 Daily Meal Ideas
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground font-body mt-1">
            {planType === "week"
              ? "Get a complete 7-day plan with exact portions for meal prepping"
              : "Get varied daily meal ideas — different options for each day"}
          </p>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground font-body mb-1.5 block">
            What ingredients/foods do you have?
          </label>
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="e.g. rice, chicken, eggs, broccoli, oats, milk, banana, dal, roti, paneer, tomatoes..."
            rows={3}
            className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body resize-none"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-foreground font-body mb-1.5 block">
            Dietary preferences (optional)
          </label>
          <input
            value={dietaryPrefs}
            onChange={(e) => setDietaryPrefs(e.target.value)}
            placeholder="e.g. vegetarian, no spicy food, South Indian..."
            className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body"
          />
        </div>

        <button
          onClick={generatePlan}
          disabled={loading || !ingredients.trim()}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold font-display glow-primary disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating your plan...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {planType === "week" ? "Generate Week Plan" : "Generate Meal Ideas"}
            </>
          )}
        </button>
      </motion.div>

      {/* Generated plan */}
      <AnimatePresence>
        {generatedPlan && (
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {generatedPlan.map((dayPlan) => {
              const isExpanded = expandedDay === dayPlan.day;
              const dayMacros = getDayMacros(dayPlan);
              const remaining = calorieGoal - dayMacros.calories;

              return (
                <motion.div key={dayPlan.day} className="glass-card overflow-hidden">
                  <button
                    onClick={() => setExpandedDay(isExpanded ? null : dayPlan.day)}
                    className="w-full p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                        <UtensilsCrossed className="w-4 h-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold font-display text-foreground">{dayPlan.day}</p>
                        <p className="text-xs text-muted-foreground font-body">
                          {dayMacros.calories} kcal · <span className={remaining < 0 ? "text-destructive" : "text-primary"}>
                            {remaining >= 0 ? `${remaining} remaining` : `${Math.abs(remaining)} over`}
                          </span>
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3">
                          {/* Day macro summary */}
                          <div className="grid grid-cols-4 gap-2">
                            {[
                              { label: "Protein", value: dayMacros.protein, goal: macros.protein, color: "bg-success" },
                              { label: "Carbs", value: dayMacros.carbs, goal: macros.carbs, color: "bg-info" },
                              { label: "Fat", value: dayMacros.fat, goal: macros.fat, color: "bg-warning" },
                              { label: "Calories", value: dayMacros.calories, goal: calorieGoal, color: "bg-primary" },
                            ].map((m) => {
                              const pct = Math.min((m.value / m.goal) * 100, 100);
                              return (
                                <div key={m.label} className="text-center">
                                  <p className="text-[10px] text-muted-foreground font-body">{m.label}</p>
                                  <p className="text-xs font-bold text-foreground font-display">
                                    {Math.round(m.value)}{m.label === "Calories" ? "" : "g"}
                                  </p>
                                  <div className="h-1 rounded-full bg-secondary overflow-hidden mt-1">
                                    <div className={`h-full rounded-full ${m.color}`} style={{ width: `${pct}%` }} />
                                  </div>
                                  <p className="text-[9px] text-muted-foreground font-body mt-0.5">
                                    /{m.goal}{m.label === "Calories" ? "" : "g"}
                                  </p>
                                </div>
                              );
                            })}
                          </div>

                          {MEALS.map((meal) => {
                            const items = dayPlan.meals[meal] || [];
                            if (items.length === 0) return null;
                            const mealCals = items.reduce((s, f) => s + f.calories, 0);
                            return (
                              <div key={meal}>
                                <div className="flex items-center justify-between mb-1.5">
                                  <p className="text-xs font-semibold font-display text-foreground">{meal}</p>
                                  <span className="text-xs text-muted-foreground font-body">{mealCals} kcal</span>
                                </div>
                                <div className="space-y-1.5">
                                  {items.map((item, idx) => (
                                    <div key={idx} className="py-1.5 px-3 rounded-lg bg-secondary/50">
                                      <p className="text-sm font-medium text-foreground font-body">{item.name}</p>
                                      <p className="text-xs text-muted-foreground font-body">
                                        {item.calories} kcal · P:{item.protein}g · C:{item.carbs}g · F:{item.fat}g
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {/* Apply button */}
            <button
              onClick={applyPlan}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold font-display glow-primary flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Apply to My Planner
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AiMealPlanner;
