import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Flame, Plus, X, ChevronLeft, ChevronRight, UtensilsCrossed, Trash2, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCalorieTracker } from "@/hooks/useCalorieTracker";
import AiMealPlanner from "@/components/planner/AiMealPlanner";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEALS = ["Breakfast", "Lunch", "Snack", "Dinner"] as const;

interface PlannedMeal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl?: string;
}

type WeekPlan = Record<string, Record<string, PlannedMeal[]>>;

const defaultWeek: WeekPlan = Object.fromEntries(
  DAYS.map((d) => [d, Object.fromEntries(MEALS.map((m) => [m, []]))])
);


interface NutritionResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servingDescription: string;
}

const UNITS = ["g", "ml", "L", "pcs", "cup", "tbsp", "tsp"] as const;

const WeeklyPlanner = () => {
  const { profile } = useCalorieTracker();
  const calorieGoal = profile?.targetCalories || 2100;
  const [weekPlan, setWeekPlan] = useState<WeekPlan>(defaultWeek);
  const [activeTab, setActiveTab] = useState<"manual" | "ai">("manual");
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);
  const [showAdd, setShowAdd] = useState(false);
  const [addMealType, setAddMealType] = useState<string>("Breakfast");
  const [foodName, setFoodName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("g");
  const [aiResult, setAiResult] = useState<NutritionResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dayIndex = DAYS.indexOf(selectedDay);

  const navigateDay = (dir: -1 | 1) => {
    const next = (dayIndex + dir + 7) % 7;
    setSelectedDay(DAYS[next]);
  };

  const dayTotal = MEALS.reduce((sum, meal) => {
    return sum + (weekPlan[selectedDay]?.[meal]?.reduce((s, f) => s + f.calories, 0) || 0);
  }, 0);

  // Debounced AI nutrition lookup
  const lookupNutrition = useCallback(async (name: string, qty: string, unit: string) => {
    if (!name.trim() || name.trim().length < 2) {
      setAiResult(null);
      return;
    }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("food-nutrition", {
        body: { foodName: name.trim(), quantity: qty || "1", unit },
      });
      if (error) {
        console.warn("Nutrition lookup error (non-critical):", error.message);
        setAiResult(null);
        return;
      }
      if (data?.error) {
        if (typeof data.error === "string" && data.error.includes("Rate limit")) {
          toast.error("Too many requests. Please wait.");
        }
        setAiResult(null);
        return;
      }
      setAiResult(data as NutritionResult);
    } catch (e) {
      // Silently handle - likely a cancelled request from debounce
      console.warn("Nutrition lookup failed (non-critical):", e);
      setAiResult(null);
    } finally {
      setAiLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!showAdd) return;
    debounceRef.current = setTimeout(() => {
      lookupNutrition(foodName, quantity, selectedUnit);
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [foodName, quantity, selectedUnit, showAdd, lookupNutrition]);

  const openAdd = (mealType: string) => {
    setAddMealType(mealType);
    setFoodName("");
    setQuantity("");
    setSelectedUnit("g");
    setAiResult(null);
    setShowAdd(true);
  };

  const closeModal = () => {
    setShowAdd(false);
    setFoodName("");
    setQuantity("");
    setAiResult(null);
  };

  const addMeal = () => {
    if (!foodName.trim()) return;
    const nutrition = aiResult || { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const entry: PlannedMeal = {
      id: Date.now().toString(),
      name: aiResult?.name || foodName.trim(),
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
    };
    setWeekPlan((prev) => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        [addMealType]: [...(prev[selectedDay]?.[addMealType] || []), entry],
      },
    }));
    closeModal();
  };

  const removeMeal = (mealType: string, id: string) => {
    setWeekPlan((prev) => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        [mealType]: prev[selectedDay][mealType].filter((m) => m.id !== id),
      },
    }));
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold font-display text-foreground">Meal Planner</h1>
        </div>
        <p className="text-sm text-muted-foreground font-body">Plan your week, hit your goals</p>
      </motion.div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("manual")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium font-display flex items-center justify-center gap-2 transition-colors ${
            activeTab === "manual"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Manual Plan
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium font-display flex items-center justify-center gap-2 transition-colors ${
            activeTab === "ai"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI Planner
        </button>
      </div>

      {activeTab === "ai" ? (
        <AiMealPlanner
          profile={profile}
          onApplyPlan={(plan) => {
            const newWeek: WeekPlan = { ...defaultWeek };
            for (const [day, meals] of Object.entries(plan)) {
              newWeek[day] = {};
              for (const [meal, items] of Object.entries(meals)) {
                newWeek[day][meal] = (items as any[]).map((item) => ({
                  id: Date.now().toString() + Math.random().toString(36).slice(2),
                  name: item.name,
                  calories: item.calories || 0,
                  protein: item.protein || 0,
                  carbs: item.carbs || 0,
                  fat: item.fat || 0,
                }));
              }
            }
            setWeekPlan(newWeek);
            setActiveTab("manual");
          }}
        />
      ) : (
      <>

      {/* Day selector */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigateDay(-1)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <div className="text-center">
            <p className="text-lg font-bold font-display text-foreground">{selectedDay}</p>
            <p className="text-xs text-muted-foreground font-body">
              {dayTotal} / {calorieGoal} kcal planned
            </p>
          </div>
          <button onClick={() => navigateDay(1)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
        </div>
        {/* Day pills */}
        <div className="flex gap-1.5">
          {DAYS.map((day) => {
            const isActive = day === selectedDay;
            const hasMeals = MEALS.some((m) => (weekPlan[day]?.[m]?.length || 0) > 0);
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex-1 py-2 rounded-xl text-[10px] font-medium font-body transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : hasMeals
                    ? "bg-primary/15 text-primary"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {day.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Calorie budget card */}
      <motion.div 
        className="glass-card p-4"
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold font-display text-foreground">Daily Budget</span>
          </div>
          <span className="text-sm font-bold font-display text-foreground">{calorieGoal} kcal</span>
        </div>
        <div className="h-2.5 bg-secondary rounded-full overflow-hidden mb-2">
          <motion.div
            className={`h-full rounded-full ${dayTotal > calorieGoal ? "bg-destructive" : "bg-primary"}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((dayTotal / calorieGoal) * 100, 100)}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
        <div className="flex justify-between text-xs font-body">
          <span className="text-muted-foreground">Planned: <span className="text-foreground font-medium">{dayTotal} kcal</span></span>
          <span className={dayTotal > calorieGoal ? "text-destructive font-medium" : "text-primary font-medium"}>
            {dayTotal > calorieGoal 
              ? `${dayTotal - calorieGoal} kcal over` 
              : `${calorieGoal - dayTotal} kcal remaining`}
          </span>
        </div>
      </motion.div>

      {/* Meal sections */}
      {MEALS.map((mealType) => {
        const meals = weekPlan[selectedDay]?.[mealType] || [];
        const mealCals = meals.reduce((s, f) => s + f.calories, 0);
        return (
          <motion.div
            key={mealType}
            className="glass-card p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold font-display text-foreground">{mealType}</p>
                  {mealCals > 0 && (
                    <p className="text-xs text-muted-foreground font-body">{mealCals} kcal</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => openAdd(mealType)}
                className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center hover:bg-primary/25 transition-colors"
              >
                <Plus className="w-4 h-4 text-primary" />
              </button>
            </div>

            {meals.length > 0 ? (
              <div className="space-y-2">
                {meals.map((meal) => (
                  <div key={meal.id} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-secondary/50">
                    {meal.imageUrl && (
                      <img
                        src={meal.imageUrl}
                        alt={meal.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground font-body truncate">{meal.name}</p>
                      <p className="text-xs text-muted-foreground font-body">
                        {meal.calories} kcal · P:{meal.protein}g · C:{meal.carbs}g · F:{meal.fat}g
                      </p>
                    </div>
                    <button
                      onClick={() => removeMeal(mealType, meal.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-3 font-body">
                Tap + to plan your {mealType.toLowerCase()}
              </p>
            )}
          </motion.div>
        );
      })}



      {/* Add meal modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="w-full max-w-lg glass-card-strong p-6 rounded-t-3xl space-y-4"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-display text-foreground">
                  Plan {addMealType} — {selectedDay}
                </h2>
                <button onClick={closeModal}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Food name input */}
              <input
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder="Type any food, dish, or drink..."
                autoFocus
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body"
              />

              {/* Quantity + unit */}
              <div className="flex items-center gap-2">
                <input
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  type="number"
                  placeholder="Qty"
                  className="flex-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body"
                />
                <div className="flex gap-1.5 overflow-x-auto">
                  {UNITS.map((u) => (
                    <button
                      key={u}
                      onClick={() => setSelectedUnit(u)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-medium font-body whitespace-nowrap transition-colors ${
                        selectedUnit === u ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Nutrition Preview */}
              {aiLoading && (
                <div className="flex items-center justify-center gap-2 py-3">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  <span className="text-xs text-muted-foreground font-body">Looking up nutrition...</span>
                </div>
              )}

              {!aiLoading && aiResult && (
                <div className="bg-secondary/50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground font-body">
                      AI Match: <span className="text-foreground font-medium">{aiResult.name}</span>
                    </p>
                    <span className="text-[10px] text-muted-foreground font-body">{aiResult.servingDescription}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { label: "Cal", value: aiResult.calories, unit: "" },
                      { label: "Protein", value: aiResult.protein, unit: "g" },
                      { label: "Carbs", value: aiResult.carbs, unit: "g" },
                      { label: "Fat", value: aiResult.fat, unit: "g" },
                      { label: "Fiber", value: aiResult.fiber, unit: "g" },
                    ].map((m) => (
                      <div key={m.label} className="text-center">
                        <p className="text-xs text-muted-foreground font-body">{m.label}</p>
                        <p className="text-sm font-semibold text-foreground font-display">{m.value}{m.unit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!aiLoading && !aiResult && foodName.trim().length >= 2 && (
                <p className="text-xs text-muted-foreground font-body text-center">
                  Type to search any food — AI will estimate nutrition
                </p>
              )}

              <button
                onClick={addMeal}
                disabled={!foodName.trim() || aiLoading}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold font-display glow-primary disabled:opacity-50"
              >
                Add to Plan
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </>
      )}
    </div>
  );
};

export default WeeklyPlanner;
