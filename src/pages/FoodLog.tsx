import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Plus, Search, X, Apple, Coffee, UtensilsCrossed, Moon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FoodEntry {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  meal: string;
}

interface NutritionResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servingDescription: string;
}

const MEALS = [
  { key: "breakfast", label: "Breakfast", icon: Coffee, time: "7:00 - 10:00 AM" },
  { key: "lunch", label: "Lunch", icon: UtensilsCrossed, time: "12:00 - 2:00 PM" },
  { key: "snack", label: "Snack", icon: Apple, time: "3:00 - 5:00 PM" },
  { key: "dinner", label: "Dinner", icon: Moon, time: "6:00 - 9:00 PM" },
];

const UNITS = ["g", "ml", "L", "pcs", "cup", "tbsp", "tsp"] as const;

const FoodLog = () => {
  const [foods, setFoods] = useState<FoodEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState("breakfast");
  const [searchQuery, setSearchQuery] = useState("");
  const [foodName, setFoodName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("g");

  // AI lookup state
  const [aiResult, setAiResult] = useState<NutritionResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalCalories = foods.reduce((s, f) => s + f.calories, 0);
  const totalProtein = foods.reduce((s, f) => s + f.protein, 0);
  const totalCarbs = foods.reduce((s, f) => s + f.carbs, 0);
  const totalFat = foods.reduce((s, f) => s + f.fat, 0);
  const totalFiber = foods.reduce((s, f) => s + f.fiber, 0);

  // Default goals (can be user-customizable later)
  const goals = { protein: 92, carbs: 92, fat: 35, fiber: 25 };

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
        console.error("Nutrition lookup error:", error);
        setAiResult(null);
        return;
      }

      if (data?.error) {
        console.error("AI error:", data.error);
        if (data.error.includes("Rate limit")) {
          toast.error("Too many requests. Please wait a moment.");
        }
        setAiResult(null);
        return;
      }

      setAiResult(data as NutritionResult);
    } catch (e) {
      console.error("Lookup failed:", e);
      setAiResult(null);
    } finally {
      setAiLoading(false);
    }
  }, []);

  // Debounce the AI lookup when food name, quantity, or unit changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!showAdd) return;

    debounceRef.current = setTimeout(() => {
      lookupNutrition(foodName, quantity, selectedUnit);
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [foodName, quantity, selectedUnit, showAdd, lookupNutrition]);

  const addFood = () => {
    if (!foodName.trim()) return;
    const qty = parseFloat(quantity) || 1;
    const nutrition = aiResult || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    const entry: FoodEntry = {
      id: Date.now().toString(),
      name: aiResult?.name || foodName.trim(),
      quantity: qty,
      unit: selectedUnit,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      fiber: nutrition.fiber,
      meal: selectedMeal,
    };
    setFoods([...foods, entry]);
    setFoodName("");
    setQuantity("");
    setSelectedUnit("g");
    setAiResult(null);
    setShowAdd(false);
  };

  const removeFood = (id: string) => setFoods(foods.filter((f) => f.id !== id));

  const closeModal = () => {
    setShowAdd(false);
    setFoodName("");
    setQuantity("");
    setAiResult(null);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-32">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold font-display text-foreground">Food Log</h1>
        <p className="text-sm text-muted-foreground font-body">{totalCalories} kcal today</p>
      </motion.div>

      {/* Macros Summary Card */}
      <motion.div 
        className="glass-card p-5"
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-sm font-semibold font-display text-foreground mb-4">Macros</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Protein", value: totalProtein, goal: goals.protein, color: "bg-success" },
            { label: "Carbs", value: totalCarbs, goal: goals.carbs, color: "bg-info" },
            { label: "Fat", value: totalFat, goal: goals.fat, color: "bg-warning" },
            { label: "Fiber", value: totalFiber, goal: goals.fiber, color: "bg-success" },
          ].map((macro) => {
            const percent = Math.min((macro.value / macro.goal) * 100, 100);
            return (
              <div key={macro.label}>
                <div className="flex items-baseline gap-1 mb-1.5">
                  <span className="text-xs text-muted-foreground font-body">{macro.label}</span>
                  <span className="text-sm font-bold text-foreground font-display ml-auto">
                    {Math.round(macro.value)}
                  </span>
                  <span className="text-xs text-muted-foreground font-body">/{macro.goal}g</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${macro.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      <div className="flex gap-3">
        <div className="flex-1 glass-card flex items-center px-4 gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logged foods..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none py-3 font-body"
          />
        </div>
      </div>

      {MEALS.map((meal) => {
        const mealFoods = foods.filter((f) => f.meal === meal.key && (!searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase())));
        const mealCals = mealFoods.reduce((s, f) => s + f.calories, 0);
        return (
          <motion.div key={meal.key} className="glass-card p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <meal.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold font-display text-foreground">{meal.label}</p>
                  <p className="text-xs text-muted-foreground font-body">{meal.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground font-display">{mealCals} kcal</span>
                <button
                  onClick={() => { setSelectedMeal(meal.key); setShowAdd(true); }}
                  className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center hover:bg-primary/25 transition-colors"
                >
                  <Plus className="w-4 h-4 text-primary" />
                </button>
                <button className="w-8 h-8 rounded-xl bg-secondary/80 flex items-center justify-center hover:bg-secondary transition-colors">
                  <Camera className="w-4 h-4 text-primary" />
                </button>
              </div>
            </div>
            {mealFoods.length > 0 ? (
              <div className="space-y-2">
                {mealFoods.map((food) => (
                  <div key={food.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-secondary/50">
                    <div>
                      <p className="text-sm font-medium text-foreground font-body">{food.name}</p>
                      <p className="text-xs text-muted-foreground font-body">
                        {food.quantity}{food.unit} · P: {food.protein}g · C: {food.carbs}g · F: {food.fat}g
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground font-display">{food.calories}</span>
                      <button onClick={() => removeFood(food.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4 font-body">No foods logged</p>
            )}
          </motion.div>
        );
      })}

      {/* Add Food Modal */}
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
                  Add to {MEALS.find((m) => m.key === selectedMeal)?.label}
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
                  Type to search any food worldwide — AI will estimate nutrition
                </p>
              )}

              <button
                onClick={addFood}
                disabled={!foodName.trim() || aiLoading}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold font-display glow-primary disabled:opacity-50"
              >
                Add to {MEALS.find((m) => m.key === selectedMeal)?.label}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FoodLog;
